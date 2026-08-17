from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text()
old="""    const pendingCareerId = localStorage.getItem(PENDING_CAREER_ID_KEY);
    const officialIndex = index.filter(item =>
      item?.id !== pendingCareerId &&
      (item?.stage === 'hub' || item?.tryoutsComplete === true || Boolean(item?.playerName && item.playerName !== 'Unnamed Career' && item?.teamName))
    );

    if (officialIndex.length !== index.length) {
      writeCareerSaveIndex(officialIndex);
    }
"""
new="""    const pendingCareerId = localStorage.getItem(PENDING_CAREER_ID_KEY);

    /*
     * A pending id only means "hide this unfinished draft" while the
     * player is still in onboarding. If that same save already contains
     * an official Hub/tryout-complete career, it survived the old
     * bootstrap bug and must be recovered instead of hidden forever.
     */
    const pendingOfficialSave =
      pendingCareerId
        ? index.find(item =>
            String(item?.id || '') === String(pendingCareerId) &&
            (
              item?.stage === 'hub' ||
              item?.tryoutsComplete === true ||
              Boolean(
                item?.playerName &&
                item.playerName !== 'Unnamed Career' &&
                item?.teamName
              )
            )
          )
        : null;

    if (pendingOfficialSave) {
      localStorage.removeItem(PENDING_CAREER_ID_KEY);
    }

    const activePendingCareerId =
      pendingOfficialSave
        ? null
        : pendingCareerId;

    const officialIndex = index.filter(item =>
      String(item?.id || '') !== String(activePendingCareerId || '') &&
      (
        item?.stage === 'hub' ||
        item?.tryoutsComplete === true ||
        Boolean(
          item?.playerName &&
          item.playerName !== 'Unnamed Career' &&
          item?.teamName
        )
      )
    );

    if (officialIndex.length !== index.length || pendingOfficialSave) {
      writeCareerSaveIndex(officialIndex);
    }
"""
if old not in s:
    raise SystemExit('pending filter anchor not found')
p.write_text(s.replace(old,new,1))
print('patched official pending-save recovery')
