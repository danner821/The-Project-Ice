from pathlib import Path
for path in ['artifacts/project-ice/index.html','artifacts/project-ice/public/game.js','artifacts/project-ice/public/style.css']:
    text=Path(path).read_text(errors='ignore')
    print('\nFILE',path)
    for needle in ['hub-news-list','league-news-preview','renderLeagueNewsPreview','function showScreen','function navigate','data-screen','screen-','tab-league','btn-back']:
        hits=[]; start=0
        low=text.lower(); n=needle.lower()
        while True:
            i=low.find(n,start)
            if i<0: break
            hits.append(i); start=i+1
        if hits:
            print('\n###',needle)
            for i in hits[:8]: print(text[max(0,i-1200):i+2400])
