import { Router } from 'express';
import { searchMNAs, getMNAById, getAllMNAs, scrapeProgress, runBackgroundScrape } from '../lib/naScraper';

const router = Router();

// GET /api/mna/search?q=query
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q ?? '');
    const results = await searchMNAs(q);
    res.json({ success: true, count: results.length, members: results });
  } catch (err) {
    console.error('MNA search error:', err);
    res.status(500).json({ success: false, error: 'Failed to search members' });
  }
});

// GET /api/mna/list
router.get('/list', async (_req, res) => {
  try {
    const all = await getAllMNAs();
    const summary = all.map(m => ({
      id: m.id,
      name: m.name,
      nameUrdu: m.nameUrdu,
      constituency: m.constituency,
      constituencyUrdu: m.constituencyUrdu,
      party: m.party,
      partyUrdu: m.partyUrdu,
      partyColor: m.partyColor,
      province: m.province,
      attendancePercent: m.attendancePercent,
      role: m.role,
      billsSponsored: m.billsSponsored,
      billsPassed: m.billsPassed,
      questionsRaised: m.questionsRaised,
      profileImageUrl: m.imageUrl, // expose image URL
      address: m.address,
      phone: m.phone
    }));
    res.json({ success: true, count: summary.length, members: summary });
  } catch (err) {
    console.error('MNA list error:', err);
    res.status(500).json({ success: false, error: 'Failed to list members' });
  }
});

// GET /api/mna/constituency/:name
router.get('/constituency/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name).toLowerCase();
    const all = await getAllMNAs();
    const match = all.find(m =>
      m.constituency.toLowerCase().includes(name) ||
      m.constituencyUrdu.includes(name)
    );
    if (!match) {
      return res.status(404).json({ success: false, error: 'Constituency not found' });
    }
    return res.json({ success: true, member: match });
  } catch (err) {
    console.error('Constituency search error:', err);
    return res.status(500).json({ success: false, error: 'Failed to search constituency' });
  }
});

// GET /api/mna/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await getMNAById(id);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'MNA not found' });
    }
    return res.json({ success: true, member: profile });
  } catch (err) {
    console.error('MNA profile error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load member profile' });
  }
});

// GET/POST /api/mna/refresh-data
router.all('/refresh-data', async (req, res) => {
  try {
    if (scrapeProgress.running) {
      return res.json({
        success: true,
        message: 'Scrape already running',
        progress: { stage: scrapeProgress.stage, count: scrapeProgress.count }
      });
    }

    // Rate limit check: only once every 24 hours
    const lastRun = scrapeProgress.lastRunTime;
    const diffMs = Date.now() - lastRun;
    if (lastRun > 0 && diffMs < 24 * 60 * 60 * 1000) {
      return res.status(429).json({
        success: false,
        error: 'Refresh allowed only once per 24 hours',
        nextAllowedTime: new Date(lastRun + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Trigger in the background
    runBackgroundScrape().catch(err => console.error('Error in background refresh:', err));

    return res.json({
      success: true,
      message: 'Background scrape started',
      progress: { stage: 'started', count: 0 }
    });
  } catch (err) {
    console.error('Refresh data error:', err);
    return res.status(500).json({ success: false, error: 'Failed to start refresh' });
  }
});

// GET /api/mna/refresh-status
router.get('/refresh-status', (req, res) => {
  res.json({
    success: true,
    progress: {
      running: scrapeProgress.running,
      stage: scrapeProgress.stage,
      count: scrapeProgress.count,
      lastRunTime: scrapeProgress.lastRunTime ? new Date(scrapeProgress.lastRunTime).toISOString() : null
    }
  });
});

export default router;
