from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text()

old = """  const teams =\n    WorldEngine.state.teams || [];\n  WorldEngine.syncSeedTeamMetadata();\n\n  const gameEvents = leagueGames"""
new = """  const teams =\n    WorldEngine.state.teams || [];\n  const travelTeams =\n    WorldEngine.getTravelHockeyState?.()?.teams ||\n    WorldEngine.state?.travelHockey?.teams ||\n    [];\n  WorldEngine.syncSeedTeamMetadata();\n\n  const gameEvents = leagueGames"""
if old not in text:
    raise SystemExit('Missing teams anchor')
text = text.replace(old, new, 1)

old = """      const opponent = teams.find(\n        team => String(team.teamId || '') === String(opponentId || '')\n      );\n\n      const opponentName =\n        game?.opponentName ||\n        opponent?.teamName ||\n        opponent?.schoolName ||\n        'Opponent';"""
new = """      const gameTeams =\n        isTravelGame ? travelTeams : teams;\n\n      const opponent = gameTeams.find(\n        team => String(team.teamId || '') === String(opponentId || '')\n      );\n\n      const opponentName =\n        game?.opponentName ||\n        opponent?.name ||\n        opponent?.teamName ||\n        opponent?.schoolName ||\n        'Opponent';"""
if old not in text:
    raise SystemExit('Missing opponent resolution block')
text = text.replace(old, new, 1)

old = """      const homeTeam = teams.find(\n        team => team.teamId === game.homeTeamId\n      );\n\n      const venueName =\n        homeTeam?.arena?.name || 'Arena';"""
new = """      const homeTeam = gameTeams.find(\n        team => String(team.teamId || '') === String(game.homeTeamId || '')\n      );\n\n      const venueName =\n        isTravelGame\n          ? (game.location || 'Summer Travel Tournament')\n          : (homeTeam?.arena?.name || 'Arena');"""
if old not in text:
    raise SystemExit('Missing home team block')
text = text.replace(old, new, 1)

old = """        const didPlayerWin =\n          String(game.winnerTeamId) ===\n          String(playerTeamId);\n\n        const didPlayerLose =\n          isCompleted &&\n          String(game.loserTeamId) ===\n          String(playerTeamId);"""
new = """        const didPlayerWin =\n          String(game.winnerTeamId || '') ===\n          String(gamePlayerTeamId || '');\n\n        const didPlayerLose =\n          isCompleted &&\n          Boolean(game.winnerTeamId) &&\n          String(game.winnerTeamId || '') !==\n          String(gamePlayerTeamId || '');"""
if old not in text:
    raise SystemExit('Missing result identity block')
text = text.replace(old, new, 1)

old = """          date: game.date,\n        type: 'game',\n        location: isHome ? 'home' : 'away',"""
new = """          date: game.date,\n        type: isTravelGame ? 'travel-game' : 'game',\n        travelTournament: isTravelGame,\n        travelRound: isTravelGame ? (game.travelRound || null) : null,\n        travelSeriesId: isTravelGame ? (game.travelSeriesId || null) : null,\n        travelGameNumber: isTravelGame ? Number(game.travelGameNumber || 1) : null,\n        careerTeamId: isTravelGame ? gamePlayerTeamId : null,\n        location: isHome ? 'home' : 'away',"""
if old not in text:
    raise SystemExit('Missing mapped event type block')
text = text.replace(old, new, 1)

old = """        description: isHome\n          ? `A regular-season home game against the ${opponentName}.`\n          : `A regular-season road game against the ${opponentName}.`,"""
new = """        description: isTravelGame\n          ? `${String(game.travelRound || 'Tournament').replace(/(^|[-_\\s])([a-z])/g, (_,a,b)=>`${a}${b.toUpperCase()}`)} · Best-of-3 · Game ${Number(game.travelGameNumber || 1)} against ${opponentName}.`\n          : (isHome\n              ? `A regular-season home game against the ${opponentName}.`\n              : `A regular-season road game against the ${opponentName}.`),"""
if old not in text:
    raise SystemExit('Missing description block')
text = text.replace(old, new, 1)

path.write_text(text)
print('Fixed Travel calendar identity, opponent resolution, and event typing.')
