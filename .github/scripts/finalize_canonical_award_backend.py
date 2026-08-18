from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text(errors='ignore')

# Add Playmaker race immediately after goal scorer.
needle="""      makeRace(
        'goal_scorer',
        'Top Goal Scorer',
        (player, stats) => position(player) !== 'G' && stats.gamesPlayed > 0,
        (player, stats) => stats.goals * 100 + stats.points
      ),
      makeRace(
        'defenseman',
"""
replacement="""      makeRace(
        'goal_scorer',
        'Top Goal Scorer',
        (player, stats) => position(player) !== 'G' && stats.gamesPlayed > 0,
        (player, stats) => stats.goals * 100 + stats.points
      ),
      makeRace(
        'playmaker',
        'Playmaker Award',
        (player, stats) => position(player) !== 'G' && stats.gamesPlayed > 0,
        (player, stats) => stats.assists * 100 + stats.points
      ),
      makeRace(
        'defenseman',
"""
if needle not in s: raise SystemExit('goal scorer -> defenseman award anchor missing')
s=s.replace(needle,replacement,1)

# normalizeAttributePosition returns LD/RD for defensemen.
old="""        (player, stats) => position(player) === 'D' && stats.gamesPlayed > 0,
"""
new="""        (player, stats) => ['LD', 'RD'].includes(position(player)) && stats.gamesPlayed > 0,
"""
if old not in s: raise SystemExit('defense award eligibility anchor missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('CANONICAL_AWARD_BACKEND=OK')
