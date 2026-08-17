from pathlib import Path
import re

wp=Path('artifacts/project-ice/public/world.js')
gp=Path('artifacts/project-ice/public/game.js')
w=wp.read_text()
g=gp.read_text()

# Add a one-time, tightly scoped migration immediately before listCareerSaves.
anchor='  async function listCareerSaves() {\n'
if anchor not in w:
    raise SystemExit('listCareerSaves anchor missing')

repair=r'''  async function repairKnownMeghanTryoutSnapshot() {
    /*
     * One-time recovery for the specific fresh-career record that was
     * reconstructed from an older preview without its tryout outcome.
     *
     * The surviving screenshot proves only two lost outcome facts:
     *   - Meghan finished tryouts at 66 OVR
     *   - Meghan earned the 2nd-line center slot
     *
     * The original hidden tryout score / trust values no longer exist, so
     * this migration deliberately does not invent them. It preserves the
     * recovered attribute shape and raises it uniformly until the normal
     * attribute-derived OVR formula returns 66.
     */
    try {
      const database = await openWorldDatabase();
      const records = await new Promise((resolve, reject) => {
        const transaction = database.transaction(WORLD_STORE_NAME, 'readonly');
        const request = transaction.objectStore(WORLD_STORE_NAME).getAll();
        request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
        request.onerror = () => reject(request.error);
      });

      let repaired = false;
      for (const record of records) {
        if (!String(record?.id || '').startsWith('career:') || !record?.world) continue;

        const world = record.world;
        const careerPlayer = getWorldCareerPlayer(world);
        if (!careerPlayer) continue;

        const isExactCorruptedRecord =
          String(careerPlayer.firstName || '').trim().toLowerCase() === 'meghan' &&
          String(careerPlayer.lastName || '').trim().toLowerCase() === 'stephenson' &&
          String(careerPlayer.teamId || world?.player?.teamId || '') === 'team-granite-falls' &&
          String(world?.season?.currentDate || world?.player?.currentDate || '') === '2026-09-02' &&
          Number(careerPlayer.overall) === 60 &&
          Number(careerPlayer.startingOverall || 60) === 60 &&
          String(careerPlayer.rosterSlot || careerPlayer.slot || '') === 'fwd-4-c' &&
          !(Number(careerPlayer.overallTryoutScore) > 0) &&
          Number(careerPlayer?.stats?.gamesPlayed || 0) === 0;

        if (!isExactCorruptedRecord) continue;

        const attributes = careerPlayer.attributes;
        if (!attributes || typeof attributes !== 'object') continue;

        let guard = 0;
        let calculated = calculateOverallFromAttributes(attributes, careerPlayer.position || 'C');
        while (calculated < 66 && guard < 12) {
          PLAYER_ATTRIBUTE_KEYS.forEach(key => {
            if (Number.isFinite(Number(attributes[key]))) {
              attributes[key] = clampAttribute(Number(attributes[key]) + 1);
            }
          });
          calculated = calculateOverallFromAttributes(attributes, careerPlayer.position || 'C');
          guard += 1;
        }

        if (calculated !== 66) continue;

        const team = (world.teams || []).find(item =>
          String(item?.teamId || '') === 'team-granite-falls'
        );
        if (!team) continue;

        const oldSlot = 'fwd-4-c';
        const targetSlot = 'fwd-2-c';
        const displacedPlayer = (team.roster || []).find(player =>
          player !== careerPlayer &&
          String(player?.rosterSlot || player?.slot || '') === targetSlot
        );

        if (displacedPlayer) {
          displacedPlayer.rosterSlot = oldSlot;
          if ('slot' in displacedPlayer) displacedPlayer.slot = oldSlot;
          if (displacedPlayer.lineupAssignment && typeof displacedPlayer.lineupAssignment === 'object') {
            displacedPlayer.lineupAssignment = {
              ...displacedPlayer.lineupAssignment,
              line: 4,
              lineNumber: 4,
              lineLabel: '4th Line',
              slot: oldSlot,
              rosterSlot: oldSlot,
              unit: 4,
            };
          }
        }

        careerPlayer.overall = 66;
        careerPlayer.startingOverall = 66;
        careerPlayer.startingLine = '2nd Line';
        careerPlayer.rosterSlot = targetSlot;
        if ('slot' in careerPlayer) careerPlayer.slot = targetSlot;
        if ('lineupStatus' in careerPlayer) careerPlayer.lineupStatus = '2nd Line';
        if (careerPlayer.lineupAssignment && typeof careerPlayer.lineupAssignment === 'object') {
          careerPlayer.lineupAssignment = {
            ...careerPlayer.lineupAssignment,
            line: 2,
            lineNumber: 2,
            lineLabel: '2nd Line',
            slot: targetSlot,
            rosterSlot: targetSlot,
            unit: 2,
            position: 'C',
          };
        }

        world.player = {
          ...(world.player || {}),
          overall: 66,
          startingOverall: 66,
          startingLine: '2nd Line',
          rosterSlot: targetSlot,
          attributes: JSON.parse(JSON.stringify(attributes)),
          recoveryRepairs: {
            ...(world?.player?.recoveryRepairs || {}),
            meghanTryoutSnapshotV1: true,
          },
        };

        await new Promise((resolve, reject) => {
          const transaction = database.transaction(WORLD_STORE_NAME, 'readwrite');
          transaction.objectStore(WORLD_STORE_NAME).put({
            ...record,
            world,
            savedAt: new Date().toISOString(),
          });
          transaction.oncomplete = resolve;
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        });

        const careerId = String(record.id).slice('career:'.length);
        upsertCareerSaveMetadata(careerId, world);
        repaired = true;
      }

      database.close();
      return repaired;
    } catch (error) {
      console.warn('[WorldEngine] Meghan tryout snapshot recovery failed:', error);
      return false;
    }
  }

'''
if 'async function repairKnownMeghanTryoutSnapshot()' not in w:
    w=w.replace(anchor,repair+anchor,1)

old='''  async function listCareerSaves() {
    let index = readCareerSaveIndex();
'''
new='''  async function listCareerSaves() {
    await repairKnownMeghanTryoutSnapshot();
    let index = readCareerSaveIndex();
'''
if old not in w:
    raise SystemExit('listCareerSaves start missing')
w=w.replace(old,new,1)

# Remove the temporary recovery diagnostic API from world.js now that it answered the question.
start=w.find('  async function getCareerRecoveryDiagnostics() {')
if start >= 0:
    end=w.find('\n  async function ', start+10)
    if end < 0:
        raise SystemExit('diagnostic function end not found')
    w=w[:start]+w[end+1:]
w=w.replace('    getCareerRecoveryDiagnostics,\n','')

# Remove temporary Career Saves diagnostic panel code from game.js.
func_start=g.find('async function renderCareerSaveSelection() {')
if func_start < 0:
    raise SystemExit('renderCareerSaveSelection missing')

small='''
  const existingRecoveryDiagnostic = document.getElementById('career-recovery-diagnostic');
  if (existingRecoveryDiagnostic) existingRecoveryDiagnostic.remove();
'''
g=g.replace(small,'',1)

panel_start=g.find("  try {\n    if (typeof WorldEngine?.getCareerRecoveryDiagnostics === 'function') {", func_start)
if panel_start >= 0:
    panel_end=g.find("\n\n  showScreen('career-saves');", panel_start)
    if panel_end < 0:
        raise SystemExit('diagnostic panel end missing')
    g=g[:panel_start]+g[panel_end+2:]

wp.write_text(w)
gp.write_text(g)
print('repaired known Meghan snapshot and removed diagnostic UI')
