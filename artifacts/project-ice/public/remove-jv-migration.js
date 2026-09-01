'use strict';

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
