'use strict';

(() => {
  const STYLE_ID = 'pi-postseason-polish-v2';
  const ROOT_SELECTOR = '#pi-postseason-overlay';

  const oldStyle = document.getElementById('pi-postseason-polish-v1');
  if (oldStyle) oldStyle.remove();

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      ${ROOT_SELECTOR} .pi-po-bracket-head{margin-bottom:14px}
      ${ROOT_SELECTOR} .pi-po-swipe{margin:0 0 14px;color:#7d8ca2;font-size:10px;line-height:1.35;letter-spacing:.045em}
      ${ROOT_SELECTOR} .pi-po-bracket-scroll{position:relative;margin:0 -18px;padding:10px 18px 24px;overflow-x:auto;overflow-y:visible;scroll-padding-inline:18px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
      ${ROOT_SELECTOR} .pi-po-bracket-grid{min-width:850px;grid-template-columns:232px 76px 232px 76px 232px;align-items:stretch}
      ${ROOT_SELECTOR} .pi-po-col{position:relative;min-height:300px;gap:0;scroll-snap-align:start}
      ${ROOT_SELECTOR} .pi-po-col-title{min-height:26px;display:flex;align-items:center;color:#94a2b7;font-size:10px;letter-spacing:.18em}
      ${ROOT_SELECTOR} .pi-po-col--round1,${ROOT_SELECTOR} .pi-po-col--semis{display:grid;grid-template-rows:26px 1fr 1fr;row-gap:22px}
      ${ROOT_SELECTOR} .pi-po-col--round1 .pi-po-match,${ROOT_SELECTOR} .pi-po-col--semis .pi-po-match{align-self:center}
      ${ROOT_SELECTOR} .pi-po-col--final{display:grid;grid-template-rows:26px 1fr}
      ${ROOT_SELECTOR} .pi-po-final-slot{align-self:center}
      ${ROOT_SELECTOR} .pi-po-match{width:100%;border-color:rgba(130,157,196,.16);background:linear-gradient(180deg,rgba(31,42,58,.92),rgba(22,31,44,.94));box-shadow:0 14px 30px rgba(0,0,0,.18)}
      ${ROOT_SELECTOR} .pi-po-row{min-height:48px;padding:0 12px}
      ${ROOT_SELECTOR} .pi-po-team-name{line-height:1.18}
      ${ROOT_SELECTOR} .pi-po-row--career{position:relative;background:linear-gradient(90deg,rgba(52,126,236,.32),rgba(52,126,236,.11));box-shadow:inset 4px 0 0 #65a7ff}
      ${ROOT_SELECTOR} .pi-po-row--career::after{content:'';position:absolute;inset:0;pointer-events:none;border:1px solid rgba(101,167,255,.16)}
      ${ROOT_SELECTOR} .pi-po-your-team{display:inline-block;margin-left:6px;color:#94c4ff;font-size:8px;letter-spacing:.11em;vertical-align:1px}

      /* Connector geometry is rendered by SVG against real card centers. */
      ${ROOT_SELECTOR} .pi-po-connector{position:relative;min-height:300px;background:none!important}
      ${ROOT_SELECTOR} .pi-po-connector::before,${ROOT_SELECTOR} .pi-po-connector::after{display:none!important}
      ${ROOT_SELECTOR} .pi-po-connector-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
      ${ROOT_SELECTOR} .pi-po-connector-svg path{fill:none;stroke:rgba(114,145,187,.42);stroke-width:1;vector-effect:non-scaling-stroke;shape-rendering:geometricPrecision}
      ${ROOT_SELECTOR} .pi-po-connector-svg circle{fill:#78b4ff;opacity:.42}
      ${ROOT_SELECTOR} .pi-po-reseed{z-index:3;padding:5px 7px;border-radius:7px;border:1px solid rgba(114,145,187,.22);background:#111a27;color:#8fa0b8;box-shadow:0 5px 14px rgba(0,0,0,.28);font-size:8px;letter-spacing:.12em}
      ${ROOT_SELECTOR} .pi-po-status{margin-top:4px;padding:13px 14px;border-color:rgba(88,154,247,.18);background:linear-gradient(180deg,rgba(49,113,205,.11),rgba(30,71,133,.08));line-height:1.5}

      @media(max-width:430px){
        ${ROOT_SELECTOR} .pi-po-bracket-grid{min-width:810px;grid-template-columns:220px 72px 220px 72px 220px}
        ${ROOT_SELECTOR} .pi-po-col,${ROOT_SELECTOR} .pi-po-connector{min-height:286px}
      }
    `;
    document.head.appendChild(style);
  }

  const centerY = (element, referenceRect) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return rect.top + rect.height / 2 - referenceRect.top;
  };

  function ensureSvg(connector) {
    let svg = connector.querySelector('.pi-po-connector-svg');
    if (svg) return svg;
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('pi-po-connector-svg');
    svg.setAttribute('preserveAspectRatio', 'none');
    connector.prepend(svg);
    return svg;
  }

  function path(svg, d) {
    const item = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    item.setAttribute('d', d);
    svg.appendChild(item);
  }

  function dot(svg, cx, cy) {
    const item = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    item.setAttribute('cx', String(cx));
    item.setAttribute('cy', String(cy));
    item.setAttribute('r', '1.7');
    svg.appendChild(item);
  }

  function drawReseed(connector, leftColumn, rightColumn) {
    const left = [...leftColumn.querySelectorAll('.pi-po-match')];
    const right = [...rightColumn.querySelectorAll('.pi-po-match')];
    if (left.length < 2 || right.length < 2) return;

    const rect = connector.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const leftY = left.slice(0, 2).map(item => centerY(item, rect));
    const rightY = right.slice(0, 2).map(item => centerY(item, rect));
    if (leftY.some(value => value === null) || rightY.some(value => value === null)) return;

    const svg = ensureSvg(connector);
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    svg.innerHTML = '';

    const inX = rect.width * .42;
    const outX = rect.width * .58;
    const junctionY = (Math.min(...leftY, ...rightY) + Math.max(...leftY, ...rightY)) / 2;

    leftY.forEach(y => path(svg, `M 0 ${y} H ${inX} V ${junctionY}`));
    rightY.forEach(y => path(svg, `M ${outX} ${junctionY} V ${y} H ${rect.width}`));
    path(svg, `M ${inX} ${junctionY} H ${outX}`);
    dot(svg, inX, junctionY);
    dot(svg, outX, junctionY);

    const badge = connector.querySelector('.pi-po-reseed');
    if (badge) {
      badge.style.left = '50%';
      badge.style.top = `${junctionY}px`;
      badge.style.transform = 'translate(-50%,-50%)';
    }
  }

  function drawFinal(connector, leftColumn, rightColumn) {
    const semis = [...leftColumn.querySelectorAll('.pi-po-match')];
    const final = rightColumn.querySelector('.pi-po-final-slot, .pi-po-match');
    if (semis.length < 2 || !final) return;

    const rect = connector.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const y1 = centerY(semis[0], rect);
    const y2 = centerY(semis[1], rect);
    const yf = centerY(final, rect);
    if ([y1, y2, yf].some(value => value === null)) return;

    const svg = ensureSvg(connector);
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    svg.innerHTML = '';

    const joinX = rect.width * .54;
    path(svg, `M 0 ${y1} H ${joinX} V ${yf} H ${rect.width}`);
    path(svg, `M 0 ${y2} H ${joinX} V ${yf}`);
    dot(svg, joinX, yf);
  }

  function drawBracketConnectors() {
    const root = document.querySelector(ROOT_SELECTOR);
    if (!root || root.hidden) return;

    const grid = root.querySelector('.pi-po-bracket-grid');
    if (!grid) return;

    const roundOne = grid.querySelector('.pi-po-col--round1');
    const semis = grid.querySelector('.pi-po-col--semis');
    const final = grid.querySelector('.pi-po-col--final');
    const connectors = [...grid.querySelectorAll('.pi-po-connector')];
    if (!roundOne || !semis || !final || connectors.length < 2) return;

    drawReseed(connectors[0], roundOne, semis);
    drawFinal(connectors[1], semis, final);
  }

  let frame = null;
  function queueDraw() {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      drawBracketConnectors();
    });
  }

  const observer = new MutationObserver(queueDraw);
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'class'] });
  window.addEventListener('resize', queueDraw, { passive: true });
  window.addEventListener('orientationchange', queueDraw, { passive: true });

  queueDraw();
})();
