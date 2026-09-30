import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // In-memory / file-backed shared state store for cross-device online sync (Vercel & multi-device support)
  const STATE_FILE = path.resolve(__dirname, 'shared_sync_state.json');
  
  let sharedState: any = {
    customers: [],
    meterReaders: [],
    cycleSchedules: [],
    auditLogs: [],
    updatedAt: new Date().toISOString()
  };

  if (fs.existsSync(STATE_FILE)) {
    try {
      sharedState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch {}
  }

  const saveStateToFile = () => {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(sharedState, null, 2));
    } catch {}
  };

  // API endpoints for cross-device online sync
  app.get('/api/sync-state', (req, res) => {
    res.json({ success: true, data: sharedState });
  });

  app.post('/api/sync-state', (req, res) => {
    const { customers, meterReaders, cycleSchedules, auditLogs } = req.body;
    if (customers) sharedState.customers = customers;
    if (meterReaders) sharedState.meterReaders = meterReaders;
    if (cycleSchedules) sharedState.cycleSchedules = cycleSchedules;
    if (auditLogs) sharedState.auditLogs = auditLogs;
    sharedState.updatedAt = new Date().toISOString();
    saveStateToFile();
    res.json({ success: true, message: 'State synchronized successfully across devices', updatedAt: sharedState.updatedAt });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Aetra Simba-In Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
