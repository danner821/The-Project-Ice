from pathlib import Path

path = Path('artifacts/project-ice/public/world.js')
text = path.read_text()

start_marker = "      /* Legacy single-world migration: preserve the user's existing career as slot #1. */\n"
end_marker = "      database.close();\n"
start = text.find(start_marker)
if start < 0:
    raise SystemExit('legacy migration start not found')
end = text.find(end_marker, start)
if end < 0:
    raise SystemExit('legacy migration end not found')
end += len(end_marker)

replacement = """      /*
       * Legacy single-world migration: preserve the user's existing
       * pre-multi-save career as the first selectable career slot.
       *
       * With no active career ID, getWorldRecordId() points at the old
       * `default` record. A successful read still has to be copied into
       * a career-specific record and added to the save index.
       */
      if (!getActiveCareerId() && resolvedRecord?.world) {
        const careerId = createCareerSaveId();
        localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);

        await new Promise((resolve, reject) => {
          const transaction = database.transaction(WORLD_STORE_NAME, 'readwrite');
          transaction.objectStore(WORLD_STORE_NAME).put({
            ...resolvedRecord,
            id: getWorldRecordId(careerId),
          });
          transaction.oncomplete = resolve;
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        });

        resolvedRecord = {
          ...resolvedRecord,
          id: getWorldRecordId(careerId),
        };
        upsertCareerSaveMetadata(careerId, resolvedRecord.world);
      }

      /* If a career-specific record is missing, fall back to the old default record once. */
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

      database.close();
"""

path.write_text(text[:start] + replacement + text[end:])
print('fixed multi-save legacy migration')
