from pathlib import Path

ROOT = Path('artifacts/project-ice')
path = ROOT / 'public' / 'career-calendar-projection.js'
vite_path = ROOT / 'vite.config.ts'
p = path.read_text(encoding='utf-8')

anchor = """  const dateKey = event => String(event?.date || '').slice(0, 10);

  const isGame = event => Boolean(
"""
insert = """  const dateKey = event => String(event?.date || '').slice(0, 10);

  /*
   * TRAVEL CALENDAR PROJECTION INTEGRITY
   *
   * Old Travel saves can contain repeated copies of the same completed game.
   * Those copies may no longer share an identical eventId because Travel IDs
   * are season-scoped after creation. The Schedule calendar should never
   * render those historical duplicates as separate cards.
   *
   * Repair canonical state at the calendar boundary using the game identity
   * that actually remains stable across those migrations: date + matchup +
   * series/game number when available. This also cleans the current save so a
   * reopen does not bring the stack back.
   */
  const travelCalendarIdentity = event => {
    if (
      event?.travelTournament !== true &&
      String(event?.type || event?.eventType || '').toLowerCase() !== 'travel-game'
    ) {
      return null;
    }

    const date = dateKey(event);
    const round = String(event?.travelRound || '');
    const gameNumber = Number(event?.travelGameNumber || 0);
    const home = String(event?.homeTeamId || '');
    const away = String(event?.awayTeamId || '');
    const series = String(event?.travelSeriesId || '');

    if (date && home && away) {
      return [
        date,
        home,
        away,
        round,
        gameNumber || '',
      ].join('::');
    }

    if (series && gameNumber > 0) {
      return `${series}::g${gameNumber}`;
    }

    return String(
      event?.canonicalEventId ||
      event?.gameId ||
      event?.eventId ||
      event?.id ||
      ''
    ) || null;
  };

  function repairCanonicalTravelScheduleDuplicates() {
    if (!Array.isArray(WorldEngine.state?.schedule)) return false;

    const seen = new Set();
    const next = [];
    let changed = false;

    for (const event of WorldEngine.state.schedule) {
      const identity = travelCalendarIdentity(event);

      if (!identity) {
        next.push(event);
        continue;
      }

      if (seen.has(identity)) {
        changed = true;
        continue;
      }

      seen.add(identity);
      next.push(event);
    }

    if (changed) {
      WorldEngine.state.schedule = next;
      try { WorldEngine.save?.(); } catch (_) {}
    }

    return changed;
  }

  const isGame = event => Boolean(
"""
if anchor not in p:
    raise SystemExit('calendar projection integrity insertion anchor not found')
p = p.replace(anchor, insert, 1)

old = """  buildSeasonCalendarEvents = function buildCanonicalCareerCalendarEvents() {
    const rawProjected = originalBuildSeasonCalendarEvents();
    const canonical = Array.isArray(WorldEngine.state?.schedule)
"""
new = """  buildSeasonCalendarEvents = function buildCanonicalCareerCalendarEvents() {
    repairCanonicalTravelScheduleDuplicates();

    const rawProjected = originalBuildSeasonCalendarEvents();
    const canonical = Array.isArray(WorldEngine.state?.schedule)
"""
if old not in p:
    raise SystemExit('calendar build wrapper anchor not found')
p = p.replace(old, new, 1)

old = """    return [
      ...projected,
      ...additionalCareerEvents,
    ].sort((a, b) =>
      dateKey(a).localeCompare(dateKey(b)) ||
      eventKey(a).localeCompare(eventKey(b))
    );
"""
new = """    const combined = [
      ...projected,
      ...additionalCareerEvents,
    ];

    const seenTravel = new Set();

    return combined
      .filter(event => {
        const identity = travelCalendarIdentity(event);
        if (!identity) return true;
        if (seenTravel.has(identity)) return false;
        seenTravel.add(identity);
        return true;
      })
      .sort((a, b) =>
        dateKey(a).localeCompare(dateKey(b)) ||
        eventKey(a).localeCompare(eventKey(b))
      );
"""
if old not in p:
    raise SystemExit('calendar combined return anchor not found')
p = p.replace(old, new, 1)

path.write_text(p, encoding='utf-8')

vite = vite_path.read_text(encoding='utf-8')
old_line = """    if (!html.includes('/career-calendar-projection.js')) scripts.push('    <script src="/career-calendar-projection.js"></script>');
"""
new_line = """    if (!html.includes('/career-calendar-projection.js')) scripts.push('    <script src="/career-calendar-projection.js?v=20260920-travel-calendar-integrity-1"></script>');
"""
if old_line in vite:
    vite = vite.replace(old_line, new_line, 1)
elif 'career-calendar-projection.js?v=20260920-travel-calendar-integrity-1' not in vite:
    raise SystemExit('career calendar projection Vite anchor not found')
vite_path.write_text(vite, encoding='utf-8')

Path('.github/scripts/repair_travel_calendar_projection_duplicates.py').unlink(missing_ok=True)
Path('.github/workflows/repair-travel-calendar-projection-duplicates.yml').unlink(missing_ok=True)
