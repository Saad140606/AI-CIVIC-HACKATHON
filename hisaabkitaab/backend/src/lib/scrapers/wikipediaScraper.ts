import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

export interface ScrapedWikiMNA {
  name: string;
  constituency: string;
  party: string;
  province: string;
  isReserved: boolean;
  category?: 'Women' | 'Minorities';
}

function getProvinceFromNA(num: number, region: string): string {
  const r = region.toLowerCase();
  if (r.includes('balochistan')) return 'Balochistan';
  if (r.includes('punjab')) return 'Punjab';
  if (r.includes('sindh')) {
    if (num >= 184 && num <= 213) return 'Sindh (rural)';
    if (num >= 229 && num <= 272) return 'Karachi/Sindh';
    return 'Sindh (urban/Karachi)';
  }
  if (r.includes('khyber') || r.includes('kpk')) return 'KPK';
  if (r.includes('fata')) return 'FATA';
  if (r.includes('capital') || r.includes('islamabad')) return 'Islamabad Capital Territory';
  
  // Fallback ranges
  if (num >= 1 && num <= 89) return 'KPK';
  if (num >= 90 && num <= 93) return 'FATA';
  if (num >= 94 && num <= 183) return 'Punjab';
  if (num >= 184 && num <= 213) return 'Sindh (rural)';
  if (num >= 214 && num <= 228) return 'Sindh (urban/Karachi)';
  if (num >= 229 && num <= 272) return 'Karachi/Sindh';
  if (num >= 273 && num <= 297) return 'Balochistan';
  return 'Unknown';
}

function getProvinceForReservedSeat(party: string): string {
  const p = party.toUpperCase();
  if (p.includes('PML(N)') || p.includes('PML-N')) return 'Punjab';
  if (p.includes('PPP')) return 'Sindh';
  if (p.includes('MQM')) return 'Sindh';
  if (p.includes('SIC')) return 'Punjab';
  if (p.includes('JUI')) return 'KPK';
  if (p.includes('IPP') || p.includes('PML(Q)') || p.includes('PML-Q')) return 'Punjab';
  return 'Punjab'; // default
}

export async function scrapeWikipedia(): Promise<ScrapedWikiMNA[]> {
  const url = 'https://en.wikipedia.org/wiki/List_of_members_of_the_16th_National_Assembly_of_Pakistan';
  console.log('🔄 Fetching Wikipedia members list...');
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch Wikipedia: ${res.statusText}`);
  }
  
  const html = await res.text();
  const $ = cheerio.load(html);
  const rows = $('table.wikitable tr');
  
  const matrix: string[][] = [];
  rows.each((r, row) => {
    matrix[r] = matrix[r] || [];
    let col = 0;
    $(row).find('td, th').each((c, cell) => {
      while (matrix[r][col] !== undefined) {
        col++;
      }
      const rowspan = parseInt($(cell).attr('rowspan') || '1', 10);
      const colspan = parseInt($(cell).attr('colspan') || '1', 10);
      const cellText = $(cell).text().replace(/\s+/g, ' ').trim();
      
      for (let dr = 0; dr < rowspan; dr++) {
        matrix[r + dr] = matrix[r + dr] || [];
        for (let dc = 0; dc < colspan; dc++) {
          matrix[r + dr][col + dc] = cellText;
        }
      }
      col += colspan;
    });
  });

  const mnas: ScrapedWikiMNA[] = [];
  const constituencyMap = new Map<string, ScrapedWikiMNA>();

  // Process rows, skip the header row (index 0)
  for (let r = 1; r < matrix.length; r++) {
    const cols = matrix[r];
    if (!cols || cols.length < 5) continue;
    
    const region = cols[0] || '';
    const rawConstituency = cols[1] || '';
    const rawName = cols[2] || '';
    const rawParty = cols[4] || ''; // column 4 is party in our matrix
    
    // Clean up name and party
    const cleanName = rawName.replace(/\[\d+\]/g, '').trim();
    const cleanParty = rawParty.replace(/\[\d+\]/g, '').trim();
    
    if (!cleanName || cleanName.toLowerCase().includes('seat suspended') || cleanName.toLowerCase().includes('vacant')) {
      continue;
    }
    
    if (region.includes('Reserved seats')) {
      const isWomen = rawConstituency.toLowerCase().includes('women');
      const category = isWomen ? 'Women' : 'Minorities';
      const mna: ScrapedWikiMNA = {
        name: cleanName,
        constituency: `Reserved (${category})`,
        party: cleanParty || 'Independent',
        province: getProvinceForReservedSeat(cleanParty),
        isReserved: true,
        category
      };
      mnas.push(mna);
    } else {
      // General seat
      const naMatch = rawConstituency.match(/NA-(\d+)/i);
      if (naMatch) {
        const naNumber = parseInt(naMatch[1], 10);
        // Extract seat name if exists, e.g. NA-1 Chitral Upper-cum-Chitral Lower -> NA-1 (Chitral Upper-cum-Chitral Lower)
        let seatClean = rawConstituency.replace(/\[\d+\]/g, '').trim();
        const naCode = `NA-${naNumber}`;
        const seatSuffix = seatClean.replace(new RegExp(`^${naCode}\\s*`, 'i'), '').trim();
        const finalConstituency = seatSuffix ? `${naCode} (${seatSuffix})` : naCode;
        
        const mna: ScrapedWikiMNA = {
          name: cleanName,
          constituency: finalConstituency,
          party: cleanParty || 'Independent',
          province: getProvinceFromNA(naNumber, region),
          isReserved: false
        };
        
        // If multiple members exist (due to by-elections), overwriting it keeps the latest
        constituencyMap.set(naCode, mna);
      }
    }
  }

  // Add all general seat MNAs
  for (const mna of constituencyMap.values()) {
    mnas.push(mna);
  }

  console.log(`✅ Scraped ${mnas.length} members from Wikipedia (${constituencyMap.size} general, ${mnas.length - constituencyMap.size} reserved).`);
  return mnas;
}

// Runnable script block if called directly
if (require.main === module) {
  scrapeWikipedia().then(data => {
    const dir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'mna_scraped.json'), JSON.stringify(data, null, 2));
    console.log('✅ Wrote Wikipedia MNA data to backend/src/data/mna_scraped.json');
  }).catch(err => {
    console.error('❌ Failed to run Wikipedia scraper:', err);
  });
}
