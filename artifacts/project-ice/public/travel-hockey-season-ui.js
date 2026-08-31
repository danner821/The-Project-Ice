'use strict';

(() => {
  const id = 'pi-travel-canonical-ui-loader';
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.src = '/travel-hockey-canonical-ui.js';
  document.head.appendChild(script);
})();
