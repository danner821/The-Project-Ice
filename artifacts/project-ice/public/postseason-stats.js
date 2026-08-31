'use strict';

/* global WorldEngine */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  const SKATER_KEYS=['gamesPlayed','goals','assists','points','plusMinus','penaltyMinutes','shots','powerPlayGoals','powerPlayPoints','shorthandedGoals','gameWinningGoals','minutesPlayed'];
  const GOALIE_KEYS=['gamesPlayed','gamesStarted','wins','losses','overtimeLosses','shotsAgainst','saves','goalsAgainst','savePercentage','goalsAgainstAverage','shutouts','minutesPlayed'];
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const idOf=p=>String(p?.playerId||p?.id||'');
  const goalie=p=>String(p?.position||'').toUpperCase()==='G';
  const emptySkater=()=>({gamesPlayed:0,goals:0,assists:0,points:0,plusMinus:0,penaltyMinutes:0,shots:0,powerPlayGoals:0,powerPlayPoints:0,shorthandedGoals:0,gameWinningGoals:0,minutesPlayed:0});
  const emptyGoalie=()=>({gamesPlayed:0,gamesStarted:0,wins:0,losses:0,overtimeLosses:0,shotsAgainst:0,saves:0,goalsAgainst:0,savePercentage:0,goalsAgainstAverage:0,shutouts:0,minutesPlayed:0});
  const emptyFor=p=>goalie(p)?emptyGoalie():emptySkater();
  const clone=v=>typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v));

  function resultFor(event){
    const s=event?.postgameSummary;
    return event?.gameResult||s?.gameResult||s?.result||event?.result||event?.finalResult||s||null;
  }
  function hasFinalScore(event,result){
    const h=result?.home?.score??result?.teams?.home?.score??result?.boxScore?.home?.score??event?.homeScore;
    const a=result?.away?.score??result?.teams?.away?.score??result?.boxScore?.away?.score??event?.awayScore;
    return Number.isFinite(Number(h))&&Number.isFinite(Number(a));
  }
  function completedPlayoffGames(){
    return (WorldEngine.state?.schedule||[]).filter(event=>{
      if(event?.isPlayoff!==true)return false;
      const result=resultFor(event),status=String(event?.status||'').toLowerCase();
      return event?.played===true||event?.completed===true||status==='final'||hasFinalScore(event,result)||Boolean(result);
    });
  }
  const side=(result,key)=>result?.[key]||result?.teams?.[key]||result?.boxScore?.[key]||null;
  const skaterLines=s=>s?.skaters||s?.players?.skaters||s?.playerStats?.skaters||[];
  const goalieLines=s=>s?.goalies||s?.players?.goalies||s?.playerStats?.goalies||[];

  function addSkater(t,l){
    if(l?.dressed!==false&&num(l?.gamesPlayed??1)>0)t.gamesPlayed+=1;
    t.goals+=Math.max(0,num(l?.goals));t.assists+=Math.max(0,num(l?.assists));t.points=t.goals+t.assists;
    t.plusMinus+=num(l?.plusMinus);t.penaltyMinutes+=Math.max(0,num(l?.penaltyMinutes));t.shots+=Math.max(0,num(l?.shots));
    t.powerPlayGoals+=Math.max(0,num(l?.powerPlayGoals));t.powerPlayPoints+=Math.max(0,num(l?.powerPlayPoints));
    t.shorthandedGoals+=Math.max(0,num(l?.shorthandedGoals));t.gameWinningGoals+=Math.max(0,num(l?.gameWinningGoals));
    t.minutesPlayed+=Math.max(0,num(l?.minutesPlayed)||num(l?.timeOnIceSeconds)/60);
  }
  function addGoalie(t,l){
    const m=Math.max(0,num(l?.minutesPlayed)||num(l?.timeOnIceSeconds)/60),gp=Math.max(0,num(l?.gamesPlayed));
    t.gamesPlayed+=gp||(m>0?1:0);t.gamesStarted+=l?.started===true?1:Math.max(0,num(l?.gamesStarted));
    t.wins+=Math.max(0,num(l?.wins));t.losses+=Math.max(0,num(l?.losses));t.overtimeLosses+=Math.max(0,num(l?.overtimeLosses));
    t.shotsAgainst+=Math.max(0,num(l?.shotsAgainst));t.saves+=Math.max(0,num(l?.saves));t.goalsAgainst+=Math.max(0,num(l?.goalsAgainst));
    t.shutouts+=l?.shutout===true?1:Math.max(0,num(l?.shutouts));t.minutesPlayed+=m;
    t.savePercentage=t.shotsAgainst>0?t.saves/t.shotsAgainst:0;t.goalsAgainstAverage=t.minutesPlayed>0?t.goalsAgainst*60/t.minutesPlayed:0;
  }
  function subtract(total,playoffs,isG){
    const out=isG?emptyGoalie():emptySkater(),keys=isG?GOALIE_KEYS.filter(k=>!['savePercentage','goalsAgainstAverage'].includes(k)):SKATER_KEYS;
    keys.forEach(k=>{out[k]=num(total?.[k])-num(playoffs?.[k]);if(k!=='plusMinus')out[k]=Math.max(0,out[k]);});
    if(isG){out.savePercentage=out.shotsAgainst>0?out.saves/out.shotsAgainst:0;out.goalsAgainstAverage=out.minutesPlayed>0?out.goalsAgainst*60/out.minutesPlayed:0;}else out.points=out.goals+out.assists;
    return out;
  }

  function rebuild(){
    const games=completedPlayoffGames(),players=WorldEngine.getAllWorldPlayers?.()||[],byId=new Map(players.map(p=>[idOf(p),p]).filter(x=>x[0]));
    const collected=new Map(),teamStats={};
    const team=(id)=>{id=String(id||'');if(!id)return null;return teamStats[id]||(teamStats[id]={teamId:id,gamesPlayed:0,wins:0,losses:0,goalsFor:0,goalsAgainst:0,shotsFor:0,shotsAgainst:0,powerPlayGoals:0,powerPlayOpportunities:0});};
    const ensurePlayer=(id,isG)=>{id=String(id||'');if(!id)return null;if(!collected.has(id))collected.set(id,isG?emptyGoalie():emptySkater());return collected.get(id);};

    for(const event of games){
      const result=resultFor(event);if(!result)continue;
      const homeSide=side(result,'home'),awaySide=side(result,'away');
      for(const s of [homeSide,awaySide]){
        skaterLines(s).forEach(l=>{const t=ensurePlayer(l?.playerId,false);if(t)addSkater(t,l);});
        goalieLines(s).forEach(l=>{const t=ensurePlayer(l?.playerId,true);if(t)addGoalie(t,l);});
      }
      const homeId=result?.homeTeamId||homeSide?.teamId||event?.homeTeamId,awayId=result?.awayTeamId||awaySide?.teamId||event?.awayTeamId;
      const h=team(homeId),a=team(awayId);if(!h||!a)continue;
      const hs=num(homeSide?.score??result?.teams?.home?.score??event?.homeScore),as=num(awaySide?.score??result?.teams?.away?.score??event?.awayScore);
      const hsh=num(homeSide?.shots??result?.teams?.home?.shots),ash=num(awaySide?.shots??result?.teams?.away?.shots);
      h.gamesPlayed++;a.gamesPlayed++;h.goalsFor+=hs;h.goalsAgainst+=as;a.goalsFor+=as;a.goalsAgainst+=hs;h.shotsFor+=hsh;h.shotsAgainst+=ash;a.shotsFor+=ash;a.shotsAgainst+=hsh;
      h.powerPlayGoals+=num(homeSide?.powerPlayGoals);h.powerPlayOpportunities+=num(homeSide?.powerPlayOpportunities);a.powerPlayGoals+=num(awaySide?.powerPlayGoals);a.powerPlayOpportunities+=num(awaySide?.powerPlayOpportunities);
      let winner=String(result?.winnerTeamId||event?.winnerTeamId||'');if(!winner&&hs!==as)winner=hs>as?String(homeId):String(awayId);
      if(winner===String(homeId)){h.wins++;a.losses++;}else if(winner===String(awayId)){a.wins++;h.losses++;}
    }

    // Only overwrite players for whom the stored playoff box scores actually contain lines.
    // This prevents a UI refresh from erasing valid postseason stats when an older result has only a final score.
    for(const [id,stats] of collected){const p=byId.get(id)||WorldEngine.getPlayerById?.(id);if(p)p.postseasonStats=stats;}
    const state=WorldEngine.state;state.postseason=state.postseason||{};state.postseason.highSchool=state.postseason.highSchool||{};
    state.postseason.highSchool.statistics={rebuiltAt:new Date().toISOString(),completedGameIds:games.map(e=>e.gameId||e.eventId||e.id).filter(Boolean),teams:teamStats};
    return {success:true,completedGames:games.length,playerLines:collected.size,players:players.length,teams:Object.keys(teamStats).length};
  }

  function resolvePlayer(v){return v&&typeof v==='object'?v:WorldEngine.getPlayerById?.(v)||null;}
  function getPlayerStatsByScope(v,scope='regularSeason'){
    const p=resolvePlayer(v);if(!p)return null;rebuild();const po=p.postseasonStats||emptyFor(p),season=p.seasonStats||emptyFor(p),s=String(scope||'').toLowerCase();
    if(s==='playoffs'||s==='postseason')return clone(po);if(['total','combined','season'].includes(s))return clone(season);return subtract(season,po,goalie(p));
  }
  function getTeamStatsByScope(teamId,scope='regularSeason'){
    rebuild();const t=WorldEngine.getTeamById?.(teamId);if(!t)return null;const po=WorldEngine.state?.postseason?.highSchool?.statistics?.teams?.[String(teamId)]||{teamId:String(teamId||''),gamesPlayed:0,wins:0,losses:0,goalsFor:0,goalsAgainst:0,shotsFor:0,shotsAgainst:0,powerPlayGoals:0,powerPlayOpportunities:0};
    const s=String(scope||'').toLowerCase();if(s==='playoffs'||s==='postseason')return clone(po);
    return {teamId:t.teamId,wins:Math.max(0,num(t.wins)-num(po.wins)),losses:Math.max(0,num(t.losses)-num(po.losses)),overtimeLosses:Math.max(0,num(t.overtimeLosses)),goalsFor:Math.max(0,num(t.goalsFor)-num(po.goalsFor)),goalsAgainst:Math.max(0,num(t.goalsAgainst)-num(po.goalsAgainst)),points:Math.max(0,num(t.points)-num(po.wins)*2)};
  }

  WorldEngine.rebuildHighSchoolPostseasonStats=rebuild;WorldEngine.getPlayerStatsByScope=getPlayerStatsByScope;WorldEngine.getTeamStatsByScope=getTeamStatsByScope;WorldEngine.getHighSchoolPostseasonStatistics=()=>{rebuild();return WorldEngine.state?.postseason?.highSchool?.statistics||null;};
  const adv=WorldEngine.advanceToDate?.bind(WorldEngine);if(adv)WorldEngine.advanceToDate=function(...args){const r=adv(...args);rebuild();return r;};
  const fin=WorldEngine.finalizeLiveGameSimulation?.bind(WorldEngine);if(fin)WorldEngine.finalizeLiveGameSimulation=function(...args){const r=fin(...args);rebuild();return r;};
  rebuild();
})();
