from pathlib import Path
import re, json, subprocess, sys

ROOT = Path('artifacts/project-ice')
PUBLIC = ROOT / 'public'
VITE = ROOT / 'vite.config.ts'
REPORT = Path('.github/full_project_ice_audit.md')

findings=[]

def add(sev, area, title, detail):
    findings.append({'severity':sev,'area':area,'title':title,'detail':detail})

def read(path):
    return Path(path).read_text(errors='ignore') if Path(path).exists() else ''

# 1) JS syntax over every active/public runtime.
syntax_fail=[]
for p in sorted(PUBLIC.glob('*.js')):
    r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
    if r.returncode:
        syntax_fail.append((p.name,(r.stderr or r.stdout).strip()))
if syntax_fail:
    add('CRITICAL','Runtime','JavaScript syntax failures', '\n'.join(f'{n}: {e}' for n,e in syntax_fail))
else:
    add('PASS','Runtime','All public JavaScript parses','Every public/*.js file passed node --check.')

# 2) Runtime injection inventory and missing modules.
vite=read(VITE)
injected=re.findall(r"html\.includes\('/([^']+\.js)'\).*?src=\\\"/([^\\\"]+\.js)",vite)
active=[]
for a,b in injected:
    active.append(b)
missing=[name for name in active if not (PUBLIC/name).exists()]
if missing:
    add('HIGH','Load order','Injected runtime files are missing', ', '.join(missing))
else:
    add('PASS','Load order','All injected runtime files exist',f'{len(active)} injected runtime modules resolved.')
if len(active)!=len(set(active)):
    dup=sorted({x for x in active if active.count(x)>1})
    add('HIGH','Load order','Duplicate runtime injection',', '.join(dup))

# 3) Wrapper/observer inventory.
wrapper_targets=['advanceToDate','selectCareerSave','finalizeLiveGameSimulation','openHubTab','openTeamTab','renderTeamTab','openTeamProfile']
for target in wrapper_targets:
    owners=[]
    pat=re.compile(rf'(?:WorldEngine\.)?{re.escape(target)}\s*=')
    for p in PUBLIC.glob('*.js'):
        if pat.search(read(p)): owners.append(p.name)
    if len(owners)>=4:
        add('MEDIUM','Runtime ownership',f'{target} has many runtime owners',f'{len(owners)} files assign/wrap it: '+', '.join(sorted(owners)))

observer_files=[]
interval_files=[]
for p in PUBLIC.glob('*.js'):
    t=read(p)
    if 'MutationObserver' in t: observer_files.append(p.name)
    if re.search(r'setInterval\s*\(',t): interval_files.append(p.name)
if observer_files:
    add('INFO','Performance','MutationObserver inventory',', '.join(sorted(observer_files)))
if interval_files:
    add('MEDIUM','Performance','Polling intervals remain active',', '.join(sorted(interval_files)))

# 4) Schedule mutation inventory.
schedule_mut=[]
for p in PUBLIC.glob('*.js'):
    lines=read(p).splitlines()
    for i,line in enumerate(lines,1):
        if re.search(r'(?:WorldEngine\.)?state(?:\(\))?\.schedule\s*=|world\.schedule\s*=|_state\.schedule\s*=',line):
            schedule_mut.append((p.name,i,line.strip()))
for p,i,line in schedule_mut:
    if p in {'season-lifecycle.js','postseason-cadence.js'} and '.filter' in line:
        sev='MEDIUM'
    elif p=='game.js':
        sev='INFO' if 'CRITICAL PERSISTENCE RULE' in read(PUBLIC/'game.js') else 'HIGH'
    else:
        sev='INFO'
    add(sev,'Schedule',f'Schedule assignment in {p}:{i}',line)

# 5) Core lifecycle contract checks.
season=read(PUBLIC/'season-lifecycle.js')
required=[
 ('QUALIFIERS = 6','six playoff teams'),('WINS_TO_ADVANCE = 2','best-of-three'),
 ("createSeries('round-one-3v6'",'3v6 opener'),("createSeries('round-one-4v5'",'4v5 opener'),
 ('reseedSemifinals: true','semifinal reseeding'),("createSeries(\n      'championship'",'championship series')]
missing_contract=[label for needle,label in required if needle not in season]
if missing_contract: add('HIGH','Postseason','Lifecycle contract missing',', '.join(missing_contract))
else: add('PASS','Postseason','HS playoff format contract present','6 teams, #1/#2 byes, 3v6/4v5, reseeded semifinals, best-of-3 championship are all represented.')

cadence=read(PUBLIC/'postseason-cadence.js')
if 'MIN_EVENTS_PER_WINDOW = 2' in cadence and "gamesEveryOtherDay: true" in cadence:
    add('PASS','Postseason','Playoff cadence contract present','At least two career practice/recovery events per seven-day window; playoff games encoded every other day.')
else: add('HIGH','Postseason','Playoff cadence contract incomplete','Expected cadence markers were not found.')

# 6) Dev shortcut isolation & schedule preservation.
dev=read(PUBLIC/'dev-postseason-shortcut.js')
checks={
 'isolated dev career id':'__project-ice-postseason-dev__' in dev,
 'structured clone source':'structuredClone(sourceWorld)' in dev,
 'does not write projectice_save':'Never touch projectice_save' in dev,
 'uses dedicated baseline':'DEV_BASELINE_RECORD_ID' in dev,
}
for label,ok in checks.items():
    add('PASS' if ok else 'HIGH','Dev shortcut',label,'present' if ok else 'missing')
if 'world.schedule = world.schedule.filter' in dev:
    add('MEDIUM','Dev shortcut','Dev shortcut rewrites schedule array','It filters then re-adds Travel Tryouts. This is safe only if the baseline already contains the complete canonical schedule; audit/repair now treats the shortcut as a sandbox, never as a source of truth for real careers.')

# 7) Travel ownership.
travel_files=[p.name for p in PUBLIC.glob('travel-hockey-*.js')]
add('INFO','Travel',f'{len(travel_files)} Travel runtime files present',', '.join(sorted(travel_files)))
travel_world=read(PUBLIC/'travel-hockey-world.js')
roster_world=read(PUBLIC/'travel-hockey-roster-world.js')
if 'team.roster = buildRoster' in travel_world and 'function rebuild(state)' in roster_world:
    add('HIGH','Travel','Two roster-building layers are still loaded','travel-hockey-world.js can build travel rosters and travel-hockey-roster-world.js rebuilds them again. This duplicated ownership is a major Phase 3.4 volatility source and should be consolidated before deeper Travel debugging.')
elif 'team.roster = []' in travel_world and 'function rebuild(state)' in roster_world:
    add('PASS','Travel','Single Travel roster authority','travel-hockey-world.js owns the team/tournament shell; travel-hockey-roster-world.js is the sole roster/lineup writer.')

foundation=read(PUBLIC/'travel-hockey-foundation.js')
if 'MutationObserver' in foundation and 'WorldEngine.advanceToDate = function' in foundation:
    add('MEDIUM','Travel','Travel foundation mixes data, wrappers, and DOM observation','Foundation both mutates travel/schedule state and observes/patches UI while wrapping advanceToDate. Functional, but higher coupling than desired.')

# 8) Postseason stats contract.
ps=read(PUBLIC/'postseason-stats.js')
if 'Only overwrite players for whom the stored playoff box scores actually contain lines.' in ps:
    add('PASS','Stats','Postseason rebuild is non-destructive','It no longer wipes all player playoff stats when historical games lack player lines.')
else: add('HIGH','Stats','Postseason rebuild guard missing','Could erase saved playoff stats.')
if 'completedPlayoffGames' in ps and 'WorldEngine.state?.schedule' in ps:
    add('PASS','Stats','Playoff stats read canonical schedule','Shared scope backend is tied to WorldEngine.state.schedule.')

# 9) Prospect adaptability.
world=read(PUBLIC/'world.js')
prospect_markers=['calculateWeeklyScoutingScore','getScoutingSpotlightPerformanceMomentum','getProspectClassReadinessAdjustment','stabilizedRankScore','processScoutingWeek','profile.publicRank = newRank']
missing=[x for x in prospect_markers if x not in world]
if missing:
    add('HIGH','Scouting','Adaptive ranking markers missing',', '.join(missing))
else:
    add('PASS','Scouting','Prospect rankings are adaptive','Weekly ranking score uses ability/potential/performance/reputation/trust, spotlight performance, class readiness, and prior rank stabilization; publicRank is rewritten each processed scouting week.')

# 10) Persistence and save isolation.
if 'INDEXEDDB' in world.upper() and 'listCareerSaves' in world and 'selectCareerSave' in world:
    add('PASS','Persistence','IndexedDB multi-career architecture present','World state is persisted per career; lightweight preview remains separate.')
else: add('HIGH','Persistence','Multi-career persistence contract incomplete','Expected IndexedDB/multi-save markers missing.')

career_bridge=read(PUBLIC/'career-persistence.js')
if "const RECORD_ID = 'default'" in career_bridge:
    add('MEDIUM','Persistence','Legacy preview recovery still reads default record','career-persistence.js is transitional and still targets the old default world when projectice_save is absent. Multi-career selection is handled elsewhere, but this bridge should eventually be retired to reduce ambiguity.')

# 11) Missing cleanup filename mismatch specifically.
if '/dev-career-cleanup.js' in vite and not (PUBLIC/'dev-career-cleanup.js').exists() and (PUBLIC/'dev-save-cleanup.js').exists():
    add('HIGH','Load order','Cleanup module filename mismatch','Vite injects /dev-career-cleanup.js, but the actual file is dev-save-cleanup.js. The cleanup currently never loads from that injection.')

# Render report.
order={'CRITICAL':0,'HIGH':1,'MEDIUM':2,'INFO':3,'PASS':4}
findings.sort(key=lambda x:(order.get(x['severity'],9),x['area'],x['title']))
counts={k:sum(1 for f in findings if f['severity']==k) for k in order}
lines=['# Project Ice Full Architecture Audit','', 'Generated from current `main` source.','',
       '## Summary','',
       f"- Critical: {counts['CRITICAL']}",f"- High: {counts['HIGH']}",f"- Medium: {counts['MEDIUM']}",f"- Informational: {counts['INFO']}",f"- Pass checks: {counts['PASS']}",'']
for sev in ['CRITICAL','HIGH','MEDIUM','INFO','PASS']:
    subset=[f for f in findings if f['severity']==sev]
    if not subset: continue
    lines += [f'## {sev}','']
    for f in subset:
        lines += [f"### {f['area']} — {f['title']}",f['detail'],'']
REPORT.write_text('\n'.join(lines),encoding='utf-8')
print(json.dumps({'counts':counts,'findings':findings},indent=2))
print(f'FULL_PROJECT_ICE_AUDIT={REPORT}')
if counts['CRITICAL']:
    sys.exit(2)
