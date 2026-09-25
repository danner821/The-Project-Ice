'use strict';
/* Test exact production Continue button logic without browser or user data.
 * Run: node tools/potential-v2-continue-button.test.js
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../public/game.js'), 'utf8');
const begin = code.indexOf('  function updateContinueButton() {');
const end = code.indexOf('\n// ── DEV SHORTCUT', begin);
assert(begin >= 0 && end > begin, 'Find current production Continue button source');
const source = code.slice(begin, end);
function test({active=null,preview=null,index=null,canonical=false}) {
  const store = new Map();
  if (preview) store.set('projectice_save', preview);
  if (index) store.set('projectice_career_save_index_v1', JSON.stringify(index));
  const button = {
    disabled: true,
    innerHTML: '',
    classList: { add() {}, remove() {} }
  };
  const update = new Function('WorldEngine', 'localStorage', 'SAVE_KEY',
    'hasCanonicalCareerWorld', 'btnContinue', source + '\nreturn updateContinueButton;')(
      {getActiveCareerId:()=>active},
      {getItem:key=>store.get(key) ?? null},
      'projectice_save', ()=>canonical, button);
  update();
  return button;
}
assert.equal(test({active:'real-career'}).disabled, false,
  'Active IndexedDB career must remain continuable when preview/cache/load is unavailable');
assert.equal(test({}).disabled, true, 'Never enable Continue for a genuinely new career');
assert.equal(test({preview:'{"player":{}}'}).disabled, false,
  'Legacy preview continues to be recognized');
assert.equal(test({index:[{careerId:'another-save'}]}).disabled, false,
  'Existing career index continues to be recognized');
assert.equal(test({canonical:true}).disabled, false,
  'Successfully loaded canonical world continues to be recognized');
console.log('PASS: exact production Continue button, five fail-closed/legacy scenarios');
