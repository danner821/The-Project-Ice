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


## Verified September 25 full-backup first-week gate

A local test of the staged one-authority guard against **both complete private 56 MB files**, each loaded into the isolated real production WorldEngine and mapped to a fake disposable IndexedDB, reached 2025-09-08 after four calendar days and one weekly-processing pass. The engine then correctly stopped for an outstanding player-facing event (`advanceToDate` returned `success:false`, `stopSimulation:true`) rather than silently crossing it. All **160 roster players** retained byte-identical potential root/development pairs, confidence, trends and potential histories in memory across the weekly boundary; Alacai's 74/68 discrepancy stayed intact. The disposable saved record's revision remained unchanged (16 in Backup 3; 4 in original), a protected-name canary remained revision 999, and both private input SHA-256 digests were unchanged. This directly verifies the tested local production-source patch, not iPhone WebKit or the exact remote-branch checkout. The staged source-extracted eight-fixture weekly test and private 160/160 preseason screen also passed locally. This staging branch remains unmerged, and no live user files were uploaded.


## Clean GitHub Actions checkout — green

- Added branch-only `.github/workflows/potential-v2-staging-validation.yml`: checks out GitHub's **actual draft PR merge commit**, runs Node 22 syntax checks and **12 isolated synthetic regression suites** on the exact PR source. Workflow uses read-only GitHub permissions and refuses any tracked private career backup. Neither private save is uploaded to GitHub Actions.
- First full clean CI run **failed**, exposing a pre-existing missing closing brace in `potential-v2-preseason-shadow-run.test.js` that was not caught by the previous manually selected local suites. Fixed the syntax on this unmerged staging branch, then ran the full clean workflow again.
- Second full clean CI run **PASS**: GitHub Actions run **36259552954**, commit `4f407626329f75875e05dddd1f87622be975658d`. All 12 suites and backup-exclusion check passed, including source-extracted weekly authority, V2 weekly and 36-week synthetic regressions, preseason policy and simulation, isolated world boot, staged rollback/recovery and actual production calendar integration. This is an independently executed clean checkout rather than an assumption that the local patch matches GitHub.
- A separate local checkout of the main repo ZIP had production `world.js` Git blob SHA `777c181f141aff80eacb175387e921f2b03535d1`. Applied the exact draft branch guard, obtaining **identical Git blob SHA `a45f0aa00b6ffb2db29410f5a4aa95a812ac33cd`** as the remote staged production file. Local node syntax, seven independent existing regression suites, real private baseline 160/160 source-gate checks for **both** complete original/Backup 3 exports, and two real-production isolated first-week passes confirmed preserved root/development/confidence/trend/history, 191 external prospects and unmodified private backup bytes. Production VM housekeeping timers required explicit test exit once all assertions finished; staging test fixed to avoid CI hang.
- **STILL NO LIVE DEPLOY:** PR #2 remains draft, not merged. Do not accept changes to live potential-writing behavior, run native iPhone production tests or resolve the existing career 74-versus-68 conflict automatically. Outstanding actual on-device acceptance must use a disposable origin/save, fresh rollback and explicit approval before any merge.


## Native-browser staging passed: Chromium and desktop WebKit

- The draft PR's **actual remote GitHub merge commit** now runs a second CI job against its staged `public/world.js`, not a locally reconstructed patch. It creates an ephemeral 127.0.0.1 origin, loads actual production `prospects.js` and `world.js`, seeds **160 fictional high-school roster players** and 191 curated external-prospect definitions into **real native IndexedDB** on that separate origin, binds only the synthetic career ID, executes production `WorldEngine.load()`, processes one actual weekly calendar boundary, then reloads the page and verifies durable native IndexedDB recovery of an unresolved fictional 74/68 potential pair.
- Native **Chromium PASS** and **desktop WebKit PASS**, same suite, plus **12/12 synthetic Node regression suites PASS** in GitHub Actions run **36286494409** for commit `0681d01bdfebbf099a3578877e6e7039ca2c6b2f`. All 160 synthetic roster potential fields were stable; disposable saved revision remained 4; no numerical V2 writes. The native browser test cleans its ephemeral origin and does not read, submit, or store any real user's private JSON. GitHub Actions browser-job logs explicitly report separate Chromium and WebKit PASS lines.
- Desktop WebKit meaningfully exercises Safari's engine family but **is not an actual iPhone Safari or installed Home Screen app test**. The 56 MB *real* original/Backup 3 isolated baseline tests remain independent local Node fake-IDB acceptance; previous iPhone Safari full-size IndexedDB durability proof covered **the already-deployed old app**, not this proposed unmerged world.js guard.
- PR #2 **stays draft/unmerged**. No branch code deployed to production Cloudflare. The last release gate is a *disposable* actual iPhone/WebKit staging build on a separate origin or an equivalently isolated deployment, with exact branch-commit provenance, then fresh backup/revision preflight and the user's explicit approval before prospective production potential-writer behavior changes. Canonical 74 vs. 68 selection and live V2 migration remain separate, blocked decisions.


## Full-size synthetic native IndexedDB and iPhone-sized WebKit emulator

- Expanded the exact staged-branch native browser CI with a **58,201,562-byte entirely fictional string fixture**, matching Backup 3's raw byte count without exposing any user data. In a database distinct from the synthetic game DB, native IndexedDB writes and reopens the full payload, checks **SHA-256**, reloads the browser page, reads all 58 MB again, recomputes and matches SHA-256, then deletes only that fixture DB. The existing synthetic game origin is local/ephemeral and no browser attempts to open the user's live worker or real career.
- Added an **iPhone 13-sized/mobile/touch WebKit-emulated browser context**, alongside native desktop Chromium and desktop WebKit. Each independently completes actual production synthetic WorldEngine calendar/week, confirms all 160 player potential records untouched, preserves the fictional 74/68 baseline through normal durable IndexedDB reload, and passes the separate 58 MB full-size storage round-trip. This is automated WebKit **mobile emulation**, not actual iOS Safari or iPhone Home Screen persistence.
- GitHub Actions run **36286645177**, commit `dd6748fc7a0e171c14c6445877d6d1c18f7373c1`: **both jobs PASS**. Twelve regression suites passed independently; native browser logs explicitly report **Chromium PASS, WebKit PASS, and WebKit iPhone emulated PASS**, each with 58 MB synthetic SHA and durable reload. The old original and Backup 3 private-file hashes remain protected; no private backup was read by CI.
- No production or staging Cloudflare deployment was performed: PR #2 remains **draft/unmerged**. Before asking the user to test on their physical iPhone, establish a separately named preview origin that is demonstrably isolated from `the-project-ice.danner821.workers.dev` and its installed app, then run fresh synthetic-only iPhone acceptance there. Never direct the user to test a speculative/unverified URL, open their genuine save in staging, or install a staging Home Screen PWA before the rollback gate is confirmed.
