from pathlib import Path
p=Path('artifacts/project-ice/public/prospects.js')
s=p.read_text(encoding='utf-8')

old_contract="  researchedRealProspectCount: 150,\n  researchedClassCounts: Object.freeze({ 2027: 87, 2028: 28, 2029: 3, 2030: 32 }),"
new_contract="  minimumRealProspectCount: 150,\n  researchedClassCounts: Object.freeze({ 2027: 87, 2028: 28, 2029: 3, 2030: 48 }),"
if old_contract not in s:
    raise SystemExit('count contract anchor missing')
s=s.replace(old_contract,new_contract,1)

anchor="  ['Cash Cieslak', 'F', 'Chicago Mission 14U AAA', '14U AAA', '2012-10-15', 'USA', '', null, 'R', 2030, 32],\n"
if anchor not in s:
    raise SystemExit('2030 insertion anchor missing')

new_rows="""  ['RJ Celebrini', 'F', 'North Shore WC U15 A1', 'U15 A1', '2012-08-18', 'Canada', '5\\'3\"', 115, 'L', 2030, 33],
  ['Drystan Thomas', 'F', 'Little Caesars 14U AAA', 'MAHA 14U', '2011-12-19', 'USA', '5\\'10\"', 150, 'R', 2030, 34],
  [\"Brooks Brind'Amour\", 'F', 'Carolina Jr. Hurricanes 14U AAA', 'T1EHL 14U', '2011-12-19', 'USA', '', null, '', 2030, 35],
  ['Jack Allgood', 'F', 'MN Lakers 13U AAA', 'MNHP 13O', '2012-06-11', 'USA', '', null, 'L', 2030, 36],
  ['Arnaud Carrière', 'F', 'Outaouais Intrépide M15 AAA E', 'QM15AAA E', '2011-09-23', 'Canada', '6\\'1\"', 150, 'R', 2030, 37],
  ['Flavio DiPlacido', 'F', 'Don Mills Flyers U14 AAA', 'GTHL U14', '2012-01-07', 'Canada', '5\\'3\"', 101, 'R', 2030, 38],
  ['Adam Vertes', 'G', 'Vasas Budapest', 'QC Int PW', '2011-10-05', 'Hungary', '5\\'8\"', 128, 'L', 2030, 39],
  ['Tyson Hines', 'D', 'Charlottetown Islanders U15 AAA', 'PEI U15', '2011-11-08', 'Canada', '5\\'10\"', 150, 'L', 2030, 40],
  ['Ian Luca Scheerschmidt', 'F', 'RB Hockey Academy U16', 'Czechia U15', '2011-12-09', 'Germany', '5\\'10\"', 159, 'L', 2030, 41],
  ['Jett Evans', 'F', 'Northern Alberta Xtreme U15 Prep', 'CSSHL U15', '2011-11-30', 'Canada', '5\\'11\"', 161, 'L', 2030, 42],
  ['Jack Cross', 'F', 'Mount St. Charles Acad 14U AAA', 'THF 14U', '2011-09-22', 'USA', '5\\'8\"', 148, 'R', 2030, 43],
  ['Dominic Manolakis', 'F', 'East Coast Militia 13U AAA', '13U AAA', '2012-02-27', 'USA', '5\\'0\"', 88, 'R', 2030, 44],
  ['Marcellus McField', 'D', 'Burnaby Winter Club U15 AAA', 'CSSHL U15 AAA', '2011-12-24', 'USA', '', null, 'L', 2030, 45],
  ['Peter Broccolini', 'F', 'Lac St-Louis Lions M15 AAA', 'QM15AAA', '2012-05-23', 'Canada', '5\\'3\"', 126, 'R', 2030, 46],
  ['Jordan Tash', 'F', 'North Shore WC U15 A1', 'U15 A1', '2012-03-14', 'Canada', '5\\'4\"', 115, 'L', 2030, 47],
  ['Walter Lundgren', 'F', 'Örebro HK U18', 'U18 Region', '2011-10-02', 'Sweden', '6\\'4\"', 187, 'L', 2030, 48],
"""
for name in [
    'RJ Celebrini','Drystan Thomas',"Brooks Brind'Amour",'Jack Allgood','Arnaud Carrière',
    'Flavio DiPlacido','Adam Vertes','Tyson Hines','Ian Luca Scheerschmidt','Jett Evans',
    'Jack Cross','Dominic Manolakis','Marcellus McField','Peter Broccolini','Jordan Tash','Walter Lundgren'
]:
    if name in s:
        raise SystemExit(f'duplicate candidate already present: {name}')
s=s.replace(anchor,anchor+new_rows,1)

old_invariant="""if (REAL_PROSPECTS.length !== PROJECT_ICE_PROSPECT_RULES.researchedRealProspectCount) {
  throw new Error(`[Project Ice] Expected 150 real prospects, found ${REAL_PROSPECTS.length}.`);
}
"""
new_invariant="""if (REAL_PROSPECTS.length < PROJECT_ICE_PROSPECT_RULES.minimumRealProspectCount) {
  throw new Error(
    `[Project Ice] Expected at least ${PROJECT_ICE_PROSPECT_RULES.minimumRealProspectCount} real prospects, found ${REAL_PROSPECTS.length}.`
  );
}
"""
if old_invariant not in s:
    raise SystemExit('exact-count invariant missing')
s=s.replace(old_invariant,new_invariant,1)

p.write_text(s,encoding='utf-8')
print('NO_CAP_PROSPECT_POOL=166')
print('2027=87 2028=28 2029=3 2030=48')
