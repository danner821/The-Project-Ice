from pathlib import Path
wp=Path('artifacts/project-ice/public/world.js')
gp=Path('artifacts/project-ice/public/game.js')
w=wp.read_text()
g=gp.read_text()

# Add helpers before listCareerSaves.
anchor='  async function listCareerSaves() {\n'
helper=r'''  function getWorldCareerPlayer(world) {
    if (!world || typeof world !== 'object') return null;
    const playerId = world?.player?.playerId || world?.player?.id || 'career-player';
    for (const team of world?.teams || []) {
      const found = (team?.roster || []).find(player =>
        player?.isCareerPlayer === true ||
        String(player?.id || player?.playerId || '') === String(playerId)
      );
      if (found) return found;
    }
    return null;
  }

  function getCareerIdentity(world) {
    const player = getWorldCareerPlayer(world) || world?.player || {};
    const firstName = String(player?.firstName || world?.player?.firstName || '').trim().toLowerCase();
    const lastName = String(player?.lastName || world?.player?.lastName || '').trim().toLowerCase();
    const teamId = String(player?.teamId || world?.player?.teamId || world?.player?.highSchoolTeamId || '').trim().toLowerCase();
    return { firstName, lastName, teamId };
  }

  function sameCareerIdentity(a, b) {
    const x = getCareerIdentity(a);
    const y = getCareerIdentity(b);
    return Boolean(
      x.firstName && x.lastName && x.teamId &&
      x.firstName === y.firstName &&
      x.lastName === y.lastName &&
      x.teamId === y.teamId
    );
  }

  function getCareerWorldFidelity(world) {
    const player = getWorldCareerPlayer(world) || world?.player || {};
    let score = 0;
    const attrs = player?.attributes && typeof player.attributes === 'object'
      ? Object.values(player.attributes).filter(value => Number.isFinite(Number(value)))
      : [];
    const results = player?.tryoutResults || player?.tryoutProfile?.results || {};
    if (attrs.length >= 8) score += 20;
    if (Number(player?.startingOverall) > 0) score += 12;
    if (Number(player?.overallTryoutScore ?? player?.tryoutProfile?.score) > 0) score += 24;
    if (results && typeof results === 'object' && Object.keys(results).length > 0) score += 24;
    if (player?.startingLine || player?.rosterSlot) score += 12;
    if (player?.lineupAssignment) score += 8;
    if (Number(player?.coachTrust) > 0) score += 6;
    if (world?.season?.processedDates?.length > 0) score += 4;
    return score;
  }

  async function recoverLegacyDefaultCareerRecord() {
    try {
      const database = await openWorldDatabase();
      const records = await new Promise((resolve, reject) => {
        const transaction = database.transaction(WORLD_STORE_NAME, 'readonly');
        const request = transaction.objectStore(WORLD_STORE_NAME).getAll();
        request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
        request.onerror = () => reject(request.error);
      });

      const legacyRecord = records.find(record =>
        String(record?.id || '') === WORLD_RECORD_ID && record?.world
      );
      const legacyWorld = legacyRecord?.world || null;
      const legacyPlayer = getWorldCareerPlayer(legacyWorld);
      const legacyOfficial = Boolean(
        legacyWorld && legacyPlayer &&
        (legacyPlayer?.stage === 'hub' || legacyPlayer?.tryoutsComplete === true ||
         (legacyPlayer?.firstName && legacyPlayer?.teamId && Number(legacyPlayer?.overall) > 0))
      );

      if (!legacyOfficial) {
        database.close();
        return null;
      }

      const careerRecords = records.filter(record =>
        String(record?.id || '').startsWith('career:') && record?.world
      );
      const matching = careerRecords
        .filter(record => sameCareerIdentity(record.world, legacyWorld))
        .sort((a, b) => getCareerWorldFidelity(b.world) - getCareerWorldFidelity(a.world));

      const legacyFidelity = getCareerWorldFidelity(legacyWorld);
      const bestMatching = matching[0] || null;
      const bestMatchingFidelity = bestMatching ? getCareerWorldFidelity(bestMatching.world) : -1;

      let targetCareerId;
      if (bestMatching && legacyFidelity > bestMatchingFidelity) {
        targetCareerId = String(bestMatching.id).slice('career:'.length);
      } else if (bestMatching) {
        database.close();
        return buildCareerSaveMetadata(
          String(bestMatching.id).slice('career:'.length),
          bestMatching.world
        );
      } else {
        targetCareerId = createCareerSaveId();
      }

      const recoveredWorld = JSON.parse(JSON.stringify(legacyWorld));
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(WORLD_STORE_NAME, 'readwrite');
        transaction.objectStore(WORLD_STORE_NAME).put({
          id: getWorldRecordId(targetCareerId),
          world: recoveredWorld,
          savedAt: new Date().toISOString(),
        });
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
      database.close();

      upsertCareerSaveMetadata(targetCareerId, recoveredWorld);
      return buildCareerSaveMetadata(targetCareerId, recoveredWorld);
    } catch (error) {
      console.warn('[WorldEngine] Could not recover legacy exact career record:', error);
      return null;
    }
  }

'''
if anchor not in w: raise SystemExit('listCareerSaves anchor missing')
w=w.replace(anchor,helper+anchor,1)

# Call legacy recovery before current index scan.
old='''  async function listCareerSaves() {
    let index = readCareerSaveIndex();
'''
new='''  async function listCareerSaves() {
    let index = readCareerSaveIndex();

    /* Recover the original single-save world before any synthetic preview fallback. */
    const legacyRecovered = await recoverLegacyDefaultCareerRecord();
    if (legacyRecovered?.id) {
      index = readCareerSaveIndex();
    }
'''
if old not in w: raise SystemExit('list start missing')
w=w.replace(old,new,1)

# Export helper not necessary; internal only.

# Enrich preview with exact post-tryout state for all future recoveries.
old='''      currentDate:
        Game.player.currentDate ||
        WorldEngine.state
          .season
          ?.currentDate ||
        null,
    };'''
new='''      currentDate:
        Game.player.currentDate ||
        WorldEngine.state
          .season
          ?.currentDate ||
        null,

      overall: Number(Game.player.overall) || null,
      startingOverall: Number(Game.player.startingOverall) || Number(Game.player.overall) || null,
      attributes: Game.player.attributes ? { ...Game.player.attributes } : null,
      startingLine: Game.player.startingLine || null,
      rosterSlot: Game.player.rosterSlot || null,
      lineupAssignment: Game.player.lineupAssignment ? { ...Game.player.lineupAssignment } : null,
      lineupStatus: Game.player.lineupStatus || null,
      overallTryoutScore: Number(Game.player.overallTryoutScore) || null,
      overallTryoutGrade: Game.player.overallTryoutGrade || null,
      tryoutResults: Game.player.tryoutResults ? JSON.parse(JSON.stringify(Game.player.tryoutResults)) : null,
      tryoutProfile: Game.player.tryoutProfile ? JSON.parse(JSON.stringify(Game.player.tryoutProfile)) : null,
      coachTrust: Number(Game.player.coachTrust) || null,
      reputationStars: Number(Game.player.reputationStars) || null,
      reputationPoints: Number(Game.player.reputationPoints) || null,
      teamLevel: Game.player.teamLevel || null,
    };'''
if old not in g: raise SystemExit('preview currentDate block missing')
g=g.replace(old,new,1)

wp.write_text(w)
gp.write_text(g)
print('patched exact legacy recovery and rich previews')
