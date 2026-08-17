from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text()
anchor="""  const teams = WorldEngine.state.teams || [];
  const playerTeamId = Game.player.teamId || '';

  // Determine which generated roster slot is occupied by the career player.
"""
insert="""  const teams = WorldEngine.state.teams || [];
  const playerTeamId = Game.player.teamId || '';

  /*
   * CANONICAL SCOUTING RANKINGS FIRST.
   *
   * The Weekly Living World owns publicRank / previousRank / scouting
   * certainty for every saved world player. Once those rankings exist, the
   * Prospects screen must render them directly instead of recalculating an
   * alternate ranking from OVR + hidden potential + reputation.
   *
   * The legacy generator below remains only as a pre-ranking fallback for old
   * saves / brand-new careers before the first scouting week has published.
   */
  const canonicalRankedProspects = teams
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

  if (canonicalRankedProspects.length > 0) {
    const canonicalRows = canonicalRankedProspects.map(({ player, team, rank }) => {
      const previousRank = Math.max(
        0,
        Number(player?.scoutingProfile?.previousRank) || 0
      );
      const rankChange = previousRank > 0 ? previousRank - rank : 0;
      const teamAbbreviation =
        team?.abbreviation ||
        `${team?.schoolName || ''} ${team?.teamName || ''}`
          .trim()
          .split(/\\s+/)
          .filter(Boolean)
          .map(word => word[0])
          .join('')
          .toUpperCase() ||
        '—';

      const playerId = player?.id || player?.playerId || '';
      const careerId = Game.player?.id || Game.player?.playerId || 'career-player';
      const isUser = Boolean(
        player?.isCareerPlayer ||
        (playerId && String(playerId) === String(careerId))
      );

      return {
        ...player,
        currentRank: rank,
        rankChange,
        sourceType: 'world',
        isUser,
        schoolName: team?.schoolName || '',
        teamName: team?.teamName || '',
        teamAbbreviation,
        league: player?.league || player?.teamLevel || 'HS',
      };
    });

    Game.currentProspectRankings = canonicalRows;
    Game.visibleProspects = canonicalRows.slice(0, 100);

    const careerCanonicalRow = canonicalRows.find(player => player.isUser);
    Game.player.prospectRank = careerCanonicalRow?.currentRank || null;

    container.innerHTML = Game.visibleProspects
      .map(player => {
        const rank = Number(player.currentRank) || 0;
        const fullName =
          `${player.firstName || ''} ${player.lastName || ''}`.trim() ||
          'Unknown Prospect';
        const badgeCls = posBadgeClass(player.position);
        const teamDisplay = player.teamAbbreviation || '—';
        const leagueDisplay = player.league || 'HS';
        const draftYear = Number(player.draftYear) || '—';
        const rankChange = Number(player.rankChange) || 0;
        const trend =
          rankChange > 0
            ? '🔼'
            : rankChange < 0
              ? '🔽'
              : '➖';
        const reputationStars = Math.max(
          1,
          Math.min(5, Number(player.reputationStars) || 1)
        );
        const stars =
          '★'.repeat(reputationStars) +
          '☆'.repeat(5 - reputationStars);

        return `
          <div
            class=\"pr-row pr-row--data${player.isUser ? ' pr-row--user' : ''}\"
            role=\"listitem\"
            data-rank=\"${rank}\"
            data-player-id=\"${player.id || player.playerId || ''}\"
            data-player-source=\"world\"
          >
            <span class=\"pr-col pr-col--rank\">${rank}</span>
            <span class=\"pr-col pr-col--name\">
              <span class=\"pr-player-name\">${fullName}</span>
              <span class=\"pr-player-reputation\">${stars}</span>
            </span>
            <span class=\"pr-col pr-col--pos\">
              <span class=\"pr-pos-badge ${badgeCls}\">${player.position || '—'}</span>
            </span>
            <span class=\"pr-col pr-col--team\">${teamDisplay}</span>
            <span class=\"pr-col pr-col--league\">${leagueDisplay}</span>
            <span class=\"pr-col pr-col--draft\">${draftYear}</span>
            <span class=\"pr-col pr-col--trend\">${trend}</span>
          </div>
        `;
      })
      .join('');

    prospectsReady = true;
    return;
  }

  // Determine which generated roster slot is occupied by the career player.
"""
if anchor not in s:
    raise SystemExit('renderProspectsScreen teams anchor missing')
s=s.replace(anchor,insert,1)
p.write_text(s)
print('wired Prospects screen to canonical weekly scouting rankings with legacy fallback')
