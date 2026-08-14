from pathlib import Path

path = Path('.github/scripts/phase1_live_decisions.py')
source = path.read_text(encoding='utf-8')

old_hit = """hit_case = dedent('''\\
      case 'hit':
        resolution =
          resolveLiveGameHit(
            simulation
          );
        break;''')"""
new_hit = "hit_case = \"      case 'hit':\\n        resolution =\\n          resolveLiveGameHit(\\n            simulation\\n          );\\n        break;\""
if source.count(old_hit) != 1:
    raise SystemExit(f'Expected one hit case definition, found {source.count(old_hit)}')
source = source.replace(old_hit, new_hit, 1)

old_penalty = """penalty_marker = dedent('''\\
  /*
   * ==========================================================
   * PENALTY
   * ==========================================================
   */''')"""
new_penalty = "penalty_marker = \"  /*\\n   * ==========================================================\\n   * PENALTY\\n   * ==========================================================\\n   */\""
if source.count(old_penalty) != 1:
    raise SystemExit(f'Expected one penalty marker definition, found {source.count(old_penalty)}')
source = source.replace(old_penalty, new_penalty, 1)

path.write_text(source, encoding='utf-8')
print('Remaining Phase 1 patch markers corrected for this run.')
