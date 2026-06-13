const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function test() {
  const url = 'https://na.gov.pk/en/all_members.php';
  console.log('Fetching:', url);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000
    });
    if (!res.ok) return;
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Find all rows or cells that contain images and text
    // Usually it's in a table or grids. Let's inspect the parents of a few images
    $('img').slice(2, 12).each((i, img) => {
      const parentRow = $(img).closest('tr');
      if (parentRow.length > 0) {
        console.log(`Image ${i} inside TR:`);
        console.log(`  HTML: ${parentRow.text().replace(/\s+/g, ' ').trim().substring(0, 200)}`);
      } else {
        const parentDiv = $(img).parent();
        console.log(`Image ${i} inside Div:`);
        console.log(`  HTML: ${parentDiv.text().replace(/\s+/g, ' ').trim().substring(0, 200)}`);
      }
    });
  } catch (e) {
    console.error('Error fetching na.gov.pk:', e);
  }
}

test();
