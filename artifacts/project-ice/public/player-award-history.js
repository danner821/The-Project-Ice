'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__playerAwardHistoryInstalled === true) return;
  WorldEngine.__playerAwardHistoryInstalled = true;

  const VERSION = 5;
  const STYLE_ID = 'pi-player-awards-styles';

  const idOf = player => String(player?.playerId || player?.id || '');
  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function installAwardStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #pp-awards-list.pi-player-awards,
      #player-profile-awards-list.pi-player-awards{
        display:grid;
        gap:10px;
        margin-top:16px;
      }

      .pi-player-award-card{
        position:relative;
        display:grid;
        grid-template-columns:44px minmax(0,1fr);
        gap:12px;
        align-items:center;
        padding:14px 15px;
        border:1px solid rgba(83,145,232,.24);
        border-radius:15px;
        background:
          linear-gradient(145deg,rgba(13,42,78,.82),rgba(6,22,45,.90));
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.035),
          0 8px 24px rgba(0,0,0,.08);
        overflow:hidden;
      }

      .pi-player-award-card::before{
        content:'';
        position:absolute;
        inset:0 auto 0 0;
        width:3px;
        background:linear-gradient(180deg,#5aa8ff,#2e6dd8);
        opacity:.9;
      }

      .pi-player-award-card--championship{
        border-color:rgba(225,177,73,.30);
        background:
          linear-gradient(145deg,rgba(49,40,24,.38),rgba(8,27,52,.92) 58%);
      }

      .pi-player-award-card--championship::before{
        background:linear-gradient(180deg,#f0ca68,#b98025);
      }

      .pi-player-award-card__icon{
        width:42px;
        height:42px;
        border-radius:13px;
        display:grid;
        place-items:center;
        font-size:23px;
        line-height:1;
        background:rgba(43,104,189,.14);
        border:1px solid rgba(91,155,241,.22);
      }

      .pi-player-award-card--championship .pi-player-award-card__icon{
        background:rgba(207,155,43,.11);
        border-color:rgba(225,177,73,.25);
      }

      .pi-player-award-card__copy{
        min-width:0;
      }

      .pi-player-award-card__eyebrow{
        display:flex;
        align-items:center;
        gap:7px;
        margin-bottom:4px;
        color:#75a9ea;
        font-size:9px;
        font-weight:900;
        letter-spacing:.14em;
        text-transform:uppercase;
      }

      .pi-player-award-card--championship .pi-player-award-card__eyebrow{
        color:#d8b35e;
      }

      .pi-player-award-card__title{
        display:block;
        color:#f3f7ff;
        font-size:16px;
        font-weight:800;
        line-height:1.22;
        letter-spacing:-.01em;
      }

      .pi-player-award-card__meta{
        display:block;
        margin-top:4px;
        color:#8ea8ca;
        font-size:12px;
        line-height:1.35;
      }

      .pi-player-awards-empty{
        display:flex;
        align-items:center;
        gap:16px;
        padding:18px;
        border:1px solid rgba(83,145,232,.22);
        border-radius:16px;
        background:rgba(5,22,45,.62);
      }

      .pi-player-awards-empty__icon{
        font-size:28px;
        flex:0 0 auto;
      }

      .pi-player-awards-empty__title{
        display:block;
        color:#f3f7ff;
        font-size:16px;
        font-weight:800;
      }

      .pi-player-awards-empty__text{
        margin:4px 0 0;
        color:#8399b8;
        font-size:12px;
        line-height:1.45;
      }
    `;
    document.head.appendChild(style);
  }

  function graduatedPlayers() {
    const rows = WorldEngine.state?.highSchoolRosterLifecycle?.graduatedPlayers || [];
    return Array.isArray(rows) ? rows : [];
  }

  function allKnownPlayers() {
    const rows = [];
    const seen = new Set();
    const add = player => {
      if (!player || typeof player !== 'object') return;
      const key = idOf(player) || player;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(player);
    };

    for (const player of WorldEngine.getAllWorldPlayers?.() || []) add(player);
    for (const team of WorldEngine.state?.teams || []) {
      for (const player of team?.roster || []) add(player);
    }
    for (const player of graduatedPlayers()) add(player);
    add(WorldEngine.state?.player);
    return rows;
  }

  function playerById(playerId) {
    if (!playerId) return null;
    return WorldEngine.getPlayerById?.(playerId) ||
      allKnownPlayers().find(player => idOf(player) === String(playerId)) ||
      null;
  }

  function seasonLabelFromRecord(record, award) {
    const explicit =
      award?.seasonLabel ||
      award?.season ||
      record?.seasonLabel ||
      record?.season ||
      record?.identity?.label ||
      null;
    if (explicit) return String(explicit);

    const date = dateKey(record?.date) || dateKey(record?.archivedAt) || dateKey(String(record?.key || '').split(':')[0]);
    if (!date) return String(WorldEngine.state?.season?.label || 'High School');
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    const startYear = month >= 9 ? year : year - 1;
    return `${startYear}-${String(startYear + 1).slice(-2)}`;
  }

  function canonicalSeasonDate(record, value) {
    const raw = dateKey(value);
    const endYear = Number(record?.identity?.endYear);
    if (!raw || !Number.isFinite(endYear)) return raw;
    const year = Number(raw.slice(0, 4));
    if (year === endYear) return raw;
    return `${endYear}${raw.slice(4)}`;
  }

  function normalizedAward(record, award) {
    const seasonLabel = seasonLabelFromRecord(record, award);
    const title = String(award?.title || award?.name || award?.awardName || 'League Award');
    const awardId = String(award?.awardId || award?.id || title || 'award');
    return {
      key: `${seasonLabel}:${awardId}`,
      awardId,
      title,
      name: title,
      awardName: title,
      season: seasonLabel,
      seasonLabel,
      year: seasonLabel,
      level: award?.level || 'High School',
      scope: award?.scope || 'regular-season',
      team: award?.team || null,
      teamId: award?.teamId || null,
      playerId: String(award?.playerId || ''),
      date: record?.date || record?.archivedAt || null,
    };
  }

  function upsertPlayerAward(player, award) {
    if (!player || !award?.key) return false;
    player.history = player.history && typeof player.history === 'object' ? player.history : {};
    player.history.awards = Array.isArray(player.history.awards) ? player.history.awards : [];

    const index = player.history.awards.findIndex(item =>
      String(item?.key || `${item?.seasonLabel || item?.season || ''}:${item?.awardId || item?.title || item?.name || ''}`) === award.key
    );

    if (index >= 0) {
      const before = JSON.stringify(player.history.awards[index]);
      player.history.awards[index] = { ...player.history.awards[index], ...award };
      return JSON.stringify(player.history.awards[index]) !== before;
    }

    player.history.awards.push(award);
    return true;
  }

  function reconcileAwardRecord(record, winners) {
    let changed = false;
    for (const winner of winners || []) {
      const playerId = String(winner?.playerId || '');
      if (!playerId) continue;
      const player = playerById(playerId);
      if (!player) continue;
      if (upsertPlayerAward(player, normalizedAward(record, winner))) changed = true;
    }
    return changed;
  }

  function playerParticipatedForTeam(player, archive, teamId) {
    const startYear = Number(archive?.identity?.startYear);
    const history = Array.isArray(player?.highSchoolSeasonHistory)
      ? player.highSchoolSeasonHistory
      : [];

    if (Number.isFinite(startYear)) {
      return history.some(row =>
        Number(row?.seasonStartYear) === startYear &&
        String(row?.teamId || '') === String(teamId || '')
      );
    }

    return String(player?.teamId || '') === String(teamId || '');
  }

  function championshipAward(record, player, teamId, teamName) {
    const seasonLabel = seasonLabelFromRecord(record, null);
    const rawDate = record?.postseasonCompletedDate || record?.archivedAt || null;
    const date = canonicalSeasonDate(record, rawDate);
    return {
      key: `${seasonLabel}:high-school-champion`,
      awardId: 'high-school-champion',
      title: 'High School Champion',
      name: 'High School Champion',
      awardName: 'High School Champion',
      season: seasonLabel,
      seasonLabel,
      year: seasonLabel,
      level: 'High School',
      scope: 'team',
      team: teamName || null,
      teamId: teamId || null,
      playerId: idOf(player),
      date,
      championship: true,
      teamAward: true,
    };
  }

  function reconcileArchivedChampionship(record) {
    const championTeamId = String(record?.champion?.teamId || record?.championTeamId || '');
    if (!championTeamId) return false;

    const championName = String(
      record?.champion?.abbreviation ||
      record?.champion?.teamName ||
      record?.champion?.name ||
      ''
    );

    let changed = false;
    for (const player of allKnownPlayers()) {
      if (!playerParticipatedForTeam(player, record, championTeamId)) continue;
      if (upsertPlayerAward(player, championshipAward(record, player, championTeamId, championName))) {
        changed = true;
      }
    }
    return changed;
  }

  function reconcileCurrentChampionship(postseason, world) {
    const championTeamId = String(postseason?.championTeamId || '');
    if (!championTeamId) return false;

    const team = (world?.teams || []).find(item => String(item?.teamId || '') === championTeamId) || null;
    const seasonLabel = String(world?.season?.label || world?.season?.seasonLabel || world?.currentSeason || 'High School');
    const date = dateKey(postseason?.completedDate || world?.season?.currentDate || world?.currentDate);
    const record = {
      identity: {
        label: seasonLabel,
        startYear: Number(world?.season?.seasonStartYear || world?.season?.currentYear) || null,
        endYear: Number(world?.season?.seasonEndYear) || null,
      },
      seasonLabel,
      postseasonCompletedDate: date,
    };

    let changed = false;
    for (const player of team?.roster || []) {
      if (upsertPlayerAward(player, championshipAward(
        record,
        player,
        championTeamId,
        team?.abbreviation || team?.teamName || team?.name || ''
      ))) changed = true;
    }
    return changed;
  }

  function reconcilePlayerAwardHistory() {
    const world = WorldEngine.state;
    if (!world) return false;
    const history = world.history = world.history || {};
    let changed = false;

    const legacyRecords = Array.isArray(history.leagueAwards) ? history.leagueAwards : [];
    for (const record of legacyRecords) {
      if (reconcileAwardRecord(record, record?.winners || [])) changed = true;
    }

    const seasonArchives = Array.isArray(history.highSchoolSeasons) ? history.highSchoolSeasons : [];
    for (const archive of seasonArchives) {
      if (reconcileAwardRecord(archive, archive?.leagueAwards || [])) changed = true;
      if (reconcileArchivedChampionship(archive)) changed = true;
    }

    const postseason = WorldEngine.getHighSchoolPostseason?.() || world?.postseason?.highSchool || null;
    const currentWinners = Array.isArray(postseason?.leagueAwards?.winners)
      ? postseason.leagueAwards.winners
      : [];
    if (currentWinners.length) {
      const currentRecord = {
        date: postseason?.leagueAwards?.selectedAt || world?.season?.currentDate || null,
        seasonLabel: world?.season?.label || world?.season?.seasonLabel || null,
      };
      if (reconcileAwardRecord(currentRecord, currentWinners)) changed = true;
    }
    if (reconcileCurrentChampionship(postseason, world)) changed = true;

    const root = history.playerAwardHistory = history.playerAwardHistory || {};
    if (root.version !== VERSION) {
      root.version = VERSION;
      changed = true;
    }
    return changed;
  }

  function getPlayerAwardHistory(playerOrId) {
    reconcilePlayerAwardHistory();
    const player = typeof playerOrId === 'object' ? playerOrId : playerById(playerOrId);
    const awards = Array.isArray(player?.history?.awards) ? player.history.awards : [];
    return awards.slice().sort((a, b) =>
      String(a?.seasonLabel || a?.season || '').localeCompare(String(b?.seasonLabel || b?.season || '')) ||
      String(a?.title || a?.name || '').localeCompare(String(b?.title || b?.name || ''))
    );
  }

  function renderProjectIcePlayerAwards(playerOrId, options = {}) {
    installAwardStyles();
    const listId = String(options?.listId || 'pp-awards-list');
    const container = document.getElementById(listId);
    if (!container) return false;

    const awards = getPlayerAwardHistory(playerOrId);
    container.classList.add('pi-player-awards');

    if (!awards.length) {
      container.innerHTML = `
        <div class="pi-player-awards-empty">
          <span class="pi-player-awards-empty__icon">🏆</span>
          <div>
            <strong class="pi-player-awards-empty__title">No Awards Yet</strong>
            <p class="pi-player-awards-empty__text">Individual awards and championships will appear here throughout your career.</p>
          </div>
        </div>`;
      return true;
    }

    container.innerHTML = awards.map(award => {
      const championship = award?.championship === true || award?.teamAward === true || String(award?.awardId || '') === 'high-school-champion';
      const title = String(award?.title || award?.name || award?.awardName || 'Career Honor');
      const season = String(award?.seasonLabel || award?.season || award?.year || '');
      const level = String(award?.level || 'High School');
      const team = String(award?.team || '').trim();
      const meta = [season, level, team].filter(Boolean).join(' · ');
      const eyebrow = championship ? 'Team Championship' : 'Career Honor';

      return `
        <article class="pi-player-award-card${championship ? ' pi-player-award-card--championship' : ''}">
          <div class="pi-player-award-card__icon" aria-hidden="true">🏆</div>
          <div class="pi-player-award-card__copy">
            <span class="pi-player-award-card__eyebrow">${escapeHtml(eyebrow)}</span>
            <strong class="pi-player-award-card__title">${escapeHtml(title)}</strong>
            ${meta ? `<span class="pi-player-award-card__meta">${escapeHtml(meta)}</span>` : ''}
          </div>
        </article>`;
    }).join('');
    return true;
  }

  const originalSave = typeof WorldEngine.save === 'function'
    ? WorldEngine.save.bind(WorldEngine)
    : null;
  if (originalSave && !WorldEngine.save.__playerAwardHistoryWrapped) {
    const wrappedSave = function(...args) {
      reconcilePlayerAwardHistory();
      return originalSave(...args);
    };
    wrappedSave.__playerAwardHistoryWrapped = true;
    WorldEngine.save = wrappedSave;
  }

  const originalSelect = typeof WorldEngine.selectCareerSave === 'function'
    ? WorldEngine.selectCareerSave.bind(WorldEngine)
    : null;
  if (originalSelect && !WorldEngine.selectCareerSave.__playerAwardHistoryWrapped) {
    const wrappedSelect = async function(...args) {
      const result = await originalSelect(...args);
      const changed = reconcilePlayerAwardHistory();
      if (changed) originalSave?.();
      return result;
    };
    wrappedSelect.__playerAwardHistoryWrapped = true;
    WorldEngine.selectCareerSave = wrappedSelect;
  }

  WorldEngine.reconcilePlayerAwardHistory = reconcilePlayerAwardHistory;
  WorldEngine.getPlayerAwardHistory = getPlayerAwardHistory;
  globalThis.renderProjectIcePlayerAwards = renderProjectIcePlayerAwards;

  installAwardStyles();
  reconcilePlayerAwardHistory();
})();