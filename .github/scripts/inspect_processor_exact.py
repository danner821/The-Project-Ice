from pathlib import Path
s=Path('artifacts/project-ice/public/world.js').read_text()
idx=s.find('function processSeasonDate')
if idx<0: raise SystemExit('not found')
end=s.find('function processCurrentSeasonDate', idx)
block=s[idx:end if end>idx else idx+50000]
for term in ['processedDates', 'return {', 'eventResults']:
    print('\n###',term)
    pos=0
    while True:
        hit=block.find(term,pos)
        if hit<0: break
        print(block[max(0,hit-900):hit+1800])
        pos=hit+len(term)
