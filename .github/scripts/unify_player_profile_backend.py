from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text()

# Resolve the selected profile back to the canonical WorldEngine roster object whenever possible.
old="""function renderPlayerProfile() {
  const p = _activePlayerProfile;
  if (!p) return;

  const name = `${p.firstName} ${p.lastName}`.trim() || '—';
"""
new="""function renderPlayerProfile() {
  const selectedPlayer = _activePlayerProfile;
  if (!selectedPlayer) return;

  /*
   * Standalone Player Profiles are presentation-only views over the same
   * canonical world-player backend used by the career Player tab. Prospect
   * lists and stat tables sometimes pass copied snapshot objects, so resolve
   * back to the saved roster player before rendering whenever possible.
   */
  const selectedPlayerId = String(
    selectedPlayer.id || selectedPlayer.playerId || ''
  );

  const canonicalPlayer = (WorldEngine.state.teams || [])
    .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
    .find(player =>
      selectedPlayerId &&
      String(player?.id || player?.playerId || '') === selectedPlayerId
    );

  const p = canonicalPlayer || selectedPlayer;

  if (canonicalPlayer) {
    _activePlayerProfile = canonicalPlayer;
  }

  const name = `${p.firstName} ${p.lastName}`.trim() || '—';
"""
if old not in s:
    raise SystemExit('renderPlayerProfile start anchor missing')
s=s.replace(old,new,1)

# Potential display uses canonical development fields first, preserving existing profile design.
old="""  if (potentialRoleEl) {
    potentialRoleEl.textContent =
      p.potentialRole || 'Top 9 F';
  }

  const potentialAccuracyEl =
    document.getElementById('player-profile-potential-accuracy');

  if (potentialAccuracyEl) {
    const accuracy = (p.potentialAccuracy || 'Medium').toUpperCase();

    potentialAccuracyEl.textContent =
      accuracy === 'MEDIUM' ? 'MED' : accuracy;
    potentialAccuracyEl.dataset.accuracy =
      accuracy === 'MEDIUM' ? 'MED' : accuracy;
  }
"""
new="""  if (potentialRoleEl) {
    potentialRoleEl.textContent =
      p.development?.potentialRole ||
      p.potentialRole ||
      'Top 9 F';
  }

  const potentialAccuracyEl =
    document.getElementById('player-profile-potential-accuracy');

  if (potentialAccuracyEl) {
    const accuracy = String(
      p.development?.potentialAccuracy ||
      p.potentialAccuracy ||
      p.scoutingProfile?.evaluationAccuracy ||
      'Medium'
    ).toUpperCase();

    potentialAccuracyEl.textContent =
      accuracy === 'MEDIUM' ? 'MED' : accuracy;
    potentialAccuracyEl.dataset.accuracy =
      accuracy === 'MEDIUM' ? 'MED' : accuracy;
  }
"""
if old not in s:
    raise SystemExit('profile potential block missing')
s=s.replace(old,new,1)

# Preserve current Strengths/Weaknesses markup, but feed it from canonical scouting reveals.
old="""  const strengths = rankedAttributes.slice(0, 3);
  const weaknesses = [...rankedAttributes]
    .sort((a, b) => a.value - b.value)
    .slice(0, 3);

  const strengthsEl = document.getElementById('pp-strengths');

  if (strengthsEl) {
    strengthsEl.innerHTML = strengths
      .map(attribute => `
        <li class=\"pp-dev-list__item\">
          ${attribute.label}
          <span>${attribute.value}</span>
        </li>
      `)
      .join('');
  }

  const weaknessesEl =
    document.getElementById(
      'pp-weaknesses'
    );

  if (weaknessesEl) {
    weaknessesEl.innerHTML = weaknesses
      .map(attribute => `
        <li class=\"pp-dev-list__item\">
          ${attribute.label}
          <span>${attribute.value}</span>
        </li>
      `)
      .join('');
  }
"""
new="""  const scoutingProfile =
    p.scoutingProfile && typeof p.scoutingProfile === 'object'
      ? p.scoutingProfile
      : {};

  const knownStrengths = Array.isArray(scoutingProfile.strengthsKnown)
    ? scoutingProfile.strengthsKnown.filter(Boolean)
    : [];

  const knownWeaknesses = Array.isArray(scoutingProfile.weaknessesKnown)
    ? scoutingProfile.weaknessesKnown.filter(Boolean)
    : [];

  const strengths = knownStrengths.map(trait => ({
    label: typeof trait === 'string' ? trait : (trait.label || trait.name || 'Strength'),
  }));

  const weaknesses = knownWeaknesses.map(trait => ({
    label: typeof trait === 'string' ? trait : (trait.label || trait.name || 'Weakness'),
  }));

  const strengthsEl = document.getElementById('pp-strengths');

  if (strengthsEl) {
    strengthsEl.innerHTML = strengths.length > 0
      ? strengths
          .map(attribute => `
            <li class=\"pp-dev-list__item\">
              ${attribute.label}
            </li>
          `)
          .join('')
      : '<li class=\"pp-dev-list__item\">Not evaluated</li>';
  }

  const weaknessesEl =
    document.getElementById(
      'pp-weaknesses'
    );

  if (weaknessesEl) {
    weaknessesEl.innerHTML = weaknesses.length > 0
      ? weaknesses
          .map(attribute => `
            <li class=\"pp-dev-list__item\">
              ${attribute.label}
            </li>
          `)
          .join('')
      : '<li class=\"pp-dev-list__item\">Not evaluated</li>';
  }
"""
if old not in s:
    raise SystemExit('profile strengths weaknesses block missing')
s=s.replace(old,new,1)

# Scout report uses saved persistent scouting history first; legacy prose remains fallback only.
old="""  if (scoutTextEl) {
    scoutTextEl.textContent = getScoutReport(p);
  }
}
function getScoutReport(player) {
"""
new="""  if (scoutTextEl) {
    const scoutingHistory = Array.isArray(p.scoutingProfile?.scoutingHistory)
      ? p.scoutingProfile.scoutingHistory
      : [];
    const latestScoutingReport = scoutingHistory[scoutingHistory.length - 1] || null;

    scoutTextEl.textContent =
      latestScoutingReport?.summary ||
      latestScoutingReport?.reportText ||
      getScoutReport(p);
  }
}
function getScoutReport(player) {
"""
if old not in s:
    raise SystemExit('profile scout text block missing')
s=s.replace(old,new,1)

# Legacy scout prose must use canonical potential if it is ever needed as fallback.
old="""  const overall = Number(player.overall) || 60;
  const potential = Number(player.potential) || overall;
  const age = Number(player.age) || 14;
"""
new="""  const overall = Number(player.overall) || 60;
  const potential = Number(
    player.development?.potential ?? player.potential
  ) || overall;
  const age = Number(player.age) || 14;
"""
if old not in s:
    raise SystemExit('fallback scout potential anchor missing')
s=s.replace(old,new,1)

p.write_text(s)
print('unified standalone player profile with canonical world-player scouting and potential backend')
