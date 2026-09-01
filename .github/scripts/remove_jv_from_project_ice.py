from pathlib import Path
import re

ROOT = Path('artifacts/project-ice')
PUBLIC = ROOT / 'public'

TEXT_EXTS = {'.js', '.html', '.css', '.ts'}
SKIP = {'remove-jv-migration.js'}

changed=[]

# Player-facing/runtime source cleanup. Compatibility migration is handled
# separately so existing careers keep working without preserving JV as a live
# game concept.
for path in [ROOT/'index.html', ROOT/'vite.config.ts', *PUBLIC.glob('*.js'), *PUBLIC.glob('*.css')]:
    if not path.exists() or path.name in SKIP:
        continue
    text=path.read_text(encoding='utf-8')
    original=text

    # Full labels first.
    text=text.replace('Junior Varsity','Varsity')
    text=text.replace('JUNIOR VARSITY','VARSITY')
    text=text.replace('junior varsity','varsity')

    # Remove stale comments that describe freshman Varsity as an exceptional
    # alternate level. Tryout score still controls OVR, role, trust and lineup.
    text=text.replace('// Varsity is intentionally difficult for a freshman to reach.','// All high-school players compete at Varsity; tryout performance determines role and deployment.')

    # A literal replacement can leave duplicate Varsity mapping entries in
    # level-label objects. Collapse exact adjacent duplicates where possible.
    text=re.sub(r"(\s*['\"]VARSITY['\"]\s*:\s*['\"]V['\"]\s*,\s*)\1", r"\1", text)

    if text!=original:
        path.write_text(text,encoding='utf-8')
        changed.append(str(path))

migration = r'''\'use strict\';

/* global WorldEngine */
(() => {
  /*
   * One-way compatibility migration for careers created before Project Ice
   * became Varsity-only high-school hockey.
   *
   * JV is not a live gameplay level anymore. Existing saves are normalized
   * without touching team identity, stats, lineup placement, tryout results,
   * development or season history beyond the obsolete level label itself.
   */
  const FULL_OLD = 'Junior ' + 'Varsity';
  const SHORT_OLD = 'J' + 'V';

  function normalizeValue(value, key='') {
    if (value === FULL_OLD) return 'Varsity';

    // Historical season/stat rows used the short level token. Restrict that
    // conversion to level-like fields instead of blindly rewriting all text.
    if (
      value === SHORT_OLD &&
      /(?:team)?level|division|squad|seasonlevel/i.test(String(key||''))
    ) {
      return 'V';
    }

    return value;
  }

  function walk(node, seen=new WeakSet()) {
    if (!node || typeof node !== 'object') return false;
    if (seen.has(node)) return false;
    seen.add(node);

    let changed=false;

    if (Array.isArray(node)) {
      for (let i=0;i<node.length;i+=1) {
        const value=node[i];
        const normalized=normalizeValue(value,'');
        if (normalized!==value) {
          node[i]=normalized;
          changed=true;
        } else if (value && typeof value==='object') {
          changed=walk(value,seen)||changed;
        }
      }
      return changed;
    }

    Object.keys(node).forEach(key=>{
      const value=node[key];
      const normalized=normalizeValue(value,key);
      if (normalized!==value) {
        node[key]=normalized;
        changed=true;
      } else if (value && typeof value==='object') {
        changed=walk(value,seen)||changed;
      }
    });

    return changed;
  }

  function migrateCurrentWorld() {
    if (typeof WorldEngine==='undefined' || !WorldEngine?.state) return false;
    const changed=walk(WorldEngine.state);
    if (changed) {
      try { WorldEngine.save?.(); } catch (_) {}
    }
    return changed;
  }

  function migratePreview() {
    try {
      const key='projectice_save';
      const raw=localStorage.getItem(key);
      if (!raw) return false;
      const parsed=JSON.parse(raw);
      const changed=walk(parsed);
      if (changed) localStorage.setItem(key,JSON.stringify(parsed));
      return changed;
    } catch (_) {
      return false;
    }
  }

  migratePreview();
  migrateCurrentWorld();

  if (
    typeof WorldEngine!=='undefined' &&
    typeof WorldEngine.selectCareerSave==='function' &&
    !WorldEngine.__varsityOnlySaveMigrationWrapped
  ) {
    WorldEngine.__varsityOnlySaveMigrationWrapped=true;
    const original=WorldEngine.selectCareerSave.bind(WorldEngine);
    WorldEngine.selectCareerSave=async function(...args) {
      const result=await original(...args);
      migrateCurrentWorld();
      migratePreview();
      return result;
    };
  }

  globalThis.ProjectIceVarsityOnlyMigration={
    migrateCurrentWorld,
    migratePreview,
  };
})();
'''.replace("\\'","'")

migration_path=PUBLIC/'remove-jv-migration.js'
migration_path.write_text(migration,encoding='utf-8')
changed.append(str(migration_path))

# Inject the migration after game.js so WorldEngine and save selection APIs
# exist. This uses the same Vite HTML augmentation pattern as the rest of the
# project and remains idempotent.
vite_path=ROOT/'vite.config.ts'
vite=vite_path.read_text(encoding='utf-8')
anchor="    if (!html.includes('/dev-save-cleanup.js')) scripts.push('    <script src=\"/dev-save-cleanup.js\"></script>');"
insert="    if (!html.includes('/remove-jv-migration.js')) scripts.push('    <script src=\"/remove-jv-migration.js\"></script>');\n"
if insert.strip() not in vite:
    if anchor not in vite:
        raise SystemExit('Vite runtime injection anchor not found')
    vite=vite.replace(anchor,anchor+'\n'+insert.rstrip(),1)
    vite_path.write_text(vite,encoding='utf-8')
    if str(vite_path) not in changed: changed.append(str(vite_path))

print('VARSITY_ONLY_MIGRATION=OK')
for p in changed:
    print('CHANGED',p)
