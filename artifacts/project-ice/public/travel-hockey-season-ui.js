'use strict';

(() => {
  const canonicalId = 'pi-travel-canonical-ui-loader';
  if (document.getElementById(canonicalId)) return;

  const loadCanonical = () => {
    if (document.getElementById(canonicalId)) return;
    const script = document.createElement('script');
    script.id = canonicalId;
    script.src = '/travel-hockey-canonical-ui.js';
    document.head.appendChild(script);
  };

  const engineId = 'pi-travel-tournament-engine-loader';
  const existingEngine = document.getElementById(engineId);
  if (existingEngine) {
    if (existingEngine.dataset.loaded === 'true') loadCanonical();
    else existingEngine.addEventListener('load', loadCanonical, { once: true });
    return;
  }

  const engine = document.createElement('script');
  engine.id = engineId;
  engine.src = '/travel-hockey-tournament-engine.js';
  engine.addEventListener('load', () => {
    engine.dataset.loaded = 'true';
    loadCanonical();
  }, { once: true });
  document.head.appendChild(engine);
})();
