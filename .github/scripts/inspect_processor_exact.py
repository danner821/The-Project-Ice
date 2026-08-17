from pathlib import Path
s=Path('artifacts/project-ice/public/world.js').read_text()
for term in ['parseDateKey','toDateKey','normalizeDateKey','parseDate','dateKey','formatDate']:
    print('\n###',term)
    for i,line in enumerate(s.splitlines(),1):
        if term in line:
            print(f'{i}: {line}')
