import * as cheerio from 'cheerio';

async function inspectAttendance() {
  const url = 'https://na.gov.pk/en/attendance2.php';
  console.log('Fetching:', url);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) {
      console.log('Failed:', res.statusText);
      return;
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Look for forms, select options, or table structures
    console.log('Select elements found:', $('select').length);
    $('select').each((i, el) => {
      console.log(`Select ${i} name="${$(el).attr('name') || $(el).attr('id')}"`);
      $(el).find('option').slice(0, 10).each((j, opt) => {
        console.log(`  Option: value="${$(opt).attr('value')}" text="${$(opt).text().trim()}"`);
      });
    });

    console.log('Forms found:', $('form').length);
    $('form').each((i, el) => {
      console.log(`Form ${i} action="${$(el).attr('action')}" method="${$(el).attr('method')}"`);
      $(el).find('input').each((j, inp) => {
        console.log(`  Input: name="${$(inp).attr('name')}" type="${$(inp).attr('type')}" value="${$(inp).attr('value')}"`);
      });
    });

    console.log('Tables found:', $('table').length);
    $('table').each((i, el) => {
      console.log(`Table ${i} class="${$(el).attr('class') || ''}" id="${$(el).attr('id') || ''}"`);
      const trs = $(el).find('tr');
      console.log(`  Rows: ${trs.length}`);
      trs.slice(0, 10).each((j, tr) => {
        console.log(`    Row ${j}: ${$(tr).text().replace(/\s+/g, ' ').trim().substring(0, 180)}`);
      });
    });

  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

inspectAttendance();
