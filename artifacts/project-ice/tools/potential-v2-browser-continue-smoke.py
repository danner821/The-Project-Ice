#!/usr/bin/env python3
"""Synthetic-only Project Ice browser Continue -> Career Hub smoke test.

Requires playwright (pip install playwright) and installed Chromium.
Run from artifacts/project-ice:
  python tools/potential-v2-browser-continue-smoke.py
Does NOT use the user's real career backup or real browser storage.
The browser stays at about:blank; injected IndexedDB/localStorage are fake.
"""
from pathlib import Path
import json, subprocess, os
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
PUBLIC = ROOT / "public"

# The existing synthetic fixture generator is reused, never a private JSON.
NODE = r"""
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=process.argv[1];
let test=fs.readFileSync(path.join(root,'tools/potential-v2-private-world-boot.test.js'),'utf8');
test=test.slice(test.indexOf('function fixture(){'),test.indexOf('\nasync function run(){'));
const sourceWorld=fs.readFileSync(path.join(root,'public/world.js'),'utf8');
const sourceProspects=fs.readFileSync(path.join(root,'public/prospects.js'),'utf8');
const fixture=Function('vm','sourceWorld','sourceProspects','clone',
  test+';return fixture')(vm,sourceWorld,sourceProspects,
  x=>JSON.parse(JSON.stringify(x)));
const backup=fixture(),w=backup.activeRecord.world,team=w.teams[0];
Object.assign(w.player,{firstName:'Fixture',lastName:'Player',stage:'hub',
  tryoutsComplete:true,teamId:team.teamId,highSchoolTeamId:team.teamId,
  position:'RW',overall:72});
Object.assign(team.roster[0],{firstName:'Fixture',lastName:'Player',
  teamId:team.teamId,stage:'hub',tryoutsComplete:true});
process.stdout.write(JSON.stringify(backup));
"""

def main():
    fixture=json.loads(subprocess.check_output(
        ['node','-e',NODE,str(ROOT)],text=True))
    html=(ROOT/'index.html').read_text()
    import re
    html=re.sub(r'<script\\s+src=["\\'][^"\\']+["\\']\\s*>\\s*</script>',
                '',html)
    fake=(TOOLS/'potential-v2-fake-indexeddb.js').read_text().replace(
        'module.exports={fakeIndexedDB};',
        'window.__fakeIndexedDB=fakeIndexedDB;')
    errors=[]
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(
            headless=True,
            executable_path=os.getenv('CHROMIUM_PATH') or None,
            args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':390,'height':844})
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.set_content(html,wait_until='domcontentloaded')
        page.add_script_tag(content=fake)
        page.evaluate("""() => {
          const f=window.__fakeIndexedDB();
          window.__fixtureIDB=f;
          Object.defineProperty(window,'indexedDB',{configurable:true,
            value:{
              open(name,version){
                if(name!=='projectice_database')throw Error('Unknown DB '+name);
                return f.indexedDB.open('projectice_fixture_only',version);
              },
              deleteDatabase(){throw Error('Unexpected DB delete');}
            }});
          const items=new Map();
          Object.defineProperty(window,'localStorage',{configurable:true,
            value:{
              getItem:k=>items.get(k)||null,
              setItem:(k,v)=>items.set(k,String(v)),
              removeItem:k=>items.delete(k),clear:()=>items.clear()
            }});
        }""")
        page.evaluate("""f => {
          window.__fixtureIDB.addSentinel(
            'projectice_fixture_only',f.activeRecord.id,f.activeRecord);
          window.__fixtureIDB.addSentinel(
            'projectice_database','career:CANARY',
            {id:'career:CANARY',revision:444,world:{protected:true}});
          localStorage.setItem('projectice_active_career_id_v1',f.activeCareerId);
        }""",fixture)
        for script in ('prospects.js','world.js','game.js'):
            page.add_script_tag(content=(PUBLIC/script).read_text())
        page.evaluate('async () => { await init(); }')
        assert page.locator('#btn-continue').is_enabled()
        page.locator('#btn-continue').click()
        assert page.locator('.career-save-card').count()==1
        page.locator('.career-save-card').click()
        page.wait_for_function("Game.screen==='hub'")
        result=page.evaluate("""() => ({
          screen:Game.screen,
          visible:document.getElementById('hub-screen')
            && !document.getElementById('hub-screen')
              .classList.contains('screen--hidden'),
          roster:WorldEngine.state.teams.flatMap(t=>t.roster||[]).length,
          opens:window.__fixtureIDB.counters.opens,
          canary:window.__fixtureIDB.registry.get('projectice_database')
            .records.get('career:CANARY').revision
        })""")
        assert result['screen']=='hub' and result['visible'],result
        assert result['roster']==160,result
        assert result['canary']==444,result
        assert set(result['opens'])=={'projectice_fixture_only'},result
        assert not errors,errors
        print('PASS: actual mobile DOM title -> Continue -> 1 Save -> Career Hub')
        print('PASS: 160 synthetic slots, protected canary, isolated DB opens')
        browser.close()

if __name__=='__main__':
    main()
