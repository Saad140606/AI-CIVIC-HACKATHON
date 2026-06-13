import fetch from 'node-fetch';
import * as pdfParse from 'pdf-parse';
import { MinistryTotal } from './dataLoader';
import { FY2526_HARDCODED } from './dataLoader';

const PDF_URL = 'https://www.finance.gov.pk/budget/budget_2025_26/abs_eng_10062025.pdf';

export async function fetchAndParseFY2526PDF(): Promise<MinistryTotal[]> {
  try {
    console.log('📄 Attempting to fetch FY2025-26 budget PDF...');
    const response = await fetch(PDF_URL, {
      headers: { 'User-Agent': 'HisaabKitaab-Pakistan/1.0' },
      timeout: 15000,
    } as any);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.buffer();
    const parse = (pdfParse as any).default || pdfParse;
    const data = await parse(buffer);
    const text = data.text;

    console.log('✅ PDF fetched, extracting ministry data...');
    return extractMinistriesFromPDF(text);
  } catch (err) {
    console.warn(`⚠️ PDF parsing failed (${err}). Using hardcoded FY2025-26 data.`);
    return FY2526_HARDCODED;
  }
}

function extractMinistriesFromPDF(text: string): MinistryTotal[] {
  // Pattern: Ministry name followed by amount in millions PKR
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const results: MinistryTotal[] = [];

  // Try to extract from typical budget summary table format
  const amountPattern = /^(.+?)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/;

  for (const line of lines) {
    const match = line.match(amountPattern);
    if (match) {
      const name = match[1].trim();
      const amountStr = match[4].replace(/,/g, ''); // Take last column (budget estimate)
      const amount = parseInt(amountStr, 10);
      if (!isNaN(amount) && amount > 0 && name.length > 3) {
        results.push({
          ministry: name,
          total: Math.round(amount / 1000 * 100) / 100, // Millions to billions
          divisions: [{ division: name, total: Math.round(amount / 1000 * 100) / 100 }],
        });
      }
    }
  }

  if (results.length < 5) {
    console.warn('PDF extraction yielded insufficient data, using hardcoded fallback');
    return FY2526_HARDCODED;
  }

  return results.sort((a, b) => b.total - a.total);
}
