from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
lines=p.read_text(errors='ignore').splitlines()
needles=['player-profile-screen','renderPlayerProfile','potentialRole','potentialAccuracy','potentialTrend','scoutingProfile','strengthsKnown','weaknessesKnown','organizationsWatching','publicRank','gamesObserved']
out=[]
for needle in needles:
    out.append(f'\n### {needle}')
    hits=[i for i,l in enumerate(lines) if needle.lower() in l.lower()]
    for i in hits[:12]:
        a=max(0,i-30); b=min(len(lines),i+120)
        out.append(f'--- {a+1}-{b} ---')
        out.extend(lines[a:b])
text='\n'.join(out)
Path('.github/player_profile_backend_audit.txt').write_text(text)
print(text)
