# Project Ice — Codebase Audit

Audit date: 2026-08-14

## Runtime source of truth

The live Project Ice application is the static app under `artifacts/project-ice/index.html` plus runtime files in `artifacts/project-ice/public/`.

Primary runtime files:
- `index.html` — application screens and UI markup.
- `public/style.css` — application styling.
- `public/game.js` — presentation/controller layer, navigation, player-facing systems, live-game UI and career flow.
- `public/world.js` — canonical world state, schedules, rosters, simulation, statistics, development data and persistence.
- `public/prospects.js` — prospect data.
- `public/career-persistence.js` — temporary compatibility bridge that reconstructs the lightweight Continue Career preview from the IndexedDB world.
- `public/game-loader.js` — temporary parse-error bootstrap that corrects the final-horn async callback before executing `game.js`.

The React tree under `src/` is Replit-generated scaffold and is not the current Project Ice gameplay entry point. `src/App.tsx` still contains the placeholder "Replit Agent is building..." screen.

## Persistence architecture

The full world belongs in IndexedDB. `world.js` uses the `projectice_database` IndexedDB database and retains the old `projectice_world` localStorage key only as a migration source.

The small `projectice_save` localStorage record is intentionally retained as a lightweight player/Continue Career preview. It must not become the canonical world save again.

## Cleanup findings

### `game-loader.js` — KEEP FOR NOW

`game.js` currently contains an `await WorldEngine.save()` inside a non-async final-horn `setTimeout` callback. That is a parse-time JavaScript error. `game-loader.js` surgically changes that callback to `async` before evaluating `game.js`.

Removing the shim before directly repairing `game.js` would break the entire application. Retire it only in a dedicated hardening step with immediate regression testing.

### `career-persistence.js` — KEEP FOR NOW

This file repairs the lightweight Continue Career preview for careers affected by the IndexedDB migration. It should remain persistence-only through the current pre-alpha migration window.

### Dev shortcut / diagnostic UI — DEFER REMOVAL

The title screen still contains development shortcut/diagnostic controls and `game.js` contains their listeners. These are release-obsolete, but still useful while simulation and save architecture are being hardened. Remove in Release Cleanup, not during feature work.

### Dormant React/Replit scaffold — DO NOT DELETE YET

The `src/` React app is not used by the current static Project Ice runtime. The repository also contains Replit-generated `mockup-sandbox` and `api-server` artifacts. Mark these dormant rather than delete them until a clean Replit build proves they are unnecessary.

### Monolithic runtime files — LARGEST MAINTAINABILITY RISK

Approximate current sizes:
- `world.js`: 787 KB
- `game.js`: 484 KB
- `style.css`: 258 KB
- `index.html`: 173 KB

Do not rewrite these files wholesale. New roadmap systems should increasingly live in focused modules, and existing code should be extracted only when there is a clear functional reason and test path.

### Save/version handling — NEEDS FORMALIZATION

Compatibility logic currently spans `world.js`, `game.js`, and `career-persistence.js`. Before multi-season state is introduced, create explicit save schema versions and migrations.

## Regression-sensitive areas

Do not casually clean or refactor these without immediate testing:
- Continue Career / IndexedDB migration
- live-game final horn and postgame persistence
- Sim Game approval flow
- schedule rebuilding/migration
- career player roster synchronization
- lineup/special teams deployment
- development state and attribute XP
- career date advancement

## Roadmap status audit

### Development Engine — substantially implemented

Attributes, overall-from-attributes, individual development state, potential/development concepts and career-event development hooks exist. Future work should tune rather than redesign the architecture.

### Player Tab redesign — implemented

The redesigned player presentation and snapshot/profile separation are in place.

### Practice / Recovery — implemented

Practice, recovery and training are part of the career schedule and feed progression without a fatigue mechanic.

### Game Simulation — implemented, hardening required

Play Game, Sim Game and AI background games use the canonical simulation architecture. Live presentation, event feed/markers, deployment, manpower, postgame summary and career-game persistence are wired. The temporary loader shows this phase still needs a short hardening pass before technical closure.

### Weekly Living World — foundation exists, feature layer incomplete

The world already advances dates, resolves AI games and updates standings/statistics. Missing is the player-facing weekly layer that surfaces meaningful changes, performances, league movement and durable world events.

### Scouting — partial

Scouts-in-attendance context and prospect data exist. Full evolving scouting evaluations, watchlists and prospect-world integration remain incomplete.

### News / Home refresh — partial

Home has standings/team stats/news surfaces, but dynamic news driven by canonical world events is not complete.

### Season Transition & History — not complete

Season rollover, year advancement, archived season history, awards/championship history and multi-season continuity remain future work.

### Post-HS / NHL career — not complete

Travel/junior/college/pro pathways, draft and NHL career ecosystem remain future work.

## Conclusion

Project Ice does not need a rewrite. The correct strategy is conservative stabilization plus modular forward development:
1. keep IndexedDB as canonical world persistence;
2. keep temporary migration/loader shims until dedicated hardening proves they can be removed;
3. stop growing monolithic files where practical by putting new systems in modules;
4. complete the living-world layer before Scouting and News because those systems should consume living-world events;
5. formalize save schema migration before Season Transition creates multi-season state.
