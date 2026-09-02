from pathlib import Path

ROOT = Path('artifacts/project-ice/public')
ENGINE = ROOT / 'travel-hockey-tournament-engine.js'
CANON = ROOT / 'travel-hockey-canonical-ui.js'


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing expected block for {label}')
    return text.replace(old, new, 1)

# ---------------------------------------------------------------------------
# 1) Tournament RNG: a fresh tournament gets one persisted random seed.
#    Individual games remain deterministic *within that saved tournament* so a
#    browser refresh can never reroll a game that already belongs to the save.
# ---------------------------------------------------------------------------
engine = ENGINE.read_text()

anchor = "  const rng = seed => {\n    let x = hash(seed) || 1;\n    return () => {\n      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;\n      return (x >>> 0) / 4294967296;\n    };\n  };"
replacement = anchor + r'''

  function freshTournamentSeed() {
    try {
      if (globalThis.crypto?.getRandomValues) {
        const values = new Uint32Array(2);
        globalThis.crypto.getRandomValues(values);
        return `${values[0].toString(36)}-${values[1].toString(36)}`;
      }
    } catch (_) {}
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
  }
'''
engine = replace_once(engine, anchor, replacement, 'fresh tournament RNG helper')

engine = replace_once(
    engine,
    "    const seed = `${state.tryoutResult?.completedAt || ''}:${series.seriesId}:${gameNumber}`;",
    "    const seed = `${state.tournament?.randomSeed || state.tryoutResult?.completedAt || ''}:${series.seriesId}:${gameNumber}`;",
    'game RNG seed source'
)

engine = replace_once(
    engine,
    "    if (!t.activeRound || t.activeRound === 'not-started') t.activeRound = 'quarterfinals';\n    if (!t.status || t.status === 'not-started') t.status = 'ready';",
    "    if (!t.activeRound || t.activeRound === 'not-started') t.activeRound = 'quarterfinals';\n    if (!t.status || t.status === 'not-started') t.status = 'ready';\n    if (!t.randomSeed) t.randomSeed = freshTournamentSeed();",
    'persist tournament RNG seed'
)

ENGINE.write_text(engine)

# ---------------------------------------------------------------------------
# 2) Schedule projection must run whenever the canonical Travel world is
#    ensured/opened. The previous implementation only projected while the
#    tournament progression control rendered, so Home/Schedule could keep a
#    stale cached schedule with no Travel games.
# ---------------------------------------------------------------------------
canon = CANON.read_text()

old = """    if (!Array.isArray(state.tournament.rounds.semifinals)) state.tournament.rounds.semifinals = [];
    if (!Array.isArray(state.tournament.rounds.championship)) state.tournament.rounds.championship = [];
    if (save) WorldEngine.save?.();
    return state;
  }"""
new = """    if (!Array.isArray(state.tournament.rounds.semifinals)) state.tournament.rounds.semifinals = [];
    if (!Array.isArray(state.tournament.rounds.championship)) state.tournament.rounds.championship = [];

    // Keep the player's Travel series in the same canonical career schedule
    // consumed by both Home and the Schedule tab. Do this at Travel-world
    // ownership time, not only when a tournament control happens to render.
    WorldEngine.ensureTravelTournamentProgression?.({ save:false });
    WorldEngine.syncCareerTravelSchedule?.(state);
    try { globalThis.refreshScheduleEvents?.(); } catch (_) {}

    if (save) WorldEngine.save?.();
    return state;
  }"""
canon = replace_once(canon, old, new, 'canonical Travel schedule projection')

# Also force one projection when the canonical Travel runtime loads into an
# already-active Travel save (important after refreshing directly on Home/League).
export_anchor = "  WorldEngine.syncTravelCareerIdentity = syncCareer;\n  WorldEngine.openTravelHockeyHub = openHub;"
export_new = """  WorldEngine.syncTravelCareerIdentity = syncCareer;

  // Reconcile an already-active Travel save immediately on runtime load so the
  // normal Home/Schedule surfaces never depend on opening the Travel Hub first.
  try {
    if (active()) {
      const activeState = ensureWorld(false);
      WorldEngine.syncCareerTravelSchedule?.(activeState);
      globalThis.refreshScheduleEvents?.();
    }
  } catch (error) {
    console.warn('[Travel] Schedule projection reconciliation skipped:', error);
  }

  WorldEngine.openTravelHockeyHub = openHub;"""
canon = replace_once(canon, export_anchor, export_new, 'runtime-load Travel schedule reconciliation')

CANON.write_text(canon)
print('Fixed Travel schedule projection lifecycle and tournament RNG seeding.')
