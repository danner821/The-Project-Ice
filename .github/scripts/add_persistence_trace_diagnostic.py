from pathlib import Path

ROOT = Path('artifacts/project-ice')
PUBLIC = ROOT / 'public'
world_path = PUBLIC / 'world.js'
vite_path = ROOT / 'vite.config.ts'
debug_path = PUBLIC / 'persistence-trace-debug.js'

world = world_path.read_text(encoding='utf-8')

# Add trace helper near persistence queue declarations.
anchor = """  let _saveQueue = Promise.resolve(true);
  let _saveRevision = 0;

  function createPersistentWorldSnapshot() {
"""
insert = """  let _saveQueue = Promise.resolve(true);
  let _saveRevision = 0;

  const PERSISTENCE_TRACE_KEY = 'projectice_persistence_trace_v1';

  function tracePersistence(type, details = {}) {
    try {
      const existing = JSON.parse(localStorage.getItem(PERSISTENCE_TRACE_KEY) || '[]');
      const trace = Array.isArray(existing) ? existing : [];
      trace.push({
        at: new Date().toISOString(),
        type,
        activeCareerId: getActiveCareerId(),
        seasonDate:
          _state?.season?.currentDate ||
          _state?.player?.currentDate ||
          _state?.currentDate ||
          null,
        playerDate:
          _state?.player?.currentDate ||
          null,
        ...details,
      });
      localStorage.setItem(
        PERSISTENCE_TRACE_KEY,
        JSON.stringify(trace.slice(-80))
      );
    } catch (_) {
      /* Diagnostic tracing must never affect gameplay. */
    }
  }

  function createPersistentWorldSnapshot() {
"""
if anchor not in world:
    raise SystemExit('save queue trace anchor not found')
world = world.replace(anchor, insert, 1)

# Save request trace.
anchor = """  function save() {
    const requestedCareerId =
      getActiveCareerId();
"""
insert = """  function save() {
    const requestedCareerId =
      getActiveCareerId();

    tracePersistence('save-requested', {
      requestedCareerId,
      requestedRecordId:
        requestedCareerId
          ? getWorldRecordId(requestedCareerId)
          : null,
    });
"""
if anchor not in world:
    raise SystemExit('save request anchor not found')
world = world.replace(anchor, insert, 1)

# Snapshot trace after current date is embedded.
anchor = """        const savedAt =
          new Date().toISOString();

        try {
"""
insert = """        const savedAt =
          new Date().toISOString();

        tracePersistence('save-snapshot', {
          requestedCareerId,
          requestedRecordId,
          revision,
          snapshotDate:
            worldSnapshot?.season?.currentDate ||
            worldSnapshot?.player?.currentDate ||
            worldSnapshot?.currentDate ||
            null,
          snapshotPlayerDate:
            worldSnapshot?.player?.currentDate ||
            null,
        });

        try {
"""
if anchor not in world:
    raise SystemExit('save snapshot anchor not found')
world = world.replace(anchor, insert, 1)

# Verified save trace.
anchor = """          if (!verified) {
            console.error(
              '[WorldEngine] Save verification failed.',
"""
insert = """          tracePersistence(
            verified ? 'save-verified' : 'save-verification-failed',
            {
              requestedCareerId,
              requestedRecordId,
              revision,
              expectedDate:
                worldSnapshot?.persistence?.currentDate ||
                null,
              verifiedRecordDate:
                verifiedRecord?.world?.season?.currentDate ||
                verifiedRecord?.world?.player?.currentDate ||
                verifiedRecord?.world?.currentDate ||
                null,
              verifiedRecordPlayerDate:
                verifiedRecord?.world?.player?.currentDate ||
                null,
            }
          );

          if (!verified) {
            console.error(
              '[WorldEngine] Save verification failed.',
"""
if anchor not in world:
    raise SystemExit('save verified anchor not found')
world = world.replace(anchor, insert, 1)

# Load start trace.
anchor = """  async function load() {
    bindActiveCareerId(
"""
insert = """  async function load() {
    tracePersistence('load-start', {
      localStorageActiveCareerId:
        localStorage.getItem(ACTIVE_CAREER_ID_KEY) ||
        null,
    });

    bindActiveCareerId(
"""
if anchor not in world:
    raise SystemExit('load start anchor not found')
world = world.replace(anchor, insert, 1)

# Trace exact record read immediately after resolvedRecord declaration.
anchor = """      let resolvedRecord = storedRecord;

      /*
       * STRICT CAREER RECORD AUTHORITY
"""
insert = """      let resolvedRecord = storedRecord;

      tracePersistence('load-exact-record-read', {
        requestedRecordId: getWorldRecordId(),
        found: Boolean(storedRecord?.world),
        storedRecordId: storedRecord?.id || null,
        storedRecordRevision: storedRecord?.revision ?? null,
        storedRecordDate:
          storedRecord?.world?.season?.currentDate ||
          storedRecord?.world?.player?.currentDate ||
          storedRecord?.world?.currentDate ||
          null,
        storedPlayerDate:
          storedRecord?.world?.player?.currentDate ||
          null,
      });

      /*
       * STRICT CAREER RECORD AUTHORITY
"""
if anchor not in world:
    raise SystemExit('load exact record anchor not found')
world = world.replace(anchor, insert, 1)

# Trace successful resolved load before return true.
anchor = """        localStorage.removeItem(
          WORLD_KEY
        );

        return true;
"""
insert = """        localStorage.removeItem(
          WORLD_KEY
        );

        tracePersistence('load-success', {
          loadedRecordId: resolvedRecord?.id || null,
          loadedRecordRevision: resolvedRecord?.revision ?? null,
          loadedDate:
            _state?.season?.currentDate ||
            _state?.player?.currentDate ||
            _state?.currentDate ||
            null,
          loadedPlayerDate:
            _state?.player?.currentDate ||
            null,
        });

        return true;
"""
if anchor not in world:
    raise SystemExit('load success anchor not found')
world = world.replace(anchor, insert, 1)

# Trace selection before and after load.
anchor = """  async function selectCareerSave(careerId) {
    if (!careerId) return false;

    bindActiveCareerId(careerId);
"""
insert = """  async function selectCareerSave(careerId) {
    if (!careerId) return false;

    tracePersistence('select-career-requested', {
      selectedCareerId: careerId,
      selectedRecordId: getWorldRecordId(careerId),
    });

    bindActiveCareerId(careerId);
"""
if anchor not in world:
    raise SystemExit('select career anchor not found')
world = world.replace(anchor, insert, 1)

anchor = """    return await load();
  }

  async function beginNewCareerSave() {
"""
insert = """    const loaded = await load();

    tracePersistence('select-career-finished', {
      selectedCareerId: careerId,
      loaded,
      resultingDate:
        _state?.season?.currentDate ||
        _state?.player?.currentDate ||
        _state?.currentDate ||
        null,
    });

    return loaded;
  }

  async function beginNewCareerSave() {
"""
if anchor not in world:
    raise SystemExit('select career return anchor not found')
world = world.replace(anchor, insert, 1)

world_path.write_text(world, encoding='utf-8')

# Diagnostic UI: reads both trace + every IndexedDB world record.
debug = r"""'use strict';

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
"""
debug_path.write_text(debug, encoding='utf-8')

vite = vite_path.read_text(encoding='utf-8')
anchor = """    if (!html.includes('/film-study-event.js')) scripts.push('    <script src="/film-study-event.js?v=20260919-save-integrity-1"></script>');
"""
line = """    if (!html.includes('/persistence-trace-debug.js')) scripts.push('    <script src="/persistence-trace-debug.js?v=20260919-trace-1"></script>');
"""
if line not in vite:
    if anchor not in vite:
        raise SystemExit('Vite Film Study anchor not found')
    vite = vite.replace(anchor, anchor + line, 1)
vite_path.write_text(vite, encoding='utf-8')

# Bump world cache key again.
index_path = ROOT / 'index.html'
index = index_path.read_text(encoding='utf-8')
index = index.replace(
    '/world.js?v=20260919-strict-career-record-1',
    '/world.js?v=20260919-persistence-trace-1'
)
index_path.write_text(index, encoding='utf-8')

Path('.github/scripts/add_persistence_trace_diagnostic.py').unlink(missing_ok=True)
Path('.github/workflows/add-persistence-trace-diagnostic.yml').unlink(missing_ok=True)
