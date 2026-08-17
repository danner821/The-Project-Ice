from pathlib import Path

world_path=Path('artifacts/project-ice/public/world.js')
game_path=Path('artifacts/project-ice/public/game.js')
w=world_path.read_text()
g=game_path.read_text()

# 1) Replace beginNewCareerSave cleanup so stale official pending careers are preserved.
old="""    const previousPendingId = localStorage.getItem(PENDING_CAREER_ID_KEY);

    if (previousPendingId) {
      try {
        const database = await openWorldDatabase();
        await new Promise((resolve, reject) => {
          const transaction = database.transaction(WORLD_STORE_NAME, 'readwrite');
          transaction.objectStore(WORLD_STORE_NAME).delete(getWorldRecordId(previousPendingId));
          transaction.oncomplete = resolve;
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        });
        database.close();
      } catch (error) {
        console.warn('[WorldEngine] Could not clean abandoned pending career:', error);
      }
    }
"""
new="""    const previousPendingId = localStorage.getItem(PENDING_CAREER_ID_KEY);

    if (previousPendingId) {
      try {
        const database = await openWorldDatabase();
        const previousRecord = await new Promise((resolve, reject) => {
          const transaction = database.transaction(WORLD_STORE_NAME, 'readonly');
          const request = transaction.objectStore(WORLD_STORE_NAME).get(getWorldRecordId(previousPendingId));
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });

        const previousWorld = previousRecord?.world || null;
        const previousPlayer = previousWorld?.player || null;
        let previousCareerPlayer = null;

        for (const team of previousWorld?.teams || []) {
          previousCareerPlayer = (team?.roster || []).find(player =>
            player?.isCareerPlayer === true ||
            String(player?.id || player?.playerId || '') === String(previousPlayer?.playerId || previousPlayer?.id || 'career-player')
          );
          if (previousCareerPlayer) break;
        }

        const previousPendingWasOfficial = Boolean(
          previousWorld &&
          (
            previousPlayer?.stage === 'hub' ||
            previousPlayer?.tryoutsComplete === true ||
            previousCareerPlayer?.stage === 'hub' ||
            previousCareerPlayer?.tryoutsComplete === true ||
            (
              (previousCareerPlayer?.firstName || previousPlayer?.firstName) &&
              (previousCareerPlayer?.teamId || previousPlayer?.teamId) &&
              Number(previousCareerPlayer?.overall || previousPlayer?.overall) > 0
            )
          )
        );

        if (previousPendingWasOfficial) {
          upsertCareerSaveMetadata(previousPendingId, previousWorld);
          localStorage.removeItem(PENDING_CAREER_ID_KEY);
        } else {
          await new Promise((resolve, reject) => {
            const transaction = database.transaction(WORLD_STORE_NAME, 'readwrite');
            transaction.objectStore(WORLD_STORE_NAME).delete(getWorldRecordId(previousPendingId));
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
          });
        }

        database.close();
      } catch (error) {
        console.warn('[WorldEngine] Could not inspect/clean abandoned pending career:', error);
      }
    }
"""
if old not in w:
    raise SystemExit('beginNewCareerSave cleanup block not found')
w=w.replace(old,new,1)

# 2) Add preview recovery helper before selectCareerSave.
anchor="""  async function selectCareerSave(careerId) {
"""
helper="""  async function recoverOfficialCareerFromPreview(previewPlayer = {}) {
    const playerName = `${previewPlayer?.firstName || ''} ${previewPlayer?.lastName || ''}`.trim();
    const teamId = previewPlayer?.teamId || previewPlayer?.highSchoolTeamId || null;
    const isOfficialPreview = Boolean(
      playerName &&
      teamId &&
      (
        previewPlayer?.stage === 'hub' ||
        previewPlayer?.tryoutsComplete === true
      )
    );

    if (!isOfficialPreview) return null;

    /* First prefer an existing active/pending id so recovery never duplicates a surviving slot. */
    let careerId =
      getActiveCareerId() ||
      localStorage.getItem(PENDING_CAREER_ID_KEY) ||
      null;

    if (!careerId) {
      careerId = createCareerSaveId();
    }

    localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);
    localStorage.removeItem(PENDING_CAREER_ID_KEY);

    _state = buildDefaults();
    configureFreshCareerSeason('2026-09-02');

    (_state.teams || []).forEach(team => {
      if (!Array.isArray(team.roster) || team.roster.length !== 20) {
        team.roster = generateTeamRoster(team);
      }
    });

    const canonicalPlayer = finalizeFreshCareerAfterTryouts({
      ...previewPlayer,
      stage: 'hub',
      tryoutsComplete: true,
      currentDate: '2026-09-02',
    });

    if (!canonicalPlayer) return null;

    const saved = await save();
    if (!saved) return null;

    upsertCareerSaveMetadata(careerId, _state);
    return buildCareerSaveMetadata(careerId, _state);
  }

"""
if anchor not in w:
    raise SystemExit('selectCareerSave anchor not found')
w=w.replace(anchor,helper+anchor,1)

# 3) Make commitActiveCareerSave await persistence.
old="""  function commitActiveCareerSave() {
    const careerId = getActiveCareerId();
    if (!careerId) return false;

    const pendingCareerId = localStorage.getItem(PENDING_CAREER_ID_KEY);
    if (pendingCareerId === careerId) {
      localStorage.removeItem(PENDING_CAREER_ID_KEY);
    }

    upsertCareerSaveMetadata(careerId, _state);
    save();
    return true;
  }
"""
new="""  async function commitActiveCareerSave() {
    const careerId = getActiveCareerId();
    if (!careerId) return false;

    const pendingCareerId = localStorage.getItem(PENDING_CAREER_ID_KEY);
    if (pendingCareerId === careerId) {
      localStorage.removeItem(PENDING_CAREER_ID_KEY);
    }

    const saved = await save();
    if (!saved) return false;

    upsertCareerSaveMetadata(careerId, _state);
    return true;
  }
"""
if old not in w:
    raise SystemExit('commitActiveCareerSave block not found')
w=w.replace(old,new,1)

# 4) Export recovery helper.
old="""    commitActiveCareerSave,
    finalizeFreshCareerAfterTryouts,
"""
new="""    commitActiveCareerSave,
    recoverOfficialCareerFromPreview,
    finalizeFreshCareerAfterTryouts,
"""
if old not in w:
    raise SystemExit('world export anchor not found')
w=w.replace(old,new,1)

# 5) Career save selection: recover official local preview if list lost it, then rerun list.
old="""async function renderCareerSaveSelection() {
  const saves = await WorldEngine.listCareerSaves();
  careerSaveList.innerHTML = '';
"""
new="""async function renderCareerSaveSelection() {
  let saves = await WorldEngine.listCareerSaves();

  /*
   * The old lightweight preview is a last-resort recovery source only.
   * If a career reached Hub but its IndexedDB/index write was interrupted,
   * rebuild that official career instead of forcing the player to redo tryouts.
   */
  try {
    const rawPreview = localStorage.getItem(SAVE_KEY);
    const previewPlayer = rawPreview
      ? JSON.parse(rawPreview)?.player
      : null;

    const previewName = previewPlayer
      ? `${previewPlayer.firstName || ''} ${previewPlayer.lastName || ''}`.trim()
      : '';
    const previewTeamId = previewPlayer?.teamId || previewPlayer?.highSchoolTeamId || null;
    const previewIsOfficial = Boolean(
      previewName &&
      previewTeamId &&
      (
        previewPlayer?.stage === 'hub' ||
        previewPlayer?.tryoutsComplete === true
      )
    );
    const previewAlreadyListed = previewIsOfficial && saves.some(save =>
      String(save?.playerName || '').trim().toLowerCase() === previewName.toLowerCase()
    );

    if (
      previewIsOfficial &&
      !previewAlreadyListed &&
      typeof WorldEngine.recoverOfficialCareerFromPreview === 'function'
    ) {
      const recovered = await WorldEngine.recoverOfficialCareerFromPreview(previewPlayer);
      if (recovered) {
        saves = await WorldEngine.listCareerSaves();
      }
    }
  } catch (error) {
    console.warn('[Project Ice] Career preview recovery was unavailable:', error);
  }

  careerSaveList.innerHTML = '';
"""
if old not in g:
    raise SystemExit('renderCareerSaveSelection anchor not found')
g=g.replace(old,new,1)

# 6) Begin season handler awaits durable official save before Hub.
old=""".getElementById('btn-begin-season')
.addEventListener('click', () => {
"""
new=""".getElementById('btn-begin-season')
.addEventListener('click', async () => {
"""
if old not in g:
    raise SystemExit('begin-season listener anchor not found')
g=g.replace(old,new,1)

old="""  if (typeof WorldEngine.commitActiveCareerSave === 'function') {
    WorldEngine.commitActiveCareerSave();
  }

  saveCareerPreview();
  showScreen('hub');
"""
new="""  if (typeof WorldEngine.commitActiveCareerSave === 'function') {
    const committed = await WorldEngine.commitActiveCareerSave();
    if (!committed) {
      console.error('[Project Ice] Career could not be durably committed after tryouts.');
      return;
    }
  }

  saveCareerPreview();
  showScreen('hub');
"""
if old not in g:
    raise SystemExit('begin-season commit block not found')
g=g.replace(old,new,1)

world_path.write_text(w)
game_path.write_text(g)
print('patched robust multi-career recovery')
