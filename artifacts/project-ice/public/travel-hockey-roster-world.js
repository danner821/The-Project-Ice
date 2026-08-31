'use strict';

/* global WorldEngine, REAL_PROSPECTS */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  const VERSION = 4;
  const FIRST = ['Aiden','Blake','Brady','Cam','Carter','Cole','Connor','Dylan','Ethan','Evan','Gavin','Hudson','Jack','Jake','Liam','Logan','Lucas','Mason','Max','Nolan','Noah','Owen','Parker','Ryan','Sam','Tyler','Wyatt'];
  const LAST = ['Anderson','Bailey','Bell','Bennett','Brooks','Carter','Cook','Cooper','Foster','Gray','Hayes','Howard','Hughes','Johnson','Kelly','Lewis','Miller','Morgan','Murphy','Nelson','Perry','Peterson','Price','Reed','Richardson','Ross','Shaw','Sullivan','Thompson','Turner','Ward','Wood','Young'];

  const CLUB_META = {
    'arizona-jr-coyotes': { coachName:'Matt Reynolds', coachStyle:'Speed and transition', arenaName:'AZ Ice Peoria', arenaCapacity:650, prestige:2, strength:-1, identity:'Fast, aggressive transition hockey', primaryColor:'#8c2633', secondaryColor:'#e2d6b5' },
    'colorado-thunderbirds': { coachName:'Ryan Caldwell', coachStyle:'Puck possession', arenaName:'Family Sports Center', arenaCapacity:900, prestige:3, strength:1, identity:'Skilled possession and pace', primaryColor:'#173f7a', secondaryColor:'#d8e8ff' },
    'dallas-stars-elite': { coachName:'Chris Wallace', coachStyle:'Structured two-way', arenaName:'Comerica Center', arenaCapacity:3500, prestige:4, strength:2, identity:'Structured, mature two-way hockey', primaryColor:'#006847', secondaryColor:'#b3b7b9' },
    'chicago-mission': { coachName:'Mike O’Donnell', coachStyle:'High-pressure attack', arenaName:'Seven Bridges Ice Arena', arenaCapacity:1200, prestige:5, strength:3, identity:'Relentless pressure and elite skill', primaryColor:'#c8102e', secondaryColor:'#ffffff' },
    'little-caesars': { coachName:'Dan Stevens', coachStyle:'Physical possession', arenaName:'Little Caesars Arena Practice Rink', arenaCapacity:1000, prestige:5, strength:2, identity:'Heavy, skilled possession hockey', primaryColor:'#ce1126', secondaryColor:'#ffffff' },
    'pittsburgh-penguins-elite': { coachName:'Kevin Murphy', coachStyle:'Attack through the middle', arenaName:'UPMC Lemieux Sports Complex', arenaCapacity:1500, prestige:4, strength:2, identity:'Creative offense through the middle', primaryColor:'#fcb514', secondaryColor:'#000000' },
    'boston-jr-eagles': { coachName:'Sean McCarthy', coachStyle:'Smart puck support', arenaName:'New England Sports Center', arenaCapacity:1800, prestige:5, strength:3, identity:'High-IQ support and puck movement', primaryColor:'#1b365d', secondaryColor:'#c4ced4' },
    'la-jr-kings': { coachName:'Jason Miller', coachStyle:'Rush offense', arenaName:'Toyota Sports Performance Center', arenaCapacity:900, prestige:3, strength:0, identity:'Quick-strike rush offense', primaryColor:'#111111', secondaryColor:'#a2aaad' },
  };

  const travel = () => WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  const pid = player => String(player?.playerId || player?.id || '');
  const pname = player => String(player?.name || player?.playerName || [player?.firstName, player?.lastName].filter(Boolean).join(' ').trim() || 'Player');
  const ovr = player => Number(player?.overall ?? player?.ovr ?? player?.rating ?? 60);
  const pos = player => {
    const raw = String(player?.position || player?.pos || '').toUpperCase();
    if (raw === 'G' || raw.includes('GOAL')) return 'G';
    if (raw === 'D' || raw.includes('DEF')) return 'D';
    if (raw === 'LW' || raw.includes('LEFT')) return 'LW';
    if (raw === 'RW' || raw.includes('RIGHT')) return 'RW';
    return 'C';
  };

  function hash(value) {
    let result = 2166136261;
    for (const char of String(value || '')) {
      result ^= char.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  }

  function seededSort(list, seed) {
    return [...list].sort((a,b) => hash(`${seed}:${pid(a) || pname(a)}`) - hash(`${seed}:${pid(b) || pname(b)}`));
  }

  function baseFor(level) {
    return ({ B:58, A:64, AA:70, AAA:76 })[String(level || 'A').toUpperCase()] || 64;
  }

  function normalizePlayer(player) {
    return {
      ...player,
      playerId: pid(player) || `prospect:${hash(pname(player))}`,
      sourcePlayerId: pid(player) || player?.sourcePlayerId || null,
      name: pname(player),
      position: pos(player),
      overall: ovr(player),
      ovr: ovr(player),
      isRealProspect: player?.isRealProspect === true || player?.realProspect === true || Boolean(player?.prospectId) || Boolean(player?.draftYear),
      travelStats: player?.travelStats || { gp:0, g:0, a:0, pts:0, pim:0, sog:0, wins:0, savePercentage:0 },
    };
  }

  function generated(team, slotIndex, level, delta) {
    const seed = hash(`${team.teamId}:${slotIndex}:${level}:travel-v${VERSION}`);
    const first = FIRST[seed % FIRST.length];
    const last = LAST[Math.floor(seed / 31) % LAST.length];
    const positions = ['LW','C','RW','LW','C','RW','LW','C','RW','LW','C','RW','D','D','D','D','D','D','G','G'];
    const position = positions[slotIndex] || 'C';
    const overall = Math.max(45, Math.min(88, baseFor(level) + delta + ((seed % 9) - 4)));
    return {
      playerId: `travel-gen:${team.teamId}:${slotIndex}:v${VERSION}`,
      name: `${first} ${last}`,
      firstName: first,
      lastName: last,
      position,
      overall,
      ovr: overall,
      generatedTravelPlayer: true,
      travelStats: { gp:0, g:0, a:0, pts:0, pim:0, sog:0, wins:0, savePercentage:0 },
    };
  }

  function canonicalPlayer() {
    return WorldEngine.state?.player || {};
  }

  function worldPool() {
    const all = WorldEngine.getAllWorldPlayers?.() || (WorldEngine.state?.teams || []).flatMap(team => team.roster || []);
    return Array.isArray(all) ? all : [];
  }

  function prospectPool(level) {
    const target = baseFor(level);
    let rows = worldPool().filter(player => player && pid(player) && (player.isRealProspect === true || player.realProspect === true || player.prospectId) && Math.abs(ovr(player) - target) <= 8);
    try {
      if (typeof REAL_PROSPECTS !== 'undefined' && Array.isArray(REAL_PROSPECTS)) {
        rows.push(...REAL_PROSPECTS.filter(player => player && Math.abs(ovr(player) - target) <= 8));
      }
    } catch (_) {}
    const seen = new Set();
    return rows.map(normalizePlayer).filter(player => {
      const key = pid(player) || pname(player).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function otherWorldPool(level) {
    const target = baseFor(level);
    const careerId = pid(canonicalPlayer());
    return worldPool()
      .filter(player => player && pid(player) && pid(player) !== careerId && !player.isCareerPlayer && Math.abs(ovr(player) - target) <= 7)
      .map(normalizePlayer);
  }

  function clubId(team) {
    return team.clubId || team.organizationId || String(team.teamId || '').replace(/^travel-/, '').replace(/-(b|a|aa|aaa)$/i, '');
  }

  function applyTeamMeta(team) {
    const meta = CLUB_META[clubId(team)] || {};
    Object.assign(team, {
      coachName: meta.coachName || 'Travel Hockey Staff',
      coachStyle: meta.coachStyle || 'Balanced development',
      coach: { name: meta.coachName || 'Travel Hockey Staff', style: meta.coachStyle || 'Balanced development' },
      arenaName: meta.arenaName || `${team.city || 'Regional'} Ice Center`,
      arenaCapacity: meta.arenaCapacity || 800,
      arena: { name: meta.arenaName || `${team.city || 'Regional'} Ice Center`, capacity: meta.arenaCapacity || 800 },
      prestige: meta.prestige || 3,
      identity: meta.identity || 'Competitive summer travel hockey',
      primaryColor: meta.primaryColor || '#2f6fd6',
      secondaryColor: meta.secondaryColor || '#8fc1ff',
      teamStrengthDelta: meta.strength || 0,
    });
    return team;
  }

  function takePreferred(pool, preferred) {
    let index = pool.findIndex(player => pos(player) === preferred);
    if (index < 0) index = 0;
    return index >= 0 ? pool.splice(index, 1)[0] : null;
  }

  function assignCanonicalLineup(team) {
    if (!Array.isArray(team?.roster)) return team;

    for (const player of team.roster) {
      delete player.rosterSlot;
      delete player.slot;
    }

    const forwards = team.roster.filter(player => !['D','G'].includes(pos(player))).sort((a,b) => ovr(b) - ovr(a));
    const defense = team.roster.filter(player => pos(player) === 'D').sort((a,b) => ovr(b) - ovr(a));
    const goalies = team.roster.filter(player => pos(player) === 'G').sort((a,b) => ovr(b) - ovr(a));
    const forwardPool = [...forwards];
    const forwardLines = [];
    const defensePairs = [];

    for (let line = 1; line <= 4; line += 1) {
      const lw = takePreferred(forwardPool, 'LW');
      const c = takePreferred(forwardPool, 'C');
      const rw = takePreferred(forwardPool, 'RW');
      if (lw) lw.rosterSlot = `fwd-${line}-lw`;
      if (c) c.rosterSlot = `fwd-${line}-c`;
      if (rw) rw.rosterSlot = `fwd-${line}-rw`;
      forwardLines.push([lw, c, rw].filter(Boolean));
    }

    for (let pair = 1; pair <= 3; pair += 1) {
      const ld = defense[(pair - 1) * 2] || null;
      const rd = defense[(pair - 1) * 2 + 1] || null;
      if (ld) ld.rosterSlot = `def-${pair}-ld`;
      if (rd) rd.rosterSlot = `def-${pair}-rd`;
      defensePairs.push([ld, rd].filter(Boolean));
    }

    if (goalies[0]) goalies[0].rosterSlot = 'g-starter';
    if (goalies[1]) goalies[1].rosterSlot = 'g-backup';

    const playerId = player => player ? (player.playerId || player.id || null) : null;
    const topForwards = forwardLines.flat().filter(Boolean);
    const topDefense = defensePairs.flat().filter(Boolean);
    const makePP = unit => ({
      slots: {
        leftFlank: playerId(unit[0]),
        bumper: playerId(unit[1]),
        rightFlank: playerId(unit[2]),
        netFront: playerId(unit[3]),
        quarterback: playerId(unit[4]),
      },
    });
    const makePK = unit => ({
      slots: {
        leftForward: playerId(unit[0]),
        rightForward: playerId(unit[1]),
        leftDefense: playerId(unit[2]),
        rightDefense: playerId(unit[3]),
      },
    });

    team.forwardLines = forwardLines;
    team.defensePairs = defensePairs;
    team.goalies = goalies;
    team.lines = { forwards: forwardLines, defense: defensePairs, goalies };
    team.lineup = { forwards: forwardLines, defense: defensePairs, defensePairs, goalies, starter: goalies[0] || null, backup: goalies[1] || null };
    team.specialTeams = {
      powerPlay: [
        makePP([...topForwards.slice(0,3), ...topDefense.slice(0,2)]),
        makePP([...topForwards.slice(3,6), ...topDefense.slice(2,4)]),
      ],
      penaltyKill: [
        makePK([...topForwards.slice(0,2), ...topDefense.slice(0,2)]),
        makePK([...topForwards.slice(2,4), ...topDefense.slice(2,4)]),
      ],
    };
    return team;
  }

  function rebuild(state) {
    if (!state?.teams?.length) return state;

    const level = state.placementLevel || 'A';
    if (state.travelRosterWorldVersion === VERSION) {
      state.teams.forEach(team => {
        applyTeamMeta(team);
        assignCanonicalLineup(team);
      });
      return state;
    }

    const used = new Set();
    const prospects = seededSort(prospectPool(level), `prospects:${state.tryoutDate || ''}:${level}`);
    const others = seededSort(otherWorldPool(level), `world:${state.tryoutDate || ''}:${level}`);
    const career = normalizePlayer(canonicalPlayer());
    career.isCareerPlayer = true;

    for (const team of state.teams) {
      applyTeamMeta(team);
      const meta = CLUB_META[clubId(team)] || {};
      const roster = [];
      const desired = { F:12, D:6, G:2 };

      const addFromPool = (pool, prospectOnly = false) => {
        for (const player of pool) {
          if (roster.length >= 20) break;
          const key = pid(player) || pname(player).toLowerCase();
          if (!key || used.has(key)) continue;
          const bucket = pos(player) === 'G' ? 'G' : pos(player) === 'D' ? 'D' : 'F';
          const count = roster.filter(item => (pos(item) === 'G' ? 'G' : pos(item) === 'D' ? 'D' : 'F') === bucket).length;
          if (count >= desired[bucket]) continue;
          if (prospectOnly && roster.filter(item => item.isRealProspect).length >= 4) break;
          used.add(key);
          roster.push({ ...player, travelStats: player.travelStats || { gp:0, g:0, a:0, pts:0, pim:0, sog:0, wins:0, savePercentage:0 } });
        }
      };

      addFromPool(seededSort(prospects, team.teamId), true);
      addFromPool(seededSort(others, team.teamId));

      while (roster.filter(player => !['D','G'].includes(pos(player))).length < 12) {
        const forwardCount = roster.filter(player => !['D','G'].includes(pos(player))).length;
        roster.push(generated(team, forwardCount, level, meta.strength || 0));
      }
      while (roster.filter(player => pos(player) === 'D').length < 6) {
        const count = roster.filter(player => pos(player) === 'D').length;
        const player = generated(team, 12 + count, level, meta.strength || 0);
        player.position = 'D';
        roster.push(player);
      }
      while (roster.filter(player => pos(player) === 'G').length < 2) {
        const count = roster.filter(player => pos(player) === 'G').length;
        const player = generated(team, 18 + count, level, meta.strength || 0);
        player.position = 'G';
        roster.push(player);
      }

      team.roster = roster.slice(0, 20);
      assignCanonicalLineup(team);
    }

    const mine = state.teams.find(team => String(team.teamId) === String(state.playerTeamId)) || state.teams[0];
    if (mine) {
      mine.roster = mine.roster.filter(player => !player.isCareerPlayer && pid(player) !== pid(career));
      const replaceIndex = mine.roster.findIndex(player => !['D','G'].includes(pos(player)));
      if (replaceIndex >= 0) mine.roster.splice(replaceIndex, 1);
      mine.roster.unshift(career);
      mine.roster = mine.roster.slice(0, 20);
      assignCanonicalLineup(mine);
    }

    state.travelRosterWorldVersion = VERSION;
    WorldEngine.save?.();
    return state;
  }

  const originalEnsure = typeof WorldEngine.ensureTravelHockeyWorld === 'function'
    ? WorldEngine.ensureTravelHockeyWorld.bind(WorldEngine)
    : null;

  if (originalEnsure && !WorldEngine.__travelRosterWorldWrapped) {
    WorldEngine.__travelRosterWorldWrapped = true;
    WorldEngine.ensureTravelHockeyWorld = function(options = {}) {
      const state = originalEnsure(options) || travel();
      return rebuild(state);
    };
  }

  WorldEngine.rebuildTravelHockeyRosters = () => rebuild(travel());

  setTimeout(() => {
    const state = travel();
    if (state?.teams?.length) rebuild(state);
  }, 250);
})();
