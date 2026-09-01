from pathlib import Path

path = Path('artifacts/project-ice/public/travel-hockey-roster-world.js')
text = path.read_text(encoding='utf-8')

text = text.replace('const VERSION=6;', 'const VERSION=7;', 1)

old_pos = """  const pos=p=>{\n    const r=String(p?.position||p?.pos||'').trim().toUpperCase();\n    if(r==='G'||r==='GK'||r.includes('GOAL'))return'G';\n    if(r==='D'||r==='LD'||r==='RD'||r==='LHD'||r==='RHD'||r.includes('DEF'))return'D';\n    if(r==='LW'||r==='LF'||r.includes('LEFT WING'))return'LW';\n    if(r==='RW'||r==='RF'||r.includes('RIGHT WING'))return'RW';\n    return'C';\n  };\n"""
new_pos = """  const naturalPos=p=>{\n    const r=String(p?.position||p?.pos||'').trim().toUpperCase();\n    if(r==='G'||r==='GK'||r.includes('GOAL'))return'G';\n    if(r==='LD'||r==='LHD'||r.includes('LEFT DEF'))return'LD';\n    if(r==='RD'||r==='RHD'||r.includes('RIGHT DEF'))return'RD';\n    if(r==='D'||r.includes('DEF'))return'D';\n    if(r==='LW'||r==='LF'||r.includes('LEFT WING'))return'LW';\n    if(r==='RW'||r==='RF'||r.includes('RIGHT WING'))return'RW';\n    return'C';\n  };\n  const pos=p=>{\n    const r=naturalPos(p);\n    return r==='LD'||r==='RD'||r==='D' ? 'D' : r;\n  };\n"""
if old_pos not in text:
    raise SystemExit('position normalizer anchor missing')
text = text.replace(old_pos, new_pos, 1)

text = text.replace('position:pos(p),overall:ovr(p)', 'position:naturalPos(p),overall:ovr(p)', 1)
text = text.replace("positions=['LW','C','RW','LW','C','RW','LW','C','RW','LW','C','RW','D','D','D','D','D','D','G','G']", "positions=['LW','C','RW','LW','C','RW','LW','C','RW','LW','C','RW','LD','RD','LD','RD','LD','RD','G','G']", 1)
text = text.replace('const p={...raw};p.position=pos(p);', "const p={...raw};p.position=naturalPos(p);if(p.position==='D')p.position=roster.filter(x=>naturalPos(x)==='LD').length<=roster.filter(x=>naturalPos(x)==='RD').length?'LD':'RD';", 1)
text = text.replace("p.position='D';roster.push(p);", "p.position=counts().D%2===0?'LD':'RD';roster.push(p);", 1)
text = text.replace('career.position=careerBucket;', "career.position=naturalPos(career);if(career.position==='D')career.position='LD';", 1)

start = text.find('  function lineup(team){')
end = text.find('\n  function rebuild(state){', start)
if start < 0 or end < 0:
    raise SystemExit('lineup function anchor missing')

new_lineup = r'''  function lineup(team){
    for(const p of team.roster||[]){delete p.rosterSlot;delete p.slot;}

    const byOverall=(a,b)=>ovr(b)-ovr(a);
    const lw=(team.roster||[]).filter(p=>naturalPos(p)==='LW').sort(byOverall);
    const c=(team.roster||[]).filter(p=>naturalPos(p)==='C').sort(byOverall);
    const rw=(team.roster||[]).filter(p=>naturalPos(p)==='RW').sort(byOverall);
    const genericD=(team.roster||[]).filter(p=>naturalPos(p)==='D').sort(byOverall);
    const ld=(team.roster||[]).filter(p=>naturalPos(p)==='LD').sort(byOverall);
    const rd=(team.roster||[]).filter(p=>naturalPos(p)==='RD').sort(byOverall);
    const g=(team.roster||[]).filter(p=>naturalPos(p)==='G').sort(byOverall);

    genericD.forEach(player=>{
      if(ld.length<=rd.length){player.position='LD';ld.push(player);ld.sort(byOverall);}
      else{player.position='RD';rd.push(player);rd.sort(byOverall);}
    });

    const fl=[];
    for(let i=0;i<4;i++){
      const line=[lw[i],c[i],rw[i]].filter(Boolean);
      if(lw[i])lw[i].rosterSlot=`fwd-${i+1}-lw`;
      if(c[i])c[i].rosterSlot=`fwd-${i+1}-c`;
      if(rw[i])rw[i].rosterSlot=`fwd-${i+1}-rw`;
      fl.push(line);
    }

    const dp=[];
    for(let i=0;i<3;i++){
      const pair=[ld[i],rd[i]].filter(Boolean);
      if(ld[i])ld[i].rosterSlot=`def-${i+1}-ld`;
      if(rd[i])rd[i].rosterSlot=`def-${i+1}-rd`;
      dp.push(pair);
    }

    if(g[0])g[0].rosterSlot='g-starter';
    if(g[1])g[1].rosterSlot='g-backup';

    const id=p=>p?.playerId||p?.id||null;
    const topF=fl.flat();
    const topD=dp.flat();
    const pp=u=>({slots:{leftFlank:id(u[0]),bumper:id(u[1]),rightFlank:id(u[2]),netFront:id(u[3]),quarterback:id(u[4])}});
    const pk=u=>({slots:{leftForward:id(u[0]),rightForward:id(u[1]),leftDefense:id(u[2]),rightDefense:id(u[3])}});

    team.forwardLines=fl;
    team.defensePairs=dp;
    team.goalies=g;
    team.lines={forwards:fl,defense:dp,goalies:g};
    team.lineup={forwards:fl,defense:dp,defensePairs:dp,goalies:g,starter:g[0]||null,backup:g[1]||null};
    team.specialTeams={
      powerPlay:[pp([...topF.slice(0,3),...topD.slice(0,2)]),pp([...topF.slice(3,6),...topD.slice(2,4)])],
      penaltyKill:[pk([...topF.slice(0,2),...topD.slice(0,2)]),pk([...topF.slice(2,4),...topD.slice(2,4)])]
    };
    return team;
  }
'''
text = text[:start] + new_lineup + text[end:]

path.write_text(text, encoding='utf-8')
print('TRAVEL_LINEUP_INTEGRITY_PATCH=OK')
