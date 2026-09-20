from pathlib import Path

ROOT = Path('artifacts/project-ice')
world_path = ROOT / 'public' / 'world.js'
index_path = ROOT / 'index.html'
p = world_path.read_text(encoding='utf-8')

# 1) Persistence hydration gate: scripts may execute before game.js init() calls
# WorldEngine.load(). During that window _state is only the default bootstrap.
anchor = """  let _saveQueue = Promise.resolve(true);
  let _saveRevision = 0;

  const PERSISTENCE_TRACE_KEY = 'projectice_persistence_trace_v1';
"""
replace = """  let _saveQueue = Promise.resolve(true);
  let _saveRevision = 0;

  /*
   * No runtime is allowed to persist _state until that state has either:
   *   1) been hydrated from the authoritative career record, or
   *   2) been intentionally created by the user through New Career.
   *
   * Several feature runtimes initialize before game.js calls WorldEngine.load().
   * Their harmless normalization saves used to serialize buildDefaults() into
   * the still-bound active career id, overwriting a progressed save before the
   * user even tapped Continue Career.
   */
  let _persistenceHydrated = false;

  const PERSISTENCE_TRACE_KEY = 'projectice_persistence_trace_v1';
"""
if anchor not in p:
    raise SystemExit('hydration declaration anchor not found')
p = p.replace(anchor, replace, 1)

# 2) Block all pre-load saves before they enter the async save queue.
anchor = """  function save() {
    const requestedCareerId =
      getActiveCareerId();

    tracePersistence('save-requested', {
"""
replace = """  function save() {
    const requestedCareerId =
      getActiveCareerId();

    if (!_persistenceHydrated) {
      tracePersistence('save-skipped-before-authoritative-load', {
        requestedCareerId,
        requestedRecordId:
          requestedCareerId
            ? getWorldRecordId(requestedCareerId)
            : null,
      });

      return Promise.resolve(true);
    }

    tracePersistence('save-requested', {
"""
if anchor not in p:
    raise SystemExit('save gate anchor not found')
p = p.replace(anchor, replace, 1)

# 3) Every load starts untrusted. A successful authoritative hydration re-opens
# persistence only after _state has been assigned from storage.
anchor = """  async function load() {
    tracePersistence('load-start', {
"""
replace = """  async function load() {
    _persistenceHydrated = false;

    tracePersistence('load-start', {
"""
if anchor not in p:
    raise SystemExit('load reset anchor not found')
p = p.replace(anchor, replace, 1)

anchor = """        ensureCanonicalSeasonState(
          _state
        );

        /*
         * IndexedDB is now authoritative.
"""
replace = """        ensureCanonicalSeasonState(
          _state
        );

        _persistenceHydrated = true;

        /*
         * IndexedDB is now authoritative.
"""
if anchor not in p:
    raise SystemExit('indexeddb hydrate anchor not found')
p = p.replace(anchor, replace, 1)

# 4) Legacy localStorage migration is also an authoritative hydration, so allow
# its one migration save only after parsed state is installed.
anchor = """      ensureCanonicalSeasonState(
        _state
      );

      /*
       * Immediately migrate the legacy world into IndexedDB.
       */
      await save();
"""
replace = """      ensureCanonicalSeasonState(
        _state
      );

      _persistenceHydrated = true;

      /*
       * Immediately migrate the legacy world into IndexedDB.
       */
      await save();
"""
if anchor not in p:
    raise SystemExit('legacy hydrate anchor not found')
p = p.replace(anchor, replace, 1)

# 5) Explicit New Career is the other legitimate way to establish an
# authoritative in-memory world.
anchor = """    _state = buildDefaults();
    configureFreshCareerSeason('2026-09-01');

    return careerId;
"""
replace = """    _state = buildDefaults();
    configureFreshCareerSeason('2026-09-01');
    _persistenceHydrated = true;

    return careerId;
"""
if anchor not in p:
    raise SystemExit('new career hydrate anchor not found')
p = p.replace(anchor, replace, 1)

# 6) Explicit preview recovery intentionally constructs a canonical career.
# It calls finalizeFreshCareerAfterTryouts(), which saves internally, so open
# the gate before that call.
anchor = """    _state = buildDefaults();
    configureFreshCareerSeason('2026-09-02');

    (_state.teams || []).forEach(team => {
"""
replace = """    _state = buildDefaults();
    configureFreshCareerSeason('2026-09-02');
    _persistenceHydrated = true;

    (_state.teams || []).forEach(team => {
"""
if anchor not in p:
    raise SystemExit('preview recovery hydrate anchor not found')
p = p.replace(anchor, replace, 1)

world_path.write_text(p, encoding='utf-8')

# Force Cloudflare / iPhone clients onto the fixed world runtime.
index = index_path.read_text(encoding='utf-8')
index = index.replace(
    '/world.js?v=20260919-persistence-trace-1',
    '/world.js?v=20260919-preload-save-gate-1'
)
index_path.write_text(index, encoding='utf-8')

# Remove one-time migration plumbing.
Path('.github/scripts/fix_preload_career_overwrite.py').unlink(missing_ok=True)
Path('.github/workflows/fix-preload-career-overwrite.yml').unlink(missing_ok=True)
