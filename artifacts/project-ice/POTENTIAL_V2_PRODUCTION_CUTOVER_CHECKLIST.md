# Potential 2.0 — production cutover checklist

**Status:** preparation only. PR #2 remains draft and unmerged.

## What PR #2 changes

The staged change does **not** enable Potential 2.0 and does not migrate any saved rating. It places a fail-closed eligibility gate around the existing weekly potential writer so it cannot silently rewrite protected records before the V2 migration is approved.

The existing writer may run only for a generated player whose:
- root `potential` and canonical `development.potential` are both valid and equal;
- current-season sample is at least five games;
- archived history does not predate a generated incoming freshman's recorded class;
- record is not a curated/real or persistent prospect.

Skipped records are returned as explanatory no-change results. No skipped record has its potential, confidence, trend, history, XP, attributes or stats synchronized or repaired.

## Verified release evidence

1. Both complete private baseline exports passed isolated full-world first-week tests; 160 roster potential records preserved and private file hashes unchanged.
2. GitHub Actions passes the exact PR source with 12 synthetic regression suites.
3. Native Chromium, desktop WebKit and iPhone-sized WebKit tests pass real IndexedDB write/reload plus a 58,201,562-byte synthetic checksum round-trip.
4. Cloudflare Workers automatically publishes the branch preview on a separate origin.
5. Physical iPhone Safari branch-preview test **PASS**: 160/160 fictional potential records unchanged, fictional 74/68 conflict preserved after reload, 58 MB SHA-256 matched after reload, preview-only databases cleaned up, production career never opened.

## Required immediately before production merge

- Confirm whether the real production career has been opened, played or saved since verified Backup 3.
- If **yes**, export a fresh SAVE TRACE backup, run isolated verification on-device, and compare it read-only with the prior verified baseline before merge.
- If **no**, keep Backup 3 plus the original export as the verified rollback pair.
- Re-read PR #2 diff against current `main`; if main advanced, rebase/retest before merge.
- Require explicit user approval for the prospective writer-guard behavior.

## Explicitly *not* included in this cutover

- Selecting 74 or 68 as Alacai's canonical potential.
- Changing Alacai's displayed potential.
- Rerating any of the 53 quarantined generated freshmen.
- Reconstructing or deleting inherited historical records.
- Changing XP, XP prices, attributes, OVR, scouting, stats or schedule.
- Enabling the offline V2 weekly evaluator in production.
- Running any save migration.

Those remain later, separately reviewed gates.

## Rollback rule

If production merge behaves unexpectedly, do not simulate forward or restore over the career reflexively. Preserve the current device state, export a new diagnostic backup if possible, compare it read-only, and use the already verified rollback export only through the isolated recovery protocol after review.
