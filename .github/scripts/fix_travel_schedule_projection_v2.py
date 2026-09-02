from pathlib import Path

GAME = Path('artifacts/project-ice/public/game.js')
text = GAME.read_text()

old_filter = '''  const gameEvents = leagueGames
    .filter(game =>
      game.homeTeamId === playerTeamId ||
      game.awayTeamId === playerTeamId
    )
    .map(game => {
      const isHome =
        game.homeTeamId === playerTeamId;

      const opponentId = isHome
        ? game.awayTeamId
        : game.homeTeamId;

      const opponent = teams.find(
        team => team.teamId === opponentId
      );

      const opponentName =
        opponent?.teamName || 'Opponent';
'''

new_filter = '''  const gameEvents = leagueGames
    .filter(game => {
      if (game?.travelTournament === true || game?.type === 'travel-game') {
        const travelCareerTeamId = String(game?.careerTeamId || '');
        return Boolean(travelCareerTeamId) && (
          String(game?.homeTeamId || '') === travelCareerTeamId ||
          String(game?.awayTeamId || '') === travelCareerTeamId
        );
      }
      return (
        game.homeTeamId === playerTeamId ||
        game.awayTeamId === playerTeamId
      );
    })
    .map(game => {
      const isTravelGame =
        game?.travelTournament === true ||
        game?.type === 'travel-game';

      const gamePlayerTeamId =
        isTravelGame
          ? String(game?.careerTeamId || '')
          : String(playerTeamId || '');

      const isHome =
        String(game.homeTeamId || '') === gamePlayerTeamId;

      const opponentId = isHome
        ? game.awayTeamId
        : game.homeTeamId;

      const opponent = teams.find(
        team => String(team.teamId || '') === String(opponentId || '')
      );

      const opponentName =
        game?.opponentName ||
        opponent?.teamName ||
        opponent?.schoolName ||
        'Opponent';
'''

if old_filter not in text:
    raise SystemExit('Could not locate canonical gameEvents player-team filter block')
text = text.replace(old_filter, new_filter, 1)

# The calendar builder previously treated every mapped game as High School.
# Preserve existing HS presentation, but let Travel-projected events carry their own context.
old_details = '''        details: {
          League: 'High School',
          Opponent: opponentName,
          Venue: venueName,
          Date: gameDateLabel,
          location: venueName,
          'Game Type': 'Regular Season',
        },'''
new_details = '''        details: {
          League: isTravelGame ? 'Travel Hockey' : 'High School',
          Opponent: opponentName,
          Venue: isTravelGame ? (game.location || 'Summer Travel Tournament') : venueName,
          Date: gameDateLabel,
          location: isTravelGame ? (game.location || 'Summer Travel Tournament') : venueName,
          'Game Type': isTravelGame
            ? `${String(game.travelRound || 'Tournament').replace(/(^|[-_\\s])([a-z])/g, (_,a,b)=>`${a}${b.toUpperCase()}`)} · Game ${Number(game.travelGameNumber || 1)}`
            : 'Regular Season',
        },'''
if old_details not in text:
    raise SystemExit('Could not locate canonical game details block')
text = text.replace(old_details, new_details, 1)

GAME.write_text(text)
print('Fixed canonical calendar filtering so Travel career-team games reach Home/Schedule.')
