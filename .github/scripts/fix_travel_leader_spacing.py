from pathlib import Path

path = Path('artifacts/project-ice/public/travel-hockey-canonical-ui.js')
text = path.read_text()

old_css = ".pi-ts-leader{display:grid;grid-template-columns:28px 1fr 50px;gap:9px;padding:11px 12px;border-radius:13px;background:rgba(255,255,255,.03);cursor:pointer}.pi-ts-leader .v{text-align:right;font-weight:900}"
new_css = ".pi-ts-leader{display:grid;grid-template-columns:28px minmax(0,1fr) 58px;gap:9px;align-items:center;padding:11px 12px;border-radius:13px;background:rgba(255,255,255,.03);cursor:pointer}.pi-ts-leader__identity{min-width:0}.pi-ts-leader__identity>span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800}.pi-ts-leader__identity small{display:block;margin-top:3px;color:#7186a1;font-size:8px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pi-ts-leader .v{text-align:right;font-weight:900;white-space:nowrap}"
if old_css not in text:
    raise SystemExit('Could not find Travel leader CSS block')
text = text.replace(old_css, new_css, 1)

old_markup = "<span>${esc(item.player.name)}<small>${esc(item.team.shortName || item.team.name)}</small></span>"
new_markup = "<span class=\"pi-ts-leader__identity\"><span>${esc(item.player.name)}</span><small>${esc(item.team.shortName || item.team.name)}</small></span>"
if old_markup not in text:
    raise SystemExit('Could not find Travel leader identity markup')
text = text.replace(old_markup, new_markup, 1)

path.write_text(text)
print('Fixed Travel Stat Leaders name/team spacing.')
