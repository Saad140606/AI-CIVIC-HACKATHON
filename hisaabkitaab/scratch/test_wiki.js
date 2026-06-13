const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function run() {
  const url = 'https://en.wikipedia.org/wiki/List_of_members_of_the_16th_National_Assembly_of_Pakistan';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const rows = $('table.wikitable tr');

  // Let's build a matrix to trace cell values including rowspans
  const matrix = [];
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

  console.log('Total matrix rows:', matrix.length);
  // Print some rows from index 265 to 335
  for (let r = 265; r < Math.min(matrix.length, 340); r++) {
    console.log(`Row ${r}:`, matrix[r]);
  }
}

run();
