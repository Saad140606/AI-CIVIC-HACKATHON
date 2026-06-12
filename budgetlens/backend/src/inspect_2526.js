const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const DATA_ROOT = path.resolve(__dirname, '../../../');
const file = path.join(DATA_ROOT, '2025_2026', 'budget_2025_26.xlsx');

console.log('File path:', file);
console.log('Exists:', fs.existsSync(file));

if (fs.existsSync(file)) {
  const workbook = XLSX.readFile(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: 0 });
  console.log('Total rows:', rows.length);
  console.log('Sample rows (first 10):');
  console.log(JSON.stringify(rows.slice(0, 10), null, 2));
} else {
  console.log('File does not exist');
}
