from pathlib import Path

ROOT = Path('artifacts/project-ice')
world_path = ROOT / 'public' / 'world.js'
index_path = ROOT / 'index.html'
world = world_path.read_text(encoding='utf-8')

old = """    const weekBeats = (livingWorld.recentBeats || []).filter(beat => {
      const beatDate = normalizeLivingWorldDateKey(beat?.date);
      return !beatDate || beatDate <= normalizedDate;
    });
"""
new = """    /*
     * AWARD NEWS ACCURACY
     *
     * recentBeats is a rolling history. The previous filter admitted every
     * historical beat whose date was <= the current week, then publishOnce()
     * stamped those old beats with the NEW weekKey/date. That could re-announce
     * an old top-three award entry weeks later even when the canonical award
     * table no longer had that player in the top three.
     *
     * A weekly news pass may consume only beats belonging to that exact week.
     */
    const weekBeats = (livingWorld.recentBeats || []).filter(beat => {
      const beatDate = normalizeLivingWorldDateKey(beat?.date);
      const beatWeek = String(
        beat?.weekKey ||
        (beatDate ? getLivingWorldWeekKey(beatDate) : '')
      );

      return beatWeek === String(weekKey);
    });
"""
if old not in world:
    raise SystemExit('weekBeats filter anchor not found')
world = world.replace(old, new, 1)

anchor = """  function publishLivingWorldNewsForWeek(dateString, weekKey) {
"""
repair = r"""  function repairAwardNewsAccuracy(options = {}) {
    const livingWorld = ensureLivingWorldState();

    if (
      !Array.isArray(_state.newsItems) ||
      !Array.isArray(livingWorld?.awardRaceSnapshots) ||
      livingWorld.awardRaceSnapshots.length === 0
    ) {
      return { changed: false, removed: 0 };
    }

    const snapshotsByDate = new Map();

    for (const snapshot of livingWorld.awardRaceSnapshots) {
      const date = normalizeLivingWorldDateKey(snapshot?.date);
      if (date) snapshotsByDate.set(date, snapshot);
    }

    const contenderName = contender =>
      `${contender?.firstName || ''} ${contender?.lastName || ''}`
        .trim()
        .toLowerCase();

    const raceByLabel = (snapshot, label) =>
      (snapshot?.races || []).find(race =>
        String(race?.label || '')
          .trim()
          .toLowerCase() ===
        String(label || '')
          .trim()
          .toLowerCase()
      ) || null;

    let removed = 0;

    _state.newsItems = _state.newsItems.filter(item => {
      if (String(item?.tag || '').toUpperCase() !== 'AWARDS') {
        return true;
      }

      const itemDate = normalizeLivingWorldDateKey(item?.date);
      const snapshot = snapshotsByDate.get(itemDate);
      if (!snapshot) return true;

      const headline = String(item?.headline || '').trim();

      const topThreeMatch = headline.match(
        /^(.+?) enters the top three in the (.+?) race\.$/i
      );

      if (topThreeMatch) {
        const [, name, awardLabel] = topThreeMatch;
        const race = raceByLabel(snapshot, awardLabel);
        if (!race) return true;

        const supported = (race.contenders || [])
          .slice(0, 3)
          .some(contender =>
            contenderName(contender) ===
            String(name).trim().toLowerCase()
          );

        if (!supported) {
          removed += 1;
          return false;
        }

        return true;
      }

      const leaderMatch = headline.match(
        /^(.+?) moves into the lead for (.+?)\.$/i
      );

      if (leaderMatch) {
        const [, name, awardLabel] = leaderMatch;
        const race = raceByLabel(snapshot, awardLabel);
        if (!race) return true;

        const leader = race.contenders?.[0] || null;
        const supported =
          contenderName(leader) ===
          String(name).trim().toLowerCase();

        if (!supported) {
          removed += 1;
          return false;
        }

        return true;
      }

      return true;
    });

    if (removed > 0 && options.save === true) {
      save();
    }

    return {
      changed: removed > 0,
      removed,
    };
  }

"""
if anchor not in world:
    raise SystemExit('publishLivingWorldNewsForWeek anchor not found')
world = world.replace(anchor, repair + anchor, 1)

old = """        _persistenceHydrated = true;

        /*
         * IndexedDB is now authoritative.
"""
new = """        _persistenceHydrated = true;

        const awardNewsRepair =
          repairAwardNewsAccuracy({
            save: false,
          });

        if (awardNewsRepair.changed) {
          await save();
        }

        /*
         * IndexedDB is now authoritative.
"""
if old not in world:
    raise SystemExit('indexeddb hydration repair anchor not found')
world = world.replace(old, new, 1)

old = """      _persistenceHydrated = true;

      /*
       * Immediately migrate the legacy world into IndexedDB.
       */
      await save();
"""
new = """      _persistenceHydrated = true;

      repairAwardNewsAccuracy({
        save: false,
      });

      /*
       * Immediately migrate the legacy world into IndexedDB.
       */
      await save();
"""
if old not in world:
    raise SystemExit('legacy hydration repair anchor not found')
world = world.replace(old, new, 1)

world_path.write_text(world, encoding='utf-8')

index = index_path.read_text(encoding='utf-8')
import re
index = re.sub(
    r'/world\.js\?v=[^"\']+',
    '/world.js?v=20260920-award-news-accuracy-1',
    index,
    count=1,
)
index_path.write_text(index, encoding='utf-8')

Path('.github/scripts/fix_award_news_accuracy.py').unlink(missing_ok=True)
Path('.github/workflows/fix-award-news-accuracy.yml').unlink(missing_ok=True)
