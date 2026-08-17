from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text(errors='ignore')
old="""  async function selectCareerSave(careerId) {
    if (!careerId) return false;
    localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);
    const loaded = await load();
    if (loaded) {
      repairMalformedFreshCareerIfNeeded();
    }
    return loaded;
  }
"""
new="""  async function selectCareerSave(careerId) {
    if (!careerId) return false;

    /*
     * Multi-save compatibility:
     * older/recovered indexes may contain either the logical career id
     * (`career-...`) or the physical IndexedDB record id
     * (`career:career-...`). Normalize before making it active.
     */
    const requestedId = String(careerId);
    const normalizedCareerId = requestedId.startsWith('career:')
      ? requestedId.slice('career:'.length)
      : requestedId;

    localStorage.setItem(ACTIVE_CAREER_ID_KEY, normalizedCareerId);

    let loaded = await load();

    /*
     * If the normal loader cannot find the record, probe both historical
     * key shapes directly. This is read-only recovery; the saved world is
     * not replaced or reset.
     */
    if (!loaded) {
      try {
        const database = await openWorldDatabase();
        const candidateKeys = Array.from(new Set([
          getWorldRecordId(normalizedCareerId),
          requestedId,
          `career:${requestedId}`,
        ]));

        let recoveredRecord = null;
        for (const key of candidateKeys) {
          recoveredRecord = await new Promise((resolve, reject) => {
            const transaction = database.transaction(WORLD_STORE_NAME, 'readonly');
            const request = transaction.objectStore(WORLD_STORE_NAME).get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
          });
          if (recoveredRecord?.world) break;
        }
        database.close();

        if (recoveredRecord?.world) {
          _state = {
            ...buildDefaults(),
            ...recoveredRecord.world,
          };
          ensureCanonicalSeasonState(_state);
          localStorage.removeItem(WORLD_KEY);
          upsertCareerSaveMetadata(normalizedCareerId, _state);
          loaded = true;
        }
      } catch (error) {
        console.error('[WorldEngine] Direct career record recovery failed:', error);
      }
    }

    if (loaded) {
      repairMalformedFreshCareerIfNeeded();
    }

    return loaded;
  }
"""
if old not in s:
    raise SystemExit('selectCareerSave anchor not found')
s=s.replace(old,new,1)
p.write_text(s)
print('patched career record id compatibility')
