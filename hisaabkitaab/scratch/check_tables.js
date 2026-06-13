const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function checkWikipedia(url) {
  try {
    console.log(`Fetching ${url}...`);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await res.text();
    const $ = cheerio. Cheerio; // wait, cheerio.load
    const doc = cheerio.load(html);
    console.log(`Title: ${doc('title').text()}`);
    
    // Find wikitable classes
    const wikitables = doc('table.wikitable');
    console.log(`Found ${wikitables.length} wikitables`);
    wikitables.each((i, table) => {
      const headers = doc(table).find('th').map((_, th) => doc(th).text().trim()).get();
      console.log(`Table ${i}: Header columns:`, headers.slice(0, 5));
    });
  } catch (err) {
    console.error(err);
  }
}

async function run() {
  await checkWikipedia('https://en.wikipedia.org/wiki/16th_National_Assembly_of_Pakistan');
  console.log('-----------------------------');
  await checkWikipedia('https://en.wikipedia.org/wiki/List_of_members_of_the_16th_National_Assembly_of_Pakistan');
}

run();
