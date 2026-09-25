'use strict';
const assert=require('node:assert/strict');
const {provenance,validateWorld}=require('./potential-v2-validated-review');
const seasons=(a,b)=>[{seasonStartYear:2023,age:a},{seasonStartYear:2024,age:b}];
assert.equal(provenance({age:16},seasons(15,16)).status,'coherent');
assert.equal(provenance({age:17},seasons(15,16)).status,'coherent');
assert.equal(provenance({age:15},seasons(19,15)).reason,'HISTORICAL_AGE_DISCONTINUITY');
assert.equal(provenance({age:14},seasons(18,19)).reason,'CURRENT_AGE_DISCONTINUITY');
assert.equal(provenance({age:18},seasons(15,16)).status,'coherent');
assert.equal(provenance({age:20},seasons(15,16)).status,'quarantined');
assert.equal(provenance({age:16},[seasons(15,16)[0]]).status,'missing-archive');
assert.equal(provenance({age:16},[{seasonStartYear:2022,age:15},{seasonStartYear:2024,age:16}]).reason,'NONCONSECUTIVE_ARCHIVE_YEARS');
const {validateWorld:validate}=require('./potential-v2-validated-review');
const make=(id,age,h)=>({id,age,position:'RW',overall:60,potential:74,development:{potential:74},
 highSchoolSeasonHistory:h.map(z=>({...z,regularSeasonStats:{gamesPlayed:28,minutesPlayed:500,points:12,shots:40}}))});
const world={currentDate:'2025-09-04',teams:[{roster:[
 make('clean',16,seasons(15,16)),make('bad',14,seasons(18,19)),
 {id:'real',realPlayer:true,position:'RW',age:16,potential:90}]}],
 externalProspects:[{id:'outside',realPlayer:true,potential:99}]};
const before=JSON.stringify(world),out=validate(world);
assert.equal(JSON.stringify(world),before,'never mutate source world');
assert.equal(out.integrity.CHRONOLOGICAL_IDENTITY_COHERENCE,1);
assert.equal(out.integrity.CURRENT_AGE_DISCONTINUITY,1);
assert.equal(out.shadowReviews['quarantined-age-identity'],1);
assert.equal(out.calibrationStatuses['quarantined-age-identity'],1);
assert.equal(out.players.length,2,'real players must be excluded');
assert.equal(out.players.find(p=>p.id==='bad').evidence.scenarios[0].evidence.status,'withheld');
// Incoming class is independent identity evidence, even if the ages match.
const coincidental={...make('coincidental',17,seasons(15,16)),
 generatedIncomingFreshman:true,incomingClassSeasonId:'hs-2024-2025'};
assert.equal(provenance(coincidental,coincidental.highSchoolSeasonHistory).reason,
 'ARCHIVE_PREDATES_PLAYER_GENERATION');
const legitimate={...make('legitimate',16,
 [{seasonStartYear:2024,age:15},{seasonStartYear:2025,age:16}]),
 generatedIncomingFreshman:true,incomingClassSeasonId:'hs-2024-2025'};
assert.equal(provenance(legitimate,legitimate.highSchoolSeasonHistory).status,'coherent');
const extended={...world,teams:[{roster:[...world.teams[0].roster,coincidental,legitimate]}]};
const frozen=JSON.stringify(extended),verified=validate(extended);
assert.equal(JSON.stringify(extended),frozen,'audit is immutable');
assert.equal(verified.integrity.ARCHIVE_PREDATES_PLAYER_GENERATION,1);
assert.equal(verified.shadowReviews['quarantined-age-identity'],2);
assert.equal(verified.players.find(p=>p.id==='coincidental').evidence.scenarios[0].evidence.status,'withheld');
console.log('PASS: age + incoming-class identity guards, clean peers and immutable source');

