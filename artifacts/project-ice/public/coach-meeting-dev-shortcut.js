'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__coachMeetingDevShortcutInstalled === true) return;
  WorldEngine.__coachMeetingDevShortcutInstalled = true;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function currentDate() {
    return String(
      WorldEngine.state?.season?.currentDate ||
      WorldEngine.state?.currentDate ||
      WorldEngine.state?.player?.currentDate ||
      ''
    ).slice(0, 10);
  }

  async function loadAndOpenMeeting(button) {
    const baseShortcut = document.getElementById('btn-dev-hub');
    if (!baseShortcut) throw new Error('Sophomore dev shortcut button is unavailable.');

    button.disabled = true;
    const label = button.querySelector('.btn__label');
    const original = label?.textContent || 'Test Coach Meeting';
    if (label) label.textContent = 'Loading Coach Meeting…';

    try {
      baseShortcut.click();

      let loaded = false;
      for (let attempt = 0; attempt < 160; attempt += 1) {
        await sleep(100);
        const date = currentDate();
        if (/^2024-09-\d{2}$/.test(date) && WorldEngine.state?.season) {
          loaded = true;
          break;
        }
      }
      if (!loaded) throw new Error('Sophomore dev checkpoint did not finish loading in time.');

      WorldEngine.syncCoachMeetingCadence?.({ save: false });
      const result = WorldEngine.openCoachMeetingDiagnostic?.();
      if (!result?.success) {
        throw new Error(result?.reason || 'Could not open the Coach Meeting diagnostic.');
      }
    } finally {
      button.disabled = false;
      if (label) label.textContent = original;
    }
  }

  function install() {
    const area = document.querySelector('.dev-shortcut-area');
    if (!area || document.getElementById('btn-dev-coach-meeting')) return;

    const button = document.createElement('button');
    button.id = 'btn-dev-coach-meeting';
    button.type = 'button';
    button.className = 'btn btn--dev';
    button.innerHTML = '<span class="btn__label">Test Coach Meeting</span>';

    const hint = document.getElementById('dev-shortcut-hint');
    if (hint) area.insertBefore(button, hint);
    else area.appendChild(button);

    button.addEventListener('click', event => {
      event.preventDefault();
      loadAndOpenMeeting(button).catch(error => {
        console.error('[Project Ice] Coach Meeting diagnostic shortcut failed:', error);
        alert(`Coach Meeting diagnostic failed: ${error?.message || 'unknown error'}`);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
