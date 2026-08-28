'use strict';

(() => {
  const viewport = document.querySelector('meta[name="viewport"]');

  if (!viewport) return;

  /*
   * Lock zoom at the viewport level only.
   *
   * Do not install touch, pointer, click, gesture, or touch-action handlers
   * here. Project Ice is an interactive full-screen app and those global
   * handlers can suppress normal iOS/Safari button activation inside the
   * Replit preview shell.
   */
  viewport.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover'
  );
})();
