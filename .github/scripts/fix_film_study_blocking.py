from pathlib import Path

ROOT = Path('artifacts/project-ice')
film_path = ROOT / 'public' / 'film-study-event.js'
vite_path = ROOT / 'vite.config.ts'
p = film_path.read_text(encoding='utf-8')

# 1) Make normalized Film Study a first-class event type instead of leaving it
# masquerading as Recovery. That prevents generic recovery simulation from
# auto-resolving it when the calendar advances.
old = """    const identifiers = [event.type, event.eventType, event.eventKey]
      .map(value => String(value || '').trim().toLowerCase());
    const isRecovery = identifiers.some(value => value === 'recovery' || value === 'recovery-sleep');
    if (!isRecovery) return false;
"""
new = """    const identifiers = [event.type, event.eventType, event.eventKey]
      .map(value => String(value || '').trim().toLowerCase());
    const isFilmStudySource = identifiers.some(value =>
      value === 'recovery' ||
      value === 'recovery-sleep' ||
      value === 'film-study'
    );
    if (!isFilmStudySource) return false;
"""
if old not in p:
    raise SystemExit('film source guard anchor not found')
p = p.replace(old, new, 1)

anchor = """    set('label', event.isPlayoff ? 'Playoff Film Study' : 'Film Study');
"""
insert = """    set('type', 'film-study');
    set('eventType', 'film-study');
    set('eventKey', 'film-study');
    set('label', event.isPlayoff ? 'Playoff Film Study' : 'Film Study');
"""
if anchor not in p:
    raise SystemExit('film type anchor not found')
p = p.replace(anchor, insert, 1)

# 2) Current-event resolution must recognize the new canonical type.
old = """    return schedule.find(event =>
      String(event?.date || '') === String(currentDate || '') &&
      String(event?.type || event?.eventType || '').toLowerCase() === 'recovery' &&
      event?.completed !== true && event?.isCompleted !== true
    ) || null;
"""
new = """    return schedule.find(event => {
      const type = String(event?.type || event?.eventType || '').toLowerCase();
      const key = String(event?.eventKey || '').toLowerCase();
      return (
        String(event?.date || '') === String(currentDate || '') &&
        (type === 'film-study' || key === 'film-study') &&
        event?.completed !== true &&
        event?.isCompleted !== true
      );
    }) || null;
"""
if old not in p:
    raise SystemExit('film current event resolver anchor not found')
p = p.replace(old, new, 1)

# 3) Make WorldEngine advancement itself respect Film Study as a blocking
# interaction. This covers Home, Schedule, and any future caller—not only one UI.
anchor = """  normalizeCatalog();

  /*
   * Canonical schedule boundary: every regular-season schedule generated for
"""
block = """  normalizeCatalog();

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\\d{4}-\\d{2}-\\d{2}$/.test(text) ? text : null;
  };

  function currentCareerDate() {
    return dateKey(
      WorldEngine.state?.season?.currentDate ||
      WorldEngine.state?.player?.currentDate ||
      WorldEngine.state?.currentDate
    );
  }

  function isPendingFilmStudy(event) {
    if (!event) return false;
    const type = String(event?.type || event?.eventType || '').toLowerCase();
    const key = String(event?.eventKey || '').toLowerCase();

    return Boolean(
      (type === 'film-study' || key === 'film-study') &&
      event?.completed !== true &&
      event?.isCompleted !== true &&
      event?.played !== true &&
      String(event?.status || '').toLowerCase() !== 'completed' &&
      event?.canceled !== true
    );
  }

  function firstPendingFilmStudyBetween(startDate, targetDate) {
    const start = dateKey(startDate);
    const target = dateKey(targetDate);
    if (!start || !target || target < start) return null;

    const schedule = Array.isArray(WorldEngine.state?.schedule)
      ? WorldEngine.state.schedule
      : [];

    return schedule
      .filter(isPendingFilmStudy)
      .filter(event => {
        const date = dateKey(event?.date);
        return Boolean(date && date >= start && date <= target);
      })
      .sort((a, b) =>
        String(a?.date || '').localeCompare(String(b?.date || '')) ||
        String(a?.eventId || a?.id || '').localeCompare(String(b?.eventId || b?.id || ''))
      )[0] || null;
  }

  const originalAdvanceToDate =
    typeof WorldEngine.advanceToDate === 'function'
      ? WorldEngine.advanceToDate.bind(WorldEngine)
      : null;

  if (originalAdvanceToDate && !WorldEngine.__filmStudyBlockingAdvanceWrapped) {
    WorldEngine.advanceToDate = function filmStudyAwareAdvance(targetDate, options = {}) {
      normalizeSchedule({ save: false });

      const start = currentCareerDate();
      const target = dateKey(targetDate);
      const blocker = firstPendingFilmStudyBetween(start, target);

      if (!blocker) {
        return originalAdvanceToDate(targetDate, options);
      }

      const blockDate = dateKey(blocker.date);
      let baseResult = null;

      if (start && blockDate && blockDate > start) {
        baseResult = originalAdvanceToDate(blockDate, options);
      }

      const stillPending = isPendingFilmStudy(blocker);
      if (!stillPending) {
        return baseResult ?? originalAdvanceToDate(targetDate, options);
      }

      return {
        ...(baseResult && typeof baseResult === 'object' ? baseResult : {}),
        currentDate: blockDate || currentCareerDate(),
        targetDate: target,
        reachedTarget: false,
        stopSimulation: true,
        blockingDateResult: {
          date: blockDate || currentCareerDate(),
          stopSimulation: true,
          blockingEventResult: {
            event: blocker,
            reason: 'film-study-awaiting-user-choice',
          },
        },
        blockingEventResult: {
          event: blocker,
          reason: 'film-study-awaiting-user-choice',
        },
        reason: 'player-interaction-required',
      };
    };

    WorldEngine.__filmStudyBlockingAdvanceWrapped = true;
  }

  /*
   * Canonical schedule boundary: every regular-season schedule generated for
"""
if anchor not in p:
    raise SystemExit('film advance wrapper anchor not found')
p = p.replace(anchor, block, 1)

film_path.write_text(p, encoding='utf-8')

# Force the fixed Film Study runtime through Cloudflare/iPhone cache.
vite = vite_path.read_text(encoding='utf-8')
vite = vite.replace(
    '/film-study-event.js?v=20260919-save-integrity-1',
    '/film-study-event.js?v=20260919-blocking-1'
)
vite_path.write_text(vite, encoding='utf-8')

Path('.github/scripts/fix_film_study_blocking.py').unlink(missing_ok=True)
Path('.github/workflows/fix-film-study-blocking.yml').unlink(missing_ok=True)
