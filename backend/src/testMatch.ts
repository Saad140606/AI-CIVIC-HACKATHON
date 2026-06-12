import { loadBudgetData } from './lib/dataLoader';

const nameMapping: Record<string, string> = {
  "Defence Affairs and Services": "MINISTRY OF DEFENCE",
  "Planning and Development": "MINISTRY OF PLANNING, DEVELOPMENT AND SPECIAL INITIATIVES",
  "Energy (Power Division)": "MINISTRY OF ENERGY",
  "Finance Division": "MINISTRY OF FINANCE AND REVENUE",
  "Education Affairs and Services": "MINISTRY OF FEDERAL EDUCATION AND PROFESSIONAL TRAINING",
  "Interior Affairs": "MINISTRY OF INTERIOR",
  "Railways": "MINISTRY OF RAILWAYS",
  "Communications (NHA)": "MINISTRY OF COMMUNICATIONS",
  "Health Affairs and Services": "MINISTRY OF NATIONAL HEALTH SERVICES, REGULATIONS AND COORDINATION",
  "Water Resources": "MINISTRY OF WATER RESOURCES",
  "Kashmir Affairs and Gilgit-Baltistan": "MINISTRY OF KASHMIR AFFAIRS AND GILGIT- BALTISTAN",
  "Housing and Works": "MINISTRY OF HOUSING AND WORKS",
  "Justice and Law": "MINISTRY OF LAW AND JUSTICE",
  "States and Frontier Regions (SAFRON)": "MINISTRY OF STATES AND FRONTIER REGIONS",
  "Foreign Affairs": "MINISTRY OF FOREIGN AFFAIRS",
  "Agriculture": "MINISTRY OF NATIONAL FOOD SECURITY AND RESEARCH",
  "Information Technology": "MINISTRY OF INFORMATION TECHNOLOGY AND TELECOMMUNICATION",
  "Industries and Production": "MINISTRY OF INDUSTRIES AND PRODUCTION",
  "Science and Technology": "MINISTRY OF SCIENCE AND TECHNOLOGY",
  "Commerce Division": "MINISTRY OF COMMERCE",
  "Climate Change": "MINISTRY OF CLIMATE CHANGE AND ENVIRONMENTAL COORDINATION",
  "Overseas Pakistanis": "MINISTRY OF OVERSEAS PAKISTANIS AND HUMAN RESOURCE",
  "Human Rights": "MINISTRY OF HUMAN RIGHTS"
};

const cleanName = (name: string) => name.replace(/\s+/g, ' ').trim().toUpperCase();

function computeYoYChanges(prev: any[], curr: any[]) {
  return curr.map(c => {
    const prevName = (nameMapping as any)[c.ministry] || c.ministry;
    const cleanPrevName = cleanName(prevName);
    const p = prev.find(p => {
      const cleanPName = cleanName(p.ministry);
      return cleanPName === cleanPrevName || cleanPName.includes(cleanPrevName) || cleanPrevName.includes(cleanPName);
    });
    if (!p) {
      console.log(`❌ No match for FY25-26 "${c.ministry}" (mapped to "${prevName}")`);
      return { ministry: c.ministry, changePercent: 0, prev: 0, curr: c.total };
    }
    const pct = ((c.total - p.total) / p.total) * 100;
    console.log(`✅ MATCH: "${c.ministry}" -> "${p.ministry}" (${p.total}B vs ${c.total}B, change: ${pct.toFixed(1)}%)`);
    return { ministry: c.ministry, changePercent: Math.round(pct * 10) / 10, prev: p.total, curr: c.total };
  }).filter(c => c.prev > 0);
}

async function test() {
  const data = await loadBudgetData();
  console.log("FY24-25 ministries:", data.fy2425.map(m => m.ministry));
  console.log("FY25-26 ministries:", data.fy2526.map(m => m.ministry));
  const changes = computeYoYChanges(data.fy2425, data.fy2526);
  console.log(`\nTotal matches: ${changes.length}`);
}

test();
