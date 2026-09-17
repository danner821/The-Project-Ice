from pathlib import Path

PUB = Path('artifacts/project-ice/public')

# 1) postseason-checkpoint-event.js
p = PUB / 'postseason-checkpoint-event.js'
text = p.read_text()
old = """  if (originalAdvance) {
    WorldEngine.advanceToDate = (targetDate, options = {}) => {
      /*
       * Every entry point—Home, Schedule, or future UI—must establish the
       * postseason checkpoint before attempting a multi-day jump. This makes
       * May 1 behave exactly like a blocking career event: a request for May 8
       * still stops the world on May 1 until the player acknowledges it.
       */
      WorldEngine.reconcileHighSchoolPostseason?.({ save: false });
      normalizeCheckpoint({ save: false });
      return originalAdvance(targetDate, options);
    };
  }
"""
new = """  if (originalAdvance) {
    WorldEngine.advanceToDate = (targetDate, options = {}) => {
      /*
       * Every entry point—Home, Schedule, or future UI—must establish the
       * postseason checkpoint before attempting a multi-day jump. This makes
       * May 1 behave exactly like a blocking career event: a request for May 8
       * still stops the world on May 1 until the player acknowledges it.
       */
      WorldEngine.reconcileHighSchoolPostseason?.({ save: false });
      normalizeCheckpoint({ save: false });
      const result = originalAdvance(targetDate, options);
      window.dispatchEvent(new CustomEvent('projectice:career-date-advanced'));
      return result;
    };
  }
"""
if old not in text:
    raise SystemExit('checkpoint advance anchor not found')
text = text.replace(old, new, 1)
old_tail = """  normalizeCheckpoint({ save: true });

  window.setInterval(() => {
    normalizeCheckpoint({ save: true });
  }, 500);
})();
"""
new_tail = """  normalizeCheckpoint({ save: true });

  window.addEventListener('projectice:postseason-state-ready', () => {
    normalizeCheckpoint({ save: false });
  });
  window.addEventListener('projectice:next-high-school-season-started', () => {
    normalizeCheckpoint({ save: true });
  });
})();
"""
if old_tail not in text:
    raise SystemExit('checkpoint polling tail not found')
text = text.replace(old_tail, new_tail, 1)
p.write_text(text)

# 2) postseason-ui.js
p = PUB / 'postseason-ui.js'
text = p.read_text()
old_tail = """  injectStyles();
  sync();
  window.setInterval(sync, 250);
})();
"""
new_tail = """  injectStyles();
  sync();
  window.addEventListener('projectice:postseason-state-ready', sync);
  window.addEventListener('projectice:career-date-advanced', sync);
  window.addEventListener('projectice:next-high-school-season-started', sync);
})();
"""
if old_tail not in text:
    raise SystemExit('postseason ui polling tail not found')
text = text.replace(old_tail, new_tail, 1)
p.write_text(text)

# 3) season-lifecycle-migrations.js
p = PUB / 'season-lifecycle-migrations.js'
text = p.read_text()
old_tail = """  observeActiveCareer();
  window.setInterval(observeActiveCareer, 250);
})();
"""
new_tail = """  observeActiveCareer();
  window.addEventListener('projectice:postseason-state-ready', observeActiveCareer);
  window.addEventListener('projectice:next-high-school-season-started', observeActiveCareer);
  window.addEventListener('projectice:player-season-recap-complete', observeActiveCareer);
})();
"""
if old_tail not in text:
    raise SystemExit('lifecycle migration polling tail not found')
text = text.replace(old_tail, new_tail, 1)
p.write_text(text)

# Remove one-time migration plumbing from the resulting codebase.
Path('.github/scripts/remove_permanent_polling.py').unlink(missing_ok=True)
Path('.github/workflows/remove-permanent-polling.yml').unlink(missing_ok=True)
