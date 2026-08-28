'use strict';

(() => {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }

  // `touch-action: manipulation` removes browser double-tap zoom without
  // cancelling ordinary tap/click events. The viewport lock handles pinch zoom.
  document.documentElement.style.touchAction = 'manipulation';
  if (document.body) document.body.style.touchAction = 'manipulation';

  // Safari still exposes proprietary gesture events in some contexts. Block
  // only those zoom gestures; never prevent normal touchend/click events.
  const blockGesture = event => event.preventDefault();
  document.addEventListener('gesturestart', blockGesture, { passive: false });
  document.addEventListener('gesturechange', blockGesture, { passive: false });
  document.addEventListener('gestureend', blockGesture, { passive: false });
})();
