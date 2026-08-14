# Project Ice — Save Schema and Migration Policy

Updated: 2026-08-14
Status: Canonical persistence policy

## Purpose

Project Ice now has enough persistent world state that save compatibility must be treated as a first-class system. This document defines where state lives, what may be migrated, and what must never be silently reset.

## Canonical storage model

### 1. Full world state — IndexedDB

The complete persistent game world lives in IndexedDB:

- Database: `projectice_database`
- Store: `worlds`
- Record: `default`
- Record payload: canonical `WorldEngine` state

This is the source of truth for rosters, schedules, completed results, standings, statistics, player development, season state, history, scouting/world data and future multi-season systems.

The full world must not be moved back to localStorage.

### 2. Career preview — localStorage

`projectice_save` is a lightweight Continue Career preview only.

It may contain enough information to identify and present the career player and route Continue Career, but it is not the canonical source for world progression.

If this preview is absent while a valid IndexedDB career exists, `career-persistence.js` may reconstruct it from canonical world state.

### 3. Legacy world storage — migration source only

`projectice_world` in localStorage is legacy storage. It may be read only for compatibility/migration with older careers and should not receive new full-world writes.

## Versioning

Project Ice uses two separate version concepts:

- `previewVersion`: version of the lightweight Continue Career preview contract.
- `worldSchemaVersion`: version of the canonical IndexedDB world contract.

Existing saves that predate explicit `worldSchemaVersion` are treated as schema version `1`.

New incompatible world-shape changes must increment `worldSchemaVersion` and provide a forward migration before the new shape is assumed by gameplay code.

## Migration rules

1. Migrations are forward-only. Never downgrade a newer save into an older shape.
2. Migrations must be idempotent. Running the same migration twice must not duplicate schedules, stats, history, players, events or awards.
3. Preserve player identity. `playerId`/career-player identity must remain stable across migrations.
4. Preserve completed games. A migration must never turn a completed game back into an unplayed game.
5. Preserve date/season position. `season.currentDate` and equivalent career progress must not silently rewind.
6. Preserve statistics/history. Existing player/team results must not be recalculated unless an explicit migration requires it.
7. Add defaults rather than reset objects. New fields should normally be added with safe defaults while retaining unknown existing fields.
8. Do not delete legacy fields until every active reader has been migrated and regression-tested.
9. Persist only after a migration succeeds. A failed migration should leave the last readable canonical save intact whenever possible.
10. Log migrations with old version, new version and migration name for debugging.

## Required schema fields going forward

Canonical world records should converge on these top-level persistence metadata fields:

```js
{
  worldSchemaVersion: 1,
  lastSavedAt: 'ISO timestamp',
  // existing canonical world fields...
}
```

The lightweight preview should converge on:

```js
{
  previewVersion: 1,
  savedAt: 'ISO timestamp',
  player: {
    playerId: 'stable career player id',
    // lightweight display/routing fields only
  },
  worldRef: 'default'
}
```

Compatibility readers may continue accepting the existing preview `version: '0.0.3'` during migration.

## Persistence invariants

After any action that permanently changes the career world, the canonical IndexedDB world must be persisted before the UI presents that action as permanently complete where practical.

Critical examples:

- Play Game finalization
- Sim Game completion
- date advancement
- practice/training completion
- attribute/development changes
- season transitions
- draft/career transitions
- permanent scouting/history events

A successful reload through Continue Career must reproduce the same canonical state.

## Regression rule

Any persistence-related change must be tested against `PROJECT_ICE_REGRESSION.md` before it is considered complete.
