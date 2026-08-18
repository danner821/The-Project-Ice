const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('artifacts/project-ice/public/prospects.js', 'utf8');
const sandbox = { console, Object, Array, String, Number, Boolean, RegExp, Map, Set, Math, Date, JSON };
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__ROWS = PROJECT_ICE_REAL_PROSPECT_SOURCE_ROWS;`, sandbox, { timeout: 10000 });
const rows = sandbox.__ROWS;

function firstYearEligibility(dateString) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateString || ''));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const afterSept15 = month > 9 || (month === 9 && day > 15);
  return year + (afterSept15 ? 19 : 18);
}

const report = {
  totalRows: rows.length,
  completeDobRows: 0,
  incompleteDobRows: [],
  mismatches: [],
  outside2027to2030: [],
  classCounts: {},
};

for (const row of rows) {
  const [name, position, team, league, birthDate, nationality, height, weight, shoots, storedDraftYear] = row;
  report.classCounts[storedDraftYear] = (report.classCounts[storedDraftYear] || 0) + 1;
  const calculated = firstYearEligibility(birthDate);
  if (calculated == null) {
    report.incompleteDobRows.push({ name, birthDate, storedDraftYear });
    continue;
  }
  report.completeDobRows += 1;
  if (calculated !== Number(storedDraftYear)) {
    report.mismatches.push({ name, birthDate, storedDraftYear: Number(storedDraftYear), calculatedDraftYear: calculated });
  }
  if (calculated < 2027 || calculated > 2030) {
    report.outside2027to2030.push({ name, birthDate, storedDraftYear: Number(storedDraftYear), calculatedDraftYear: calculated });
  }
}

console.log(JSON.stringify(report, null, 2));
