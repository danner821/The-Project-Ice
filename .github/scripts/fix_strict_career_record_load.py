from pathlib import Path

ROOT = Path('artifacts/project-ice/public')
world_path = ROOT / 'world.js'
persist_path = ROOT / 'career-persistence.js'

world = world_path.read_text(encoding='utf-8')

anchor = """      let resolvedRecord = storedRecord;

      /*
       * Legacy single-world migration: preserve the user's existing
"""
insert = """      let resolvedRecord = storedRecord;

      /*
       * STRICT CAREER RECORD AUTHORITY
       * ------------------------------
       * If localStorage says an active career exists, only that exact
       * career:<id> IndexedDB record is allowed to load. The legacy default
       * record is migration-only history and must never be used as a fallback
       * for a missing active career record.
       *
       * Likewise, if the active-id key is missing but any career:* record
       * already exists, do not clone the stale default world into a brand-new
       * career. Continue Career will rebuild its list directly from IndexedDB
       * and let the user choose the real career.
       */
      const activeCareerIdAtLoad = getActiveCareerId();

      const careerRecordsAtLoad = await new Promise((resolve, reject) => {
        const transaction = database.transaction(WORLD_STORE_NAME, 'readonly');
        const request = transaction.objectStore(WORLD_STORE_NAME).getAll();

        request.onsuccess = () => resolve(
          (Array.isArray(request.result) ? request.result : []).filter(record =>
            String(record?.id || '').startsWith('career:') &&
            record?.world
          )
        );

        request.onerror = () => reject(
          request.error ||
          new Error('Project Ice could not inspect career records during load.')
        );
      });

      if (activeCareerIdAtLoad && !resolvedRecord?.world) {
        console.warn(
          '[WorldEngine] Refusing stale default fallback for missing active career record.',
          {
            activeCareerId: activeCareerIdAtLoad,
            requestedRecordId: getWorldRecordId(activeCareerIdAtLoad),
            availableCareerRecords: careerRecordsAtLoad.map(record => record.id),
          }
        );
        database.close();
        return false;
      }

      if (
        !activeCareerIdAtLoad &&
        resolvedRecord?.world &&
        careerRecordsAtLoad.length > 0
      ) {
        console.warn(
          '[WorldEngine] Legacy default record ignored because career-specific records already exist.',
          {
            availableCareerRecords: careerRecordsAtLoad.map(record => record.id),
          }
        );
        database.close();
        return false;
      }

      /*
       * Once an exact career record has loaded successfully, the legacy
       * default record has no remaining authority and only creates corruption
       * risk. Delete it so future startup paths cannot resurrect it.
       */
      if (activeCareerIdAtLoad && resolvedRecord?.world) {
        await new Promise((resolve, reject) => {
          const transaction = database.transaction(WORLD_STORE_NAME, 'readwrite');
          transaction.objectStore(WORLD_STORE_NAME).delete(WORLD_RECORD_ID);
          transaction.oncomplete = resolve;
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        });
      }

      /*
       * Legacy single-world migration: preserve the user's existing
"""
if anchor not in world:
    raise SystemExit('world.js load anchor not found')
world = world.replace(anchor, insert, 1)

world = world.replace(
    "        localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);",
    "        bindActiveCareerId(careerId);",
    1
)

old_fallback = """      /* If a career-specific record is missing, fall back to the old default record once. */
      if (!resolvedRecord?.world) {
        const legacyRecord = await new Promise((resolve, reject) => {
          const transaction = database.transaction(WORLD_STORE_NAME, 'readonly');
          const request = transaction.objectStore(WORLD_STORE_NAME).get(WORLD_RECORD_ID);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });

        if (legacyRecord?.world) {
          let careerId = getActiveCareerId();
          if (!careerId) {
            careerId = createCareerSaveId();
            localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);
          }

          await new Promise((resolve, reject) => {
            const transaction = database.transaction(WORLD_STORE_NAME, 'readwrite');
            transaction.objectStore(WORLD_STORE_NAME).put({
              ...legacyRecord,
              id: getWorldRecordId(careerId),
            });
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
          });

          resolvedRecord = {
            ...legacyRecord,
            id: getWorldRecordId(careerId),
          };
          upsertCareerSaveMetadata(careerId, legacyRecord.world);
        }
      }
"""
new_fallback = """      /*
       * No generic legacy fallback is permitted here.
       * At this point either:
       *   - the exact active career record already loaded, or
       *   - there is no authoritative career to load.
       *
       * The only allowed default -> career migration is the explicit
       * zero-career-record migration above.
       */
"""
if old_fallback not in world:
    raise SystemExit('world.js legacy fallback block not found')
world = world.replace(old_fallback, new_fallback, 1)

world_path.write_text(world, encoding='utf-8')

persist = persist_path.read_text(encoding='utf-8')
persist = persist.replace(
    "  const RECORD_ID = 'default';\n",
    "  const RECORD_ID = 'default';\n  const ACTIVE_CAREER_ID_KEY = 'projectice_active_career_id_v1';\n",
    1
)

old_reader = """  async function readWorldRecord() {
    const database = await openDatabase();

    try {
      return await new Promise((resolve, reject) => {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          resolve(null);
          return;
        }

        const transaction = database.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(RECORD_ID);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(
          request.error || new Error('Could not read Project Ice world record.')
        );
      });
    } finally {
      database.close();
    }
  }
"""
new_reader = """  async function readWorldRecord() {
    const database = await openDatabase();

    try {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        return null;
      }

      const activeCareerId =
        localStorage.getItem(ACTIVE_CAREER_ID_KEY) ||
        null;

      const records = await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const request = transaction.objectStore(STORE_NAME).getAll();

        request.onsuccess = () => resolve(
          Array.isArray(request.result)
            ? request.result
            : []
        );

        request.onerror = () => reject(
          request.error ||
          new Error('Could not read Project Ice world records.')
        );
      });

      const careerRecords = records
        .filter(record =>
          String(record?.id || '').startsWith('career:') &&
          record?.world
        )
        .sort((a, b) =>
          String(b?.savedAt || '').localeCompare(String(a?.savedAt || ''))
        );

      if (activeCareerId) {
        const exact = careerRecords.find(record =>
          String(record.id) === `career:${activeCareerId}`
        );

        if (exact) {
          return exact;
        }
      }

      if (careerRecords.length > 0) {
        return careerRecords[0];
      }

      /*
       * The old default record is a migration source only. It is considered
       * only when no career-specific record exists at all.
       */
      return records.find(record =>
        String(record?.id || '') === RECORD_ID &&
        record?.world
      ) || null;
    } finally {
      database.close();
    }
  }
"""
if old_reader not in persist:
    raise SystemExit('career-persistence readWorldRecord anchor not found')
persist = persist.replace(old_reader, new_reader, 1)
persist_path.write_text(persist, encoding='utf-8')

# Bump explicit runtime cache keys so iPhone standalone / Cloudflare clients
# cannot reuse the previous persistence scripts.
index_path = Path('artifacts/project-ice/index.html')
index = index_path.read_text(encoding='utf-8')
index = index.replace(
    '/world.js?v=20260919-no-legacy-overwrite-1',
    '/world.js?v=20260919-strict-career-record-1'
)
if '/career-persistence.js?' in index:
    pass
elif '<script src="/career-persistence.js"></script>' in index:
    index = index.replace(
        '<script src="/career-persistence.js"></script>',
        '<script src="/career-persistence.js?v=20260919-strict-career-record-1"></script>'
    )
index_path.write_text(index, encoding='utf-8')

# Remove one-time migration plumbing in the final commit.
Path('.github/scripts/fix_strict_career_record_load.py').unlink(missing_ok=True)
Path('.github/workflows/fix-strict-career-record-load.yml').unlink(missing_ok=True)
