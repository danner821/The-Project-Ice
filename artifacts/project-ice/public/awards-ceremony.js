'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const ROOT_ID = 'pi-awards-ceremony';
  const STYLE_ID = 'pi-awards-ceremony-styles';
  const AWARDS_VERSION = 2;
  const dateKey = value => String(value || '').slice(0, 10);
  const currentDate = () => dateKey(
    WorldEngine.state?.season?.currentDate ||
    WorldEngine.state?.player?.currentDate ||
    WorldEngine.state?.currentDate
  );
  const idOf = player => String(player?.playerId || player?.id || '');
  const nameOf = player => `${player?.firstName || ''} ${player?.lastName || ''}`.trim() || 'Unknown Player';
  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  function post() {
    return WorldEngine.getHighSchoolPostseason?.() || WorldEngine.state?.postseason?.highSchool || null;
  }

  function players() {
    return WorldEngine.getAllWorldPlayers?.() || [];
  }

  function teamFor(player) {
    return (WorldEngine.state?.teams || []).find(item =>
      String(item?.teamId || '') === String(player?.teamId || '') ||
      (item?.roster || []).some(p => idOf(p) === idOf(player))
    ) || null;
  }

  function teamLabel(player) {
    const team = teamFor(player);
    return team?.abbreviation || team?.teamName || '—';
  }

  function regularStats(player) {
    return WorldEngine.getPlayerStatsByScope?.(player, 'regular-season') || null;
  }

  function playoffStats(player) {
    return WorldEngine.getPlayerStatsByScope?.(player, 'playoffs') || null;
  }

  function isGoalie(player) {
    return String(player?.position || '').toUpperCase() === 'G';
  }

  function isDefenseman(player) {
    return ['D', 'LD', 'RD'].includes(String(player?.position || '').toUpperCase());
  }

  function classLabel(player) {
    const direct = String(
      player?.schoolYear ||
      player?.classLevel ||
      player?.gradeName ||
      player?.year ||
      ''
    ).trim();
    if (direct) return direct;
    const grade = Number(player?.grade);
    return ({ 9: 'Freshman', 10: 'Sophomore', 11: 'Junior', 12: 'Senior' })[grade] || 'High School';
  }

  function isFreshman(player) {
    const level = classLabel(player).toLowerCase();
    const grade = Number(player?.grade);
    return player?.isFreshman === true || level.includes('freshman') || grade === 9;
  }

  function ranked(entries, score) {
    return entries
      .filter(({ stats }) => stats && Number(stats.gamesPlayed || 0) > 0)
      .map(entry => ({ ...entry, score: Number(score(entry.player, entry.stats)) || 0 }))
      .sort((a, b) => b.score - a.score || nameOf(a.player).localeCompare(nameOf(b.player)));
  }

  function choose(entries, score) {
    return ranked(entries, score)[0] || null;
  }

  function seededRandom(seedText) {
    let hash = 2166136261;
    for (const char of String(seedText || '')) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    hash += hash << 13;
    hash ^= hash >>> 7;
    hash += hash << 3;
    hash ^= hash >>> 17;
    hash += hash << 5;
    return (hash >>> 0) / 4294967296;
  }

  function chooseSubjective(entries, score, awardKey, postseason) {
    const candidates = ranked(entries, score).slice(0, 3);
    if (candidates.length <= 1) return candidates[0] || null;

    const leader = candidates[0];
    const second = candidates[1];
    const scale = Math.max(Math.abs(leader.score), 1);
    const secondGap = Math.max(0, (leader.score - second.score) / scale);

    /* A clear runaway season should still win the award. */
    if (secondGap >= 0.18) return leader;

    const baseWeights = [1, 0.46, 0.24];
    const weighted = candidates.map((candidate, index) => {
      if (index === 0) return { candidate, weight: 1 };
      const gap = Math.max(0, (leader.score - candidate.score) / scale);
      const closeness = Math.max(0, 1 - (gap / 0.18));
      return { candidate, weight: baseWeights[index] * closeness };
    }).filter(item => item.weight > 0);

    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    if (total <= 0) return leader;

    const seasonSeed =
      postseason?.regularSeasonEndDate ||
      WorldEngine.state?.season?.seasonId ||
      WorldEngine.state?.season?.label ||
      'season';
    let roll = seededRandom(`${seasonSeed}:${awardKey}`) * total;

    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) return item.candidate;
    }
    return leader;
  }

  function statSnapshot(stats) {
    if (!stats) return {};
    return {
      gamesPlayed: Number(stats.gamesPlayed || 0),
      goals: Number(stats.goals || 0),
      assists: Number(stats.assists || 0),
      points: Number(stats.points || 0),
      plusMinus: Number(stats.plusMinus || 0),
      wins: Number(stats.wins || 0),
      losses: Number(stats.losses || 0),
      savePercentage: Number(stats.savePercentage || 0),
      goalsAgainstAverage: Number(stats.goalsAgainstAverage || 0),
      shutouts: Number(stats.shutouts || 0),
    };
  }

  function winnerRecord(key, title, entry, scope = 'regular-season') {
    const player = entry?.player || null;
    const stats = entry?.stats || (player
      ? (scope === 'playoffs' ? playoffStats(player) : regularStats(player))
      : null);
    return {
      awardId: key,
      title,
      playerId: idOf(player),
      playerName: player ? nameOf(player) : '—',
      team: player ? teamLabel(player) : '—',
      age: Number(player?.age || 0) || null,
      classLabel: player ? classLabel(player) : '—',
      position: String(player?.position || '—').toUpperCase(),
      scope,
      stats: statSnapshot(stats),
    };
  }

  function buildAwards(postseason) {
    if (
      Number(postseason?.leagueAwards?.version) === AWARDS_VERSION &&
      Array.isArray(postseason?.leagueAwards?.winners) &&
      postseason.leagueAwards.winners.length
    ) {
      return postseason.leagueAwards.winners;
    }

    const all = players().map(player => ({ player, stats: regularStats(player) }));
    const skaters = all.filter(entry => !isGoalie(entry.player));
    const defensemen = all.filter(entry => isDefenseman(entry.player));
    const goalies = all.filter(entry => isGoalie(entry.player));
    const freshmen = all.filter(entry => isFreshman(entry.player));

    /* Objective leaders stay deterministic. */
    const goalScorer = choose(skaters, (_p, s) => Number(s.goals || 0) * 100 + Number(s.points || 0));
    const playmaker = choose(skaters, (_p, s) => Number(s.assists || 0) * 100 + Number(s.points || 0));

    /* Subjective awards use a weighted top-three pool when the race is close. */
    const defenseman = chooseSubjective(
      defensemen,
      (p, s) => Number(s.points || 0) * 3 + Number(s.plusMinus || 0) * 1.25 + Number(p?.overall || 0) * 0.22,
      'best-defenseman',
      postseason
    );
    const goalie = chooseSubjective(
      goalies,
      (p, s) => Number(s.wins || 0) * 8 + Number(s.savePercentage || 0) * 100 + Number(s.shutouts || 0) * 12 + Math.max(0, 5 - Number(s.goalsAgainstAverage || 5)) * 4 + Number(p?.overall || 0) * 0.08,
      'goalie-of-year',
      postseason
    );
    const freshman = chooseSubjective(
      freshmen,
      (p, s) => Number(s.points || 0) * 4 + Number(s.goals || 0) * 1.5 + Number(s.plusMinus || 0) * 0.3 + Number(p?.overall || 0) * 0.08,
      'freshman-of-year',
      postseason
    );
    const mvp = chooseSubjective(
      skaters,
      (p, s) => Number(s.points || 0) * 5 + Number(s.goals || 0) * 2 + Number(s.plusMinus || 0) * 0.35 + Number(p?.overall || 0) * 0.08,
      'league-mvp',
      postseason
    );

    const playoffMvp = postseason?.playoffMvpPlayerId
      ? WorldEngine.getPlayerById?.(postseason.playoffMvpPlayerId)
      : WorldEngine.getPlayoffMvp?.();

    const winners = [
      winnerRecord('goal-scoring', 'Goal Scoring Leader', goalScorer),
      winnerRecord('playmaker', 'Playmaker Award', playmaker),
      winnerRecord('defenseman', 'Best Defenseman', defenseman),
      winnerRecord('goalie', 'Goaltender of the Year', goalie),
      ...(freshman ? [winnerRecord('freshman', 'Freshman of the Year', freshman)] : []),
      winnerRecord('playoff-mvp', 'Playoff MVP', playoffMvp ? { player: playoffMvp, stats: playoffStats(playoffMvp) } : null, 'playoffs'),
      winnerRecord('mvp', 'League MVP', mvp),
    ];

    postseason.awardsRevealIndex = 0;
    postseason.leagueAwards = {
      version: AWARDS_VERSION,
      selectedAt: currentDate(),
      source: 'frozen-scoped-stats-with-close-race-variance',
      winners,
    };

    const history = WorldEngine.state.history = WorldEngine.state.history || {};
    if (!Array.isArray(history.leagueAwards)) history.leagueAwards = [];
    const key = `${postseason.regularSeasonEndDate || 'season'}:league-awards`;
    const record = { key, date: currentDate(), version: AWARDS_VERSION, winners: structuredClone(winners) };
    const existingIndex = history.leagueAwards.findIndex(item => item?.key === key);
    if (existingIndex >= 0) history.leagueAwards[existingIndex] = record;
    else history.leagueAwards.push(record);

    WorldEngine.save?.();
    return winners;
  }

  function due(postseason = post()) {
    if (!postseason?.championCheckpointAcknowledged || postseason?.awardsCeremonyAcknowledged === true) return false;
    const ceremonyDate = dateKey(postseason?.awardsCeremonyDate);
    const now = currentDate();
    return Boolean(ceremonyDate && now && now >= ceremonyDate);
  }

  function formatSavePct(value) {
    const n = Number(value || 0);
    if (!n) return '.000';
    return n.toFixed(3).replace(/^0/, '');
  }

  function statTiles(award) {
    const s = award?.stats || {};
    const goalie = String(award?.position || '').toUpperCase() === 'G';
    const items = goalie
      ? [
          ['GP', s.gamesPlayed || 0],
          ['W', s.wins || 0],
          ['SV%', formatSavePct(s.savePercentage)],
          ['GAA', Number(s.goalsAgainstAverage || 0).toFixed(2)],
          ['SO', s.shutouts || 0],
        ]
      : [
          ['GP', s.gamesPlayed || 0],
          ['G', s.goals || 0],
          ['A', s.assists || 0],
          ['PTS', s.points || 0],
          ['+/-', Number(s.plusMinus || 0) > 0 ? `+${s.plusMinus}` : s.plusMinus || 0],
        ];
    return items.map(([label, value]) => `<div class="pi-aw-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{position:fixed;inset:0;z-index:100000;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 30px) 22px calc(env(safe-area-inset-bottom,0px) + 34px);background:radial-gradient(circle at 50% 8%,rgba(72,127,218,.28),transparent 31%),linear-gradient(180deg,#07172a,#04101e);color:#f6f9ff}
      .pi-aw-shell{max-width:620px;margin:0 auto}.pi-aw-kicker{text-align:center;color:#82b7ff;font-size:10px;font-weight:900;letter-spacing:.19em;text-transform:uppercase}.pi-aw-title{margin:8px 0 8px;text-align:center;font-size:34px;letter-spacing:-.04em}.pi-aw-sub{margin:0 auto 24px;max-width:470px;text-align:center;color:#879db8;font-size:13px;line-height:1.45}
      .pi-aw-card{padding:24px 18px;border:1px solid rgba(107,170,255,.22);border-radius:24px;background:linear-gradient(180deg,rgba(29,57,96,.76),rgba(10,26,46,.9));box-shadow:0 20px 45px rgba(0,0,0,.24);text-align:center}.pi-aw-count{color:#718aa8;font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.pi-aw-name{margin:12px 0 8px;font-size:25px;font-weight:900;letter-spacing:-.03em}.pi-aw-reveal{min-height:180px;display:grid;place-items:center;margin:18px 0;padding:18px;border-radius:18px;border:1px solid rgba(255,255,255,.07);background:rgba(6,18,32,.48)}.pi-aw-winner{font-size:25px;font-weight:900;letter-spacing:-.025em}.pi-aw-team{margin-top:5px;color:#9ab4d4;font-size:12px;font-weight:800}.pi-aw-bio{margin-top:7px;color:#7088a7;font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.pi-aw-hidden{color:#637b99;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      .pi-aw-stat-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin-top:16px}.pi-aw-stat{padding:10px 5px;border:1px solid rgba(112,166,238,.14);border-radius:11px;background:rgba(14,36,62,.72)}.pi-aw-stat span{display:block;color:#66809e;font-size:8px;font-weight:900;letter-spacing:.08em}.pi-aw-stat strong{display:block;margin-top:4px;font-size:15px}.pi-aw-scope{margin-top:12px;color:#66809e;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      .pi-aw-btn{width:100%;padding:17px 18px;border:1px solid rgba(110,174,255,.30);border-radius:17px;background:linear-gradient(135deg,#2b67ce,#183d88);color:#fff;font:inherit;font-size:15px;font-weight:900}.pi-aw-btn:disabled{opacity:.65}.pi-aw-progress{display:flex;gap:6px;justify-content:center;margin:17px 0 0}.pi-aw-dot{width:6px;height:6px;border-radius:99px;background:#29405e}.pi-aw-dot.is-done{background:#69a6ff}
      .pi-aw-list{display:grid;gap:9px;margin-top:18px}.pi-aw-list-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px 15px;border:1px solid rgba(255,255,255,.07);border-radius:15px;background:rgba(12,29,50,.72)}.pi-aw-list-row strong{display:block;font-size:13px}.pi-aw-list-row span{color:#7f96b3;font-size:10px}.pi-aw-list-winner{text-align:right!important;color:#eaf2ff!important;font-size:12px!important;font-weight:850}.pi-aw-final{margin-top:18px}
      @media(max-width:390px){.pi-aw-stat-grid{gap:5px}.pi-aw-stat{padding:9px 3px}.pi-aw-stat strong{font-size:13px}}
    `;
    document.head.appendChild(style);
  }

  function renderFinal(root, postseason, winners) {
    root.innerHTML = `<div class="pi-aw-shell"><div class="pi-aw-kicker">Project Ice · League Honors</div><h1 class="pi-aw-title">2022–23 League Awards</h1><p class="pi-aw-sub">The season's award winners are now part of league history.</p><div class="pi-aw-list">${winners.map(item => `<div class="pi-aw-list-row"><div><strong>${esc(item.title)}</strong><span>${esc(item.scope === 'playoffs' ? 'Postseason award' : 'Regular-season award')}</span></div><span class="pi-aw-list-winner">${esc(item.playerName)} · ${esc(item.team)}</span></div>`).join('')}</div><button type="button" class="pi-aw-btn pi-aw-final" id="pi-awards-finish">Continue Into Offseason</button></div>`;
    root.querySelector('#pi-awards-finish')?.addEventListener('click', () => {
      postseason.awardsCeremonyAcknowledged = true;
      postseason.awardsCeremonyAcknowledgedAt = currentDate();
      if (WorldEngine.state?.season) WorldEngine.state.season.phase = 'offseason';
      WorldEngine.save?.();
      root.remove();
    });
  }

  function render() {
    const postseason = post();
    if (!due(postseason)) {
      document.getElementById(ROOT_ID)?.remove();
      return false;
    }

    injectStyles();
    const winners = buildAwards(postseason);
    let index = Number(postseason.awardsRevealIndex || 0);
    let revealed = false;
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('section');
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }

    const paint = () => {
      if (index >= winners.length) {
        renderFinal(root, postseason, winners);
        return;
      }
      const award = winners[index];
      const bio = [
        award.team,
        award.age ? `Age ${award.age}` : '',
        award.classLabel,
        award.position,
      ].filter(Boolean).join(' · ');
      const winnerMarkup = revealed
        ? `<div style="width:100%"><div class="pi-aw-winner">${esc(award.playerName)}</div><div class="pi-aw-team">${esc(award.team)}</div><div class="pi-aw-bio">${esc(bio)}</div><div class="pi-aw-stat-grid">${statTiles(award)}</div><div class="pi-aw-scope">${esc(award.scope === 'playoffs' ? 'Postseason statistics' : 'Regular-season statistics')}</div></div>`
        : '<div class="pi-aw-hidden">Winner sealed</div>';
      root.innerHTML = `<div class="pi-aw-shell"><div class="pi-aw-kicker">Project Ice · Award Ceremony</div><h1 class="pi-aw-title">League Awards</h1><p class="pi-aw-sub">One award at a time. League MVP will be revealed last.</p><div class="pi-aw-card"><div class="pi-aw-count">Award ${index + 1} of ${winners.length}</div><div class="pi-aw-name">${esc(award.title)}</div><div class="pi-aw-reveal" id="pi-award-reveal">${winnerMarkup}</div><button type="button" class="pi-aw-btn" id="pi-award-action">${revealed ? (index === winners.length - 1 ? 'View All League Awards' : 'Next Award') : 'Reveal Winner'}</button><div class="pi-aw-progress">${winners.map((_item, dot) => `<span class="pi-aw-dot${dot < index || (dot === index && revealed) ? ' is-done' : ''}"></span>`).join('')}</div></div></div>`;
      const button = root.querySelector('#pi-award-action');
      button?.addEventListener('click', () => {
        if (!revealed) {
          button.disabled = true;
          button.textContent = 'And the winner is…';
          window.setTimeout(() => {
            revealed = true;
            paint();
          }, 850);
          return;
        }
        index += 1;
        revealed = false;
        postseason.awardsRevealIndex = index;
        WorldEngine.save?.();
        paint();
      });
    };

    paint();
    return true;
  }

  const originalAdvance = WorldEngine.advanceToDate?.bind(WorldEngine);
  if (originalAdvance) {
    WorldEngine.advanceToDate = function(targetDate, ...args) {
      const postseason = post();
      const ceremonyDate = dateKey(postseason?.awardsCeremonyDate);
      let target = targetDate;
      if (postseason?.championCheckpointAcknowledged && postseason?.awardsCeremonyAcknowledged !== true && ceremonyDate) {
        const requested = dateKey(targetDate);
        if (requested && requested > ceremonyDate) target = ceremonyDate;
      }
      const result = originalAdvance(target, ...args);
      requestAnimationFrame(render);
      return result;
    };
  }

  document.addEventListener('click', () => {
    if (due()) requestAnimationFrame(render);
  });

  WorldEngine.renderAwardsCeremony = render;
  WorldEngine.getLeagueAwardWinners = () => buildAwards(post());
  requestAnimationFrame(render);
})();
