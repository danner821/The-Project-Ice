'use strict';

(() => {
  const STYLE_ID = 'pi-high-school-tryout-polish';
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #pi-hs-tryouts-screen .pi-hst-feedback {
      margin-top: 14px;
      padding: 13px 14px;
      border-radius: 15px;
      border: 1px solid rgba(111,177,255,.14);
      background: rgba(37,81,143,.09);
    }

    #pi-hs-tryouts-screen .pi-hst-feedback strong {
      display: block;
      font-size: 13px;
      line-height: 1.35;
      color: #f6f9ff;
    }

    #pi-hs-tryouts-screen .pi-hst-feedback p {
      margin: 8px 0 0;
      color: #9fc7ff;
      font-size: 11px;
      line-height: 1.45;
      font-weight: 900;
    }

    #pi-hs-tryouts-screen .pi-hst-meter {
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.015);
    }

    #pi-hs-tryouts-screen .pi-hst-zone {
      box-shadow: 0 0 18px rgba(91,188,134,.22);
    }

    #pi-hs-tryouts-screen .pi-hst-cursor {
      box-shadow: 0 0 10px rgba(255,255,255,.8);
    }

    #pi-hs-tryouts-screen .pi-hst-execute {
      background: rgba(40,101,190,.20);
    }
  `;

  document.head.appendChild(style);
})();
