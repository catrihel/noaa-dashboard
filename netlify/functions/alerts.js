/**
 * Netlify Function: /api/alerts
 *
 * Proxies NOAA alerts server-side (no CORS issues for any browser/network).
 * Zone geometries are fetched client-side via useZoneGeometries (NOAA allows
 * browser CORS) and cached in localStorage, so this function only handles
 * alert data.
 *
 * GET /api/alerts          → return stored snapshot (fast)
 * GET /api/alerts?refresh=1 → fetch fresh alerts from NOAA, save snapshot
 */

import { getStore } from '@netlify/blobs';

const NOAA_BASE    = 'https://api.weather.gov';
const NOAA_HEADERS = {
  'User-Agent': 'NOAAWeatherDashboard/1.0 (github.com/catrihel/noaa-dashboard)',
  Accept: 'application/geo+json',
};

async function noaaFetch(url, timeout = 8_000) {
  const res = await fetch(url, {
    headers: NOAA_HEADERS,
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`NOAA ${res.status}: ${url}`);
  return res.json();
}

const ALERT_BLOB = 'snapshot';

export default async (req) => {
  const isRefresh = new URL(req.url).searchParams.get('refresh') === '1';

  let store = null;
  try { store = getStore('noaa-alerts'); } catch {}

  // ── Fast path: return cached snapshot ───────────────────────────────────
  if (!isRefresh && store) {
    try {
      const cached = await store.get(ALERT_BLOB, { type: 'json' });
      if (cached) return Response.json({ ...cached, _meta: { cached: true } });
    } catch {}
  }

  // ── Fetch fresh data ─────────────────────────────────────────────────────
  try {
    const data = await noaaFetch(`${NOAA_BASE}/alerts/active`);

    const result = {
      ...data,
      _meta: { cached: false, fetchedAt: new Date().toISOString() },
    };

    if (store) {
      try { await store.set(ALERT_BLOB, JSON.stringify(result)); } catch {}
    }

    return Response.json(result);
  } catch (err) {
    // On failure return stale snapshot rather than an error
    if (store) {
      try {
        const stale = await store.get(ALERT_BLOB, { type: 'json' });
        if (stale) return Response.json({ ...stale, _meta: { cached: true, stale: true } });
      } catch {}
    }
    return Response.json({ error: err.message }, { status: 502 });
  }
};

export const config = { path: '/api/alerts' };
