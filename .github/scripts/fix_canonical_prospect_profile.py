from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text(errors='ignore')

old="""  const canonicalPlayer = (WorldEngine.state.teams || [])
    .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
    .find(player =>
      selectedPlayerId &&
      String(player?.id || player?.playerId || '') === selectedPlayerId
    );

  const p = canonicalPlayer || selectedPlayer;
"""
new="""  const canonicalPlayer =
    selectedPlayerId && typeof WorldEngine?.getPlayerById === 'function'
      ? WorldEngine.getPlayerById(selectedPlayerId)
      : null;

  const p = canonicalPlayer || selectedPlayer;
"""
if old not in s: raise SystemExit('canonical resolution anchor missing')
s=s.replace(old,new,1)

old="""  const fullTeamName = assignedTeam
    ? `${assignedTeam.schoolName} ${assignedTeam.teamName}`
    : 'Freshman Tryouts';
"""
new="""  const externalTeamName =
    p.currentTeam ||
    p.realTeamSnapshot ||
    p.teamName ||
    '';
  const externalLeagueName =
    p.league ||
    p.realLeagueSnapshot ||
    '';
  const fullTeamName = assignedTeam
    ? `${assignedTeam.schoolName} ${assignedTeam.teamName}`
    : [externalTeamName, externalLeagueName]
        .map(value => String(value || '').trim())
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(' · ') || 'Unassigned';
"""
if old not in s: raise SystemExit('team context anchor missing')
s=s.replace(old,new,1)

old="""  if (ageEl) {
    const playerYear = p.year || 'Freshman';

    ageEl.textContent = `${age} years old · ${playerYear}`;
  }
"""
new="""  if (ageEl) {
    const playerYear = p.year || '';
    const draftYear = Number(p.draftYear) || null;
    const ageContext = [
      `${age} years old`,
      playerYear,
      draftYear ? `${draftYear} Draft` : '',
    ].filter(Boolean);

    ageEl.textContent = ageContext.join(' · ');
  }
"""
if old not in s: raise SystemExit('age context anchor missing')
s=s.replace(old,new,1)

old="""  if (weightEl) {
    const weight = Number(p.weight) || 175;
    weightEl.textContent = `${weight} lbs`;
  }
"""
new="""  if (weightEl) {
    const weight = Number(p.weightLbs ?? p.weight) || 175;
    weightEl.textContent = `${weight} lbs`;
  }
"""
if old not in s: raise SystemExit('weight anchor missing')
s=s.replace(old,new,1)

old="""  if (shootsEl) {
    shootsEl.textContent = `Shoots ${p.shoots || 'L'}`;
  }
"""
new="""  if (shootsEl) {
    const isGoalie = String(p.position || '').trim().toUpperCase() === 'G';
    if (isGoalie) {
      shootsEl.textContent = `Catches ${p.catches || p.shoots || 'L'}`;
    } else {
      shootsEl.textContent = `Shoots ${p.shoots || 'L'}`;
    }
  }
"""
if old not in s: raise SystemExit('shoots anchor missing')
s=s.replace(old,new,1)

old="""    potentialRoleEl.textContent =
      p.development?.potentialRole ||
      p.potentialRole ||
      'Top 9 F';
"""
new="""    const profilePosition = String(p.position || '').trim().toUpperCase();
    const fallbackPotentialRole =
      profilePosition === 'G'
        ? 'Goalie Prospect'
        : ['D', 'LD', 'RD'].includes(profilePosition)
          ? 'Top 6 D'
          : 'Top 9 F';
    potentialRoleEl.textContent =
      p.development?.potentialRole ||
      p.potentialRole ||
      p.potentialTier ||
      fallbackPotentialRole;
"""
if old not in s: raise SystemExit('potential role anchor missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('CANONICAL_PROSPECT_PROFILE=OK')
