const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function test() {
  const url = 'https://na.gov.pk/en/all_members.php';
  console.log('Fetching:', url);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 15000
    });
    if (!res.ok) {
      console.log('Fetch failed:', res.statusText);
      return;
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log('Found', $('img').length, 'images.');
    $('img').slice(0, 30).each((i, img) => {
      const srcAttr = $(img).attr('src') || '';
      
      let imageUrl = '';
      if (srcAttr) {
        const parts = srcAttr.split(/[?&]src=/);
        let cleanSrc = parts[parts.length - 1];
        cleanSrc = decodeURIComponent(cleanSrc);
        if (cleanSrc.startsWith('../')) {
          cleanSrc = cleanSrc.substring(3);
        }
        imageUrl = `https://na.gov.pk/${cleanSrc}`;
      }
      
      console.log(`Image ${i}: raw="${srcAttr}" -> parsed="${imageUrl}"`);
    });
  } catch (e) {
    console.error('Error fetching na.gov.pk:', e);
  }
}

test();


