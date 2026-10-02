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
    } catch (e) {
      console.error('Error saving state file:', e);
    }
  };

  // Connected SSE clients for instantaneous real-time push
  const sseClients = new Set<express.Response>();

  const broadcastSyncEvent = (eventData: any) => {
    const payload = `data: ${JSON.stringify(eventData)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch {
        sseClients.delete(client);
      }
    }
  };

  // Server-Sent Events endpoint for immediate live real-time sync (< 50ms latency)
  app.get('/api/sync-stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Initial connection ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', updatedAt: sharedState.updatedAt })}\n\n`);

    sseClients.add(res);

    // Heartbeat every 25 seconds to keep connection alive through proxies
    const heartbeat = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // API endpoints for cross-device online sync
  app.get('/api/sync-state', (req, res) => {
    res.json({ success: true, data: sharedState });
  });

  // High-speed endpoint to sync a single meter reading submission from field reader
  app.post('/api/sync-reading', (req, res) => {
    const { customer, auditLog } = req.body;
    if (!customer || !customer.id) {
      return res.status(400).json({ success: false, message: 'Customer data required' });
    }

    if (!Array.isArray(sharedState.customers)) {
      sharedState.customers = [];
    }

    const idx = sharedState.customers.findIndex((c: any) => c.id === customer.id);
    if (idx >= 0) {
      sharedState.customers[idx] = { ...sharedState.customers[idx], ...customer };
    } else {
      sharedState.customers.unshift(customer);
    }

    if (auditLog && Array.isArray(sharedState.auditLogs)) {
      sharedState.auditLogs.unshift(auditLog);
      if (sharedState.auditLogs.length > 300) {
        sharedState.auditLogs = sharedState.auditLogs.slice(0, 300);
      }
    }

    sharedState.updatedAt = new Date().toISOString();
    saveStateToFile();

    // Immediately push to all open tabs and devices
    broadcastSyncEvent({
      type: 'READING_SAVED',
      customer,
      auditLog,
      updatedAt: sharedState.updatedAt
    });

    res.json({
      success: true,
      message: 'Reading synchronized automatically',
      updatedAt: sharedState.updatedAt
    });
  });

  // High-speed endpoint to sync batch status changes (e.g., verification, invoicing)
  app.post('/api/sync-status', (req, res) => {
    const { ids, status, note, auditLog } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ success: false, message: 'Invalid status update parameters' });
    }

    if (Array.isArray(sharedState.customers)) {
      sharedState.customers = sharedState.customers.map((c: any) => {
        if (ids.includes(c.id)) {
          return {
            ...c,
            status,
            catatan: note || c.catatan
          };
        }
        return c;
      });
    }

    if (auditLog && Array.isArray(sharedState.auditLogs)) {
      sharedState.auditLogs.unshift(auditLog);
    }

    sharedState.updatedAt = new Date().toISOString();
    saveStateToFile();

    broadcastSyncEvent({
      type: 'STATUS_UPDATED',
      ids,
      status,
      note,
      auditLog,
      updatedAt: sharedState.updatedAt
    });

    res.json({
      success: true,
      message: 'Status synchronized automatically',
      updatedAt: sharedState.updatedAt
    });
  });

  app.post('/api/sync-state', (req, res) => {
    const { customers, meterReaders, cycleSchedules, auditLogs, forceUpdate } = req.body;
    let updated = false;

    // Smart merge customers by id instead of destructive replacement
    if (Array.isArray(customers) && customers.length > 0) {
      const custMap = new Map<string, any>();
      if (Array.isArray(sharedState.customers)) {
        sharedState.customers.forEach((c: any) => custMap.set(c.id, c));
      }
      customers.forEach((incoming: any) => {
        if (custMap.has(incoming.id)) {
          const existing = custMap.get(incoming.id);
          custMap.set(incoming.id, { ...existing, ...incoming });
        } else {
          custMap.set(incoming.id, incoming);
        }
      });
      sharedState.customers = Array.from(custMap.values());
      updated = true;
    }

    // Merge meter readers by id
    if (Array.isArray(meterReaders) && meterReaders.length > 0) {
      const readerMap = new Map<string, any>();
      if (Array.isArray(sharedState.meterReaders)) {
        sharedState.meterReaders.forEach((r: any) => readerMap.set(r.id, r));
      }
      meterReaders.forEach((r: any) => readerMap.set(r.id, r));
      sharedState.meterReaders = Array.from(readerMap.values());
      updated = true;
    }

    // Merge cycle schedules by cycle name
    if (Array.isArray(cycleSchedules) && cycleSchedules.length > 0) {
      const schedMap = new Map<string, any>();
      if (Array.isArray(sharedState.cycleSchedules)) {
        sharedState.cycleSchedules.forEach((s: any) => schedMap.set(s.cycle.toLowerCase(), s));
      }
      cycleSchedules.forEach((s: any) => schedMap.set(s.cycle.toLowerCase(), s));
      sharedState.cycleSchedules = Array.from(schedMap.values());
      updated = true;
    }

    if (Array.isArray(auditLogs) && auditLogs.length > 0) {
      sharedState.auditLogs = auditLogs;
      updated = true;
    }

    if (updated || forceUpdate) {
      sharedState.updatedAt = new Date().toISOString();
      saveStateToFile();

      // Push real-time event to all active devices
      broadcastSyncEvent({
        type: 'STATE_UPDATE',
        customers: sharedState.customers,
        meterReaders: sharedState.meterReaders,
        cycleSchedules: sharedState.cycleSchedules,
        auditLogs: sharedState.auditLogs,
        updatedAt: sharedState.updatedAt
      });
    }

    res.json({
      success: true,
      message: 'State synchronized successfully across devices',
      updatedAt: sharedState.updatedAt,
      counts: {
        customers: sharedState.customers?.length || 0,
        meterReaders: sharedState.meterReaders?.length || 0,
        cycleSchedules: sharedState.cycleSchedules?.length || 0
      }
    });
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
