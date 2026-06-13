import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';

export interface PildatAttendance {
  [mnaName: string]: number;
}

function matchMnaInLine(mnaName: string, line: string): boolean {
  const cleanLine = line.toLowerCase();
  const cleanName = mnaName.toLowerCase();
  if (cleanLine.includes(cleanName)) return true;
  
  const commonWords = ['syed', 'mian', 'muhammad', 'khan', 'sardar', 'mir', 'pir', 'chauhry', 'chaudhry', 'begum', 'dr', 'mr', 'ms', 'shaikh', 'sheikh', 'malik', 'haji', 'makhdoom', 'liaquat'];
  const parts = cleanName.split(/\s+/).filter(w => w.length > 2 && !commonWords.includes(w));
  
  if (parts.length === 0) return false;
  return parts.every(p => cleanLine.includes(p));
}

export async function scrapePildatAttendance(): Promise<PildatAttendance> {
  const attendanceMap: PildatAttendance = {};
  console.log('🔄 Fetching PILDAT publications index...');
  
  // Use publications page
  const indexUrl = 'https://pildat.org/pildat-publications';
  let indexHtml = '';
  try {
    const res = await fetch(indexUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });
    if (res.ok) {
      indexHtml = await res.text();
    }
  } catch (err: any) {
    console.log(`⚠️  Could not fetch PILDAT publications index: ${err.message}`);
  }

  if (!indexHtml) {
    console.log('⚠️  PILDAT index html empty. Falling back to empty map.');
    return attendanceMap;
  }

  const $ = cheerio.load(indexHtml);
  const articleUrls: string[] = [];

  $('a').each((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().toLowerCase();
    const lowerHref = href.toLowerCase();
    
    // Look for article links representing parliamentary monitoring
    if (
      (lowerHref.includes('parliamentary-monitoring') || lowerHref.includes('publications')) &&
      (text.includes('performance') || text.includes('attendance') || text.includes('report') || text.includes('assembly'))
    ) {
      if (href.startsWith('http') && !articleUrls.includes(href)) {
        articleUrls.push(href);
      }
    }
  });

  const topUrls = articleUrls.slice(0, 3);
  console.log(`📂 Found top ${topUrls.length} recent publication pages to scan for PDFs:`, topUrls);

  const pdfUrls: string[] = [];
  for (const pageUrl of topUrls) {
    try {
      console.log(`🔄 Scanning publication page: ${pageUrl}`);
      const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
      if (!res.ok) continue;
      
      const html = await res.text();
      const pageDoc = cheerio.load(html);
      
      // Look for forms with action ending in .pdf or containing .pdf
      pageDoc('form').each((i, form) => {
        const action = pageDoc(form).attr('action') || '';
        if (action.includes('.pdf') && !pdfUrls.includes(action)) {
          pdfUrls.push(action);
        }
      });
      
      // Look for direct a links
      pageDoc('a').each((i, el) => {
        const href = pageDoc(el).attr('href') || '';
        if (href.toLowerCase().includes('.pdf') && !pdfUrls.includes(href)) {
          pdfUrls.push(href);
        }
      });
    } catch (err: any) {
      console.log(`⚠️  Error scanning page ${pageUrl}: ${err.message}`);
    }
  }

  const uniquePdfUrls = pdfUrls.slice(0, 3);
  console.log(`📄 Found ${uniquePdfUrls.length} PDF URLs to download:`, uniquePdfUrls);

  // Load scraped MNA names
  let mnaList: any[] = [];
  try {
    const mnaPath = path.join(__dirname, '../../data/mna_scraped.json');
    if (fs.existsSync(mnaPath)) {
      mnaList = JSON.parse(fs.readFileSync(mnaPath, 'utf8'));
    }
  } catch (err) {
    console.log('⚠️  Could not read mna_scraped.json for name matching:', err);
  }

  for (const pdfUrl of uniquePdfUrls) {
    try {
      console.log(`📥 Downloading PDF: ${pdfUrl}`);
      const res = await fetch(pdfUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
      if (!res.ok) {
        console.log(`⚠️  Failed to download PDF: HTTP ${res.status}`);
        continue;
      }
      
      const buffer = await res.buffer();
      const parse = (pdfParse as any).default || pdfParse;
      const parsed = await parse(buffer);
      const text = parsed.text;
      
      console.log(`✅ PDF downloaded. Extracted ${text.length} chars. Parsing attendance...`);
      
      const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
      for (const line of lines) {
        // Look for percentage patterns, e.g. "47%" or "71.5%"
        const pctMatch = line.match(/(\d+(?:\.\d+)?)\s*%/);
        if (pctMatch) {
          const pctVal = parseFloat(pctMatch[1]);
          // Find matching MNA
          for (const mna of mnaList) {
            if (matchMnaInLine(mna.name, line)) {
              attendanceMap[mna.name] = pctVal;
            }
          }
        }
        
        // Look for fractional patterns, e.g. "Sessions Attended: 10/14"
        const fracMatch = line.match(/(\d+)\s*\/\s*(\d+)/);
        if (fracMatch) {
          const attended = parseInt(fracMatch[1], 10);
          const total = parseInt(fracMatch[2], 10);
          if (total > 0 && attended <= total) {
            const pctVal = Math.round((attended / total) * 100);
            for (const mna of mnaList) {
              if (matchMnaInLine(mna.name, line)) {
                attendanceMap[mna.name] = pctVal;
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.log(`❌ Error parsing PDF ${pdfUrl}: ${err.message}`);
    }
  }

  console.log(`✅ Extracted attendance data for ${Object.keys(attendanceMap).length} MNAs.`);
  return attendanceMap;
}

if (require.main === module) {
  scrapePildatAttendance().then(data => {
    const dir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'pildat_attendance.json'), JSON.stringify(data, null, 2));
    console.log('✅ Wrote PILDAT attendance to backend/src/data/pildat_attendance.json');
  }).catch(err => {
    console.error('❌ Failed to run PILDAT scraper:', err);
  });
}
