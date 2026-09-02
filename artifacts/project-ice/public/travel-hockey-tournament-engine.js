'use strict';

/* global WorldEngine */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  const ROUND_KEYS = ['quarterfinals','semifinals','championship'];
  const ROUND_LABEL = { quarterfinals:'Quarterfinals', semifinals:'Semifinals', championship:'Championship' };

  const travel = () => WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  const dateKey = value => String(value || '').slice(0,10);
  const addDays = (value, days) => {
    const key = dateKey(value);
    const d = /^\d{4}-\d{2}-\d{2}$/.test(key) ? new Date(`${key}T12:00:00`) : new Date();
    d.setDate(d.getDate() + Number(days || 0));
    return d.toISOString().slice(0,10);
  };
  const hash = value => {
    let h = 2166136261;
    for (const ch of String(value || '')) { h ^= ch.charCodeAt(0); h = Math.imul(h,16777619); }
    return h >>> 0;
  };
  const rng = seed => {
    let x = hash(seed) || 1;
    return () => {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      return (x >>> 0) / 4294967296;
    };
  };
  const teamById = (state,id) => (state?.teams || []).find(t => String(t?.teamId || '') === String(id || '')) || null;
  const ovr = p => Number(p?.overall ?? p?.ovr ?? 60) || 60;
  const isGoalie = p => String(p?.position || '').toUpperCase() === 'G';
  const teamStrength = team => {
    const roster = Array.isArray(team?.roster) ? team.roster : [];
    const skaters = roster.filter(p => !isGoalie(p)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,12);
    const goalies = roster.filter(isGoalie).sort((a,b)=>ovr(b)-ovr(a)).slice(0,2);
    const skaterAvg = skaters.length ? skaters.reduce((s,p)=>s+ovr(p),0)/skaters.length : 60;
    const goalieAvg = goalies.length ? goalies.reduce((s,p)=>s+ovr(p),0)/goalies.length : skaterAvg;
    return skaterAvg * 0.82 + goalieAvg * 0.18 + Number(team?.teamStrengthDelta || 0);
  };
  const blankPlayerStats = () => ({gp:0,g:0,a:0,pts:0,pim:0,sog:0,wins:0,savePercentage:0});
  const ensureStats = team => {
    team.travelStats = team.travelStats || {gp:0,w:0,l:0,gf:0,ga:0};
    for (const p of team.roster || []) p.travelStats = { ...blankPlayerStats(), ...(p.travelStats || {}) };
  };
  const weightedPick = (players, random, bonus = () => 0) => {
    if (!players.length) return null;
    const weights = players.map(p => Math.max(1, ovr(p) - 45 + Number(bonus(p) || 0)));
    let target = random() * weights.reduce((a,b)=>a+b,0);
    for (let i=0;i<players.length;i+=1) { target -= weights[i]; if (target <= 0) return players[i]; }
    return players[players.length-1];
  };

  function distributeScoring(team, goals, random) {
    const skaters = (team.roster || []).filter(p => !isGoalie(p));
    if (!skaters.length) return;
    for (const p of skaters) p.travelStats.gp = Number(p.travelStats.gp || 0) + 1;
    for (const p of (team.roster || []).filter(isGoalie)) p.travelStats.gp = Number(p.travelStats.gp || 0) + 1;

    for (let g=0; g<goals; g+=1) {
      const scorer = weightedPick(skaters, random, p => ['C','LW','RW'].includes(String(p.position).toUpperCase()) ? 8 : 0);
      if (!scorer) continue;
      scorer.travelStats.g += 1;
      scorer.travelStats.pts += 1;
      scorer.travelStats.sog += 1 + Math.floor(random()*3);
      const pool1 = skaters.filter(p => p !== scorer);
      const a1 = random() < 0.82 ? weightedPick(pool1, random) : null;
      if (a1) { a1.travelStats.a += 1; a1.travelStats.pts += 1; }
      const pool2 = pool1.filter(p => p !== a1);
      const a2 = random() < 0.48 ? weightedPick(pool2, random) : null;
      if (a2) { a2.travelStats.a += 1; a2.travelStats.pts += 1; }
    }
    for (const p of skaters) {
      p.travelStats.sog += Math.floor(random()*3);
      if (random() < 0.22) p.travelStats.pim += 2;
    }
  }

  function simulateGame(state, series, roundKey) {
    const a = teamById(state, series.teamAId);
    const b = teamById(state, series.teamBId);
    if (!a || !b) return null;
    ensureStats(a); ensureStats(b);

    const gameNumber = Number(series.gamesPlayed || 0) + 1;
    const seed = `${state.tryoutResult?.completedAt || ''}:${series.seriesId}:${gameNumber}`;
    const random = rng(seed);
    const sa = teamStrength(a), sb = teamStrength(b);
    const pA = Math.max(0.18, Math.min(0.82, 0.5 + (sa-sb)*0.028));
    const winnerA = random() < pA;
    let loserGoals = Math.max(0, Math.min(5, Math.floor(random()*4)));
    let winnerGoals = loserGoals + 1 + (random() < 0.22 ? 1 : 0);
    if (winnerGoals < 2 && random() < 0.55) { winnerGoals += 1; loserGoals += 1; }
    const aGoals = winnerA ? winnerGoals : loserGoals;
    const bGoals = winnerA ? loserGoals : winnerGoals;

    distributeScoring(a, aGoals, random);
    distributeScoring(b, bGoals, random);

    const starterA = (a.roster || []).filter(isGoalie).sort((x,y)=>ovr(y)-ovr(x))[0];
    const starterB = (b.roster || []).filter(isGoalie).sort((x,y)=>ovr(y)-ovr(x))[0];
    const shotsA = Math.max(aGoals, 24 + Math.floor(random()*17));
    const shotsB = Math.max(bGoals, 24 + Math.floor(random()*17));
    if (starterA) {
      starterA.travelStats.savePercentage = Math.max(0, Math.min(0.999, (shotsB-bGoals)/shotsB));
      if (winnerA) starterA.travelStats.wins += 1;
    }
    if (starterB) {
      starterB.travelStats.savePercentage = Math.max(0, Math.min(0.999, (shotsA-aGoals)/shotsA));
      if (!winnerA) starterB.travelStats.wins += 1;
    }

    a.travelStats.gp += 1; b.travelStats.gp += 1;
    a.travelStats.gf += aGoals; a.travelStats.ga += bGoals;
    b.travelStats.gf += bGoals; b.travelStats.ga += aGoals;
    if (winnerA) { a.travelStats.w += 1; b.travelStats.l += 1; series.teamAWins = Number(series.teamAWins || 0) + 1; }
    else { b.travelStats.w += 1; a.travelStats.l += 1; series.teamBWins = Number(series.teamBWins || 0) + 1; }

    series.gamesPlayed = gameNumber;
    series.games = Array.isArray(series.games) ? series.games : [];
    series.games.push({
      gameId:`${series.seriesId}-g${gameNumber}`,
      round:roundKey,
      gameNumber,
      date:state.tournament.currentGameDate,
      teamAId:a.teamId,
      teamBId:b.teamId,
      teamAScore:aGoals,
      teamBScore:bGoals,
      winnerTeamId:winnerA ? a.teamId : b.teamId,
      completed:true,
    });
    if (Number(series.teamAWins || 0) >= 2 || Number(series.teamBWins || 0) >= 2) {
      series.status = 'complete';
      series.winnerTeamId = Number(series.teamAWins || 0) > Number(series.teamBWins || 0) ? a.teamId : b.teamId;
    } else {
      series.status = 'active';
    }
    return series.games[series.games.length-1];
  }

  function buildNextRound(state, completedRound) {
    const rounds = state.tournament.rounds;
    if (completedRound === 'quarterfinals' && (!rounds.semifinals || rounds.semifinals.length === 0)) {
      const q = rounds.quarterfinals;
      const pairs = [[q[0]?.winnerTeamId,q[1]?.winnerTeamId],[q[2]?.winnerTeamId,q[3]?.winnerTeamId]];
      rounds.semifinals = pairs.map((pair,i)=>({seriesId:`travel-sf-${i+1}`,teamAId:pair[0],teamBId:pair[1],teamAWins:0,teamBWins:0,gamesPlayed:0,status:'scheduled',bestOf:3,games:[]}));
      state.tournament.activeRound = 'semifinals';
      return;
    }
    if (completedRound === 'semifinals' && (!rounds.championship || rounds.championship.length === 0)) {
      const s = rounds.semifinals;
      rounds.championship = [{seriesId:'travel-final-1',teamAId:s[0]?.winnerTeamId,teamBId:s[1]?.winnerTeamId,teamAWins:0,teamBWins:0,gamesPlayed:0,status:'scheduled',bestOf:3,games:[]}];
      state.tournament.activeRound = 'championship';
      return;
    }
    if (completedRound === 'championship') {
      state.tournament.status = 'complete';
      state.tournament.activeRound = 'complete';
      state.tournament.championTeamId = rounds.championship?.[0]?.winnerTeamId || null;
      state.completed = true;
    }
  }

  function ensureTournamentProgression(options = {}) {
    const state = travel();
    if (!state?.teams?.length || !state?.tournament) return null;
    const t = state.tournament;
    t.progressionVersion = 1;
    t.rounds = t.rounds || {quarterfinals:[],semifinals:[],championship:[]};
    for (const key of ROUND_KEYS) if (!Array.isArray(t.rounds[key])) t.rounds[key] = [];
    if (!t.activeRound || t.activeRound === 'not-started') t.activeRound = 'quarterfinals';
    if (!t.status || t.status === 'not-started') t.status = 'ready';
    const current = dateKey(WorldEngine.state?.season?.currentDate || WorldEngine.state?.player?.currentDate || WorldEngine.state?.currentDate);
    if (!t.currentGameDate) t.currentGameDate = addDays(current, 1);
    if (options.save === true) WorldEngine.save?.();
    return state;
  }

  function nextRoundState(state) {
    const key = state?.tournament?.activeRound || 'quarterfinals';
    const series = state?.tournament?.rounds?.[key] || [];
    const complete = series.length > 0 && series.every(s => s?.status === 'complete');
    return { key, series, complete };
  }

  function simulateNextTournamentDay() {
    const state = ensureTournamentProgression();
    if (!state || state.tournament.status === 'complete') return {success:false,reason:'tournament-complete'};
    let round = nextRoundState(state);
    if (round.complete) { buildNextRound(state, round.key); round = nextRoundState(state); }
    if (!round.series.length) return {success:false,reason:'round-not-ready'};

    const date = state.tournament.currentGameDate;
    const results = [];
    for (const series of round.series) {
      if (series.status === 'complete') continue;
      const result = simulateGame(state, series, round.key);
      if (result) results.push(result);
    }

    if (!WorldEngine.state.season || typeof WorldEngine.state.season !== 'object') WorldEngine.state.season = {};
    WorldEngine.state.season.currentDate = date;
    if (!WorldEngine.state.player || typeof WorldEngine.state.player !== 'object') WorldEngine.state.player = {};
    WorldEngine.state.player.currentDate = date;
    WorldEngine.state.currentDate = date;

    const finished = round.series.length > 0 && round.series.every(s => s.status === 'complete');
    if (finished) buildNextRound(state, round.key);
    if (state.tournament.status !== 'complete') state.tournament.currentGameDate = addDays(date, 2);
    WorldEngine.save?.();
    return {success:true,round:round.key,date,results,tournamentStatus:state.tournament.status};
  }

  function renderControl(state = travel()) {
    if (!state?.tournament || state.completed === true) {
      const champ = state?.tournament?.championTeamId ? teamById(state,state.tournament.championTeamId) : null;
      return champ ? `<div class="pi-travel-progress-control is-complete"><small>Tournament Complete</small><strong>${String(champ.name || 'Champion')}</strong></div>` : '';
    }
    ensureTournamentProgression();
    const key = state.tournament.activeRound || 'quarterfinals';
    const date = state.tournament.currentGameDate || '';
    return `<div class="pi-travel-progress-control"><div><small>Next Tournament Day</small><strong>${ROUND_LABEL[key] || 'Tournament'} · ${date}</strong></div><button type="button" data-travel-tournament-action="simulate-next-day">Sim Day</button></div>`;
  }

  WorldEngine.ensureTravelTournamentProgression = ensureTournamentProgression;
  WorldEngine.simulateNextTravelTournamentDay = simulateNextTournamentDay;
  WorldEngine.renderTravelTournamentProgressionControl = renderControl;

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('[data-travel-tournament-action="simulate-next-day"]');
    if (!button) return;
    button.disabled = true;
    const result = simulateNextTournamentDay();
    if (!result?.success) { button.disabled = false; return; }
    try { WorldEngine.openTravelHockeyHub?.(); } catch (_) { location.reload(); }
  });
})();
