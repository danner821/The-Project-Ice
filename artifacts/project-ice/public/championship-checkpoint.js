'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const ROOT_ID = 'pi-champion-checkpoint';
  const STYLE_ID = 'pi-champion-checkpoint-styles';
  const dateKey = value => String(value || '').slice(0, 10);
  const addDays = (value, days) => {
    const key = dateKey(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
    const date = new Date(`${key}T12:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  };
  const currentDate = () => dateKey(
    WorldEngine.state?.season?.currentDate ||
    WorldEngine.state?.player?.currentDate ||
    WorldEngine.state?.currentDate
  );
  const idOf = player => String(player?.playerId || player?.id || '');
  const playerName = player => `${player?.firstName || ''} ${player?.lastName || ''}`.trim() || 'Unknown Player';
  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  function postseason() {
    return WorldEngine.getHighSchoolPostseason?.() || WorldEngine.state?.postseason?.highSchool || null;
  }

  function teamById(teamId) {
    return (WorldEngine.state?.teams || []).find(team => String(team?.teamId || '') === String(teamId || '')) || null;
  }

  function teamName(team) {
    return `${team?.schoolName || ''} ${team?.teamName || team?.name || ''}`.trim() || 'Unknown Team';
  }

  function checkpointDate(post) {
    return addDays(post?.completedDate, 1);
  }

  function shouldStop(post = postseason()) {
    if (!post?.championTeamId || !post?.completedDate || post?.championCheckpointAcknowledged === true) return false;
    const stopDate = checkpointDate(post);
    const now = currentDate();
    return Boolean(stopDate && now && now >= stopDate);
  }

  function scoped(player) {
    return WorldEngine.getPlayerStatsByScope?.(player, 'playoffs') || null;
  }

  function championLeaders(post) {
    WorldEngine.rebuildHighSchoolPostseasonStats?.();
    const champion = teamById(post?.championTeamId);
    const roster = Array.isArray(champion?.roster) ? champion.roster : [];
    const skaters = roster
      .filter(player => String(player?.position || '').toUpperCase() !== 'G')
      .map(player => ({ player, stats: scoped(player) }))
      .filter(entry => entry.stats && Number(entry.stats.gamesPlayed || 0) > 0)
      .sort((a, b) =>
        Number(b.stats.points || 0) - Number(a.stats.points || 0) ||
        Number(b.stats.goals || 0) - Number(a.stats.goals || 0) ||
        Number(b.stats.assists || 0) - Number(a.stats.assists || 0) ||
        playerName(a.player).localeCompare(playerName(b.player))
      );
    const goalies = roster
      .filter(player => String(player?.position || '').toUpperCase() === 'G')
      .map(player => ({ player, stats: scoped(player) }))
      .filter(entry => entry.stats && Number(entry.stats.gamesPlayed || 0) > 0)
      .sort((a, b) =>
        Number(b.stats.savePercentage || 0) - Number(a.stats.savePercentage || 0) ||
        Number(b.stats.wins || 0) - Number(a.stats.wins || 0) ||
        Number(a.stats.goalsAgainstAverage || 99) - Number(b.stats.goalsAgainstAverage || 99)
      );
    return { skaters, goalies };
  }

  function chooseMvp(post) {
    if (post?.playoffMvpPlayerId) {
      const saved = WorldEngine.getPlayerById?.(post.playoffMvpPlayerId);
      if (saved) return saved;
    }

    WorldEngine.rebuildHighSchoolPostseasonStats?.();
    const players = WorldEngine.getAllWorldPlayers?.() || [];
    const candidates = players
      .map(player => ({ player, stats: scoped(player) }))
      .filter(entry => entry.stats && Number(entry.stats.gamesPlayed || 0) > 0)
      .map(entry => {
        const goalie = String(entry.player?.position || '').toUpperCase() === 'G';
        const stats = entry.stats;
        const score = goalie
          ? Number(stats.wins || 0) * 5 + Number(stats.savePercentage || 0) * 12 - Number(stats.goalsAgainstAverage || 0)
          : Number(stats.points || 0) * 3 + Number(stats.goals || 0) * 1.5 + Number(stats.gameWinningGoals || 0) * 2 + Number(stats.plusMinus || 0) * 0.15;
        return { ...entry, score };
      })
      .sort((a, b) => b.score - a.score || playerName(a.player).localeCompare(playerName(b.player)));

    const winner = candidates[0]?.player || null;
    if (winner && post) {
      post.playoffMvpPlayerId = idOf(winner);
      post.playoffMvpSelectedAt = currentDate() || new Date().toISOString().slice(0, 10);
      WorldEngine.save?.();
    }
    return winner;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{position:fixed;inset:0;z-index:99999;overflow-y:auto;background:radial-gradient(circle at 50% 12%,rgba(45,111,211,.32),transparent 34%),linear-gradient(180deg,#07182c 0%,#04101f 100%);color:#f5f8ff;padding:calc(env(safe-area-inset-top,0px) + 28px) 22px calc(env(safe-area-inset-bottom,0px) + 34px)}
      .pi-champ-shell{max-width:620px;margin:0 auto}.pi-champ-eyebrow{margin:18px 0 8px;color:#82b7ff;text-align:center;font-size:10px;font-weight:900;letter-spacing:.2em;text-transform:uppercase}.pi-champ-title{text-align:center;margin:0;font-size:36px;line-height:1;letter-spacing:-.045em}.pi-champ-sub{text-align:center;margin:10px 0 24px;color:#8fa4be;font-size:13px}.pi-champ-trophy{width:78px;height:78px;margin:12px auto 18px;display:grid;place-items:center;border-radius:50%;font-size:38px;background:radial-gradient(circle,rgba(89,149,244,.28),rgba(40,81,145,.08));border:1px solid rgba(120,180,255,.22);box-shadow:0 0 50px rgba(69,132,227,.20)}
      .pi-champ-team{padding:20px;border:1px solid rgba(104,166,255,.22);border-radius:22px;background:linear-gradient(180deg,rgba(30,61,103,.78),rgba(12,29,51,.86));text-align:center;box-shadow:0 18px 40px rgba(0,0,0,.22)}.pi-champ-team-label{color:#7592b7;font-size:9px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}.pi-champ-team-name{margin:8px 0 2px;font-size:26px;font-weight:900;letter-spacing:-.03em}.pi-champ-team-meta{color:#89a0ba;font-size:12px}
      .pi-champ-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.pi-champ-card{min-height:112px;padding:15px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(13,32,55,.78)}.pi-champ-card--mvp{grid-column:1/-1;background:linear-gradient(135deg,rgba(49,98,170,.28),rgba(13,32,55,.82));border-color:rgba(111,174,255,.22)}.pi-champ-card-label{color:#7891af;font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.pi-champ-card-name{margin-top:8px;color:#f5f8ff;font-size:17px;font-weight:850;line-height:1.15}.pi-champ-card-stat{margin-top:5px;color:#91a7c2;font-size:11px}.pi-champ-btn{width:100%;margin-top:9px;padding:18px 20px;border:1px solid rgba(105,167,255,.30);border-radius:19px;background:linear-gradient(135deg,#2763c9,#173b86);box-shadow:0 14px 30px rgba(20,78,177,.28);color:white;font:inherit;font-size:16px;font-weight:900;text-align:left}.pi-champ-btn span{float:right;color:#b9d3ff}.pi-champ-note{text-align:center;margin:13px 12px 0;color:#667e99;font-size:10px;line-height:1.4}
    `;
    document.head.appendChild(style);
  }

  function render() {
    const post = postseason();
    if (!shouldStop(post)) {
      document.getElementById(ROOT_ID)?.remove();
      return false;
    }

    injectStyles();
    const champion = teamById(post.championTeamId);
    const leaders = championLeaders(post);
    const pointsLeader = leaders.skaters[0] || null;
    const goalLeader = [...leaders.skaters].sort((a, b) => Number(b.stats.goals || 0) - Number(a.stats.goals || 0) || Number(b.stats.points || 0) - Number(a.stats.points || 0))[0] || null;
    const goalieLeader = leaders.goalies[0] || null;
    const mvp = chooseMvp(post);
    const mvpStats = mvp ? scoped(mvp) : null;
    const mvpGoalie = String(mvp?.position || '').toUpperCase() === 'G';
    const mvpLine = mvpStats
      ? (mvpGoalie
        ? `${Number(mvpStats.wins || 0)} W · ${Number(mvpStats.savePercentage || 0).toFixed(3).replace(/^0/, '')} SV%`
        : `${Number(mvpStats.goals || 0)} G · ${Number(mvpStats.assists || 0)} A · ${Number(mvpStats.points || 0)} PTS`)
      : 'Postseason standout';

    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('section');
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }

    root.innerHTML = `
      <div class="pi-champ-shell">
        <div class="pi-champ-trophy">🏆</div>
        <div class="pi-champ-eyebrow">Project Ice · Season Complete</div>
        <h1 class="pi-champ-title">High School Champions</h1>
        <p class="pi-champ-sub">The postseason is over. A champion has been crowned.</p>
        <div class="pi-champ-team">
          <div class="pi-champ-team-label">2022–23 League Champion</div>
          <div class="pi-champ-team-name">${esc(teamName(champion))}</div>
          <div class="pi-champ-team-meta">Best-of-three championship winner</div>
        </div>
        <div class="pi-champ-grid">
          <div class="pi-champ-card"><div class="pi-champ-card-label">Playoff Points Leader</div><div class="pi-champ-card-name">${esc(pointsLeader ? playerName(pointsLeader.player) : '—')}</div><div class="pi-champ-card-stat">${pointsLeader ? `${Number(pointsLeader.stats.points || 0)} PTS` : 'No stats'}</div></div>
          <div class="pi-champ-card"><div class="pi-champ-card-label">Playoff Goals Leader</div><div class="pi-champ-card-name">${esc(goalLeader ? playerName(goalLeader.player) : '—')}</div><div class="pi-champ-card-stat">${goalLeader ? `${Number(goalLeader.stats.goals || 0)} G` : 'No stats'}</div></div>
          <div class="pi-champ-card"><div class="pi-champ-card-label">Top Goaltender</div><div class="pi-champ-card-name">${esc(goalieLeader ? playerName(goalieLeader.player) : '—')}</div><div class="pi-champ-card-stat">${goalieLeader ? `${Number(goalieLeader.stats.wins || 0)} W · ${Number(goalieLeader.stats.savePercentage || 0).toFixed(3).replace(/^0/, '')} SV%` : 'No stats'}</div></div>
          <div class="pi-champ-card pi-champ-card--mvp"><div class="pi-champ-card-label">Playoff MVP</div><div class="pi-champ-card-name">${esc(mvp ? playerName(mvp) : '—')}</div><div class="pi-champ-card-stat">${esc(mvpLine)}</div></div>
        </div>
        <button type="button" class="pi-champ-btn" id="pi-champion-continue">Continue Into Offseason <span>›</span></button>
        <div class="pi-champ-note">League awards arrive one week into the offseason.</div>
      </div>`;

    root.querySelector('#pi-champion-continue')?.addEventListener('click', () => {
      post.championCheckpointAcknowledged = true;
      post.championCheckpointAcknowledgedAt = currentDate();
      post.offseasonStartedDate = currentDate();
      post.awardsCeremonyDate = addDays(currentDate(), 7);
      if (WorldEngine.state?.season) WorldEngine.state.season.phase = 'offseason-awards-pending';
      WorldEngine.save?.();
      root.remove();
    });

    return true;
  }

  const originalAdvance = WorldEngine.advanceToDate?.bind(WorldEngine);
  if (originalAdvance) {
    WorldEngine.advanceToDate = function(targetDate, ...args) {
      const postBefore = postseason();
      const stopDate = checkpointDate(postBefore);
      let target = targetDate;
      if (postBefore?.championTeamId && stopDate && postBefore?.championCheckpointAcknowledged !== true) {
        const requested = dateKey(targetDate);
        if (requested && requested > stopDate) target = stopDate;
      }
      const result = originalAdvance(target, ...args);
      requestAnimationFrame(render);
      return result;
    };
  }

  document.addEventListener('click', () => {
    if (shouldStop()) requestAnimationFrame(render);
  });

  WorldEngine.renderChampionCheckpoint = render;
  WorldEngine.getPlayoffMvp = () => chooseMvp(postseason());
  requestAnimationFrame(render);
})();