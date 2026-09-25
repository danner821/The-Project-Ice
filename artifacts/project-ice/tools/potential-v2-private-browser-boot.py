#!/usr/bin/env python3
"""Full PRIVATE backup -> actual Chromium DOM Continue-to-Hub smoke.

Usage: python tools/potential-v2-private-browser-boot.py "/private/backup.json"
Requires Python playwright and local Chromium. NO career data is committed.
Identity-clone fake IndexedDB is deliberately fast but DOES NOT verify genuine
browser IndexedDB, quota, disk persistence, atomicity or iOS Safari/WebKit.
"""
import base64, gzip, hashlib, json, os, re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
BACKUP = Path(sys.argv[1]).resolve()
FAIL_CLOSED_ONLY = '--fail-closed-only' in sys.argv[2:]
if not BACKUP.is_file():
    raise SystemExit('Provide an existing local backup file')
with BACKUP.open('rb') as f:
    original_hash = hashlib.file_digest(f,'sha256').hexdigest()
html = (ROOT/'index.html').read_text()
html = re.sub(r"""<script\s+[^>]*src=['"][^'"]+['"][^>]*>\s*</script>""", '', html)
fake = (ROOT/'tools/potential-v2-fake-indexeddb.js').read_text()
fake = fake.replace(
    'const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));',
    'const clone=value=>value; // identity clone: isolated large-record browser smoke ONLY')
fake = fake.replace('const bytes=JSON.stringify(object).length;',
                    'const bytes=0; // quota covered by separate atomic tests')
fake = fake.replace('module.exports={fakeIndexedDB};',
                    'window.__fakeIndexedDB=fakeIndexedDB;')
compressed = base64.b64encode(gzip.compress(BACKUP.read_bytes(),compresslevel=1)).decode('ascii')
errors=[]; logs=[]
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(
        headless=True,executable_path=os.environ.get('CHROMIUM_PATH') or '/usr/bin/chromium',
        args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':390,'height':844})
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.on('console',lambda m: logs.append((m.type,m.text))
            if m.type in ('error','warning') else None)
    page.set_content(html,wait_until='domcontentloaded')
    page.add_script_tag(content=fake)
    page.evaluate("""()=>{
      const f=window.__fakeIndexedDB();window.__fake=f;
      Object.defineProperty(window,'indexedDB',{configurable:true,value:{
        open(name,version){if(name!=='projectice_database')
          throw Error('Unexpected DB '+name);
          return f.indexedDB.open('projectice_DISPOSABLE_BROWSER_SMOKE',version);},
        deleteDatabase(name){throw Error('No deletion in smoke '+name);}
      }});
      const items=new Map();
      Object.defineProperty(window,'localStorage',{configurable:true,value:{
        getItem:k=>items.get(k)||null,
        setItem:(k,v)=>items.set(k,String(v)),
        removeItem:k=>items.delete(k),clear:()=>items.clear()
      }});
    }""")
    initial=page.evaluate("""async compressed=>{
      const bin=atob(compressed),bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
      const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      const env=JSON.parse(await new Response(stream).text()),r=env.activeRecord;
      window.__fake.addSentinel('projectice_DISPOSABLE_BROWSER_SMOKE',r.id,r);
      window.__iceProjection=function(rec){
        const w=rec.world,players=w.teams.flatMap(t=>t.roster||[]);
        const p=players.find(x=>x.id===w.player?.id)||w.player;
        return {revision:rec.revision,savedAt:rec.savedAt,
          topKeys:Object.keys(w).sort(),date:w.currentDate,week:w.currentWeek,
          season:w.currentSeason,
          player:{id:p?.id,overall:p?.overall,potential:p?.potential,
            developmentPotential:p?.development?.potential,
            attributeXP:p?.development?.attributeXP,
            attributeXPEarnedCareer:p?.development?.attributeXPEarnedCareer,
            upgradeCounts:p?.development?.attributeUpgradeCounts,
            archivedSeasons:p?.highSchoolSeasonHistory?.map(z=>({
              seasonId:z.seasonId,overall:z.overall}))},
          roster:players.map(x=>({id:x.id,overall:x.overall,
            potential:x.potential,devPotential:x.development?.potential,
            earned:x.development?.xpEarnedCareer,
            attrXP:x.development?.attributeXP})),
          prospects:(w.externalProspects||[]).map(x=>({
            id:x.id,overall:x.overall,potential:x.potential,
            devPotential:x.development?.potential})),
          schedule:(w.schedule||[]).map(e=>({
            id:e.id,status:e.status,played:e.played,
            homeScore:e.homeScore,awayScore:e.awayScore}))};
      };
      window.__beforeContinue=window.__iceProjection(r);
      window.__exactWorldBefore=JSON.stringify(r.world);

      window.__fake.addSentinel('projectice_database','career:PROTECTED_CANARY',
        {id:'career:PROTECTED_CANARY',revision:444,world:{protected:true}});
      localStorage.setItem('projectice_active_career_id_v1',env.activeCareerId);
      return {revision:r.revision,date:r.world.currentDate,
        roster:r.world.teams.flatMap(t=>t.roster||[]).length};
    }""",compressed)
    del compressed
    for name in ('prospects.js','world.js','game.js'):
        page.add_script_tag(content=(ROOT/'public'/name).read_text())
    if FAIL_CLOSED_ONLY:
        page.evaluate("""()=>{
          window.__priorLoad=WorldEngine.load;
          window.__priorEnsure=WorldEngine.ensureGeneratedRosters;
          window.__ensureCalls=0;
          WorldEngine.load=async()=>false;
          WorldEngine.ensureGeneratedRosters=async(...args)=>{
            window.__ensureCalls++;
            return window.__priorEnsure(...args);
          };
          const store=window.__fake.registry.get('projectice_DISPOSABLE_BROWSER_SMOKE');
          window.__beforeFailure=JSON.stringify([...store.records.values()][0]);
        }""")
        page.evaluate('async()=>{await init();}')
        failure=page.evaluate("""()=>{
          const store=window.__fake.registry.get('projectice_DISPOSABLE_BROWSER_SMOKE');
          const record=[...store.records.values()][0];
          return {
            screen:Game.screen,
            continueEnabled:!document.getElementById('btn-continue').disabled,
            synthesizedRosters:window.__ensureCalls,
            revision:record.revision,
            recordIdentical:window.__beforeFailure===JSON.stringify(record),
            canary:window.__fake.registry.get('projectice_database')
              .records.get('career:PROTECTED_CANARY').revision
          };
        }""")
        assert failure=={'screen':'title','continueEnabled':True,
          'synthesizedRosters':0,'revision':4,'recordIdentical':True,
          'canary':444},failure
        with BACKUP.open('rb') as source:
            assert hashlib.file_digest(source,'sha256').hexdigest()==original_hash
        print(json.dumps({'result':'PASS','test':'full original backup fail-closed DOM',
          'detail':failure,'sourceSHA256':original_hash,
          'limitation':'Injected load failure; simulated IndexedDB, not WebKit'},
          indent=2))
        browser.close()
        sys.exit(0)
    page.evaluate('async()=>{await init();}')
    assert page.locator('#btn-continue').is_enabled(), 'Continue disabled'
    page.locator('#btn-continue').click()
    assert page.locator('.career-save-card').count()==1, 'Expected exactly one save'
    page.locator('.career-save-card').first.click()
    page.wait_for_function("Game.screen==='hub'",timeout=25000)
    exact=page.evaluate("""()=>{
      const id='career:'+localStorage.getItem('projectice_active_career_id_v1');
      const rec=window.__fake.registry.get('projectice_DISPOSABLE_BROWSER_SMOKE')
        .records.get(id),after=JSON.stringify(rec.world),
        before=window.__exactWorldBefore,differences=[];
      if(before!==after){
        const todo=[[JSON.parse(before),JSON.parse(after),'world']];
        while(todo.length){
          const [left,right,path]=todo.pop();
          if(left===right)continue;
          if(left===null||right===null
             ||typeof left!=='object'||typeof right!=='object'){
            differences.push({path,before:left,after:right});
            if(differences.length>30)break;
            continue;
          }
          const keys=new Set([...Object.keys(left),...Object.keys(right)]);
          for(const k of keys)todo.push([left[k],right[k],path+'.'+k]);
        }
      }
      return {fullWorldByteLengthBefore:before.length,
        fullWorldByteLengthAfter:after.length,
        differences,recordRevision:rec.revision};
    }""")
    assert exact['differences']==[
        {'path':'world.persistence.revision','before':4,'after':9}
    ],exact
    print('PASS: exhaustive private world field comparison; only '
          'world.persistence.revision 4->9 changed',flush=True)
    diff=page.evaluate("""()=>{
      const id='career:'+localStorage.getItem('projectice_active_career_id_v1');
      const rec=window.__fake.registry.get('projectice_DISPOSABLE_BROWSER_SMOKE')
        .records.get(id);
      const a=window.__iceProjection(rec),b=window.__beforeContinue;
      const differences={};
      for(const key of Object.keys(b)){
        if(key==='revision'||key==='savedAt')continue;
        if(JSON.stringify(a[key])!==JSON.stringify(b[key])){
          if(Array.isArray(b[key]))
            differences[key]={beforeLength:b[key].length,afterLength:a[key].length,
              changedIndices:b[key].reduce((n,x,i)=>
                n+(JSON.stringify(x)!==JSON.stringify(a[key][i])?1:0),0)};
          else differences[key]='Changed unexpectedly';
        }
      }
      return {revisionBefore:b.revision,revisionAfter:a.revision,
        persistedDataDifferences:differences};
    }""")
    assert diff['revisionBefore']==4 and diff['revisionAfter']>=4,diff
    assert not diff['persistedDataDifferences'],diff
    print('PASS: revision only, no projected roster/XP/potential/schedule changes',
          json.dumps(diff),flush=True)
    result=page.evaluate("""()=>{
      const p=WorldEngine.getCareerPlayer(),s=WorldEngine.state;
      const id='career:'+localStorage.getItem('projectice_active_career_id_v1');
      return {
        screen:Game.screen,
        hubVisible:!document.getElementById('hub-screen').classList.contains('screen--hidden'),
        overall:p?.overall,rootPotential:p?.potential,
        developmentPotential:p?.development?.potential,
        roster:s.teams.flatMap(t=>t.roster||[]).length,
        externalProspects:s.externalProspects?.length,
        schedule:s.schedule?.length,date:s.currentDate,
        attributeXPKeys:Object.keys(p?.development?.attributeXP||{}).length,
        revision:window.__fake.registry.get('projectice_DISPOSABLE_BROWSER_SMOKE')
          .records.get(id)?.revision,
        canary:window.__fake.registry.get('projectice_database')
          .records.get('career:PROTECTED_CANARY')?.revision,
        dbOpens:window.__fake.counters.opens,
        dbDeletes:window.__fake.counters.deletions
      };
    }""")
    assert result['screen']=='hub' and result['hubVisible'],result
    assert result['overall']==72 and result['roster']==160,result
    assert result['attributeXPKeys']==22,result
    assert result['canary']==444 and not result['dbDeletes'],result
    assert set(result['dbOpens'])=={'projectice_DISPOSABLE_BROWSER_SMOKE'},result
    assert not errors and not logs,(errors,logs)
    with BACKUP.open('rb') as f:
        assert hashlib.file_digest(f,'sha256').hexdigest()==original_hash,'Input modified'
    print(json.dumps({'result':'PASS','sha256':original_hash,
      'preInit':initial,'afterContinue':result,'pageErrors':errors,'warnings':logs,
      'limitations':'Simulated identity-clone IndexedDB; Chromium not WebKit; no live writes'},
      indent=2))
    browser.close()
