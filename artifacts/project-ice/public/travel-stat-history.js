'use strict';

/* global WorldEngine, Game */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const HISTORY_VERSION = 1;
  const PROFILE_CONTROL_ID = 'pi-player-profile-stat-scope';
  const HIDE_STYLE_ID = 'pi-travel-postseason-archive-style';
  let profileScope = 'regular-season';
  let lastProfilePlayer = null;
  let lastProfileOptions = null;

  const norm = value => String(value || '').trim().toLowerCase();
  const idOf = player => String(player?.sourcePlayerId || player?.playerId || player?.id || '');
  const nameOf = player => String(
    player?.name || player?.playerName || [player?.firstName, player?.lastName].filter(Boolean).join(' ') || ''
  ).trim();

  function unifiedProfileScopeOwnerActive() {
    return typeof WorldEngine.applyStandalonePlayerProfileStatScope === 'function';
  }

  function travelState() {
    return WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  }

  function historyRoot() {
    const world = WorldEngine.state;
    if (!world) return null;
    if (!world.travelStatHistory || typeof world.travelStatHistory !== 'object') {
      world.travelStatHistory = { version:HISTORY_VERSION, tournaments:{}, players:{} };
    }
    const root = world.travelStatHistory;
    root.version = HISTORY_VERSION;
    if (!root.tournaments || typeof root.tournaments !== 'object') root.tournaments = {};
    if (!root.players || typeof root.players !== 'object') root.players = {};
    return root;
  }

  function tournamentKey(state) {
    const t = state?.tournament || {};
    return String(
      t.randomSeed ||
      state?.tryoutResult?.completedAt ||
      `${state?.placementLevel || 'travel'}:${t.championTeamId || 'pending'}`
    );
  }

  function normalizeStats(player) {
    const s = player?.travelStats || {};
    return {
      gp: Math.max(0, Number(s.gp || 0)),
      g: Math.max(0, Number(s.g || 0)),
      a: Math.max(0, Number(s.a || 0)),
      pts: Math.max(0, Number(s.pts ?? (Number(s.g || 0) + Number(s.a || 0)))),
      pim: Math.max(0, Number(s.pim || 0)),
      sog: Math.max(0, Number(s.sog || 0)),
      wins: Math.max(0, Number(s.wins || 0)),
      losses: Math.max(0, Number(s.losses || 0)),
      shotsAgainst: Math.max(0, Number(s.shotsAgainst || 0)),
      saves: Math.max(0, Number(s.saves || 0)),
      goalsAgainst: Math.max(0, Number(s.goalsAgainst || 0)),
      savePercentage: Math.max(0, Number(s.savePercentage || 0)),
    };
  }

  function archiveTravelTournament(options = {}) {
    const state = travelState();
    const root = historyRoot();
    if (!state?.tournament || !root || !Array.isArray(state.teams)) return false;
    if (state.tournament.status !== 'complete' && state.completed !== true) return false;

    const key = tournamentKey(state);
    if (!key || root.tournaments[key]?.archived === true) return false;

    const date = String(
      state.tournament.closeoutAcknowledgedAt ||
      state.tournament.mvpSelectedAt ||
      WorldEngine.state?.season?.currentDate ||
      WorldEngine.state?.currentDate ||
      ''
    ).slice(0,10);

    root.tournaments[key] = {
      archived:true,
      date,
      level:state.placementLevel || state.tournament.level || null,
      championTeamId:state.tournament.championTeamId || null,
    };

    for (const team of state.teams) {
      for (const player of team?.roster || []) {
        const stats = normalizeStats(player);
        if (stats.gp <= 0) continue;

        const primaryId = idOf(player) || `name:${norm(nameOf(player))}`;
        if (!primaryId) continue;

        const record = root.players[primaryId] || {
          playerId:primaryId,
          name:nameOf(player),
          aliases:[],
          tournaments:{},
        };
        const aliases = new Set(record.aliases || []);
        [player?.sourcePlayerId, player?.playerId, player?.id, nameOf(player)]
          .filter(Boolean)
          .forEach(alias => aliases.add(String(alias)));
        record.name = record.name || nameOf(player);
        record.aliases = [...aliases];
        record.tournaments[key] = {
          date,
          teamId:team?.teamId || null,
          teamName:team?.name || team?.teamName || null,
          teamAbbr:team?.shortName || team?.abbr || team?.abbreviation || null,
          level:state.placementLevel || state.tournament.level || null,
          position:player?.position || null,
          stats,
        };
        root.players[primaryId] = record;
      }
    }

    if (options.save !== false) WorldEngine.save?.();
    return true;
  }

  function findArchivedTravelRecord(player) {
    const root = historyRoot();
    if (!root || !player) return null;
    const ids = [player?.sourcePlayerId, player?.playerId, player?.id].filter(Boolean).map(String);
    const name = norm(nameOf(player));

    for (const [key, record] of Object.entries(root.players || {})) {
      const aliases = [key, ...(record?.aliases || [])].map(String);
      if (ids.some(id => aliases.includes(id))) return record;
      if (name && norm(record?.name) === name) return record;
    }
    return null;
  }

  function findLiveTravelEntry(player) {
    const state = travelState();
    if (!state || !Array.isArray(state.teams) || !player) return null;
    const ids = [player?.sourcePlayerId, player?.playerId, player?.id].filter(Boolean).map(String);
    const name = norm(nameOf(player));

    for (const team of state.teams) {
      const match = (team?.roster || []).find(candidate => {
        const candidateIds = [candidate?.sourcePlayerId, candidate?.playerId, candidate?.id].filter(Boolean).map(String);
        return ids.some(id => candidateIds.includes(id)) || (name && norm(nameOf(candidate)) === name);
      });
      if (!match) continue;
      return {
        date:String(WorldEngine.state?.season?.currentDate || WorldEngine.state?.currentDate || '').slice(0,10),
        teamId:team?.teamId || null,
        teamName:team?.name || team?.teamName || null,
        teamAbbr:team?.shortName || team?.abbr || team?.abbreviation || null,
        level:state?.placementLevel || state?.tournament?.level || null,
        position:match?.position || null,
        stats:normalizeStats(match),
      };
    }
    return null;
  }

  function seasonLabelFromDate(value) {
    const key = String(value || '').slice(0,10);
    const match = key.match(/^(\d{4})-(\d{2})-/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
    const start = month >= 9 ? year : year - 1;
    return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
  }

  function travelEntries(player) {
    const archived = findArchivedTravelRecord(player);
    const entries = Object.values(archived?.tournaments || {}).map(entry => ({ ...entry }));
    const live = findLiveTravelEntry(player);
    if (live && Number(live?.stats?.gp || 0) > 0) {
      const liveLabel = seasonLabelFromDate(live.date);
      const archivedSameSeason = entries.some(entry => seasonLabelFromDate(entry?.date) === liveLabel);
      if (!archivedSameSeason) entries.push(live);
    }
    return entries;
  }

  function cumulativeTravel(player) {
    const entries = travelEntries(player);
    if (!entries.length) return null;
    const total = {gp:0,g:0,a:0,pts:0,pim:0,sog:0,wins:0,losses:0,shotsAgainst:0,saves:0,goalsAgainst:0,savePercentage:0};
    for (const entry of entries) {
      const s = entry?.stats || {};
      for (const key of ['gp','g','a','pts','pim','sog','wins','losses','shotsAgainst','saves','goalsAgainst']) {
        total[key] += Number(s[key] || 0);
      }
    }
    total.savePercentage = total.shotsAgainst > 0 ? total.saves / total.shotsAgainst : 0;
    return { total, latest:entries[entries.length - 1] || {}, entries };
  }

  function headerMap(headId) {
    const map = new Map();
    [...(document.getElementById(headId)?.querySelectorAll('th') || [])].forEach((cell,index) => {
      const key = String(cell.textContent || '').trim().toUpperCase().replace(/[^A-Z0-9+/%-]/g,'');
      if (key) map.set(key,index);
    });
    return map;
  }

  function setCell(row,index,value) {
    if (!row || index === undefined) return;
    const cell = row.children?.[index];
    if (cell) cell.textContent = String(value);
  }

  function readCell(row,index) {
    if (!row || index === undefined) return '';
    return String(row.children?.[index]?.textContent || '').trim();
  }

  function zeroStats(player) {
    const goalie = String(player?.position || '').toUpperCase() === 'G';
    return goalie
      ? {GP:0,GS:0,W:0,L:0,OTL:0,GA:0,GAA:'0.00','SV%':'.000',SO:0}
      : {GP:0,G:0,A:0,PTS:0,'+/-':0,PIM:0,SOG:0,SHOTS:0};
  }

  function valuesFromTravelStats(player,s = {},position = null) {
    const goalie = String(position || player?.position || '').toUpperCase() === 'G';
    if (goalie) {
      const gp = Number(s.gp || 0);
      const ga = Number(s.goalsAgainst || 0);
      const shotsAgainst = Number(s.shotsAgainst || 0);
      const saves = Number(s.saves || 0);
      return {
        GP:gp, GS:gp, W:Number(s.wins || 0), L:Number(s.losses || 0), OTL:0,
        GA:ga, GAA:(gp > 0 ? ga / gp : 0).toFixed(2),
        'SV%':(shotsAgainst > 0 ? saves / shotsAgainst : 0).toFixed(3).replace(/^0/,''), SO:0,
      };
    }
    return {
      GP:Number(s.gp || 0), G:Number(s.g || 0), A:Number(s.a || 0),
      PTS:Number(s.pts ?? (Number(s.g || 0) + Number(s.a || 0))),
      '+/-':0, PIM:Number(s.pim || 0), SOG:Number(s.sog || 0), SHOTS:Number(s.sog || 0),
    };
  }

  function travelBySeason(player) {
    const map = new Map();
    for (const entry of travelEntries(player)) {
      const label = seasonLabelFromDate(entry?.date);
      if (!label) continue;
      const existing = map.get(label) || {
        stats:{gp:0,g:0,a:0,pts:0,pim:0,sog:0,wins:0,losses:0,shotsAgainst:0,saves:0,goalsAgainst:0},
        meta:entry,
      };
      const s = entry?.stats || {};
      for (const key of ['gp','g','a','pts','pim','sog','wins','losses','shotsAgainst','saves','goalsAgainst']) {
        existing.stats[key] += Number(s[key] || 0);
      }
      existing.meta = entry;
      map.set(label,existing);
    }
    return map;
  }

  function internationalValues(player) {
    const s = player?.internationalStats || player?.statsByScope?.international || null;
    if (!s) return zeroStats(player);
    const goalie = String(player?.position || '').toUpperCase() === 'G';
    return goalie
      ? {
          GP:Number(s.gamesPlayed ?? s.gp ?? 0), GS:Number(s.gamesStarted ?? s.gs ?? 0), W:Number(s.wins ?? 0), L:Number(s.losses ?? 0), OTL:Number(s.overtimeLosses ?? s.otl ?? 0), GA:Number(s.goalsAgainst ?? s.ga ?? 0),
          GAA:Number(s.goalsAgainstAverage ?? s.gaa ?? 0).toFixed(2), 'SV%':Number(s.savePercentage ?? s.svPct ?? 0).toFixed(3).replace(/^0/,''), SO:Number(s.shutouts ?? s.so ?? 0)
        }
      : {
          GP:Number(s.gamesPlayed ?? s.gp ?? 0), G:Number(s.goals ?? s.g ?? 0), A:Number(s.assists ?? s.a ?? 0), PTS:Number(s.points ?? s.pts ?? 0), '+/-':Number(s.plusMinus ?? 0), PIM:Number(s.penaltyMinutes ?? s.pim ?? 0), SOG:Number(s.shots ?? s.sog ?? 0), SHOTS:Number(s.shots ?? s.sog ?? 0)
        };
  }

  function applyValues(row,headers,values) {
    for (const [label,value] of Object.entries(values || {})) setCell(row,headers.get(label),value);
  }

  function overlayTravelRows(player,ids) {
    const headers = headerMap(ids.headId);
    const rows = [...(document.getElementById(ids.bodyId)?.querySelectorAll('tr') || [])];
    const foot = document.getElementById(ids.footId)?.querySelector('tr') || null;
    if (!rows.length || !headers.size) return false;

    const bySeason = travelBySeason(player);
    let career = {gp:0,g:0,a:0,pts:0,pim:0,sog:0,wins:0,losses:0,shotsAgainst:0,saves:0,goalsAgainst:0};

    for (const row of rows) {
      const season = readCell(row,headers.get('SEASON'));
      const data = bySeason.get(season) || null;
      const stats = data?.stats || {};
      const values = data
        ? valuesFromTravelStats(player,stats,data?.meta?.position)
        : zeroStats(player);

      applyValues(row,headers,values);
      setCell(row,headers.get('TEAM'),data?.meta?.teamAbbr || data?.meta?.teamName || 'Travel');
      setCell(row,headers.get('LVL'),data?.meta?.level || 'TRV');
      row.dataset.piStatScope = 'travel';

      for (const key of Object.keys(career)) career[key] += Number(stats[key] || 0);
    }

    career.pts = Number(career.g || 0) + Number(career.a || 0);
    if (foot) {
      applyValues(foot,headers,valuesFromTravelStats(player,career));
      setCell(foot,headers.get('SEASON'),'Career');
      setCell(foot,headers.get('TEAM'),'—');
      setCell(foot,headers.get('LVL'),'—');
      foot.dataset.piStatScope = 'travel';
    }
    return true;
  }

  function overlaySingleScope(player,scope,ids) {
    const headers = headerMap(ids.headId);
    const rows = [...(document.getElementById(ids.bodyId)?.querySelectorAll('tr') || [])];
    if (!rows.length || !headers.size) return false;
    const values = scope === 'international' ? internationalValues(player) : zeroStats(player);
    rows.forEach((row,index) => {
      applyValues(row,headers,index === rows.length - 1 ? values : zeroStats(player));
      row.dataset.piStatScope = scope;
    });
    const foot = document.getElementById(ids.footId)?.querySelector('tr') || null;
    if (foot) {
      applyValues(foot,headers,values);
      foot.dataset.piStatScope = scope;
    }
    return true;
  }

  function overlayTable(player,scope,ids) {
    if (!player) return false;
    if (scope === 'travel') return overlayTravelRows(player,ids);
    if (scope === 'international') return overlaySingleScope(player,scope,ids);
    return false;
  }

  function careerPlayer() {
    return WorldEngine.getCareerPlayer?.() || Game?.player || WorldEngine.state?.player || null;
  }

  function ensureCareerOptions() {
    const select = document.getElementById('pp-statistics-filter');
    if (!select) return null;
    if (!select.querySelector('option[value="travel"]')) {
      const travelOption = document.createElement('option');
      travelOption.value = 'travel';
      travelOption.textContent = 'Travel';
      const international = select.querySelector('option[value="international"]');
      if (international) select.insertBefore(travelOption,international);
      else select.appendChild(travelOption);
    }
    return select;
  }

  function applyCareerSpecialScope() {
    const select = ensureCareerOptions();
    const scope = select?.value || 'regular-season';
    if (scope !== 'travel' && scope !== 'international') return false;
    return overlayTable(careerPlayer(),scope,{
      headId:'pp-statistics-head',bodyId:'pp-statistics-body',footId:'pp-statistics-foot'
    });
  }

  function scheduleCareerOverlay() {
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(applyCareerSpecialScope)));
  }

  function ensureProfileButtons() {
    if (unifiedProfileScopeOwnerActive()) return false;
    const control = document.getElementById(PROFILE_CONTROL_ID);
    if (!control) return false;
    control.style.gridTemplateColumns = 'repeat(4,minmax(0,1fr))';
    for (const [scope,label] of [['travel','Travel'],['international','International']]) {
      if (control.querySelector(`button[data-scope="${scope}"]`)) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.scope = scope;
      button.textContent = label;
      control.appendChild(button);
    }
    syncProfileButtons();
    return true;
  }

  function syncProfileButtons() {
    if (unifiedProfileScopeOwnerActive()) return;
    document.querySelectorAll(`#${PROFILE_CONTROL_ID} button[data-scope]`).forEach(button => {
      const active = button.dataset.scope === profileScope;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-pressed',active ? 'true' : 'false');
    });
  }

  const baseProfileRender = globalThis.renderProjectIcePlayerStatistics;
  if (typeof baseProfileRender === 'function') {
    globalThis.renderProjectIcePlayerStatistics = function(player = {},options = {}) {
      const result = baseProfileRender(player,options);
      if (String(options?.headId || '') === 'player-profile-statistics-head') {
        lastProfilePlayer = player;
        lastProfileOptions = options;
        requestAnimationFrame(() => {
          if (!unifiedProfileScopeOwnerActive()) {
            ensureProfileButtons();
            if (profileScope === 'travel' || profileScope === 'international') {
              overlayTable(player,profileScope,{
                headId:'player-profile-statistics-head',bodyId:'player-profile-statistics-body',footId:'player-profile-statistics-foot'
              });
            }
            syncProfileButtons();
          }
        });
      }
      return result;
    };
  }

  document.addEventListener('click',event => {
    if (unifiedProfileScopeOwnerActive()) return;
    const button = event.target?.closest?.(`#${PROFILE_CONTROL_ID} button[data-scope]`);
    if (!button) return;
    const scope = button.dataset.scope;
    profileScope = scope;
    if (scope === 'travel' || scope === 'international') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (lastProfilePlayer && typeof baseProfileRender === 'function') {
        baseProfileRender(lastProfilePlayer,lastProfileOptions || {});
        requestAnimationFrame(() => {
          ensureProfileButtons();
          overlayTable(lastProfilePlayer,scope,{
            headId:'player-profile-statistics-head',bodyId:'player-profile-statistics-body',footId:'player-profile-statistics-foot'
          });
          syncProfileButtons();
        });
      }
    } else {
      requestAnimationFrame(syncProfileButtons);
    }
  },true);

  document.addEventListener('change',event => {
    if (event.target?.id === 'pp-statistics-filter') scheduleCareerOverlay();
  },true);

  document.addEventListener('click',event => {
    const target = event.target?.closest?.('[data-hub-tab], [data-tab], .hub-tab');
    const label = norm(target?.dataset?.hubTab || target?.dataset?.tab || target?.textContent);
    if (label.includes('player')) scheduleCareerOverlay();
  });

  function installPostseasonArchivePresentation() {
    const state = travelState();
    const complete = state?.tournament?.closeoutAcknowledged === true;
    document.body.classList.toggle('pi-travel-closeout-complete',complete);
    if (!document.getElementById(HIDE_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = HIDE_STYLE_ID;
      style.textContent = 'body.pi-travel-closeout-complete #pi-league-postseason-card{display:none!important}';
      document.head.appendChild(style);
    }
    if (complete) document.getElementById('pi-league-postseason-card')?.remove();
  }

  document.addEventListener('click',event => {
    if (!event.target?.closest?.('#pi-travel-closeout-continue')) return;
    archiveTravelTournament({save:false});
    requestAnimationFrame(() => {
      installPostseasonArchivePresentation();
      WorldEngine.save?.();
    });
  },true);

  WorldEngine.archiveTravelTournamentStats = archiveTravelTournament;
  WorldEngine.getPlayerTravelStats = cumulativeTravel;

  archiveTravelTournament({save:true});
  installPostseasonArchivePresentation();
  ensureCareerOptions();
  scheduleCareerOverlay();

  const observer = new MutationObserver(() => {
    ensureCareerOptions();
    if (!unifiedProfileScopeOwnerActive()) ensureProfileButtons();
    installPostseasonArchivePresentation();
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();