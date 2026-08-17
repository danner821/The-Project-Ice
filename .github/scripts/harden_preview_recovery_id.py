from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text()
old="""    /* First prefer an existing active/pending id so recovery never duplicates a surviving slot. */
    let careerId =
      getActiveCareerId() ||
      localStorage.getItem(PENDING_CAREER_ID_KEY) ||
      null;

    if (!careerId) {
      careerId = createCareerSaveId();
    }

    localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);
"""
new="""    /*
     * Prefer the active/pending id only when it is empty or already belongs
     * to this preview. Never overwrite another valid career during recovery.
     */
    let careerId =
      getActiveCareerId() ||
      localStorage.getItem(PENDING_CAREER_ID_KEY) ||
      null;

    if (careerId) {
      try {
        const database = await openWorldDatabase();
        const existingRecord = await new Promise((resolve, reject) => {
          const transaction = database.transaction(WORLD_STORE_NAME, 'readonly');
          const request = transaction.objectStore(WORLD_STORE_NAME).get(getWorldRecordId(careerId));
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
        database.close();

        const existingWorld = existingRecord?.world || null;
        const existingName = `${existingWorld?.player?.firstName || ''} ${existingWorld?.player?.lastName || ''}`.trim();
        const existingHasDifferentOfficialCareer = Boolean(
          existingWorld &&
          existingName &&
          existingName.toLowerCase() !== playerName.toLowerCase() &&
          (
            existingWorld?.player?.stage === 'hub' ||
            existingWorld?.player?.tryoutsComplete === true
          )
        );

        if (existingHasDifferentOfficialCareer) {
          careerId = null;
        }
      } catch (error) {
        console.warn('[WorldEngine] Could not verify recovery career id; using a new slot.', error);
        careerId = null;
      }
    }

    if (!careerId) {
      careerId = createCareerSaveId();
    }

    localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);
"""
if old not in s: raise SystemExit('recovery id block not found')
p.write_text(s.replace(old,new,1))
