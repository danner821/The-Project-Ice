from pathlib import Path

path = Path('artifacts/project-ice/public/world.js')
text = path.read_text()

old_usage = """        home: {\n          forwardLines: { 1: 0, 2: 0, 3: 0, 4: 0 },\n          defensePairs: { 1: 0, 2: 0, 3: 0 },\n        },\n        away: {\n          forwardLines: { 1: 0, 2: 0, 3: 0, 4: 0 },\n          defensePairs: { 1: 0, 2: 0, 3: 0 },\n        },\n"""
new_usage = """        home: {\n          forwardLines: { 1: 0, 2: 0, 3: 0, 4: 0 },\n          defensePairs: { 1: 0, 2: 0, 3: 0 },\n          evenStrengthSeconds: 0,\n        },\n        away: {\n          forwardLines: { 1: 0, 2: 0, 3: 0, 4: 0 },\n          defensePairs: { 1: 0, 2: 0, 3: 0 },\n          evenStrengthSeconds: 0,\n        },\n"""
if old_usage not in text:
    raise SystemExit('deploymentUsage initialization not found')
text = text.replace(old_usage, new_usage, 1)

old_elapsed = """      const elapsedGameSeconds =\n        getElapsedRegulationSeconds();\n"""
new_elapsed = """      const elapsedEvenStrengthSeconds =\n        Math.max(\n          0,\n          Number(\n            simulation.flow\n              ?.deploymentUsage\n              ?.[side]\n              ?.evenStrengthSeconds\n          ) || 0\n        );\n"""
if old_elapsed not in text:
    raise SystemExit('elapsedGameSeconds block not found')
text = text.replace(old_elapsed, new_elapsed, 1)

old_target = """        const targetTOI =\n          Math.max(\n            45,\n            elapsedGameSeconds\n          ) * targetShare;\n"""
new_target = """        const targetTOI =\n          Math.max(\n            45,\n            elapsedEvenStrengthSeconds\n          ) * targetShare;\n"""
if old_target not in text:
    raise SystemExit('targetTOI block not found')
text = text.replace(old_target, new_target, 1)

anchor = """    const manpowerBeforeClock =\n      `${homeSkaterCount}v${awaySkaterCount}`;\n\n    advanceLiveGameSpecialTeamsClock(\n"""
insert = """    const manpowerBeforeClock =\n      `${homeSkaterCount}v${awaySkaterCount}`;\n\n    /*\n     * Track actual 5-on-5 regulation seconds separately from total game\n     * clock. Even-strength line targets must not grow during PP/PK time,\n     * otherwise a player who already received special-teams minutes is\n     * incorrectly sent back out at 5-on-5 to 'catch up'.\n     */\n    if (\n      elapsedSeconds > 0 &&\n      Number(simulation.period) <= 3 &&\n      homeSkaterCount === 5 &&\n      awaySkaterCount === 5\n    ) {\n      if (!simulation.flow.deploymentUsage) {\n        simulation.flow.deploymentUsage = {\n          home: {\n            forwardLines: { 1: 0, 2: 0, 3: 0, 4: 0 },\n            defensePairs: { 1: 0, 2: 0, 3: 0 },\n            evenStrengthSeconds: 0,\n          },\n          away: {\n            forwardLines: { 1: 0, 2: 0, 3: 0, 4: 0 },\n            defensePairs: { 1: 0, 2: 0, 3: 0 },\n            evenStrengthSeconds: 0,\n          },\n        };\n      }\n\n      ['home', 'away'].forEach(sideKey => {\n        const sideUsage =\n          simulation.flow.deploymentUsage[sideKey];\n\n        sideUsage.evenStrengthSeconds =\n          (Number(sideUsage.evenStrengthSeconds) || 0) +\n          elapsedSeconds;\n      });\n    }\n\n    advanceLiveGameSpecialTeamsClock(\n"""
if anchor not in text:
    raise SystemExit('manpower clock anchor not found')
text = text.replace(anchor, insert, 1)

path.write_text(text)
print('Even-strength TOI targeting patched')
