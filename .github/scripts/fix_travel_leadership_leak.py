from pathlib import Path

path=Path('artifacts/project-ice/public/travel-hockey-roster-world.js')
text=path.read_text(encoding='utf-8')

if 'const VERSION=8;' not in text:
    text=text.replace('const VERSION=7;','const VERSION=8;',1)

anchor="""  const blankStats=()=>({gp:0,g:0,a:0,pts:0,pim:0,sog:0,wins:0,savePercentage:0});
  function normalize(p,extra={}){return{...p,playerId:pid(p)||`prospect:${hash(pname(p))}`,sourcePlayerId:p?.sourcePlayerId||pid(p)||null,name:pname(p),position:naturalPos(p),overall:ovr(p),ovr:ovr(p),travelStats:p?.travelStats||blankStats(),...extra};}
"""
replacement="""  const blankStats=()=>({gp:0,g:0,a:0,pts:0,pim:0,sog:0,wins:0,savePercentage:0});

  /*
   * Leadership is team-context data, not player identity data.
   * HS roster copies can carry C/A metadata, which must never leak into a
   * temporary Travel roster. Strip every known leadership marker while
   * preserving the player's actual attributes, stats and identity.
   */
  function stripInheritedLeadership(player){
    const p={...player};
    [
      'captain','isCaptain','alternate','isAlternate','alternateCaptain',
      'isAlternateCaptain','captaincy','captainRole','leadershipRole',
      'captainLetter','leadershipLetter','letter','teamCaptain','teamAlternate'
    ].forEach(key=>{ if(key in p) delete p[key]; });
    return p;
  }

  function normalize(p,extra={}){
    const clean=stripInheritedLeadership(p||{});
    return{...clean,playerId:pid(clean)||`prospect:${hash(pname(clean))}`,sourcePlayerId:clean?.sourcePlayerId||pid(clean)||null,name:pname(clean),position:naturalPos(clean),overall:ovr(clean),ovr:ovr(clean),travelStats:clean?.travelStats||blankStats(),...extra};
  }
"""
if anchor not in text:
    raise SystemExit('normalize anchor not found')
text=text.replace(anchor,replacement,1)

# Clear any team-level leadership pointers when Travel metadata is refreshed.
meta_anchor="""function meta(team){const m=CLUB_META[clubId(team)]||{};Object.assign(team,{coachName:m.coachName||'Travel Hockey Staff',coachStyle:m.coachStyle||'Balanced development',coach:{name:m.coachName||'Travel Hockey Staff',style:m.coachStyle||'Balanced development'},arenaName:m.arenaName||`${team.city||'Regional'} Ice Center`,arenaCapacity:m.arenaCapacity||800,arena:{name:m.arenaName||`${team.city||'Regional'} Ice Center`,capacity:m.arenaCapacity||800},prestige:m.prestige||3,identity:m.identity||'Competitive summer travel hockey',primaryColor:m.primaryColor||'#2f6fd6',secondaryColor:m.secondaryColor||'#8fc1ff',teamStrengthDelta:m.strength||0});return team;}"""
meta_replacement="""function meta(team){const m=CLUB_META[clubId(team)]||{};Object.assign(team,{coachName:m.coachName||'Travel Hockey Staff',coachStyle:m.coachStyle||'Balanced development',coach:{name:m.coachName||'Travel Hockey Staff',style:m.coachStyle||'Balanced development'},arenaName:m.arenaName||`${team.city||'Regional'} Ice Center`,arenaCapacity:m.arenaCapacity||800,arena:{name:m.arenaName||`${team.city||'Regional'} Ice Center`,capacity:m.arenaCapacity||800},prestige:m.prestige||3,identity:m.identity||'Competitive summer travel hockey',primaryColor:m.primaryColor||'#2f6fd6',secondaryColor:m.secondaryColor||'#8fc1ff',teamStrengthDelta:m.strength||0,captainId:null,alternateCaptainIds:[],captains:[],leadership:{}});return team;}"""
if meta_anchor not in text:
    raise SystemExit('meta anchor not found')
text=text.replace(meta_anchor,meta_replacement,1)

# Existing version-matched Travel saves still run lineup(), so make lineup itself
# sanitize leadership every time rather than relying only on a version rebuild.
lineup_anchor="""  function lineup(team){
    for(const p of team.roster||[]){delete p.rosterSlot;delete p.slot;}
"""
lineup_replacement="""  function lineup(team){
    team.roster=(team.roster||[]).map(stripInheritedLeadership);
    team.captainId=null;
    team.alternateCaptainIds=[];
    team.captains=[];
    team.leadership={};
    for(const p of team.roster||[]){delete p.rosterSlot;delete p.slot;}
"""
if lineup_anchor not in text:
    raise SystemExit('lineup anchor not found')
text=text.replace(lineup_anchor,lineup_replacement,1)

path.write_text(text,encoding='utf-8')
print('TRAVEL_LEADERSHIP_ISOLATION=OK')
