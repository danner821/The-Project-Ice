from pathlib import Path

wp=Path('artifacts/project-ice/public/world.js')
gp=Path('artifacts/project-ice/public/game.js')
w=wp.read_text()
g=gp.read_text()

anchor='  async function listCareerSaves() {\n'
if anchor not in w:
    raise SystemExit('listCareerSaves anchor missing')

diag=r'''  async function getCareerRecoveryDiagnostics() {
    const summarizeWorld = (recordId, world, savedAt = null) => {
      if (!world || typeof world !== 'object') {
        return { recordId, missing: true };
      }

      const careerPlayer = getWorldCareerPlayer(world);
      const player = careerPlayer || world?.player || {};
      const attrs = player?.attributes && typeof player.attributes === 'object'
        ? Object.entries(player.attributes)
            .filter(([, value]) => Number.isFinite(Number(value)))
        : [];
      const tryoutResults = player?.tryoutResults || player?.tryoutProfile?.results || null;
      const line =
        player?.startingLine ||
        player?.rosterSlot ||
        player?.lineupAssignment?.line ||
        player?.lineupAssignment?.lineLabel ||
        player?.lineupStatus ||
        null;

      return {
        recordId,
        savedAt: savedAt || null,
        name: `${player?.firstName || world?.player?.firstName || ''} ${player?.lastName || world?.player?.lastName || ''}`.trim() || 'Unnamed',
        teamId: player?.teamId || world?.player?.teamId || null,
        overall: Number(player?.overall) || null,
        startingOverall: Number(player?.startingOverall) || null,
        line,
        overallTryoutScore: Number(player?.overallTryoutScore ?? player?.tryoutProfile?.score) || null,
        overallTryoutGrade: player?.overallTryoutGrade || player?.tryoutProfile?.grade || null,
        tryoutResultKeys: tryoutResults && typeof tryoutResults === 'object' ? Object.keys(tryoutResults) : [],
        attributeCount: attrs.length,
        attributeSample: attrs.slice(0, 6).map(([key, value]) => `${key}:${value}`),
        coachTrust: Number(player?.coachTrust) || null,
        stage: player?.stage || world?.player?.stage || null,
        tryoutsComplete: player?.tryoutsComplete === true || world?.player?.tryoutsComplete === true,
      };
    };

    const diagnostics = {
      activeCareerId: getActiveCareerId(),
      pendingCareerId: localStorage.getItem(PENDING_CAREER_ID_KEY),
      saveIndex: readCareerSaveIndex(),
      indexedDbRecords: [],
      localStorage: {},
    };

    try {
      const database = await openWorldDatabase();
      const records = await new Promise((resolve, reject) => {
        const transaction = database.transaction(WORLD_STORE_NAME, 'readonly');
        const request = transaction.objectStore(WORLD_STORE_NAME).getAll();
        request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
        request.onerror = () => reject(request.error);
      });
      database.close();
      diagnostics.indexedDbRecords = records.map(record =>
        summarizeWorld(record?.id || 'unknown', record?.world, record?.savedAt)
      );
    } catch (error) {
      diagnostics.indexedDbError = error?.message || String(error);
    }

    for (const key of [WORLD_KEY, 'projectice_save', CAREER_SAVE_INDEX_KEY, ACTIVE_CAREER_ID_KEY, PENDING_CAREER_ID_KEY]) {
      try {
        const raw = localStorage.getItem(key);
        if (raw == null) {
          diagnostics.localStorage[key] = null;
          continue;
        }
        if (key === WORLD_KEY) {
          const parsed = JSON.parse(raw);
          diagnostics.localStorage[key] = summarizeWorld(key, parsed, null);
        } else if (key === 'projectice_save') {
          const parsed = JSON.parse(raw);
          const p = parsed?.player || parsed || {};
          diagnostics.localStorage[key] = {
            name: `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'Unnamed',
            overall: Number(p?.overall) || null,
            startingOverall: Number(p?.startingOverall) || null,
            line: p?.startingLine || p?.rosterSlot || p?.lineupAssignment?.line || p?.lineupStatus || null,
            overallTryoutScore: Number(p?.overallTryoutScore ?? p?.tryoutProfile?.score) || null,
            overallTryoutGrade: p?.overallTryoutGrade || p?.tryoutProfile?.grade || null,
            tryoutResultKeys: p?.tryoutResults && typeof p.tryoutResults === 'object' ? Object.keys(p.tryoutResults) : [],
            attributeCount: p?.attributes && typeof p.attributes === 'object' ? Object.keys(p.attributes).length : 0,
            coachTrust: Number(p?.coachTrust) || null,
            stage: p?.stage || null,
            tryoutsComplete: p?.tryoutsComplete === true,
          };
        } else {
          diagnostics.localStorage[key] = raw;
        }
      } catch (error) {
        diagnostics.localStorage[key] = { error: error?.message || String(error) };
      }
    }

    return diagnostics;
  }

'''
if 'async function getCareerRecoveryDiagnostics()' not in w:
    w=w.replace(anchor,diag+anchor,1)

# Add API export near listCareerSaves export.
if 'getCareerRecoveryDiagnostics,' not in w:
    marker='    listCareerSaves,\n'
    if marker not in w:
        marker='      listCareerSaves,\n'
    if marker not in w:
        raise SystemExit('world export marker missing')
    w=w.replace(marker,marker+'    getCareerRecoveryDiagnostics,\n',1)

# Inject a temporary UI diagnostic into renderCareerSaveSelection after save list is loaded.
func='async function renderCareerSaveSelection() {'
idx=g.find(func)
if idx < 0:
    raise SystemExit('renderCareerSaveSelection missing')
end=g.find('\n}', idx)
# We will insert immediately after opening line so it always refreshes.
insert=r'''
  const existingRecoveryDiagnostic = document.getElementById('career-recovery-diagnostic');
  if (existingRecoveryDiagnostic) existingRecoveryDiagnostic.remove();
'''
pos=idx+len(func)
if 'career-recovery-diagnostic' not in g[idx:idx+5000]:
    g=g[:pos]+insert+g[pos:]

# Insert diagnostic panel immediately before showScreen('career-saves') in that function.
idx=g.find(func)
showpos=g.find("  showScreen('career-saves');", idx)
if showpos < 0:
    raise SystemExit('career saves showScreen marker missing')
panel=r'''  try {
    if (typeof WorldEngine?.getCareerRecoveryDiagnostics === 'function') {
      const recovery = await WorldEngine.getCareerRecoveryDiagnostics();
      const panel = document.createElement('div');
      panel.id = 'career-recovery-diagnostic';
      panel.style.cssText = 'margin:14px 0;padding:12px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(0,0,0,.24);font-size:11px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere;color:#dce8ff;';
      const rows = [];
      rows.push('RECOVERY DATA — SCREENSHOT THIS');
      rows.push(`Active: ${recovery?.activeCareerId || 'none'}`);
      rows.push('');
      for (const record of recovery?.indexedDbRecords || []) {
        rows.push(`${record.recordId} | ${record.name} | OVR ${record.overall ?? '-'} | Start ${record.startingOverall ?? '-'} | Line ${record.line ?? '-'} | Tryout ${record.overallTryoutScore ?? '-'} ${record.overallTryoutGrade ?? ''} | Attrs ${record.attributeCount ?? 0} | Trust ${record.coachTrust ?? '-'}`);
      }
      const preview = recovery?.localStorage?.projectice_save;
      if (preview && typeof preview === 'object') {
        rows.push('');
        rows.push(`projectice_save | ${preview.name} | OVR ${preview.overall ?? '-'} | Start ${preview.startingOverall ?? '-'} | Line ${preview.line ?? '-'} | Tryout ${preview.overallTryoutScore ?? '-'} ${preview.overallTryoutGrade ?? ''} | Attrs ${preview.attributeCount ?? 0} | Trust ${preview.coachTrust ?? '-'}`);
      }
      const legacy = recovery?.localStorage?.projectice_world;
      if (legacy && typeof legacy === 'object') {
        rows.push(`projectice_world | ${legacy.name || 'Unnamed'} | OVR ${legacy.overall ?? '-'} | Start ${legacy.startingOverall ?? '-'} | Line ${legacy.line ?? '-'} | Tryout ${legacy.overallTryoutScore ?? '-'} ${legacy.overallTryoutGrade ?? ''} | Attrs ${legacy.attributeCount ?? 0} | Trust ${legacy.coachTrust ?? '-'}`);
      }
      panel.textContent = rows.join('\n');
      careerSaveList?.insertAdjacentElement('afterend', panel);
    }
  } catch (error) {
    console.warn('[Project Ice] Recovery diagnostic failed:', error);
  }

'''
if 'RECOVERY DATA — SCREENSHOT THIS' not in g:
    g=g[:showpos]+panel+g[showpos:]

wp.write_text(w)
gp.write_text(g)
print('added recovery diagnostic')
