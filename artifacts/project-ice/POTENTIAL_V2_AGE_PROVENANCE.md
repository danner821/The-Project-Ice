# Potential 2.0 — Age-provenance gate (read-only)

**Status: historical audit corrected; no production migration authorized.** The earlier Backup 3 retrospective counts must not be used to assign numerical potential. This document contains aggregate findings only. Original and Backup 3 career JSON remain private, never committed.

## New safety finding

A chronological identity audit of all 148 generated HS roster players found **95 coherent two-season/current-age sequences and 53 suspicious sequences**:

- 13 newly generated 2024 freshman IDs have a preceding 2023 archive aged 18–19 followed by their 2024 archive aged 15: archived age goes backward by 3–4 years.
- 40 newly generated 2025 freshman IDs have a 2024 archive aged 18–19 while their present age is 14–15: current age goes backward by 3–5 years.

This strongly suggests historical records from older roster slots may have been inherited by newly generated freshmen, but the exact production code cause is not yet proven. **Do not delete, rewrite, reassign or infer owners for those historical records.** Quarantine these 53 players from retrospective evaluations **and exclude their suspect archive observations from every peer cohort** until provenance is established. The live backup remains unchanged.

## Validated corrected shadow findings

Read-only sanitized-clone runs on *both* original revision-4 and current Backup 3 revision-16 produced identical aggregate outcomes:

| Review group | Count |
|---|---:|
| Quarantined historical identity | 53 |
| Retain pending calibration | 71 |
| Strong breakout review | 4 |
| Additional breakout review | 5 |
| Persistent underperformance review | 5 |
| Decline-evidence review | 4 |
| Insufficient usable archive data | 6 |

Independent tier calibration: 86 evidence-only, 53 quarantined, 6 insufficient history, 2 insufficient comparable peers, 1 root/development potential conflict. Combined evidence and XP scenarios: 76 no sustained breakout, 5 strong provisional, 5 provisional, 63 withheld (149 scenarios across 148 players because of one potential-field conflict). One previously flagged breakout fails the age-provenance check and is now **withheld**, not a candidate for rerating.

The career player's historical age sequence is internally coherent, but its unresolved root vs. development potential mismatch **74/68** remains. Cohort sanitation changes its tier-relative peer sample; previous raw-cohort percentile figures are superseded by the guarded run. Historical peer comparisons are not calibrated NHL potential and approve **zero numerical migrations**.

## Engineering safeguards already committed

- `tools/potential-v2-validated-review.js` performs the age-provenance check and runs the old shadow/calibration/evidence tools on an **isolated scoring-only copy** that strips the suspect histories. The input save is never rewritten. `potential-v2-validated-review.test.js` covers chronology, quarantine, excluded real prospects and input immutability; local equivalently implemented regression tests passed.
- `potential-v2-migration-rehearsal.js` now synchronizes legacy public role/confidence/trend fields when rehearsing a potential change, preventing disagreement with the canonical development record. Extended regression tests passed locally.
- `potential-v2-private-migration-audit.js` rehearses **hypothetical targets only**, with a strict exhaustive world-field change allowlist and immutable private input. Two tests against each full private 56 MB baseline passed, affecting only the selected career player's potential-related fields and root mirrors. These are functional safety tests, **not rating recommendations or user approvals**.

## Remaining gates

Identify and regression-test the freshman insertion/history-capture boundary to prevent future cross-player archive attribution. Do not repair existing archived records without evidence of their real owner. Recalibrate after age-integrity filtering and larger competition/talent benchmarks; keep missing goalie sample data withheld. Before any live migration, prepare a specific player-by-player preview, recheck the current on-device save revision, retain a fresh verified rollback, and request explicit user approval.


## Source-level root cause confirmed and future-only fix

- Inspected current production `public/high-school-roster-rollover.js`, specifically `incomingFreshmanFromGraduate()`: it copied the full graduate via `...JSON.parse(JSON.stringify(graduate || {}))`, reset `seasonHistory`/`travelHistory`, but **omitted `highSchoolSeasonHistory`**, mechanically transferring completed older-player season rows to the newly named/id'd freshman. This directly explains the 13 impossible 2024 freshman age transitions and 40 impossible 2025 freshman current-age transitions. It also raises **separate risks of inherited graduate development XP/history, scouting history, and personal records**; those are not yet fixed or cleared for numerical potential calibration.
- Regression-tested the **actual production rollover source** in an isolated Node VM using a fictional senior with two completed HS seasons: before the patch the synthetic freshman inherited those seasons (test failed as expected). Added future-only `highSchoolSeasonHistory: []` alongside existing new-player history resets. After the patch, the exact-source test PASS confirmed new freshmen have zero inherited HS season archives while the graduated senior's full archive remains retained. JS syntax check PASS. Committed production-source fix `32ce48b` and permanent test `19d87db`.
- This is preventive for **future season rollovers only**. Existing 53 suspicious histories in Backup 3 were NOT altered, and do not get trustworthy histories via this patch; quarantine stays enforced. GitHub-to-Cloudflare automatic deployment of the code has not been independently checked on device. Continue keeping the present saved career and the original/private rollback files untouched until further approval.


## Root-cause correction for future incoming freshmen

- Inspected the actual production `high-school-roster-rollover.js` path. New incoming freshmen are cloned from graduating players' records as attribute templates. Earlier mitigation cleared `highSchoolSeasonHistory`, `seasonHistory` and `travelHistory` but accidentally **still copied graduate lifetime XP, attribute upgrade counts, developmentHistory, DNA, scouting observations, game logs, accomplishments and legacy history**. A synthetic direct-source regression demonstrated a new incoming freshman inheriting **1,050 earned XP** before this fix. This can contaminate future player-development data even after the age-provenance filter.
- Production code commit `54ba136` resets these per-player histories and ledgers for *newly generated future freshmen only*, including fresh deterministic development seed, non-inherited DNA, empty career stats/logs, cleared scouting exposure, fresh role confidence metadata, and clean leadership/health state. It preserves graduating players' own archived histories and does **not** touch any existing saved world on load. Existing 53 historically suspect records are still quarantined and never altered by this preventive fix.
- New permanent direct-production-source VM regression in `tools/potential-v2-freshman-archive-regression.test.js` (commit `7c99bc6`) covers **two successive season rollovers**, graduating and returning history retention, freshman empty XP/scouting/game histories, uniqueness, idempotent same-season rerun, and exactly one isolated save per transition. A matching full local production-source test passed; JavaScript syntax, the 15-assertion provenance suite, and the clone-only migration rehearsal suite also passed. Both original and current Backup 3 full-size hypothetical clone audits passed their strict per-field potential-only allowlist. The exact committed compact test has not been independently rerun in a live browser.
- The no-archived-history regression must be retained if incoming player generation is refactored. Further tests should confirm new DNA initialization by actual `WorldEngine` on the first normal season development pass, and sample genuine iPhone future-transition behavior only after taking a fresh export. No game simulation or transition is requested from the user now.


## Additional real WorldEngine DNA-initialization gate

- The future-freshman fix has now also passed a **real production `world.js` + `prospects.js` + `high-school-roster-rollover.js` integration test** in a synthetic Node VM. Once a new freshman was generated, the normal `WorldEngine.getAllWorldPlayers()` contract path created fresh independent hidden DNA, preserved zero inherited XP, and did not reuse the graduate's DNA seed. The single rollover save was intercepted; all IndexedDB opens were denied. This test proves the reset DNA is subsequently initialized, not left permanently empty.
- A separate permanent test was committed as `tools/potential-v2-freshman-dna-integration.test.js` (commit `005580f`). Matching local integration test PASS. The correction is preventative only: it must **never silently repair the 53 existing quarantined freshman archives** in the user's original saved career.
- Updated private corrected review report and 148-row CSV were generated from the validated Backup 3 read-only scoring clone, not committed to GitHub. Both original 56 MB backup SHA-256 fingerprints were rechecked unchanged. Those private reports supersede the first unfiltered review.
