'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const DB_NAME = 'projectice_database';
  const DB_VERSION = 1;
  const STORE_NAME = 'worlds';
  const CAREER_SAVE_INDEX_KEY = 'projectice_career_save_index_v1';
  const CLEANUP_MARKER_KEY = 'projectice_dev_save_cleanup_20260830_v1';
  const TARGET_NAME = 'danner stephenson';
  const KEEP_DATE = '2027-04-28';
  const REMOVE_DATES = new Set(['2027-04-29', '2027-06-05']);

  const dateKey = value => String(value || '').slice(0, 10);

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open Project Ice IndexedDB.'));
    });
  }

  function deleteRecord(db, id) {
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        resolve(false);
        return;
      }
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error(`Could not delete ${id}.`));
      tx.onabort = () => reject(tx.error || new Error(`Delete aborted for ${id}.`));
    });
  }

  function cleanVisibleIndex(idsToRemove) {
    try {
      const parsed = JSON.parse(localStorage.getItem(CAREER_SAVE_INDEX_KEY) || '[]');
      if (!Array.isArray(parsed)) return;
      const cleaned = parsed.filter(item => !idsToRemove.has(String(item?.id || '')));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(CAREER_SAVE_INDEX_KEY, JSON.stringify(cleaned));
      }
    } catch (error) {
      console.warn('[Project Ice] Could not clean visible career index:', error);
    }
  }

  async function cleanup() {
    if (localStorage.getItem(CLEANUP_MARKER_KEY) === 'done') return;
    if (typeof WorldEngine.listCareerSaves !== 'function') return;

    const saves = await WorldEngine.listCareerSaves();
    const targets = (Array.isArray(saves) ? saves : []).filter(save => {
      const name = String(save?.playerName || '').trim().toLowerCase();
      const date = dateKey(save?.currentDate);
      return name === TARGET_NAME && REMOVE_DATES.has(date);
    });

    const idsToRemove = new Set(targets.map(save => String(save?.id || '')).filter(Boolean));

    // Guardrail: never remove the confirmed real Apr 28 Danner career.
    const realCareerStillPresent = (Array.isArray(saves) ? saves : []).some(save =>
      String(save?.playerName || '').trim().toLowerCase() === TARGET_NAME &&
      dateKey(save?.currentDate) === KEEP_DATE
    );
    if (!realCareerStillPresent) {
      console.warn('[Project Ice] Dev save cleanup skipped because the confirmed Apr 28 Danner career was not found.');
      return;
    }

    if (idsToRemove.size) {
      const db = await openDatabase();
      try {
        for (const id of idsToRemove) {
          await deleteRecord(db, `career:${id}`);
        }
      } finally {
        db.close();
      }
      cleanVisibleIndex(idsToRemove);
    }

    localStorage.setItem(CLEANUP_MARKER_KEY, 'done');
    console.info('[Project Ice] Dev-save cleanup complete.', {
      removedCareerIds: [...idsToRemove],
      preservedCareerDate: KEEP_DATE,
    });
  }

  const run = () => cleanup().catch(error => {
    console.error('[Project Ice] Dev-save cleanup failed:', error);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
