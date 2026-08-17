from pathlib import Path
import re
w=Path('artifacts/project-ice/public/world.js').read_text(errors='ignore')
g=Path('artifacts/project-ice/public/game.js').read_text(errors='ignore')

def extract(text, needle, before=1200, after=9000):
    i=text.find(needle)
    if i<0: return f'NOT FOUND: {needle}\n'
    return text[max(0,i-before):i+after]

sections=[]
for needle in [
    'function processLivingWorldWeek',
    'function processLivingWorldForDate',
    'function processScoutingWeek',
    'evaluationAccuracy =',
    'function evaluatePlayerPotentialWeek',
    'Math.random()',
    'lastPotentialEvaluationWeek',
    'function buildLivingWorldAwardRaces',
    'function processLivingWorldLineupMovement',
    'function publishLivingWorldNewsForWeek',
    'function recordGameLivingWorldBeats',
    'function getCareerPlayerWeeklyStats',
]:
    sections.append('\n### WORLD '+needle+'\n'+extract(w,needle))
for needle in [
    'function renderLeagueAwardsPreview',
    'function renderLeagueNewsPreview',
    'function renderFullNewsScreen',
    'function renderLeagueProspectsPreview',
]:
    sections.append('\n### GAME '+needle+'\n'+extract(g,needle))

checks=[]
def ck(name, cond, detail=''):
    checks.append(f"{'PASS' if cond else 'FAIL'} | {name} | {detail}")

ck('world syntax-relevant freshman award present', "'freshman_of_year'" in w)
ck('League awards reads canonical currentAwardRaces', 'livingWorld.currentAwardRaces' in g)
ck('Living World has weekly processed guard', 'processedWeeks' in extract(w,'function processLivingWorldWeek',0,5000))
ck('Potential same-week guard exists', 'lastPotentialEvaluationWeek === weekKey' in w)
ck('Scouting direct same-week guard exists', 'lastExposureProcessedWeek' in w or 'lastScoutingProcessedWeek' in w or 'scouting-week-already' in w)
ck('Potential uses nondeterministic random roll', 'Math.random()' in extract(w,'function evaluatePlayerPotentialWeek',0,12000), 'FAIL here means deterministic/no random; PASS means still needs review')
# Detect suspect scouting overwrite of evaluationAccuracy based solely on gamesObserved helper.
scouting=extract(w,'function processScoutingWeek',0,18000)
ck('Scouting does not overwrite evaluationAccuracy from games observed', 'getScoutingEvaluationAccuracy' not in scouting or 'profile.evaluationAccuracy = getScoutingEvaluationAccuracy' not in scouting)
ck('Weekly award races included', 'buildLivingWorldAwardRaces' in w)
ck('Weekly lineup movement included', 'processLivingWorldLineupMovement' in w)
ck('Dynamic news included', 'publishLivingWorldNewsForWeek' in w)
ck('Major game beats included', 'recordGameLivingWorldBeats' in w)
ck('Prospect rankings canonical UI hook', 'previousRank' in extract(g,'function renderLeagueProspectsPreview',0,10000))

Path('.github/weekly_living_world_final_audit.txt').write_text('\n'.join(checks)+'\n\n'+ '\n'.join(sections))
