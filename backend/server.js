const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const axios = require('axios');

const app = express();
const alertCache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

// ── CORS ─────────────────────────────────────────────────────────────────────
// In production set CORS_ORIGIN=https://your-site.netlify.app (comma-separated for multiple)
const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
const CORS_ORIGIN = process.env.CORS_ORIGIN;

app.use(cors({
  origin: CORS_ORIGIN
    ? CORS_ORIGIN.split(',').map(s => s.trim())
    : DEV_ORIGINS,
}));
app.use(express.json());

// ── NOAA request helper ───────────────────────────────────────────────────────
const NOAA_BASE = 'https://api.weather.gov';

// NOAA requires a descriptive User-Agent (https://www.weather.gov/documentation/services-web-api)
const NOAA_HEADERS = {
  'User-Agent': 'NOAAWeatherDashboard/1.0 (https://github.com/user/noaa-dashboard; contact@example.com)',
  Accept: 'application/geo+json',
};

async function fetchNOAA(url, timeout = 15000) {
  const response = await axios.get(url, { headers: NOAA_HEADERS, timeout });
  return response.data;
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/alerts
 * Proxies active NWS alerts. Optional query params forwarded to NOAA:
 *   status, message_type, event, area, region, zone, urgency, severity, certainty, limit
 */
app.get('/api/alerts', async (req, res) => {
  try {
    const cacheKey = 'alerts_active';
    const cached = alertCache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, _meta: { cached: true } });
    }

    console.log('[NOAA] Fetching active alerts…');
    const data = await fetchNOAA(`${NOAA_BASE}/alerts/active`);
    alertCache.set(cacheKey, data);

    res.json({ ...data, _meta: { cached: false, fetchedAt: new Date().toISOString() } });
  } catch (err) {
    console.error('[/api/alerts]', err.message);
    res.status(500).json({ error: 'Failed to fetch NOAA alerts', details: err.message });
  }
});

/**
 * GET /api/alerts/area/:state
 * Active alerts for a specific US state/territory (two-letter code, e.g. "TX").
 */
app.get('/api/alerts/area/:state', async (req, res) => {
  try {
    const { state } = req.params;
    const cacheKey = `area_${state.toUpperCase()}`;

    const cached = alertCache.get(cacheKey);
    if (cached) return res.json({ ...cached, _meta: { cached: true } });

    const data = await fetchNOAA(`${NOAA_BASE}/alerts/active/area/${state.toUpperCase()}`);
    alertCache.set(cacheKey, data);
    res.json({ ...data, _meta: { cached: false, fetchedAt: new Date().toISOString() } });
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: 'Failed to fetch area alerts', details: err.message });
  }
});

/**
 * GET /api/event-types
 * Returns a deduplicated, sorted list of active event type strings.
 * Cached for 2 minutes since it changes less frequently.
 */
app.get('/api/event-types', async (req, res) => {
  try {
    const cacheKey = 'event_types';
    const cached = alertCache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await fetchNOAA(`${NOAA_BASE}/alerts/active?status=actual&message_type=alert&limit=500`);
    const types = [
      ...new Set((data.features || []).map((f) => f.properties?.event).filter(Boolean)),
    ].sort();

    alertCache.set(cacheKey, types, 120);
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /health
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: alertCache.getStats(),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`NOAA proxy server running → http://localhost:${PORT}`);
  console.log(`Health check           → http://localhost:${PORT}/health`);
});
