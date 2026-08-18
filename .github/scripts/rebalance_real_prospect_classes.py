from pathlib import Path
import ast, re

p = Path('artifacts/project-ice/public/prospects.js')
s = p.read_text(encoding='utf-8')

start_marker = 'const PROJECT_ICE_REAL_PROSPECT_SOURCE_ROWS = [\n'
end_marker = '\n];\n\nfunction slugifyProspectName'
start = s.index(start_marker) + len(start_marker)
end = s.index(end_marker, start)
block = s[start:end]

rows = []
for line in block.splitlines():
    stripped = line.strip()
    if not stripped or not stripped.startswith('['):
        continue
    if stripped.endswith(','):
        stripped = stripped[:-1]
    rows.append(list(ast.literal_eval(stripped)))

by_name = {row[0]: row for row in rows}

# Curated 2027 core: recognizable/high-end names plus positional/international depth.
keep_2027_names = [
    'Landon DuPont','Jaxon Jacobson','Alexis Joseph','Carter Meyer','Sammy Nelson',
    'Nazar Privalov','Andrei Pustovoy','Dima Zhilkin','Brock England','Jonah Neuenschwander',
    'Jamie Glance','Kohyn Eshkawkogan','Levi Harper','Rocco Pelosi','Roberts Naudiņš',
    'Oliver Ozogany','Max Calce','Shaeffer Gordon-Carroll','Dorian Eklund Aspe','Brock Cripps',
    'Noah Davidson','Patrick Déniger','Loïk Gariepy','Semyon Gerasimov','Diego Gutierrez',
    'Michal Hartl','Ben Harvey','Adam Israilov','Luca Jarvis','Timothy Kazda',
    'Ilya Kolmakov','Rhett Sather','James Scantlebury','Paul Sintschnig','Sergei Skvortsov',
    'Nolan Snyder','Kayden Stroeder','Oliver Sundberg',
]
assert len(keep_2027_names) == 38
missing_2027 = [name for name in keep_2027_names if name not in by_name]
assert not missing_2027, missing_2027

selected = [by_name[name] for name in keep_2027_names]
selected += [row for row in rows if row[9] == 2028]
selected += [row for row in rows if row[9] == 2029]
selected += [row for row in rows if row[9] == 2030]

# Additional researched 2028 players. Fields are factual snapshots from Elite Prospects.
extra_2028 = [
    ['Ben Oliverio','F','Drumheller Dragons','AJHL','2010-03-23','Canada','5\'9"',165,'R',2028,0],
    ['Niilo Jokinen','F','Kärpät U16','U16 SM-sarja','2010-05-23','Finland','5\'7"',141,'L',2028,0],
    ['Viking Simon','F','AIK U18','U18 Region','2010-02-25','Sweden','6\'1"',187,'L',2028,0],
    ['Lev Smotkin','G','Mount St. Charles Acad 15U AAA','NEPACK 15U','2010-03-01','USA','6\'0"',174,'L',2028,0],
    ['Jack Samek','F','Markham Majors U16 AAA','GTHL U16','2010-03-08','Canada','5\'11"',170,'R',2028,0],
    ['Colton Cribari','D','Markham Majors U16 AAA','GTHL U16','2010-04-04','Canada','5\'10"',146,'R',2028,0],
    ['Nikita Sinikin','F','Chaika Nizhny Novgorod','MHL','2010-04-06','Russia','5\'9"',159,'R',2028,0],
    ['Holden Sexsmith','D','Yale Hockey Academy U18 Prep','CSSHL U18','2009-12-22','Canada','6\'2"',185,'L',2028,0],
    ['Jayden Pominville','F','Rouyn-Noranda Huskies','QMJHL','2009-11-02','Canada/USA','5\'9"',152,'R',2028,0],
    ['Enzo DiDomenicantonio','F','Lethbridge Hurricanes','WHL','2009-10-31','USA','5\'11"',172,'L',2028,0],
]

# Additional 2029 players. Eligibility is kept to Sep. 15, 2011 or earlier.
extra_2029 = [
    ['Juho Nyberg','F','Ilves U20','U20 SM-sarja','2011-05-31','Finland','5\'10"',157,'R',2029,0],
    ['Brayden Jugnauth','F','Okanagan Rockets U18 AAA','BCEHL U18','2011-04-08','Canada','5\'9"',154,'R',2029,0],
    ['Kenzo Gibson','F','Burnaby Winter Club U18 Prep','CSSHL U18','2011-04-20','Canada','6\'0"',185,'L',2029,0],
    ['Simon Howard','F','Huron-Perth Lakers U16 AAA','ALLIANCE U16','2011-08-19','Canada','',0,'L',2029,0],
    ['Mateo Ferreira','D','Winnipeg Bruins U18 AAA','MU18HL','2010-10-06','Canada','5\'10"',161,'L',2029,0],
    ['Carter Watson','F','Dexter Southfield School','USHS-Prep','2011-02-28','USA','',0,'R',2029,0],
    ['Dominik Zelezny','F','Bili Tygri Liberec U18','Czechia U18','2011-07-04','Czechia','5\'11"',148,'L',2029,0],
    ['Gabriel Wsol','F','Södertälje SK U18','U18 Region','2011-07-18','Poland','5\'8"',126,'R',2029,0],
    ['Rylan Edwards','F','Regina Pat Canadians U18 AAA','SMAAAHL','2011-04-06','Canada','5\'7"',146,'R',2029,0],
    ['Gianni Frasca','F','North York Rangers U15 AAA','GTHL U15','2011-02-05','Canada','',0,'',2029,0],
    ['Sam Archibald','D','Mount St. Charles Acad 14U AAA','THF 14U','2011-02-02','USA','6\'0"',165,'R',2029,0],
    ['Max Melicherik','F','Tappara U20','U20 SM-sarja','2010-11-28','Slovakia/UK','6\'2"',190,'R',2029,0],
    ['Maxwell Prudovsky','F','Dexter Southfield School','USHS-Prep','2011-07-29','USA','5\'8"',0,'L',2029,0],
    ['James Schuler','F','Toronto Red Wings U15 AAA','GTHL U15','2011-07-18','Canada','5\'7"',134,'L',2029,0],
    ['Greyson Mackenzie','F',"Shattuck St. Mary's 14U AAA",'14U AAA','2011-03-28','USA','5\'6"',126,'L',2029,0],
    ['Jayden Ni','F',"St. George's School U17 Prep",'CSSHL U17','2011-02-27','Canada','5\'8"',141,'R',2029,0],
    ['Maddox Burke','F','Steele Subaru U18','NSU18MHL','2011-08-08','Canada','',0,'L',2029,0],
    ['Brody Antignani','F','Calgary Edge School U18 Prep','CSSHL U18','2011-06-02','Canada','5\'8"',150,'L',2029,0],
    ['Bogdan Bezukhov','F','Krasnaya Armiya Moskva','MHL','2010-10-22','Russia','6\'1"',154,'L',2029,0],
    ['Owen Moulton','F',"Shattuck St. Mary's 14U AAA",'14U AAA','2011-01-11','USA','5\'8"',139,'R',2029,0],
    ['Brando Duncan','F','Dallas Stars Elite 14U AAA','14U AAA','2011-05-12','USA','5\'11"',161,'R',2029,0],
    ['Brody Trost','F','Bishop Kearney Selects 15U AAA','15U AAA','2011-01-12','USA','5\'6"',126,'R',2029,0],
    ['Justin Henri','F','Pointe-Lévy Corsaires M17 AAA','QM17AAA','2011-01-01','Canada','',0,'',2029,0],
    ['Jayden Challenger','F','Toronto Marlboros U15 AAA','U15 AAA','2011-02-23','Canada','',0,'',2029,0],
    ['Oliver Tomastik','F','Windy City Storm 14U AAA','14U AAA','2011-04-15','Slovakia','5\'9"',152,'R',2029,0],
    ['Tyler Longo','F','Toronto Marlboros U16 AAA','GTHL U16','2011-06-20','Canada','5\'11"',170,'',2029,0],
    ["Kade O'Rourke",'D','Toronto Jr. Canadiens U16 AAA','GTHL U16','2011-01-31','USA','6\'1"',181,'R',2029,0],
    ['Jasper Wang','D','Vaughan Kings U15 AAA','GTHL U15','2011-06-15','Canada','5\'11"',168,'R',2029,0],
    ['Preston Hebert','F','Toronto Marlboros U16 AAA','GTHL U16','2011-03-13','Canada','5\'11"',163,'R',2029,0],
    ['Beckham Hunter','F','BioSteel Sports Academy U18 AAA','U18 AAA','2011-03-19','Canada','5\'10"',146,'R',2029,0],
    ['Niko Fegaras','F','Vaughan Kings U15 AAA','GTHL U15','2011-05-05','Canada','',0,'',2029,0],
    ['Isaya Papineau','F','Upper Canada College U16 AAA','U16 AAA','2011-02-10','Canada','',0,'',2029,0],
    ['Ty Bryan','F','Upper Canada College U16 AAA','U16 AAA','2011-05-17','Canada','',0,'',2029,0],
    ['George Zettas','D','Toronto Marlboros U15 AAA','U15 AAA','2011-04-05','Canada','',0,'L',2029,0],
]
assert len(extra_2029) == 34

# Five researched additions bring the 2030 pool to 37.
extra_2030 = [
    ['RJ Celebrini','F','North Shore WC U15 A1','U15 A1','2012-08-18','Canada','5\'3"',115,'L',2030,0],
    ['Drystan Thomas','F','Little Caesars 15U AAA','15U AAA','2011-12-19','USA','5\'10"',150,'R',2030,0],
    ["Brooks Brind'Amour",'F','Carolina Jr. Hurricanes 14U AAA','T1EHL 14U','2011-12-19','USA','',0,'',2030,0],
    ['Tyson Hines','D','Charlottetown Knights U18 AAA','NBPEIMU18HL','2011-11-08','Canada','5\'10"',150,'L',2030,0],
    ['Adam Vertes','G','Vasas Budapest','QC Int PW','2011-10-05','Hungary','5\'9"',137,'L',2030,0],
]

for extra in (extra_2028 + extra_2029 + extra_2030):
    if extra[0] not in {row[0] for row in selected}:
        selected.append(extra)

# Normalize exact class sizes and deterministic source order.
targets = {2027: 38, 2028: 38, 2029: 37, 2030: 37}
final_rows = []
for year in [2027, 2028, 2029, 2030]:
    class_rows = [row for row in selected if row[9] == year]
    # De-dupe by exact player name while preserving order.
    seen = set()
    class_rows = [row for row in class_rows if not (row[0] in seen or seen.add(row[0]))]
    assert len(class_rows) == targets[year], (year, len(class_rows), [r[0] for r in class_rows])
    for index, row in enumerate(class_rows, 1):
        row[10] = index
        final_rows.append(row)

assert len(final_rows) == 150
assert len({row[0] for row in final_rows}) == 150

def js_value(value):
    if value is None:
        return 'null'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return str(value)
    # Python repr produces valid JS single-quoted string escapes for this dataset.
    return repr(value)

new_block = '\n'.join('  [' + ', '.join(js_value(v) for v in row) + '],' for row in final_rows)
s = s[:start] + new_block + s[end:]
s = re.sub(
    r'researchedClassCounts: Object\.freeze\(\{[^}]+\}\)',
    "researchedClassCounts: Object.freeze({ 2027: 38, 2028: 38, 2029: 37, 2030: 37 })",
    s,
    count=1,
)
s = s.replace(
    "biographySource: draftYear === 2030 ? 'Elite Prospects 2012-born watchlist' : 'Elite Prospects draft center',",
    "biographySource: draftYear >= 2029 ? 'Elite Prospects eligibility/watchlist research' : 'Elite Prospects draft center/ranking research',",
    1,
)

p.write_text(s, encoding='utf-8')
print('BALANCED_REAL_PROSPECTS=150')
print('2027=38 2028=38 2029=37 2030=37')
