'use strict';

(() => {
  const STYLE_ID = 'pi-postseason-polish-v1';
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /*
     * Project Ice postseason bracket polish.
     * Presentation only: no season, seed, series, or save logic lives here.
     */

    #pi-postseason-overlay .pi-po-bracket-head {
      margin-bottom: 14px;
    }

    #pi-postseason-overlay .pi-po-swipe {
      margin: 0 0 14px;
      color: #7d8ca2;
      font-size: 10px;
      line-height: 1.35;
      letter-spacing: .045em;
    }

    #pi-postseason-overlay .pi-po-bracket-scroll {
      position: relative;
      margin: 0 -18px;
      padding: 10px 18px 24px;
      overflow-x: auto;
      overflow-y: visible;
      scroll-padding-inline: 18px;
      scroll-snap-type: x proximity;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-x: contain;
    }

    #pi-postseason-overlay .pi-po-bracket-scroll::after {
      content: '';
      display: block;
      width: 1px;
      height: 1px;
      flex: 0 0 1px;
    }

    #pi-postseason-overlay .pi-po-bracket-grid {
      min-width: 850px;
      grid-template-columns: 232px 76px 232px 76px 232px;
      align-items: stretch;
    }

    #pi-postseason-overlay .pi-po-col {
      position: relative;
      min-height: 300px;
      gap: 0;
      scroll-snap-align: start;
    }

    #pi-postseason-overlay .pi-po-col-title {
      min-height: 26px;
      display: flex;
      align-items: center;
      color: #94a2b7;
      font-size: 10px;
      letter-spacing: .18em;
    }

    #pi-postseason-overlay .pi-po-col--round1,
    #pi-postseason-overlay .pi-po-col--semis {
      display: grid;
      grid-template-rows: 26px 1fr 1fr;
      row-gap: 22px;
    }

    #pi-postseason-overlay .pi-po-col--round1 .pi-po-match,
    #pi-postseason-overlay .pi-po-col--semis .pi-po-match {
      align-self: center;
    }

    #pi-postseason-overlay .pi-po-col--final {
      display: grid;
      grid-template-rows: 26px 1fr;
    }

    #pi-postseason-overlay .pi-po-final-slot {
      align-self: center;
    }

    #pi-postseason-overlay .pi-po-match {
      width: 100%;
      border-color: rgba(130, 157, 196, .16);
      background: linear-gradient(180deg, rgba(31, 42, 58, .92), rgba(22, 31, 44, .94));
      box-shadow: 0 14px 30px rgba(0, 0, 0, .18);
    }

    #pi-postseason-overlay .pi-po-row {
      min-height: 48px;
      padding: 0 12px;
    }

    #pi-postseason-overlay .pi-po-team-name {
      line-height: 1.18;
    }

    #pi-postseason-overlay .pi-po-row--career {
      position: relative;
      background: linear-gradient(90deg, rgba(52, 126, 236, .32), rgba(52, 126, 236, .11));
      box-shadow: inset 4px 0 0 #65a7ff;
    }

    #pi-postseason-overlay .pi-po-row--career::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      border: 1px solid rgba(101, 167, 255, .16);
    }

    #pi-postseason-overlay .pi-po-your-team {
      display: inline-block;
      margin-left: 6px;
      color: #94c4ff;
      font-size: 8px;
      letter-spacing: .11em;
      vertical-align: 1px;
    }

    /*
     * The first transition is intentionally shown as a reseed junction,
     * because Round One winners are re-ordered before semifinal matchups.
     */
    #pi-postseason-overlay .pi-po-connector {
      position: relative;
      min-height: 300px;
      background:
        linear-gradient(rgba(114, 145, 187, .35), rgba(114, 145, 187, .35)) 0 50% / 100% 1px no-repeat,
        linear-gradient(rgba(114, 145, 187, .35), rgba(114, 145, 187, .35)) 50% 27% / 1px 46% no-repeat;
    }

    #pi-postseason-overlay .pi-po-connector::before,
    #pi-postseason-overlay .pi-po-connector::after {
      content: '';
      position: absolute;
      height: 1px;
      background: rgba(114, 145, 187, .35);
    }

    #pi-postseason-overlay .pi-po-connector::before {
      left: 0;
      right: 50%;
      top: 27%;
    }

    #pi-postseason-overlay .pi-po-connector::after {
      left: 0;
      right: 50%;
      top: 73%;
      width: auto;
    }

    #pi-postseason-overlay .pi-po-connector--reseed {
      background:
        linear-gradient(rgba(114, 145, 187, .35), rgba(114, 145, 187, .35)) 0 27% / 50% 1px no-repeat,
        linear-gradient(rgba(114, 145, 187, .35), rgba(114, 145, 187, .35)) 0 73% / 50% 1px no-repeat,
        linear-gradient(rgba(114, 145, 187, .35), rgba(114, 145, 187, .35)) 50% 27% / 1px 46% no-repeat,
        linear-gradient(rgba(114, 145, 187, .35), rgba(114, 145, 187, .35)) 50% 50% / 50% 1px no-repeat;
    }

    #pi-postseason-overlay .pi-po-connector--reseed::before,
    #pi-postseason-overlay .pi-po-connector--reseed::after {
      display: none;
    }

    #pi-postseason-overlay .pi-po-reseed {
      z-index: 2;
      padding: 5px 7px;
      border-radius: 7px;
      border: 1px solid rgba(114, 145, 187, .22);
      background: #111a27;
      color: #8fa0b8;
      box-shadow: 0 5px 14px rgba(0, 0, 0, .28);
      font-size: 8px;
      letter-spacing: .12em;
    }

    #pi-postseason-overlay .pi-po-status {
      margin-top: 4px;
      padding: 13px 14px;
      border-color: rgba(88, 154, 247, .18);
      background: linear-gradient(180deg, rgba(49, 113, 205, .11), rgba(30, 71, 133, .08));
      line-height: 1.5;
    }

    @media (max-width: 430px) {
      #pi-postseason-overlay .pi-po-bracket-grid {
        min-width: 810px;
        grid-template-columns: 220px 72px 220px 72px 220px;
      }

      #pi-postseason-overlay .pi-po-col,
      #pi-postseason-overlay .pi-po-connector {
        min-height: 286px;
      }
    }
  `;

  document.head.appendChild(style);
})();
