'use strict';

(() => {
  const TRACE_KEY = 'projectice_persistence_trace_v1';
  const ACTIVE_KEY = 'projectice_active_career_id_v1';
  const PENDING_KEY = 'projectice_pending_career_id_v1';
  const DB_NAME = 'projectice_database';
  const DB_VERSION = 1;
  const STORE_NAME = 'worlds';

  function dateOf(world) {
    return (
      world?.season?.currentDate ||
      world?.player?.currentDate ||
      world?.currentDate ||
      null
    );
  }

  function careerPlayerDate(world) {
    const wanted = String(
      world?.player?.playerId ||
      world?.player?.id ||
      'career-player'
    );

    for (const team of world?.teams || []) {
      const player = (team?.roster || []).find(item =>
        item?.isCareerPlayer === true ||
        String(item?.playerId || item?.id || '') === wanted
      );
      if (player) return player.currentDate || null;
    }
    return null;
  }

  function filmStudyState(world) {
    const event = (world?.schedule || []).find(item =>
      String(item?.label || item?.shortLabel || '').toLowerCase().includes('film study') &&
      String(item?.date || '').endsWith('-09-02')
    );
    if (!event) return null;
    return {
      date: event.date || null,
      id: event.id || event.eventId || null,
      completed: Boolean(event.completed || event.isCompleted || event.played),
      status: event.status || null,
    };
  }

  /*
   * Read-only postseason integrity diagnostic. The May 2025 non-qualifier
   * checkpoint regression can originate from a missing bracket, an old
   * acknowledged bracket, unfinished league games, or a mismatched season.
   * Inspect the SAVED world rather than attempting another blind clock reset.
   */
  function postseasonAudit(world) {
    if (!world || typeof world !== 'object') return null;
    const dateKey = value => {
      const key = String(value || '').slice(0, 10);
      return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : null;
    };
    const season = world.season || {};
    const post = world.postseason?.highSchool || null;
    const date = dateOf(world);
    const startYear = Number(season.seasonStartYear) || null;
    const seasonEnd = startYear ? `${startYear + 1}-08-31` : null;
    const seasonStart = startYear ? `${startYear}-09-01` : null;
    const regular = (Array.isArray(world.schedule) ? world.schedule : [])
      .filter(game => {
        const d = dateKey(game?.date);
        return Boolean(
          d && game?.homeTeamId && game?.awayTeamId &&
          game?.isPlayoff !== true &&
          game?.travelTournament !== true &&
          game?.type !== 'travel-game' &&
          (!seasonStart || d >= seasonStart) &&
          (!seasonEnd || d <= seasonEnd)
        );
      });
    const final = game => {
      const hasScore = game?.homeScore != null && game?.awayScore != null &&
        Number.isFinite(Number(game.homeScore)) &&
        Number.isFinite(Number(game.awayScore));
      return game?.played === true || game?.completed === true ||
        String(game?.status || '').toLowerCase() === 'final' || hasScore;
    };
    const pending = regular.filter(game => !final(game));
    const dates = regular.map(game => dateKey(game.date)).filter(Boolean).sort();
    const playoffs = (Array.isArray(world.schedule) ? world.schedule : [])
      .filter(game => game?.isPlayoff === true && game?.type === 'game');
    const travel = world.travelHockey || {};
    const activeRecovery = Object.entries(world.history?.recoveryMigrations || {})
      .filter(([key]) => key.includes(String(season.seasonId || season.id || '')))
      .map(([key, record]) => ({
        key,
        from: record?.fromDate || null,
        to: record?.toDate || null,
      }));
    return {
      date,
      seasonId: season.seasonId || season.id || null,
      schoolYear: season.schoolYear || null,
      phase: season.phase || null,
      regularSeason: season.regularSeason || null,
      seasonPostseason: season.postseason || null,
      games: {
        total: regular.length,
        final: regular.length - pending.length,
        pending: pending.length,
        pendingExamples: pending.slice(0, 5).map(game => ({
          date: game.date, id: game.id || game.gameId,
          home: game.homeTeamId, away: game.awayTeamId,
          status: game.status || null,
        })),
        firstDate: dates[0] || null,
        lastDate: dates[dates.length - 1] || null,
      },
      postseason: post ? {
        initialized: post.initialized ?? null,
        version: post.version ?? null,
        status: post.status || null,
        endDate: post.regularSeasonEndDate || null,
        checkpointDate: post.checkpointDate || null,
        acknowledged: post.checkpointAcknowledged ?? null,
        acknowledgedAt: post.checkpointAcknowledgedAt || null,
        playoffStartDate: post.playoffStartDate || null,
        qualifiers: post.qualifiers?.length ?? null,
        roundOne: post.bracket?.rounds?.roundOne?.length ?? null,
        champion: post.championTeamId || null,
      } : null,
      playoffScheduleGames: playoffs.length,
      playedPlayoffGames: playoffs.filter(final).length,
      travel: {
        status: travel.status || null,
        tryoutResult: Boolean(travel.tryoutResult),
        placementLevel: travel.placementLevel || null,
        completed: travel.completed === true,
      },
      recovery: activeRecovery,
    };
  }

  async function readRecords() {
    return await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.close();
          resolve([]);
          return;
        }
        const tx = db.transaction(STORE_NAME, 'readonly');
        const getAll = tx.objectStore(STORE_NAME).getAll();
        getAll.onsuccess = () => {
          const records = Array.isArray(getAll.result) ? getAll.result : [];
          db.close();
          resolve(records);
        };
        getAll.onerror = () => {
          db.close();
          reject(getAll.error);
        };
      };
    });
  }

  function ensureButton() {
    if (document.getElementById('pi-save-trace-button')) return;

    const button = document.createElement('button');
    button.id = 'pi-save-trace-button';
    button.type = 'button';
    button.textContent = 'SAVE TRACE';
    button.style.cssText = [
      'position:fixed',
      'right:10px',
      'top:max(10px,env(safe-area-inset-top))',
      'z-index:20000',
      'border:1px solid rgba(120,170,255,.55)',
      'background:#0a1830',
      'color:#9fc4ff',
      'border-radius:999px',
      'padding:7px 10px',
      'font:700 10px/1 system-ui',
      'letter-spacing:.08em'
    ].join(';');

    button.addEventListener('click', openPanel);
    document.body.appendChild(button);
  }

  async function openPanel() {
    document.getElementById('pi-save-trace-panel')?.remove();

    let records = [];
    let error = null;
    try {
      records = await readRecords();
    } catch (err) {
      error = String(err?.message || err);
    }

    let trace = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(TRACE_KEY) || '[]');
      trace = Array.isArray(parsed) ? parsed : [];
    } catch (_) {}

    const liveWorld =
      typeof WorldEngine !== 'undefined' ? WorldEngine : null;
    const activeRecord = records.find(record =>
      String(record?.id || '') === 'career:' +
      String(localStorage.getItem(ACTIVE_KEY) || '')
    );

    const recoveryDiagnostic = {
      latestAttempt: window.__projectIcePostseasonRecoveryStatus || null,
      runtimeSeasonEndDate:
        liveWorld?.getHighSchoolRegularSeasonEndDate?.() || null,
      runtimeDate: dateOf(liveWorld?.state),
      backupRecords: records
        .filter(record => record?.recoveryBackup === true)
        .map(record => ({
          savedAt: record.savedAt || null,
          seasonId: record?.world?.season?.seasonId || null,
          date: dateOf(record.world),
        })),
      activeSaved: postseasonAudit(activeRecord?.world),
      activeMemory: postseasonAudit(liveWorld?.state),
    };

    const payload = {
      now: new Date().toISOString(),
      activeCareerId: localStorage.getItem(ACTIVE_KEY) || null,
      pendingCareerId: localStorage.getItem(PENDING_KEY) || null,
      recoveryDiagnostic,
      postseasonAudit: postseasonAudit(liveWorld?.state),
      memory: {
        date: dateOf(liveWorld?.state),
        playerDate: liveWorld?.state?.player?.currentDate || null,
        rosterCareerDate: careerPlayerDate(liveWorld?.state),
        filmStudySept2: filmStudyState(liveWorld?.state),
      },
      indexedDB: records.map(record => ({
        id: record?.id || null,
        careerId: record?.careerId || record?.world?.persistence?.careerId || null,
        savedAt: record?.savedAt || null,
        revision: record?.revision ?? record?.world?.persistence?.revision ?? null,
        date: dateOf(record?.world),
        playerDate: record?.world?.player?.currentDate || null,
        rosterCareerDate: careerPlayerDate(record?.world),
        postseasonAudit: postseasonAudit(record?.world),
        filmStudySept2: filmStudyState(record?.world),
      })),
      trace: trace.slice(-35),
      error,
    };

    const panel = document.createElement('section');
    panel.id = 'pi-save-trace-panel';
    panel.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:30000',
      'background:#040914',
      'color:#edf4ff',
      'padding:max(18px,env(safe-area-inset-top)) 14px max(24px,env(safe-area-inset-bottom))',
      'overflow:auto',
      'font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace'
    ].join(';');

    panel.innerHTML = `
      <div style="max-width:680px;margin:0 auto">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;position:sticky;top:0;background:#040914;padding:6px 0 12px">
          <strong style="font:800 16px/1 system-ui">Project Ice Save Trace</strong>
          <button type="button" data-close style="border:1px solid #36527d;background:#10213d;color:#fff;border-radius:12px;padding:8px 12px">Close</button>
        </div>
        <p style="color:#8fb5f3;font-family:system-ui">Read-only recovery blocker diagnosis. Send the diagnosis below; no gameplay progress will be changed by Save Trace.</p>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:0 0 22px;padding:12px;border:1px solid #8e6242;border-radius:12px;background:#201a17">${JSON.stringify(payload.recoveryDiagnostic, null, 2)}</pre>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:0 0 22px;padding:12px;border:1px solid #36527d;border-radius:12px;background:#091a31">${JSON.stringify({memory:payload.postseasonAudit,savedActive:payload.indexedDB.find(record=>record.careerId===payload.activeCareerId)?.postseasonAudit||null},null,2)}</pre>
        <details><summary style="font:700 14px system-ui;color:#9fc4ff">Full persistence trace</summary>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:12px 0 0">${JSON.stringify(payload, null, 2)}</pre></details>
      </div>
    `;

    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    document.body.appendChild(panel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureButton, { once: true });
  } else {
    ensureButton();
  }
})();
