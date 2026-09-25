/* Project Ice Potential 2.0 — OFFLINE migration rehearsal.
 * Produces a modified COPY for testing, never writes game data, never loaded
 * by the app. Requires an explicit per-player reviewed plan; the evaluator
 * cannot generate one. Use only after backup recovery/approval gates pass.
 */
'use strict';
const {tier}=require('./potential-v2-weekly-shadow');
const jsonCopy=x=>JSON.parse(JSON.stringify(x));
const validNumber=n=>Number.isInteger(n)&&n>=25&&n<=99;
function core(world){
  const roster=(world.teams||[]).flatMap(t=>Array.isArray(t.roster)?t.roster:[]);
  return{
    gameDate:world.currentDate||world.season?.currentDate,
    season:jsonCopy(world.season||{}),
    schedule:jsonCopy(world.schedule||[]),
    external:jsonCopy(world.externalProspects||[]),
    historical:roster.map(p=>({id:p.id||p.playerId,stats:jsonCopy(p.seasonStats||{}),
      history:jsonCopy(p.highSchoolSeasonHistory||[]),
      attributes:jsonCopy(p.attributes||{}),
      xp:jsonCopy(p.development?.attributeXP||{}),
      upgradeCounts:jsonCopy(p.development?.attributeUpgradeCounts||{}),
      overall:p.overall})),
    worldPlayerNonPotential:(()=>{
      const player=jsonCopy(world.player||{});
      delete player.potential;delete player.potentialRole;
      delete player.potentialAccuracy;delete player.potentialConfidence;
      delete player.potentialTrend;delete player.potentialHistory;
      if(player.development){
        delete player.development.potential;
        delete player.development.potentialRole;
        delete player.development.potentialAccuracy;
        delete player.development.potentialConfidence;
        delete player.development.potentialTrend;
        delete player.development.potentialHistory;
      }
      return player;
    })()
  };
}
function rehearsal(backup,plan){
  if(backup?.format!=='projectice-career-backup'||backup.version!==1||
     backup?.activeRecord?.id!=='career:'+backup.activeCareerId||
     !backup.activeRecord?.world||!Array.isArray(plan?.players))
    throw Error('Invalid backup or explicit review plan.');
  const original=backup.activeRecord.world;
  const currentDate=String(original.currentDate||original.season?.currentDate||'');
  if(plan.expectedCareerId!==backup.activeCareerId||
     plan.expectedDate!==currentDate||
     plan.expectedRevision!==backup.activeRecord.revision)
    throw Error('Plan baseline does not match the backup identity, game date and revision.');
  const clone=jsonCopy(original),roster=clone.teams.flatMap(t=>Array.isArray(t.roster)?t.roster:[]);
  const keys=new Set(),changes=[];
  for(const selection of plan.players){
    const id=String(selection?.id||'');
    if(!id||keys.has(id))throw Error('Missing or repeated player identity in review plan.');
    keys.add(id);
    const players=roster.filter(p=>String(p.id||p.playerId||'')===id);
    if(players.length!==1)throw Error('Player missing or duplicated in generated roster: '+id);
    const player=players[0];
    if(player.realPlayer===true||player.persistentProspect===true)
      throw Error('Real prospect is not eligible for historical recalibration: '+id);
    if(!validNumber(selection.fromRoot)||!validNumber(selection.fromDevelopment)||
       !validNumber(selection.to))
      throw Error('Explicit original root, development and target ratings required.');
    if(player.potential!==selection.fromRoot||
       player.development?.potential!==selection.fromDevelopment)
      throw Error('Potential baseline changed since the reviewed audit: '+id);
    if(!selection.reason||!selection.reviewed)
      throw Error('Human-reviewed evidence and a reason are required: '+id);
    const next=tier(selection.to,player.position);
    const oldRole=tier(selection.fromRoot,player.position);
    const changed=selection.to!==selection.fromRoot||
      selection.to!==selection.fromDevelopment;
    const direction=selection.to>selection.fromRoot?'rising':
      selection.to<selection.fromRoot?'falling':'stable';
    if(!player.development||typeof player.development!=='object')
      throw Error('Canonical development record missing: '+id);
    player.potential=selection.to;
    player.potentialRole=next;
    player.development.potential=selection.to;
    player.development.potentialRole=next;
    if(changed){
      player.development.potentialConfidence=55;
      player.development.potentialAccuracy='Medium';
      player.development.potentialTrend=direction;
      // Keep existing player-facing legacy fields consistent with the canonical
      // development projection. This is a disposable rehearsal, not live code.
      player.potentialAccuracy='Medium';
      player.potentialConfidence=55;
      player.potentialTrend=direction;
      player.development.potentialHistory=[
        ...(Array.isArray(player.development.potentialHistory)?
          player.development.potentialHistory:[]),
        {kind:'reviewed-migration-preview',date:currentDate,
         from:selection.fromRoot,nestedFrom:selection.fromDevelopment,
         to:selection.to,fromRole:oldRole,toRole:next,confidence:55,
         reason:String(selection.reason)}
      ];
    }
    if(player.isCareerPlayer===true){
      if(!clone.player||typeof clone.player!=='object')
        throw Error('Missing root career player: '+id);
      const rootId=String(clone.player.playerId||clone.player.id||'');
      if(rootId&&rootId!==id)
        throw Error('Root career player identity conflicts with roster: '+id);
      clone.player.potential=selection.to;
      clone.player.potentialRole=next;
      if(changed){
        if(Object.hasOwn(clone.player,'potentialAccuracy'))
          clone.player.potentialAccuracy='Medium';
        if(Object.hasOwn(clone.player,'potentialConfidence'))
          clone.player.potentialConfidence=55;
        if(Object.hasOwn(clone.player,'potentialTrend'))
          clone.player.potentialTrend=direction;
      }
      if(clone.player.development){
        clone.player.development.potential=selection.to;
        clone.player.development.potentialRole=next;
        if(changed){
          clone.player.development.potentialConfidence=55;
          clone.player.development.potentialAccuracy='Medium';
          clone.player.development.potentialTrend=direction;
          clone.player.development.potentialHistory=jsonCopy(
            player.development.potentialHistory);
        }
      }
    }
    changes.push({id,fromRoot:selection.fromRoot,
      fromDevelopment:selection.fromDevelopment,to:selection.to,
      role:next,changed});
  }
  if(JSON.stringify(core(original))!==JSON.stringify(core(clone)))
    throw Error('Non-potential gameplay fields changed in migration rehearsal.');
  return{readOnly:true,approvedForLive:false,
    baseline:{date:currentDate,revision:backup.activeRecord.revision},
    previewCount:changes.length,changes,previewWorld:clone};
}
module.exports={rehearsal,core};
