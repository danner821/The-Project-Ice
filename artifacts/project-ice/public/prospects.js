/*
============================================================
PROJECT ICE — REAL PROSPECT DATABASE
Research refresh: August 2026

REAL DATA vs GAME DATA
- Identity / real-world snapshot fields are biographical source data.
- Overall, attributes, archetype, potential, certainty and development values
  are Project Ice game-balance evaluations, not official scouting ratings.
- Unknown biographical values stay null; they are never invented.

PERSISTENCE CONTRACT
- Full prospect rankings can contain draft years 2024 and later.
- Only real 2027–2030 prospects are persistent future-world players.
- 2024–2026 ranking players are bridge/history context only and NEVER port to
  the later Project Ice NHL world.
- Project Ice begins with the 2027 class in its freshman-era starting state.
============================================================
*/

'use strict';

/* global REAL_PROSPECTS, PROJECT_ICE_PROSPECT_RULES */

const PROJECT_ICE_PROSPECT_RULES = Object.freeze({
  rankingStartDraftYear: 2024,
  persistentRealDraftYears: Object.freeze([2027, 2028, 2029, 2030]),
  nhlPortMinimumDraftYear: 2027,
  nhlPortMaximumDraftYear: 2030,
  prePersistentClassesAreRankingOnly: true,
  researchedRealProspectCount: 150,
  researchedClassCounts: Object.freeze({ 2027: 87, 2028: 28, 2029: 3, 2030: 32 }),
  projectIceStartAgeByDraftYear: Object.freeze({ 2027: 14, 2028: 13, 2029: 12, 2030: 11 }),
  projectIceClassLabelByDraftYear: Object.freeze({
    2027: 'Freshman',
    2028: 'Pre-HS',
    2029: 'Pre-HS',
    2030: 'Pre-HS',
  }),
});

/*
 * Compact sourced rows:
 * fullName, position, realTeamSnapshot, realLeagueSnapshot, birthDate,
 * nationality, height, weightLbs, shoots/catches, draftYear, sourceOrder.
 */
const PROJECT_ICE_REAL_PROSPECT_SOURCE_ROWS = [
  ['Iļja Ņikitins', 'G', 'Philadelphia Rebels', 'NAHL', '2008-12-21', 'Latvia', '6\'0"', 179, '', 2027, 1],
  ['Daniyar Aibatov', 'D', 'Irbis Kazan', 'MHL', '2009-01-07', 'Russia', '6\'1"', 172, 'R', 2027, 2],
  ['Illarion Babkin', 'D', 'MHK Spartak Moskva', 'MHL', '2009-02-11', 'Russia', '6\'1"', 183, 'R', 2027, 3],
  ['Prabh Bhathal', 'F', 'Brandon Wheat Kings', 'WHL', '2009-05-14', 'Canada', '6\'2"', 201, 'L', 2027, 4],
  ['Luca Blonda', 'D', 'Sudbury Wolves', 'OHL', '2008-11-25', 'Canada', '5\'11"', 174, 'R', 2027, 5],
  ['Aden Bouchard', 'D', 'Tri-City Americans', 'WHL', '2009-03-25', 'Canada', '6\'0"', 163, 'L', 2027, 6],
  ['Dominick Byrtus', 'D', 'HC Ocelari Trinec U20', 'Czechia U20', '2009-04-21', 'Czechia', '5\'10"', 181, 'L', 2027, 7],
  ['Max Calce', 'C', 'Jungadler Mannheim U20', 'DNL U20', '2009-06-11', 'Germany', '5\'11"', 181, 'L', 2027, 8],
  ['Brock Chitaroni', 'RW', "Ottawa 67's", 'OHL', '2009-01-27', 'Canada', '5\'11"', 176, 'R', 2027, 9],
  ['Brock Cripps', 'D', 'Prince Albert Raiders', 'WHL', '2009-07-23', 'Canada', '5\'10"', 161, 'R', 2027, 10],
  ['Noah Davidson', 'F', 'Medicine Hat Tigers', 'WHL', '2008-11-01', 'USA', '6\'3"', 216, 'L', 2027, 11],
  ['Patrick Déniger', 'G', 'Québec Remparts', 'QMJHL', '2008-10-02', 'Canada', '6\'2"', 190, '', 2027, 12],
  ['Landon DuPont', 'D', 'Everett Silvertips', 'WHL', '2009-05-28', 'Canada', '6\'0"', 190, 'R', 2027, 13],
  ['Ryerson Edgar', 'C', 'Niagara IceDogs', 'OHL', '2009-07-30', 'Canada', '5\'10"', 161, 'R', 2027, 14],
  ['Dorian Eklund Aspe', 'C/W', 'Djurgårdens IF U18', 'U18 Nationell', '2009-02-04', 'Sweden', '6\'4"', 209, 'R', 2027, 15],
  ['Brock England', 'C', 'Seattle Thunderbirds', 'WHL', '2009-08-22', 'Canada', '5\'11"', 174, 'L', 2027, 16],
  ['Kohyn Eshkawkogan', 'D', "Ottawa 67's", 'OHL', '2008-11-19', 'Canada', '5\'11"', 183, 'R', 2027, 17],
  ['Nolan Fitzhenry', 'C', 'U.S. National U17 Team', 'NTDP', '2009-02-10', 'USA', '5\'11"', 183, 'L', 2027, 18],
  ['Loïk Gariepy', 'C', 'Victoriaville Tigres', 'QMJHL', '2009-06-13', 'Canada', '6\'0"', 170, 'L', 2027, 19],
  ['Semyon Gerasimov', 'LW', 'Kuznetskie Medvedi', 'MHL', '2008-11-09', 'Russia', '5\'11"', 201, 'R', 2027, 20],
  ['Jamie Glance', 'RW/C', 'U.S. National U18 Team', 'NTDP', '2008-09-23', 'USA', '5\'11"', 183, 'R', 2027, 21],
  ['Shaeffer Gordon-Carroll', 'F', 'Medicine Hat Tigers', 'WHL', '2008-11-26', 'USA', '6\'0"', 190, 'R', 2027, 22],
  ['Diego Gutierrez', 'D', 'U.S. National U17 Team', 'NTDP', '2009-05-13', 'USA', '6\'2"', 187, 'R', 2027, 23],
  ['Levi Harper', 'D', 'Saginaw Spirit', 'OHL', '2008-10-03', 'USA', '5\'11"', 174, 'R', 2027, 24],
  ['Michal Hartl', 'C/W', 'HC Kometa Brno U20', 'Czechia U20', '2009-06-11', 'Czechia', '6\'0"', 190, 'R', 2027, 25],
  ['Ben Harvey', 'F', 'Prince Albert Raiders', 'WHL', '2009-08-06', 'Canada', '5\'11"', 183, 'R', 2027, 26],
  ['Adam Israilov', 'F', 'Omaha Lancers', 'USHL', '2008-10-16', 'Russia', '6\'1"', 185, 'L', 2027, 27],
  ['Jaxon Jacobson', 'C', 'Brandon Wheat Kings', 'WHL', '2008-12-11', 'Canada', '5\'10"', 183, 'L', 2027, 28],
  ['Luca Jarvis', 'RW', 'Tri-City Storm', 'USHL', '2008-11-15', 'USA', '6\'1"', 181, 'R', 2027, 29],
  ['Douglas Johnsson', 'D', 'Skellefteå AIK U20', 'U20 Nationell', '2009-07-01', 'Sweden', '5\'10"', 172, 'R', 2027, 30],
  ['Alexis Joseph', 'C', 'Saint John Sea Dogs', 'QMJHL', '2009-06-16', 'Canada', '6\'5"', 201, 'L', 2027, 31],
  ['Lukas Kachlir', 'D', 'Bili Tygri Liberec U20', 'Czechia U20', '2009-09-05', 'Czechia', '5\'8"', 150, 'R', 2027, 32],
  ['Loui Karlsson', 'F', 'Leksands IF U18', 'U18 Region', '2009-09-10', 'Sweden', '5\'10"', 176, 'L', 2027, 33],
  ['Timothy Kazda', 'F', 'Chicago Steel', 'USHL', '2008-10-04', 'Slovakia', '6\'1"', 194, 'R', 2027, 34],
  ['Lenni Kokkonen', 'D', 'Kärpät U20', 'U20 SM-sarja', '2009-03-25', 'Finland', '6\'2"', 190, 'R', 2027, 35],
  ['Ilya Kolmakov', 'LW', 'Sherbrooke Phoenix', 'QMJHL', '2008-09-30', 'Russia', '6\'1"', 165, 'L', 2027, 36],
  ['Ilya Kolomytsev', 'C', 'Irbis Kazan', 'MHL', '2009-07-16', 'Russia', '5\'9"', 154, 'R', 2027, 37],
  ['Roman Kozhevnikov', 'LW', 'Belye Medvedi Chelyabinsk', 'MHL', '2009-06-14', 'Russia', '6\'2"', 201, 'R', 2027, 38],
  ['Aleks Kulemin', 'C', 'Kingston Frontenacs', 'OHL', '2009-03-20', 'Canada', '6\'2"', 183, 'L', 2027, 39],
  ['Roni Kuukasjärvi', 'D', 'Ilves U20', 'U20 SM-sarja', '2009-04-08', 'Finland', '6\'1"', 174, 'R', 2027, 40],
  ["Malik L'Italien", 'D', 'Halifax Mooseheads', 'QMJHL', '2009-06-10', 'Canada', '6\'3"', 187, 'L', 2027, 41],
  ['Oskars Lūks', 'D', 'Jukurit U18', 'U18 Mestis', '2008-10-12', 'Latvia', '6\'5"', 209, 'L', 2027, 42],
  ['Tyden Lafournaise', 'F', 'Lethbridge Hurricanes', 'WHL', '2009-03-17', 'Canada', '6\'0"', 185, 'R', 2027, 43],
  ['Brenner Lammens', 'C', 'Sarnia Sting', 'OHL', '2009-09-13', 'Canada', '6\'0"', 190, 'L', 2027, 44],
  ['Miska Liljeberg', 'F', 'Ilves U20', 'U20 SM-sarja', '2009-02-20', 'Finland', '6\'0"', 190, 'L', 2027, 45],
  ['Crew Martinson', 'F', 'Tri-City Americans', 'WHL', '2009-04-30', 'Canada', '6\'2"', 187, 'R', 2027, 46],
  ['Kaden McGregor', 'C', 'Peterborough Petes', 'OHL', '2009-01-30', 'Canada', '5\'11"', 181, 'R', 2027, 47],
  ['Ossie McIntyre', 'F', 'Spokane Chiefs', 'WHL', '2009-03-18', 'Canada', '5\'9"', 163, 'L', 2027, 48],
  ['Eli McKamey', 'F', 'Victoria Royals', 'WHL', '2009-01-19', 'Canada', '5\'10"', 176, 'R', 2027, 49],
  ['Bosse Meijer', 'C', 'Frölunda HC U20', 'U20 Nationell', '2008-12-17', 'Sweden', '5\'10"', 168, 'L', 2027, 50],
  ['Carter Meyer', 'C', 'U.S. National U17 Team', 'NTDP', '2009-04-10', 'USA', '6\'0"', 176, 'L', 2027, 51],
  ['Charlie Murata', 'F', 'Flint Firebirds', 'OHL', '2009-02-15', 'Canada', '6\'0"', 183, 'R', 2027, 52],
  ['Roberts Naudiņš', 'F', "Shattuck St. Mary's 18U Prep", 'USHS-Prep', '2008-11-18', 'Latvia', '6\'6"', 212, 'L', 2027, 53],
  ['Sammy Nelson', 'F', 'U.S. National U18 Team', 'NTDP', '2008-09-19', 'USA', '6\'2"', 192, 'R', 2027, 54],
  ['Adam Nemec', 'LW', 'Bili Tygri Liberec', 'Czechia', '2009-07-28', 'Czechia', '6\'0"', 165, 'L', 2027, 55],
  ['Jonah Neuenschwander', 'F', 'EHC Biel-Bienne Spirit U21', 'Swiss U21-Elit', '2009-03-10', 'Switzerland', '6\'3"', 187, 'L', 2027, 56],
  ['Andrei Nikolayev', 'G', 'New Jersey Jr. Titans', 'NAHL', '2009-06-03', 'Russia', '6\'4"', 168, '', 2027, 57],
  ['Oliver Ozogany', 'LW', 'Tri-City Storm', 'USHL', '2009-01-16', 'Slovakia', '6\'3"', 190, 'L', 2027, 58],
  ['Rocco Pelosi', 'C', 'U.S. National U17 Team', 'NTDP', '2009-01-28', 'USA', '5\'11"', 176, 'L', 2027, 59],
  ['Nazar Privalov', 'C/LW', 'Krasnaya Armiya Moskva', 'MHL', '2009-05-25', 'Russia', '6\'4"', 227, 'L', 2027, 60],
  ['Jake Prunty', 'D', 'Sioux Falls Stampede', 'USHL', '2009-03-04', 'USA', '5\'10"', 154, 'R', 2027, 61],
  ['Andrei Pustovoy', 'RW/C', 'Loko Yaroslavl', 'MHL', '2008-12-08', 'Russia', '6\'3"', 201, 'L', 2027, 62],
  ['Samuel Rheault', 'LW', 'Rouyn-Noranda Huskies', 'QMJHL', '2008-10-21', 'Canada', '6\'0"', 183, 'L', 2027, 63],
  ['Luca Santala', 'C/W', 'Kiekko-Espoo U20', 'U20 SM-sarja', '2009-07-28', 'Finland', '6\'2"', 176, 'R', 2027, 64],
  ['Rhett Sather', 'D', 'Spokane Chiefs', 'WHL', '2008-09-25', 'Canada', '5\'11"', 179, 'L', 2027, 65],
  ['Daniil Savin', 'C', 'Akademiya SKA St. Petersburg', 'MHL', '2009-02-18', 'Russia', '6\'0"', 163, 'L', 2027, 66],
  ['James Scantlebury', 'C', 'Chicago Steel', 'USHL', '2009-01-15', 'Canada', '5\'10"', 172, 'L', 2027, 67],
  ['Vladimir Shtyrkhunov', 'D', 'Krasnaya Armiya Moskva', 'MHL', '2009-01-15', 'Russia', '6\'0"', 157, 'R', 2027, 68],
  ['Paul Sintschnig', 'F', 'Villacher SV', 'ICEHL', '2009-03-11', 'Austria', '6\'1"', 176, 'L', 2027, 69],
  ['Sergei Skvortsov', 'LW', 'Chaika Nizhny Novgorod', 'MHL', '2009-03-11', 'Russia', '6\'0"', 154, 'R', 2027, 70],
  ['Nolan Snyder', 'F', 'Kingston Frontenacs', 'OHL', '2009-04-13', 'USA', '5\'11"', 179, 'R', 2027, 71],
  ['Kayden Stroeder', 'F', 'Edmonton Oil Kings', 'WHL', '2009-03-01', 'Canada', '5\'10"', 150, 'L', 2027, 72],
  ['Oliver Sundberg', 'F', 'Djurgårdens IF U18', 'U18 Region', '2009-01-10', 'Sweden', '6\'0"', 176, 'R', 2027, 73],
  ['Milan Sundström', 'C', 'MoDo Hockey U20', 'U20 Nationell', '2009-05-06', 'Sweden', '6\'3"', 196, 'L', 2027, 74],
  ['Chase Surkan', 'F', 'Brandon Wheat Kings', 'WHL', '2009-03-31', 'Canada', '5\'8"', 168, 'L', 2027, 75],
  ['Max Syrjäläinen', 'D', 'Jokerit U20', 'U20 SM-sarja', '2009-01-30', 'Finland', '6\'4"', 187, 'L', 2027, 76],
  ['Boston Tait', 'D', 'Wenatchee Wild', 'WHL', '2009-04-13', 'Canada', '6\'2"', 183, 'L', 2027, 77],
  ['Sebastian Taliga', 'F', 'Mora IK U18', 'U18 Region', '2009-03-16', 'Czechia', '5\'10"', 179, 'L', 2027, 78],
  ['Dāvids Tarvids', 'C/LW', 'HC Plzen U20', 'Czechia U20', '2008-10-22', 'Latvia', '6\'2"', 205, 'R', 2027, 79],
  ['Petr Tomek', 'C', 'HC Energie Karlovy Vary', 'Czechia', '2008-10-23', 'Czechia', '5\'10"', 165, 'L', 2027, 80],
  ['Yaroslav Vetrov', 'G', 'Sibirskie Snaipery Novosibirsk', 'MHL', '2009-01-12', 'Russia', '6\'2"', 183, '', 2027, 81],
  ['Easton Walos', 'C', 'Sarnia Sting', 'OHL', '2008-12-28', 'USA', '5\'11"', 174, 'L', 2027, 82],
  ['Camryn Warren', 'F', 'North Bay Battalion', 'OHL', '2009-05-07', 'Canada', '5\'10"', 159, 'R', 2027, 83],
  ['Jaakko Wycisk', 'RW/C', 'Guelph Storm', 'OHL', '2009-03-16', 'Canada', '6\'1"', 190, 'R', 2027, 84],
  ['Yevgeni Yakunin', 'C', 'MHK Spartak Moskva', 'MHL', '2009-02-09', 'Russia', '6\'3"', 194, 'L', 2027, 85],
  ['Dima Zhilkin', 'RW', 'Saginaw Spirit', 'OHL', '2008-10-21', 'Canada', '5\'10"', 185, 'R', 2027, 86],
  ['Riley Zupfer', 'F', 'Des Moines Buccaneers', 'USHL', '2008-12-17', 'USA', '6\'0"', 170, 'L', 2027, 87],
  ['Liam Pue', 'F', 'Regina Pat Canadians U18 AAA', 'SMAAAHL', '2010-02-16', 'Canada', '6\'2"', 176, 'R', 2028, 1],
  ['Maddox Schultz', 'F', 'Regina Pat Canadians U18 AAA', 'SMAAAHL', '2010-03-15', 'Canada', '5\'10"', 181, 'L', 2028, 2],
  ['Lucas Andrejko', 'F', 'HC Dynamo Pardubice U17', 'Czechia U17', '2010-04-04', 'Czechia', '5\'8"', 165, 'L', 2028, 3],
  ['Wilson Boumedienne', 'C', 'Mount St. Charles Acad 15U AAA', '15U AAA', '2010-06-29', 'Sweden', '6\'0"', 161, 'L', 2028, 4],
  ['Zaac Charbonneau', 'F', 'Mount St. Charles Acad 15U AAA', '15U AAA', '2010-01-18', 'Canada', '6\'1"', 185, 'L', 2028, 5],
  ['Joey Cullen', 'F', 'Moorhead High', 'USHS-MN', '2010-04-17', 'USA', '5\'11"', 161, 'L', 2028, 6],
  ['Drew Daley', 'D', "Shattuck St. Mary's 18U Prep", 'USHS-Prep', '2010-02-16', 'USA', '5\'11"', 154, 'R', 2028, 7],
  ['Ahmad Fayad', 'F', 'Northern Alberta Xtreme U18 Prep', 'CSSHL U18', '2010-07-29', 'Canada', '5\'10"', 174, 'L', 2028, 8],
  ['Paavo Fugleberg', 'RW', 'TPS U18', 'U18 SM-sarja', '2009-10-20', 'Finland', '6\'0"', 176, 'L', 2028, 9],
  ['Jack Hair', 'D', 'Little Caesars 15U AAA', 'MAHA 15U', '2010-05-28', 'USA', '5\'10"', 168, 'L', 2028, 10],
  ['Louis-Oscar Holowaychuk', 'C', "St. George's School U18 Prep", 'CSSHL U18', '2010-02-05', 'Canada', '5\'9"', 141, 'R', 2028, 11],
  ['Cruz Jim', 'D', 'Northern Alberta Xtreme U18 Prep', 'CSSHL U18', '2010-01-27', 'Canada', '5\'9"', 161, 'R', 2028, 12],
  ['Ezekiel Kaebel', 'F', 'Dallas Stars Elite 16U AAA', 'T1EHL 16U', '2010-01-23', 'USA', '5\'8"', 157, 'L', 2028, 13],
  ['Frans Karjalahti', 'F', 'HIFK U20', 'U20 SM-sarja', '2009-11-20', 'Finland', '6\'0"', 174, 'L', 2028, 14],
  ['Aiden Kelly', 'F', 'Little Caesars 15U AAA', 'MAHA 15U', '2010-02-02', 'USA', '5\'10"', 170, 'R', 2028, 15],
  ['Milan Kutsevich', 'F', 'North Jersey Avalanche 15U AAA', 'AYHL 15U', '2010-02-02', 'Belarus', '5\'9"', 172, 'L', 2028, 16],
  ['Ricards Lisovskis', 'D', 'Lukko U18', 'U18 SM-sarja', '2009-09-20', 'Latvia', '6\'6"', 194, 'R', 2028, 17],
  ['William LoSauro', 'F', 'North Jersey Avalanche 16U AAA', 'AYHL 16U', '2010-07-13', 'USA', '5\'10"', 154, 'L', 2028, 18],
  ['Matyas Michalek', 'D', 'HC Sparta Praha U20', 'Czechia U20', '2010-01-18', 'Czechia', '6\'3"', 187, 'L', 2028, 19],
  ['Reid Nicol', 'F', 'Brandon Wheat Kings U18 AAA', 'MU18HL', '2010-02-04', 'Canada', '6\'1"', 194, 'L', 2028, 20],
  ['Leon Roos', 'C', 'Brynäs IF U18', 'U18 Region', '2010-02-21', 'Sweden', '6\'1"', 161, 'L', 2028, 21],
  ['Lucas Roynezon', 'C', 'Örebro HK U18', 'U18 Region', '2010-09-11', 'Sweden', '6\'1"', 187, 'L', 2028, 22],
  ['Adrian Sgro', 'D', 'Vaughan Kings U16 AAA', 'GTHL U16', '2010-03-15', 'Canada', '6\'0"', 185, 'L', 2028, 23],
  ['Milo Spelkvist', 'RW', 'Örebro HK U18', 'U18 Region', '2010-01-09', 'Sweden', '5\'11"', 170, 'R', 2028, 24],
  ['Philip Tollefsen', 'D', 'Färjestad BK U18', 'U18 Region', '2010-01-19', 'Norway', '6\'1"', 176, 'R', 2028, 25],
  ['Yakov Kazantsev', 'G', 'Loko-76 Yaroslavl', 'MHL', '2009-11-28', 'Russia', '6\'0"', 168, 'L', 2028, 26],
  ['Andrei Milyayev', 'RW/LW', 'Sputnik Almetievsk', 'MHL', '2009-12-13', 'Russia', '6\'3"', 181, 'L', 2028, 27],
  ['Benjamin Veitch', 'C', 'Newfoundland Regiment', 'QMJHL', '2009-10-11', 'Canada', '6\'3"', 201, 'L', 2028, 28],
  ['Madden Daneault', 'F', 'Red Deer Rebels U15 AAA', 'AEHL U15', '2011-05-07', 'Canada', '5\'11"', 172, 'R', 2029, 1],
  ['Parker McMillan', 'F', 'Yale Hockey Academy U15 Prep', 'CSSHL U15', '2011-06-13', 'Canada', '6\'3"', 192, 'R', 2029, 2],
  ['Tyson Orr', 'F', 'Elgin Middlesex Canucks U15 AAA', 'U15 AAA', '2011-01-22', 'Canada', '5\'8"', 183, 'R', 2029, 3],
  ['Kale Nicol', 'F', 'Brandon Wheat Kings U18 AAA', 'MU18HL', '2012-02-11', 'Canada', '5\'8"', 165, 'L', 2030, 1],
  ['Jack Keiser', 'F', "Shattuck St. Mary's 14U AAA", '14U AAA', '2012-04-21', 'USA', '6\'0"', 165, 'L', 2030, 2],
  ['Jack Leibowitz', 'F', 'Los Angeles Jr. Kings 14U AAA', 'T1EHL 14U', '2012-01-26', 'USA', '5\'8"', 139, 'R', 2030, 3],
  ['Brayden Pearsall', 'F', 'Pittsburgh Penguins Elite 16U', '16U AAA', '2012-01-11', 'USA', '5\'9"', 154, 'L', 2030, 4],
  ['Clive Mashinter', 'F', 'North York Rangers U14 AAA', 'GTHL U14', '2012', 'Canada', '', null, '', 2030, 5],
  ['Tristan Reynolds', 'F', 'Toronto Jr. Canadiens U14 AAA', 'GTHL U14', '2012-02-13', 'Canada', '5\'11"', 192, 'L', 2030, 6],
  ['Elis Herrlin', 'F', 'Växjö Lakers HC U16', 'U16 Region', '2012-03-10', 'Sweden', '', null, 'L', 2030, 7],
  ['Matthew Dodic', 'F', 'Toronto Marlboros U14 AAA', 'GTHL U14', '2012', 'Canada', '', null, '', 2030, 8],
  ['Jack Brayman', 'F', 'Mid Fairfield HC 13U AAA', '13U AAA', '2012-02-25', 'USA', '5\'8"', 143, '', 2030, 9],
  ['Sawyer Gedanitz', 'D', 'Toronto Titans U14 AAA', 'U14 AAA', '2012-03-01', 'Canada', '5\'7"', 146, 'L', 2030, 10],
  ['Sebastian Erat', 'F', 'Nashville Jr. Predators 14U AAA', 'T1EHL 14U', '2012-02-21', 'USA', '', null, 'R', 2030, 11],
  ['Coen Chretien', 'F', 'North York Rangers U14 AAA', 'GTHL U14', '2012', 'Canada', '', null, '', 2030, 12],
  ['Jordan Labelle', 'F', 'Saskatoon Blazers U18 AAA', 'SMAAAHL', '2012-04-30', 'Canada', '5\'8"', 150, 'L', 2030, 13],
  ['Egor Karpovtsev', 'F', 'Mid Fairfield HC 13U AAA', '13U AAA', '2012-01-17', 'USA', '5\'9"', 143, 'L', 2030, 14],
  ['Ryan Graves', 'F', 'Mid Fairfield HC 13U AAA', '13U AAA', '2012-03-09', 'USA', '5\'5"', 112, 'R', 2030, 15],
  ['Michael Alati', 'F', 'Toronto Jr. Canadiens U14 AAA', 'GTHL U14', '2012', 'Canada', '', null, '', 2030, 16],
  ['Breaker Seidenberg', 'D', 'P.A.L. Junior Islanders 14U AAA', '14U AAA', '2012', 'USA', '', null, '', 2030, 17],
  ['Roope Mustajärvi', 'F', 'Luleå HF U16', 'U16 Region', '2012-02-03', 'Finland', '5\'10"', 141, 'L', 2030, 18],
  ['Antonio Jarl', 'D', 'Mid Fairfield HC 13U AAA', '13U AAA', '2012-07-27', 'USA', '5\'11"', 176, 'L', 2030, 19],
  ['Jayden Widen', 'F', 'Mount St. Charles Acad 14U AAA', '14U AAA', '2012', 'USA', '', null, '', 2030, 20],
  ['Mason Garant', 'D', 'Chatham-Kent Cyclones U14 AAA', 'U14 AAA', '2012-05-28', 'Canada', '5\'9"', 137, 'R', 2030, 21],
  ['Kellan Fitzgerald-Brown', 'D', 'New Jersey Rockets 14U AAA', 'THF 14U', '2012-10-01', 'USA', '6\'1"', 196, 'L', 2030, 22],
  ['Killian Wall', 'D', 'Yale Hockey Academy U15 Prep', 'CSSHL U15', '2012-04-15', 'Canada', '5\'10"', 154, 'L', 2030, 23],
  ['Silas Suess', 'D', 'Vaughan Kings U14 AAA', 'GTHL U14', '2012', 'Canada', '', null, '', 2030, 24],
  ['Matteo Dellino', 'F', 'Toronto Marlboros U14 AAA', 'GTHL U14', '2012', 'Canada', '', null, '', 2030, 25],
  ['Charlie Donovan', 'F', 'Woodbridge Wolfpack 14U AAA', 'THF U14', '2012', 'USA', '', null, '', 2030, 26],
  ["Chase O'Toole", 'F', 'Southern Rangers U15 AAA', 'NBU15AAAHL', '2012', 'Canada', '', null, '', 2030, 27],
  ['Matěj Slanec', 'F', 'HC Slavia Praha U15', 'Czechia U15', '2012-01-26', 'Czechia', '', null, 'L', 2030, 28],
  ['Jacob Van Horssen', 'F', 'Southern Rangers U15 AAA', 'NBU15AAAHL', '2012-05-07', 'Canada', '5\'10"', 165, 'L', 2030, 29],
  ['Aston Salts', 'F', 'Växjö Lakers HC U16', 'U16 Region', '2012-12-07', 'Sweden', '', null, 'L', 2030, 30],
  ['Ian Kim', 'F', 'Calgary Edge School U15 Prep', 'CSSHL U15', '2012-07-16', 'Canada', '5\'7"', 141, 'L', 2030, 31],
  ['Cash Cieslak', 'F', 'Chicago Mission 14U AAA', '14U AAA', '2012-10-15', 'USA', '', null, 'R', 2030, 32],
];

function slugifyProspectName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hashProspectValue(value) {
  let hash = 2166136261;
  const text = String(value || '');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clampProspectRating(value) {
  return Math.max(25, Math.min(99, Math.round(Number(value) || 25)));
}

function normalizeProspectPosition(position) {
  const raw = String(position || 'F').toUpperCase();
  if (raw === 'G') return 'G';
  if (raw === 'D' || raw === 'LD' || raw === 'RD') return 'D';
  if (raw.includes('C')) return 'C';
  if (raw.includes('RW')) return 'RW';
  if (raw.includes('LW')) return 'LW';
  return 'F';
}

function getProspectPotentialTier(position, potential) {
  const pos = normalizeProspectPosition(position);
  const value = Number(potential) || 75;
  if (value >= 96) return 'Franchise';
  if (value >= 90) return 'Elite';
  if (pos === 'D') {
    if (value >= 84) return 'Top 4 D';
    if (value >= 78) return 'Top 6 D';
    return 'Depth D';
  }
  if (pos === 'G') {
    if (value >= 84) return 'Starter';
    if (value >= 78) return 'Fringe Starter';
    return 'Backup';
  }
  if (value >= 84) return 'Top 6 F';
  if (value >= 78) return 'Top 9 F';
  return 'Bottom 6 F';
}

/*
 * Manual scouting/game-balance overrides are intentionally sparse. The 2027
 * source pool is not a published 1–87 ranking, so alphabetical/source order is
 * never treated as talent order. Farther-out classes start with less certainty.
 */
const PROJECT_ICE_PROSPECT_RATING_OVERRIDES = Object.freeze({
  'Landon DuPont': [70, 96, 'Offensive Defenseman'],
  'Alexis Joseph': [67, 93, 'Power Forward'],
  'Milan Sundström': [67, 93, 'Playmaker'],
  'Jaxon Jacobson': [67, 92, 'Playmaker'],
  'Nazar Privalov': [67, 92, 'Power Forward'],
  'Dorian Eklund Aspe': [66, 91, 'Power Forward'],
  'Carter Meyer': [66, 91, 'Playmaker'],
  'Sammy Nelson': [66, 91, 'Power Forward'],
  'Andrei Pustovoy': [66, 91, 'Power Forward'],
  'Dima Zhilkin': [66, 90, 'Sniper'],
  'Brock England': [65, 90, 'Two-Way Forward'],
  'Jonah Neuenschwander': [65, 90, 'Power Forward'],
  'Jamie Glance': [65, 89, 'Sniper'],
  'Kohyn Eshkawkogan': [64, 89, 'Two-Way Defenseman'],
  'Levi Harper': [64, 88, 'Two-Way Defenseman'],
  'Rocco Pelosi': [64, 88, 'Playmaker'],
  'Roberts Naudiņš': [64, 88, 'Power Forward'],
  'Oliver Ozogany': [64, 88, 'Power Forward'],
  'Max Calce': [64, 87, 'Playmaker'],
  'Shaeffer Gordon-Carroll': [64, 87, 'Two-Way Forward'],

  'Liam Pue': [62, 92, 'Power Forward'],
  'Maddox Schultz': [62, 92, 'Playmaker'],
  'Reid Nicol': [61, 90, 'Power Forward'],
  'Joey Cullen': [60, 89, 'Playmaker'],
  'Adrian Sgro': [60, 88, 'Two-Way Defenseman'],
  'Paavo Fugleberg': [60, 88, 'Sniper'],
  'Lucas Roynezon': [59, 87, 'Playmaker'],
  'Ricards Lisovskis': [59, 87, 'Defensive Defenseman'],
  'Matyas Michalek': [59, 87, 'Two-Way Defenseman'],
  'Milo Spelkvist': [59, 86, 'Sniper'],
  'Yakov Kazantsev': [58, 87, 'Hybrid Goalie'],

  'Madden Daneault': [58, 92, 'Playmaker'],
  'Parker McMillan': [57, 90, 'Power Forward'],
  'Tyson Orr': [56, 88, 'Sniper'],

  'Kale Nicol': [54, 91, 'Playmaker'],
  'Jack Keiser': [53, 90, 'Power Forward'],
  'Jack Leibowitz': [53, 90, 'Sniper'],
  'Brayden Pearsall': [52, 89, 'Playmaker'],
  'Tristan Reynolds': [52, 88, 'Power Forward'],
  'Sawyer Gedanitz': [51, 87, 'Offensive Defenseman'],
  'Breaker Seidenberg': [50, 86, 'Two-Way Defenseman'],
  'Antonio Jarl': [50, 86, 'Two-Way Defenseman'],
});

function inferProspectArchetype(row, overall) {
  const name = row[0];
  const position = normalizeProspectPosition(row[1]);
  const weight = Number(row[7]) || 0;
  const override = PROJECT_ICE_PROSPECT_RATING_OVERRIDES[name];
  if (override?.[2]) return override[2];
  if (position === 'G') return 'Hybrid Goalie';
  if (position === 'D') {
    if (weight >= 195) return 'Defensive Defenseman';
    return (hashProspectValue(name) % 2) ? 'Two-Way Defenseman' : 'Offensive Defenseman';
  }
  if (weight >= 195) return 'Power Forward';
  if (position === 'C') return 'Playmaker';
  return (hashProspectValue(name + overall) % 2) ? 'Sniper' : 'Two-Way Forward';
}

function getProspectGameRatings(row) {
  const [name, position, , , , , , , , draftYear, sourceOrder] = row;
  const override = PROJECT_ICE_PROSPECT_RATING_OVERRIDES[name];
  if (override) return { overall: override[0], potential: override[1], archetype: override[2] };

  const hash = hashProspectValue(`${name}:${draftYear}`);
  const jitter = (hash % 5) - 2;
  let overall;
  let potential;

  if (draftYear === 2027) {
    overall = 60 + jitter;
    potential = 80 + (hash % 7);
  } else if (draftYear === 2028) {
    overall = 56 + jitter;
    potential = 80 + (hash % 8);
  } else if (draftYear === 2029) {
    overall = 52 + jitter;
    potential = 83 + (hash % 7);
  } else {
    /* The 2030 source is an early 2012-born watchlist, not an NHL draft board. */
    const earlyRankBoost = Math.max(0, 5 - Math.floor((sourceOrder - 1) / 6));
    overall = 48 + earlyRankBoost + Math.min(2, jitter);
    potential = 78 + earlyRankBoost + (hash % 5);
  }

  return {
    overall: clampProspectRating(overall),
    potential: clampProspectRating(Math.max(overall + 13, potential)),
    archetype: inferProspectArchetype(row, overall),
  };
}

const SKATER_ATTRIBUTE_KEYS = Object.freeze([
  'wristShotPower','wristShotAccuracy','slapShotPower','slapShotAccuracy',
  'passing','puckControl','deking','handEye','speed','acceleration','agility',
  'balance','endurance','offensiveAwareness','defensiveAwareness','poise',
  'discipline','stickChecking','shotBlocking','bodyChecking','strength',
  'durability','faceoffs'
]);

const GOALIE_ATTRIBUTE_KEYS = Object.freeze([
  'reflexes','agility','lateralMovement','recoverySpeed','positioning','angles',
  'reboundControl','gloveHigh','gloveLow','blockerHigh','blockerLow','fiveHole',
  'stickControl','puckTracking','anticipation','composure','consistency',
  'puckHandling','goaliePassing'
]);

function prospectAttributeBias(key, archetype, position, weight) {
  const a = String(archetype || '').toLowerCase();
  let bias = 0;
  if (a.includes('sniper') && /shot|offensiveAwareness/.test(key)) bias += 4;
  if (a.includes('playmaker') && /passing|puckControl|deking|offensiveAwareness|handEye/.test(key)) bias += 4;
  if (a.includes('power') && /strength|balance|bodyChecking|wristShotPower/.test(key)) bias += 4;
  if (a.includes('offensive defense') && /passing|puckControl|offensiveAwareness|slapShot/.test(key)) bias += 3;
  if (a.includes('defensive defense') && /defensiveAwareness|stickChecking|shotBlocking|bodyChecking|strength/.test(key)) bias += 4;
  if (a.includes('two-way') && /defensiveAwareness|offensiveAwareness|stickChecking|passing/.test(key)) bias += 2;
  if (position === 'C' && key === 'faceoffs') bias += 3;
  if (position !== 'C' && key === 'faceoffs') bias -= 4;
  if (Number(weight) >= 195 && /strength|balance|bodyChecking/.test(key)) bias += 2;
  return bias;
}

function buildProspectAttributes({ id, overall, position, archetype, weightLbs }) {
  const normalizedPosition = normalizeProspectPosition(position);
  const keys = normalizedPosition === 'G' ? GOALIE_ATTRIBUTE_KEYS : SKATER_ATTRIBUTE_KEYS;
  const attrs = {};
  keys.forEach((key, index) => {
    const hash = hashProspectValue(`${id}:${key}:${index}`);
    const jitter = (hash % 7) - 3;
    const bias = normalizedPosition === 'G'
      ? (/reflexes|puckTracking|positioning|anticipation/.test(key) ? 2 : 0)
      : prospectAttributeBias(key, archetype, normalizedPosition, weightLbs);
    attrs[key] = clampProspectRating(overall + jitter + bias);
  });
  return attrs;
}

function getProspectConfidence(draftYear, potential) {
  const base = draftYear === 2027 ? 48 : draftYear === 2028 ? 38 : draftYear === 2029 ? 31 : 25;
  const bonus = potential >= 90 ? 5 : potential >= 86 ? 3 : 0;
  const confidence = Math.min(65, base + bonus);
  return {
    potentialConfidence: confidence,
    potentialAccuracy: confidence >= 67 ? 'High' : confidence >= 40 ? 'Medium' : 'Low',
  };
}

function getDevelopmentProfileId(archetype) {
  const a = String(archetype || '').toLowerCase();
  if (a.includes('goalie')) return 'hybridGoalie';
  if (a.includes('offensive defense')) return 'offensiveDefenseman';
  if (a.includes('defensive defense')) return 'defensiveDefenseman';
  if (a.includes('two-way defense')) return 'twoWayDefenseman';
  if (a.includes('sniper')) return 'sniper';
  if (a.includes('playmaker')) return 'playmaker';
  if (a.includes('power')) return 'powerForward';
  return 'twoWayForward';
}

function buildRealProspect(row) {
  const [fullName, position, realTeamSnapshot, realLeagueSnapshot, birthDate,
    nationality, height, weightLbs, shoots, draftYear, sourceOrder] = row;
  const [firstName, ...lastNameParts] = String(fullName).split(' ');
  const lastName = lastNameParts.join(' ');
  const id = `real-${slugifyProspectName(fullName)}`;
  const ratings = getProspectGameRatings(row);
  const confidence = getProspectConfidence(draftYear, ratings.potential);
  const age = PROJECT_ICE_PROSPECT_RULES.projectIceStartAgeByDraftYear[draftYear];
  const year = PROJECT_ICE_PROSPECT_RULES.projectIceClassLabelByDraftYear[draftYear];
  const attributes = buildProspectAttributes({
    id,
    overall: ratings.overall,
    position,
    archetype: ratings.archetype,
    weightLbs,
  });
  const reputationPoints = Math.max(20, Math.min(98,
    34 + (ratings.overall - 48) * 3 + (ratings.potential >= 90 ? 7 : 0)
  ));
  const reputationStars = reputationPoints >= 90 ? 5 : reputationPoints >= 75 ? 4 : reputationPoints >= 55 ? 3 : reputationPoints >= 35 ? 2 : 1;

  return {
    id,
    playerId: id,
    firstName,
    lastName,
    fullName,
    position,
    draftYear,

    /* Real-world factual snapshot. */
    birthDate: birthDate || null,
    nationality: nationality || null,
    height: height || null,
    weightLbs: Number(weightLbs) || null,
    shoots: shoots || null,
    catches: normalizeProspectPosition(position) === 'G' ? (shoots || null) : null,
    realTeamSnapshot: realTeamSnapshot || null,
    realLeagueSnapshot: realLeagueSnapshot || null,
    currentTeam: realTeamSnapshot || null,
    teamName: realTeamSnapshot || null,
    league: realLeagueSnapshot || null,
    sourceOrder,

    /* Project Ice historical starting state. */
    age,
    year,
    careerStage: draftYear === 2027 ? 'hs-freshman-era' : 'pre-hs-prospect',
    overall: ratings.overall,
    attributes,
    archetype: ratings.archetype,
    developmentProfileId: getDevelopmentProfileId(ratings.archetype),
    developmentSeed: Number((0.50 + (ratings.potential - 75) / 100).toFixed(2)),

    potential: ratings.potential,
    potentialTier: getProspectPotentialTier(position, ratings.potential),
    potentialRole: getProspectPotentialTier(position, ratings.potential),
    ...confidence,
    potentialTrend: 'Stable',

    reputationStars,
    reputationPoints,

    realPlayer: true,
    persistentProspect: true,
    portToNhlWorld: true,
    rankingOnly: false,
    dataConfidence: draftYear === 2027 ? 'High' : draftYear === 2028 ? 'Medium' : 'Low',
    biographySource: draftYear === 2030 ? 'Elite Prospects 2012-born watchlist' : 'Elite Prospects draft center',
    ratingSource: 'Project Ice game-balance evaluation',
  };
}

const REAL_PROSPECTS = PROJECT_ICE_REAL_PROSPECT_SOURCE_ROWS.map(buildRealProspect);

/* Runtime invariants — fail loudly in development if the curated pool drifts. */
if (REAL_PROSPECTS.length !== PROJECT_ICE_PROSPECT_RULES.researchedRealProspectCount) {
  throw new Error(`[Project Ice] Expected 150 real prospects, found ${REAL_PROSPECTS.length}.`);
}

const _prospectIds = new Set(REAL_PROSPECTS.map(player => player.id));
if (_prospectIds.size !== REAL_PROSPECTS.length) {
  throw new Error('[Project Ice] Real prospect IDs must be unique.');
}

REAL_PROSPECTS.forEach(player => {
  if (!PROJECT_ICE_PROSPECT_RULES.persistentRealDraftYears.includes(Number(player.draftYear))) {
    throw new Error(`[Project Ice] Invalid real prospect draft year for ${player.fullName}.`);
  }
  if (!player.attributes || Object.keys(player.attributes).length < 19) {
    throw new Error(`[Project Ice] Missing full attributes for ${player.fullName}.`);
  }
  if (player.portToNhlWorld !== true || player.rankingOnly === true) {
    throw new Error(`[Project Ice] 2027–2030 real prospect must persist: ${player.fullName}.`);
  }
});
