import { Router, Request, Response } from 'express';
import { loadBudgetData, MinistryTotal } from '../lib/dataLoader';

const router = Router();

// GET /api/budget/summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const data = await loadBudgetData();

    // Compute hero stats
    const fy2425Total = data.fy2425.reduce((s, m) => s + m.total, 0);
    const fy2526Total = data.fy2526.reduce((s, m) => s + m.total, 0);
    const totalChange = ((fy2526Total - fy2425Total) / fy2425Total) * 100;

    // Top 3 ministries by FY25-26
    const top3 = data.fy2526.slice(0, 3);

    // Biggest YoY changes between FY24-25 and FY25-26
    const changes = computeYoYChanges(data.fy2425, data.fy2526);
    const sorted = [...changes].sort((a, b) => b.changePercent - a.changePercent);
    const biggestIncrease = sorted[0] || null;
    const biggestDecrease = sorted[sorted.length - 1] || null;

    res.json({
      fy2324: data.fy2324,
      fy2425: data.fy2425,
      fy2526: data.fy2526,
      heroStats: {
        fy2425Total: Math.round(fy2425Total),
        fy2526Total: Math.round(fy2526Total),
        totalChangePercent: Math.round(totalChange * 10) / 10,
        top3,
        biggestIncrease,
        biggestDecrease,
      },
    });
  } catch (err) {
    console.error('Error in /summary:', err);
    res.status(500).json({ error: 'Failed to load budget data' });
  }
});

// GET /api/budget/ministry/:name
router.get('/ministry/:name', async (req: Request, res: Response) => {
  try {
    const data = await loadBudgetData();
    const name = decodeURIComponent(req.params.name);

    const find = (arr: MinistryTotal[]) =>
      arr.find(m => m.ministry.toLowerCase().includes(name.toLowerCase()));

    const fy2324 = find(data.fy2324);
    const fy2425 = find(data.fy2425);
    const fy2526 = find(data.fy2526);

    if (!fy2324 && !fy2425 && !fy2526) {
      return res.status(404).json({ error: 'Ministry not found' });
    }

    res.json({ fy2324, fy2425, fy2526 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load ministry data' });
  }
});

// GET /api/budget/compare/:ministry
router.get('/compare/:ministry', async (req: Request, res: Response) => {
  try {
    const data = await loadBudgetData();
    const name = decodeURIComponent(req.params.ministry);

    const find = (arr: MinistryTotal[]) =>
      arr.find(m => m.ministry.toLowerCase().includes(name.toLowerCase()));

    const fy2324 = find(data.fy2324);
    const fy2425 = find(data.fy2425);
    const fy2526 = find(data.fy2526);

    const compareYears = (prev: MinistryTotal | undefined, curr: MinistryTotal | undefined) => {
      if (!prev || !curr) return null;
      const change = curr.total - prev.total;
      const pct = ((change) / prev.total) * 100;
      return { prev: prev.total, curr: curr.total, change: Math.round(change * 100) / 100, changePercent: Math.round(pct * 10) / 10 };
    };

    res.json({
      ministry: fy2425?.ministry || fy2526?.ministry || name,
      fy2324,
      fy2425,
      fy2526,
      comparison2324vs2425: compareYears(fy2324, fy2425),
      comparison2425vs2526: compareYears(fy2425, fy2526),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compare data' });
  }
});

// GET /api/budget/years
router.get('/years', async (req: Request, res: Response) => {
  res.json({
    years: [
      { id: 'fy2324', label: 'FY 2023-24', labelUrdu: 'مالی سال 2023-24' },
      { id: 'fy2425', label: 'FY 2024-25', labelUrdu: 'مالی سال 2024-25' },
      { id: 'fy2526', label: 'FY 2025-26 (Est.)', labelUrdu: 'مالی سال 2025-26 (تخمینہ)' },
    ],
  });
});

function computeYoYChanges(prev: MinistryTotal[], curr: MinistryTotal[]) {
  return curr.map(c => {
    const p = prev.find(p => p.ministry === c.ministry);
    if (!p) return { ministry: c.ministry, changePercent: 100, prev: 0, curr: c.total };
    const pct = ((c.total - p.total) / p.total) * 100;
    return { ministry: c.ministry, changePercent: Math.round(pct * 10) / 10, prev: p.total, curr: c.total };
  }).filter(c => c.prev > 0);
}

export default router;
