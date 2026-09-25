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
