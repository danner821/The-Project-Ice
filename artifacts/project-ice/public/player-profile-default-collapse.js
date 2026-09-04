'use strict';

(() => {
  const collapse = () => {
    document.querySelectorAll('#player-profile-screen .pp-attr-cat').forEach(card => {
      card.classList.remove('pp-attr-cat--open');
    });
  };

  const baseShowScreen = globalThis.showScreen;
  if (typeof baseShowScreen === 'function') {
    globalThis.showScreen = function(screenId, ...args) {
      const result = baseShowScreen(screenId, ...args);
      if (String(screenId || '') === 'player-profile') requestAnimationFrame(collapse);
      return result;
    };
  }

  const baseRenderPlayerProfile = globalThis.renderPlayerProfile;
  if (typeof baseRenderPlayerProfile === 'function') {
    globalThis.renderPlayerProfile = function(...args) {
      const result = baseRenderPlayerProfile(...args);
      requestAnimationFrame(collapse);
      return result;
    };
  }
})();
