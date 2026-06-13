const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function test() {
  const url = 'https://en.wikipedia.org/wiki/List_of_members_of_the_16th_National_Assembly_of_Pakistan';
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log('Tables count:', $('table.wikitable').length);
    $('table.wikitable').each((idx, el) => {
      console.log(`Table ${idx} headers:`);
      const headers = [];
      $(el).find('tr').first().find('th').each((_, th) => {
        headers.push($(th).text().trim());
      });
      console.log(headers.join(' | '));
      
      console.log('First 3 rows:');
      $(el).find('tr').slice(1, 4).each((_, tr) => {
        const row = [];
        $(tr).find('td').each((_, td) => {
          row.push($(td).text().trim());
        });
        console.log(row.join(' | '));
      });
      console.log('-------------------');
    });
  } catch (err) {
    console.error(err);
  }
}

test();
