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
    // ── Career progression ─────────────────────────────────────
    // stage: 'creation' | 'hub'
    //   'creation' → player is still in the intro sequence
    //   'hub'      → tryouts complete; save loads directly to Career Hub
    stage: 'creation',
    tryoutsComplete: false,
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
const standingsScreen      = document.getElementById('standings-screen');
const teamProfileScreen    = document.getElementById('team-profile-screen');
const prospectsScreen      = document.getElementById('prospects-screen');
const eventScreen          = document.getElementById('event-screen');
const tryoutSummaryScreen  = document.getElementById('tryout-summary-screen');
const coachIntroScreen     = document.getElementById('coach-intro-screen');
const skatingEvalScreen    = document.getElementById('skating-eval-screen');
const skatingResultsScreen = document.getElementById('skating-results-screen');

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

// ── Event System ─────────────────────────────────────────────
// One reusable event screen for every event type in the game.
//
// To add a new event:  add an entry to EVENT_CATALOG.
// To open an event:    EventSystem.openEvent('event-id', originScreen)
//
// EVENT_CATALOG fields:
//   title       — display name shown on the event screen
//   type        — category key → maps to CSS .ev-type--* class on #event-screen
//                 built-in types: practice | tryout | game | recovery | rest |
//                                 meeting | interview | ceremony
//   icon        — emoji shown in the hero block
//   location    — venue / facility name shown under the title
//   objective   — one-sentence player goal (shown in Objective section)
//   description — 1-3 sentence flavour text (shown in Description section)

const EventSystem = (() => {
  // ── Catalog ────────────────────────────────────────────────
  const EVENT_CATALOG = {
    'practice': {
      title:       'Practice',
      type:        'practice',
      icon:        '🏒',
      location:    'Summit Ice Center',
      objective:   'Work on skating edges and passing.',
      description: 'A full team practice session. The coaching staff will run you through drills and line rushes. Every rep is a chance to move up the depth chart.',
    },
    'tryout-freshman': {
      title:       'Freshman Tryouts',
      type:        'tryout',
      icon:        '🥅',
      location:    'Eastdale Ice Arena',
      objective:   'Impress the coaching staff.',
      description: 'Your first real chance to prove you belong. The coaches are watching every shift — your skating, your decisions, your compete level. Play your game.',
      // When the player presses Begin Event, route to the Coach Intro screen
      // which explains the drill before play begins.
      completeScreen: 'tryout-freshman-intro',
    },
    'recovery': {
      title:       'Recovery',
      type:        'recovery',
      icon:        '💪',
      location:    'Training Facility',
      objective:   'Rest and stay sharp.',
      description: 'Light conditioning and body work. Recovery days are how players stay healthy across a long season. Take it seriously.',
    },
    'practice-scrimmage': {
      title:       'Practice',
      type:        'practice',
      icon:        '🏒',
      location:    'Summit Ice Center',
      objective:   'Full team scrimmage session.',
      description: "Today's practice wraps up with a full-ice scrimmage. Play as if it's a real game — the coaches are tracking every line combination.",
    },
    'off-day': {
      title:       'Off Day',
      type:        'rest',
      icon:        '📅',
      location:    '—',
      objective:   'Rest and recover.',
      description: 'No scheduled team activities today. Use the time wisely — your body and mind both need the break.',
    },
    'exhibition-game': {
      title:       'Exhibition Game',
      type:        'game',
      icon:        '🥅',
      location:    'Eastdale Ice Arena',
      objective:   'Get game-ready. Show your best.',
      description: "The first live game action of the preseason. Results don't go on the record, but your performance absolutely does. The coaching staff is still setting lines.",
    },
    'recovery-sleep': {
      title:       'Recovery',
      type:        'recovery',
      icon:        '😴',
      location:    'Training Facility',
      objective:   'Rest and light conditioning.',
      description: 'End-of-week recovery session. Prioritise sleep and nutrition. The grind starts again next week.',
    },
    // ── Future event stubs (ready to flesh out) ──────────────
    // 'coach-meeting':   { title: 'Coach Meeting',    type: 'meeting',   icon: '📋', ... },
    // 'scout-interview': { title: 'Scout Interview',  type: 'interview', icon: '🔍', ... },
    // 'team-meeting':    { title: 'Team Meeting',     type: 'meeting',   icon: '📢', ... },
    // 'award-ceremony':  { title: 'Award Ceremony',   type: 'ceremony',  icon: '🏆', ... },
  };

  // ── Internal state ─────────────────────────────────────────
  let _origin     = 'hub';   // screen to return to when Back is pressed
  let _currentDef = null;    // definition of the event currently on screen

  // ── Helpers ────────────────────────────────────────────────
  function _set(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function _populate(def) {
    _currentDef = def;
    _set('ev-type-badge',  def.type.toUpperCase());
    _set('ev-icon',        def.icon);
    _set('ev-title',       def.title);
    _set('ev-location',    def.location);
    _set('ev-objective',   def.objective);
    _set('ev-description', def.description);

    // Swap the type colour class on the screen element
    const screen = document.getElementById('event-screen');
    if (screen) {
      screen.className = screen.className
        .replace(/\bev-type--\S+/g, '')
        .trim();
      screen.classList.add(`ev-type--${def.type}`);
    }

    // Reset the "coming soon" toast
    const toast = document.getElementById('ev-begin-toast');
    if (toast) toast.hidden = true;
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * Open the event screen for a given catalog entry.
   * @param {string} eventId   — key in EVENT_CATALOG
   * @param {string} [origin]  — screen name to return to on Back (default 'hub')
   */
  function openEvent(eventId, origin = 'hub') {
    const def = EVENT_CATALOG[eventId];
    if (!def) {
      console.warn(`EventSystem.openEvent: unknown event "${eventId}"`);
      return;
    }
    _origin = origin;
    _populate(def);
    showScreen('event');
  }

  /** Which screen Back should return to. */
  function getOrigin() { return _origin; }

  /** Returns the catalog definition of the event currently on screen. */
  function getCurrentDef() { return _currentDef; }

  return { openEvent, getOrigin, getCurrentDef, EVENT_CATALOG };
})();

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
  standingsScreen.classList.add('screen--hidden');
  teamProfileScreen.classList.add('screen--hidden');
  prospectsScreen.classList.add('screen--hidden');
  eventScreen.classList.add('screen--hidden');
  tryoutSummaryScreen.classList.add('screen--hidden');
  coachIntroScreen.classList.add('screen--hidden');
  skatingEvalScreen.classList.add('screen--hidden');
  skatingResultsScreen.classList.add('screen--hidden');

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
  if (screenName === 'standings') {
    standingsScreen.classList.remove('screen--hidden');
    renderStandingsScreen();
  }
  if (screenName === 'team-profile') {
    teamProfileScreen.classList.remove('screen--hidden');
    // Content already populated by openTeamProfile() before showScreen() is called
  }
  if (screenName === 'prospects') {
    prospectsScreen.classList.remove('screen--hidden');
    renderProspectsScreen();
  }
  if (screenName === 'event') {
    eventScreen.classList.remove('screen--hidden');
    // Content already populated by EventSystem.openEvent() before showScreen() is called
  }
  if (screenName === 'tryout-summary') {
    tryoutSummaryScreen.classList.remove('screen--hidden');
  }
  if (screenName === 'coach-intro') {
    coachIntroScreen.classList.remove('screen--hidden');
  }
  if (screenName === 'skating-eval') {
    skatingEvalScreen.classList.remove('screen--hidden');
  }
  if (screenName === 'skating-results') {
    skatingResultsScreen.classList.remove('screen--hidden');
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

    // ── Route based on career stage ───────────────────────────
    // 'hub' stage → tryouts are done; skip the intro sequence.
    if (Game.player.stage === 'hub') {
      showScreen('hub');
      return;
    }

    // Still in creation flow — restore form state and resume at summary.
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

document.getElementById('btn-take-ice').addEventListener('click', () => {
  // Launch the Freshman Tryouts event via the Event System.
  // EventSystem.openEvent handles the transition — no cinematic needed here,
  // the event screen is the player's gateway to the tryout.
  EventSystem.openEvent('tryout-freshman', 'arena');
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

// ── Team Profile ─────────────────────────────────────────────
// One reusable screen shared by both standings entry points.
// _teamProfileOrigin controls where the Back button returns to.

let _teamProfileOrigin = 'hub';  // 'hub' | 'standings'

/** Convert a numeric prestige (1-5) to a star string. */
function prestigeStars(n) {
  const filled = Math.max(0, Math.min(5, n));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

/**
 * Populate the team profile screen with data from WorldEngine.
 * Must be called before showScreen('team-profile').
 * @param {string} teamId
 */
function renderTeamProfile(teamId) {
  const team = WorldEngine.state.teams.find(t => t.teamId === teamId);
  if (!team) return;

  const gd     = team.goalsFor - team.goalsAgainst;
  const gdStr  = gd > 0 ? `+${gd}` : `${gd}`;
  const record = `${team.wins}-${team.losses}-${team.overtimeLosses}`;

  // Color bar halves
  const barPrimary   = document.getElementById('tp-color-bar-primary');
  const barSecondary = document.getElementById('tp-color-bar-secondary');
  if (barPrimary)   barPrimary.style.background   = team.primaryColor;
  if (barSecondary) barSecondary.style.background = team.secondaryColor;

  // Header
  const schoolEl = document.getElementById('tp-school-name');
  if (schoolEl) schoolEl.textContent = team.schoolName;

  // Hero
  const teamNameEl = document.getElementById('tp-team-name');
  if (teamNameEl) teamNameEl.textContent = team.teamName;

  const prestigeEl = document.getElementById('tp-prestige');
  if (prestigeEl) prestigeEl.textContent = prestigeStars(team.prestige);

  // Identity card — left border tinted to primary color
  const identityCard = document.getElementById('tp-identity-card');
  if (identityCard) identityCard.style.borderLeftColor = team.primaryColor;

  const identityEl = document.getElementById('tp-identity');
  if (identityEl) identityEl.textContent = team.identity;

  // Stat pills
  const recordEl = document.getElementById('tp-record');
  if (recordEl) recordEl.textContent = record;

  const ptsEl = document.getElementById('tp-pts');
  if (ptsEl) ptsEl.textContent = team.points;

  const gdEl = document.getElementById('tp-gd');
  if (gdEl) gdEl.textContent = gdStr;

  // Color chips
  const chipPrimary   = document.getElementById('tp-chip-primary');
  const chipSecondary = document.getElementById('tp-chip-secondary');
  if (chipPrimary)   chipPrimary.style.background   = team.primaryColor;
  if (chipSecondary) chipSecondary.style.background = team.secondaryColor;
}

/**
 * Open the team profile for the given teamId.
 * @param {string} teamId  - WorldEngine teamId
 * @param {'hub'|'standings'} origin - where Back should return to
 */
function openTeamProfile(teamId, origin) {
  _teamProfileOrigin = origin;
  renderTeamProfile(teamId);
  showScreen('team-profile');
}

// ── Top 100 Prospects ─────────────────────────────────────────
// Position groups and trend patterns cycle across 100 placeholder rows.
// Swap the loop body for WorldEngine.state.prospectRankings when real data exists.

const PR_POSITIONS = ['C','LW','RW','LD','RD','C','LW','RW','G','LD','RD','LW'];
const PR_TRENDS    = ['➖','🔼','➖','🔽','➖','🔼','➖','➖','🔽','🔼','➖','🔼'];

function posBadgeClass(pos) {
  if (pos === 'G')                  return 'pr-pos-badge--g';
  if (pos === 'LD' || pos === 'RD') return 'pr-pos-badge--def';
  return 'pr-pos-badge--fwd';
}

let prospectsReady = false;

function renderProspectsScreen() {
  if (prospectsReady) return;
  prospectsReady = true;

  const container = document.getElementById('pr-rows');
  if (!container) return;

  const rows = [];
  for (let rank = 1; rank <= 100; rank++) {
    const pos       = PR_POSITIONS[(rank - 1) % PR_POSITIONS.length];
    const trend     = PR_TRENDS[(rank - 1) % PR_TRENDS.length];
    const draftYear = rank <= 55 ? 2027 : 2028;
    const badgeCls  = posBadgeClass(pos);

    rows.push(`
      <div class="pr-row pr-row--data" role="listitem" data-rank="${rank}">
        <span class="pr-col pr-col--rank">${rank}</span>
        <span class="pr-col pr-col--name pr-name--placeholder">Prospect TBA</span>
        <span class="pr-col pr-col--pos">
          <span class="pr-pos-badge ${badgeCls}">${pos}</span>
        </span>
        <span class="pr-col pr-col--team">—</span>
        <span class="pr-col pr-col--league">—</span>
        <span class="pr-col pr-col--draft">${draftYear}</span>
        <span class="pr-col pr-col--trend">${trend}</span>
      </div>
    `);
  }
  container.innerHTML = rows.join('');
}


// ── Standings ────────────────────────────────────────────────
// Shared sort used by both the hub preview card and the full standings screen.
// Sort order: Points desc → Wins desc → Goal Differential desc.
function getSortedStandings() {
  return [...WorldEngine.state.teams].sort((a, b) => {
    if (b.points !== a.points)           return b.points - a.points;
    if (b.wins   !== a.wins)             return b.wins   - a.wins;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    return gdB - gdA;
  });
}

// Renders the top-4 preview inside the hub home tab standings card.
// Each data row carries data-team-id so click delegation can open the team profile.
function renderHubStandings() {
  const container = document.getElementById('hub-standings-preview');
  if (!container) return;

  const teams = getSortedStandings().slice(0, 4);

  // Keep the existing header row, replace everything after it
  const header = container.querySelector('.hub-standings__row--header');
  container.innerHTML = '';
  if (header) container.appendChild(header);

  teams.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'hub-standings__row hub-standings__row--clickable';
    row.dataset.teamId = t.teamId;
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.innerHTML = `
      <span class="hub-standings__pos">${i + 1}</span>
      <span class="hub-standings__team">${t.schoolName} ${t.teamName}</span>
      <span class="hub-standings__stat">${t.wins}</span>
      <span class="hub-standings__stat">${t.losses}</span>
      <span class="hub-standings__stat hub-standings__stat--pts">${t.points}</span>
    `;
    container.appendChild(row);
  });
}

// Renders all eight teams on the full standings screen.
// Each row carries data-team-id so click delegation can open the team profile.
function renderStandingsScreen() {
  const container = document.getElementById('sl-rows');
  if (!container) return;

  const teams = getSortedStandings();

  container.innerHTML = teams.map((t, i) => {
    const gd    = t.goalsFor - t.goalsAgainst;
    const gdStr = gd > 0 ? `+${gd}` : `${gd}`;
    const gdMod = gd > 0 ? ' sl-col--gd-pos' : gd < 0 ? ' sl-col--gd-neg' : '';
    const record = `${t.wins}-${t.losses}-${t.overtimeLosses}`;

    return `
      <div class="sl-row sl-row--clickable"
           role="button" tabindex="0"
           data-team-id="${t.teamId}">
        <span class="sl-col sl-col--rank">${i + 1}</span>
        <span class="sl-col sl-col--school">
          <span class="sl-school-name">${t.schoolName}</span>
          <span class="sl-team-name">${t.teamName}</span>
        </span>
        <span class="sl-col sl-col--record">${record}</span>
        <span class="sl-col sl-col--pts">${t.points}</span>
        <span class="sl-col sl-col--gd${gdMod}">${gdStr}</span>
      </div>
    `;
  }).join('');
}

// ── Career Hub ───────────────────────────────────────────────

// Tryout is on Sep 4 (the cinematic date). The player arrives at the hub
// after completing it, so it appears as the first calendar entry with
// isCompleted: true. Today (TUE 9/6) is the player's first live hub day.
const HUB_DAYS = [
  { day: 'SUN', date: '9/4',  fullDate: 'Sunday, September 4',    icon: '🎯', event: 'Freshman Tryouts', isToday: false, isCompleted: true,  location: 'Eastdale Ice Arena', objective: 'Impress the coaching staff.',         eventId: 'tryout-freshman',   summaryScreen: 'tryout-summary' },
  { day: 'MON', date: '9/5',  fullDate: 'Monday, September 5',    icon: '😴', event: 'Recovery',         isToday: false, isCompleted: false, location: 'Training Facility',  objective: 'Rest and recover.',                  eventId: 'recovery'                                                },
  { day: 'TUE', date: '9/6',  fullDate: 'Tuesday, September 6',   icon: '🏒', event: 'Practice',         isToday: true,  isCompleted: false, location: 'Summit Ice Center',  objective: 'Work on skating edges and passing.', eventId: 'practice'                                                },
  { day: 'WED', date: '9/7',  fullDate: 'Wednesday, September 7', icon: '🏒', event: 'Practice',         isToday: false, isCompleted: false, location: 'Summit Ice Center',  objective: 'Full team scrimmage session.',       eventId: 'practice-scrimmage'                                      },
  { day: 'THU', date: '9/8',  fullDate: 'Thursday, September 8',  icon: '📅', event: 'Off Day',          isToday: false, isCompleted: false, location: '—',                  objective: 'No scheduled activities. Rest up.', eventId: 'off-day'                                                 },
  { day: 'FRI', date: '9/9',  fullDate: 'Friday, September 9',    icon: '🥅', event: 'Exhibition Game',  isToday: false, isCompleted: false, location: 'Eastdale Ice Arena', objective: 'Get game-ready. Show your best.',   eventId: 'exhibition-game'                                         },
  { day: 'SAT', date: '9/10', fullDate: 'Saturday, September 10', icon: '😴', event: 'Recovery',         isToday: false, isCompleted: false, location: 'Training Facility',  objective: 'Rest and light conditioning.',       eventId: 'recovery-sleep'                                          },
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

  // ── Home tab – standings preview ─────────────────────────
  renderHubStandings();

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
  const strip     = document.getElementById('hub-cal-strip');
  const epIcon    = document.getElementById('hub-ep-icon');
  const epName    = document.getElementById('hub-ep-name');
  const epLoc     = document.getElementById('hub-ep-location');
  const epObj     = document.getElementById('hub-ep-objective');
  const epBtnLbl  = document.getElementById('hub-ep-btn-label');
  const epToast   = document.getElementById('hub-ep-toast');
  const epBtn     = document.getElementById('btn-hub-event');
  if (!strip) return;

  const TODAY_INDEX = HUB_DAYS.findIndex(d => d.isToday);

  // ── Build cards ───────────────────────────────────────────
  HUB_DAYS.forEach((d, i) => {
    const isToday     = i === TODAY_INDEX;
    const isFuture    = i > TODAY_INDEX;
    const isCompleted = Boolean(d.isCompleted);

    const card = document.createElement('div');
    card.className = [
      'hub-cal-card',
      isCompleted ? 'hub-cal-card--completed' : '',
      isToday     ? 'hub-cal-card--today'     : '',
      isFuture    ? 'hub-cal-card--future'    : '',
    ].filter(Boolean).join(' ');
    card.dataset.dayIndex = i;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    card.innerHTML = `
      <span class="hub-cal-card__day">${d.day}</span>
      <span class="hub-cal-card__date">${d.date}</span>
      ${isCompleted
        ? '<span class="hub-cal-card__check" aria-hidden="true">✓</span>'
        : `<span class="hub-cal-card__icon">${d.icon}</span>`
      }
      <span class="hub-cal-card__title">${d.event}</span>
      ${isCompleted ? '<span class="hub-cal-card__status-done" aria-hidden="true">Done</span>' : ''}
      ${isToday ? '<span class="hub-cal-card__dot" aria-hidden="true"></span>' : ''}
    `;

    strip.appendChild(card);
  });

  // ── Selection & event panel update ───────────────────────
  const cards = strip.querySelectorAll('.hub-cal-card');

  function selectDay(index) {
    cards.forEach(c => c.classList.remove('hub-cal-card--selected'));
    cards[index].classList.add('hub-cal-card--selected');

    const d           = HUB_DAYS[index];
    const isFuture    = index > TODAY_INDEX;
    const isCompleted = Boolean(d.isCompleted);

    if (epIcon) epIcon.textContent = isCompleted ? '✅' : d.icon;
    if (epName) epName.textContent = d.event;
    if (epLoc)  epLoc.textContent  = d.location;
    if (epObj)  epObj.textContent  = isCompleted ? 'This event has been completed.' : d.objective;

    if (epBtnLbl) {
      if (isCompleted)   epBtnLbl.textContent = 'View Summary';
      else if (isFuture) epBtnLbl.textContent = 'Simulate to Selected Day';
      else               epBtnLbl.textContent = 'Enter Event';
    }
    if (epToast) epToast.hidden = true;
  }

  cards.forEach((card, i) => {
    card.addEventListener('click', () => selectDay(i));
  });

  // ── Event panel button ────────────────────────────────────
  if (epBtn) {
    epBtn.addEventListener('click', () => {
      const selectedIndex = [...cards].findIndex(c => c.classList.contains('hub-cal-card--selected'));
      const d           = HUB_DAYS[selectedIndex];
      const isFuture    = selectedIndex > TODAY_INDEX;
      const isCompleted = Boolean(d.isCompleted);

      if (isCompleted) {
        // Open this event's result summary screen
        if (d.summaryScreen === 'tryout-summary') openTryoutSummary('history');
      } else if (isFuture) {
        // Simulation not yet built
        if (epToast) epToast.hidden = false;
      } else {
        // Enter the event via the Event System
        EventSystem.openEvent(d.eventId, 'hub');
      }
    });
  }

  // Scroll completed card into view, then settle on today
  const completedCard = strip.querySelector('.hub-cal-card--completed');
  if (completedCard) {
    completedCard.scrollIntoView({ behavior: 'instant', inline: 'start', block: 'nearest' });
  }
  selectDay(TODAY_INDEX);
}

// ── Standings screen navigation ──────────────────────────────
document.getElementById('btn-hub-standings-all').addEventListener('click', () => {
  showScreen('standings');
});

document.getElementById('btn-back-standings').addEventListener('click', () => {
  showScreen('hub');
});

// ── Team Profile navigation ───────────────────────────────────
// Event delegation — one listener per standings container.
// Any click on a row with data-team-id opens the team profile.

document.getElementById('hub-standings-preview').addEventListener('click', e => {
  const row = e.target.closest('[data-team-id]');
  if (!row) return;
  openTeamProfile(row.dataset.teamId, 'hub');
});

document.getElementById('sl-rows').addEventListener('click', e => {
  const row = e.target.closest('[data-team-id]');
  if (!row) return;
  openTeamProfile(row.dataset.teamId, 'standings');
});

document.getElementById('btn-back-team-profile').addEventListener('click', () => {
  showScreen(_teamProfileOrigin === 'standings' ? 'standings' : 'hub');
});

// Roster row tap highlight — one delegated listener on the roster container.
// Adds .is-tapped for a brief flash; no navigation yet.
document.getElementById('tp-roster').addEventListener('click', e => {
  const row = e.target.closest('.tp-roster-row');
  if (!row) return;
  row.classList.add('is-tapped');
  setTimeout(() => row.classList.remove('is-tapped'), 220);
});

// ── Top 100 Prospects navigation ──────────────────────────────

// Hub card → open prospects screen
document.getElementById('hub-prospects-card').addEventListener('click', () => {
  showScreen('prospects');
});

// Back button → return to hub
document.getElementById('btn-back-prospects').addEventListener('click', () => {
  showScreen('hub');
});

// Row tap → brief flash + show toast
(function () {
  let toastTimer = null;

  document.getElementById('pr-rows').addEventListener('click', e => {
    const row = e.target.closest('.pr-row--data');
    if (!row) return;

    // Brief row highlight
    row.classList.add('is-tapped');
    setTimeout(() => row.classList.remove('is-tapped'), 200);

    // Show/re-show toast with fade-out
    const toast = document.getElementById('pr-toast');
    if (!toast) return;
    if (toastTimer) clearTimeout(toastTimer);
    toast.classList.remove('is-fading');
    toast.hidden = false;
    toastTimer = setTimeout(() => {
      toast.classList.add('is-fading');
      setTimeout(() => { toast.hidden = true; toast.classList.remove('is-fading'); }, 320);
    }, 2200);
  });
})();

// ── Event screen navigation ───────────────────────────────────

// Back — returns to whichever screen opened this event
document.getElementById('btn-back-event').addEventListener('click', () => {
  showScreen(EventSystem.getOrigin());
});

// ── Tryout Summary helpers ────────────────────────────────────
// context 'first-time' = player just finished tryouts for the first time.
// context 'history'    = player reviewing from the hub calendar.

let _tryoutSummaryContext = 'history';

function openTryoutSummary(context) {
  _tryoutSummaryContext = context;
  // Show the "Enter Career Hub" CTA only on first completion
  const ctaEl = document.getElementById('ts-cta-hub');
  if (ctaEl) ctaEl.hidden = context !== 'first-time';
  showScreen('tryout-summary');
}

// Maps EVENT_CATALOG completeScreen keys → their handler functions.
// Add new entries here as more event types receive completion screens.
const COMPLETE_SCREENS = {
  // 'tryout-freshman-intro' → open the Skating drill (Drill 1); DrillEngine populates coach-intro
  'tryout-freshman-intro': () => SkatingDrill.open(),
  // 'tryout-summary' → open the tryout summary (used by results "Continue")
  'tryout-summary':        () => openTryoutSummary('first-time'),
};

// Begin Event — if the event defines a completeScreen, navigate there.
// Otherwise show the "gameplay coming soon" toast.
document.getElementById('btn-ev-begin').addEventListener('click', () => {
  const def = EventSystem.getCurrentDef();
  if (def && def.completeScreen && COMPLETE_SCREENS[def.completeScreen]) {
    COMPLETE_SCREENS[def.completeScreen]();
  } else {
    const toast = document.getElementById('ev-begin-toast');
    if (toast) toast.hidden = false;
  }
});

// ── Tryout Summary navigation ─────────────────────────────────

// Back: first-time → return to event screen (arena); history → return to hub
// ════════════════════════════════════════════════════════════════
// DRILL ENGINE
// Generic factory for tryout evaluation drills.
// DrillEngine(config) returns { open, beginDrill }:
//   open()       — populates the shared coach-intro screen and shows it.
//   beginDrill() — resets state, renders the first decision, shows skating-eval.
// ════════════════════════════════════════════════════════════════

// Tracks the active drill's completion handler so btn-sr-continue knows where to route.
let _drillContinueCallback = null;

const DrillEngine = (function () {

  // ── Shared helpers (one copy for all drill instances) ──────
  const NPC_POOL = [
    'Ethan Brooks',  'Mason Carter', 'Luke Jensen',  'Jake Murray',
    'Cody Park',     'Tyler Voss',   'Brandon Lee',  'Connor Walsh',
    'Dylan Shaw',    'Nate Rourke',  'Austin Reid',  'Hunter Cole',
  ];

  function _roll([min, max]) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function _letterGrade(s) {
    if (s >= 97) return 'A+';
    if (s >= 93) return 'A';
    if (s >= 90) return 'A\u2212';
    if (s >= 87) return 'B+';
    if (s >= 83) return 'B';
    if (s >= 80) return 'B\u2212';
    if (s >= 77) return 'C+';
    if (s >= 73) return 'C';
    if (s >= 70) return 'C\u2212';
    if (s >= 67) return 'D+';
    if (s >= 63) return 'D';
    if (s >= 60) return 'D\u2212';
    return 'F';
  }

  function _generateNpcs(playerScore) {
    const names = [...NPC_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
    return names.map(name => {
      const delta = Math.floor(Math.random() * 14) - 6; // -6 to +7
      const score = Math.max(52, Math.min(99, playerScore + delta));
      return { name, score };
    });
  }

  // ── Per-instance factory ───────────────────────────────────
  // config shape:
  //   evalNumber    {number}    e.g. 1
  //   evalTotal     {number}    e.g. 3
  //   evalName      {string}    e.g. 'Skating'
  //   evalIcon      {string}    e.g. '⛸️'
  //   coachSpeech   {string}    quoted text shown on intro screen
  //   traits        {string[]}  pills shown below the speech
  //   decisions     {Array}     3 decision objects (prompt + choices)
  //   coachFeedback {Function}  (score:number) => string
  //   onComplete    {Function}  called when the player presses Continue on results
  function create(config) {

    let _state = {};

    function _resetState() {
      _state = {
        decisionIndex:  0,
        decisionScores: [],
        totalScore:     0,
        grade:          '',
        feedback:       '',
        npcResults:     [],
      };
    }

    function _el(id) { return document.getElementById(id); }

    // Populate shared coach-intro screen elements with this drill's data
    function _populateCoachIntro() {
      const tag      = _el('ci-eval-tag');
      const icon     = _el('ci-eval-icon');
      const title    = _el('ci-eval-title');
      const speech   = _el('ci-speech-text');
      const traitsEl = _el('ci-traits');
      const btnLabel = _el('ci-begin-btn-label');

      if (tag)      tag.textContent      = `EVALUATION ${config.evalNumber} OF ${config.evalTotal}`;
      if (icon)     icon.textContent     = config.evalIcon;
      if (title)    title.textContent    = config.evalName;
      if (speech)   speech.textContent   = config.coachSpeech;
      if (btnLabel) btnLabel.textContent = `Begin ${config.evalName} Evaluation`;
      if (traitsEl) {
        traitsEl.innerHTML = config.traits
          .map(t => `<span class="ci-trait">${t}</span>`)
          .join('');
      }
    }

    function _renderDecision() {
      const dec   = config.decisions[_state.decisionIndex];
      const total = config.decisions.length;
      const idx   = _state.decisionIndex;

      const fill = _el('se-progress-fill');
      if (fill) fill.style.width = `${((idx + 1) / total) * 100}%`;
      const lbl = _el('se-progress-label');
      if (lbl)  lbl.textContent = `${idx + 1} / ${total}`;

      const sitEl = _el('se-situation-text');
      if (sitEl) sitEl.textContent = dec.prompt;

      const choicesEl = _el('se-choices');
      if (choicesEl) {
        choicesEl.innerHTML = dec.choices.map((c, ci) => `
          <button class="se-choice-btn" data-choice="${ci}">
            <div class="se-choice-btn__text-wrap">
              <span class="se-choice-btn__label">${c.label}</span>
              <span class="se-choice-btn__desc">${c.desc}</span>
            </div>
            <span class="se-choice-btn__arrow">\u203a</span>
          </button>
        `).join('');

        choicesEl.querySelectorAll('.se-choice-btn').forEach(btn => {
          btn.addEventListener('click', () => _onChoiceSelected(parseInt(btn.dataset.choice, 10)));
        });
      }

      const outcomeEl = _el('se-outcome');
      if (outcomeEl) outcomeEl.hidden = true;
    }

    function _onChoiceSelected(ci) {
      const dec    = config.decisions[_state.decisionIndex];
      const choice = dec.choices[ci];
      const score  = _roll(choice.range);

      _state.decisionScores.push(score);

      document.querySelectorAll('.se-choice-btn').forEach((btn, bi) => {
        btn.disabled = true;
        if (bi === ci) btn.classList.add('is-selected');
        else           btn.classList.add('is-dimmed');
      });

      const outcomeEl    = _el('se-outcome');
      const outcomeScore = _el('se-outcome-score');
      const outcomeText  = _el('se-outcome-text');
      if (outcomeEl)    outcomeEl.hidden = false;
      if (outcomeScore) outcomeScore.textContent = `+${score}`;
      if (outcomeText)  outcomeText.textContent  = choice.outcome;

      _state.decisionIndex++;
      const isLast = _state.decisionIndex >= config.decisions.length;
      setTimeout(() => {
        if (isLast) _finalize();
        else        _transitionNext();
      }, isLast ? 1500 : 1200);
    }

    function _transitionNext() {
      const content = _el('se-content');
      if (!content) { _renderDecision(); return; }
      content.classList.add('is-fading');
      setTimeout(() => {
        _renderDecision();
        content.classList.remove('is-fading');
      }, 260);
    }

    function _finalize() {
      const rawSum = _state.decisionScores.reduce((a, b) => a + b, 0);
      const score  = Math.min(100, rawSum);

      _state.totalScore = score;
      _state.grade      = _letterGrade(score);
      _state.feedback   = config.coachFeedback(score);
      _state.npcResults = _generateNpcs(score);

      _renderResults();
      showScreen('skating-results');
    }

    function _renderResults() {
      const { totalScore: score, grade, feedback, npcResults } = _state;

      // Update header badge with this drill's icon and name
      const badgeEl = _el('sr-header-badge');
      if (badgeEl) badgeEl.textContent = `${config.evalIcon} ${config.evalName} Evaluation`;

      // Score count-up animation
      const scoreEl = _el('sr-score-num');
      if (scoreEl) {
        scoreEl.textContent = '0';
        const dur = 1300;
        const t0  = performance.now();
        function tick(now) {
          const elapsed = Math.min((now - t0) / dur, 1);
          const ease    = 1 - Math.pow(1 - elapsed, 3); // ease-out cubic
          scoreEl.textContent = Math.round(ease * score);
          if (elapsed < 1) requestAnimationFrame(tick);
          else scoreEl.textContent = score;
        }
        requestAnimationFrame(tick);
      }

      const gradeEl = _el('sr-grade');
      if (gradeEl) {
        gradeEl.textContent = grade;
        gradeEl.className   = 'sr-grade';
        gradeEl.classList.add(`sr-grade--${grade[0].toLowerCase()}`);
      }

      const feedEl = _el('sr-feedback');
      if (feedEl) feedEl.textContent = feedback;

      const playerName = [Game.player.firstName, Game.player.lastName]
        .filter(Boolean).join(' ') || 'You';

      const allSkaters = [
        { name: playerName, score, isPlayer: true },
        ...npcResults,
      ].sort((a, b) => b.score - a.score);

      const boardEl = _el('sr-leaderboard');
      if (boardEl) {
        boardEl.innerHTML = allSkaters.map((s, i) => `
          <div class="sr-board-row${s.isPlayer ? ' sr-board-row--player' : ''}">
            <span class="sr-board-rank">${i + 1}</span>
            <div class="sr-board-name-wrap">
              <span class="sr-board-name">${s.name}</span>
              ${s.isPlayer ? '<span class="sr-board-you-tag">YOU</span>' : ''}
            </div>
            <span class="sr-board-score">${s.score}</span>
          </div>
        `).join('');
      }

      // Register this drill's completion route for btn-sr-continue
      _drillContinueCallback = config.onComplete;
    }

    // open(): populate coach-intro and navigate to it
    function open() {
      _populateCoachIntro();
      showScreen('coach-intro');
    }

    // beginDrill(): called from the "Begin … Evaluation" button on coach-intro
    function beginDrill() {
      _resetState();
      _renderDecision();
      showScreen('skating-eval');
    }

    return { open, beginDrill };
  }

  return create;
})();

// ── Skating Evaluation (Drill 1 of 3) ────────────────────────────

const SkatingDrill = DrillEngine({
  evalNumber:  1,
  evalTotal:   3,
  evalName:    'Skating',
  evalIcon:    '⛸️',
  coachSpeech: '"Today we\'re evaluating your skating ability. Speed, acceleration, and agility all matter. Give us your best effort."',
  traits: ['⚡ Speed', '💨 Acceleration', '🔄 Agility'],
  decisions: [
    {
      prompt: 'Coach blows the whistle. Skaters line up at the blue line. The first sprint is about to begin. How do you approach it?',
      choices: [
        { label: 'Explode off the line',       desc: 'Max acceleration from the first stride.',    range: [26, 34], outcome: 'You rocket off the line. Clean first stride, full extension. The coaches clock your burst.' },
        { label: 'Build your speed gradually', desc: 'Controlled start — find your stride early.', range: [22, 28], outcome: 'Smooth build. Your stride lengthens through mid-ice. Consistent and efficient.' },
        { label: 'Watch the pack first',       desc: 'Read how the other skaters set up.',         range: [13, 21], outcome: 'A half-beat of hesitation. You find your stride late. Coach Reynolds makes a note.' },
      ],
    },
    {
      prompt: 'You hit the first hard corner at full speed. A tight turn — every edge counts here.',
      choices: [
        { label: 'Drive the inside edge hard', desc: 'Aggressive carve — carry all your speed through the turn.', range: [25, 33], outcome: 'Sharp carve through the arc. You hold your speed. Heads turn on the bench.' },
        { label: 'Balanced edge, clean cut',   desc: 'Technique over aggression — efficient and controlled.',     range: [22, 28], outcome: 'Textbook turn. Clean edges, controlled speed. The coaches see solid fundamentals.' },
        { label: 'Wide arc to carry momentum', desc: 'Give yourself room to stay fast through the corner.',       range: [17, 25], outcome: 'You carry decent speed but the arc is loose. Not as tight as the coaches want.' },
      ],
    },
    {
      prompt: 'Final straight. Twenty feet to the finish cone. The coaching staff is watching your compete level.',
      choices: [
        { label: 'Dig deep — leave nothing behind', desc: 'Max effort all the way through the line.',  range: [26, 34], outcome: "Full gas to the line. Legs burning. You don't ease up an inch. Compete noted." },
        { label: 'Hold your stride',                desc: 'Efficient and controlled — finish strong.', range: [22, 28], outcome: 'Steady to the line. Efficient, repeatable. You look like you have more in the tank.' },
        { label: 'Ease into the finish',            desc: 'Save energy for the next drill.',           range: [11, 19], outcome: 'You coast the last few strides. Coach Reynolds stops writing.' },
      ],
    },
  ],
  coachFeedback(score) {
    if (score >= 90) return 'Outstanding skating. Your acceleration and edge work stood out from the group. Coach Reynolds circled your name.';
    if (score >= 80) return 'Good evaluation. Above-average speed with solid technique through the corners. You belong on this ice.';
    if (score >= 70) return 'Decent showing. A few breakdowns in the turns, but your compete level came through.';
    if (score >= 60) return 'Average result. Work on your edge transitions — the raw speed is there, but technique needs to catch up.';
    return 'Tough eval today. Skating is the foundation of everything at this level. Keep putting in the reps.';
  },
  onComplete: () => PuckControlDrill.open(),
});

// ── Puck Control Evaluation (Drill 2 of 3) ───────────────────────

const PuckControlDrill = DrillEngine({
  evalNumber:  2,
  evalTotal:   3,
  evalName:    'Puck Control',
  evalIcon:    '🏒',
  coachSpeech: '"This evaluation is about your hands. We want to see your stickhandling under pressure, your passing accuracy, and how well you protect the puck in tight space."',
  traits: ['🏒 Stickhandling', '🎯 Passing', '💪 Puck Protection'],
  decisions: [
    {
      prompt: 'Coach sets up a tight stickhandling course through four cones at mid-ice. How do you attack it?',
      choices: [
        { label: 'Attack the course, full speed',     desc: 'Stickhandle through the cones as fast as possible.', range: [25, 34], outcome: 'Hands are fast and tight. You navigate the cones clean. Scouts watching make a note.' },
        { label: 'Controlled speed, precise hands',   desc: 'Take your time — clean hands over speed.',            range: [22, 28], outcome: 'Efficient. Your hands work in rhythm. No mistakes. Coach nods.' },
        { label: 'Stay on the outside of the cones', desc: 'Play it safe, stay wide.',                             range: [13, 21], outcome: 'You avoid the challenge. The course is wide open. Coach writes something down.' },
      ],
    },
    {
      prompt: 'A coach stands at the far blue line. You have three seconds to make a decision — pass or carry.',
      choices: [
        { label: 'Lead pass — thread the needle',    desc: 'Fire a crisp pass to the exact spot.',  range: [24, 33], outcome: 'Perfect lead pass. Tape to tape. The coach catches it without breaking stride.' },
        { label: 'Safe chip pass — flat and direct', desc: 'Straightforward pass, easy to handle.', range: [21, 27], outcome: 'Solid, clean pass. Safe and accurate. Gets the job done.' },
        { label: 'Carry it yourself',                desc: 'Decide to keep the puck and skate.',    range: [15, 23], outcome: 'You keep it, but a pass was clearly open. Coach marks your decision-making.' },
      ],
    },
    {
      prompt: 'A defensive player applies pressure from behind. You\'re battling for puck control along the boards.',
      choices: [
        { label: 'Shield the puck with your body',    desc: 'Use your frame to protect possession.',      range: [25, 33], outcome: 'Strong puck protection. You win the battle, keep possession, and make a clean exit.' },
        { label: 'Quick spin move to create space',   desc: 'Beat the pressure with footwork and hands.', range: [23, 32], outcome: 'Nice spin. You create space and exit cleanly. Coaches react with interest.' },
        { label: 'Try to skate through the pressure', desc: 'Test your speed against the defender.',      range: [14, 24], outcome: 'You fight but lose the battle. Possession gone. Tough spot.' },
      ],
    },
  ],
  coachFeedback(score) {
    if (score >= 90) return "Elite hands. Your stickhandling and puck protection under pressure were the best we've seen today. You belong in this league.";
    if (score >= 80) return 'Good puck control. Accurate passing, solid hands through traffic. You showed you can handle the puck at this level.';
    if (score >= 70) return 'Decent showing with the puck. Some good moments, but the tight-space stickhandling needs more work.';
    if (score >= 60) return 'Average result. Puck control separates players at this level — keep working your hands every day.';
    return 'Struggled to control the puck today. Touch and feel come with repetition — get your stickhandling reps in.';
  },
  onComplete: () => openTryoutSummary('first-time'),
});


document.getElementById('btn-back-tryout-summary').addEventListener('click', () => {
  if (_tryoutSummaryContext === 'first-time') {
    showScreen(EventSystem.getOrigin()); // 'arena' — so they can re-read the event
  } else {
    showScreen('hub');
  }
});

// Enter Career Hub — only visible on first completion.
// Marks stage='hub' so future save loads skip the intro sequence.
document.getElementById('btn-ts-enter-hub').addEventListener('click', () => {
  Game.player.stage          = 'hub';
  Game.player.tryoutsComplete = true;
  saveCareerPreview();
  showScreen('hub');
});

// ── Coach Intro navigation ────────────────────────────────────────
document.getElementById('btn-back-coach-intro').addEventListener('click', () => {
  // Return to the event screen so the player can re-read the tryout brief
  showScreen('event');
});

document.getElementById('btn-begin-skating').addEventListener('click', () => {
  SkatingDrill.beginDrill();
});

// ── Skating Results navigation ────────────────────────────────────
document.getElementById('btn-sr-continue').addEventListener('click', () => {
  // Routes to the next drill or the tryout summary, depending on which drill just finished.
  if (_drillContinueCallback) _drillContinueCallback();
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