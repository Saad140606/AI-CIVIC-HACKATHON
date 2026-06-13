import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

export interface ScrapedOfficialMNA {
  name: string;
  constituencyCode: string;
  constituencyFull: string;
  party: string;
  address: string;
  phone: string;
  profileUrl: string;
  imageUrl: string;
}

export async function scrapeOfficialNASite(): Promise<ScrapedOfficialMNA[]> {
  const url = 'https://na.gov.pk/en/all_members.php';
  console.log('🔄 Fetching official National Assembly members list...');
  
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    timeout: 15000
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch official NA site: ${res.statusText}`);
  }
  
  const html = await res.text();
  const $ = cheerio.load(html);
  const mnas: ScrapedOfficialMNA[] = [];
  
  $('table tr').each((i, row) => {
    const tds = $(row).find('td');
    if (tds.length < 5) return;
    
    const nameEl = $(row).find('#mna a').first();
    if (nameEl.length === 0) return;
    
    const name = nameEl.text().replace(/\s+/g, ' ').trim();
    const profileUrlSuffix = nameEl.attr('href') || '';
    const profileUrl = profileUrlSuffix ? `https://na.gov.pk/en/${profileUrlSuffix}` : '';
    
    const party = tds.eq(2).text().replace(/\s+/g, ' ').trim();
    const address = tds.eq(3).text().replace(/\s+/g, ' ').trim();
    const phone = tds.length >= 6 ? tds.eq(4).text().replace(/\s+/g, ' ').trim() : '';
    
    const imgEl = $(row).find('#mna_profile img').first();
    let imageUrl = '';
    if (imgEl.length > 0) {
      const srcAttr = imgEl.attr('src') || '';
      const match = srcAttr.match(/[?&]src=([^&]+)/);
      if (match) {
        let cleanSrc = decodeURIComponent(match[1]);
        if (cleanSrc.startsWith('../')) {
          cleanSrc = cleanSrc.substring(3);
        }
        imageUrl = `https://na.gov.pk/${cleanSrc}`;
      } else if (srcAttr.startsWith('../')) {
        imageUrl = `https://na.gov.pk/${srcAttr.substring(3)}`;
      } else if (srcAttr) {
        imageUrl = `https://na.gov.pk/${srcAttr}`;
      }
    }
    
    const col0Text = tds.eq(0).text().replace(/\s+/g, ' ').trim();
    const isGeneral = col0Text.toUpperCase().includes('NA-');
    
    let constituencyCode = '';
    let constituencyFull = '';
    if (isGeneral) {
      constituencyFull = col0Text;
      const m = col0Text.match(/(NA-\d+)/i);
      if (m) {
        constituencyCode = m[1].toUpperCase();
      }
    }
    
    mnas.push({
      name,
      constituencyCode,
      constituencyFull,
      party,
      address,
      phone,
      profileUrl,
      imageUrl
    });
  });
  
  console.log(`✅ Scraped ${mnas.length} members from official NA site.`);
  return mnas;
}

if (require.main === module) {
  scrapeOfficialNASite().then(data => {
    const dir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'na_official_scraped.json'), JSON.stringify(data, null, 2));
    console.log(`✅ Saved ${data.length} official members profiles to na_official_scraped.json`);
  }).catch(err => {
    console.error('❌ Failed to run official scraper:', err);
  });
}
