export function formatBillions(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}T`;
  }
  return `${value.toFixed(1)}B`;
}

export function formatPKR(value: number): string {
  if (value >= 1000) {
    return `PKR ${(value / 1000).toFixed(2)} Trillion`;
  }
  return `PKR ${value.toFixed(1)} Billion`;
}

export function formatChangePercent(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export function getChangeColor(pct: number): string {
  if (pct > 0) return '#00E676';
  if (pct < 0) return '#FF5252';
  return '#8892A4';
}

export function getChangeArrow(pct: number): string {
  if (pct > 5) return '↑';
  if (pct < -5) return '↓';
  return '→';
}

// Truncate long ministry names for charts
export function truncateMinistry(name: string, maxLen = 30): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 3) + '...';
}

// Generate share text
export function generateShareText(ministry: string, budget: number, changePercent?: number): string {
  const change = changePercent !== undefined
    ? ` (${formatChangePercent(changePercent)} vs last year)`
    : '';
  return `${ministry} received PKR ${budget.toFixed(1)} Billion${change} in Pakistan's FY2025-26 Federal Budget. #PakistanBudget #HisaabKitaab`;
}
