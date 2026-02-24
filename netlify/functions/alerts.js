/**
 * Netlify Function: /api/alerts
 *
 * Proxies NOAA alerts server-side (no CORS issues for any browser/network).
 * Uses Netlify Blobs to persist the last successful snapshot so the site
 * always loads with data, even before the first manual refresh.
 *
 * GET /api/alerts          → return stored snapshot (fast)
 * GET /api/alerts?refresh=1 → fetch fresh from NOAA, save snapshot, return it
 */

import { getStore } from '@netlify/blobs';

const NOAA_URL  = 'https://api.weather.gov/alerts/active';
const CACHE_KEY = 'snapshot';

export default async (req) => {
  const url       = new URL(req.url);
  const isRefresh = url.searchParams.get('refresh') === '1';

  // ── Try to get the blob store (only available in Netlify prod environment) ──
  let store = null;
  try {
    store = getStore('noaa-alerts');
  } catch {
    // Not available in local dev — falls through to direct NOAA fetch
  }

  // ── Return cached snapshot if not refreshing ─────────────────────────────
  if (!isRefresh && store) {
    try {
      const cached = await store.get(CACHE_KEY, { type: 'json' });
      if (cached) {
        return Response.json({ ...cached, _meta: { cached: true } });
      }
    } catch {
      // No snapshot yet — fall through to fresh fetch
    }
  }

  // ── Fetch fresh data from NOAA ───────────────────────────────────────────
  try {
    const res = await fetch(NOAA_URL, {
      headers: {
        'User-Agent': 'NOAAWeatherDashboard/1.0 (github.com/catrihel/noaa-dashboard)',
        Accept: 'application/geo+json',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) throw new Error(`NOAA returned ${res.status}`);

    const data = await res.json();

    // Save snapshot for future loads
    if (store) {
      try {
        await store.set(CACHE_KEY, JSON.stringify(data));
      } catch { /* non-fatal */ }
    }

    return Response.json({
      ...data,
      _meta: { cached: false, fetchedAt: new Date().toISOString() },
    });
  } catch (err) {
    // Fetch failed — return stale snapshot if available rather than an error
    if (store) {
      try {
        const stale = await store.get(CACHE_KEY, { type: 'json' });
        if (stale) {
          return Response.json({ ...stale, _meta: { cached: true, stale: true } });
        }
      } catch { /* ignore */ }
    }

    return Response.json(
      { error: 'Failed to fetch NOAA alerts', details: err.message },
      { status: 502 },
    );
  }
};

// Routes this function to /api/alerts — no redirect needed in netlify.toml
export const config = { path: '/api/alerts' };
