'use strict';

/* global WorldEngine, openHubTab, refreshCareerUI */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const ROOT_ID = 'pi-postseason-overlay';
  const STYLE_ID = 'pi-postseason-styles';
  let visibleStage = null;

  function dateKey(value) {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  }

  function currentDate() {
    const world = WorldEngine.state || {};
    return dateKey(
      world?.season?.currentDate ||
      world?.player?.currentDate ||
      world?.currentDate
    );
  }

  function postseason() {
    return WorldEngine.getHighSchoolPostseason?.() ||
      WorldEngine.state?.postseason?.highSchool ||
      null;
  }

  function teamName(teamId) {
    const team = (WorldEngine.state?.teams || []).find(item =>
      String(item?.teamId || '') === String(teamId || '')
    );
    return team
      ? `${team.schoolName || ''} ${team.teamName || ''}`.trim()
      : 'TBD';
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID} {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background:
          radial-gradient(circle at 50% -10%, rgba(65, 141, 255, .25), transparent 38%),
          linear-gradient(180deg, #101723 0%, #0d131e 52%, #090e16 100%);
        color: #f5f8ff;
        font-family: inherit;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      #${ROOT_ID}[hidden] { display: none !important; }
      .pi-po-shell {
        min-height: 100%;
        box-sizing: border-box;
        padding: max(28px, env(safe-area-inset-top)) 18px max(26px, env(safe-area-inset-bottom));
        display: flex;
        flex-direction: column;
      }
      .pi-po-eyebrow {
        margin: 4px 0 8px;
        font-size: 11px;
        line-height: 1;
        letter-spacing: .22em;
        text-transform: uppercase;
        font-weight: 800;
        color: #83b7ff;
      }
      .pi-po-title {
        margin: 0;
        font-size: clamp(32px, 10vw, 46px);
        line-height: .98;
        letter-spacing: -.045em;
        font-weight: 900;
      }
      .pi-po-subtitle {
        margin: 14px 0 0;
        color: #aab6c8;
        font-size: 14px;
        line-height: 1.55;
      }
      .pi-po-hero {
        margin-top: 28px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 24px;
        padding: 22px 18px;
        background: rgba(255,255,255,.045);
        box-shadow: 0 22px 50px rgba(0,0,0,.26);
        position: relative;
        overflow: hidden;
      }
      .pi-po-hero::after {
        content: '';
        position: absolute;
        right: -44px;
        top: -48px;
        width: 160px;
        height: 160px;
        border: 24px solid rgba(88,157,255,.08);
        border-radius: 50%;
      }
      .pi-po-kicker {
        color: #7aaeff;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .16em;
        text-transform: uppercase;
      }
      .pi-po-hero h2 {
        margin: 8px 0 8px;
        font-size: 24px;
        line-height: 1.08;
        letter-spacing: -.03em;
      }
      .pi-po-hero p {
        position: relative;
        z-index: 1;
        margin: 0;
        color: #b7c1d0;
        font-size: 14px;
        line-height: 1.55;
      }
      .pi-po-meta {
        margin-top: 16px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .pi-po-meta-card {
        border-radius: 15px;
        padding: 12px;
        background: rgba(4,9,16,.34);
        border: 1px solid rgba(255,255,255,.07);
      }
      .pi-po-meta-card span {
        display: block;
        color: #7f8ca0;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .1em;
        text-transform: uppercase;
      }
      .pi-po-meta-card strong {
        display: block;
        margin-top: 5px;
        font-size: 14px;
      }
      .pi-po-button {
        width: 100%;
        border: 0;
        border-radius: 17px;
        padding: 16px 18px;
        font: inherit;
        font-size: 15px;
        font-weight: 850;
        letter-spacing: -.01em;
        color: white;
        background: linear-gradient(135deg, #2f79e8, #1859ba);
        box-shadow: 0 12px 26px rgba(20,91,192,.28);
      }
      .pi-po-button:active { transform: scale(.985); }
      .pi-po-footer { margin-top: auto; padding-top: 24px; }
      .pi-po-bracket-head {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 17px;
      }
      .pi-po-bracket-head h2 {
        margin: 0;
        font-size: 27px;
        letter-spacing: -.035em;
      }
      .pi-po-bracket-head span {
        color: #7f8da2;
        font-size: 11px;
        text-align: right;
      }
      .pi-po-round {
        margin-top: 18px;
      }
      .pi-po-round-label {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 9px;
        color: #7f8da2;
        font-size: 10px;
        font-weight: 850;
        letter-spacing: .15em;
        text-transform: uppercase;
      }
      .pi-po-round-label::after {
        content: '';
        height: 1px;
        flex: 1;
        background: rgba(255,255,255,.08);
      }
      .pi-po-series {
        border-radius: 17px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(255,255,255,.04);
        overflow: hidden;
        margin-bottom: 9px;
      }
      .pi-po-team {
        display: grid;
        grid-template-columns: 28px 1fr auto;
        gap: 10px;
        align-items: center;
        min-height: 45px;
        padding: 0 13px;
      }
      .pi-po-team + .pi-po-team {
        border-top: 1px solid rgba(255,255,255,.065);
      }
      .pi-po-seed {
        display: grid;
        place-items: center;
        width: 25px;
        height: 25px;
        border-radius: 8px;
        background: rgba(87,153,246,.12);
        color: #82b5ff;
        font-size: 11px;
        font-weight: 900;
      }
      .pi-po-team-name {
        font-size: 13px;
        font-weight: 760;
        line-height: 1.15;
      }
      .pi-po-bye {
        font-size: 10px;
        font-weight: 850;
        letter-spacing: .08em;
        color: #78d4a6;
        text-transform: uppercase;
      }
      .pi-po-tbd {
        color: #657287;
        font-size: 11px;
        font-weight: 750;
      }
      .pi-po-status {
        margin-top: 13px;
        border-radius: 15px;
        padding: 12px 13px;
        background: rgba(64,132,230,.09);
        border: 1px solid rgba(88,154,247,.14);
        color: #a9c9f7;
        font-size: 12px;
        line-height: 1.45;
      }
      @media (min-width: 520px) {
        .pi-po-shell { max-width: 520px; margin: 0 auto; }
      }
    `;
    document.head.appendChild(style);
  }

  function root() {
    let element = document.getElementById(ROOT_ID);
    if (!element) {
      element = document.createElement('section');
      element.id = ROOT_ID;
      element.hidden = true;
      document.body.appendChild(element);
    }
    return element;
  }

  function formatDate(value) {
    const key = dateKey(value);
    if (!key) return 'TBD';
    const date = new Date(`${key}T12:00:00`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function careerTeamSeed(post) {
    const world = WorldEngine.state || {};
    const careerTeamId = world?.player?.teamId || world?.player?.highSchoolTeamId || null;
    return (post?.frozenStandings || []).find(item =>
      String(item?.teamId || '') === String(careerTeamId || '')
    ) || null;
  }

  function showIntro() {
    const post = postseason();
    if (!post?.initialized || post.checkpointAcknowledged) return;
    injectStyles();
    const element = root();
    visibleStage = 'intro';
    const playerSeed = careerTeamSeed(post);
    const qualified = Boolean(playerSeed?.qualified);

    element.innerHTML = `
      <div class="pi-po-shell">
        <p class="pi-po-eyebrow">Project Ice · Postseason</p>
        <h1 class="pi-po-title">The Playoffs<br>Are Here.</h1>
        <p class="pi-po-subtitle">
          The regular season is in the books. The league has had a week to reset, recover, and prepare. Now the road to the championship begins.
        </p>

        <div class="pi-po-hero">
          <span class="pi-po-kicker">Final Regular Season Result</span>
          <h2>${qualified ? `Seed #${playerSeed.seed}` : 'Season Complete'}</h2>
          <p>${qualified
            ? `${playerSeed.schoolName} ${playerSeed.teamName} is officially in the six-team playoff field.`
            : 'Your team finished outside the six-team playoff field. The postseason will continue around you.'
          }</p>
          <div class="pi-po-meta">
            <div class="pi-po-meta-card">
              <span>Playoffs Begin</span>
              <strong>${formatDate(post.playoffStartDate)}</strong>
            </div>
            <div class="pi-po-meta-card">
              <span>Format</span>
              <strong>Best of 3</strong>
            </div>
          </div>
        </div>

        <div class="pi-po-footer">
          <button class="pi-po-button" id="pi-po-head-into-playoffs" type="button">
            Head Into Playoffs
          </button>
        </div>
      </div>
    `;
    element.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('pi-po-head-into-playoffs')?.addEventListener('click', showBracket);
  }

  function seriesMarkup(series) {
    const highSeed = Number(series?.higherSeed) || '?';
    const lowSeed = Number(series?.lowerSeed) || '?';
    return `
      <div class="pi-po-series">
        <div class="pi-po-team">
          <span class="pi-po-seed">${highSeed}</span>
          <span class="pi-po-team-name">${teamName(series?.higherSeedTeamId)}</span>
          <span class="pi-po-tbd">0-0</span>
        </div>
        <div class="pi-po-team">
          <span class="pi-po-seed">${lowSeed}</span>
          <span class="pi-po-team-name">${teamName(series?.lowerSeedTeamId)}</span>
          <span class="pi-po-tbd">0-0</span>
        </div>
      </div>
    `;
  }

  function byeMarkup(seed) {
    const post = postseason();
    const entry = (post?.frozenStandings || []).find(item => Number(item.seed) === Number(seed));
    return `
      <div class="pi-po-series">
        <div class="pi-po-team">
          <span class="pi-po-seed">${seed}</span>
          <span class="pi-po-team-name">${entry ? `${entry.schoolName} ${entry.teamName}`.trim() : 'TBD'}</span>
          <span class="pi-po-bye">Bye</span>
        </div>
      </div>
    `;
  }

  function showBracket() {
    const post = postseason();
    if (!post?.initialized) return;
    injectStyles();
    const element = root();
    visibleStage = 'bracket';
    const roundOne = post?.bracket?.rounds?.roundOne || [];
    const playerSeed = careerTeamSeed(post);

    element.innerHTML = `
      <div class="pi-po-shell">
        <p class="pi-po-eyebrow">High School Playoffs</p>
        <div class="pi-po-bracket-head">
          <h2>Playoff Bracket</h2>
          <span>6 teams · 2 byes<br>Best of 3</span>
        </div>

        <div class="pi-po-round">
          <div class="pi-po-round-label">Round One</div>
          ${roundOne.map(seriesMarkup).join('')}
        </div>

        <div class="pi-po-round">
          <div class="pi-po-round-label">Semifinal Byes</div>
          ${byeMarkup(1)}
          ${byeMarkup(2)}
        </div>

        <div class="pi-po-round">
          <div class="pi-po-round-label">Semifinals</div>
          <div class="pi-po-series">
            <div class="pi-po-team"><span class="pi-po-seed">1</span><span class="pi-po-team-name">Highest remaining seed</span><span class="pi-po-tbd">TBD</span></div>
            <div class="pi-po-team"><span class="pi-po-seed">—</span><span class="pi-po-team-name">Lowest remaining seed</span><span class="pi-po-tbd">TBD</span></div>
          </div>
          <div class="pi-po-series">
            <div class="pi-po-team"><span class="pi-po-seed">2</span><span class="pi-po-team-name">Second-highest remaining</span><span class="pi-po-tbd">TBD</span></div>
            <div class="pi-po-team"><span class="pi-po-seed">—</span><span class="pi-po-team-name">Other remaining seed</span><span class="pi-po-tbd">TBD</span></div>
          </div>
        </div>

        <div class="pi-po-status">
          ${playerSeed?.qualified
            ? `Your team enters as the <strong>#${playerSeed.seed} seed</strong>. Higher seeds host Games 1 and 3.`
            : 'Your team did not qualify. You can continue through the calendar while the remaining six teams battle for the title.'
          }
        </div>

        <div class="pi-po-footer">
          <button class="pi-po-button" id="pi-po-continue" type="button">
            Continue to Playoffs
          </button>
        </div>
      </div>
    `;
    element.hidden = false;
    document.body.style.overflow = 'hidden';

    document.getElementById('pi-po-continue')?.addEventListener('click', () => {
      WorldEngine.acknowledgeHighSchoolPostseasonCheckpoint?.();
      element.hidden = true;
      visibleStage = null;
      document.body.style.overflow = '';
      try {
        if (typeof openHubTab === 'function') openHubTab('home');
        if (typeof refreshCareerUI === 'function') refreshCareerUI();
      } catch (_) {
        /* Home will refresh naturally on the next interaction. */
      }
    });
  }

  function shouldShowCheckpoint() {
    const post = postseason();
    const now = currentDate();
    const checkpoint = dateKey(post?.checkpointDate);
    return Boolean(
      post?.initialized &&
      !post?.checkpointAcknowledged &&
      now && checkpoint &&
      now >= checkpoint
    );
  }

  function sync() {
    if (visibleStage) return;
    if (shouldShowCheckpoint()) showIntro();
  }

  injectStyles();
  sync();
  window.setInterval(sync, 250);
})();
