from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text(errors='ignore')
if 'function renderLeagueProspectsPreview()' in s:
    print('renderer already present')
    raise SystemExit(0)
anchor='function renderLeagueAwardsPreview() {'
if anchor not in s:
    raise SystemExit('League awards anchor missing')
fn=r'''function renderLeagueProspectsPreview() {
  const container = document.getElementById('league-prospects-preview');
  if (!container) return;

  const rankings = Array.isArray(Game.currentProspectRankings)
    ? Game.currentProspectRankings
    : [];

  const topTen = rankings.slice(0, 10);
  if (!topTen.length) {
    container.innerHTML = `
      <div class="league-prospects-preview__empty">
        Rankings unavailable
      </div>
    `;
    return;
  }

  const getCurrentRank = player =>
    Number(player.currentRank ?? player.rank) || null;

  const getPreviousRank = player => {
    const direct = Number(player.previousRank);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const current = getCurrentRank(player);
    const movement = Number(player.rankChange);
    if (current && Number.isFinite(movement)) return current + movement;
    return null;
  };

  const getTrendMarkup = player => {
    const currentRank = getCurrentRank(player);
    const previousRank = getPreviousRank(player);
    if (!currentRank || !previousRank) {
      return '<span class="league-prospect-row__trend league-prospect-row__trend--new">NEW</span>';
    }
    const difference = previousRank - currentRank;
    if (difference > 0) {
      return `<span class="league-prospect-row__trend league-prospect-row__trend--up">▲${difference}</span>`;
    }
    if (difference < 0) {
      return `<span class="league-prospect-row__trend league-prospect-row__trend--down">▼${Math.abs(difference)}</span>`;
    }
    return '<span class="league-prospect-row__trend league-prospect-row__trend--even">—</span>';
  };

  container.innerHTML = `
    <div class="league-prospects-preview__list">
      ${topTen.map(player => {
        const fullName = `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Unknown Prospect';
        const playerId = player.id || player.playerId || '';
        const currentRank = getCurrentRank(player) || '—';
        const position = player.position || '—';
        const draftYear = player.draftYear || '—';
        const teamDisplay = player.teamAbbreviation || player.teamShortName || player.teamName || '—';
        const leagueDisplay = player.league || 'HS';
        const reputationStars = Math.max(0, Math.min(5, Number(player.reputationStars) || 0));
        const stars = '★'.repeat(reputationStars) + '☆'.repeat(5 - reputationStars);
        const positionClass = typeof posBadgeClass === 'function' ? posBadgeClass(position) : '';

        return `
          <button
            class="league-prospect-row ${player.isUser ? 'career-player-highlight' : ''}"
            type="button"
            data-player-id="${playerId}"
          >
            <span class="league-prospect-row__rank">${currentRank}</span>
            <span class="league-prospect-row__content">
              <span class="league-prospect-row__top-line">
                <span class="league-prospect-row__identity">
                  <strong class="league-prospect-row__name">${fullName}</strong>
                  <span class="league-prospect-row__stars">${stars}</span>
                </span>
                ${getTrendMarkup(player)}
              </span>
              <span class="league-prospect-row__details">
                <span class="league-prospect-row__position pr-pos-badge ${positionClass}">${position}</span>
                <span class="league-prospect-row__detail">${teamDisplay}</span>
                <span class="league-prospect-row__detail">${leagueDisplay}</span>
                <span class="league-prospect-row__detail">${draftYear}</span>
              </span>
            </span>
          </button>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('.league-prospect-row[data-player-id]').forEach(button => {
    button.addEventListener('click', () => {
      const playerId = String(button.dataset.playerId || '');
      const selectedProspect = rankings.find(player =>
        String(player.id || player.playerId || '') === playerId
      );
      if (!selectedProspect) return;
      openPlayerProfile(selectedProspect, 'league-prospects');
    });
  });
}

'''
s=s.replace(anchor,fn+anchor,1)
p.write_text(s)
print('restored canonical League prospect preview renderer')
