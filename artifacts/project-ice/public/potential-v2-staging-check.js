'use strict';
(() => {
  const EXPECTED_HOST='potential-v2-weekly-authority-staging-the-project-ice.danner821.workers.dev';
  const DB='projectice_database';
  const STORE='worlds';
  const LARGE_DB='projectice_POTENTIAL_V2_STAGING_LARGE_ONLY';
  const ACTIVE='projectice_active_career_id_v1';
  const PHASE='projectice_v2_staging_phase';
  const EXPECTED='projectice_v2_staging_expected';
  const LARGE_BYTES=58201562;
  const button=document.getElementById('runButton');
  const hostCard=document.getElementById('hostCard');
  const title=document.getElementById('resultTitle');
  const status=document.getElementById('status');
  const log=msg=>status.textContent+=(status.textContent?'\n':'')+msg;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const openDb=(name,version=1)=>new Promise((resolve,reject)=>{
    const req=indexedDB.open(name,version);
    req.onupgradeneeded=()=>{if(name===DB&&!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'});if(name===LARGE_DB&&!req.result.objectStoreNames.contains('fixture'))req.result.createObjectStore('fixture');};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
  const delDb=name=>new Promise((resolve,reject)=>{
    const req=indexedDB.deleteDatabase(name);
    req.onsuccess=()=>resolve(true);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('Database cleanup blocked: '+name));
  });
  const copy=x=>JSON.parse(JSON.stringify(x));
  const digest=async text=>{
    const bytes=new TextEncoder().encode(text);
    const hash=await crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
  };
  const signature=players=>JSON.stringify(players.map(p=>[
    p.id||p.playerId,p.potential,p.development?.potential,
    p.development?.potentialConfidence,p.development?.potentialTrend,
    p.development?.potentialHistory||[]
  ]));
  const readRecord=async key=>{
    const db=await openDb(DB);
    const value=await new Promise((resolve,reject)=>{
      const req=db.transaction(STORE,'readonly').objectStore(STORE).get(key);
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
    db.close();return value;
  };
  const writeRecord=async value=>{
    const db=await openDb(DB);
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value);
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('write aborted'));
    });db.close();
  };
  async function cleanup(){
    try{await delDb(DB)}catch{}
    try{await delDb(LARGE_DB)}catch{}
    localStorage.removeItem(ACTIVE);
    sessionStorage.removeItem(PHASE);sessionStorage.removeItem(EXPECTED);
  }
  function makeWorld(){
    const careerId='SYNTHETIC_ONLY_iphone_staging';
    const key='career:'+careerId;
    const world=copy(WorldEngine.state);
    world.currentDate='2025-09-04';world.currentSeason='2025-26';world.currentWeek=1;
    world.season={id:'hs-2025-2026',seasonId:'hs-2025-2026',seasonStartYear:2025,seasonEndYear:2026,currentDate:'2025-09-04',currentWeek:1,phase:'preseason',processedDates:[]};
    world.player={id:'synthetic-career',playerId:'synthetic-career',firstName:'Synthetic',lastName:'Career',potential:74,development:{potential:68}};
    world.teams.forEach((team,t)=>team.roster=Array.from({length:20},(_,i)=>{
      const career=t===0&&i===0,real=t===0&&i===1,tainted=t===0&&i===2;
      return{id:career?'synthetic-career':`synthetic-${t}-${i}`,firstName:'Synthetic',lastName:'Player',
        position:i===19?'G':i%4===0?'D':'RW',isCareerPlayer:career,realPlayer:real,
        generatedIncomingFreshman:tainted,incomingClassSeasonId:tainted?'hs-2025-2026':undefined,
        highSchoolSeasonHistory:tainted?[{seasonStartYear:2024,age:15}]:[],age:16,overall:career?72:62+i%12,
        potential:career?74:75,development:{potential:career?68:75,attributeXP:{speed:21}},
        seasonStats:{gamesPlayed:0,points:0,minutesPlayed:0}};
    }));
    world.externalProspects=copy(typeof REAL_PROSPECTS==='undefined'?[]:REAL_PROSPECTS);
    world.schedule=[];world.persistence={careerId,recordId:key,revision:4};
    return{careerId,key,world};
  }
  async function largeWrite(){
    log('Generating 58,201,562 bytes of fictional data…');
    const payload='S'.repeat(LARGE_BYTES),expected=await digest(payload);
    const db=await openDb(LARGE_DB);
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('fixture','readwrite');tx.objectStore('fixture').put(payload,'fictional');
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('large write aborted'));
    });db.close();
    const check=await openDb(LARGE_DB);
    const got=await new Promise((resolve,reject)=>{
      const req=check.transaction('fixture','readonly').objectStore('fixture').get('fictional');
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });check.close();
    if(got?.length!==LARGE_BYTES||await digest(got)!==expected)throw new Error('58 MB first checksum mismatch');
    return expected;
  }
  async function largeRecheck(expected){
    const db=await openDb(LARGE_DB);
    const got=await new Promise((resolve,reject)=>{
      const req=db.transaction('fixture','readonly').objectStore('fixture').get('fictional');
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });db.close();
    if(got?.length!==LARGE_BYTES||await digest(got)!==expected)throw new Error('58 MB reload checksum mismatch');
  }
  async function firstPass(){
    button.disabled=true;title.textContent='Running…';title.className='';
    status.textContent='';
    await cleanup();
    if(typeof WorldEngine==='undefined')throw new Error('WorldEngine did not load');
    const {careerId,key,world}=makeWorld();
    if(world.teams.length!==8||world.teams.flatMap(t=>t.roster).length!==160)throw new Error('Synthetic roster creation failed');
    if(world.externalProspects.length!==191)throw new Error('Expected 191 curated external prospects');
    await writeRecord({id:key,careerId,revision:4,savedAt:new Date().toISOString(),world});
    localStorage.setItem(ACTIVE,careerId);
    if(!await WorldEngine.load())throw new Error('WorldEngine failed to load synthetic career');
    const players=WorldEngine.state.teams.flatMap(t=>t.roster);
    const before=signature(players);
    const progress=WorldEngine.advanceToDate('2025-09-08',{maximumDays:7,save:false});
    if(progress.weeklyProcessingResults?.length!==1)throw new Error('Expected one weekly processing boundary');
    if(signature(players)!==before)throw new Error('Potential state changed during protected first week');
    const career=WorldEngine.getCareerPlayer();
    if(career.potential!==74||career.development?.potential!==68)throw new Error('74/68 guard did not hold');
    log('PASS · actual staged WorldEngine first weekly boundary');
    log('PASS · 160/160 fictional potential records unchanged');
    log('PASS · fictional 74 / 68 conflict preserved');
    if(!await WorldEngine.save())throw new Error('Synthetic save failed');
    const saved=await readRecord(key);
    const gameSha=await digest(JSON.stringify(saved));
    log('PASS · synthetic career saved to preview-origin IndexedDB');
    const largeSha=await largeWrite();
    log('PASS · 58 MB synthetic write + first SHA-256');
    sessionStorage.setItem(EXPECTED,JSON.stringify({key,gameSha,largeSha,careerId}));
    sessionStorage.setItem(PHASE,'reload');
    log('Reloading once to verify durable storage…');
    await sleep(350);
    location.reload();
  }
  async function secondPass(){
    button.disabled=true;title.textContent='Verifying after reload…';status.textContent='';
    const expected=JSON.parse(sessionStorage.getItem(EXPECTED)||'null');
    if(!expected)throw new Error('Missing reload checkpoint');
    if(!await WorldEngine.load())throw new Error('WorldEngine failed to reload synthetic career');
    const saved=await readRecord(expected.key);
    if(await digest(JSON.stringify(saved))!==expected.gameSha)throw new Error('Synthetic career checksum changed after reload');
    const career=WorldEngine.getCareerPlayer();
    if(career.potential!==74||career.development?.potential!==68)throw new Error('74/68 changed after reload');
    log('PASS · synthetic career durable after page reload');
    log('PASS · 74 / 68 still preserved after reload');
    await largeRecheck(expected.largeSha);
    log('PASS · 58 MB synthetic SHA-256 still matches after reload');
    await cleanup();
    title.textContent='PASS — staging check complete';title.className='pass';
    log('PASS · preview-only databases cleaned up');
    log('Your real Project Ice career was never opened.');
  }
  async function fail(error){
    title.textContent='FAIL — do not merge';title.className='fail';
    log('ERROR · '+(error?.message||String(error)));
    try{await cleanup();log('Cleanup attempted.');}catch{}
    button.disabled=false;
  }
  const correct=location.hostname===EXPECTED_HOST;
  hostCard.className='card '+(correct?'safe':'warn');
  hostCard.innerHTML=correct
    ? '<strong>Correct isolated Cloudflare branch preview.</strong><br>This origin is separate from production.'
    : '<strong>Wrong host — test disabled.</strong><br>Do not run this page on production or another domain.';
  button.disabled=!correct;
  button.addEventListener('click',()=>firstPass().catch(fail));
  if(correct&&sessionStorage.getItem(PHASE)==='reload')secondPass().catch(fail);
})();