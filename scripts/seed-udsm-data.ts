/**
 * UDSM Data Seeder
 * Seeds official University of Dar es Salaam data into the admin panel
 * Run with: npx ts-node --project tsconfig.json scripts/seed-udsm-data.ts
 */

const BASE_URL = 'https://fyp-backend-pi-one.vercel.app/api';
const ADMIN_EMAIL = 'admin@udsminfo.com';
const ADMIN_PASSWORD = 'YourStrongPass1';

// ── Official UDSM Data (from 2024-2025 Prospectus) ─────────────────────────

const COLLEGES = [
  { name: 'College of Engineering and Technology', shortName: 'CoET' },
  { name: 'College of Information and Communication Technologies', shortName: 'CoICT' },
  { name: 'College of Natural and Applied Sciences', shortName: 'CoNAS' },
  { name: 'College of Humanities', shortName: 'CoHU' },
  { name: 'College of Social Sciences', shortName: 'CoSS' },
  { name: 'University of Dar es Salaam Business School', shortName: 'UDBS' },
  { name: 'School of Mines and Geosciences', shortName: 'SoMG' },
  { name: 'University of Dar es Salaam School of Law', shortName: 'UDSoL' },
  { name: 'College of Agriculture and Food Sciences', shortName: 'CoAF' },
];

const DEPARTMENTS_BY_COLLEGE: Record<string, { name: string; shortName: string }[]> = {
  CoET: [
    { name: 'Chemical and Process Engineering', shortName: 'CPE' },
    { name: 'Electrical Engineering', shortName: 'EE' },
    { name: 'Mechanical and Industrial Engineering', shortName: 'MIE' },
    { name: 'Structural and Construction Engineering', shortName: 'SCE' },
    { name: 'Transportation and Geotechnical Engineering', shortName: 'TGE' },
    { name: 'Water Resources Engineering', shortName: 'WRE' },
  ],
  CoICT: [
    { name: 'Computer Science and Engineering', shortName: 'CSE' },
    { name: 'Electronics and Telecommunications Engineering', shortName: 'ETE' },
  ],
  CoNAS: [
    { name: 'Zoology and Wildlife Conservation', shortName: 'ZWC' },
    { name: 'Molecular Biology and Biotechnology', shortName: 'MBB' },
    { name: 'Botany', shortName: 'BOT' },
    { name: 'Chemistry', shortName: 'CHEM' },
    { name: 'Mathematics', shortName: 'MATH' },
    { name: 'Physics', shortName: 'PHYS' },
  ],
  CoHU: [
    { name: 'Archaeology and Heritage Studies', shortName: 'AHS' },
    { name: 'History', shortName: 'HIST' },
    { name: 'Language Studies', shortName: 'LANG' },
    { name: 'Literature', shortName: 'LIT' },
    { name: 'Philosophy and Ethics', shortName: 'PHE' },
    { name: 'Creative Arts', shortName: 'CA' },
  ],
  CoSS: [
    { name: 'Geography', shortName: 'GEO' },
    { name: 'Political Science and Public Administration', shortName: 'PSPA' },
    { name: 'Sociology and Anthropology', shortName: 'SOC' },
    { name: 'Statistics', shortName: 'STAT' },
    { name: 'Information Studies', shortName: 'IS' },
    { name: 'Economics', shortName: 'ECON' },
  ],
  UDBS: [
    { name: 'Accounting', shortName: 'ACCT' },
    { name: 'Finance', shortName: 'FIN' },
    { name: 'General Management', shortName: 'MGT' },
    { name: 'Marketing', shortName: 'MKT' },
  ],
  SoMG: [
    { name: 'Geosciences', shortName: 'GEO-SM' },
    { name: 'Mining and Mineral Processing Engineering', shortName: 'MMPE' },
    { name: 'Petroleum Science and Engineering', shortName: 'PSE' },
  ],
  UDSoL: [
    { name: 'Public Law', shortName: 'PL' },
    { name: 'Private Law', shortName: 'PRL' },
    { name: 'Economic Law', shortName: 'ECL' },
  ],
  CoAF: [
    { name: 'Food Science and Technology', shortName: 'FST' },
    { name: 'Animal Science', shortName: 'ANS' },
    { name: 'Crop Science and Production', shortName: 'CSP' },
  ],
};

// Programmes: [deptShortName, programmeName, code, durationYears]
const PROGRAMMES: [string, string, string, number][] = [
  // CoET
  ['CPE', 'BSc in Chemical and Process Engineering', 'CPE-BSc', 5],
  ['EE', 'BSc in Electrical Engineering', 'EE-BSc', 5],
  ['MIE', 'BSc in Mechanical Engineering', 'ME-BSc', 5],
  ['MIE', 'BSc in Industrial Engineering', 'IE-BSc', 5],
  ['SCE', 'BSc in Civil Engineering', 'CE-BSc', 5],
  ['SCE', 'BSc in Geomatics', 'GEO-BSc', 4],
  ['WRE', 'BSc in Water Resources Engineering', 'WRE-BSc', 5],
  // CoICT
  ['CSE', 'BSc in Computer Science', 'CS-BSc', 3],
  ['CSE', 'BSc in Computer Engineering and Information Technology', 'CEIT-BSc', 4],
  ['CSE', 'BSc in Business Information Technology', 'BIT-BSc', 3],
  ['ETE', 'BSc in Electronics Engineering', 'EE-ETE-BSc', 4],
  ['ETE', 'BSc in Telecommunications Engineering', 'TE-BSc', 4],
  // CoNAS
  ['CHEM', 'BSc in Chemistry', 'CHEM-BSc', 3],
  ['CHEM', 'BSc in Applied Microbiology and Chemistry', 'AMC-BSc', 3],
  ['MBB', 'BSc in Molecular Biology and Biotechnology', 'MBB-BSc', 3],
  ['ZWC', 'BSc in Wildlife Science and Conservation', 'WSC-BSc', 3],
  ['MATH', 'BSc in Actuarial Sciences', 'AS-BSc', 3],
  ['PHYS', 'BSc in Physics', 'PHYS-BSc', 3],
  // CoHU
  ['HIST', 'Bachelor of Arts in History', 'HIST-BA', 3],
  ['AHS', 'Bachelor of Arts in Archaeology', 'ARCH-BA', 3],
  ['AHS', 'Bachelor of Arts in Heritage Management', 'HM-BA', 3],
  ['LANG', 'Bachelor of Arts in Language Studies', 'LANG-BA', 3],
  ['LIT', 'Bachelor of Arts in Literature', 'LIT-BA', 3],
  ['PHE', 'Bachelor of Arts in Philosophy and Ethics', 'PHE-BA', 3],
  ['CA', 'Bachelor of Arts in Music', 'MUS-BA', 3],
  ['CA', 'Bachelor of Arts in Theatre Arts', 'TA-BA', 3],
  // CoSS
  ['PSPA', 'Bachelor of Arts in Political Science and Public Administration', 'PSPA-BA', 3],
  ['SOC', 'Bachelor of Arts in Sociology', 'SOC-BA', 3],
  ['SOC', 'Bachelor of Arts in Anthropology', 'ANTH-BA', 3],
  ['GEO', 'Bachelor of Arts in Geography and Environmental Studies', 'GEO-BA', 3],
  ['STAT', 'Bachelor of Arts in Statistics', 'STAT-BA', 3],
  ['ECON', 'Bachelor of Arts in Economics and Statistics', 'ECON-BA', 3],
  ['IS', 'Bachelor of Arts in Library and Information Studies', 'LIS-BA', 3],
  // UDBS
  ['ACCT', 'Bachelor of Commerce in Accounting', 'BCOM-ACCT', 3],
  ['FIN', 'Bachelor of Commerce in Finance', 'BCOM-FIN', 3],
  ['FIN', 'Bachelor of Commerce in Banking and Financial Services', 'BCOM-BFS', 3],
  ['MGT', 'Bachelor of Business Administration', 'BBA', 3],
  ['MGT', 'Bachelor of Commerce in Human Resources Management', 'BCOM-HRM', 3],
  ['MGT', 'Bachelor of Commerce in Tourism and Hospitality Management', 'BCOM-THM', 3],
  ['MKT', 'Bachelor of Commerce in Marketing', 'BCOM-MKT', 3],
  // SoMG
  ['GEO-SM', 'BSc in Geology', 'GEOL-BSc', 3],
  ['GEO-SM', 'BSc in Geology and Geothermal Resources', 'GGR-BSc', 3],
  ['GEO-SM', 'BSc in Geophysics', 'GPHY-BSc', 3],
  ['GEO-SM', 'BSc in Petroleum Geology', 'PG-BSc', 3],
  ['MMPE', 'BSc in Mining Engineering', 'MIN-BSc', 4],
  ['MMPE', 'BSc in Metallurgy and Mineral Processing Engineering', 'MMPE-BSc', 4],
  ['PSE', 'BSc in Petroleum Engineering', 'PE-BSc', 4],
  // UDSoL
  ['PL', 'Bachelor of Laws', 'LLB', 3],
  ['PL', 'Bachelor of Arts in Law Enforcement', 'BALE', 3],
  // CoAF
  ['FST', 'BSc in Food Science and Technology', 'FST-BSc', 3],
  ['ANS', 'BSc in Animal Science', 'ANS-BSc', 3],
  ['CSP', 'BSc in Crop Science', 'CS-BSc-AGR', 3],
];

// ── Seeder Logic ──────────────────────────────────────────────────────────────

async function login(): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Login failed: ${json.message}`);
  console.log('✅ Logged in as admin');
  return json.data.token;
}

function headers(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function seedColleges(token: string): Promise<Record<string, string>> {
  console.log('\n📚 Seeding Colleges...');
  const collegeIdMap: Record<string, string> = {};

  // First get existing colleges
  const existing = await fetch(`${BASE_URL}/colleges`, { headers: headers(token) });
  const existingJson = await existing.json();
  const existingMap: Record<string, string> = {};
  for (const c of existingJson.data || []) {
    existingMap[c.shortName] = c.id;
  }

  for (const college of COLLEGES) {
    if (existingMap[college.shortName]) {
      console.log(`  ⏭️  Skipping "${college.shortName}" (already exists)`);
      collegeIdMap[college.shortName] = existingMap[college.shortName];
      continue;
    }
    const res = await fetch(`${BASE_URL}/colleges`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(college),
    });
    const json = await res.json();
    if (res.ok) {
      console.log(`  ✅ Created: ${college.name} (${college.shortName})`);
      collegeIdMap[college.shortName] = json.data.id;
    } else {
      console.log(`  ❌ Failed: ${college.name} - ${json.message}`);
    }
  }
  return collegeIdMap;
}

async function seedDepartments(token: string, collegeIdMap: Record<string, string>): Promise<Record<string, string>> {
  console.log('\n🏛️  Seeding Departments...');
  const deptIdMap: Record<string, string> = {};

  const existing = await fetch(`${BASE_URL}/departments`, { headers: headers(token) });
  const existingJson = await existing.json();
  const existingShortNames = new Set((existingJson.data || []).map((d: any) => d.shortName));

  for (const [collegeShortName, depts] of Object.entries(DEPARTMENTS_BY_COLLEGE)) {
    const collegeId = collegeIdMap[collegeShortName];
    if (!collegeId) { console.log(`  ⚠️  No college ID for ${collegeShortName}`); continue; }

    for (const dept of depts) {
      if (existingShortNames.has(dept.shortName)) {
        const existingDept = existingJson.data.find((d: any) => d.shortName === dept.shortName);
        if (existingDept) deptIdMap[dept.shortName] = existingDept.id;
        console.log(`  ⏭️  Skipping "${dept.shortName}" (already exists)`);
        continue;
      }
      const res = await fetch(`${BASE_URL}/departments`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({ name: dept.name, shortName: dept.shortName, collegeId }),
      });
      const json = await res.json();
      if (res.ok) {
        console.log(`  ✅ Created: ${dept.name} → ${collegeShortName}`);
        deptIdMap[dept.shortName] = json.data.id;
      } else {
        console.log(`  ❌ Failed: ${dept.name} - ${json.message}`);
      }
    }
  }
  return deptIdMap;
}

async function seedProgrammes(token: string, deptIdMap: Record<string, string>): Promise<void> {
  console.log('\n🎓 Seeding Programmes...');

  const existing = await fetch(`${BASE_URL}/programmes`, { headers: headers(token) });
  const existingJson = await existing.json();
  const existingCodes = new Set((existingJson.data || []).map((p: any) => p.code));

  for (const [deptShortName, name, code, durationYears] of PROGRAMMES) {
    if (existingCodes.has(code)) {
      console.log(`  ⏭️  Skipping "${code}" (already exists)`);
      continue;
    }
    const departmentId = deptIdMap[deptShortName];
    if (!departmentId) { console.log(`  ⚠️  No dept ID for ${deptShortName} (${name})`); continue; }

    const res = await fetch(`${BASE_URL}/programmes`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ name, code, departmentId, durationYears }),
    });
    const json = await res.json();
    if (res.ok) {
      console.log(`  ✅ Created: ${name} (${code})`);
    } else {
      console.log(`  ❌ Failed: ${name} - ${json.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting UDSM Data Seeder...\n');
  const token = await login();
  const collegeIdMap = await seedColleges(token);
  const deptIdMap = await seedDepartments(token, collegeIdMap);
  await seedProgrammes(token, deptIdMap);
  console.log('\n🎉 Done! UDSM data seeded successfully.');
}

main().catch(console.error);
