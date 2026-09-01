from pathlib import Path

p=Path('artifacts/project-ice/public/travel-hockey-roster-world.js')
s=p.read_text(encoding='utf-8')
s=s.replace('const VERSION=7;','const VERSION=8;',1)
old="""for(const team of state.teams){meta(team);const m=CLUB_META[clubId(team)]||{},roster=[];const counts=()=>({F:roster.filter(p=>!['D','G'].includes(pos(p))).length,D:roster.filter(p=>pos(p)==='D').length,G:roster.filter(p=>pos(p)==='G').length});
      const add=(pool,maxProspects=Infinity)=>{for(const raw of pool){if(roster.length>=20)break;const key=String(raw.sourcePlayerId||pid(raw)||pname(raw).toLowerCase());if(!key||used.has(key))continue;const bucket=pos(raw)==='G'?'G':pos(raw)==='D'?'D':'F',limit={F:12,D:6,G:2}[bucket];if(counts()[bucket]>=limit)continue;if(raw.isRealProspect&&roster.filter(p=>p.isRealProspect).length>=maxProspects)continue;const p={...raw};p.position=naturalPos(p);if(p.position==='D')p.position=roster.filter(x=>naturalPos(x)==='LD').length<=roster.filter(x=>naturalPos(x)==='RD').length?'LD':'RD';p.travelStats=oldStats.get(key)||p.travelStats||blankStats();used.add(key);roster.push(p);}};
      add(seeded(prospects,team.teamId),4);add(seeded(others,`world:${team.teamId}`));while(counts().F<12)roster.push(generated(team,counts().F,level,m.strength||0));while(counts().D<6){const p=generated(team,12+counts().D,level,m.strength||0);p.position=counts().D%2===0?'LD':'RD';roster.push(p);}while(counts().G<2){const p=generated(team,18+counts().G,level,m.strength||0);p.position='G';roster.push(p);}team.roster=roster.slice(0,20);lineup(team);
    }
"""
new="""for(const team of state.teams){meta(team);const m=CLUB_META[clubId(team)]||{},roster=[];
      const counts=()=>({
        LW:roster.filter(p=>naturalPos(p)==='LW').length,
        C:roster.filter(p=>naturalPos(p)==='C').length,
        RW:roster.filter(p=>naturalPos(p)==='RW').length,
        LD:roster.filter(p=>naturalPos(p)==='LD').length,
        RD:roster.filter(p=>naturalPos(p)==='RD').length,
        G:roster.filter(p=>naturalPos(p)==='G').length,
      });
      const quota={LW:4,C:4,RW:4,LD:3,RD:3,G:2};
      const add=(pool,maxProspects=Infinity)=>{for(const raw of pool){if(roster.length>=20)break;const key=String(raw.sourcePlayerId||pid(raw)||pname(raw).toLowerCase());if(!key||used.has(key))continue;if(raw.isRealProspect&&roster.filter(p=>p.isRealProspect).length>=maxProspects)continue;const p={...raw};let np=naturalPos(p);if(np==='D')np=counts().LD<=counts().RD?'LD':'RD';if(!(np in quota)||counts()[np]>=quota[np])continue;p.position=np;p.travelStats=oldStats.get(key)||p.travelStats||blankStats();used.add(key);roster.push(p);}};
      add(seeded(prospects,team.teamId),4);add(seeded(others,`world:${team.teamId}`));
      const fill=(want,slotBase)=>{while(counts()[want]<quota[want]){const slot=slotBase+counts()[want];const p=generated(team,slot,level,m.strength||0);p.position=want;roster.push(p);}};
      fill('LW',0);fill('C',1);fill('RW',2);fill('LD',12);fill('RD',13);fill('G',18);
      team.roster=roster.slice(0,20);lineup(team);
    }
"""
if old not in s: raise SystemExit('roster composition anchor not found')
s=s.replace(old,new,1)
# Make career insertion preserve exact natural position so adding the career player does not create a hole.
old2="""const careerBucket=pos(career);const replace=mine.roster.findIndex(p=>pos(p)===careerBucket);if(replace>=0)mine.roster.splice(replace,1);else if(mine.roster.length)mine.roster.pop();career.position=naturalPos(career);"""
new2="""let careerPosition=naturalPos(career);if(careerPosition==='D')careerPosition='LD';const replace=mine.roster.findIndex(p=>naturalPos(p)===careerPosition);if(replace>=0)mine.roster.splice(replace,1);else{const broad=pos(career);const fallback=mine.roster.findIndex(p=>pos(p)===broad);if(fallback>=0)mine.roster.splice(fallback,1);else if(mine.roster.length)mine.roster.pop();}career.position=careerPosition;"""
if old2 not in s: raise SystemExit('career insertion anchor not found')
s=s.replace(old2,new2,1)
p.write_text(s,encoding='utf-8')
print('TRAVEL_LINEUP_HOLE_REPAIR=OK')
