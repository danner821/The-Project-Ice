'use strict';

(() => {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }

  document.documentElement.style.touchAction = 'manipulation';
  document.body.style.touchAction = 'manipulation';

  const block = event => event.preventDefault();
  document.addEventListener('gesturestart', block, { passive: false });
  document.addEventListener('gesturechange', block, { passive: false });
  document.addEventListener('gestureend', block, { passive: false });
  document.addEventListener('dblclick', block, { passive: false });

  let lastTouchEnd = 0;
  document.addEventListener('touchend', event => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) event.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
})();