from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text()
old="""  async function listCareerSaves() {
    let index = readCareerSaveIndex();

    /*
     * LEGACY SINGLE-SAVE → MULTI-SAVE MIGRATION
     *
     * On old installs the title boot has already loaded the IndexedDB
     * `default` world into _state. The first time the player opens
     * Continue Career, preserve that exact loaded world as slot #1.
     * Keeping the legacy record untouched gives us a recovery copy.
     */
    if (index.length === 0) {
      const hasCareerPlayer =
        Boolean(
          getPlayerById(
            _state.player?.playerId ||
            _state.player?.id ||
            'career-player'
          )
        ) ||
        (_state.teams || []).some(team =>
          (team?.roster || []).some(player =>
            player?.isCareerPlayer === true ||
            String(player?.id || player?.playerId || '') === 'career-player'
          )
        );

      if (hasCareerPlayer) {
        const careerId = createCareerSaveId();
        localStorage.setItem(
          ACTIVE_CAREER_ID_KEY,
          careerId
        );

        const migrated = await save();

        if (migrated) {
          index = readCareerSaveIndex();
        }
      }
    }

    const officialIndex = index.filter(item =>
      item?.stage === 'hub' || item?.tryoutsComplete === true
    );

    if (officialIndex.length !== index.length) {
      writeCareerSaveIndex(officialIndex);
    }

    return officialIndex
      .slice()
      .sort((a, b) =>
        String(b?.savedAt || '')
          .localeCompare(
            String(a?.savedAt || '')
          )
      );
  }
"""
new="""  async function listCareerSaves() {
    let index = readCareerSaveIndex();

    /*
     * Recover the visible save index from the authoritative IndexedDB
     * career records before filtering anything. Older careers created
     * before the pending-save lifecycle may have incomplete metadata in
     * localStorage even though their full world is valid and safely stored.
     */
    try {
      const database = await openWorldDatabase();
      const records = await new Promise((resolve, reject) => {
        const transaction = database.transaction(WORLD_STORE_NAME, 'readonly');
        const request = transaction.objectStore(WORLD_STORE_NAME).getAll();
        request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
        request.onerror = () => reject(request.error);
      });
      database.close();

      const recovered = [];
      for (const record of records) {
        const recordId = String(record?.id || '');
        if (!recordId.startsWith('career:') || !record?.world) continue;

        const careerId = recordId.slice('career:'.length);
        const world = record.world;
        const playerId = world?.player?.playerId || world?.player?.id || 'career-player';
        let careerPlayer = null;
        for (const team of world?.teams || []) {
          careerPlayer = (team?.roster || []).find(player =>
            player?.isCareerPlayer === true ||
            String(player?.id || player?.playerId || '') === String(playerId)
          );
          if (careerPlayer) break;
        }

        const isOfficial =
          world?.player?.stage === 'hub' ||
          world?.player?.tryoutsComplete === true ||
          careerPlayer?.stage === 'hub' ||
          careerPlayer?.tryoutsComplete === true ||
          Boolean(careerPlayer?.teamId && careerPlayer?.overall && (careerPlayer?.firstName || world?.player?.firstName));

        if (!isOfficial) continue;
        recovered.push(buildCareerSaveMetadata(careerId, world));
      }

      if (recovered.length > 0) {
        const merged = new Map();
        for (const item of index) if (item?.id) merged.set(item.id, item);
        for (const item of recovered) if (item?.id) merged.set(item.id, item);
        index = Array.from(merged.values());
        writeCareerSaveIndex(index);
      }
    } catch (error) {
      console.warn('[WorldEngine] Could not rebuild career save index from IndexedDB:', error);
    }

    /*
     * LEGACY SINGLE-SAVE → MULTI-SAVE MIGRATION
     */
    if (index.length === 0) {
      const hasCareerPlayer =
        Boolean(
          getPlayerById(
            _state.player?.playerId ||
            _state.player?.id ||
            'career-player'
          )
        ) ||
        (_state.teams || []).some(team =>
          (team?.roster || []).some(player =>
            player?.isCareerPlayer === true ||
            String(player?.id || player?.playerId || '') === 'career-player'
          )
        );

      if (hasCareerPlayer) {
        const careerId = createCareerSaveId();
        localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);
        const migrated = await save();
        if (migrated) index = readCareerSaveIndex();
      }
    }

    const pendingCareerId = localStorage.getItem(PENDING_CAREER_ID_KEY);
    const officialIndex = index.filter(item =>
      item?.id !== pendingCareerId &&
      (item?.stage === 'hub' || item?.tryoutsComplete === true || Boolean(item?.playerName && item.playerName !== 'Unnamed Career' && item?.teamName))
    );

    if (officialIndex.length !== index.length) {
      writeCareerSaveIndex(officialIndex);
    }

    return officialIndex
      .slice()
      .sort((a, b) =>
        String(b?.savedAt || '')
          .localeCompare(
            String(a?.savedAt || '')
          )
      );
  }
"""
if old not in s:
    raise SystemExit('listCareerSaves block not found')
s=s.replace(old,new,1)
p.write_text(s)
print('patched recovery')
