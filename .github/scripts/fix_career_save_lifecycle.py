from pathlib import Path

world_path = Path('artifacts/project-ice/public/world.js')
game_path = Path('artifacts/project-ice/public/game.js')
style_path = Path('artifacts/project-ice/public/style.css')

w = world_path.read_text()
g = game_path.read_text()
s = style_path.read_text()

# Pending career key.
anchor = "  const ACTIVE_CAREER_ID_KEY =\n    'projectice_active_career_id_v1';\n"
replacement = anchor + "\n  const PENDING_CAREER_ID_KEY =\n    'projectice_pending_career_id_v1';\n"
if anchor not in w:
    raise SystemExit('ACTIVE_CAREER_ID_KEY anchor not found')
w = w.replace(anchor, replacement, 1)

# Do not publish pending careers into the visible save index.
anchor = "      const activeCareerId = getActiveCareerId();\n      if (activeCareerId) {\n        upsertCareerSaveMetadata(activeCareerId, worldSnapshot);\n      }\n"
replacement = "      const activeCareerId = getActiveCareerId();\n      const pendingCareerId = localStorage.getItem(PENDING_CAREER_ID_KEY);\n      if (activeCareerId && activeCareerId !== pendingCareerId) {\n        upsertCareerSaveMetadata(activeCareerId, worldSnapshot);\n      }\n"
if anchor not in w:
    raise SystemExit('save metadata anchor not found')
w = w.replace(anchor, replacement, 1)

# Only official hub careers appear in Continue Career. Also clean stale index entries from pre-fix creation taps.
anchor = "    return index\n      .slice()\n      .sort((a, b) =>\n"
replacement = "    const officialIndex = index.filter(item =>\n      item?.stage === 'hub' || item?.tryoutsComplete === true\n    );\n\n    if (officialIndex.length !== index.length) {\n      writeCareerSaveIndex(officialIndex);\n    }\n\n    return officialIndex\n      .slice()\n      .sort((a, b) =>\n"
if anchor not in w:
    raise SystemExit('listCareerSaves return anchor not found')
w = w.replace(anchor, replacement, 1)

# Replace beginNewCareerSave with pending lifecycle and add commit function.
old = """  async function beginNewCareerSave() {
    const careerId = createCareerSaveId();
    localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);
    _state = buildDefaults();
    ensureCanonicalSeasonState(_state);
    if (!_state.player) _state.player = {};
    _state.player.currentDate = '2026-09-01';
    await save();
    return careerId;
  }

"""
new = """  async function beginNewCareerSave() {
    /*
     * A New Career is a draft until tryouts are completed and the
     * player reaches Career Hub. This prevents backing out of creation
     * from filling Continue Career with empty/unnamed save slots.
     */
    const previousPendingId = localStorage.getItem(PENDING_CAREER_ID_KEY);

    if (previousPendingId) {
      try {
        const database = await openWorldDatabase();
        await new Promise((resolve, reject) => {
          const transaction = database.transaction(WORLD_STORE_NAME, 'readwrite');
          transaction.objectStore(WORLD_STORE_NAME).delete(getWorldRecordId(previousPendingId));
          transaction.oncomplete = resolve;
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        });
        database.close();
      } catch (error) {
        console.warn('[WorldEngine] Could not clean abandoned pending career:', error);
      }
    }

    const careerId = createCareerSaveId();
    localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);
    localStorage.setItem(PENDING_CAREER_ID_KEY, careerId);

    _state = buildDefaults();
    ensureCanonicalSeasonState(_state);
    if (!_state.player) _state.player = {};
    _state.player.currentDate = '2026-09-01';

    return careerId;
  }

  function commitActiveCareerSave() {
    const careerId = getActiveCareerId();
    if (!careerId) return false;

    const pendingCareerId = localStorage.getItem(PENDING_CAREER_ID_KEY);
    if (pendingCareerId === careerId) {
      localStorage.removeItem(PENDING_CAREER_ID_KEY);
    }

    upsertCareerSaveMetadata(careerId, _state);
    save();
    return true;
  }

"""
if old not in w:
    raise SystemExit('beginNewCareerSave block not found')
w = w.replace(old, new, 1)

# Clear pending marker on deletion if it matches.
anchor = "    if (getActiveCareerId() === careerId) localStorage.removeItem(ACTIVE_CAREER_ID_KEY);\n    return true;\n"
replacement = "    if (getActiveCareerId() === careerId) localStorage.removeItem(ACTIVE_CAREER_ID_KEY);\n    if (localStorage.getItem(PENDING_CAREER_ID_KEY) === careerId) localStorage.removeItem(PENDING_CAREER_ID_KEY);\n    return true;\n"
if anchor not in w:
    raise SystemExit('delete pending anchor not found')
w = w.replace(anchor, replacement, 1)

# Export commit API.
anchor = "    beginNewCareerSave,\n    deleteCareerSave,\n"
replacement = "    beginNewCareerSave,\n    commitActiveCareerSave,\n    deleteCareerSave,\n"
if anchor not in w:
    raise SystemExit('public API anchor not found')
w = w.replace(anchor, replacement, 1)

# Make metadata include tryoutsComplete so filtering is robust.
anchor = "      stage: careerPlayer?.stage || state?.player?.stage || '',\n      savedAt: new Date().toISOString(),\n"
replacement = "      stage: careerPlayer?.stage || state?.player?.stage || '',\n      tryoutsComplete: careerPlayer?.tryoutsComplete === true || state?.player?.tryoutsComplete === true,\n      savedAt: new Date().toISOString(),\n"
if anchor not in w:
    raise SystemExit('metadata tryouts anchor not found')
w = w.replace(anchor, replacement, 1)

# Career-save cards: separate load button + delete button.
old = """  saves.forEach(save => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'career-save-card';
"""
new = """  saves.forEach(save => {
    const shell = document.createElement('div');
    shell.className = 'career-save-card-shell';

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'career-save-card';
"""
if old not in g:
    raise SystemExit('save card creation anchor not found')
g = g.replace(old, new, 1)

old = """    careerSaveList.appendChild(card);
  });

  showScreen('career-saves');
"""
new = """    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'career-save-delete';
    deleteButton.setAttribute('aria-label', `Delete ${save.playerName || 'career'}`);
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const playerName = save.playerName || 'this career';
      const confirmed = window.confirm(`Delete ${playerName}? This cannot be undone.`);
      if (!confirmed) return;

      deleteButton.disabled = true;
      card.disabled = true;
      const deleted = await WorldEngine.deleteCareerSave(save.id);
      if (!deleted) {
        deleteButton.disabled = false;
        card.disabled = false;
        return;
      }

      await renderCareerSaveSelection();
      updateContinueButton();
    });

    shell.appendChild(card);
    shell.appendChild(deleteButton);
    careerSaveList.appendChild(shell);
  });

  showScreen('career-saves');
"""
if old not in g:
    raise SystemExit('save card append anchor not found')
g = g.replace(old, new, 1)

# Commit only after tryouts produce the canonical player and hub state.
anchor = "    tryoutsComplete: true,\n  };\n\n  saveCareerPreview();\n  showScreen('hub');\n"
replacement = "    tryoutsComplete: true,\n  };\n\n  /* The career becomes an official selectable save only now: tryouts are complete and Career Hub is unlocked. */\n  if (typeof WorldEngine.commitActiveCareerSave === 'function') {\n    WorldEngine.commitActiveCareerSave();\n  }\n\n  saveCareerPreview();\n  showScreen('hub');\n"
if anchor not in g:
    raise SystemExit('hub commit anchor not found')
g = g.replace(anchor, replacement, 1)

# Save selection styling.
marker = ".career-save-list { display: grid; gap: 12px; }\n"
extra = """.career-save-card-shell {
  position: relative;
}
.career-save-card-shell .career-save-card {
  padding-right: 82px;
}
.career-save-delete {
  position: absolute;
  right: 14px;
  top: 14px;
  z-index: 2;
  border: 1px solid rgba(255, 105, 105, .28);
  border-radius: 999px;
  padding: 7px 10px;
  background: rgba(112, 24, 38, .20);
  color: rgba(255, 180, 185, .92);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .03em;
}
.career-save-delete:active { transform: scale(.96); }
"""
if marker not in s:
    raise SystemExit('career save style marker not found')
s = s.replace(marker, marker + extra, 1)

world_path.write_text(w)
game_path.write_text(g)
style_path.write_text(s)
print('patched career save lifecycle and delete UI')
