from pathlib import Path

p = Path('artifacts/project-ice/public/prospects.js')
s = p.read_text(errors='ignore')

old_counts = "researchedClassCounts: Object.freeze({ 2027: 87, 2028: 28, 2029: 3, 2030: 48 }),"
new_counts = "researchedClassCounts: Object.freeze({ 2027: 87, 2028: 28, 2029: 33, 2030: 48 }),"
if old_counts not in s:
    raise SystemExit('class-count anchor missing')
s = s.replace(old_counts, new_counts, 1)

old_rows = """  ['Madden Daneault', 'F', 'Red Deer Rebels U15 AAA', 'AEHL U15', '2011-05-07', 'Canada', '5\\'11"', 172, 'R', 2029, 1],
  ['Parker McMillan', 'F', 'Yale Hockey Academy U15 Prep', 'CSSHL U15', '2011-06-13', 'Canada', '6\\'3"', 192, 'R', 2029, 2],
  ['Tyson Orr', 'F', 'Elgin Middlesex Canucks U15 AAA', 'U15 AAA', '2011-01-22', 'Canada', '5\\'8"', 183, 'R', 2029, 3],
"""

new_rows = """  ['Madden Daneault', 'F', 'Red Deer Rebels U15 AAA', 'AEHL U15', '2011-05-07', 'Canada', '5\\'11"', 172, 'R', 2029, 1],
  ['Juho Nyberg', 'F', 'Ilves U20', 'U20 SM-sarja', '2011-05-31', 'Finland', '5\\'10"', 157, 'R', 2029, 2],
  ['Tyson Orr', 'F', 'Elgin Middlesex Canucks U15 AAA', 'ALLIANCE U15', '2011-01-22', 'Canada', '5\\'8"', 183, 'R', 2029, 3],
  ['Callum Brooks', 'F', 'Huron-Perth Lakers U16 AAA', 'ALLIANCE U16', '2011-10-25', 'Canada', '5\\'10"', 148, 'L', 2029, 4],
  ['Brayden Jugnauth', 'F', 'Okanagan Rockets U18 AAA', 'BCEHL U18', '2011-04-08', 'Canada', '5\\'9"', 154, 'R', 2029, 5],
  ['Kenzo Gibson', 'F', 'Burnaby Winter Club U18 Prep', 'CSSHL U18', '2011-04-20', 'Canada', '6\\'0"', 185, 'L', 2029, 6],
  ['Simon Howard', 'F', 'Huron-Perth Lakers U16 AAA', 'ALLIANCE U16', '2011-08-19', 'Canada', '', null, 'L', 2029, 7],
  ['Mateo Ferreira', 'D', 'Winnipeg Bruins U18 AAA', 'MU18HL', '2010-10-06', 'Canada', '5\\'10"', 161, 'L', 2029, 8],
  ['Parker McMillan', 'F', 'Yale Hockey Academy U18 Prep', 'CSSHL U18', '2011-06-13', 'Canada', '6\\'3"', 192, 'R', 2029, 9],
  ['Carter Watson', 'F', 'Dexter Southfield School', 'USHS-Prep', '2011-02-28', 'USA', '', null, 'R', 2029, 10],
  ['Dominik Zelezny', 'F', 'Bili Tygri Liberec U18', 'Czechia U18', '2011-07-04', 'Czechia', '5\\'11"', 148, 'L', 2029, 11],
  ['Gabriel Wsol', 'F', 'Södertälje SK U18', 'U18 Region', '2011-07-18', 'Poland', '5\\'8"', 126, 'R', 2029, 12],
  ['Rylan Edwards', 'F', 'Regina Pat Canadians U18 AAA', 'SMAAAHL', '2011-04-06', 'Canada', '5\\'7"', 146, 'R', 2029, 13],
  ['Gianni Frasca', 'F', 'North York Rangers U15 AAA', 'GTHL U15', '2011-02-05', 'Canada', '', null, '', 2029, 14],
  ['Sam Archibald', 'D', 'Mount St. Charles Acad 14U AAA', 'THF 14U', '2011-02-02', 'USA', '6\\'0"', 165, 'R', 2029, 15],
  ['Max Melicherik', 'F', 'Tappara U20', 'U20 SM-sarja', '2010-11-28', 'Slovakia', '6\\'2"', 190, 'R', 2029, 16],
  ['Maxwell Prudovsky', 'F', 'Dexter Southfield School', 'USHS-Prep', '2011-07-29', 'USA', '5\\'8"', null, 'L', 2029, 17],
  ['James Schuler', 'F', 'Toronto Red Wings U15 AAA', 'GTHL U15', '2011-07-18', 'USA', '5\\'7"', 134, 'L', 2029, 18],
  ['Greyson Mackenzie', 'F', "Shattuck St. Mary's 14U AAA", '14U AAA', '2011-03-28', 'USA', '5\\'6"', 126, 'L', 2029, 19],
  ['Jayden Ni', 'F', "St. George's School U17 Prep", 'CSSHL U17', '2011-02-27', 'Canada', '5\\'8"', 141, 'R', 2029, 20],
  ['Maddox Burke', 'F', 'Steele Subaru U18', 'NSU18MHL', '2011-08-08', 'Canada', '', null, 'L', 2029, 21],
  ['Brody Antignani', 'F', 'Calgary Edge School U18 Prep', 'CSSHL U18', '2011-06-02', 'Canada', '5\\'8"', 150, 'L', 2029, 22],
  ['Bogdan Bezukhov', 'F', 'Krasnaya Armiya Moskva', 'MHL', '2010-10-22', 'Russia', '6\\'1"', 154, 'L', 2029, 23],
  ['Drystan Thomas', 'F', 'Little Caesars 15U AAA', '15U AAA', '2011-12-19', 'USA', '5\\'10"', 150, 'R', 2029, 24],
  ['Owen Moulton', 'F', "Shattuck St. Mary's 14U AAA", '14U AAA', '2011-01-11', 'USA', '5\\'8"', 139, 'R', 2029, 25],
  ['Brando Duncan', 'F', 'Dallas Stars Elite 14U AAA', '14U AAA', '2011-05-12', 'USA', '5\\'11"', 161, 'R', 2029, 26],
  ['Brody Trost', 'F', 'Bishop Kearney Selects 15U AAA', '15U AAA', '2011-01-12', 'USA', '5\\'6"', 126, 'R', 2029, 27],
  ['Justin Henri', 'F', 'Pointe-Lévy Corsaires M17 AAA', 'QM17AAA', '2011-01-01', 'Canada', '', null, '', 2029, 28],
  ['Jett Evans', 'F', 'Northern Alberta Xtreme U18 Prep', 'CSSHL U18', '2011-11-30', 'Canada', '5\\'11"', 161, 'L', 2029, 29],
  ['Jayden Challenger', 'F', 'Toronto Marlboros U15 AAA', 'U15 AAA', '2011-02-23', 'Canada', '', null, '', 2029, 30],
  ['Noah Carignan', 'F', 'Fraser Valley Thunderbirds U17', 'BCEHL U17', '2011-10-01', 'Canada', '5\\'7"', 146, 'L', 2029, 31],
  ['Oliver Tomastik', 'F', 'Windy City Storm 14U AAA', '14U AAA', '2011-04-15', 'Slovakia', '5\\'9"', 152, 'R', 2029, 32],
  ['Tyler Longo', 'F', 'Toronto Marlboros U16 AAA', 'GTHL U16', '2011-06-20', 'Canada', '5\\'11"', 170, '', 2029, 33],
"""

if old_rows not in s:
    raise SystemExit('2029 row block anchor missing')
s = s.replace(old_rows, new_rows, 1)

# The 2029 class uses a real-player ranking portal plus the draft-center seed.
old_source = "biographySource: draftYear === 2030 ? 'Elite Prospects 2012-born watchlist' : 'Elite Prospects draft center',"
new_source = """biographySource:
      draftYear === 2030
        ? 'Elite Prospects 2012-born watchlist'
        : draftYear === 2029
          ? 'Elite Prospects draft center / 2029 ranking portal'
          : 'Elite Prospects draft center',"""
if old_source not in s:
    raise SystemExit('biography source anchor missing')
s = s.replace(old_source, new_source, 1)

p.write_text(s, encoding='utf-8')
print('EXPANDED_2029_REAL_PROSPECTS=33')
