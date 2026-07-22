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
    age: 14,
    careerStart: 2022,
  },
};

// ── Screen references ───────────────────────────────────────
const titleScreen      = document.getElementById('title-screen');
const creationScreen   = document.getElementById('creation-screen');
const summaryScreen    = document.getElementById('summary-screen');
const identityScreen   = document.getElementById('identity-screen');
const motivationScreen = document.getElementById('motivation-screen');
const archetypeScreen  = document.getElementById('archetype-screen');
const backgroundScreen = document.getElementById('background-screen');

// ── Button references ───────────────────────────────────────
const btnNewCareer = document.getElementById('btn-new-career');
const btnContinue = document.getElementById('btn-continue');
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
  motivationScreen.classList.add('screen--hidden');
  archetypeScreen.classList.add('screen--hidden');
  backgroundScreen.classList.add('screen--hidden');

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

function updateIdentityScreen() {
  updateIdentityBackground();
  updateIdentityArchetype();
  updateIdentityMotivation();

  const bgDone   = Boolean(Game.player.background);
  const archDone = Boolean(Game.player.archetype);
  const motivDone = Boolean(Game.player.motivation);

  setIdentityStatus(statusBackground, bgDone);
  setIdentityStatus(statusArchetype,  archDone);
  setIdentityStatus(statusMotivation, motivDone);
  setIdentityStatus(statusNhlTeam,    false);

  const count = [bgDone, archDone, motivDone].filter(Boolean).length;
  identityCompleteCount.textContent = count;

  const allDone = count === 4;
  btnContinueSetup.disabled = !allDone;
  btnContinueSetup.classList.toggle('btn--primary',    allDone);
  btnContinueSetup.classList.toggle('btn--secondary', !allDone);
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
      })
    );

    updateContinueButton();
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
  showScreen('title');
}

document.addEventListener('DOMContentLoaded', init);