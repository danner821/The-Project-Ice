/* ============================================================
   PROJECT ICE — game.js
   Title screen logic
   ============================================================ */

'use strict';

// ── State ──────────────────────────────────────────────────
const Game = {
  hasSave: false,        // No localStorage save exists yet
  screen: 'title',
};

// ── DOM refs ───────────────────────────────────────────────
const btnNewCareer  = document.getElementById('btn-new-career');
const btnContinue   = document.getElementById('btn-continue');

// ── Ripple effect ──────────────────────────────────────────
function spawnRipple(btn, e) {
  const rect   = btn.getBoundingClientRect();
  const touch  = e.touches ? e.touches[0] : e;
  const x      = (touch.clientX - rect.left);
  const y      = (touch.clientY - rect.top);
  const size   = Math.max(rect.width, rect.height);

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${x - size / 2}px;
    top:  ${y - size / 2}px;
  `;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

// ── Button: New Career ─────────────────────────────────────
btnNewCareer.addEventListener('pointerdown', (e) => {
  spawnRipple(btnNewCareer, e);
});

btnNewCareer.addEventListener('click', () => {
  // Placeholder — career creation screen will be added in future builds
  console.log('[Project Ice] New Career selected');
});

// ── Button: Continue (disabled, but we show a polished response) ──
btnContinue.addEventListener('click', (e) => {
  e.preventDefault();
  // Disabled — no action
});

// ── Check for existing save ────────────────────────────────
function checkSave() {
  try {
    const save = localStorage.getItem('projectice_save');
    Game.hasSave = !!save;
  } catch (_) {
    Game.hasSave = false;
  }

  if (Game.hasSave) {
    btnContinue.disabled = false;
    btnContinue.classList.remove('btn--secondary');
    btnContinue.classList.add('btn--primary');
    const tag = btnContinue.querySelector('.btn__tag');
    if (tag) tag.remove();
    const arrow = document.createElement('span');
    arrow.className = 'btn__arrow';
    arrow.textContent = '›';
    btnContinue.appendChild(arrow);
  }
}

// ── Init ───────────────────────────────────────────────────
function init() {
  checkSave();
}

document.addEventListener('DOMContentLoaded', init);
