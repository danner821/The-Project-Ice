from pathlib import Path
import re

path = Path('artifacts/project-ice/public/travel-hockey-canonical-ui.js')
text = path.read_text()

old_fn = re.compile(r"\n  function bracket\(state\) \{.*?\n  \}\n\n  function leaders\(state\) \{", re.S)
new_fn = r'''
  function travelTeamAbbr(team) {
    if (!team) return 'TBD';
    const club = String(team.clubId || team.organizationId || '').toLowerCase();
    const known = {
      'arizona-jr-coyotes': 'ARI',
      'colorado-thunderbirds': 'COL',
      'dallas-stars-elite': 'DAL',
      'chicago-mission': 'CHI',
      'little-caesars': 'LC',
      'pittsburgh-penguins-elite': 'PIT',
      'boston-jr-eagles': 'BOS',
      'la-jr-kings': 'LA',
    };
    if (known[club]) return known[club];

    const raw = String(team.shortName || team.name || '')
      .replace(/\s+(B|A|AA|AAA)$/i, '')
      .replace(/\b(Jr\.?|Elite)\b/gi, '')
      .trim();
    if (!raw) return 'TBD';
    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return words.slice(0, 3).map(word => word[0]).join('').toUpperCase();
  }

  function bracketSeriesCard(state, item, index, roundKey) {
    const a = byTeam(state, item?.teamAId);
    const b = byTeam(state, item?.teamBId);
    const aWins = Number(item?.teamAWins || 0);
    const bWins = Number(item?.teamBWins || 0);
    const decided = aWins >= 2 || bWins >= 2 || String(item?.status || '').toLowerCase() === 'complete';
    const aWinner = decided && aWins > bWins;
    const bWinner = decided && bWins > aWins;

    return `
      <div class="pi-bracket-series pi-bracket-series--${roundKey}" data-series="${esc(item?.seriesId || `${roundKey}-${index + 1}`)}">
        <div class="pi-bracket-team ${aWinner ? 'is-winner' : ''}">
          <button type="button" data-team="${esc(a?.teamId || '')}" title="${esc(a?.name || 'TBD')}">${esc(travelTeamAbbr(a))}</button>
          <span>${aWins}</span>
        </div>
        <div class="pi-bracket-team ${bWinner ? 'is-winner' : ''}">
          <button type="button" data-team="${esc(b?.teamId || '')}" title="${esc(b?.name || 'TBD')}">${esc(travelTeamAbbr(b))}</button>
          <span>${bWins}</span>
        </div>
      </div>`;
  }

  function bracket(state) {
    const rounds = state.tournament?.rounds || {};
    const quarterfinals = Array.isArray(rounds.quarterfinals) ? rounds.quarterfinals : [];
    const semifinals = Array.isArray(rounds.semifinals) ? rounds.semifinals : [];
    const championship = Array.isArray(rounds.championship) ? rounds.championship : [];

    const placeholder = (roundKey, count) => Array.from({ length: count }, (_, index) => `
      <div class="pi-bracket-series pi-bracket-series--${roundKey} is-placeholder" data-series="${roundKey}-placeholder-${index + 1}">
        <div class="pi-bracket-team"><span class="pi-bracket-tbd">TBD</span><span>0</span></div>
        <div class="pi-bracket-team"><span class="pi-bracket-tbd">TBD</span><span>0</span></div>
      </div>`).join('');

    return `
      <section class="pi-ts-sec pi-ts-sec--bracket">
        <div class="pi-ts-head pi-ts-head--bracket">
          <h3>Tournament Bracket</h3>
          <span>Best of 3</span>
        </div>
        <div class="pi-bracket" aria-label="Travel hockey tournament bracket">
          <div class="pi-bracket-round pi-bracket-round--qf">
            <div class="pi-bracket-round-title"><strong>QF</strong><span>8 teams</span></div>
            <div class="pi-bracket-round-body">
              ${quarterfinals.length ? quarterfinals.map((item, index) => bracketSeriesCard(state, item, index, 'qf')).join('') : placeholder('qf', 4)}
            </div>
          </div>
          <div class="pi-bracket-round pi-bracket-round--sf">
            <div class="pi-bracket-round-title"><strong>SF</strong><span>4 teams</span></div>
            <div class="pi-bracket-round-body">
              ${semifinals.length ? semifinals.map((item, index) => bracketSeriesCard(state, item, index, 'sf')).join('') : placeholder('sf', 2)}
            </div>
          </div>
          <div class="pi-bracket-round pi-bracket-round--final">
            <div class="pi-bracket-round-title"><strong>FINAL</strong><span>2 teams</span></div>
            <div class="pi-bracket-round-body">
              ${championship.length ? championship.map((item, index) => bracketSeriesCard(state, item, index, 'final')).join('') : placeholder('final', 1)}
            </div>
          </div>
        </div>
      </section>`;
  }

  function leaders(state) {'''

text, count = old_fn.subn(new_fn, text, count=1)
if count != 1:
    raise SystemExit(f'Could not replace bracket function, matches={count}')

needle = ".pi-ts-leader .v{text-align:right;font-weight:900}`;"
css = r'''.pi-ts-leader .v{text-align:right;font-weight:900}.pi-ts-sec--bracket{margin-top:24px}.pi-ts-head--bracket{margin-bottom:12px}.pi-bracket{display:grid;grid-template-columns:minmax(0,1.18fr) minmax(0,1fr) minmax(0,.9fr);gap:12px;align-items:stretch;padding:14px 10px;border:1px solid rgba(111,177,255,.12);border-radius:18px;background:linear-gradient(180deg,rgba(14,36,62,.72),rgba(5,18,32,.82));overflow:hidden}.pi-bracket-round{min-width:0;display:flex;flex-direction:column}.pi-bracket-round-title{display:flex;align-items:baseline;justify-content:space-between;gap:4px;padding:0 2px 9px}.pi-bracket-round-title strong{color:#d9e9ff;font-size:10px;letter-spacing:.12em}.pi-bracket-round-title span{color:#5f7692;font-size:7px;font-weight:900;text-transform:uppercase;white-space:nowrap}.pi-bracket-round-body{position:relative;flex:1;display:flex;flex-direction:column;justify-content:space-around;gap:9px}.pi-bracket-series{position:relative;z-index:1;border:1px solid rgba(111,177,255,.14);border-radius:10px;background:rgba(8,25,44,.95);box-shadow:0 5px 14px rgba(0,0,0,.16);overflow:visible}.pi-bracket-series:not(.pi-bracket-series--final)::after{content:'';position:absolute;top:50%;left:100%;width:13px;border-top:1px solid rgba(112,155,210,.28);pointer-events:none}.pi-bracket-team{display:grid;grid-template-columns:minmax(0,1fr) 18px;align-items:center;min-height:30px;padding:0 6px;gap:3px}.pi-bracket-team+.pi-bracket-team{border-top:1px solid rgba(255,255,255,.055)}.pi-bracket-team button{all:unset;display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#b9c9dd;font-size:9px;font-weight:850;letter-spacing:.025em;cursor:pointer}.pi-bracket-team>span:last-child{text-align:right;color:#91a6bf;font-size:10px;font-weight:950}.pi-bracket-team.is-winner button,.pi-bracket-team.is-winner>span:last-child{color:#f3f8ff}.pi-bracket-team.is-winner{background:rgba(62,128,217,.13)}.pi-bracket-tbd{color:#526983!important;font-size:8px!important;font-weight:800!important;letter-spacing:.08em}.pi-bracket-series.is-placeholder{border-style:dashed;border-color:rgba(101,151,215,.12);background:rgba(7,22,39,.58)}.pi-bracket-round--sf .pi-bracket-round-body{padding-block:24px}.pi-bracket-round--final .pi-bracket-round-body{padding-block:78px}.pi-bracket-round--final .pi-bracket-series{border-color:rgba(115,179,255,.22);box-shadow:0 0 20px rgba(57,124,217,.08)}@media(max-width:390px){.pi-bracket{gap:9px;padding-inline:8px}.pi-bracket-series:not(.pi-bracket-series--final)::after{width:10px}.pi-bracket-team{padding-inline:5px}.pi-bracket-round-title span{display:none}}`;'''
if needle not in text:
    raise SystemExit('Could not find canonical style terminator')
text = text.replace(needle, css, 1)

path.write_text(text)
print('Styled Travel tournament as a compact three-column bracket.')
