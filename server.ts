/**
 * InsightX Full-Stack Express Server
 * Serves /api/v1/* analytics and copilot endpoints and mounts Vite middleware for frontend SPA.
 */

import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { METRIC_REGISTRY, APPROVED_TABLES, DATASET_BOUNDS } from './src/services/metricRegistry';
import { planAndExecuteQuery, CopilotQueryRequest } from './src/services/queryPlanner';
import { executeReadOnlyQuery } from './src/services/queryExecutor';
import { validateAndSanitizeSql } from './src/services/sqlValidator';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

// Request logging & timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api/')) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

/* -------------------------------------------------------------------------- */
/* API v1 Endpoints                                                          */
/* -------------------------------------------------------------------------- */

// A. Health check
app.get('/api/v1/health', (req, res) => {
  try {
    const dbTest = executeReadOnlyQuery('SELECT 1 AS ok;');
    res.json({
      status: 'healthy',
      version: '1.0.0',
      database: dbTest.rowCount > 0 ? 'connected' : 'unhealthy',
      dataset: DATASET_BOUNDS.citation,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'degraded',
      version: '1.0.0',
      database: 'disconnected',
      error: err.message
    });
  }
});

// B. Metadata endpoint
app.get('/api/v1/analytics/metadata', (req, res) => {
  res.json({
    approved_tables: APPROVED_TABLES,
    dataset_bounds: DATASET_BOUNDS,
    metric_registry: Object.values(METRIC_REGISTRY),
    supported_dimensions: ['country', 'month', 'quarter', 'stock_code', 'segment', 'status'],
    version: '1.0.0'
  });
});

// C. Copilot query endpoint
app.post('/api/v1/copilot/query', async (req, res) => {
  try {
    const { question, filters, chart_preference } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        error: 'Missing required field: question (must be a non-empty string).'
      });
    }

    const payload: CopilotQueryRequest = {
      question,
      filters: filters || {},
      chart_preference: chart_preference || 'auto'
    };

    const response = await planAndExecuteQuery(payload);
    res.json(response);
  } catch (err: any) {
    console.error('Error handling copilot query:', err);
    res.status(500).json({
      status: 'error',
      error: err.message || 'Internal server error processing copilot query.'
    });
  }
});

// D. Copilot feedback endpoint
app.post('/api/v1/copilot/feedback', (req, res) => {
  const { request_id, helpful, reason } = req.body;
  if (!request_id || typeof helpful !== 'boolean') {
    return res.status(400).json({ error: 'Invalid feedback payload. Must include request_id and helpful boolean.' });
  }
  console.log(`[FEEDBACK] Request ${request_id}: ${helpful ? 'Helpful' : 'Not helpful'}. Reason: ${reason || 'N/A'}`);
  res.json({ status: 'recorded', request_id });
});

// E. Approved KPIs
app.get('/api/v1/analytics/kpis', (req, res) => {
  try {
    const kpiPath = path.resolve(process.cwd(), 'data/processed/kpi_summary.json');
    if (fs.existsSync(kpiPath)) {
      const data = JSON.parse(fs.readFileSync(kpiPath, 'utf-8'));
      res.json(data);
    } else {
      res.status(404).json({ error: 'KPI summary file not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// F. CSV export endpoint
app.post('/api/v1/analytics/export', (req, res) => {
  try {
    const { columns, rows, filename } = req.body;
    if (!Array.isArray(columns) || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'Payload must contain columns array and rows array.' });
    }

    // Formula injection sanitization: escape strings starting with =, +, -, @
    const sanitizeValue = (val: any): string => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str; // Prefix with single quote to neutralize formula execution in Excel
      }
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = columns.map(sanitizeValue).join(',');
    const dataLines = rows.map((r: any) => {
      if (Array.isArray(r)) {
        return r.map(sanitizeValue).join(',');
      }
      return columns.map((col: string) => sanitizeValue(r[col])).join(',');
    });

    const csvContent = [headerLine, ...dataLines].join('\n');
    const safeFilename = (filename || 'insightx_export').replace(/[^a-zA-Z0-9_\-]/g, '_') + '.csv';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: `Export failed: ${err.message}` });
  }
});

/* -------------------------------------------------------------------------- */
/* Frontend SPA Mounting                                                      */
/* -------------------------------------------------------------------------- */

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InsightX AI Analytics Copilot Server running on http://0.0.0.0:${PORT}`);
    console.log(`API endpoints accessible under /api/v1/*`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
