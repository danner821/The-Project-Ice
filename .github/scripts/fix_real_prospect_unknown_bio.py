from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text(errors='ignore')

old="""  if (heightEl) {
    heightEl.textContent = p.height || `5'10\"`;
  }
"""
new="""  if (heightEl) {
    heightEl.textContent = p.height || (p.realPlayer === true ? '—' : `5'10\"`);
  }
"""
if old not in s: raise SystemExit('height fallback anchor missing')
s=s.replace(old,new,1)

old="""  if (weightEl) {
    const weight = Number(p.weightLbs ?? p.weight) || 175;
    weightEl.textContent = `${weight} lbs`;
  }
"""
new="""  if (weightEl) {
    const weight = Number(p.weightLbs ?? p.weight) || null;
    weightEl.textContent = weight
      ? `${weight} lbs`
      : (p.realPlayer === true ? '—' : '175 lbs');
  }
"""
if old not in s: raise SystemExit('weight fallback anchor missing')
s=s.replace(old,new,1)

old="""  if (shootsEl) {
    const isGoalie = String(p.position || '').trim().toUpperCase() === 'G';
    if (isGoalie) {
      shootsEl.textContent = `Catches ${p.catches || p.shoots || 'L'}`;
    } else {
      shootsEl.textContent = `Shoots ${p.shoots || 'L'}`;
    }
  }
"""
new="""  if (shootsEl) {
    const isGoalie = String(p.position || '').trim().toUpperCase() === 'G';
    const handedness = isGoalie ? (p.catches || p.shoots || '') : (p.shoots || '');
    if (isGoalie) {
      shootsEl.textContent = handedness
        ? `Catches ${handedness}`
        : (p.realPlayer === true ? 'Catches —' : 'Catches L');
    } else {
      shootsEl.textContent = handedness
        ? `Shoots ${handedness}`
        : (p.realPlayer === true ? 'Shoots —' : 'Shoots L');
    }
  }
"""
if old not in s: raise SystemExit('handedness fallback anchor missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('REAL_PROSPECT_UNKNOWN_BIO=SAFE')
