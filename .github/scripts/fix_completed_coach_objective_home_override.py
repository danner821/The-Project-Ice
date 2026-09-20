from pathlib import Path

ROOT = Path('artifacts/project-ice')
path = ROOT / 'public' / 'coach-meeting-immersion.js'
vite_path = ROOT / 'vite.config.ts'
p = path.read_text(encoding='utf-8')

old = """  function renderObjectiveToHome() {
    const objective = syncObjective();
    if (!objective || !['active','completed'].includes(objective.status)) return;
    const current = objective.current || { games: objective.targetGames || 0, points: 0, wins: 0, progress: objective.progress || 0 };
    const title = document.getElementById('hub-current-objective-title');
    const text = document.getElementById('hub-current-objective');
    const stage = document.getElementById('home-objective-stage');
    const fill = document.getElementById('home-objective-progress-fill');
    const label = document.getElementById('home-objective-progress-label');
    if (title) title.textContent = objective.status === 'completed' ? `${objective.title} — Complete` : objective.title;
    if (text) text.textContent = objective.objectiveText;
    if (stage) stage.textContent = objective.status === 'completed' ? 'Coach Objective Complete' : `Coach Objective · ${current.games}/${objective.targetGames} Games`;
    if (fill) fill.style.width = `${objective.status === 'completed' ? 100 : current.progress}%`;
    if (label) label.textContent = `${objective.status === 'completed' ? 100 : current.progress}%`;
  }
"""
new = """  function renderObjectiveToHome() {
    const objective = syncObjective();

    /*
     * A coach objective owns the Home objective card only while it is active.
     * Once completed, it remains in canonical history / role-review state, but
     * Home immediately returns to the normal career objective selector
     * (scouting, coach trust, season production, etc.).
     *
     * Previously this renderer kept repainting completed coach objectives after
     * every refreshCareerUI()/simulated day, which overrode the correct current
     * objective that renderHomeDashboard had just selected.
     */
    if (!objective || objective.status !== 'active') return;

    const current = objective.current || {
      games: 0,
      points: 0,
      wins: 0,
      progress: objective.progress || 0,
    };

    const title = document.getElementById('hub-current-objective-title');
    const text = document.getElementById('hub-current-objective');
    const stage = document.getElementById('home-objective-stage');
    const fill = document.getElementById('home-objective-progress-fill');
    const label = document.getElementById('home-objective-progress-label');

    if (title) title.textContent = objective.title;
    if (text) text.textContent = objective.objectiveText;
    if (stage) stage.textContent = `Coach Objective · ${current.games}/${objective.targetGames} Games`;
    if (fill) fill.style.width = `${current.progress}%`;
    if (label) label.textContent = `${current.progress}%`;
  }
"""
if old not in p:
    raise SystemExit('completed coach objective renderer anchor not found')
p = p.replace(old, new, 1)
path.write_text(p, encoding='utf-8')

vite = vite_path.read_text(encoding='utf-8')
old_line = '    if (!html.includes(\'/coach-meeting-immersion.js\')) scripts.push(\'    <script src="/coach-meeting-immersion.js"></script>\');'
new_line = '    if (!html.includes(\'/coach-meeting-immersion.js\')) scripts.push(\'    <script src="/coach-meeting-immersion.js?v=20260920-home-objective-release-1"></script>\');'
if old_line in vite:
    vite = vite.replace(old_line, new_line, 1)
elif 'coach-meeting-immersion.js?v=20260920-home-objective-release-1' not in vite:
    raise SystemExit('coach meeting Vite script anchor not found')
vite_path.write_text(vite, encoding='utf-8')

Path('.github/scripts/fix_completed_coach_objective_home_override.py').unlink(missing_ok=True)
Path('.github/workflows/fix-completed-coach-objective-home-override.yml').unlink(missing_ok=True)
