(() => {
  'use strict';

  function applyViewportHeight() {
    const viewport = window.visualViewport;
    const height = viewport && Number.isFinite(viewport.height)
      ? viewport.height
      : window.innerHeight;
    const offsetTop = viewport && Number.isFinite(viewport.offsetTop)
      ? viewport.offsetTop
      : 0;
    const shellHeight = height + offsetTop;

    if (!Number.isFinite(shellHeight) || shellHeight <= 0) return;

    document.documentElement.style.setProperty(
      '--project-ice-viewport-height',
      Math.round(shellHeight) + 'px',
    );
  }

  applyViewportHeight();

  window.addEventListener('resize', applyViewportHeight, { passive: true });
  window.addEventListener('orientationchange', applyViewportHeight, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', applyViewportHeight, { passive: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) applyViewportHeight();
  });
})();
