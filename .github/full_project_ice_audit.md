# Project Ice Full Architecture Audit

Generated from current `main` source.

## Summary

- Critical: 0
- High: 2
- Medium: 7
- Informational: 12
- Pass checks: 12

## HIGH

### Schedule — Schedule assignment in game.js:3051
WorldEngine.state.schedule =

### Travel — Two roster-building layers are still loaded
travel-hockey-world.js can build travel rosters and travel-hockey-roster-world.js rebuilds them again. This duplicated ownership is a major Phase 3.4 volatility source and should be consolidated before deeper Travel debugging.

## MEDIUM

### Dev shortcut — Dev shortcut rewrites schedule array
It filters then re-adds Travel Tryouts. This is safe only if the baseline already contains the complete canonical schedule; audit/repair now treats the shortcut as a sandbox, never as a source of truth for real careers.

### Performance — Polling intervals remain active
postseason-checkpoint-event.js, postseason-ui.js, season-lifecycle-migrations.js

### Persistence — Legacy preview recovery still reads default record
career-persistence.js is transitional and still targets the old default world when projectice_save is absent. Multi-career selection is handled elsewhere, but this bridge should eventually be retired to reduce ambiguity.

### Runtime ownership — advanceToDate has many runtime owners
9 files assign/wrap it: awards-calendar-event.js, awards-ceremony.js, championship-checkpoint.js, home-postseason-awareness.js, postseason-checkpoint-event.js, postseason-stats.js, postseason-trigger.js, season-lifecycle.js, travel-hockey-foundation.js

### Runtime ownership — openHubTab has many runtime owners
6 files assign/wrap it: awards-offseason-exit.js, league-postseason.js, playoff-leaders.js, postseason-ui.js, team-leader-scopes.js, travel-hockey-tryouts.js

### Schedule — Schedule assignment in season-lifecycle.js:328
state().schedule = state().schedule.filter(game => !unneeded.has(gameId(game)));

### Travel — Travel foundation mixes data, wrappers, and DOM observation
Foundation both mutates travel/schedule state and observes/patches UI while wrapping advanceToDate. Functional, but higher coupling than desired.

## INFO

### Performance — MutationObserver inventory
awards-calendar-event.js, player-stat-scope-refresh.js, schedule-open-day-fix.js, travel-hockey-foundation.js

### Schedule — Schedule assignment in awards-calendar-event.js:40
if (!Array.isArray(world.schedule)) world.schedule = [];

### Schedule — Schedule assignment in dev-postseason-shortcut.js:178
if (!Array.isArray(world.schedule)) world.schedule = [];

### Schedule — Schedule assignment in dev-postseason-shortcut.js:179
world.schedule = world.schedule.filter(event =>

### Schedule — Schedule assignment in postseason-cadence.js:150
const schedule = Array.isArray(world.schedule) ? world.schedule : (world.schedule = []);

### Schedule — Schedule assignment in postseason-cadence.js:163
world.schedule = filtered;

### Schedule — Schedule assignment in postseason-cadence.js:187
const schedule = Array.isArray(world.schedule) ? world.schedule : (world.schedule = []);

### Schedule — Schedule assignment in season-lifecycle.js:176
if (!Array.isArray(world.schedule)) world.schedule = [];

### Schedule — Schedule assignment in travel-hockey-foundation.js:80
if (!Array.isArray(world.schedule)) world.schedule = [];

### Schedule — Schedule assignment in world.js:39931
WorldEngine.state.schedule =

### Schedule — Schedule assignment in world.js:41318
_state.schedule = createHighSchoolCareerSchedule(

### Travel — 8 Travel runtime files present
travel-hockey-canonical-ui.js, travel-hockey-foundation.js, travel-hockey-profile-repair-v2.js, travel-hockey-roster-world.js, travel-hockey-season-ui.js, travel-hockey-tryouts-v2-migration.js, travel-hockey-tryouts.js, travel-hockey-world.js

## PASS

### Dev shortcut — does not write projectice_save
present

### Dev shortcut — isolated dev career id
present

### Dev shortcut — structured clone source
present

### Dev shortcut — uses dedicated baseline
present

### Load order — All injected runtime files exist
0 injected runtime modules resolved.

### Persistence — IndexedDB multi-career architecture present
World state is persisted per career; lightweight preview remains separate.

### Postseason — HS playoff format contract present
6 teams, #1/#2 byes, 3v6/4v5, reseeded semifinals, best-of-3 championship are all represented.

### Postseason — Playoff cadence contract present
At least two career practice/recovery events per seven-day window; playoff games encoded every other day.

### Runtime — All public JavaScript parses
Every public/*.js file passed node --check.

### Scouting — Prospect rankings are adaptive
Weekly ranking score uses ability/potential/performance/reputation/trust, spotlight performance, class readiness, and prior rank stabilization; publicRank is rewritten each processed scouting week.

### Stats — Playoff stats read canonical schedule
Shared scope backend is tied to WorldEngine.state.schedule.

### Stats — Postseason rebuild is non-destructive
It no longer wipes all player playoff stats when historical games lack player lines.
