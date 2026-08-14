from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text()
old = """  if (\n    elapsedSeconds > 0 &&\n    (\n      careerWasOnIce ||\n      careerIsOnIce\n    )\n  ) {\n    liveGameCareerTOISeconds +=\n      elapsedSeconds;\n  }\n"""
new = """  if (elapsedSeconds > 0) {\n    if (\n      careerWasOnIce &&\n      careerIsOnIce\n    ) {\n      liveGameCareerTOISeconds +=\n        elapsedSeconds;\n    } else if (\n      careerWasOnIce ||\n      careerIsOnIce\n    ) {\n      liveGameCareerTOISeconds +=\n        elapsedSeconds * 0.5;\n    }\n  }\n"""
if old not in text:
    raise SystemExit('Expected TOI block not found; aborting without changes')
text = text.replace(old, new, 1)
path.write_text(text)
print('TOI counter patched')
