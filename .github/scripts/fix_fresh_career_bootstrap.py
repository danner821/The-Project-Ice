from pathlib import Path

world_path=Path('artifacts/project-ice/public/world.js')
game_path=Path('artifacts/project-ice/public/game.js')
w=world_path.read_text()
g=game_path.read_text()

anchor="""  async function selectCareerSave(careerId) {
    if (!careerId) return false;
    localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);
    return load();
  }

"""
helper="""  function configureFreshCareerSeason(startDate = '2026-09-01') {
    const seasonStartYear = 2026;
    const seasonEndYear = 2027;

    _state.currentSeason = '2026-27';
    _state.currentYear = seasonStartYear;
    _state.currentWeek = 1;
    _state.currentDate = startDate;

    _state.season = {
      id: 'season-2026-2027',
      label: '2026-27',
      seasonNumber: 1,
      careerYear: 1,
      seasonStartYear,
      seasonEndYear,
      currentDate: startDate,
      currentWeek: 1,
      phase: 'regular-season',
      status: 'active',
      level: 'high-school',
      regularSeason: {
        started: false,
        completed: false,
        gamesPerTeam: 28,
      },
      postseason: {
        qualified: false,
        started: false,
        completed: false,
      },
      processedDates: [],
      processedWeeks: [],
      weeklyHistory: [],
      unresolvedEventIds: [],
      completedEventIds: [],
      lastProcessedDate: null,
      lastProcessedWeek: 0,
    };

    if (!_state.player || typeof _state.player !== 'object') {
      _state.player = {};
    }
    _state.player.currentDate = startDate;

    _state.schedule = createHighSchoolCareerSchedule(
      Array.isArray(_state.teams) ? _state.teams : []
    );

    setCurrentDate(startDate, { save: false });
    return _state.season;
  }

  function finalizeFreshCareerAfterTryouts(playerData = {}) {
    configureFreshCareerSeason('2026-09-02');

    (_state.teams || []).forEach(team => {
      if (!Array.isArray(team.roster) || team.roster.length !== 20) {
        team.roster = generateTeamRoster(team);
      }
    });

    const canonicalPlayer = upsertCareerPlayer({
      ...playerData,
      stage: 'hub',
      tryoutsComplete: true,
      currentDate: '2026-09-02',
    });

    if (!canonicalPlayer) return null;

    _state.player = {
      ..._state.player,
      ...playerData,
      id: canonicalPlayer.id,
      playerId: canonicalPlayer.playerId,
      teamId: canonicalPlayer.teamId,
      highSchoolTeamId: canonicalPlayer.teamId,
      firstName: canonicalPlayer.firstName,
      lastName: canonicalPlayer.lastName,
      position: canonicalPlayer.position,
      stage: 'hub',
      tryoutsComplete: true,
      currentDate: '2026-09-02',
    };

    canonicalPlayer.stage = 'hub';
    canonicalPlayer.tryoutsComplete = true;
    canonicalPlayer.currentDate = '2026-09-02';

    if (!_state.season.processedDates.includes('2026-09-01')) {
      _state.season.processedDates.push('2026-09-01');
    }
    if (!_state.season.completedEventIds.includes('tryout-freshman')) {
      _state.season.completedEventIds.push('tryout-freshman');
    }
    _state.season.lastProcessedDate = '2026-09-01';

    setCurrentDate('2026-09-02', { save: false });
    refreshTeamRosterManagement(canonicalPlayer.teamId, { save: false });
    save();

    return canonicalPlayer;
  }

  function repairMalformedFreshCareerIfNeeded() {
    const careerPlayerId =
      _state.player?.playerId ||
      _state.player?.id ||
      'career-player';
    const careerPlayer = getPlayerById(careerPlayerId);
    if (!careerPlayer) return false;

    const isOfficial =
      _state.player?.stage === 'hub' ||
      _state.player?.tryoutsComplete === true ||
      careerPlayer.stage === 'hub' ||
      careerPlayer.tryoutsComplete === true;
    const gamesPlayed = Number(careerPlayer.gamesPlayed) || 0;
    const currentDate = String(
      _state.season?.currentDate ||
      _state.player?.currentDate ||
      _state.currentDate ||
      ''
    );
    const populatedRosterCount = (_state.teams || []).reduce(
      (total, team) => total + (Array.isArray(team.roster) ? team.roster.length : 0),
      0
    );
    const expectedRosterCount = Math.max(1, (_state.teams || []).length) * 18;

    const malformedFreshBootstrap =
      isOfficial &&
      gamesPlayed === 0 &&
      (currentDate.startsWith('2022-') || populatedRosterCount < expectedRosterCount);

    if (!malformedFreshBootstrap) return false;

    const repaired = finalizeFreshCareerAfterTryouts({
      ..._state.player,
      ...careerPlayer,
    });
    return Boolean(repaired);
  }

  async function selectCareerSave(careerId) {
    if (!careerId) return false;
    localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);
    const loaded = await load();
    if (loaded) {
      repairMalformedFreshCareerIfNeeded();
    }
    return loaded;
  }

"""
if anchor not in w:
    raise SystemExit('selectCareerSave anchor not found')
w=w.replace(anchor,helper,1)

old="""    _state = buildDefaults();
    ensureCanonicalSeasonState(_state);
    if (!_state.player) _state.player = {};
    _state.player.currentDate = '2026-09-01';

    return careerId;
"""
new="""    _state = buildDefaults();
    configureFreshCareerSeason('2026-09-01');

    return careerId;
"""
if old not in w:
    raise SystemExit('beginNewCareerSave date block not found')
w=w.replace(old,new,1)

old="""    beginNewCareerSave,
    commitActiveCareerSave,
    deleteCareerSave,
"""
new="""    beginNewCareerSave,
    commitActiveCareerSave,
    finalizeFreshCareerAfterTryouts,
    repairMalformedFreshCareerIfNeeded,
    deleteCareerSave,
"""
if old not in w:
    raise SystemExit('public api anchor not found')
w=w.replace(old,new,1)

old="""  const canonicalPlayer =
    WorldEngine.upsertCareerPlayer({
      ...Game.player,

      playerId:
        Game.player.playerId ||
        Game.player.id ||
        'career-player',
    });
"""
new="""  const canonicalPlayer =
    WorldEngine.finalizeFreshCareerAfterTryouts({
      ...Game.player,

      playerId:
        Game.player.playerId ||
        Game.player.id ||
        'career-player',
    });
"""
if old not in g:
    raise SystemExit('Begin Season upsert anchor not found')
g=g.replace(old,new,1)

# Modify the specific hub-finalization object nearest the Begin Season handler.
needle="""    reputationPoints:
      canonicalPlayer.reputationPoints,

    stage: 'hub',
    tryoutsComplete: true,
  };
"""
replacement="""    reputationPoints:
      canonicalPlayer.reputationPoints,

    stage: 'hub',
    tryoutsComplete: true,
    currentDate: '2026-09-02',
  };
"""
if needle not in g:
    raise SystemExit('Game.player finalization anchor not found')
g=g.replace(needle,replacement,1)

world_path.write_text(w)
game_path.write_text(g)
print('patched fresh career bootstrap')
