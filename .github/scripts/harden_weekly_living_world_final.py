from pathlib import Path
import re
wp=Path('artifacts/project-ice/public/world.js')
gp=Path('artifacts/project-ice/public/game.js')
w=wp.read_text(errors='ignore')
g=gp.read_text(errors='ignore')

# Repair the known stray brace left by the first Freshman award renderer swap.
stray="""  });
}

}
function simulateToDate(
"""
if stray in g:
    g=g.replace(stray,"""  });
}

function simulateToDate(
""",1)

# Deterministic hidden Living World roll helper. Same player/week/save = same outcome.
potential_anchor="""  function evaluatePlayerPotentialWeek(player = {}, dateString) {
"""
helper=r'''  function getDeterministicLivingWorldRoll(seedText = '') {
    const text = String(seedText || 'project-ice');
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) / 4294967296;
  }

'''
if 'function getDeterministicLivingWorldRoll' not in w:
    if potential_anchor not in w: raise SystemExit('potential evaluator anchor missing')
    w=w.replace(potential_anchor,helper+potential_anchor,1)

# Replace the nondeterministic reevaluation roll only inside the potential evaluator contract.
if 'const reevaluationRoll = Math.random();' in w:
    w=w.replace(
        'const reevaluationRoll = Math.random();',
        """const reevaluationRoll = getDeterministicLivingWorldRoll([
      _state.season?.seasonId || _state.season?.year || 'season',
      weekKey,
      player.id || player.playerId || 'player',
      'potential-reevaluation',
    ].join(':'));""",
        1
    )

# Canonical potential confidence/accuracy remains authoritative after scouting observation.
# Replace any legacy games-observed-only writer inside processScoutingWeek.
start=w.find('function processScoutingWeek')
if start<0: raise SystemExit('processScoutingWeek not found')
end=w.find('\n  function ', start+20)
if end<0: end=len(w)
segment=w[start:end]
patterns=[
    r"profile\.evaluationAccuracy\s*=\s*getScoutingEvaluationAccuracy\(\s*profile\.gamesObserved\s*\)\s*;",
    r"profile\.evaluationAccuracy\s*=\s*getScoutingEvaluationAccuracy\([^;]+\)\s*;",
]
replacement="""profile.evaluationAccuracy =
        player.development?.potentialAccuracy ||
        player.potentialAccuracy ||
        getPotentialAccuracyFromConfidence(
          player.development?.potentialConfidence ??
          player.potentialConfidence ??
          50
        );"""
changed=False
for pattern in patterns:
    newseg,n=re.subn(pattern,replacement,segment,count=1,flags=re.S)
    if n:
        segment=newseg; changed=True; break
if changed:
    w=w[:start]+segment+w[end:]

# Also harden any direct standalone writer in the weekly scouting body that uses observed games variable.
start=w.find('function processScoutingWeek')
end=w.find('\n  function ', start+20) if start>=0 else -1
segment=w[start:end if end>=0 else len(w)] if start>=0 else ''
if 'getScoutingEvaluationAccuracy' in segment:
    # Allow helper to exist elsewhere, but not as an authority inside the canonical weekly processor.
    segment=re.sub(
        r"profile\.evaluationAccuracy\s*=\s*getScoutingEvaluationAccuracy\([^;]*\)\s*;",
        replacement,
        segment,
        flags=re.S
    )
    w=w[:start]+segment+w[end if end>=0 else len(w):]

wp.write_text(w)
gp.write_text(g)

# Produce an explicit validation snapshot for the workflow log.
def function_slice(text,name,limit=24000):
    i=text.find(f'function {name}')
    if i<0: return ''
    return text[i:i+limit]

scouting=function_slice(w,'processScoutingWeek')
potential=function_slice(w,'evaluatePlayerPotentialWeek')
prospects=function_slice(g,'renderLeagueProspectsPreview')
awards=function_slice(g,'renderLeagueAwardsPreview')
checks={
    'deterministic_potential_roll': 'getDeterministicLivingWorldRoll' in potential and 'Math.random()' not in potential,
    'scouting_no_games_observed_accuracy_writer': 'getScoutingEvaluationAccuracy' not in scouting,
    'freshman_award_backend': "'freshman_of_year'" in w and 'Freshman of the Year' in w,
    'freshman_award_ui': 'Freshman of the Year' in awards and 'currentAwardRaces' in awards,
    'prospect_ui_has_canonical_movement': ('previousRank' in prospects) or ('rankChange' in prospects),
    'news_consumer_present': 'function publishLivingWorldNewsForWeek' in w,
    'weekly_guard_present': 'processedWeeks.includes(weekKey)' in function_slice(w,'processLivingWorldWeek'),
}
Path('.github/weekly_living_world_hardening_log.txt').write_text('\n'.join(f"{'PASS' if v else 'FAIL'} | {k}" for k,v in checks.items())+'\n')
if not all(checks.values()):
    raise SystemExit('one or more Weekly Living World hardening checks failed')
print('Weekly Living World hardening checks passed')
