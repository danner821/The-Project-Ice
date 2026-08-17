from pathlib import Path
w=Path('artifacts/project-ice/public/world.js').read_text(errors='ignore')
g=Path('artifacts/project-ice/public/game.js').read_text(errors='ignore')
h=Path('artifacts/project-ice/index.html').read_text(errors='ignore')

def slice_fn(text,name,span=30000):
    i=text.find(f'function {name}')
    return '' if i<0 else text[i:i+span]

checks=[]
def add(name,ok): checks.append((name,bool(ok)))

weekly=slice_fn(w,'processLivingWorldWeek',12000)
potential=slice_fn(w,'evaluatePlayerPotentialWeek',18000)
scouting=slice_fn(w,'processScoutingWeek',24000)
award_ui=slice_fn(g,'renderLeagueAwardsPreview',24000)
prospect_ui=slice_fn(g,'renderLeagueProspectsPreview',24000)
news_ui=slice_fn(g,'renderLeagueNewsPreview',12000)

add('one weekly processor declaration', w.count('function processLivingWorldWeek') == 1)
add('weekly idempotence guard', 'processedWeeks.includes(weekKey)' in weekly)
order=['processPotentialWeek','processScoutingWeek','processLivingWorldLineupMovement','buildLivingWorldAwardRaces','buildLivingWorldWeeklySnapshot','publishLivingWorldNewsForWeek']
pos=[weekly.find(x) for x in order]
add('weekly processor canonical order', all(x>=0 for x in pos) and pos==sorted(pos))
add('deterministic potential reevaluation', 'getDeterministicLivingWorldRoll' in potential and 'Math.random()' not in potential)
add('potential same-week guard', 'lastPotentialEvaluationWeek === weekKey' in potential)
add('scouting same-week guard', ('lastExposureProcessedWeek' in scouting) or ('scouting-week-already' in scouting) or ('lastScoutingProcessedWeek' in scouting))
add('scouting does not overwrite certainty from games observed', 'getScoutingEvaluationAccuracy' not in scouting)
add('weekly scouting rankings exist', 'prospectRankings' in scouting and 'publicRank' in scouting)
add('Freshman of the Year backend', "'freshman_of_year'" in w and 'Freshman of the Year' in w and 'isFreshmanAwardEligible' in w)
add('Freshman mixed-position scoring', 'calculateFreshmanOfYearScore' in w and "position === 'G'" in slice_fn(w,'calculateFreshmanOfYearScore',6000))
add('award races canonical UI', 'currentAwardRaces' in award_ui)
add('Freshman award UI support', "race.key === 'freshman_of_year'" in award_ui)
add('League prospect preview declaration', g.count('function renderLeagueProspectsPreview') == 1)
add('League prospect canonical movement', 'previousRank' in prospect_ui and ('rankChange' in prospect_ui or 'difference' in prospect_ui))
add('lineup weekly snapshots', 'function processLivingWorldLineupMovement' in w and 'career_lineup_change' in w)
add('major game beats', 'function recordGameLivingWorldBeats' in w and 'major_player_performance' in w and 'featured_game_result' in w)
add('dynamic news translator', 'function publishLivingWorldNewsForWeek' in w and 'award_leader_change' in w and 'season_stat_milestone' in w)
add('League news renderer', bool(news_ui) and 'NewsSystem.getRecent' in news_ui)
add('full news renderer', 'function renderFullNewsScreen' in g or 'function renderFullNews' in g)
add('Home View All news control', h.count('news-view-all-button') >= 2)
add('League View All news control', 'btn-league-view-all-news' in h)

report='\n'.join(f"{'PASS' if ok else 'FAIL'} | {name}" for name,ok in checks)+'\n'
Path('.github/weekly_living_world_completion_report.txt').write_text(report)
failed=[name for name,ok in checks if not ok]
print(report)
if failed:
    raise SystemExit('FAILED: '+', '.join(failed))
