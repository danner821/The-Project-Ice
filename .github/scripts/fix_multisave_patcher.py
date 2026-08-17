from pathlib import Path
p=Path('.github/scripts/patch_multisave.py')
s=p.read_text()
start=s.index("# Inject fallback migration when no active career selected / active slot missing, before database.close.")
end=s.index("# Add APIs before reset docs.", start)
replacement=r'''# Legacy default migration is handled lazily by listCareerSaves().
# Until a slot has been created, load() continues to read the legacy "default" record.

'''
s=s[:start]+replacement+s[end:]
# Upgrade listCareerSaves so opening Continue migrates the already-loaded legacy world to slot #1.
old="""  async function listCareerSaves() {\\n    /* Ensure a legacy single save is migrated before the list is shown. */\\n    if (readCareerSaveIndex().length === 0) {\\n      await load();\\n    }\\n    return readCareerSaveIndex().slice().sort((a, b) => String(b?.savedAt || '').localeCompare(String(a?.savedAt || '')));\\n  }\\n\\n"""
new="""  async function listCareerSaves() {\\n    let index = readCareerSaveIndex();\\n\\n    /*\\n     * Legacy single-save migration. The current build has already loaded\\n     * the old IndexedDB `default` world before the title menu appears.\\n     * When Continue is opened for the first time, give that exact loaded\\n     * world a permanent career slot without deleting the legacy backup.\\n     */\\n    if (index.length === 0) {\\n      const hasCareerPlayer = Boolean(getPlayerById('career-player')) ||\\n        (_state.teams || []).some(team => (team?.roster || []).some(player => player?.isCareerPlayer === true));\\n\\n      if (hasCareerPlayer) {\\n        const careerId = createCareerSaveId();\\n        localStorage.setItem(ACTIVE_CAREER_ID_KEY, careerId);\\n        const saved = await save();\\n        if (saved) index = readCareerSaveIndex();\\n      }\\n    }\\n\\n    return index.slice().sort((a, b) => String(b?.savedAt || '').localeCompare(String(a?.savedAt || '')));\\n  }\\n\\n"""
if old not in s:
    raise SystemExit('listCareerSaves patcher block not found')
s=s.replace(old,new,1)
p.write_text(s)
print('fixed multisave patcher')
