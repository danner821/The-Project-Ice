from pathlib import Path

ROOT = Path('artifacts/project-ice')
path = ROOT / 'public' / 'postseason-cadence.js'
vite_path = ROOT / 'vite.config.ts'
p = path.read_text(encoding='utf-8')

anchor = """  function postseason() {
    return WorldEngine.getHighSchoolPostseason?.() ||
      WorldEngine.state?.postseason?.highSchool ||
      null;
  }

"""
insert = """  function postseason() {
    return WorldEngine.getHighSchoolPostseason?.() ||
      WorldEngine.state?.postseason?.highSchool ||
      null;
  }

  function careerQualifiedForPlayoffs(post, teamId) {
    if (!post || !teamId) return false;

    const frozen = Array.isArray(post.frozenStandings)
      ? post.frozenStandings
      : [];

    const seed = frozen.find(item =>
      String(item?.teamId || '') === String(teamId || '')
    ) || null;

    if (seed) {
      return seed.qualified === true || Number(seed.seed) <= 6;
    }

    return WorldEngine.state?.season?.postseason?.qualified === true;
  }

  function removeCareerPostseasonEvents(world) {
    if (!world || !Array.isArray(world.schedule)) return false;

    const before = world.schedule.length;

    world.schedule = world.schedule.filter(event =>
      event?.postseasonCareerEvent !== true
    );

    return world.schedule.length !== before;
  }

"""
if anchor not in p:
    raise SystemExit('postseason helper anchor not found')
p = p.replace(anchor, insert, 1)

old = """  function syncCadence(options = {}) {
    const world = WorldEngine.state;
    const post = postseason();
    if (!world || !post?.initialized || !key(post.playoffStartDate)) return false;

    const teamId = careerTeamId();
    if (!teamId) return false;

    let changed = reconcileExistingCadence(world, teamId);
"""
new = """  function syncCadence(options = {}) {
    const world = WorldEngine.state;
    const post = postseason();
    if (!world || !post?.initialized || !key(post.playoffStartDate)) return false;

    const teamId = careerTeamId();
    if (!teamId) return false;

    /*
     * Postseason cadence belongs only to teams that actually qualified.
     * The league postseason is global, so post.initialized can be true even
     * when the career player's team finished outside the six-team field.
     * In that case, remove any stale playoff Practice / Film Study events and
     * do not create new ones.
     */
    if (!careerQualifiedForPlayoffs(post, teamId)) {
      const changed = removeCareerPostseasonEvents(world);

      if (changed && options.save !== false) {
        WorldEngine.save?.();
      }

      return changed;
    }

    let changed = reconcileExistingCadence(world, teamId);
"""
if old not in p:
    raise SystemExit('syncCadence anchor not found')
p = p.replace(old, new, 1)

path.write_text(p, encoding='utf-8')

vite = vite_path.read_text(encoding='utf-8')
old_line = """    if (!html.includes('/postseason-cadence.js')) scripts.push('    <script src="/postseason-cadence.js"></script>');
"""
new_line = """    if (!html.includes('/postseason-cadence.js')) scripts.push('    <script src="/postseason-cadence.js?v=20260920-nonqualifier-cadence-1"></script>');
"""
if old_line in vite:
    vite = vite.replace(old_line, new_line, 1)
elif 'postseason-cadence.js?v=20260920-nonqualifier-cadence-1' not in vite:
    raise SystemExit('postseason cadence Vite anchor not found')
vite_path.write_text(vite, encoding='utf-8')

Path('.github/scripts/fix_nonqualifier_postseason_cadence.py').unlink(missing_ok=True)
Path('.github/workflows/fix-nonqualifier-postseason-cadence.yml').unlink(missing_ok=True)
