from pathlib import Path
p = Path('artifacts/project-ice/public/game.js')
s = p.read_text()
anchor = "async function renderCareerSaveSelection() {\n"
helper = """function escapeHtml(value) {\n  return String(value ?? '')\n    .replace(/&/g, '&amp;')\n    .replace(/</g, '&lt;')\n    .replace(/>/g, '&gt;')\n    .replace(/\"/g, '&quot;')\n    .replace(/'/g, '&#039;');\n}\n\n"""
if 'function escapeHtml(value)' not in s:
    if anchor not in s:
        raise SystemExit('renderCareerSaveSelection anchor not found')
    s = s.replace(anchor, helper + anchor, 1)
p.write_text(s)
print('added escapeHtml helper')
