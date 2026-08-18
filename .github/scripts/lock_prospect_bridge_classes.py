from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text(errors='ignore')

anchor="""  function processScoutingWeek(dateString) {
"""
helper=r'''  function getProjectIceProspectDraftYear(player = {}) {
    const explicit = Number(player?.draftYear);
    if (Number.isFinite(explicit) && explicit >= 2024) return explicit;

    const year = String(
      player?.year || player?.schoolYear || player?.classYear || ''
    ).trim().toLowerCase();

    if (year.includes('senior')) return 2024;
    if (year.includes('junior')) return 2025;
    if (year.includes('sophomore')) return 2026;
    if (year.includes('freshman')) return 2027;
    return null;
  }

  function isRankingOnlyBridgeProspect(player = {}) {
    const draftYear = getProjectIceProspectDraftYear(player);
    return Boolean(draftYear && draftYear >= 2024 && draftYear <= 2026);
  }

  function canProspectPortToNhlWorld(player = {}) {
    const draftYear = getProjectIceProspectDraftYear(player);
    if (!draftYear || draftYear <= 2026) return false;
    if (player?.rankingOnly === true) return false;
    if (player?.portToNhlWorld === false) return false;
    return draftYear >= 2027;
  }

'''
if anchor not in s: raise SystemExit('processScoutingWeek anchor missing')
s=s.replace(anchor,helper+anchor,1)

old="""      draftYear: Number(entry.player?.draftYear) || null,
"""
new="""      draftYear: getProjectIceProspectDraftYear(entry.player),
"""
if old not in s: raise SystemExit('draftYear ranking anchor missing')
s=s.replace(old,new,1)

old="""      realPlayer: entry.player?.realPlayer === true,
      persistentProspect: entry.player?.persistentProspect === true,
      portToNhlWorld: entry.player?.portToNhlWorld === true,
      rankingOnly: entry.player?.rankingOnly === true,
"""
new="""      realPlayer: entry.player?.realPlayer === true,
      persistentProspect:
        !isRankingOnlyBridgeProspect(entry.player) &&
        getProjectIceProspectDraftYear(entry.player) >= 2027,
      portToNhlWorld: canProspectPortToNhlWorld(entry.player),
      rankingOnly: isRankingOnlyBridgeProspect(entry.player),
"""
if old not in s: raise SystemExit('prospect persistence flags anchor missing')
s=s.replace(old,new,1)

# Export the contract so future Draft/NHL code has one authority.
old="""    getExternalProspects: () => ensureExternalProspectWorld(),
"""
new="""    getExternalProspects: () => ensureExternalProspectWorld(),
    getProjectIceProspectDraftYear,
    canProspectPortToNhlWorld,
"""
if old not in s: raise SystemExit('prospect API export anchor missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('PROSPECT_BRIDGE_CONTRACT=OK')
