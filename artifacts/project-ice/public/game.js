/* ============================================================
   PROJECT ICE — game.js
   Build 0.0.2
   Title screen, player creation and save preview
   ============================================================ */

'use strict';

const SAVE_KEY = 'projectice_save';

const Game = {
  screen: 'title',

  player: {
    firstName: '',
    lastName: '',
    hometown: '',
    position: '',
    handedness: '',
    background: '',
    archetype: '',
    motivation: '',
    nhlTeam: '',
    age: 14,
    careerStart: 2022,
  },
};

// ── Screen references ───────────────────────────────────────
const titleScreen          = document.getElementById('title-screen');
const creationScreen       = document.getElementById('creation-screen');
const summaryScreen        = document.getElementById('summary-screen');
const identityScreen       = document.getElementById('identity-screen');
const careerOverviewScreen = document.getElementById('career-overview-screen');
const bedroomScreen        = document.getElementById('bedroom-screen');
const nhlTeamScreen        = document.getElementById('nhlteam-screen');
const motivationScreen     = document.getElementById('motivation-screen');
const archetypeScreen      = document.getElementById('archetype-screen');
const backgroundScreen     = document.getElementById('background-screen');
const arenaScreen          = document.getElementById('arena-screen');
const hubScreen            = document.getElementById('hub-screen');

// ── Button references ───────────────────────────────────────
const btnNewCareer = document.getElementById('btn-new-career');
const btnContinue = document.getElementById('btn-continue');
// ── DEV SHORTCUT — TEMPORARY, REMOVE BEFORE RELEASE ──────────────────────────
const btnDevHub       = document.getElementById('btn-dev-hub');
const devShortcutHint = document.getElementById('dev-shortcut-hint');
// ─────────────────────────────────────────────────────────────────────────────
const btnBackTitle = document.getElementById('btn-back-title');
const btnBackCreation = document.getElementById('btn-back-creation');
const btnBackSummary = document.getElementById('btn-back-summary');
const btnContinueSummary = document.getElementById('btn-continue-summary');
const btnDeleteSave = document.getElementById('btn-delete-save');
const btnContinueSetup      = document.getElementById('btn-continue-setup');
const btnIdentityBackground = document.getElementById('btn-identity-background');
const btnBackIdentity       = document.getElementById('btn-back-identity');
const btnContinueBackground = document.getElementById('btn-continue-background');
const btnIdentityArchetype     = document.getElementById('btn-identity-archetype');
const btnBackIdentityArchetype = document.getElementById('btn-back-identity-archetype');
const btnContinueArchetype     = document.getElementById('btn-continue-archetype');
const btnIdentityMotivation     = document.getElementById('btn-identity-motivation');
const btnBackIdentityMotivation = document.getElementById('btn-back-identity-motivation');
const btnContinueMotivation     = document.getElementById('btn-continue-motivation');
const btnIdentityNhlTeam        = document.getElementById('btn-identity-nhlteam');
const btnBackIdentityNhlTeam    = document.getElementById('btn-back-identity-nhlteam');
const btnContinueNhlTeam        = document.getElementById('btn-continue-nhlteam');
const btnBackOverview           = document.getElementById('btn-back-overview');
const btnBeginCareer            = document.getElementById('btn-begin-career');

// ── Form references ─────────────────────────────────────────
const playerForm = document.getElementById('player-form');
const firstNameInput = document.getElementById('first-name');
const lastNameInput = document.getElementById('last-name');
const hometownInput = document.getElementById('hometown');
const formError = document.getElementById('form-error');

// ── Summary references ──────────────────────────────────────
const summaryName = document.getElementById('summary-name');
const summaryDetails = document.getElementById('summary-details');
const summaryHometown = document.getElementById('summary-hometown');

// ── Identity references ─────────────────────────────────────
const identityBgStatus         = document.getElementById('identity-background-status');
const identityArchetypeStatus  = document.getElementById('identity-archetype-status');
const identityMotivationStatus = document.getElementById('identity-motivation-status');
const identityNhlTeamStatus    = document.getElementById('identity-nhlteam-status');
const overviewPlayerName       = document.getElementById('overview-player-name');
const overviewPlayerPosition   = document.getElementById('overview-player-position');
const overviewPlayerHometown   = document.getElementById('overview-player-hometown');
const overviewBackground       = document.getElementById('overview-background');
const overviewArchetype        = document.getElementById('overview-archetype');
const overviewMotivation       = document.getElementById('overview-motivation');
const overviewNhlTeam          = document.getElementById('overview-nhlteam');
const statusBackground         = document.getElementById('status-background');
const statusArchetype          = document.getElementById('status-archetype');
const statusMotivation         = document.getElementById('status-motivation');
const statusNhlTeam            = document.getElementById('status-nhlteam');
const identityCompleteCount    = document.getElementById('identity-complete-count');

// ── Archetype position rules ────────────────────────────────
const POSITION_GROUP = {
  'Center':     'forward',
  'Left Wing':  'forward',
  'Right Wing': 'forward',
  'Defenseman': 'defense',
  'Goalie':     'goalie',
};

const VALID_ARCHETYPES = {
  forward: ['Sniper', 'Playmaker', 'Power Forward', 'Two-Way Forward'],
  defense: ['Offensive Defenseman', 'Defensive Defenseman'],
  goalie:  ['Butterfly Goalie', 'Athletic Goalie', 'Hybrid Goalie'],
};

function getPositionGroup(position) {
  return POSITION_GROUP[position] || '';
}

function isArchetypeValidForPosition(archetype, position) {
  const group = getPositionGroup(position);
  if (!group) return false;
  return (VALID_ARCHETYPES[group] || []).includes(archetype);
}

function filterArchetypeCards() {
  const group = getPositionGroup(Game.player.position);
  document.querySelectorAll('#archetype-screen .bg-card').forEach((card) => {
    const show = card.dataset.positionGroup === group;
    card.style.display = show ? '' : 'none';
  });
}

// ── Screen navigation ───────────────────────────────────────
function showScreen(screenName) {
  titleScreen.classList.add('screen--hidden');
  creationScreen.classList.add('screen--hidden');
  summaryScreen.classList.add('screen--hidden');
  identityScreen.classList.add('screen--hidden');
  careerOverviewScreen.classList.add('screen--hidden');
  bedroomScreen.classList.add('screen--hidden');
  nhlTeamScreen.classList.add('screen--hidden');
  motivationScreen.classList.add('screen--hidden');
  archetypeScreen.classList.add('screen--hidden');
  backgroundScreen.classList.add('screen--hidden');
  arenaScreen.classList.add('screen--hidden');
  hubScreen.classList.add('screen--hidden');

  if (screenName === 'title')      titleScreen.classList.remove('screen--hidden');
  if (screenName === 'creation')   creationScreen.classList.remove('screen--hidden');
  if (screenName === 'summary')    summaryScreen.classList.remove('screen--hidden');
  if (screenName === 'identity') {
    // Clear archetype if the saved choice is no longer valid for the current position
    if (Game.player.archetype && !isArchetypeValidForPosition(Game.player.archetype, Game.player.position)) {
      Game.player.archetype = '';
    }
    identityScreen.classList.remove('screen--hidden');
    updateIdentityScreen();
  }
  if (screenName === 'overview') {
    careerOverviewScreen.classList.remove('screen--hidden');
    updateCareerOverview();
  }
  if (screenName === 'bedroom') {
    bedroomScreen.classList.remove('screen--hidden');
  }
  if (screenName === 'nhlteam') {
    nhlTeamScreen.classList.remove('screen--hidden');
    restoreNhlTeamSelection();
  }
  if (screenName === 'motivation') {
    motivationScreen.classList.remove('screen--hidden');
    restoreMotivationSelection();
  }
  if (screenName === 'archetype') {
    archetypeScreen.classList.remove('screen--hidden');
    filterArchetypeCards();
    restoreArchetypeSelection();
  }
  if (screenName === 'background') {
    backgroundScreen.classList.remove('screen--hidden');
    restoreBackgroundSelection();
  }
  if (screenName === 'arena') {
    arenaScreen.classList.remove('screen--hidden');
  }
  if (screenName === 'hub') {
    hubScreen.classList.remove('screen--hidden');
    updateHubScreen();
  }

  Game.screen = screenName;
  window.scrollTo(0, 0);
}

// ── Identity screen update ──────────────────────────────────
function setIdentityStatus(el, complete) {
  el.textContent = complete ? '🟢 COMPLETE' : '⚪ NOT SELECTED';
  el.classList.toggle('identity-card__status--complete', complete);
  el.classList.toggle('identity-card__status--empty',   !complete);
}

function updateIdentityBackground() {
  const selected = Game.player.background;
  identityBgStatus.textContent = selected || 'Not Selected';
  identityBgStatus.classList.toggle('identity-card__subtitle--selected', Boolean(selected));
}

function updateIdentityArchetype() {
  const selected = Game.player.archetype;
  identityArchetypeStatus.textContent = selected || 'Not Selected';
  identityArchetypeStatus.classList.toggle('identity-card__subtitle--selected', Boolean(selected));
}

function updateIdentityMotivation() {
  const selected = Game.player.motivation;
  identityMotivationStatus.textContent = selected || 'Not Selected';
  identityMotivationStatus.classList.toggle('identity-card__subtitle--selected', Boolean(selected));
}

function updateIdentityNhlTeam() {
  const selected = Game.player.nhlTeam;
  identityNhlTeamStatus.textContent = selected || 'Not Selected';
  identityNhlTeamStatus.classList.toggle('identity-card__subtitle--selected', Boolean(selected));
}

function updateIdentityScreen() {
  updateIdentityBackground();
  updateIdentityArchetype();
  updateIdentityMotivation();
  updateIdentityNhlTeam();

  const bgDone    = Boolean(Game.player.background);
  const archDone  = Boolean(Game.player.archetype);
  const motivDone = Boolean(Game.player.motivation);
  const nhlDone   = Boolean(Game.player.nhlTeam);

  setIdentityStatus(statusBackground, bgDone);
  setIdentityStatus(statusArchetype,  archDone);
  setIdentityStatus(statusMotivation, motivDone);
  setIdentityStatus(statusNhlTeam,    nhlDone);

  const count = [bgDone, archDone, motivDone, nhlDone].filter(Boolean).length;
  identityCompleteCount.textContent = count;

  const allDone = count === 4;
  btnContinueSetup.disabled = !allDone;
  btnContinueSetup.classList.toggle('btn--primary',    allDone);
  btnContinueSetup.classList.toggle('btn--secondary', !allDone);
}

// ── Career Overview ─────────────────────────────────────────
function updateCareerOverview() {
  const p = Game.player;
  overviewPlayerName.textContent     = `${p.firstName} ${p.lastName}`;
  overviewPlayerPosition.textContent = `${p.position} · Shoots ${p.handedness}`;
  overviewPlayerHometown.textContent = p.hometown;
  overviewBackground.textContent     = p.background  || '—';
  overviewArchetype.textContent      = p.archetype   || '—';
  overviewMotivation.textContent     = p.motivation  || '—';
  overviewNhlTeam.textContent        = p.nhlTeam     || '—';
}

// ── Restore selection UI ────────────────────────────────────
function restoreBackgroundSelection() {
  const saved = Game.player.background;

  document.querySelectorAll('#background-screen .bg-card').forEach((card) => {
    card.classList.toggle('bg-card--selected', saved && card.dataset.background === saved);
  });

  const has = Boolean(saved);
  btnContinueBackground.disabled = !has;
  btnContinueBackground.classList.toggle('btn--primary',   has);
  btnContinueBackground.classList.toggle('btn--secondary', !has);
}

function restoreNhlTeamSelection() {
  const saved = Game.player.nhlTeam;

  document.querySelectorAll('#nhlteam-screen .team-card').forEach((card) => {
    card.classList.toggle('team-card--selected', saved && card.dataset.team === saved);
  });

  const has = Boolean(saved);
  btnContinueNhlTeam.disabled = !has;
  btnContinueNhlTeam.classList.toggle('btn--primary',   has);
  btnContinueNhlTeam.classList.toggle('btn--secondary', !has);
}

function restoreMotivationSelection() {
  const saved = Game.player.motivation;

  document.querySelectorAll('#motivation-screen .motivation-card').forEach((card) => {
    card.classList.toggle('motivation-card--selected', saved && card.dataset.motivation === saved);
  });

  const has = Boolean(saved);
  btnContinueMotivation.disabled = !has;
  btnContinueMotivation.classList.toggle('btn--primary',   has);
  btnContinueMotivation.classList.toggle('btn--secondary', !has);
}

function restoreArchetypeSelection() {
  const saved = Game.player.archetype;

  document.querySelectorAll('#archetype-screen .bg-card').forEach((card) => {
    card.classList.toggle('bg-card--selected', saved && card.dataset.archetype === saved);
  });

  const has = Boolean(saved);
  btnContinueArchetype.disabled = !has;
  btnContinueArchetype.classList.toggle('btn--primary',   has);
  btnContinueArchetype.classList.toggle('btn--secondary', !has);
}

// ── Ripple effect ───────────────────────────────────────────
function spawnRipple(button, event) {
  if (!button || button.disabled) return;

  const rect = button.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const size = Math.max(rect.width, rect.height);

  const ripple = document.createElement('span');
  ripple.className = 'ripple';

  ripple.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${x - size / 2}px;
    top: ${y - size / 2}px;
  `;

  button.appendChild(ripple);

  ripple.addEventListener('animationend', () => {
    ripple.remove();
  });
}

// ── Player choice buttons ───────────────────────────────────
function handleChoiceButton(button) {
  const groupName = button.dataset.choiceGroup;
  const selectedValue = button.dataset.value;

  const buttonsInGroup = document.querySelectorAll(
    `[data-choice-group="${groupName}"]`
  );

  buttonsInGroup.forEach((choiceButton) => {
    choiceButton.classList.remove('choice-card--selected');
  });

  button.classList.add('choice-card--selected');

  if (groupName === 'position') {
    Game.player.position = selectedValue;
  }

  if (groupName === 'handedness') {
    Game.player.handedness = selectedValue;
  }

  formError.textContent = '';
}

// ── Player form ─────────────────────────────────────────────
function handlePlayerFormSubmit(event) {
  event.preventDefault();

  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const hometown = hometownInput.value.trim();

  if (!firstName || !lastName || !hometown) {
    formError.textContent = 'Complete your name and hometown to continue.';
    return;
  }

  if (!Game.player.position) {
    formError.textContent = 'Choose your position to continue.';
    return;
  }

  if (!Game.player.handedness) {
    formError.textContent = 'Choose whether your player shoots left or right.';
    return;
  }

  Game.player.firstName = firstName;
  Game.player.lastName = lastName;
  Game.player.hometown = hometown;

  updateSummary();
  saveCareerPreview();
  showScreen('summary');
}

// ── Summary screen ──────────────────────────────────────────
function updateSummary() {
  summaryName.textContent =
    `${Game.player.firstName} ${Game.player.lastName}`;

  summaryDetails.textContent =
    `${Game.player.position} · Shoots ${Game.player.handedness}`;

  summaryHometown.textContent = Game.player.hometown;
}

// ── Save system ─────────────────────────────────────────────
function saveCareerPreview() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: '0.0.2',
        savedAt: new Date().toISOString(),
        player: Game.player,
        // Reference to the world this career belongs to.
        // 'default' is the only world ID at this stage.
        worldRef: WorldEngine.state.id,
      })
    );

    updateContinueButton();
    updateDevShortcut(); // DEV SHORTCUT — remove with dev shortcut
  } catch (error) {
    console.error('[Project Ice] Save failed:', error);
  }
}

function loadCareerPreview() {
  try {
    const savedCareer = localStorage.getItem(SAVE_KEY);

    if (!savedCareer) return;

    const parsedCareer = JSON.parse(savedCareer);

    if (!parsedCareer.player) return;

    Game.player = {
      ...Game.player,
      ...parsedCareer.player,
    };

    firstNameInput.value = Game.player.firstName || '';
    lastNameInput.value = Game.player.lastName || '';
    hometownInput.value = Game.player.hometown || '';

    restoreSelectedChoice('position', Game.player.position);
    restoreSelectedChoice('handedness', Game.player.handedness);

    updateSummary();
    showScreen('summary');
  } catch (error) {
    console.error('[Project Ice] Load failed:', error);
  }
}

function deleteCareerPreview() {
  const confirmed = window.confirm(
    'Delete your saved Project Ice career preview?'
  );

  if (!confirmed) return;

  localStorage.removeItem(SAVE_KEY);
  resetPlayer();
  updateContinueButton();
  updateDevShortcut(); // DEV SHORTCUT — remove with dev shortcut
  showScreen('title');
}

function restoreSelectedChoice(groupName, selectedValue) {
  const choices = document.querySelectorAll(
    `[data-choice-group="${groupName}"]`
  );

  choices.forEach((choice) => {
    const isSelected = choice.dataset.value === selectedValue;

    choice.classList.toggle('choice-card--selected', isSelected);
  });
}

function updateContinueButton() {
  const hasSave = Boolean(localStorage.getItem(SAVE_KEY));

  btnContinue.disabled = !hasSave;

  if (hasSave) {
    btnContinue.classList.remove('btn--secondary');
    btnContinue.classList.add('btn--primary');

    btnContinue.innerHTML = `
      <span class="btn__icon">📁</span>
      <span class="btn__label">Continue Career</span>
      <span class="btn__arrow">›</span>
    `;
  } else {
    btnContinue.classList.remove('btn--primary');
    btnContinue.classList.add('btn--secondary');

    btnContinue.innerHTML = `
      <span class="btn__icon">📁</span>
      <span class="btn__label">Continue Career</span>
      <span class="btn__tag">No Save Found</span>
    `;
  }
}

// ── DEV SHORTCUT — TEMPORARY, REMOVE BEFORE RELEASE ──────────────────────────
// Enables the "Skip to Career Hub" button only when a saved career exists.
// Does not alter save data, career stage, or tryout completion state.
function updateDevShortcut() {
  const hasSave = Boolean(localStorage.getItem(SAVE_KEY));
  btnDevHub.disabled = !hasSave;
  devShortcutHint.classList.toggle('is-visible', !hasSave);
}
// ─────────────────────────────────────────────────────────────────────────────

function resetPlayer() {
  Game.player = {
    firstName: '',
    lastName: '',
    hometown: '',
    position: '',
    handedness: '',
    background: '',
    archetype: '',
    motivation: '',
    nhlTeam: '',
    age: 14,
    careerStart: 2022,
  };

  playerForm.reset();

  document.querySelectorAll('.choice-card').forEach((choice) => {
    choice.classList.remove('choice-card--selected');
  });

  formError.textContent = '';
}

// ── Event listeners ─────────────────────────────────────────
btnNewCareer.addEventListener('pointerdown', (event) => {
  spawnRipple(btnNewCareer, event);
});

btnNewCareer.addEventListener('click', () => {
  resetPlayer();
  showScreen('creation');
});

btnContinue.addEventListener('click', () => {
  loadCareerPreview();
});

// ── DEV SHORTCUT — TEMPORARY, REMOVE BEFORE RELEASE ──────────────────────────
// Loads the saved career and jumps straight to Career Hub without running
// any cinematic sequences or altering career stage / tryout state.
btnDevHub.addEventListener('click', () => {
  const savedCareer = localStorage.getItem(SAVE_KEY);
  if (!savedCareer) return;

  try {
    const parsed = JSON.parse(savedCareer);
    if (!parsed.player) return;

    Game.player = { ...Game.player, ...parsed.player };
    showScreen('hub');
  } catch (err) {
    console.error('[DEV] Skip to Hub failed:', err);
  }
});
// ─────────────────────────────────────────────────────────────────────────────

btnBackTitle.addEventListener('click', () => {
  showScreen('title');
});

btnBackCreation.addEventListener('click', () => {
  showScreen('creation');
});

btnBackSummary.addEventListener('click', () => {
  showScreen('summary');
});

// ── Hockey Background screen ────────────────────────────────
document.querySelectorAll('#background-screen .bg-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#background-screen .bg-card').forEach((c) =>
      c.classList.remove('bg-card--selected')
    );
    card.classList.add('bg-card--selected');
    Game.player.background = card.dataset.background;
    btnContinueBackground.disabled = false;
    btnContinueBackground.classList.remove('btn--secondary');
    btnContinueBackground.classList.add('btn--primary');
  });
});

btnIdentityBackground.addEventListener('click', () => {
  showScreen('background');
});

btnBackIdentity.addEventListener('click', () => {
  showScreen('identity');
});

btnContinueBackground.addEventListener('click', () => {
  saveCareerPreview();
  showScreen('identity');
});

// ── Archetype screen ────────────────────────────────────────
document.querySelectorAll('#archetype-screen .bg-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#archetype-screen .bg-card').forEach((c) =>
      c.classList.remove('bg-card--selected')
    );
    card.classList.add('bg-card--selected');
    Game.player.archetype = card.dataset.archetype;
    btnContinueArchetype.disabled = false;
    btnContinueArchetype.classList.remove('btn--secondary');
    btnContinueArchetype.classList.add('btn--primary');
  });
});

btnIdentityArchetype.addEventListener('click', () => {
  showScreen('archetype');
});

btnBackIdentityArchetype.addEventListener('click', () => {
  showScreen('identity');
});

btnContinueArchetype.addEventListener('click', () => {
  saveCareerPreview();
  showScreen('identity');
});

// ── NHL Team screen ─────────────────────────────────────────
document.querySelectorAll('#nhlteam-screen .team-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#nhlteam-screen .team-card').forEach((c) =>
      c.classList.remove('team-card--selected')
    );
    card.classList.add('team-card--selected');
    Game.player.nhlTeam = card.dataset.team;
    btnContinueNhlTeam.disabled = false;
    btnContinueNhlTeam.classList.remove('btn--secondary');
    btnContinueNhlTeam.classList.add('btn--primary');
  });
});

btnIdentityNhlTeam.addEventListener('click', () => {
  showScreen('nhlteam');
});

btnBackIdentityNhlTeam.addEventListener('click', () => {
  showScreen('identity');
});

btnContinueNhlTeam.addEventListener('click', () => {
  saveCareerPreview();
  showScreen('identity');
});

// ── Motivation screen ───────────────────────────────────────
document.querySelectorAll('#motivation-screen .motivation-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#motivation-screen .motivation-card').forEach((c) =>
      c.classList.remove('motivation-card--selected')
    );
    card.classList.add('motivation-card--selected');
    Game.player.motivation = card.dataset.motivation;
    btnContinueMotivation.disabled = false;
    btnContinueMotivation.classList.remove('btn--secondary');
    btnContinueMotivation.classList.add('btn--primary');
  });
});

btnIdentityMotivation.addEventListener('click', () => {
  showScreen('motivation');
});

btnBackIdentityMotivation.addEventListener('click', () => {
  showScreen('identity');
});

btnContinueMotivation.addEventListener('click', () => {
  saveCareerPreview();
  showScreen('identity');
});

btnContinueSummary.addEventListener('click', () => {
  saveCareerPreview();
  showScreen('identity');
});

btnContinueSetup.addEventListener('click', () => {
  showScreen('overview');
});

btnBackOverview.addEventListener('click', () => {
  showScreen('identity');
});

btnBeginCareer.addEventListener('click', () => {
  runIntroSequence();
});

// ── Bedroom interactions ────────────────────────────────────
let brToastTimer = null;

function showBedroomToast(message) {
  const toast = document.getElementById('br-toast');
  toast.textContent = message;
  toast.classList.add('br__toast--visible');
  clearTimeout(brToastTimer);
  brToastTimer = setTimeout(() => {
    toast.classList.remove('br__toast--visible');
  }, 3800);
}

document.querySelector('.br__bag').addEventListener('click', () => {
  showBedroomToast('Everything is packed for tomorrow\'s tryouts.');
});

document.querySelector('.br__stick-wrap').addEventListener('click', () => {
  showBedroomToast('You\'ve practiced with this stick almost every day this summer.');
});

document.querySelector('.br__phone').addEventListener('click', () => {
  const overlay = document.getElementById('messages-overlay');
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
});

document.getElementById('btn-close-messages').addEventListener('click', () => {
  const overlay = document.getElementById('messages-overlay');
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
});

function openSleepModal() {
  const modal = document.getElementById('sleep-modal');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

document.querySelector('.br__mattress').addEventListener('click', openSleepModal);
document.querySelector('.br__headboard').addEventListener('click', openSleepModal);

document.getElementById('btn-sleep-no').addEventListener('click', () => {
  const modal = document.getElementById('sleep-modal');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
});

document.getElementById('btn-sleep-yes').addEventListener('click', async () => {
  const modal = document.getElementById('sleep-modal');
  modal.classList.remove('is-open');
  await sleep(250);
  await runSleepSequence();
});

async function runSleepSequence() {
  const overlay = document.getElementById('cinematic-overlay');
  const text    = document.getElementById('cinematic-text');

  // Fade to black
  overlay.classList.add('is-active');
  await sleep(1100);

  // Card 1 — Date
  text.innerHTML = '<span class="cin-date">September 4, 2022</span>';
  text.style.opacity = '1';
  await sleep(2000);
  text.style.opacity = '0';
  await sleep(560);
  text.innerHTML = '';

  // Card 2 — Event + Venue
  text.innerHTML = '<span class="cin-title">Freshman Tryouts</span><span class="cin-venue">Ice Den Arena</span>';
  text.style.opacity = '1';
  await sleep(2000);
  text.style.opacity = '0';
  await sleep(560);
  text.innerHTML = '';

  // Reveal arena screen, fade overlay out
  showScreen('arena');
  overlay.classList.remove('is-active');
  await sleep(1100);

  // Begin dialogue sequence
  runArenaDialogue();
}

async function runArenaDialogue() {
  await sleep(3000); // brief moment to take in the scene

  const dialogueEl = document.getElementById('arena-dialogue');
  const approachEl = document.getElementById('dlg-approach');
  const bubbleEl   = document.getElementById('dlg-bubble');
  const speakerEl  = document.getElementById('dlg-speaker');
  const textEl     = document.getElementById('dlg-text');
  const actionEl   = document.getElementById('arena-action');

  // Slide panel up with approach description
  dialogueEl.classList.add('is-visible');
  dialogueEl.setAttribute('aria-hidden', 'false');
  await sleep(1800);

  // Swap approach text for dialogue bubble
  approachEl.style.transition = 'opacity 0.3s ease';
  approachEl.style.opacity = '0';
  await sleep(320);
  approachEl.style.display = 'none';
  bubbleEl.style.display = 'flex';

  async function showLine(speaker, cssClass, line) {
    speakerEl.textContent = speaker;
    speakerEl.className = 'arena-dialogue__speaker ' + cssClass;
    textEl.style.opacity = '0';
    textEl.textContent = line;
    await sleep(60);
    textEl.style.opacity = '1';
  }

  // Line 1 — Coach Reynolds
  await showLine('Coach Reynolds', 'arena-dialogue__speaker--coach',
    `"You must be ${Game.player.lastName || 'you'}."`);
  await sleep(2600);

  // Line 2 — Player
  await showLine(Game.player.firstName || 'You', 'arena-dialogue__speaker--player',
    '"Yes, sir."');
  await sleep(2000);

  // Line 3 — Coach Reynolds
  await showLine('Coach Reynolds', 'arena-dialogue__speaker--coach',
    '"Good. Grab a jersey and get on the ice. We\'ll see what you\'ve got."');
  await sleep(3000);

  // Dismiss dialogue, show CTA
  dialogueEl.classList.remove('is-visible');
  await sleep(450);
  actionEl.classList.add('is-visible');
  actionEl.setAttribute('aria-hidden', 'false');
}

document.getElementById('btn-take-ice').addEventListener('click', async () => {
  const overlay = document.getElementById('cinematic-overlay');
  overlay.classList.add('is-active');
  await sleep(900);
  showScreen('hub');
  overlay.classList.remove('is-active');
  await sleep(900);
});

// ── News System ──────────────────────────────────────────────
// NewsSystem is now a thin alias for WorldEngine.news.
// All existing call sites (NewsSystem.publish, NewsSystem.getRecent)
// work without modification. The news feed lives in the World Engine
// and is persisted with world state, not the player save.
// See public/world.js for the full implementation.
const NewsSystem = WorldEngine.news;

function renderHubNews() {
  const container = document.getElementById('hub-news-list');
  if (!container) return;
  const items = NewsSystem.getRecent(3);
  container.innerHTML = items.map(item => `
    <div class="hub-news__item">
      <span class="hub-news__tag">${item.tag}</span>
      <span class="hub-news__headline">${item.headline}</span>
    </div>
  `).join('');
}

// Register the hub re-render callback with the World Engine news system.
// WorldEngine.news.publish() will call renderHubNews() automatically
// whenever a new headline is added — without world.js touching the DOM.
WorldEngine.news.onNewsChange(renderHubNews);

// ── Career Hub ───────────────────────────────────────────────

const HUB_DAYS = [
  { fullDate: 'Sunday, September 4',    eventLabel: '🎯 Freshman Tryouts', hasEvent: true  },
  { fullDate: 'Monday, September 5',    eventLabel: 'Off Day',             hasEvent: false },
  { fullDate: 'Tuesday, September 6',   eventLabel: 'Off Day',             hasEvent: false },
  { fullDate: 'Wednesday, September 7', eventLabel: 'Off Day',             hasEvent: false },
  { fullDate: 'Thursday, September 8',  eventLabel: 'Off Day',             hasEvent: false },
  { fullDate: 'Friday, September 9',    eventLabel: 'Off Day',             hasEvent: false },
  { fullDate: 'Saturday, September 10', eventLabel: 'Off Day',             hasEvent: false },
];

let hubCalendarReady = false;

function updateHubScreen() {
  const p    = Game.player;
  const name = `${p.firstName} ${p.lastName}`.trim() || '—';
  const age  = p.age || 14;
  const pos  = p.position || '—';

  // ── Identity bar ─────────────────────────────────────────
  const nameEl = document.getElementById('hub-player-name');
  if (nameEl) nameEl.textContent = name;

  const posEl = document.getElementById('hub-player-pos');
  if (posEl) posEl.textContent = pos;

  const ageBarEl = document.getElementById('hub-player-age-bar');
  if (ageBarEl) ageBarEl.textContent = age;

  // OVR is hardcoded at 60 until attribute calculation is wired
  // hub-player-ovr span already reads "60" from HTML; leave it

  // ── Home tab – team leaders ───────────────────────────────
  const leadersNameEl = document.getElementById('hub-leaders-you-name');
  if (leadersNameEl) leadersNameEl.textContent = name;

  const leadersPosEl = document.getElementById('hub-leaders-you-pos');
  if (leadersPosEl) leadersPosEl.textContent = pos;

  // ── Home tab – news ───────────────────────────────────────
  renderHubNews();

  // ── Player profile tab fields ─────────────────────────────
  const ppNameEl = document.getElementById('pp-player-name');
  if (ppNameEl) ppNameEl.textContent = name;

  const ppPosEl = document.getElementById('pp-player-pos');
  if (ppPosEl) ppPosEl.textContent = pos;

  const ppAgeEl = document.getElementById('pp-player-age');
  if (ppAgeEl) ppAgeEl.textContent = `${age} years old`;

  // ── One-time setup ────────────────────────────────────────
  if (!hubCalendarReady) {
    setupHubCalendar();
    hubCalendarReady = true;
  }
}

function setupHubCalendar() {
  const cards        = document.querySelectorAll('.hub-day-card');
  const detailDate   = document.getElementById('hub-detail-date');
  const detailEvent  = document.getElementById('hub-detail-event');
  const detailBtn    = document.getElementById('hub-detail-btn-label');

  function selectDay(index) {
    cards.forEach(c => c.classList.remove('hub-day-card--selected'));
    cards[index].classList.add('hub-day-card--selected');
    const d = HUB_DAYS[index];
    if (detailDate)  detailDate.textContent  = d.fullDate;
    if (detailEvent) detailEvent.textContent = d.eventLabel;
    if (detailBtn)   detailBtn.textContent   = d.hasEvent ? 'Enter Event' : 'Simulate To This Day';
  }

  cards.forEach((card, i) => {
    card.addEventListener('click', () => selectDay(i));
  });

  selectDay(0);
}

document.getElementById('btn-hub-continue').addEventListener('click', async () => {
  const overlay = document.getElementById('cinematic-overlay');
  const text    = document.getElementById('cinematic-text');
  overlay.classList.add('is-active');
  await sleep(1000);
  text.innerHTML = '<span class="cin-title">Tryout Drill 1</span>';
  text.style.opacity = '1';
  // End state — drills not yet implemented
});

document.querySelectorAll('.hub-nav__tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const id = tab.dataset.hubTab;
    if (id !== 'home' && id !== 'player') return; // schedule / team / league not yet functional
    document.querySelectorAll('.hub-nav__tab').forEach(t => t.classList.remove('hub-nav__tab--active'));
    tab.classList.add('hub-nav__tab--active');
    document.querySelectorAll('.hub-tab-panel').forEach(p => {
      p.classList.remove('hub-tab-panel--active');
      p.setAttribute('aria-hidden', 'true');
    });
    const panel = document.getElementById(`hub-tab-${id}`);
    if (panel) {
      panel.classList.add('hub-tab-panel--active');
      panel.removeAttribute('aria-hidden');
    }
  });
});

// ── Player profile accordion ─────────────────────────────────
document.querySelectorAll('.pp-attr-cat__header').forEach(header => {
  header.addEventListener('click', () => {
    const cat = header.closest('.pp-attr-cat');
    cat.classList.toggle('pp-attr-cat--open');
  });
});

// ── Cinematic intro sequence ────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runIntroSequence() {
  const overlay = document.getElementById('cinematic-overlay');
  const text    = document.getElementById('cinematic-text');

  // Step 1 — fade to black over 1 s
  overlay.classList.add('is-active');
  await sleep(1100);

  async function showCard(html) {
    text.innerHTML = html;
    text.style.opacity = '1';
    await sleep(2200);
    text.style.opacity = '0';
    await sleep(580);
    text.innerHTML = '';
  }

  // Step 2 — date
  await showCard('September 3, 2022');

  // Step 3 — age / year
  await showCard('Age 14<br>Freshman Year');

  // Step 4 — story beat
  await showCard('Tomorrow is freshman hockey tryouts.');

  // Step 5 — reveal bedroom, fade overlay out
  showScreen('bedroom');
  overlay.classList.remove('is-active');
  await sleep(1100);
}

btnDeleteSave.addEventListener('click', () => {
  deleteCareerPreview();
});

playerForm.addEventListener('submit', handlePlayerFormSubmit);

document.querySelectorAll('.choice-card').forEach((button) => {
  button.addEventListener('click', () => {
    handleChoiceButton(button);
  });
});

// ── App initialization ──────────────────────────────────────
function init() {
  updateContinueButton();
  updateDevShortcut(); // DEV SHORTCUT — remove with dev shortcut
  showScreen('title');
}

document.addEventListener('DOMContentLoaded', init);