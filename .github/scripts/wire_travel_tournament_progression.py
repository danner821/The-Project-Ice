from pathlib import Path

path = Path('artifacts/project-ice/public/travel-hockey-canonical-ui.js')
text = path.read_text()

needle = '''    return `
      <section class="pi-ts-sec pi-ts-sec--bracket">'''
replacement = '''    return `
      ${WorldEngine.renderTravelTournamentProgressionControl?.(state) || ''}
      <section class="pi-ts-sec pi-ts-sec--bracket">'''
if 'renderTravelTournamentProgressionControl?.(state)' not in text:
    if needle not in text:
        raise SystemExit('Could not find bracket return insertion point')
    text = text.replace(needle, replacement, 1)

css_needle = '.pi-ts-sec--bracket{margin-top:24px}'
css_replacement = '.pi-travel-progress-control{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:20px 0 4px;padding:13px 14px;border:1px solid rgba(103,168,255,.2);border-radius:15px;background:linear-gradient(135deg,rgba(43,103,188,.18),rgba(8,25,44,.82))}.pi-travel-progress-control>div{min-width:0}.pi-travel-progress-control small{display:block;color:#6f8aaa;font-size:7px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.pi-travel-progress-control strong{display:block;margin-top:4px;color:#dceaff;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pi-travel-progress-control button{appearance:none;border:1px solid rgba(111,177,255,.25);border-radius:10px;padding:9px 12px;background:rgba(45,105,190,.2);color:#eaf3ff;font:inherit;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.pi-travel-progress-control button:disabled{opacity:.5}.pi-travel-progress-control.is-complete{display:block}.pi-travel-progress-control.is-complete strong{font-size:13px}.pi-ts-sec--bracket{margin-top:24px}'
if '.pi-travel-progress-control{' not in text:
    if css_needle not in text:
        raise SystemExit('Could not find bracket CSS insertion point')
    text = text.replace(css_needle, css_replacement, 1)

path.write_text(text)
print('Wired canonical Travel Hub to tournament progression engine.')
