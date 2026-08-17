from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text()

# Make the old annual potential API a compatibility reader only. The weekly
# living-world evaluator is now the single source of truth for potential moves.
anchor="""  function evaluatePlayerAnnualPotentialChange(\n    player = {},\n    trajectoryResult = {},\n    context = {}\n  ) {\n"""
if anchor not in s:
    raise SystemExit('annual potential function anchor missing')

compat="""  function evaluatePlayerAnnualPotentialChange(\n    player = {},\n    trajectoryResult = {},\n    context = {}\n  ) {\n    /*\n     * COMPATIBILITY API ONLY.\n     *\n     * Potential movement is owned exclusively by\n     * evaluatePlayerPotentialWeek(). Keeping a second annual mutation\n     * path would allow season transitions to double-change a player's\n     * projection after the Weekly Living World already evaluated it.\n     *\n     * Older/future season-transition code may still call this function,\n     * so preserve its return contract while reporting the canonical\n     * potential state without mutating it. Annual trajectory remains a\n     * separate development-speed system.\n     */\n    if (!player || typeof player !== 'object') {\n      return {\n        success: false,\n        changed: false,\n        reason: 'invalid-player',\n        potentialBefore: null,\n        potentialAfter: null,\n        change: 0,\n      };\n    }\n\n    ensureCanonicalPlayerContract(player);\n\n    const canonicalPotential = Math.max(\n      25,\n      Math.min(\n        99,\n        Number(player.development?.potential ?? player.potential ?? player.overall) || 60\n      )\n    );\n\n    const role =\n      player.development?.potentialRole ||\n      player.potentialRole ||\n      getPotentialRole(player.position, canonicalPotential);\n\n    return {\n      success: true,\n      changed: false,\n      reason: 'weekly-potential-is-canonical',\n      potentialBefore: canonicalPotential,\n      potentialAfter: canonicalPotential,\n      change: 0,\n      potentialRole: role,\n      potentialTrend:\n        player.development?.potentialTrend ||\n        player.potentialTrend ||\n        'stable',\n      potentialConfidence:\n        Math.max(25, Math.min(100, Number(player.development?.potentialConfidence ?? player.potentialConfidence) || 50)),\n      trajectory:\n        trajectoryResult?.trajectory ||\n        'normal',\n      seasonNumber:\n        Math.max(1, Number(context.seasonNumber ?? _state.season?.seasonNumber) || 1),\n    };\n\n    /* LEGACY ANNUAL MUTATION BODY RETAINED BELOW UNREACHABLE FOR SAVE-COMPATIBILITY HISTORY. */\n"""
s=s.replace(anchor,compat,1)

# Keep scouting's public evaluation accuracy synchronized with the canonical
# potential confidence/accuracy every weekly evaluation.
needle="""    player.potentialAccuracy = development.potentialAccuracy;\n    player.potentialTrend = development.potentialTrend;\n    player.potentialConfidence = development.potentialConfidence;\n\n    return {\n"""
repl="""    player.potentialAccuracy = development.potentialAccuracy;\n    player.potentialTrend = development.potentialTrend;\n    player.potentialConfidence = development.potentialConfidence;\n\n    if (player.scoutingProfile && typeof player.scoutingProfile === 'object') {\n      player.scoutingProfile.evaluationAccuracy =\n        development.potentialAccuracy;\n    }\n\n    return {\n"""
if needle not in s:
    raise SystemExit('weekly potential sync anchor missing')
s=s.replace(needle,repl,1)

# Document the single-source-of-truth contract at the weekly evaluator.
needle2="""  function evaluatePlayerPotentialWeek(player = {}, dateString) {\n    ensureCanonicalPlayerContract(player);\n"""
repl2="""  function evaluatePlayerPotentialWeek(player = {}, dateString) {\n    /*\n     * CANONICAL DYNAMIC POTENTIAL ENGINE.\n     *\n     * This is the only function allowed to move a player's potential during\n     * an active career. Annual development trajectory may change growth rate,\n     * but it must not independently rewrite the player's potential label.\n     */\n    ensureCanonicalPlayerContract(player);\n"""
if needle2 not in s:
    raise SystemExit('weekly evaluator anchor missing')
s=s.replace(needle2,repl2,1)

p.write_text(s)
print('unified dynamic potential contract')
