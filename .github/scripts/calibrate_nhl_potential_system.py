from pathlib import Path
wp=Path('artifacts/project-ice/public/world.js')
gp=Path('artifacts/project-ice/public/game.js')
hp=Path('artifacts/project-ice/index.html')
sp=Path('artifacts/project-ice/public/style.css')
w=wp.read_text(); g=gp.read_text(); h=hp.read_text(); s=sp.read_text()

# --- UI: potential role + colored accuracy pill, keep Trend underneath. ---
old='''                <div class="pp-career-card__item">
                  <span class="pp-career-card__label">
                    Potential
                  </span>

                  <strong
                    class="pp-career-card__value"
                    id="pp-development-potential"
                  >
                    —
                  </strong>
                </div>

                <div class="pp-career-card__item">
                  <span class="pp-career-card__label">
                    Evaluation
                  </span>

                  <strong
                    class="pp-career-card__value pp-career-card__value--trend"
                    id="pp-development-trend"
                  >
                    MEDIUM
                  </strong>
                </div>
'''
new='''                <div class="pp-career-card__item">
                  <span class="pp-career-card__label">
                    Potential
                  </span>

                  <div class="pp-career-card__potential-line">
                    <strong
                      class="pp-career-card__value"
                      id="pp-development-potential"
                    >
                      —
                    </strong>

                    <span
                      class="pp-potential-certainty-pill pp-potential-certainty-pill--medium"
                      id="pp-development-potential-accuracy"
                    >
                      MED
                    </span>
                  </div>
                </div>

                <div class="pp-career-card__item">
                  <span class="pp-career-card__label">
                    Trend
                  </span>

                  <strong
                    class="pp-career-card__value pp-career-card__value--trend"
                    id="pp-development-trend"
                  >
                    Stable
                  </strong>
                </div>
'''
if old not in h:
    raise SystemExit('development potential/evaluation html block missing')
h=h.replace(old,new,1)

# Restore directional trend display, while adding LOW/MED/HIGH pill to Potential row.
old='''    setText(
      'pp-development-potential',
      potentialRole
    );

    const potentialAccuracy =
      development.potentialAccuracy ||
      player.potentialAccuracy ||
      (
        Number(development.potentialConfidence ?? player.potentialConfidence) >= 75
          ? 'High'
          : Number(development.potentialConfidence ?? player.potentialConfidence) >= 45
            ? 'Medium'
            : 'Low'
      );

    setText(
      'pp-development-trend',
      String(potentialAccuracy).toUpperCase()
    );
'''
new='''    setText(
      'pp-development-potential',
      potentialRole
    );

    const potentialAccuracy =
      development.potentialAccuracy ||
      player.potentialAccuracy ||
      (
        Number(development.potentialConfidence ?? player.potentialConfidence) >= 75
          ? 'High'
          : Number(development.potentialConfidence ?? player.potentialConfidence) >= 45
            ? 'Medium'
            : 'Low'
      );

    const potentialAccuracyKey =
      String(potentialAccuracy || 'Medium')
        .trim()
        .toLowerCase();

    const potentialAccuracyElement =
      document.getElementById(
        'pp-development-potential-accuracy'
      );

    if (potentialAccuracyElement) {
      potentialAccuracyElement.textContent =
        potentialAccuracyKey === 'high'
          ? 'HIGH'
          : potentialAccuracyKey === 'low'
            ? 'LOW'
            : 'MED';

      potentialAccuracyElement.classList.remove(
        'pp-potential-certainty-pill--low',
        'pp-potential-certainty-pill--medium',
        'pp-potential-certainty-pill--high'
      );

      potentialAccuracyElement.classList.add(
        `pp-potential-certainty-pill--${
          potentialAccuracyKey === 'high'
            ? 'high'
            : potentialAccuracyKey === 'low'
              ? 'low'
              : 'medium'
        }`
      );
    }

    setText(
      'pp-development-trend',
      potentialTrendDisplay.text
    );
'''
if old not in g:
    raise SystemExit('career potential UI JS block missing')
g=g.replace(old,new,1)

old='''    if (potentialTrendElement) {
      potentialTrendElement.classList.remove(
        'pp-career-card__value--trend-rising',
        'pp-career-card__value--trend-falling',
        'pp-career-card__value--trend-stable'
      );
    }
'''
new='''    if (potentialTrendElement) {
      potentialTrendElement.classList.remove(
        'pp-career-card__value--trend-rising',
        'pp-career-card__value--trend-falling',
        'pp-career-card__value--trend-stable'
      );

      potentialTrendElement.classList.add(
        potentialTrendDisplay.className
      );
    }
'''
if old not in g:
    raise SystemExit('trend class reset block missing')
g=g.replace(old,new,1)

# Add Petr-Novak-inspired certainty pill styling, without a numeric potential/progress leak.
css='''

/* NHL-style potential certainty pill used beside the visible role tier. */
.pp-career-card__potential-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.pp-career-card__potential-line .pp-career-card__value {
  min-width: 0;
}

.pp-potential-certainty-pill {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid rgba(237, 191, 98, 0.6);
  border-radius: 999px;
  background: rgba(181, 128, 36, 0.12);
  color: #f0c66c;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  line-height: 1;
}

.pp-potential-certainty-pill--low {
  border-color: rgba(222, 106, 106, 0.58);
  background: rgba(151, 54, 54, 0.14);
  color: #e89b9b;
}

.pp-potential-certainty-pill--medium {
  border-color: rgba(237, 191, 98, 0.6);
  background: rgba(181, 128, 36, 0.12);
  color: #f0c66c;
}

.pp-potential-certainty-pill--high {
  border-color: rgba(104, 193, 151, 0.58);
  background: rgba(48, 132, 92, 0.14);
  color: #83d5ad;
}
'''
if '.pp-potential-certainty-pill {' not in s:
    s += css

# --- Engine: make successful reevaluation move a visible tier, not invisible +1 POT ticks. ---
# Insert generic boundary helpers immediately before the canonical weekly evaluator.
anchor='''  function evaluatePlayerPotentialWeek(player = {}, dateString) {
'''
helpers='''  function getPotentialRoleBoundary(position, currentPotential, direction = 1) {
    const safePotential = Math.max(25, Math.min(99, Number(currentPotential) || 60));
    const currentRole = getPotentialRole(position, safePotential);
    const step = direction >= 0 ? 1 : -1;

    for (
      let candidate = safePotential + step;
      candidate >= 25 && candidate <= 99;
      candidate += step
    ) {
      if (getPotentialRole(position, candidate) !== currentRole) {
        return candidate;
      }
    }

    return safePotential;
  }

  function isNHLLevelPlayer(player = {}) {
    const levelText = [
      player.teamLevel,
      player.level,
      player.league,
      player.currentLeague,
      player.careerLevel,
    ]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();

    return /(^|\\s)NHL($|\\s)/.test(levelText);
  }

  function isFranchisePotentialRole(role = '') {
    return String(role).toLowerCase().includes('franchise');
  }

  function isElitePotentialRole(role = '') {
    return String(role).toLowerCase().includes('elite');
  }

  /*
   * Project Ice draft-potential calibration.
   * EA does not publish its hidden per-tier generation table, so these are
   * our own targets chosen to reproduce the Franchise-mode feel: virtually no
   * generated Franchise prospects, a useful handful of Elite prospects, then
   * a much larger middle of Top-6/Top-4 and Top-9/Top-6D projections.
   *
   * This contract is intentionally centralized now so the later NHL Entry
   * Draft generator cannot invent a different potential economy.
   */
  const PROJECT_ICE_DRAFT_POTENTIAL_CALIBRATION = Object.freeze({
    classSize: 224,
    franchise: Object.freeze({
      minimumYearsBetween: 3,
      forcedByYearsSinceLast: 5,
      chanceAtYear3: 0.40,
      chanceAtYear4: 0.68,
      targetPerClass: Object.freeze([0, 1]),
    }),
    elite: Object.freeze({ min: 10, max: 15 }),
    topRole: Object.freeze({ min: 48, max: 64 }),
    middleRole: Object.freeze({ min: 72, max: 92 }),
    depthRole: Object.freeze({ min: 54, max: 84 }),
    confidenceWeights: Object.freeze({
      franchise: Object.freeze({ low: 0.08, medium: 0.77, high: 0.15 }),
      elite: Object.freeze({ low: 0.18, medium: 0.68, high: 0.14 }),
      topRole: Object.freeze({ low: 0.27, medium: 0.68, high: 0.05 }),
      middleRole: Object.freeze({ low: 0.38, medium: 0.60, high: 0.02 }),
    }),
  });

  function getProjectIceDraftPotentialCalibration() {
    return PROJECT_ICE_DRAFT_POTENTIAL_CALIBRATION;
  }

'''
if anchor not in w:
    raise SystemExit('weekly potential evaluator anchor missing')
if 'PROJECT_ICE_DRAFT_POTENTIAL_CALIBRATION' not in w:
    w=w.replace(anchor,helpers+anchor,1)

# Replace +1/-1 mutation with next visible tier and add special Franchise gating.
old='''    let delta = 0;
    if (cooldownMet && signal >= threshold && reevaluationRoll < reevaluationChance) delta = 1;
    if (cooldownMet && signal <= -threshold && reevaluationRoll < reevaluationChance) delta = -1;

    /* Never let a projected ceiling fall below demonstrated current ability. */
    const minimumPotential = Math.min(99, Math.max(25, evidence.overall + (evidence.age <= 23 ? 2 : 0)));
    const newPotential = Math.max(minimumPotential, Math.min(99, oldPotential + delta));
'''
new='''    let targetPotential = oldPotential;
    const upwardBoundary = getPotentialRoleBoundary(player.position, oldPotential, 1);
    const downwardBoundary = getPotentialRoleBoundary(player.position, oldPotential, -1);
    const upwardRole = getPotentialRole(player.position, upwardBoundary);
    const upwardIsFranchise = isFranchisePotentialRole(upwardRole);
    const currentlyElite = isElitePotentialRole(oldRole);
    const nhlLevel = isNHLLevelPlayer(player);

    /*
     * Elite is an attainable high-end outcome for a genuinely dominant young
     * career player. Franchise is different: draft-age/HS players almost never
     * receive it, while an already-Elite player proving himself as one of the
     * NHL's dominant stars has a materially better (still rare) path there.
     */
    let upwardChance = reevaluationChance;
    let upwardThreshold = threshold;

    if (upwardIsFranchise) {
      upwardThreshold += nhlLevel && currentlyElite ? 0.35 : 0.95;
      upwardChance = nhlLevel && currentlyElite
        ? Math.min(0.16, reevaluationChance * 0.72)
        : Math.min(0.025, reevaluationChance * 0.12);
    }

    if (
      cooldownMet &&
      signal >= upwardThreshold &&
      reevaluationRoll < upwardChance
    ) {
      targetPotential = upwardBoundary;
    } else if (
      cooldownMet &&
      signal <= -threshold &&
      reevaluationRoll < reevaluationChance
    ) {
      targetPotential = downwardBoundary;
    }

    /* Never let a projected ceiling fall below demonstrated current ability. */
    const minimumPotential = Math.min(99, Math.max(25, evidence.overall + (evidence.age <= 23 ? 2 : 0)));
    const newPotential = Math.max(minimumPotential, Math.min(99, targetPotential));
'''
if old not in w:
    raise SystemExit('weekly potential delta block missing')
w=w.replace(old,new,1)

# Add debug-only upward chance/threshold to engine return; never rendered.
old='''      reevaluationChance: Number(reevaluationChance.toFixed(4)),
      reevaluationRoll: Number(reevaluationRoll.toFixed(4)),
      evidence,
'''
new='''      reevaluationChance: Number(reevaluationChance.toFixed(4)),
      reevaluationRoll: Number(reevaluationRoll.toFixed(4)),
      upwardThreshold: Number(upwardThreshold.toFixed(4)),
      upwardChance: Number(upwardChance.toFixed(4)),
      evidence,
'''
if old not in w:
    raise SystemExit('potential diagnostic return block missing')
w=w.replace(old,new,1)

wp.write_text(w); gp.write_text(g); hp.write_text(h); sp.write_text(s)
print('calibrated NHL-style potential UI, tier changes, and draft distribution contract')
