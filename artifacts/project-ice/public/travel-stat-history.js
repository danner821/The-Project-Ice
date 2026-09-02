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
    if (!key) return false;
    const already = root.tournaments[key]?.archived === true;
    if (already) return false;

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
          playerId: primaryId,
          name: nameOf(player),
          aliases: [],
          tournaments: {},
        };
        const aliases = new Set(record.aliases || []);
        [player?.sourcePlayerId, player?.playerId, player?.id, nameOf(player)].filter(Boolean).forEach(alias => aliases.add(String(alias)));
        record.name = record.name || nameOf(player);
        record.aliases = [...aliases];
        record.tournaments[key] = {
          date,
          teamId: team?.teamId || null,
          teamName: team?.name || team?.teamName || null,
          teamAbbr: team?.shortName || team?.abbr || team?.abbreviation || null,
          level: state.placementLevel || state.tournament.level || null,
          position: player?.position || null,
          stats,
        };
        root.players[primaryId] = record;
      }
    }

    if (options.save !== false) WorldEngine.save?.();
    return true;
  }

  function findTravelRecord(player) {
    const root = historyRoot();
    if (!root || !player) return null;
    const ids = [player?.sourcePlayerId, player?.playerId, player?.id].filter(Boolean).map(String);
    const name = norm(nameOf(player));

    for (const [key, record] of Object.entries(root.players || {})) {
      const aliases = [key, ...(record?.aliases || [])].map(String);
      if (ids.some(id => aliases.includes(id))) return record;
      if (name && norm(record?.name) === name) return record;
    }

    const state = travelState();
    for (const team of state?.teams || []) {
      const match = (team?.roster || []).find(candidate => {
        const candidateIds = [candidate?.sourcePlayerId, candidate?.playerId, candidate?.id].filter(Boolean).map(String);
        return ids.some(id => candidateIds.includes(id)) || (name && norm(nameOf(candidate)) === name);
      });
      if (match && Number(match?.travelStats?.gp || 0) > 0) {
        return {
          playerId:idOf(match),
          name:nameOf(match),
          aliases:[match?.sourcePlayerId, match?.playerId, match?.id].filter(Boolean).map(String),
          tournaments:{
            current:{
              date:String(WorldEngine.state?.season?.currentDate || '').slice(0,10),
              teamId:team?.teamId || null,
              teamName:team?.name || null,
              teamAbbr:team?.shortName || team?.abbr || null,
              level:state?.placementLevel || state?.tournament?.level || null,
              position:match?.position || null,
              stats:normalizeStats(match),
            }
          }
        };
      }
    }
    return null;
  }

  function cumulativeTravel(player) {
    const record = findTravelRecord(player);
    if (!record) return null;
    const entries = Object.values(record.tournaments || {});
    if (!entries.length) return null;
    const total = {gp:0,g:0,a:0,pts:0,pim:0,sog:0,wins:0,losses:0,shotsAgainst:0,saves:0,goalsAgainst:0,savePercentage:0};
    for (const entry of entries) {
      const s = entry?.stats || {};
      for (const key of ['gp','g','a','pts','pim','sog','wins','losses','shotsAgainst','saves','goalsAgainst']) total[key] += Number(s[key] || 0);
    }
    total.savePercentage = total.shotsAgainst > 0 ? total.saves / total.shotsAgainst : 0;
    const latest = entries[entries.length - 1] || {};
    return { record, total, latest };
  }

  function headerMap(headId) {
    const map = new Map();
    [...(document.getElementById(headId)?.querySelectorAll('th') || [])].forEach((cell, index) => {
      const key = String(cell.textContent || '').trim().toUpperCase().replace(/[^A-Z0-9+/%-]/g,'');
      if (key) map.set(key,index);
    });
    return map;
  }

  function setCell(row, index, value) {
    if (!row || index === undefined) return;
    const cell = row.children?.[index];
    if (cell) cell.textContent = String(value);
  }

  function zeroStats(player) {
    const goalie = String(player?.position || '').toUpperCase() === 'G';
    return goalie
      ? {GP:0,GS:0,W:0,L:0,OTL:0,GA:0,GAA:'0.00','SV%':'.000',SO:0}
      : {GP:0,G:0,A:0,PTS:0,'+/-':0,PIM:0,SOG:0,SHOTS:0};
  }

  function travelValues(player) {
    const data = cumulativeTravel(player);
    if (!data) return { values:zeroStats(player), meta:null };
    const s = data.total;
    const goalie = String(player?.position || data.latest?.position || '').toUpperCase() === 'G';
    if (goalie) {
      const gaa = s.gp > 0 ? s.goalsAgainst / s.gp : 0;
      return {
        values:{GP:s.gp,GS:s.gp,W:s.wins,L:s.losses,OTL:0,GA:s.goalsAgainst,GAA:gaa.toFixed(2),'SV%':Number(s.savePercentage || 0).toFixed(3).replace(/^0/,''),SO:0},
        meta:data.latest,
      };
    }
    return { values:{GP:s.gp,G:s.g,A:s.a,PTS:s.pts,'+/-':0,PIM:s.pim,SOG:s.sog,SHOTS:s.sog}, meta:data.latest };
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

  function overlayTable(player, scope, ids) {
    if (!player) return false;
    const headers = headerMap(ids.headId);
    const rows = [...(document.getElementById(ids.bodyId)?.querySelectorAll('tr') || [])];
    if (!rows.length) return false;
    const row = rows[rows.length - 1];
    const foot = document.getElementById(ids.footId)?.querySelector('tr') || null;

    let values = null;
    let meta = null;
    if (scope === 'travel') ({values,meta} = travelValues(player));
    else if (scope === 'international') values = internationalValues(player);
    else return false;

    for (const [label,value] of Object.entries(values || {})) {
      setCell(row,headers.get(label),value);
      if (foot) setCell(foot,headers.get(label),value);
    }

    if (scope === 'travel') {
      const teamLabel = meta?.teamAbbr || meta?.teamName || 'Travel';
      setCell(row,headers.get('TEAM'),teamLabel);
      setCell(row,headers.get('LVL'),meta?.level || 'TRV');
      if (foot) {
        setCell(foot,headers.get('TEAM'),'—');
        setCell(foot,headers.get('LVL'),'—');
      }
    }

    row.dataset.piStatScope = scope;
    if (foot) foot.dataset.piStatScope = scope;
    return true;
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
      if (international) select.insertBefore(travelOption, international);
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
    document.querySelectorAll(`#${PROFILE_CONTROL_ID} button[data-scope]`).forEach(button => {
      const active = button.dataset.scope === profileScope;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-pressed',active ? 'true' : 'false');
    });
  }

  const baseProfileRender = globalThis.renderProjectIcePlayerStatistics;
  if (typeof baseProfileRender === 'function') {
    globalThis.renderProjectIcePlayerStatistics = function(player = {}, options = {}) {
      const result = baseProfileRender(player,options);
      if (String(options?.headId || '') === 'player-profile-statistics-head') {
        lastProfilePlayer = player;
        lastProfileOptions = options;
        requestAnimationFrame(() => {
          ensureProfileButtons();
          if (profileScope === 'travel' || profileScope === 'international') {
            overlayTable(player,profileScope,{
              headId:'player-profile-statistics-head',bodyId:'player-profile-statistics-body',footId:'player-profile-statistics-foot'
            });
          }
          syncProfileButtons();
        });
      }
      return result;
    };
  }

  document.addEventListener('click', event => {
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
  }, true);

  document.addEventListener('change', event => {
    if (event.target?.id === 'pp-statistics-filter') scheduleCareerOverlay();
  }, true);

  document.addEventListener('click', event => {
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

  document.addEventListener('click', event => {
    if (!event.target?.closest?.('#pi-travel-closeout-continue')) return;
    archiveTravelTournament({save:false});
    requestAnimationFrame(() => {
      installPostseasonArchivePresentation();
      WorldEngine.save?.();
    });
  }, true);

  WorldEngine.archiveTravelTournamentStats = archiveTravelTournament;
  WorldEngine.getPlayerTravelStats = cumulativeTravel;

  archiveTravelTournament({save:true});
  installPostseasonArchivePresentation();
  ensureCareerOptions();
  scheduleCareerOverlay();

  const observer = new MutationObserver(() => {
    ensureCareerOptions();
    ensureProfileButtons();
    installPostseasonArchivePresentation();
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();
