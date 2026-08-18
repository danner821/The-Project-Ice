from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text(errors='ignore')

needle="""function renderLeagueAwardsPreview() {
  const container =
    document.getElementById('league-awards-preview');

  if (!container) return;
"""

insert=r'''function renderLeagueAwardsPreview() {
  const container =
    document.getElementById('league-awards-preview');

  if (!container) return;

  /*
   * Canonical weekly award races are owned by WorldEngine Living World.
   * Keep the legacy calculation below only as a migration/pre-first-week
   * fallback so the UI never becomes a second source of award truth.
   */
  const canonicalAwardRaces =
    Array.isArray(WorldEngine.state?.livingWorld?.currentAwardRaces)
      ? WorldEngine.state.livingWorld.currentAwardRaces
      : [];

  if (canonicalAwardRaces.length > 0) {
    const teams = Array.isArray(WorldEngine.state?.teams)
      ? WorldEngine.state.teams
      : [];
    const careerId = String(
      Game.player?.playerId ||
      Game.player?.id ||
      'career-player'
    );

    const getCanonicalPlayer = playerId =>
      typeof WorldEngine?.getPlayerById === 'function'
        ? WorldEngine.getPlayerById(playerId)
        : null;

    const getCanonicalTeamLabel = contender => {
      const team = teams.find(candidate =>
        String(candidate?.teamId || candidate?.id || '') ===
        String(contender?.teamId || '')
      );

      return (
        team?.abbreviation ||
        team?.shortName ||
        `${team?.schoolName || ''} ${team?.teamName || ''}`.trim() ||
        '—'
      );
    };

    const getCanonicalTrendMarkup = contender => {
      const previousRank = Number(contender?.previousRank);
      const currentRank = Number(contender?.rank);

      if (!Number.isFinite(previousRank) || !Number.isFinite(currentRank)) {
        return `
          <span class="league-award-contender__trend league-award-contender__trend--new">
            NEW
          </span>
        `;
      }

      const difference = previousRank - currentRank;
      if (difference > 0) {
        return `
          <span class="league-award-contender__trend league-award-contender__trend--up">
            ▲${difference}
          </span>
        `;
      }

      if (difference < 0) {
        return `
          <span class="league-award-contender__trend league-award-contender__trend--down">
            ▼${Math.abs(difference)}
          </span>
        `;
      }

      return `
        <span class="league-award-contender__trend league-award-contender__trend--even">
          —
        </span>
      `;
    };

    const displayRaces = canonicalAwardRaces.map(race => ({
      awardId: race?.key || '',
      title: race?.label || 'League Award',
      contenders: (Array.isArray(race?.contenders) ? race.contenders : [])
        .slice(0, 3)
        .map(contender => ({
          ...contender,
          awardCurrentRank: Number(contender?.rank) || null,
          awardPreviousRank: Number(contender?.previousRank) || null,
        })),
    }));

    Game.currentLeagueAwardRaces = displayRaces;

    const hasAnyContenders = displayRaces.some(race => race.contenders.length > 0);
    if (!hasAnyContenders) {
      container.innerHTML = `
        <div class="league-awards-empty">
          No award races yet
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="league-awards-list">
        ${displayRaces.map(award => `
          <section class="league-award-card" data-award-id="${award.awardId}">
            <header class="league-award-card__header">
              <h4>${award.title}</h4>
            </header>

            <div class="league-award-card__contenders">
              ${award.contenders.length > 0
                ? award.contenders.map(contender => {
                    const playerId = contender?.playerId || '';
                    const canonicalPlayer = getCanonicalPlayer(playerId);
                    const fullName =
                      `${canonicalPlayer?.firstName || contender?.firstName || ''} ${
                        canonicalPlayer?.lastName || contender?.lastName || ''
                      }`.trim() || 'Unknown Player';
                    const isCareerPlayer =
                      Boolean(canonicalPlayer?.isCareerPlayer) ||
                      String(playerId) === careerId;

                    return `
                      <button
                        class="league-award-contender ${isCareerPlayer ? 'career-player-highlight' : ''}"
                        type="button"
                        data-player-id="${playerId}"
                      >
                        <span class="league-award-contender__rank">
                          ${contender.awardCurrentRank || '—'}
                        </span>

                        <span class="league-award-contender__identity">
                          <strong>${fullName}</strong>
                          <span>${getCanonicalTeamLabel(contender)}</span>
                        </span>

                        ${getCanonicalTrendMarkup(contender)}
                      </button>
                    `;
                  }).join('')
                : `
                  <div class="league-award-card__empty">
                    No eligible players yet
                  </div>
                `
              }
            </div>
          </section>
        `).join('')}
      </div>
    `;

    container
      .querySelectorAll('.league-award-contender[data-player-id]')
      .forEach(button => {
        button.addEventListener('click', () => {
          const selectedPlayer = getCanonicalPlayer(button.dataset.playerId);
          if (!selectedPlayer) return;
          openPlayerProfile(selectedPlayer, 'league');
        });
      });

    return;
  }
'''

if needle not in s:
    raise SystemExit('renderLeagueAwardsPreview opening anchor missing')
if s.count(needle) != 1:
    raise SystemExit(f'expected exactly one awards renderer anchor, found {s.count(needle)}')

s=s.replace(needle,insert,1)
p.write_text(s,encoding='utf-8')
print('CANONICAL_AWARDS_UI=OK')
