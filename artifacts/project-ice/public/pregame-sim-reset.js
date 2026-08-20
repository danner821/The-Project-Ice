'use strict';

/* global openPregameMatchup */

(() => {
  if (typeof openPregameMatchup !== 'function') return;

  const originalOpenPregameMatchup = openPregameMatchup;

  function resetSimButton() {
    const button = document.getElementById('btn-pregame-sim');
    if (!button) return;

    button.disabled = false;
    button.removeAttribute('aria-busy');
    delete button.dataset.originalLabel;

    const label = button.querySelector('.btn__label');
    if (label) {
      label.textContent = 'Sim Game';
    } else {
      button.textContent = 'Sim Game';
    }
  }

  openPregameMatchup = function(eventDefinition) {
    resetSimButton();
    const result = originalOpenPregameMatchup(eventDefinition);

    if (result !== false) {
      resetSimButton();
    }

    return result;
  };
})();
