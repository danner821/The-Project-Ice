from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text(errors='ignore')
old="""    _state.externalProspects.forEach(player => ensureCanonicalPlayerContract(player));
    return _state.externalProspects;
"""
new="""    _state.externalProspects.forEach(player => {
      /*
       * Overall is never an independently upgraded rating in Project Ice.
       * The database OVR only seeds the initial attribute spread; canonical
       * saved OVR always resolves from those attributes.
       */
      if (player?.attributes && typeof player.attributes === 'object') {
        player.overall =
          normalizeAttributePosition(player.position) === 'G'
            ? calculateGoalieOverallFromAttributes(player.attributes)
            : calculateOverallFromAttributes(player.attributes, player.position);
      }

      ensureCanonicalPlayerContract(player);
    });
    return _state.externalProspects;
"""
if old not in s: raise SystemExit('external prospect canonicalization anchor missing')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('EXTERNAL_PROSPECT_OVERALL=ATTRIBUTES')
