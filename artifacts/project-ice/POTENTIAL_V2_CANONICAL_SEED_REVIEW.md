# Potential 2.0 — canonical seed review

**Status: draft recommendation only. No live save migration is approved.**

## Provenance gate

The separate 74/68 root-cause audit established that neither saved value is authoritative:
- nested 68 is the stale development baseline seeded from the original 68 OVR;
- root 74 is a legacy OVR+2 floor artifact;
- both private exports preserve 20 legacy update beats that restart from 68 and land exactly on OVR+2.

Therefore field precedence is not used to choose the V2 seed.

## Clean two-season evidence

The career player is compared only with uncontaminated generated, age-near forwards. Real players, persistent prospects, 53 inherited-history freshmen and potential-conflicted peers are excluded.

Private read-only review of the verified Backup 3 baseline produced a 47-player valid comparison cohort:

| Evidence | Percentile |
|---|---:|
| Freshman points/60 | 8.5 |
| Sophomore points/60 | 95.7 |
| Points/60 improvement | 97.9 |
| Sophomore OVR | 96.8 |
| Two-season OVR growth | 100.0 |
| Sophomore plus/minus | 95.7 |
| Sophomore shots/60 | 72.3 |

The trajectory is a genuine breakout: poor freshman production followed by top-end sophomore production, strong two-way results and unusually strong development. It is **not** sustained two-season elite production.

## Draft seed recommendation

**84 POT — Top 6 F — Medium certainty (55).**

Why 84:
1. The evidence clears the Top-6 review gate.
2. Elite is deliberately withheld because the freshman season was not high-end; one breakout season cannot seed Elite.
3. Exact intra-tier precision is not supported by the saved evidence, so the policy selects the **lowest numeric value in the supported role tier** rather than pretending 85–89 can be distinguished.
4. Future Potential V2 weekly evidence owns all later promotion or decline.

Supported range: **84–89**. The recommendation uses 84 as the conservative floor.

This is a retrospective canonical seed repair, not a current-week promotion. The junior season has no current-season games, so historical breakout evidence must not also trigger a second immediate V2 increase.

## Clone-only impact rehearsal

A disposable Backup 3 clone was rehearsed at target 84 through the existing strict migration tool:
- result remained read-only and not approved for live use;
- role became Top 6 F;
- certainty reset to 55 / Medium;
- the earlier generic rehearsal previewed Rising solely because 84 exceeded the broken root 74; that behavior is superseded by PR #7's provenance-safe reseed mode;
- under the provenance-safe rehearsal the reseed starts **Stable / Medium (55)**, because the migration itself is not new performance evidence;
- exactly **17 potential-related leaves** change across the canonical roster record and root career mirror, including one explicit `legacy-provenance-reseed` history entry;
- no XP balance, attribute, OVR, stat, schedule, history archive, roster identity or external prospect changed.

Potential-sensitive XP pricing was also reviewed without spending XP. Existing earned XP remains intact; at an 84 seed, three currently banked attribute balances would become affordable under the locked prospective cost rules, but **no upgrade is automatic**.

The provenance-safe 84 clone rehearsal was independently repeated against **both** verified private exports. Both produced the same 17 potential-only leaf changes and preserved every non-potential gameplay field; the two source files remained byte-identical.

Scouting rankings are persistent publications. The migration itself does not republish or rewrite the current board; future legitimate scouting publication cadence remains responsible for any rank movement.

## Policy regression

`tools/potential-v2-canonical-seed-policy.js` contains a pure read-only tier-floor policy. It is not imported by gameplay. Its synthetic regression asserts:
- the verified breakout profile maps to the conservative 84 Top-6 floor;
- sustained two-season elite evidence is required before a 90 Elite seed;
- thinner evidence cannot receive the Top-6 seed;
- inadequate peer samples are withheld.

## Remaining gate

Before a real save write, the user must explicitly approve the canonical seed and migration behavior. Approval of **84** would authorize the already-staged provenance-safe controlled migration path in PR #7 to be finalized for a separate live cutover review; it would not by itself authorize unrelated Potential V2 changes or an immediate save write.

Backup 3 remains the verified rollback baseline because the user confirmed the live career has not been opened, played, simulated or saved since that export.
