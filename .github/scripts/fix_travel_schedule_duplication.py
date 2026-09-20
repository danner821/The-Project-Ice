from pathlib import Path

ROOT = Path('artifacts/project-ice')
engine_path = ROOT / 'public' / 'travel-hockey-tournament-engine.js'
season_ui_path = ROOT / 'public' / 'travel-hockey-season-ui.js'
engine = engine_path.read_text(encoding='utf-8')

anchor = """  function syncCareerTravelSchedule(state = travel()) {
    if (!state?.tournament || !Array.isArray(WorldEngine.state?.schedule)) return false;
    const schedule = WorldEngine.state.schedule;
    const active = careerSeries(state);
"""
insert = """  function dedupeTravelCareerSchedule() {
    if (!Array.isArray(WorldEngine.state?.schedule)) return false;

    const seen = new Set();
    const next = [];
    let changed = false;

    for (const event of WorldEngine.state.schedule) {
      if (
        event?.travelTournament !== true &&
        String(event?.type || '') !== 'travel-game'
      ) {
        next.push(event);
        continue;
      }

      const seriesId = String(event?.travelSeriesId || '');
      const gameNumber = Number(event?.travelGameNumber || 0);

      /*
       * TRAVEL SCHEDULE IDENTITY
       *
       * Travel season IDs are normalized by travel-season-id-integrity.js.
       * The old schedule sync looked up games only by eventId. Once the ID
       * normalizer scoped that eventId, the next sync could no longer find it
       * and pushed another copy of the same series/game number. Repeated Travel
       * refreshes therefore stacked identical calendar cards on one date.
       *
       * The stable identity is the tournament series + game number.
       */
      const stableKey =
        seriesId && gameNumber > 0
          ? `${seriesId}::g${gameNumber}`
          : String(
              event?.canonicalEventId ||
              event?.gameId ||
              event?.eventId ||
              event?.id ||
              ''
            );

      if (stableKey && seen.has(stableKey)) {
        changed = true;
        continue;
      }

      if (stableKey) seen.add(stableKey);
      next.push(event);
    }

    if (changed) {
      WorldEngine.state.schedule = next;
    }

    return changed;
  }

  function syncCareerTravelSchedule(state = travel()) {
    if (!state?.tournament || !Array.isArray(WorldEngine.state?.schedule)) return false;

    dedupeTravelCareerSchedule();

    const schedule = WorldEngine.state.schedule;
    const active = careerSeries(state);
"""
if anchor not in engine:
    raise SystemExit('syncCareerTravelSchedule anchor not found')
engine = engine.replace(anchor, insert, 1)

old = """      const eventId = `travel-career-${series.seriesId}-g${gameNumber}`;
      const existing = WorldEngine.state.schedule.find(event => String(event?.eventId || event?.id || '') === eventId) || null;
"""
new = """      const eventId = `travel-career-${series.seriesId}-g${gameNumber}`;

      const existing = WorldEngine.state.schedule.find(event =>
        (
          String(event?.travelSeriesId || '') === String(series.seriesId || '') &&
          Number(event?.travelGameNumber || 0) === gameNumber
        ) ||
        String(event?.eventId || event?.id || '') === eventId
      ) || null;
"""
if old not in engine:
    raise SystemExit('Travel existing-event lookup anchor not found')
engine = engine.replace(old, new, 1)

old = """    WorldEngine.state.schedule.sort((a,b) => String(a?.date || '').localeCompare(String(b?.date || '')));
    return true;
  }
"""
new = """    dedupeTravelCareerSchedule();

    WorldEngine.state.schedule.sort((a,b) =>
      String(a?.date || '').localeCompare(String(b?.date || '')) ||
      String(a?.eventId || a?.id || '').localeCompare(String(b?.eventId || b?.id || ''))
    );

    return true;
  }
"""
if old not in engine:
    raise SystemExit('Travel schedule return anchor not found')
engine = engine.replace(old, new, 1)

engine_path.write_text(engine, encoding='utf-8')

season_ui = season_ui_path.read_text(encoding='utf-8')
old_loader = "  engine.src = '/travel-hockey-tournament-engine.js';"
new_loader = "  engine.src = '/travel-hockey-tournament-engine.js?v=20260920-schedule-dedupe-1';"
if old_loader in season_ui:
    season_ui = season_ui.replace(old_loader, new_loader, 1)
elif 'travel-hockey-tournament-engine.js?v=20260920-schedule-dedupe-1' not in season_ui:
    raise SystemExit('Travel tournament engine dynamic-loader anchor not found')
season_ui_path.write_text(season_ui, encoding='utf-8')

Path('.github/scripts/fix_travel_schedule_duplication.py').unlink(missing_ok=True)
Path('.github/workflows/fix-travel-schedule-duplication.yml').unlink(missing_ok=True)
