from pathlib import Path
import re

path = Path('artifacts/project-ice/public/world.js')
text = path.read_text()

pattern = re.compile(
    r"      let resolvedRecord = storedRecord;\n.*?      database\.close\(\);\n\n      if \(\n        resolvedRecord\?\.world &&\n        typeof storedRecord\.world ===\n          'object'\n      \) \{\n",
    re.S,
)

replacement = """      let resolvedRecord = storedRecord;

      /*
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

      /*
       * If a career-specific record was requested but is missing,
       * make one final compatibility check for the old default record.
       */
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

      if (
        resolvedRecord?.world &&
        typeof resolvedRecord.world ===
          'object'
      ) {
"""

updated, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit(f'multi-save migration block matches: {count}')

path.write_text(updated)
print('fixed multi-save legacy migration')
