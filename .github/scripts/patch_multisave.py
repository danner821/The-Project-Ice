from pathlib import Path

world_path=Path('artifacts/project-ice/public/world.js')
game_path=Path('artifacts/project-ice/public/game.js')
html_path=Path('artifacts/project-ice/index.html')
css_path=Path('artifacts/project-ice/public/style.css')
world=world_path.read_text(); game=game_path.read_text(); html=html_path.read_text(); css=css_path.read_text()

# WORLD: active slot + manifest stored in localStorage (small metadata only), world bodies stay IndexedDB.
world=world.replace("""  const WORLD_RECORD_ID =\n    'default';\n""","""  const WORLD_RECORD_ID =\n    'default';\n\n  const CAREER_SAVE_INDEX_KEY =\n    'projectice_career_save_index_v1';\n\n  const ACTIVE_CAREER_ID_KEY =\n    'projectice_active_career_id_v1';\n\n  function createCareerSaveId() {\n    return `career-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;\n  }\n\n  function getActiveCareerId() {\n    return localStorage.getItem(ACTIVE_CAREER_ID_KEY) || null;\n  }\n\n  function getWorldRecordId(careerId = getActiveCareerId()) {\n    return careerId ? `career:${careerId}` : WORLD_RECORD_ID;\n  }\n\n  function readCareerSaveIndex() {\n    try {\n      const parsed = JSON.parse(localStorage.getItem(CAREER_SAVE_INDEX_KEY) || '[]');\n      return Array.isArray(parsed) ? parsed : [];\n    } catch (_) {\n      return [];\n    }\n  }\n\n  function writeCareerSaveIndex(entries) {\n    localStorage.setItem(CAREER_SAVE_INDEX_KEY, JSON.stringify(Array.isArray(entries) ? entries : []));\n  }\n\n  function buildCareerSaveMetadata(careerId, state = _state) {\n    const playerId = state?.player?.playerId || state?.player?.id || 'career-player';\n    let careerPlayer = null;\n    for (const team of state?.teams || []) {\n      careerPlayer = (team?.roster || []).find(player =>\n        String(player?.id || player?.playerId || '') === String(playerId) || player?.isCareerPlayer === true\n      );\n      if (careerPlayer) break;\n    }\n    const team = (state?.teams || []).find(item => String(item?.teamId || '') === String(careerPlayer?.teamId || state?.player?.teamId || ''));\n    return {\n      id: careerId,\n      playerName: `${careerPlayer?.firstName || state?.player?.firstName || ''} ${careerPlayer?.lastName || state?.player?.lastName || ''}`.trim() || 'Unnamed Career',\n      position: careerPlayer?.position || state?.player?.position || '',\n      overall: Number(careerPlayer?.overall) || Number(state?.player?.overall) || null,\n      teamName: team ? `${team.schoolName || ''} ${team.teamName || ''}`.trim() : (careerPlayer?.teamName || state?.player?.teamName || ''),\n      teamAbbreviation: team?.abbreviation || '',\n      currentDate: state?.season?.currentDate || state?.player?.currentDate || state?.currentDate || null,\n      seasonLabel: state?.season?.label || state?.currentSeason || '',\n      stage: careerPlayer?.stage || state?.player?.stage || '',\n      savedAt: new Date().toISOString(),\n    };\n  }\n\n  function upsertCareerSaveMetadata(careerId, state = _state) {\n    if (!careerId) return;\n    const index = readCareerSaveIndex();\n    const metadata = buildCareerSaveMetadata(careerId, state);\n    const existing = index.findIndex(item => item?.id === careerId);\n    if (existing >= 0) index[existing] = metadata; else index.unshift(metadata);\n    writeCareerSaveIndex(index);\n  }\n""",1)

world=world.replace("""          store.put({\n            id:\n              WORLD_RECORD_ID,\n""","""          const activeCareerId = getActiveCareerId();\n\n          store.put({\n            id:\n              getWorldRecordId(activeCareerId),\n""",1)
world=world.replace("""      database.close();\n    } catch (error) {\n      console.error(\n        '[WorldEngine] IndexedDB save failed:',\n""","""      database.close();\n\n      const activeCareerId = getActiveCareerId();\n      if (activeCareerId) {\n        upsertCareerSaveMetadata(activeCareerId, worldSnapshot);\n      }\n    } catch (error) {\n      console.error(\n        '[WorldEngine] IndexedDB save failed:',\n""",1)

# Replace initial indexeddb get with active id, then legacy default migration.
world=world.replace("""            const request =\n              store.get(\n                WORLD_RECORD_ID\n              );\n""","""            const request =\n              store.get(\n                getWorldRecordId()\n              );\n""",1)

# Inject fallback migration when no active career selected / active slot missing, before database.close.
needle="""      database.close();\n\n      if (\n        storedRecord?.world &&\n"""
replacement="""      let resolvedRecord = storedRecord;\n\n      /* Legacy single-world migration: preserve the user's existing career as slot #1. */\n      if (!resolvedRecord?.world) {\n        const legacyDatabase = database;\n        const legacyRecord = await new Promise((resolve, reject) => {\n          const transaction = legacyDatabase.transaction(WORLD_STORE_NAME, 'readonly');\n          const request = transaction.objectStore(WORLD_STORE_NAME).get(WORLD_RECORD_ID);\n          request.onsuccess = () => resolve(request.result || null);\n          request.onerror = () => reject(request.error);\n        });\n        if (legacyRecord?.world) {\n          let careerId = getActiveCareerId();\n          if (!careerId) {\n            careerId = createCareerSaveId();\n            localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);\n          }\n          await new Promise((resolve, reject) => {\n            const transaction = legacyDatabase.transaction(WORLD_STORE_NAME, 'readwrite');\n            transaction.objectStore(WORLD_STORE_NAME).put({ ...legacyRecord, id: getWorldRecordId(careerId) });\n            transaction.oncomplete = resolve;\n            transaction.onerror = () => reject(transaction.error);\n          });\n          resolvedRecord = { ...legacyRecord, id: getWorldRecordId(careerId) };\n          upsertCareerSaveMetadata(careerId, legacyRecord.world);\n        }\n      }\n\n      database.close();\n\n      if (\n        resolvedRecord?.world &&\n"""
if needle not in world: raise SystemExit('load migration anchor missing')
world=world.replace(needle,replacement,1).replace("""          ...storedRecord.world,\n""","""          ...resolvedRecord.world,\n""",1)

# Add APIs before reset docs.
needle="""  /** Reset to defaults and wipe the stored world. */\n  function reset() {\n"""
insert="""  async function listCareerSaves() {\n    /* Ensure a legacy single save is migrated before the list is shown. */\n    if (readCareerSaveIndex().length === 0) {\n      await load();\n    }\n    return readCareerSaveIndex().slice().sort((a, b) => String(b?.savedAt || '').localeCompare(String(a?.savedAt || '')));\n  }\n\n  async function selectCareerSave(careerId) {\n    if (!careerId) return false;\n    localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);\n    return load();\n  }\n\n  async function beginNewCareerSave() {\n    const careerId = createCareerSaveId();\n    localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);\n    _state = buildDefaults();\n    ensureCanonicalSeasonState(_state);\n    if (!_state.player) _state.player = {};\n    _state.player.currentDate = '2026-09-01';\n    await save();\n    return careerId;\n  }\n\n  async function deleteCareerSave(careerId) {\n    if (!careerId) return false;\n    const database = await openWorldDatabase();\n    await new Promise((resolve, reject) => {\n      const transaction = database.transaction(WORLD_STORE_NAME, 'readwrite');\n      transaction.objectStore(WORLD_STORE_NAME).delete(getWorldRecordId(careerId));\n      transaction.oncomplete = resolve;\n      transaction.onerror = () => reject(transaction.error);\n    });\n    database.close();\n    writeCareerSaveIndex(readCareerSaveIndex().filter(item => item?.id !== careerId));\n    if (getActiveCareerId() === careerId) localStorage.removeItem(ACTIVE_CAREER_ID_KEY);\n    return true;\n  }\n\n  /** Reset only the currently active career to defaults. Other career slots are preserved. */\n  function reset() {\n"""
if needle not in world: raise SystemExit('reset anchor missing')
world=world.replace(needle,insert,1)

world=world.replace("""    news,\n    save,\n    load,\n""","""    news,\n    save,\n    load,\n    listCareerSaves,\n    selectCareerSave,\n    beginNewCareerSave,\n    deleteCareerSave,\n    getActiveCareerId,\n""",1)

# HTML saves screen after title.
anchor="""      <!-- PLAYER CREATION SCREEN -->\n"""
screen="""      <!-- CAREER SAVES SCREEN -->\n      <section id=\"career-saves-screen\" class=\"screen screen--hidden\">\n        <header class=\"screen-header\">\n          <button class=\"back-button\" id=\"btn-back-career-saves\" type=\"button\" aria-label=\"Return to title screen\">‹</button>\n          <div>\n            <p class=\"eyebrow\">Continue Career</p>\n            <h2>Career Saves</h2>\n          </div>\n          <div class=\"step-badge\" id=\"career-save-count\">0 Saves</div>\n        </header>\n        <div class=\"career-saves-content\">\n          <p class=\"career-saves-intro\">Choose the hockey life you want to continue.</p>\n          <div id=\"career-save-list\" class=\"career-save-list\"></div>\n        </div>\n      </section>\n\n"""
if anchor not in html: raise SystemExit('html anchor missing')
html=html.replace(anchor,screen+anchor,1)

# GAME references and screen renderer.
game=game.replace("""const creationScreen       = document.getElementById('creation-screen');\n""","""const creationScreen       = document.getElementById('creation-screen');\nconst careerSavesScreen    = document.getElementById('career-saves-screen');\nconst careerSaveList       = document.getElementById('career-save-list');\nconst careerSaveCount      = document.getElementById('career-save-count');\nconst btnBackCareerSaves   = document.getElementById('btn-back-career-saves');\n""",1)

# Replace continue handler and new career handler.
old="""btnNewCareer.addEventListener('click', () => {\n  resetPlayer();\n  showScreen('creation');\n});\n\nbtnContinue.addEventListener('click', () => {\n  loadCareerPreview();\n});\n"""
new="""async function renderCareerSaveSelection() {\n  const saves = await WorldEngine.listCareerSaves();\n  careerSaveList.innerHTML = '';\n  careerSaveCount.textContent = `${saves.length} ${saves.length === 1 ? 'Save' : 'Saves'}`;\n\n  saves.forEach(save => {\n    const card = document.createElement('button');\n    card.type = 'button';\n    card.className = 'career-save-card';\n    const dateLabel = save.currentDate ? new Date(`${save.currentDate}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Career in progress';\n    const details = [save.position, save.teamName, save.overall ? `${save.overall} OVR` : ''].filter(Boolean).join(' • ');\n    card.innerHTML = `\n      <div class=\"career-save-card__top\">\n        <div>\n          <p class=\"career-save-card__name\">${escapeHtml(save.playerName || 'Project Ice Career')}</p>\n          <p class=\"career-save-card__details\">${escapeHtml(details || 'High School Career')}</p>\n        </div>\n        <span class=\"career-save-card__arrow\">›</span>\n      </div>\n      <div class=\"career-save-card__meta\">\n        <span>${escapeHtml(save.seasonLabel || 'Season 1')}</span>\n        <span>${escapeHtml(dateLabel)}</span>\n      </div>\n    `;\n    card.addEventListener('click', async () => {\n      card.disabled = true;\n      const loaded = await WorldEngine.selectCareerSave(save.id);\n      if (!loaded) { card.disabled = false; return; }\n      localStorage.removeItem(SAVE_KEY);\n      recoverCareerPreviewFromWorld();\n      loadCareerPreview();\n    });\n    careerSaveList.appendChild(card);\n  });\n\n  showScreen('career-saves');\n}\n\nbtnNewCareer.addEventListener('click', async () => {\n  btnNewCareer.disabled = true;\n  await WorldEngine.beginNewCareerSave();\n  localStorage.removeItem(SAVE_KEY);\n  resetPlayer();\n  btnNewCareer.disabled = false;\n  showScreen('creation');\n});\n\nbtnContinue.addEventListener('click', () => {\n  renderCareerSaveSelection();\n});\n\nif (btnBackCareerSaves) {\n  btnBackCareerSaves.addEventListener('click', () => {\n    updateContinueButton();\n    showScreen('title');\n  });\n}\n"""
if old not in game: raise SystemExit('start handlers missing')
game=game.replace(old,new,1)

# updateContinue to allow manifest even current world doesn't have loaded career. simple localStorage index check.
game=game.replace("""      hasCanonicalCareerWorld();\n""","""      hasCanonicalCareerWorld() ||\n      (() => {\n        try {\n          const saves = JSON.parse(localStorage.getItem('projectice_career_save_index_v1') || '[]');\n          return Array.isArray(saves) && saves.length > 0;\n        } catch (_) {\n          return false;\n        }\n      })();\n""",1)

# CSS
css += r'''

/* ── Multi-career save selection ───────────────────────────── */
.career-saves-content {
  padding: 18px 18px calc(28px + env(safe-area-inset-bottom));
  overflow-y: auto;
}
.career-saves-intro { margin: 2px 2px 16px; color: rgba(220,232,255,.68); font-size: 13px; }
.career-save-list { display: grid; gap: 12px; }
.career-save-card {
  width: 100%; text-align: left; border: 1px solid rgba(111,157,224,.20); border-radius: 16px;
  padding: 16px; color: #fff; background: linear-gradient(145deg, rgba(17,31,58,.94), rgba(8,18,37,.94));
  box-shadow: 0 10px 28px rgba(0,0,0,.22); -webkit-tap-highlight-color: transparent;
}
.career-save-card:active { transform: scale(.985); }
.career-save-card__top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.career-save-card__name { margin: 0 0 5px; font-size: 18px; font-weight: 800; }
.career-save-card__details { margin: 0; color: rgba(220,232,255,.72); font-size: 12px; line-height: 1.4; }
.career-save-card__arrow { font-size: 30px; line-height: 1; color: #78b8ff; }
.career-save-card__meta { display: flex; justify-content: space-between; gap: 10px; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(111,157,224,.12); color: rgba(220,232,255,.55); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
'''

world_path.write_text(world); game_path.write_text(game); html_path.write_text(html); css_path.write_text(css)
print('patched multi-career saves')
