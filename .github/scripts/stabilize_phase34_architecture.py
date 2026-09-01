from pathlib import Path

ROOT = Path('artifacts/project-ice')
PUBLIC = ROOT / 'public'

def read(path):
    return Path(path).read_text(encoding='utf-8')

def write(path, text):
    Path(path).write_text(text, encoding='utf-8')

# ---------------------------------------------------------------------------
# 1) Career load schedule migration must be ADDITIVE, never destructive.
# ---------------------------------------------------------------------------
game_path = PUBLIC / 'game.js'
game = read(game_path)
old = '''  WorldEngine.state.schedule =
    rebuiltSchedule.map(
      newEvent => {
        const existingEvent =
          findExistingEvent(
            newEvent
          );

        if (!existingEvent) {
          return newEvent;
        }

        /*
         * Keep the regenerated event definition, but preserve
         * all saved progress/results from the old record.
         */
        return {
          ...newEvent,
          ...existingEvent,

          /*
           * Preserve canonical identity fields from the new
           * schedule when the old save did not contain them.
           */
          eventId:
            existingEvent.eventId ||
            newEvent.eventId,

          gameId:
            existingEvent.gameId ||
            newEvent.gameId,

          id:
            existingEvent.id ||
            newEvent.id,
        };
      }
    );
'''
new = '''  /*
   * CRITICAL PERSISTENCE RULE:
   * Never replace an existing saved schedule with the regenerated base
   * high-school schedule. Postseason, awards, offseason, Travel Hockey and
   * future career systems append canonical events that do not exist in the
   * freshman base generator. Replacing the array here silently erased those
   * events while leaving player/team stats intact.
   *
   * Instead, use the regenerated schedule only as a source of missing base
   * events and refreshed definitions. Every existing saved event survives.
   */
  const existingIds =
    new Set(
      existingSchedule
        .flatMap(event => [
          event?.eventId,
          event?.gameId,
          event?.id,
        ])
        .filter(Boolean)
        .map(String)
    );

  const mergedSchedule =
    existingSchedule.map(
      existingEvent => {
        const regenerated =
          rebuiltSchedule.find(
            newEvent =>
              findExistingEvent(newEvent) ===
              existingEvent
          ) ||
          null;

        if (!regenerated) {
          return existingEvent;
        }

        return {
          ...regenerated,
          ...existingEvent,
          eventId:
            existingEvent.eventId ||
            regenerated.eventId,
          gameId:
            existingEvent.gameId ||
            regenerated.gameId,
          id:
            existingEvent.id ||
            regenerated.id,
        };
      }
    );

  rebuiltSchedule.forEach(
    newEvent => {
      const ids = [
        newEvent?.eventId,
        newEvent?.gameId,
        newEvent?.id,
      ]
        .filter(Boolean)
        .map(String);

      const alreadyPresent =
        ids.some(id =>
          existingIds.has(id)
        ) ||
        Boolean(
          findExistingEvent(
            newEvent
          )
        );

      if (!alreadyPresent) {
        mergedSchedule.push(
          newEvent
        );
      }
    }
  );

  WorldEngine.state.schedule =
    mergedSchedule.sort(
      (a, b) =>
        String(a?.date || '')
          .localeCompare(
            String(b?.date || '')
          ) ||
        String(
          a?.eventId ||
          a?.gameId ||
          a?.id ||
          ''
        ).localeCompare(
          String(
            b?.eventId ||
            b?.gameId ||
            b?.id ||
            ''
          )
        )
    );
'''
if old not in game:
    raise SystemExit('schedule replacement anchor not found in game.js')
game = game.replace(old, new, 1)

# ---------------------------------------------------------------------------
# 2) Remove the obsolete in-game dev shortcut mutation path.
#    The isolated dev-postseason-shortcut.js is the sole owner now.
# ---------------------------------------------------------------------------
start = game.find("btnDevHub.addEventListener('click', () => {")
end_marker = "\n\nif (btnLiveGameDiagnostic) {"
end = game.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit('legacy dev shortcut block not found in game.js')
legacy_replacement = '''btnDevHub.addEventListener('click', () => {
  /*
   * Safety fallback only.
   *
   * The actual Phase 3.4 dev shortcut is owned by
   * dev-postseason-shortcut.js and runs inside an isolated IndexedDB career.
   * This legacy handler previously changed the active career date and rebuilt
   * WorldEngine.state.schedule, which could destroy postseason/Travel events
   * if the isolated shortcut failed to intercept the click.
   *
   * Never mutate a real career from this fallback path.
   */
  console.warn(
    '[DEV] Isolated Travel Tryouts Eve shortcut is not available; no career data was changed.'
  );
});'''
game = game[:start] + legacy_replacement + game[end:]
write(game_path, game)

# ---------------------------------------------------------------------------
# 3) Exact one-week postseason checkpoint contract.
# ---------------------------------------------------------------------------
trigger_path = PUBLIC / 'postseason-trigger.js'
trigger = read(trigger_path)
if 'const CHECKPOINT_OFFSET_DAYS = 8;' not in trigger:
    raise SystemExit('postseason checkpoint offset anchor not found')
trigger = trigger.replace('const CHECKPOINT_OFFSET_DAYS = 8;', 'const CHECKPOINT_OFFSET_DAYS = 7;', 1)
write(trigger_path, trigger)

# ---------------------------------------------------------------------------
# 4) Fix runtime cleanup filename mismatch.
# ---------------------------------------------------------------------------
vite_path = ROOT / 'vite.config.ts'
vite = read(vite_path)
old_cleanup = '''    if (!html.includes('/dev-career-cleanup.js')) scripts.push('    <script src="/dev-career-cleanup.js"></script>');'''
new_cleanup = '''    if (!html.includes('/dev-save-cleanup.js')) scripts.push('    <script src="/dev-save-cleanup.js"></script>');'''
if old_cleanup not in vite:
    raise SystemExit('dev cleanup Vite injection anchor not found')
vite = vite.replace(old_cleanup, new_cleanup, 1)
write(vite_path, vite)

# ---------------------------------------------------------------------------
# 5) Delete abandoned Travel runtimes. They are not part of the active Vite
#    stack and should not remain as tempting/competing implementations.
# ---------------------------------------------------------------------------
stale = [
    'travel-hockey-polish-runtime-fix.js',
    'travel-hockey-polish.js',
    'travel-hockey-profile-fixes.js',
    'travel-hockey-runtime-v3.js',
    'travel-hockey-runtime-v4.js',
    'travel-hockey-v3-stabilizer.js',
]
removed=[]
for name in stale:
    p = PUBLIC / name
    if p.exists():
        p.unlink()
        removed.append(name)

print('PHASE34_ARCHITECTURE_STABILIZATION=OK')
print('REMOVED_STALE_TRAVEL=' + ','.join(removed))
