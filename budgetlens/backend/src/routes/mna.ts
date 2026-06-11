import { Router } from 'express';
import { searchMNAs, getMNAById, getAllMNAs } from '../lib/naScraper';

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
    }));
    res.json({ success: true, count: summary.length, members: summary });
  } catch (err) {
    console.error('MNA list error:', err);
    res.status(500).json({ success: false, error: 'Failed to list members' });
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

export default router;
