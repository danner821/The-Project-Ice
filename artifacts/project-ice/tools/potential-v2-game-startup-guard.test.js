'use strict';
/* Run: node artifacts/project-ice/tools/potential-v2-game-startup-guard.test.js
 * Extracts the ACTUAL app init function. No real browser, career or storage.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../public/game.js'),'utf8');
const begin=code.lastIndexOf('// ── App initialization');
const end=code.indexOf("\ndocument.addEventListener('DOMContentLoaded', init);",begin);
assert.ok(begin>=0&&end>begin,'exact production init function must exist');
const source=code.slice(begin,end);
const make=(loadResult,active)=>{
 const called=[];
 const world={
   load:async()=>{called.push('load');return loadResult;},
   getActiveCareerId:()=>active,
   ensureGeneratedRosters:async()=>called.push('rosters')
 };
 const fn=new Function('WorldEngine','recoverCareerPreviewFromWorld',
   'updateContinueButton','updateDevShortcut','showScreen','console',
   source+';return init;')(
     world,()=>called.push('preview'),()=>called.push('continue'),
     ()=>called.push('dev'),name=>called.push('screen:'+name),
     {error:()=>called.push('load-error')});
 return{fn,called};
};
(async()=>{
 const healthy=make(true,'real-career');
 await healthy.fn();
 assert.deepEqual(healthy.called,
   ['load','rosters','preview','continue','dev','screen:title'],
   'an established healthy career initializes normally');
 const unavailable=make(false,'real-career');
 await unavailable.fn();
 assert.deepEqual(unavailable.called,
   ['load','load-error','continue','dev','screen:title'],
   'existing career load failure cannot generate fake rosters or a preview');
 const newCareer=make(false,null);
 await newCareer.fn();
 assert.deepEqual(newCareer.called,
   ['load','rosters','preview','continue','dev','screen:title'],
   'first-ever new career still initializes');
 assert.equal(source.includes('WorldEngine.getActiveCareerId()'),true);
 assert.equal(source.includes("showScreen('title');\n    return;"),true,
   'unavailable loaded career must stop before any roster mutation');
 console.log('PASS: three source-extracted game.js startup scenarios');
})().catch(e=>{console.error(e);process.exitCode=1;});
