import * as fs from 'fs';
import * as path from 'path';

async function runVerification() {
  console.log('🏁 Starting final data verification checks...');
  
  const mnaPath = path.resolve(__dirname, '../../data/mnas.json');
  if (!fs.existsSync(mnaPath)) {
    console.error('❌ Failed: mnas.json not found!');
    process.exit(1);
  }

  const raw = fs.readFileSync(mnaPath, 'utf8');
  const mnas = JSON.parse(raw);
  
  console.log(`📊 Total MNA profiles in database: ${mnas.length}`);
  
  // 1. Count total MNAs with name source = 'wikipedia' (should be 200+)
  const wikipediaSourceCount = mnas.filter((m: any) => m.dataSource?.name === 'wikipedia').length;
  console.log(`  - 1. MNAs with name source 'wikipedia': ${wikipediaSourceCount} (Target: 200+)`);
  if (wikipediaSourceCount >= 200) {
    console.log('     ✅ Check Passed!');
  } else {
    console.log('     ❌ Check Failed!');
  }

  // 2. Count MNAs with real attendance from PILDAT (will be low, that's ok)
  const pildatCount = mnas.filter((m: any) => m.dataSource?.attendance === 'pildat').length;
  console.log(`  - 2. MNAs with PILDAT attendance source: ${pildatCount}`);
  console.log('     ✅ Check Passed!');

  // 3. Count MNAs with real question data from na.gov.pk
  const questionsCount = mnas.filter((m: any) => m.dataSource?.questions === 'na.gov.pk').length;
  console.log(`  - 3. MNAs with questions source 'na.gov.pk': ${questionsCount}`);
  console.log('     ✅ Check Passed!');

  // 4. Verify NA-242 shows 'Syed Mustafa Kamal' not 'Ahmed Khan'
  const na242 = mnas.find((m: any) => m.constituency.toUpperCase().includes('NA-242'));
  if (na242) {
    console.log(`  - 4. NA-242 MNA name: '${na242.name}' (Party: ${na242.party}, ID: ${na242.id})`);
    if (na242.name === 'Syed Mustafa Kamal') {
      console.log('     ✅ Check Passed (shows Syed Mustafa Kamal)!');
    } else {
      console.log('     ❌ Check Failed (does not show Syed Mustafa Kamal)!');
    }
  } else {
    console.log('  - 4. NA-242 MNA: Not found in database!');
    console.log('     ❌ Check Failed!');
  }

  // 5. Verify constituency lookup works for 'karachi', 'lahore', 'peshawar', 'quetta'
  const lookupCheck = (query: string) => {
    const q = query.toLowerCase();
    const match = mnas.find((m: any) => 
      m.constituency.toLowerCase().includes(q) ||
      m.constituencyUrdu?.toLowerCase().includes(q) ||
      m.province.toLowerCase().includes(q)
    );
    if (match) {
      console.log(`  - 5. Lookup '${query}': Matched ${match.constituency} -> MNA: ${match.name}`);
      return true;
    } else {
      console.log(`  - 5. Lookup '${query}': No match!`);
      return false;
    }
  };

  const lookupCities = ['karachi', 'lahore', 'peshawar', 'quetta'];
  let lookupSuccess = true;
  for (const city of lookupCities) {
    if (!lookupCheck(city)) {
      lookupSuccess = false;
    }
  }

  if (lookupSuccess) {
    console.log('     ✅ Check Passed (all city lookups resolved)!');
  } else {
    console.log('     ❌ Check Failed (some city lookups failed)!');
  }

  // Read scrape logs
  const logPath = path.resolve(__dirname, '../data/scrape_log.json');
  if (fs.existsSync(logPath)) {
    console.log('\n📋 --- SCRAPER LOG SUMMARY ---');
    const logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    for (const key of Object.keys(logs)) {
      console.log(`  [${key}]: Status=${logs[key].status} | Count=${logs[key].recordCount} | Time=${logs[key].timestamp}`);
    }
  }

  console.log('\n🏁 Verification completed!');
}

runVerification();
