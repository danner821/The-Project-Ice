'use strict';

(() => {
  const TRACE_KEY = 'projectice_persistence_trace_v1';
  const ACTIVE_KEY = 'projectice_active_career_id_v1';
  const PENDING_KEY = 'projectice_pending_career_id_v1';
  const DB_NAME = 'projectice_database';
  const DB_VERSION = 1;
  const STORE_NAME = 'worlds';

  function dateOf(world) {
    return (
      world?.season?.currentDate ||
      world?.player?.currentDate ||
      world?.currentDate ||
      null
    );
  }

  function careerPlayerDate(world) {
    const wanted = String(
      world?.player?.playerId ||
      world?.player?.id ||
      'career-player'
    );

    for (const team of world?.teams || []) {
      const player = (team?.roster || []).find(item =>
        item?.isCareerPlayer === true ||
        String(item?.playerId || item?.id || '') === wanted
      );
      if (player) return player.currentDate || null;
    }
    return null;
  }

  function filmStudyState(world) {
    const event = (world?.schedule || []).find(item =>
      String(item?.label || item?.shortLabel || '').toLowerCase().includes('film study') &&
      String(item?.date || '').endsWith('-09-02')
    );
    if (!event) return null;
    return {
      date: event.date || null,
      id: event.id || event.eventId || null,
      completed: Boolean(event.completed || event.isCompleted || event.played),
      status: event.status || null,
    };
  }

  async function readRecords() {
    return await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.close();
          resolve([]);
          return;
        }
        const tx = db.transaction(STORE_NAME, 'readonly');
        const getAll = tx.objectStore(STORE_NAME).getAll();
        getAll.onsuccess = () => {
          const records = Array.isArray(getAll.result) ? getAll.result : [];
          db.close();
          resolve(records);
        };
        getAll.onerror = () => {
          db.close();
          reject(getAll.error);
        };
      };
    });
  }

  function ensureButton() {
    if (document.getElementById('pi-save-trace-button')) return;

    const button = document.createElement('button');
    button.id = 'pi-save-trace-button';
    button.type = 'button';
    button.textContent = 'SAVE TRACE';
    button.style.cssText = [
      'position:fixed',
      'right:10px',
      'top:max(10px,env(safe-area-inset-top))',
      'z-index:20000',
      'border:1px solid rgba(120,170,255,.55)',
      'background:#0a1830',
      'color:#9fc4ff',
      'border-radius:999px',
      'padding:7px 10px',
      'font:700 10px/1 system-ui',
      'letter-spacing:.08em'
    ].join(';');

    button.addEventListener('click', openPanel);
    document.body.appendChild(button);
  }

  async function openPanel() {
    document.getElementById('pi-save-trace-panel')?.remove();

    let records = [];
    let error = null;
    try {
      records = await readRecords();
    } catch (err) {
      error = String(err?.message || err);
    }

    let trace = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(TRACE_KEY) || '[]');
      trace = Array.isArray(parsed) ? parsed : [];
    } catch (_) {}

    const payload = {
      now: new Date().toISOString(),
      activeCareerId: localStorage.getItem(ACTIVE_KEY) || null,
      pendingCareerId: localStorage.getItem(PENDING_KEY) || null,
      memory: {
        date: dateOf(window.WorldEngine?.state),
        playerDate: window.WorldEngine?.state?.player?.currentDate || null,
        rosterCareerDate: careerPlayerDate(window.WorldEngine?.state),
        filmStudySept2: filmStudyState(window.WorldEngine?.state),
      },
      indexedDB: records.map(record => ({
        id: record?.id || null,
        careerId: record?.careerId || record?.world?.persistence?.careerId || null,
        savedAt: record?.savedAt || null,
        revision: record?.revision ?? record?.world?.persistence?.revision ?? null,
        date: dateOf(record?.world),
        playerDate: record?.world?.player?.currentDate || null,
        rosterCareerDate: careerPlayerDate(record?.world),
        filmStudySept2: filmStudyState(record?.world),
      })),
      trace: trace.slice(-35),
      error,
    };

    const panel = document.createElement('section');
    panel.id = 'pi-save-trace-panel';
    panel.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:30000',
      'background:#040914',
      'color:#edf4ff',
      'padding:max(18px,env(safe-area-inset-top)) 14px max(24px,env(safe-area-inset-bottom))',
      'overflow:auto',
      'font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace'
    ].join(';');

    panel.innerHTML = `
      <div style="max-width:680px;margin:0 auto">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;position:sticky;top:0;background:#040914;padding:6px 0 12px">
          <strong style="font:800 16px/1 system-ui">Project Ice Save Trace</strong>
          <button type="button" data-close style="border:1px solid #36527d;background:#10213d;color:#fff;border-radius:12px;padding:8px 12px">Close</button>
        </div>
        <p style="color:#8fb5f3;font-family:system-ui">Screenshot this entire diagnostic after the rollback. It contains record IDs, dates, revisions, Film Study state, and the last persistence operations.</p>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:0">${JSON.stringify(payload, null, 2)}</pre>
      </div>
    `;

    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    document.body.appendChild(panel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureButton, { once: true });
  } else {
    ensureButton();
  }
})();
