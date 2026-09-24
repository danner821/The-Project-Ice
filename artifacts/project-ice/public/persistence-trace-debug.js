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

  /*
   * Read-only annual recap diagnosis for the live iPhone save.
   * Compare in-memory and persisted state before changing any season flags.
   */
  function seasonRecapAudit(world) {
    if (!world || typeof world !== 'object') return null;
    const season = world.season || {};
    const recap = world.seasonTransition?.recap || {};
    const seasonId = String(season.seasonId || season.id || '');
    const liveId = seasonId ? 'high-school-season-recap:' + seasonId : null;
    const events = (Array.isArray(world.schedule) ? world.schedule : [])
      .filter(event => /high-school-season-recap|season.recap/i.test(
        String(event?.eventId || event?.id || '') + ' ' +
        String(event?.eventKey || event?.type || '') + ' ' +
        String(event?.label || '')
      ))
      .map(event => ({
        id: event?.eventId || event?.id || null,
        date: event?.date || null,
        completed: event?.completed ?? null,
        played: event?.played ?? null,
        isCompleted: event?.isCompleted ?? null,
        status: event?.status || null,
        requiresPlayerInteraction: event?.requiresPlayerInteraction ?? null,
        completedAt: event?.completedAt || null,
      }));
    const archives = world.history?.highSchoolSeasonArchives;
    return {
      seasonId: seasonId || null,
      date: dateOf(world),
      phase: season.phase || null,
      travelCompleted: world.travelHockey?.completed === true,
      closeoutAcknowledged: world.travelHockey?.tournament?.closeoutAcknowledged ?? null,
      closeoutAcknowledgedAt: world.travelHockey?.tournament?.closeoutAcknowledgedAt || null,
      checkpointDate: world.offseasonDevelopment?.checkpointDate || null,
      recap: {
        recapSeasonId: recap.recapSeasonId || null,
        archiveId: recap.archiveId || null,
        leagueRecapAcknowledged: recap.leagueRecapAcknowledged ?? null,
        leagueRecapAcknowledgedAt: recap.leagueRecapAcknowledgedAt || null,
        playerRecapAcknowledged: recap.playerRecapAcknowledged ?? null,
        playerRecapAcknowledgedAt: recap.playerRecapAcknowledgedAt || null,
        nextSeasonTransitionComplete: recap.nextSeasonTransitionComplete ?? null,
        nextSeasonTransitionStarted: recap.nextSeasonTransitionStarted ?? null,
        nextSeasonSeededSeasonId: recap.nextSeasonSeededSeasonId || null,
        nextSeasonId: recap.nextSeasonId || null,
      },
      liveEventId: liveId,
      liveEvent: events.find(event => event.id === liveId) || null,
      allRecapEvents: events,
      archiveShape: Array.isArray(archives) ? 'array'
        : archives && typeof archives === 'object' ? 'object' : null,
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

  /*
   * An imported backup is tested ONLY against a unique disposable database.
   * This deliberately never opens projectice_database or writes localStorage.
   * The export remains the recovery source until an actual restore mechanism
   * has separately been implemented and validated.
   */
  async function testDownloadedBackup(file) {
    if (!file || !/\.json$/i.test(file.name || '')) {
      throw new Error('Choose the downloaded Project Ice .json backup.');
    }
    if (file.size > 100 * 1024 * 1024) {
      throw new Error('The selected file is unexpectedly large.');
    }
    const backup = JSON.parse(await file.text());
    const careerId = String(backup?.activeCareerId || '');
    const original = backup?.activeRecord;
    const world = original?.world;
    if (backup?.format !== 'projectice-career-backup' ||
        backup?.version !== 1 || !careerId ||
        original?.id !== 'career:' + careerId ||
        original?.careerId !== careerId ||
        !world || !Array.isArray(world.teams) ||
        !Array.isArray(world.externalProspects) ||
        !world?.season?.seasonId || !world?.currentDate) {
      throw new Error('Invalid or incomplete Project Ice backup envelope.');
    }
    const roster = world.teams.flatMap(team =>
      Array.isArray(team?.roster) ? team.roster : []
    );
    const careerPlayers = roster.filter(player => player?.isCareerPlayer === true);
    if (careerPlayers.length !== 1) {
      throw new Error('Backup does not contain exactly one career player.');
    }
    const currentCareerId = localStorage.getItem(ACTIVE_KEY);
    if (currentCareerId && currentCareerId !== careerId) {
      throw new Error('Backup belongs to another career. Your current save was not touched.');
    }

    const testDbName = 'projectice_restore_disposable_test_' +
      Date.now() + '_' + Math.random().toString(36).slice(2);
    let database = null;
    let opened = false;
    let result = null;
    let cleanupStatus = 'not-started';
    try {
      database = await new Promise((resolve, reject) => {
        const request = indexedDB.open(testDbName, 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore('worlds', { keyPath: 'id' });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Could not create isolated test database.'));
      });
      opened = true;
      await new Promise((resolve, reject) => {
        const tx = database.transaction('worlds', 'readwrite');
        tx.objectStore('worlds').put(original);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Disposable restore write failed.'));
        tx.onabort = () => reject(tx.error || new Error('Disposable restore aborted.'));
      });
      /* Do not close the database until the entire read transaction completes.
       * Resolving on request.onsuccess can race with Safari's transaction cleanup,
       * leaving deleteDatabase temporarily blocked by our own connection.
       */
      const restored = await new Promise((resolve, reject) => {
        const tx = database.transaction('worlds', 'readonly');
        const request = tx.objectStore('worlds').get(original.id);
        let record = null;
        request.onsuccess = () => { record = request.result; };
        request.onerror = () => reject(request.error || new Error('Disposable restore read failed.'));
        tx.oncomplete = () => resolve(record);
        tx.onerror = () => reject(tx.error || new Error('Disposable restore transaction failed.'));
        tx.onabort = () => reject(tx.error || new Error('Disposable restore transaction aborted.'));
      });
      const restoredRoster = (restored?.world?.teams || []).flatMap(team =>
        Array.isArray(team?.roster) ? team.roster : []
      );
      const restoredCareer = restoredRoster.find(player => player?.isCareerPlayer === true);
      if (!restored || restored.id !== original.id ||
          restored.careerId !== careerId ||
          restored.revision !== original.revision ||
          restored.world?.currentDate !== world.currentDate ||
          restored.world?.season?.seasonId !== world.season.seasonId ||
          restoredRoster.length !== roster.length ||
          restored.world.externalProspects.length !== world.externalProspects.length ||
          restoredCareer?.id !== careerPlayers[0].id ||
          restoredCareer?.overall !== careerPlayers[0].overall ||
          restoredCareer?.potential !== careerPlayers[0].potential ||
          restoredCareer?.development?.potential !== careerPlayers[0].development?.potential) {
        throw new Error('Isolated restore verification found mismatched saved data.');
      }
      result = {
        date: world.currentDate,
        season: world.season.seasonId,
        player: [careerPlayers[0].firstName, careerPlayers[0].lastName].filter(Boolean).join(' '),
        overall: careerPlayers[0].overall,
        rosterCount: roster.length,
        externalCount: world.externalProspects.length,
      };
    } finally {
      if (database) database.close();
      if (opened) {
        /* onblocked is a progress event, NOT a failed deletion.
         * iOS WebKit can fire it while the just-finished read transaction
         * is releasing its connection. Keep the delete request alive and
         * distinguish the restore verdict from disposable-db cleanup.
         */
        cleanupStatus = await new Promise(resolve => {
          let finished = false;
          let blocked = false;
          const finish = status => {
            if (finished) return;
            finished = true;
            clearTimeout(timeout);
            resolve(status);
          };
          const timeout = setTimeout(
            () => finish(blocked ? 'pending-blocked' : 'pending'),
            12000
          );
          try {
            const request = indexedDB.deleteDatabase(testDbName);
            request.onsuccess = () => finish('deleted');
            request.onerror = () => finish('delete-error');
            request.onblocked = () => {
              blocked = true;
              if (database) database.close();
              /* Let Safari release the connection; don't abort the request. */
            };
          } catch (_) {
            finish('delete-error');
          }
        });
      }
    }
    if (result) result.cleanupStatus = cleanupStatus;
    return result;
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
      seasonRecapDiagnostic: { activeMemory: seasonRecapAudit(liveWorld?.state), activeSaved: seasonRecapAudit(activeRecord?.world) },
      seasonTransitionTrace: (() => { try { return JSON.parse(localStorage.getItem('projectice_transition_trace_v1') || '[]'); } catch (_) { return []; } })(),
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
        <div style="margin-bottom:18px;padding:14px;border:1px solid #406eae;border-radius:14px;background:#0c203c;font-family:system-ui">
          <strong style="display:block;font-size:15px">Career backup</strong>
          <p style="color:#abc3e9;font-size:13px">Export a copy of the complete active IndexedDB career record. This does not save, overwrite, or advance your game. Keep the downloaded JSON file private.</p>
          <button type="button" data-export-career ${activeRecord?.world ? '' : 'disabled'} style="padding:10px 14px;border:1px solid #7aabed;border-radius:10px;background:#245fb2;color:white;font:700 14px system-ui">Download career backup (.json)</button>
          <p data-export-status style="font-size:12px;color:#abc3e9;margin:10px 0 0">${activeRecord?.world ? 'Active career record found.' : 'Active career record unavailable — no backup can be exported.'}</p>
          <div style="height:1px;background:#36527d;margin:14px 0"></div>
          <input data-backup-file type="file" accept=".json,application/json" style="display:none" />
          <button data-verify-backup type="button" style="padding:10px 14px;border:1px solid #7aabed;border-radius:10px;background:#102b50;color:#fff;font:700 14px system-ui">Verify downloaded backup (isolated test)</button>
          <p data-verify-status style="font-size:12px;color:#abc3e9;margin:10px 0 0">Choose the JSON file in iPhone Files. The test uses a separate temporary database and will never overwrite your career.</p>
        </div>
        <h2 style="color:#9fc4ff;font:800 15px system-ui">Season transition — last recorded stages</h2>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:0 0 22px;padding:12px;border:1px solid #36527d;border-radius:12px;background:#091a31">${JSON.stringify(payload.seasonTransitionTrace, null, 2)}</pre>
        <h2 style="color:#9fc4ff;font:800 15px system-ui">Season Recap — memory vs saved</h2>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:0 0 22px;padding:12px;border:1px solid #36527d;border-radius:12px;background:#091a31">${JSON.stringify(payload.seasonRecapDiagnostic, null, 2)}</pre>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:0 0 22px;padding:12px;border:1px solid #8e6242;border-radius:12px;background:#201a17">${JSON.stringify(payload.recoveryDiagnostic, null, 2)}</pre>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:0 0 22px;padding:12px;border:1px solid #36527d;border-radius:12px;background:#091a31">${JSON.stringify({memory:payload.postseasonAudit,savedActive:payload.indexedDB.find(record=>record.careerId===payload.activeCareerId)?.postseasonAudit||null},null,2)}</pre>
        <details><summary style="font:700 14px system-ui;color:#9fc4ff">Full persistence trace</summary>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:12px 0 0">${JSON.stringify(payload, null, 2)}</pre></details>
      </div>
    `;

    panel.querySelector('[data-export-career]')?.addEventListener('click', () => {
      const status = panel.querySelector('[data-export-status]');
      if (!activeRecord?.world || !payload.activeCareerId) {
        if (status) status.textContent = 'Backup unavailable: the active career record could not be verified.';
        return;
      }
      try {
        const backup = {
          format: 'projectice-career-backup',
          version: 1,
          exportedAt: new Date().toISOString(),
          activeCareerId: payload.activeCareerId,
          activeRecord,
        };
        const serialized = JSON.stringify(backup);
        const verified = JSON.parse(serialized);
        if (verified.format !== 'projectice-career-backup' ||
            verified.activeCareerId !== payload.activeCareerId ||
            !verified.activeRecord?.world ||
            verified.activeRecord?.id !== activeRecord.id) {
          throw new Error('Backup integrity check did not pass.');
        }
        const blob = new Blob([serialized], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        const date = String(dateOf(activeRecord.world) || 'undated').replace(/[^0-9-]/g, '');
        anchor.href = url;
        anchor.download = 'project-ice-career-backup-' + date + '.json';
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        /* Keep the object URL alive for mobile Safari to finish the handoff. */
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        if (status) status.textContent = 'Export initiated. Verify the JSON file is present in iPhone Files before proceeding. Do not share it publicly.';
      } catch (error) {
        if (status) status.textContent = 'Backup export failed: ' + String(error?.message || error);
      }
    });
    const fileInput = panel.querySelector('[data-backup-file]');
    const verifyButton = panel.querySelector('[data-verify-backup]');
    const verifyStatus = panel.querySelector('[data-verify-status]');
    verifyButton?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', async () => {
      const selected = fileInput.files?.[0];
      if (!selected) return;
      verifyButton.disabled = true;
      verifyStatus.textContent = 'Verifying backup in a separate disposable database. This may take a minute for a large career file…';
      try {
        const result = await testDownloadedBackup(selected);
        const cleaned = result.cleanupStatus === 'deleted';
        verifyStatus.textContent = (cleaned
          ? 'PASS — isolated restore, read-back, and temporary database cleanup verified. '
          : 'PASS — isolated restore and read-back verified; temporary database cleanup ' +
            (result.cleanupStatus === 'pending-blocked' ? 'is pending (iPhone browser blocked deletion).' :
              result.cleanupStatus === 'pending' ? 'is still pending.' : 'could not be confirmed.') +
            ' ') +
          result.player + ', ' + result.overall + ' OVR; ' + result.date +
          '; ' + result.rosterCount + ' roster players; ' + result.externalCount +
          ' external prospects. Live career untouched.';
        verifyStatus.style.color = cleaned ? '#81e3ae' : '#f5c27d';
      } catch (error) {
        verifyStatus.textContent = 'NOT VERIFIED — ' + String(error?.message || error) +
          '. Live career was not overwritten; keep your original JSON backup.';
        verifyStatus.style.color = '#ffb47e';
      } finally {
        fileInput.value = '';
        verifyButton.disabled = false;
      }
    });
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    document.body.appendChild(panel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureButton, { once: true });
  } else {
    ensureButton();
  }
})();
