from pathlib import Path

path = Path('.github/scripts/phase1_live_decisions.py')
source = path.read_text(encoding='utf-8')
old = """hit_marker = dedent('''\\
  /*
   * ============================================================
   * LIVE GAME — HIT RESOLUTION
   * ============================================================
   */''')"""
new = "hit_marker = \"  function resolveLiveGameHit(\\n    simulation\\n  ) {\""
if source.count(old) != 1:
    raise SystemExit(f'Expected one hit marker definition, found {source.count(old)}')
source = source.replace(old, new, 1)
path.write_text(source, encoding='utf-8')
print('Phase 1 patch marker corrected for this run.')
