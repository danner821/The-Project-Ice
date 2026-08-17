from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text()
old="""    elite: Object.freeze({ min: 10, max: 15 }),
    topRole: Object.freeze({ min: 48, max: 64 }),
    middleRole: Object.freeze({ min: 72, max: 92 }),
    depthRole: Object.freeze({ min: 54, max: 84 }),
"""
new="""    elite: Object.freeze({ min: 10, max: 15 }),
    topRole: Object.freeze({ min: 52, max: 66 }),
    middleRole: Object.freeze({ min: 78, max: 96 }),
    /* Depth roles fill every remaining slot after the higher tiers. */
    depthRole: Object.freeze({ min: 46, max: 84, remainder: true }),
"""
if old not in s: raise SystemExit('distribution range block missing')
s=s.replace(old,new,1)
p.write_text(s)
print('made draft potential distribution ranges sum-safe')
