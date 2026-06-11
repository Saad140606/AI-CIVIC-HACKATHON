import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import budgetRouter from './routes/budget';
import aiRouter from './routes/ai';
import mnaRouter from './routes/mna';
import { loadBudgetData } from './lib/dataLoader';
import { getAllMNAs } from './lib/naScraper';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'WakalaLens Pakistan API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/budget', budgetRouter);
app.use('/api/ai', aiRouter);
app.use('/api/mna', mnaRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server and preload data
async function start() {
  try {
    await loadBudgetData();
    app.listen(PORT, async () => {
      console.log(`\n🚀 WakalaLens Pakistan API running on http://localhost:${PORT}`);
      console.log(`📊 Budget data loaded and cached`);
      console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' ? '✅ Configured' : '⚠️  Not configured (using mock responses)'}`);
      // Preload MNA data
      const mnas = await getAllMNAs();
      console.log(`🏛️  MNA data: ${mnas.length} members loaded (16th National Assembly)`);
      console.log('\nEndpoints:');
      console.log(`  GET  /api/budget/summary`);
      console.log(`  GET  /api/budget/ministry/:name`);
      console.log(`  GET  /api/budget/compare/:ministry`);
      console.log(`  GET  /api/budget/years`);
      console.log(`  GET  /api/mna/search?q=query`);
      console.log(`  GET  /api/mna/list`);
      console.log(`  GET  /api/mna/:id`);
      console.log(`  POST /api/ai/explain`);
      console.log(`  POST /api/ai/chat`);
      console.log(`  POST /api/ai/rate-mna`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
