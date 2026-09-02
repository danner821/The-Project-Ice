from pathlib import Path

ROOT = Path('artifacts/project-ice/public')
canonical = ROOT / 'travel-hockey-canonical-ui.js'
scopes = ROOT / 'team-profile-stat-scopes.js'
full = ROOT / 'full-stats-scopes.js'


def replace_once(path, old, new):
    text = path.read_text()
    if old not in text:
        raise SystemExit(f'Expected block not found in {path}: {old[:120]!r}')
    path.write_text(text.replace(old, new, 1))

# 1) Travel profile identity must be explicit on the reusable profile mount.
replace_once(
    canonical,
    "  function cleanupAdapter() {\n    if (adapterId && Array.isArray(WorldEngine.state?.teams)) {\n      WorldEngine.state.teams = WorldEngine.state.teams.filter(team => !(team.travelProfileAdapter && String(team.teamId) === String(adapterId)));\n    }\n    adapterId = null;\n  }",
    "  function cleanupAdapter() {\n    if (adapterId && Array.isArray(WorldEngine.state?.teams)) {\n      WorldEngine.state.teams = WorldEngine.state.teams.filter(team => !(team.travelProfileAdapter && String(team.teamId) === String(adapterId)));\n    }\n    const profileMount = document.getElementById('team-profile-modern-content');\n    if (profileMount) delete profileMount.dataset.travelTeamId;\n    adapterId = null;\n  }"
)

# 2) Translate Travel's compact stat schema once at the adapter boundary so every
# canonical Team/Profile/Full Stats consumer receives the same field names.
replace_once(
    canonical,
    "  function adapter(team) {\n    const state = travel();",
    "  function canonicalTravelPlayerStats(player) {\n    const s = player?.travelStats || {};\n    const gamesPlayed = Number(s.gp ?? s.gamesPlayed ?? 0);\n    const goals = Number(s.g ?? s.goals ?? 0);\n    const assists = Number(s.a ?? s.assists ?? 0);\n    const points = Number(s.pts ?? s.points ?? (goals + assists));\n    const shots = Number(s.sog ?? s.shots ?? s.shotsOnGoal ?? 0);\n    const penaltyMinutes = Number(s.pim ?? s.penaltyMinutes ?? 0);\n    const wins = Number(s.wins ?? s.w ?? 0);\n    const losses = Number(s.losses ?? s.l ?? 0);\n    const shotsAgainst = Number(s.shotsAgainst ?? 0);\n    const saves = Number(s.saves ?? 0);\n    const goalsAgainst = Number(s.goalsAgainst ?? 0);\n    const savedPct = Number(s.savePercentage ?? s.svPct ?? 0);\n    const savePercentage = savedPct > 0 ? savedPct : (shotsAgainst > 0 ? saves / shotsAgainst : 0);\n    return {\n      ...s,\n      gamesPlayed, goals, assists, points, shots, shotsOnGoal: shots, penaltyMinutes,\n      wins, losses, shotsAgainst, saves, goalsAgainst, savePercentage,\n      gp: gamesPlayed, g: goals, a: assists, pts: points, sog: shots, pim: penaltyMinutes\n    };\n  }\n\n  function adapter(team) {\n    const state = travel();"
)

replace_once(
    canonical,
    "      roster: (team.roster || []).map(player => ({\n        ...player,\n        teamId: team.teamId,\n        stats: { ...(player.travelStats || {}) },\n        seasonStats: { ...(player.travelStats || {}) },\n        regularSeasonStats: { ...(player.travelStats || {}) },\n      })),",
    "      roster: (team.roster || []).map(player => {\n        const travelOnlyStats = canonicalTravelPlayerStats(player);\n        return {\n          ...player,\n          teamId: team.teamId,\n          stats: { ...travelOnlyStats },\n          seasonStats: { ...travelOnlyStats },\n          regularSeasonStats: { ...travelOnlyStats },\n        };\n      }),"
)

replace_once(
    canonical,
    "    globalThis.openTeamProfile(profileTeam.teamId,'hub');\n\n    // renderTeamProfile builds the Travel profile synchronously from the Team tab",
    "    globalThis.openTeamProfile(profileTeam.teamId,'hub');\n    const profileMount = document.getElementById('team-profile-modern-content');\n    if (profileMount) profileMount.dataset.travelTeamId = String(team.teamId);\n\n    // renderTeamProfile builds the Travel profile synchronously from the Team tab"
)

# 3) The existing scoped Team Profile controller already knows how to calculate
# Travel leaders, but it could not identify Travel profiles. Also give Full Stats
# an explicit Travel context instead of pretending Travel is HS regular season.
replace_once(
    scopes,
    "    if (full && full.dataset.piProfileScopeBound !== 'true') {\n      full.dataset.piProfileScopeBound = 'true';\n      full.addEventListener('click',()=>{ if (typeof Game !== 'undefined') Game.fullStatsScope = selectedScope; },true);\n    }",
    "    if (full && full.dataset.piProfileScopeBound !== 'true') {\n      full.dataset.piProfileScopeBound = 'true';\n      full.addEventListener('click',()=>{\n        if (typeof Game === 'undefined') return;\n        if (isTravel) {\n          Game.fullStatsTravelTeamId = team.teamId;\n          Game.fullStatsScope = 'regular-season';\n        } else {\n          delete Game.fullStatsTravelTeamId;\n          Game.fullStatsScope = selectedScope;\n        }\n      },true);\n    }"
)

# 4) Full Stats must not let the HS regular/playoff scope wrapper overwrite the
# already-normalized Travel adapter roster with HS stats.
replace_once(
    full,
    "  const originalRender = renderFullStatsScreen;\n\n  window.renderFullStatsScreen = function(...args) {\n    const scope = currentScope();",
    "  const originalRender = renderFullStatsScreen;\n\n  function activeTravelAdapter() {\n    const id = Game?.fullStatsTravelTeamId || Game?.fullStatsTeamId || null;\n    if (!id) return null;\n    return (WorldEngine.state?.teams || []).find(team =>\n      team?.travelProfileAdapter === true && String(team?.teamId || '') === String(id)\n    ) || null;\n  }\n\n  window.renderFullStatsScreen = function(...args) {\n    const travelAdapter = activeTravelAdapter();\n    if (travelAdapter) {\n      const result = originalRender(...args);\n      document.getElementById(CONTROL_ID)?.remove();\n      const context = document.getElementById('full-stats-context');\n      if (context) {\n        const base = String(context.textContent || '').replace(/\\s+[·•]\\s+(Regular Season|Playoffs|Travel Tournament)$/i, '');\n        context.textContent = `${base} · Travel Tournament`;\n      }\n      return result;\n    }\n\n    const scope = currentScope();"
)

print('Travel Team Profile stats/leaders root fix applied.')
