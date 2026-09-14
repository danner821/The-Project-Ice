'use strict';

(() => {
  const STYLE_ID = 'pi-player-awards-existing-style';
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #pp-awards-list,
    #player-profile-awards-list {
      display: grid;
      gap: 10px;
      margin-top: 16px;
    }

    #pp-awards-list > :not(.pp-awards-empty),
    #player-profile-awards-list > :not(.pp-awards-empty) {
      position: relative;
      margin: 0;
      padding: 14px 16px 14px 18px;
      border: 1px solid rgba(221, 178, 78, 0.28);
      border-radius: 16px;
      background:
        linear-gradient(145deg, rgba(48, 38, 20, 0.28), rgba(7, 25, 49, 0.92) 62%);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.035),
        0 8px 24px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    #pp-awards-list > :not(.pp-awards-empty)::before,
    #player-profile-awards-list > :not(.pp-awards-empty)::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 3px;
      background: linear-gradient(180deg, #efca69, #a97824);
      opacity: 0.92;
    }

    #pp-awards-list > :not(.pp-awards-empty) strong,
    #player-profile-awards-list > :not(.pp-awards-empty) strong {
      color: #f3f7ff;
    }

    #pp-awards-list > :not(.pp-awards-empty),
    #pp-awards-list > :not(.pp-awards-empty) span,
    #player-profile-awards-list > :not(.pp-awards-empty),
    #player-profile-awards-list > :not(.pp-awards-empty) span {
      line-height: 1.35;
    }
  `;

  document.head.appendChild(style);
})();
