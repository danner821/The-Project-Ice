from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text(errors='ignore')

# Canonical profile resolution: preserve UI design, replace stale snapshots with saved world player.
old="""function openPlayerProfile(player, origin = 'team-profile') {
  if (!player) return;

  _activePlayerProfile = player;
  _playerProfileOrigin = origin;

  renderPlayerProfile();
  showScreen('player-profile');
}
"""
new="""function openPlayerProfile(player, origin = 'team-profile') {
  if (!player) return;

  const playerId = player?.id || player?.playerId || null;
  const canonicalPlayer =
    playerId && typeof WorldEngine?.getPlayerById === 'function'
      ? WorldEngine.getPlayerById(playerId)
      : null;

  _activePlayerProfile = canonicalPlayer || player;
  _playerProfileOrigin = origin;

  renderPlayerProfile();
  showScreen('player-profile');
}
"""
if old not in s: raise SystemExit('openPlayerProfile anchor missing')
s=s.replace(old,new,1)

# Replace only the canonical ranking source block, leaving the renderer intact.
old="""  const canonicalRankedProspects = teams
    .flatMap(team => {
      const roster = Array.isArray(team?.roster) ? team.roster : [];
      return roster.map(player => ({
        player,
        team,
        rank: Math.max(0, Number(player?.scoutingProfile?.publicRank) || 0),
      }));
    })
    .filter(entry => entry.rank > 0)
    .sort((a, b) => a.rank - b.rank);
"""
new="""  const canonicalRankedProspects =
    (Array.isArray(WorldEngine.state.prospectRankings)
      ? WorldEngine.state.prospectRankings
      : [])
      .map(ranking => {
        const player =
          typeof WorldEngine?.getPlayerById === 'function'
            ? WorldEngine.getPlayerById(ranking?.playerId)
            : null;
        const resolvedPlayer = player || ranking;
        const team = teams.find(team =>
          String(team?.teamId || '') === String(ranking?.teamId || resolvedPlayer?.teamId || '')
        ) || null;

        return {
          player: resolvedPlayer,
          team,
          ranking,
          rank: Math.max(0, Number(ranking?.rank) || 0),
        };
      })
      .filter(entry => entry.rank > 0 && entry.player)
      .sort((a, b) => a.rank - b.rank);
"""
if old not in s: raise SystemExit('canonical ranking source anchor missing')
s=s.replace(old,new,1)

# Preserve canonical ranking context when mapping rows and support external team names.
old="""    const canonicalRows = canonicalRankedProspects.map(({ player, team, rank }) => {
"""
new="""    const canonicalRows = canonicalRankedProspects.map(({ player, team, ranking, rank }) => {
"""
if old not in s: raise SystemExit('canonical row map anchor missing')
s=s.replace(old,new,1)

old="""      const teamAbbreviation =
        team?.abbreviation ||
        `${team?.schoolName || ''} ${team?.teamName || ''}`
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map(word => word[0])
          .join('')
          .toUpperCase() ||
        '—';
"""
new="""      const externalTeamName =
        ranking?.currentTeam ||
        ranking?.teamName ||
        player?.currentTeam ||
        player?.realTeamSnapshot ||
        '';
      const teamAbbreviation =
        team?.abbreviation ||
        player?.teamAbbreviation ||
        String(externalTeamName)
          .trim()
          .split(/\\s+/)
          .filter(Boolean)
          .map(word => word[0])
          .join('')
          .toUpperCase() ||
        '—';
"""
if old not in s: raise SystemExit('team abbreviation anchor missing')
s=s.replace(old,new,1)

old="""      return {
        ...player,
        currentRank: rank,
"""
new="""      return {
        ...ranking,
        ...player,
        currentRank: rank,
"""
if old not in s: raise SystemExit('canonical row object anchor missing')
s=s.replace(old,new,1)

old="""        schoolName: team?.schoolName || '',
        teamName: team?.teamName || '',
        teamAbbreviation,
        league: player?.league || player?.teamLevel || 'HS',
"""
new="""        schoolName: team?.schoolName || '',
        teamName:
          team?.teamName ||
          ranking?.teamName ||
          ranking?.currentTeam ||
          player?.currentTeam ||
          player?.realTeamSnapshot ||
          '',
        teamAbbreviation,
        league:
          ranking?.league ||
          player?.league ||
          player?.realLeagueSnapshot ||
          player?.teamLevel ||
          'HS',
"""
if old not in s: raise SystemExit('canonical row context anchor missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('PROSPECT_UI_CANONICAL=OK')
