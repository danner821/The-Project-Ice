from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text()

anchor='''  function buildLivingWorldWeeklySnapshot(processedAtDate) {\n'''
block=r'''  function getLivingWorldPlayerStats(player = {}) {
    const stats = player.seasonStats || player.stats || {};
    const goals = Math.max(0, Number(stats.goals ?? stats.g ?? player.goals) || 0);
    const assists = Math.max(0, Number(stats.assists ?? stats.a ?? player.assists) || 0);
    const points = Math.max(0, Number(stats.points ?? stats.pts ?? player.points) || (goals + assists));
    return {
      gamesPlayed: Math.max(0, Number(stats.gamesPlayed ?? stats.gp ?? player.gamesPlayed) || 0),
      goals,
      assists,
      points,
      plusMinus: Number(stats.plusMinus ?? player.plusMinus) || 0,
      wins: Math.max(0, Number(stats.wins ?? player.wins) || 0),
      losses: Math.max(0, Number(stats.losses ?? player.losses) || 0),
      savePercentage: Math.max(0, Number(stats.savePercentage ?? stats.svPct ?? player.savePercentage) || 0),
      goalsAgainstAverage: Math.max(0, Number(stats.goalsAgainstAverage ?? stats.gaa ?? player.goalsAgainstAverage) || 0),
      shutouts: Math.max(0, Number(stats.shutouts ?? player.shutouts) || 0),
    };
  }

  function buildLivingWorldAwardRaces(dateString, weekKey) {
    const livingWorld = ensureLivingWorldState();
    if (!Array.isArray(livingWorld.awardRaceSnapshots)) livingWorld.awardRaceSnapshots = [];

    const players = (_state.teams || []).flatMap(team =>
      (Array.isArray(team?.roster) ? team.roster : []).map(player => ({
        player,
        teamId: team.teamId,
      }))
    );

    const previousSnapshot = livingWorld.awardRaceSnapshots.length
      ? livingWorld.awardRaceSnapshots[livingWorld.awardRaceSnapshots.length - 1]
      : null;

    const playerId = player => String(player?.id || player?.playerId || '');
    const position = player => normalizeAttributePosition(player?.position);
    const overall = player => Math.max(0, Number(player?.overall) || 0);
    const reputation = player => Math.max(0, Number(player?.reputationPoints) || ((Number(player?.reputationStars) || 0) * 20));

    const snapshotPlayer = (entry, rank, score, previousRank) => ({
      rank,
      previousRank: previousRank || null,
      rankChange: previousRank ? previousRank - rank : 0,
      playerId: playerId(entry.player),
      teamId: entry.teamId || entry.player?.teamId || null,
      firstName: entry.player?.firstName || '',
      lastName: entry.player?.lastName || '',
      position: entry.player?.position || '',
      overall: overall(entry.player),
      score: Number(score.toFixed(3)),
      stats: getLivingWorldPlayerStats(entry.player),
    });

    const makeRace = (key, label, eligible, scoreFunction) => {
      const priorRace = previousSnapshot?.races?.find(race => race.key === key) || null;
      const priorRanks = new Map((priorRace?.contenders || []).map(item => [String(item.playerId), Number(item.rank)]));
      const contenders = players
        .filter(entry => eligible(entry.player, getLivingWorldPlayerStats(entry.player)))
        .map(entry => ({ entry, score: scoreFunction(entry.player, getLivingWorldPlayerStats(entry.player)) }))
        .sort((a,b) => (b.score - a.score) || (overall(b.entry.player) - overall(a.entry.player)) || playerId(a.entry.player).localeCompare(playerId(b.entry.player)))
        .slice(0, 5)
        .map((item,index) => snapshotPlayer(item.entry, index + 1, item.score, priorRanks.get(playerId(item.entry.player))));
      return { key, label, contenders };
    };

    const races = [
      makeRace(
        'mvp',
        'Most Valuable Player',
        (player, stats) => position(player) !== 'G' && stats.gamesPlayed > 0,
        (player, stats) => stats.points * 5 + stats.goals * 2 + stats.plusMinus * 0.35 + overall(player) * 0.08 + reputation(player) * 0.025
      ),
      makeRace(
        'goal_scorer',
        'Top Goal Scorer',
        (player, stats) => position(player) !== 'G' && stats.gamesPlayed > 0,
        (player, stats) => stats.goals * 100 + stats.points
      ),
      makeRace(
        'defenseman',
        'Top Defenseman',
        (player, stats) => position(player) === 'D' && stats.gamesPlayed > 0,
        (player, stats) => stats.points * 3 + stats.plusMinus * 1.25 + overall(player) * 0.22
      ),
      makeRace(
        'goalie',
        'Top Goaltender',
        (player, stats) => position(player) === 'G' && stats.gamesPlayed > 0,
        (player, stats) => stats.wins * 8 + stats.savePercentage * 100 + stats.shutouts * 12 + Math.max(0, 5 - stats.goalsAgainstAverage) * 4 + overall(player) * 0.08
      ),
    ];

    const snapshot = {
      weekKey,
      date: normalizeLivingWorldDateKey(dateString),
      races,
    };

    const previousByKey = new Map((previousSnapshot?.races || []).map(race => [race.key, race]));
    const careerPlayer = getCareerPlayerFromWorldState();
    const careerId = String(careerPlayer?.id || careerPlayer?.playerId || '');

    races.forEach(race => {
      const previousRace = previousByKey.get(race.key) || null;
      const oldLeader = previousRace?.contenders?.[0] || null;
      const newLeader = race.contenders?.[0] || null;

      if (
        oldLeader?.playerId &&
        newLeader?.playerId &&
        String(oldLeader.playerId) !== String(newLeader.playerId)
      ) {
        livingWorld.recentBeats.push({
          type: 'award_leader_change',
          weekKey,
          date: snapshot.date,
          awardKey: race.key,
          awardLabel: race.label,
          previousLeaderId: oldLeader.playerId,
          newLeaderId: newLeader.playerId,
        });
      }

      const careerContender = race.contenders.find(item => String(item.playerId) === careerId) || null;
      const previousCareer = previousRace?.contenders?.find(item => String(item.playerId) === careerId) || null;
      if (
        careerContender &&
        careerContender.rank <= 3 &&
        (!previousCareer || previousCareer.rank > 3)
      ) {
        livingWorld.recentBeats.push({
          type: 'career_award_race_entry',
          weekKey,
          date: snapshot.date,
          playerId: careerId,
          awardKey: race.key,
          awardLabel: race.label,
          rank: careerContender.rank,
        });
      }
    });

    livingWorld.awardRaceSnapshots.push(snapshot);
    livingWorld.awardRaceSnapshots = livingWorld.awardRaceSnapshots.slice(-60);
    livingWorld.currentAwardRaces = structuredClone(races);
    livingWorld.recentBeats = livingWorld.recentBeats.slice(-180);

    return snapshot;
  }

  function getLivingWorldLineupDescriptor(player = {}) {
    const assignment = player.lineupAssignment && typeof player.lineupAssignment === 'object'
      ? player.lineupAssignment
      : {};
    const slot = player.rosterSlot || player.slot || null;
    const line = Number(assignment.line ?? assignment.lineNumber ?? player.lineNumber ?? player.startingLine) || null;
    const pair = Number(assignment.pair ?? assignment.pairNumber ?? player.pairNumber) || null;
    const unit = assignment.unit || assignment.type || null;
    const role = assignment.role || player.lineupRole || player.lineupStatus || null;
    const label =
      slot ||
      (line ? `${unit || 'Line'} ${line}` : null) ||
      (pair ? `Pair ${pair}` : null) ||
      role ||
      'Unassigned';
    return {
      slot,
      line,
      pair,
      unit,
      role,
      label: String(label),
      signature: JSON.stringify({ slot, line, pair, unit, role }),
    };
  }

  function processLivingWorldLineupMovement(dateString, weekKey) {
    const livingWorld = ensureLivingWorldState();
    if (!Array.isArray(livingWorld.lineupSnapshots)) livingWorld.lineupSnapshots = [];

    /* Refresh the canonical depth chart before snapshotting it. */
    (_state.teams || []).forEach(team => {
      if (team?.teamId) {
        refreshTeamRosterManagement(team.teamId, { save: false });
      }
    });

    const previous = livingWorld.lineupSnapshots.length
      ? livingWorld.lineupSnapshots[livingWorld.lineupSnapshots.length - 1]
      : null;
    const priorById = new Map((previous?.players || []).map(item => [String(item.playerId), item]));
    const careerPlayer = getCareerPlayerFromWorldState();
    const careerId = String(careerPlayer?.id || careerPlayer?.playerId || '');
    const changes = [];

    const players = (_state.teams || []).flatMap(team =>
      (Array.isArray(team?.roster) ? team.roster : []).map(player => {
        const descriptor = getLivingWorldLineupDescriptor(player);
        const id = String(player?.id || player?.playerId || '');
        const current = {
          playerId: id,
          teamId: team.teamId || player?.teamId || null,
          firstName: player?.firstName || '',
          lastName: player?.lastName || '',
          position: player?.position || '',
          ...descriptor,
        };
        const prior = priorById.get(id) || null;
        if (prior && prior.signature !== current.signature) {
          const change = {
            playerId: id,
            teamId: current.teamId,
            from: prior,
            to: current,
          };
          changes.push(change);

          /* Career depth movement is always meaningful to the career world. */
          if (id && id === careerId) {
            livingWorld.recentBeats.push({
              type: 'career_lineup_change',
              weekKey,
              date: normalizeLivingWorldDateKey(dateString),
              playerId: id,
              teamId: current.teamId,
              fromLabel: prior.label,
              toLabel: current.label,
              fromLine: prior.line,
              toLine: current.line,
              fromPair: prior.pair,
              toPair: current.pair,
            });
          }
        }
        return current;
      })
    );

    const snapshot = {
      weekKey,
      date: normalizeLivingWorldDateKey(dateString),
      players,
      changes,
    };

    livingWorld.lineupSnapshots.push(snapshot);
    livingWorld.lineupSnapshots = livingWorld.lineupSnapshots.slice(-60);
    livingWorld.recentBeats = livingWorld.recentBeats.slice(-180);

    return snapshot;
  }

'''
if anchor not in s: raise SystemExit('snapshot anchor missing')
if 'function buildLivingWorldAwardRaces' not in s:
    s=s.replace(anchor,block+anchor,1)

# Process weekly lineup and awards after scouting has settled, before snapshot/news.
old='''    processScoutingWeek(normalizedDate);\n\n    const snapshot = buildLivingWorldWeeklySnapshot(normalizedDate);'''
new='''    processScoutingWeek(normalizedDate);\n\n    const lineupSnapshot = processLivingWorldLineupMovement(normalizedDate, weekKey);\n    const awardRaceSnapshot = buildLivingWorldAwardRaces(normalizedDate, weekKey);\n\n    const snapshot = buildLivingWorldWeeklySnapshot(normalizedDate);\n    if (snapshot) {\n      snapshot.lineupChanges = structuredClone(lineupSnapshot?.changes || []);\n      snapshot.awardRaces = structuredClone(awardRaceSnapshot?.races || []);\n    }'''
if old not in s: raise SystemExit('weekly processing anchor missing')
s=s.replace(old,new,1)

# Extend news translator's beat loop with award and career lineup events.
old=r'''      if (beat?.type === 'potential_update') {
        const player = getPlayer(beat.playerId);
        const role =
          beat.potentialRoleAfter ||
          beat.newRole ||
          beat.roleAfter ||
          player?.development?.potentialRole ||
          player?.potentialRole ||
          'a new projection';
        const direction = Number(beat.change || beat.potentialChange || 0);
        const verb = direction < 0 ? 'revised to' : 'elevated to';
        publishOnce(
          `potential:${weekKey}:${beat.playerId || index}:${role}`,
          'SCOUTING',
          `${playerName(player)}'s potential is ${verb} ${role}.`
        );
      }
'''
new=old+r'''
      if (beat?.type === 'award_leader_change') {
        const player = getPlayer(beat.newLeaderId);
        publishOnce(
          `award:${weekKey}:${beat.awardKey}:${beat.newLeaderId}`,
          'AWARDS',
          `${playerName(player)} moves into the lead for ${beat.awardLabel || 'a major league award'}.`
        );
      }

      if (beat?.type === 'career_award_race_entry') {
        const player = getPlayer(beat.playerId);
        publishOnce(
          `award-entry:${weekKey}:${beat.awardKey}:${beat.playerId}`,
          'AWARDS',
          `${playerName(player)} enters the top three in the ${beat.awardLabel || 'award'} race.`
        );
      }

      if (beat?.type === 'career_lineup_change') {
        const player = getPlayer(beat.playerId);
        publishOnce(
          `lineup:${weekKey}:${beat.playerId}:${beat.toLabel}`,
          'TEAM',
          `${playerName(player)} moves from ${beat.fromLabel || 'the previous role'} to ${beat.toLabel || 'a new lineup role'}.`
        );
      }
'''
if old not in s: raise SystemExit('news beat loop potential anchor missing')
s=s.replace(old,new,1)

p.write_text(s)
print('added canonical weekly award races and lineup movement')
