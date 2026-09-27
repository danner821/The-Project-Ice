"""Native-browser staging test. Synthetic world ONLY; no private backups.
Run inside a clean checkout: python tools/potential-v2-native-browser-staging.py
Requires playwright and installed Chromium/WebKit.
Local ephemeral HTTP origin cannot access the deployed Project Ice origin.
"""
import os, threading, json
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from playwright.sync_api import sync_playwright

PUBLIC=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','public'))
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass
    def do_GET(self):
        if self.path=="/staging-blank":
            body=b"<!doctype html><title>Disposable Potential 2.0 browser test</title>"
            mime="text/html"
        elif self.path in ("/prospects.js","/world.js"):
            with open(os.path.join(PUBLIC,self.path[1:]),'rb') as f:body=f.read()
            mime="application/javascript"
        else:
            self.send_error(404);return
        self.send_response(200);self.send_header("Content-Type",mime)
        self.send_header("Cache-Control","no-store")
        self.end_headers();self.wfile.write(body)

SETUP=r"""async () => {
  const careerId='SYNTHETIC_ONLY_native_browser';
  const key='career:'+careerId;
  const world=structuredClone(WorldEngine.state);
  world.currentDate='2025-09-04';world.currentSeason='2025-26';world.currentWeek=1;
  world.season={id:'hs-2025-2026',seasonId:'hs-2025-2026',
    seasonStartYear:2025,seasonEndYear:2026,
    currentDate:'2025-09-04',currentWeek:1,phase:'preseason',processedDates:[]};
  world.player={id:'synthetic-career',playerId:'synthetic-career',
    firstName:'Synthetic',lastName:'Fixture',potential:74,development:{potential:68}};
  world.teams.forEach((team,t)=>team.roster=Array.from({length:20},(_,i)=>{
    const career=t===0&&i===0,real=t===0&&i===1,tainted=t===0&&i===2;
    return{id:career?'synthetic-career':'synthetic-'+t+'-'+i,
      firstName:'Synthetic',lastName:'Player',
      position:i===19?'G':i%4===0?'D':'RW',
      isCareerPlayer:career,realPlayer:real,
      generatedIncomingFreshman:tainted,
      incomingClassSeasonId:tainted?'hs-2025-2026':undefined,
      highSchoolSeasonHistory:tainted?[{seasonStartYear:2024,age:15}]:[],
      age:16,overall:72,potential:career?74:75,
      development:{potential:career?68:75,attributeXP:{speed:21}},
      seasonStats:{gamesPlayed:0,points:0,minutesPlayed:0}};
  }));
  world.externalProspects=structuredClone(REAL_PROSPECTS);
  world.schedule=[];world.persistence={careerId,recordId:key,revision:4};
  const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('projectice_database',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('worlds',{keyPath:'id'});
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  await new Promise((resolve,reject)=>{
    const tx=db.transaction('worlds','readwrite');
    tx.objectStore('worlds').put({id:key,careerId,revision:4,
      savedAt:'2026-09-24T00:00:00Z',world});
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
  db.close();localStorage.setItem('projectice_active_career_id_v1',careerId);
  const ok=await WorldEngine.load();
  return{ok,teams:WorldEngine.state.teams.length,
    roster:WorldEngine.state.teams.flatMap(t=>t.roster).length,
    external:WorldEngine.state.externalProspects.length};
}"""
VERIFY=r"""async () => {
  const s=WorldEngine.state,players=s.teams.flatMap(t=>t.roster);
  const snapshot=()=>JSON.stringify(players.map(p=>[
    p.id,p.potential,p.development?.potential,
    p.development?.potentialConfidence,p.development?.potentialTrend,
    p.development?.potentialHistory]));
  const before=snapshot();
  const progress=WorldEngine.advanceToDate('2025-09-08',
    {maximumDays:7,save:false});
  const after=snapshot();
  const db=await new Promise((resolve,reject)=>{
    const r=indexedDB.open('projectice_database',1);
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  const records=await new Promise((resolve,reject)=>{
    const r=db.transaction('worlds','readonly').objectStore('worlds').getAll();
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });
  db.close();
  return{immutable:before===after,weekCount:progress.weeklyProcessingResults?.length,
    processed:s.livingWorld?.processedWeeks?.length,
    roster:players.length,root:players[0].potential,nested:players[0].development.potential,
    storageRevision:records[0]?.revision,records:records.length};
}"""
def main():
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    url=f"http://127.0.0.1:{server.server_port}/staging-blank"
    try:
        with sync_playwright() as p:
            for name in ('chromium','webkit'):
                browser=getattr(p,name).launch(headless=True)
                context=browser.new_context()
                page=context.new_page()
                page.goto(url)
                page.add_script_tag(url=f"http://127.0.0.1:{server.server_port}/prospects.js")
                page.add_script_tag(url=f"http://127.0.0.1:{server.server_port}/world.js")
                seeded=page.evaluate(SETUP)
                assert seeded=={'ok':True,'teams':8,'roster':160,'external':191},(name,seeded)
                checked=page.evaluate(VERIFY)
                assert checked['immutable'] and checked['weekCount']==1,(name,checked)
                assert checked['roster']==160 and checked['root']==74 and checked['nested']==68,(name,checked)
                assert checked['storageRevision']==4 and checked['records']==1,(name,checked)
                page.reload()
                page.add_script_tag(url=f"http://127.0.0.1:{server.server_port}/prospects.js")
                page.add_script_tag(url=f"http://127.0.0.1:{server.server_port}/world.js")
                assert page.evaluate('WorldEngine.load()') is True,name
                assert page.evaluate('WorldEngine.getCareerPlayer().potential')==74,name
                assert page.evaluate('WorldEngine.getCareerPlayer().development.potential')==68,name
                # Origin and fixture are disposable; clean native IDB before exit.
                page.evaluate("""async()=>{const db=await new Promise((res,rej)=>{
                  const r=indexedDB.deleteDatabase('projectice_database');
                  r.onsuccess=res;r.onerror=()=>rej(r.error)});localStorage.clear()}""")
                browser.close()
                print('PASS',name,'native IndexedDB durable reload, actual calendar, 160 protected records')
    finally:server.shutdown()
if __name__=='__main__':main()
