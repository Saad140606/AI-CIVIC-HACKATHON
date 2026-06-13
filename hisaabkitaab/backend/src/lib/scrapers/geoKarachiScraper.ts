import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

export interface KarachiResult {
  constituency: string;
  winnerName: string;
  winnerParty: string;
  source: 'geo.tv' | 'wikipedia' | 'fallback';
}

export async function scrapeKarachiResults(): Promise<KarachiResult[]> {
  const results: KarachiResult[] = [];
  console.log('🔄 Fetching Geo.tv Karachi results...');
  
  const geoUrl = 'https://www.geo.tv/election/karachi';
  let geoHtml = '';
  try {
    const res = await fetch(geoUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    if (res.ok) {
      geoHtml = await res.text();
    }
  } catch (err: any) {
    console.log(`⚠️  Could not fetch Geo.tv: ${err.message}`);
  }

  const parsedGeoSeats = new Map<string, { winnerName: string; winnerParty: string }>();

  if (geoHtml) {
    const $ = cheerio.load(geoHtml);
    const regex = /NA\s*(\d+)\s+(Karachi\s+[\w\s\-]+?)\s+([A-Za-z\s\-\.\']+)\s+([A-Z0-9\-\(\)\/]+)\s+(\d+)/i;
    
    // Scan all li, a, div elements for results
    $('li, a, div').each((i, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      const m = text.match(regex);
      if (m) {
        const naNumber = parseInt(m[1], 10);
        if (naNumber >= 229 && naNumber <= 248) {
          const constituency = `NA-${naNumber}`;
          parsedGeoSeats.set(constituency, {
            winnerName: m[3].trim(),
            winnerParty: m[4].trim()
          });
        }
      }
    });
  }

  console.log(`✅ Extracted ${parsedGeoSeats.size} Karachi winner records from Geo.tv.`);

  // Load Wikipedia scraped data to fill any missing Karachi seats (NA-229 to NA-248)
  let wikiMNAs: any[] = [];
  try {
    const wikiPath = path.join(__dirname, '../../data/mna_scraped.json');
    if (fs.existsSync(wikiPath)) {
      wikiMNAs = JSON.parse(fs.readFileSync(wikiPath, 'utf8'));
    }
  } catch (err) {
    console.log('⚠️  Could not read mna_scraped.json for fallback:', err);
  }

  // Populate NA-229 to NA-248
  for (let i = 229; i <= 248; i++) {
    const constituency = `NA-${i}`;
    if (parsedGeoSeats.has(constituency)) {
      const geoSeat = parsedGeoSeats.get(constituency)!;
      results.push({
        constituency,
        winnerName: geoSeat.winnerName,
        winnerParty: geoSeat.winnerParty,
        source: 'geo.tv'
      });
    } else {
      // Fallback to Wikipedia scraped MNA
      const match = wikiMNAs.find((m: any) => m.constituency.toUpperCase().startsWith(constituency));
      if (match) {
        results.push({
          constituency,
          winnerName: match.name,
          winnerParty: match.party,
          source: 'wikipedia'
        });
      } else {
        // Safe hardcoded 2024 defaults for Karachi if everything fails
        const defaultWinners: Record<string, { name: string; party: string }> = {
          'NA-229': { name: 'Jam Abdul Karim', party: 'PPP' },
          'NA-230': { name: 'Syed Rafiullah', party: 'PPP' },
          'NA-231': { name: 'Abdul Hakeem Baloch', party: 'PPP' },
          'NA-232': { name: 'Asia Ishaque', party: 'MQM-P' },
          'NA-233': { name: 'Javed Hanif Khan', party: 'MQM-P' },
          'NA-234': { name: 'Muhammad Abu Bakar', party: 'MQM-P' },
          'NA-235': { name: 'Muhammad Iqbal Khan', party: 'MQM-P' },
          'NA-236': { name: 'Hassan Sabir', party: 'MQM-P' },
          'NA-237': { name: 'Faisal Sabzwari', party: 'MQM-P' },
          'NA-238': { name: 'Sadiq Iftikhar', party: 'MQM-P' },
          'NA-239': { name: 'Yasir Adil', party: 'MQM-P' },
          'NA-240': { name: 'Arshad Abdullah Vohra', party: 'MQM-P' },
          'NA-241': { name: 'Mirza Ikhtiar Baig', party: 'PPP' },
          'NA-242': { name: 'Syed Mustafa Kamal', party: 'MQM-P' },
          'NA-243': { name: 'Abdul Qadir Patel', party: 'PPP' },
          'NA-244': { name: 'Dr Farooq Sattar', party: 'MQM-P' },
          'NA-245': { name: 'Syed Hafeez Uddin Aminul Haque', party: 'MQM-P' },
          'NA-246': { name: 'Syed Aminul Haque', party: 'MQM-P' },
          'NA-247': { name: 'Khawaja Izharul Hassan', party: 'MQM-P' },
          'NA-248': { name: 'Khalid Maqbool Siddiqui', party: 'MQM-P' }
        };
        const def = defaultWinners[constituency] || { name: 'Unknown', party: 'Unknown' };
        results.push({
          constituency,
          winnerName: def.name,
          winnerParty: def.party,
          source: 'fallback'
        });
      }
    }
  }

  console.log(`✅ Compiled results for ${results.length} Karachi constituencies.`);
  return results;
}

if (require.main === module) {
  scrapeKarachiResults().then(data => {
    const dir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'karachi_results.json'), JSON.stringify(data, null, 2));
    console.log('✅ Wrote Karachi results to backend/src/data/karachi_results.json');
  }).catch(err => {
    console.error('❌ Failed to run Karachi scraper:', err);
  });
}
