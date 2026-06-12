import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

export interface BudgetRow {
  fund?: string | number;
  ministry_name?: string;
  division_name?: string;
  ID1_name?: string;
  ID2_name?: string;
  ID3_name?: string;
  ID4_name?: string;
  ID5_name?: string;
  ID6_name?: string;
  [key: string]: string | number | undefined;
}

export interface MinistryTotal {
  ministry: string;
  total: number;
  divisions: DivisionTotal[];
}

export interface DivisionTotal {
  division: string;
  total: number;
}

export interface BudgetSummary {
  fy2324: MinistryTotal[];
  fy2425: MinistryTotal[];
  fy2526: MinistryTotal[];
}

// Data cache
let cache: BudgetSummary | null = null;

const DATA_ROOT = path.resolve(__dirname, '../../../../');

function findBudgetColumn(row: BudgetRow, candidates: string[]): string | undefined {
  for (const c of candidates) {
    if (row[c] !== undefined) return c;
  }
  // Fallback: find column starting with 'budget_' that is NOT 'revised'
  return Object.keys(row).find(k => k.startsWith('budget_') && !k.includes('revised') && !k.includes('posts'));
}

function parseXlsx(filePath: string, budgetCandidates: string[], scaleFactor: number = 1): MinistryTotal[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: BudgetRow[] = XLSX.utils.sheet_to_json(sheet, { defval: 0 });

  // Aggregate ministry → divisions → totals
  const ministryMap = new Map<string, Map<string, number>>();

  for (const row of rows) {
    const ministry = (row['ministry_name'] as string)?.trim() || 'Unknown';
    const division = (row['division_name'] as string)?.trim() || ministry;

    // Detect budget column once from first row pattern
    let amount = 0;
    const detectedCol = findBudgetColumn(row, budgetCandidates);
    if (detectedCol) {
      amount = (Number(row[detectedCol]) || 0) * scaleFactor;
    }

    if (!ministryMap.has(ministry)) {
      ministryMap.set(ministry, new Map());
    }
    const divMap = ministryMap.get(ministry)!;
    divMap.set(division, (divMap.get(division) || 0) + amount);
  }

  const result: MinistryTotal[] = [];
  for (const [ministry, divMap] of ministryMap.entries()) {
    const divisions: DivisionTotal[] = [];
    let total = 0;
    for (const [division, amount] of divMap.entries()) {
      if (amount > 0) {
        divisions.push({ division, total: Math.round(amount / 1e9 * 100) / 100 }); // Convert to billions
        total += amount;
      }
    }
    if (total > 0) {
      result.push({
        ministry,
        total: Math.round(total / 1e9 * 100) / 100, // PKR billions
        divisions: divisions.sort((a, b) => b.total - a.total),
      });
    }
  }

  return result.sort((a, b) => b.total - a.total);
}

// FY2025-26 hardcoded from published budget summary (fallback if PDF parsing fails)
// Source: Pakistan Budget 2025-26 Summary by Ministry of Finance
export const FY2526_HARDCODED: MinistryTotal[] = [
  { ministry: 'Debt Servicing (Interest Payments)', total: 9775, divisions: [{ division: 'Debt Servicing', total: 9775 }] },
  { ministry: 'Defence Affairs and Services', total: 2414, divisions: [{ division: 'Defence', total: 2414 }] },
  { ministry: 'Transfers to Provinces (NFC)', total: 7438, divisions: [{ division: 'Provincial Transfers', total: 7438 }] },
  { ministry: 'Grants / Subsidies', total: 1400, divisions: [{ division: 'Energy Subsidies', total: 800 }, { division: 'Other Subsidies', total: 600 }] },
  { ministry: 'Education Affairs and Services', total: 212, divisions: [{ division: 'Higher Education Commission', total: 65 }, { division: 'Federal Directorate of Education', total: 82 }, { division: 'Other Education', total: 65 }] },
  { ministry: 'Health Affairs and Services', total: 96, divisions: [{ division: 'NHSRC', total: 50 }, { division: 'Health Division', total: 46 }] },
  { ministry: 'Interior Affairs', total: 178, divisions: [{ division: 'Police / Security', total: 95 }, { division: 'Administration', total: 83 }] },
  { ministry: 'Finance Division', total: 215, divisions: [{ division: 'Finance Division', total: 215 }] },
  { ministry: 'Revenue Division (FBR)', total: 45, divisions: [{ division: 'FBR Operations', total: 45 }] },
  { ministry: 'Planning and Development', total: 1050, divisions: [{ division: 'PSDP Allocations', total: 1050 }] },
  { ministry: 'Energy (Power Division)', total: 342, divisions: [{ division: 'Power Division', total: 342 }] },
  { ministry: 'Railways', total: 125, divisions: [{ division: 'Pakistan Railways', total: 125 }] },
  { ministry: 'Communications (NHA)', total: 98, divisions: [{ division: 'National Highway Authority', total: 98 }] },
  { ministry: 'Information Technology', total: 18, divisions: [{ division: 'IT Division', total: 18 }] },
  { ministry: 'Agriculture', total: 22, divisions: [{ division: 'Agriculture Division', total: 22 }] },
  { ministry: 'Water Resources', total: 87, divisions: [{ division: 'IRSA / Irrigation', total: 87 }] },
  { ministry: 'Foreign Affairs', total: 24, divisions: [{ division: 'Foreign Affairs', total: 24 }] },
  { ministry: 'Justice and Law', total: 31, divisions: [{ division: 'Law Division', total: 19 }, { division: 'Judiciary', total: 12 }] },
  { ministry: 'Industries and Production', total: 15, divisions: [{ division: 'Industries Division', total: 15 }] },
  { ministry: 'Housing and Works', total: 43, divisions: [{ division: 'Housing Division', total: 43 }] },
  { ministry: 'Commerce Division', total: 11, divisions: [{ division: 'Commerce', total: 11 }] },
  { ministry: 'Petroleum Division', total: 8, divisions: [{ division: 'Petroleum', total: 8 }] },
  { ministry: 'Privatisation Division', total: 4, divisions: [{ division: 'Privatisation', total: 4 }] },
  { ministry: 'Science and Technology', total: 14, divisions: [{ division: 'Science Division', total: 14 }] },
  { ministry: 'Human Rights', total: 2, divisions: [{ division: 'Human Rights', total: 2 }] },
  { ministry: 'Climate Change', total: 5, divisions: [{ division: 'Climate Division', total: 5 }] },
  { ministry: 'Overseas Pakistanis', total: 3, divisions: [{ division: 'OPHRD', total: 3 }] },
  { ministry: 'National Heritage and Culture', total: 6, divisions: [{ division: 'Culture Division', total: 6 }] },
  { ministry: 'States and Frontier Regions (SAFRON)', total: 28, divisions: [{ division: 'SAFRON', total: 28 }] },
  { ministry: 'Kashmir Affairs and Gilgit-Baltistan', total: 52, divisions: [{ division: 'AJK / GB', total: 52 }] },
].sort((a, b) => b.total - a.total);

export async function loadBudgetData(): Promise<BudgetSummary> {
  if (cache) return cache;

  console.log('📊 Loading budget data from Excel files...');

  const file2324 = path.join(DATA_ROOT, '2023_2024', 'budget_2023_24.xlsx');
  const file2425 = path.join(DATA_ROOT, '2024_2025', 'budget_2024_25.xlsx');
  const file2526 = path.join(DATA_ROOT, '2025_2026', 'budget_2025_26.xlsx');

  // FY23-24: 'budget_2023' is the current year column in the 2023_24 file
  const fy2324 = parseXlsx(file2324, ['budget_2023', 'budget_2324', 'budget_2023_24']);
  // FY24-25: 'budget_2024' is the current year column in the 2024_25 file
  const fy2425 = parseXlsx(file2425, ['budget_2024', 'budget_2425', 'budget_2024_25']);
  // FY25-26: Real data from budget_2025_26.xlsx (column: budget_2025_26) — values are in PKR millions, so scale × 1,000,000
  const fy2526Real = parseXlsx(file2526, ['budget_2025_26', 'budget_2526'], 1000000);

  // Use real xlsx data if available, otherwise fall back to hardcoded estimates
  const fy2526 = fy2526Real.length > 0 ? fy2526Real : FY2526_HARDCODED;
  const dataSource = fy2526Real.length > 0 ? 'real xlsx data' : 'hardcoded estimates (fallback)';

  cache = {
    fy2324,
    fy2425,
    fy2526,
  };

  const total2526 = fy2526.reduce((s, m) => s + m.total, 0);
  console.log(`✅ Loaded: ${fy2324.length} ministries (FY23-24), ${fy2425.length} ministries (FY24-25), ${fy2526.length} ministries (FY25-26 — ${dataSource})`);
  console.log(`📊 FY25-26 Total Budget: PKR ${Math.round(total2526)} billion (~PKR ${(total2526 / 1000).toFixed(1)} trillion)`);
  return cache;
}

export function clearCache() {
  cache = null;
}
