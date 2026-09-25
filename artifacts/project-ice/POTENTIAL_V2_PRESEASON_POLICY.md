# Potential 2.0 — canonical preseason seeding and prospective weekly dry-run

**Status:** offline, read-only; no live ratings updated and no numerical changes approved.

The policy explicitly **preserves every existing potential rating unless the player's exact original root and development values are reviewed**. In particular, Alacai's saved root 74 and displayed development 68 remain an unresolved identity-bound decision; the tools neither choose one automatically nor silently lower confidence in the live record.

A current Backup 3 revision-16 snapshot and the original revision-4 September 4 snapshot were each run through the same offline canonical-seed and prospective weekly-shadow dry run. Both generated **identical decisions**:

| Status | Roster players |
|---|---:|
| Canonical root/development value agrees; no current-season games yet | 94 |
| Incoming-class history predates player generation; quarantine | 53 |
| Real HS-rostered players; preserve without automatic rerating | 12 |
| Root/development conflict; hold for explicit reviewed seed | 1 |

The last category is the career player, with root 74 and nested 68. Current game date: September 4, 2025; **zero** automatic numerical proposals. Even a player with at least eight games remains withheld if no clean, same-level, similar-potential peer cohort meets the minimum. Neither chronological archives nor quarantined predecessor records may be used as substitute current-season games.

Reproducible offline scripts, **never imported by live gameplay**:
- `tools/potential-v2-preseason-policy.js PRIVATE_BACKUP.json` validates backup identity and excludes duplicated player IDs, contaminated generated freshmen, real players and unresolved potential records.
- `tools/potential-v2-preseason-shadow-run.js PRIVATE_BACKUP.json` uses only eligible current-year synthetic peers and executes the prospective `potential-v2-weekly-shadow.js` evaluator in memory. The CLI rehashes its input and rejects unexpected numerical proposals, count mismatches or file changes.
- The associated `*.test.js` suites cover immutable inputs, two potential fields, plausible-looking inherited histories, legitimate fresh incoming histories, lack of fresh game evidence and missing peer support.

**Verification:** both original and current private backups passed independently with identical 94/53/12/1 decisions; synthetics passed; SHA-256 of both backups matched their previous fingerprints. Do not store user backup JSON or per-player private plans in GitHub.

**Next engineering gates:** (1) establish a supported, explicitly reviewed canonical-seed decision for the career player without treating the higher field or the displayed field as automatically authoritative; (2) validate prospective evidence over several completed synthetic weeks (games, injuries/recovery, team and age cohort turnover), with quarantined players never borrowing inherited history; (3) rehearse exact user-approved plan on the disposable fresh-backup clone with full-world allowlist and a fresh current-device export/revision gate; (4) only then request explicit approval before any live migration. Until then, the old Player tab display is legacy behavior and not an approved Potential 2.0 outcome.
