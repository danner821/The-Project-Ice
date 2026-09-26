# Potential 2.0 — one-active-authority staging gate (NOT DEPLOYED)

**Branch:** `potential-v2-weekly-authority-staging` (draft; do not merge to `main` or run a live save migration without approval and fresh rollback verification).

## Why this is needed

The current production `processLivingWorldWeek` invokes `processScoutingWeek` and then **legacy** `processPotentialWeek`. The new V2 weekly shadow is strictly an offline Node script and is **not loaded by the browser**. The legacy evaluator otherwise calls `ensureCanonicalPlayerContract` and can re-evaluate every generated, real and external prospect even if the stored root/development ratings disagree, player history was inherited or zero current-season games have been played.

Prior age- and generated-incoming-class audits on the original and Backup 3 both found the same immutable baseline: 53 generated freshmen with prior-class inherited archives, 12 curated real HS roster players, one career-player 74/68 conflict and 94 otherwise clean generated skaters/goalies with no current-season games at September 4, 2025. The 191 external real prospects are separately preserved.

## Staged production behavior, inactive on `main`

The proposed small, localized guard in `public/world.js` runs **inside** the sole current legacy `processPotentialWeek` loop and refuses to call its rating mutation evaluator for:
1. All real/curated players (including external real prospects);
2. Incoming freshmen whose saved archives contain a season preceding their recorded incoming class, regardless of plausible age;
3. Players with invalid, missing or mismatching root vs. `development.potential` fields (including Alacai);
4. Players with **fewer than five current-season games**.

An eligible, reconciled generated player with at least five games still uses the existing legacy algorithm; **V2 remains offline, without any second weekly writer**. Skipped results are explanatory only; the guard deliberately does not repair old history, reset existing XP, change the UI's legacy label or synchronize the unresolved root/development conflict.

Scouting still precedes potential review at completed Sunday week-end; actual scheduled games run through `WorldEngine.advanceToDate` and the existing held career game decision flow.

## Verification on disposable clones only

- Real production source-extracted `processPotentialWeek` regression with eight synthetic fixture players: only two clean game-sampled players called the legacy evaluator; real, persistent, inherited-archive, age-coincidence, mismatched 74/68 and preseason fixtures all skipped; no false career potential news.
- The **private original revision-4 and verified Backup 3 revision-16** archives each produced 160/160 protected preseason results: 53 tainted, 12 real, one unresolved conflict, 94 no games. Neither private file was changed or uploaded to GitHub.
- Direct, complete `WorldEngine` with full original and current ~56 MB backups in an in-memory fake IndexedDB advanced the calendar to the September 8 first-week boundary, then stopped at an outstanding player-facing event. All 160 player potential root/development ratings, confidence, trends and history were identical before and after this controlled test. Alacai retained 74/68, 160 roster slots and 191 external prospects; no saved disposable record or protected-name DB was altered.
- JavaScript syntax, isolated boot and saved world persistence, historical XP, existing weekly V2 shadow and 36-week guard tests passed against the matching locally patched production-source template. The remote staging branch contains the equivalent single-location production patch and reproducible source-extracted/private test files.

**Remaining before merge:** run the committed exact branch files in a clean checkout, confirm GitHub/Cloudflare branch deployment behavior, test the stage under a full current iPhone WebKit disposable career, re-export the user's current live career if they have played since Backup 3, and obtain approval before a live change to potential-writing behavior. Even after this guard is merged, V2's canonical migration remains disabled until a separate explicit reviewed plan resolves 74/68 and any future eligible player changes.
