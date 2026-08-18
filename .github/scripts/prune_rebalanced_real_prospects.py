from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text(errors='ignore')
old="""    _state.externalProspects = _state.externalProspects.filter(player =>
      player &&
      Number(player.draftYear) >= 2027 &&
      Number(player.draftYear) <= 2030 &&
      player.realPlayer === true
    );
"""
new="""    const curatedSourceIds = new Set(
      sourceProspects
        .map(player => String(player?.id || player?.playerId || ''))
        .filter(Boolean)
    );

    /*
     * The researched pool is curated and may be rebalanced while Project Ice
     * is still in development. Remove only external real-prospect records that
     * no longer exist in the source database. Retained IDs keep all evolved
     * development/scouting state because the merge above mutates them in place.
     */
    _state.externalProspects = _state.externalProspects.filter(player => {
      const id = String(player?.id || player?.playerId || '');
      return Boolean(
        player &&
        id &&
        curatedSourceIds.has(id) &&
        Number(player.draftYear) >= 2027 &&
        Number(player.draftYear) <= 2030 &&
        player.realPlayer === true
      );
    });
"""
if old not in s: raise SystemExit('external prospect filter anchor missing')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('SAVE_SAFE_PROSPECT_PRUNING=OK')
