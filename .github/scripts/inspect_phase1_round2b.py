from pathlib import Path
pairs=[('artifacts/project-ice/public/game.js',['liveGameScreen.appendChild(card)','const targetTOI','openPostgameSummary(gameId)','careerGameSimApproval =']),('artifacts/project-ice/public/world.js',['const targetTotalTOI','target TOTAL game TOI','bestScore','careerGameApprovedForLiveEngine','careerGameApprovedForSim'])]
for fn,pats in pairs:
 s=Path(fn).read_text(); print('\n###',fn)
 for pat in pats:
  start=0
  while True:
   i=s.find(pat,start)
   if i<0: break
   print('\n====',pat,'@',i,'====')
   print(s[max(0,i-1600):i+3600])
   start=i+1
