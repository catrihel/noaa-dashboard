/**
 * Netlify Function: /api/alerts
 *
 * Proxies NOAA alerts server-side (no CORS issues for any browser/network).
 * Augments the response with zone geometries for alerts that have no inline
 * polygon — most NOAA alerts only carry UGC zone codes, not polygon data.
 *
 * Zone geometries are fetched from NOAA's /zones API and cached indefinitely
 * in Netlify Blobs (zone boundaries almost never change).  Missing zones are
 * fetched in parallel batches of 100 on each refresh.
 *
 * GET /api/alerts          → return stored snapshot (fast)
 * GET /api/alerts?refresh=1 → fetch fresh alerts + any missing zones, save snapshot
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

// Fetch a single batch of up to 100 zone IDs from NOAA.
// Returns a { zoneId: geometry } map for whatever came back.
async function fetchZonesBatch(ids) {
  if (!ids.length) return {};
  try {
    const data = await noaaFetch(
      `${NOAA_BASE}/zones?id=${ids.join(',')}&include_geometry=true`,
    );
    const result = {};
    (data.features ?? []).forEach(f => {
      const id = f.properties?.id;
      if (id && f.geometry) result[id] = f.geometry;
    });
    return result;
  } catch {
    return {}; // non-fatal — return whatever we managed to fetch
  }
}

// Given a set of needed UGC codes, return a { zoneId: geometry } map.
// Loads a persisted cache from Blobs and only fetches codes that are missing.
// Fetches up to 300 missing codes per call (3 parallel batches of 100).
async function resolveZones(neededCodes, store) {
  if (!neededCodes.size) return {};

  // Load persisted zone geometry cache
  let cache = {};
  if (store) {
    try { cache = (await store.get('zone-geom', { type: 'json' })) ?? {}; } catch {}
  }

  const missing = [...neededCodes].filter(id => !cache[id]);
  if (missing.length > 0) {
    const BATCH    = 100;
    const PARALLEL = 3; // fetch up to 300 zones per refresh within timeout budget
    const toFetch  = missing.slice(0, BATCH * PARALLEL);

    const batches = [];
    for (let i = 0; i < toFetch.length; i += BATCH) {
      batches.push(toFetch.slice(i, i + BATCH));
    }

    const results = await Promise.all(batches.map(fetchZonesBatch));
    results.forEach(r => Object.assign(cache, r));

    if (store) {
      try { await store.set('zone-geom', JSON.stringify(cache)); } catch {}
    }
  }

  const result = {};
  neededCodes.forEach(id => { if (cache[id]) result[id] = cache[id]; });
  return result;
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

    // Collect UGC codes for alerts that have no inline polygon geometry
    const neededCodes = new Set();
    (data.features ?? []).forEach(f => {
      if (!f.geometry) {
        (f.properties?.geocode?.UGC ?? []).forEach(c => neededCodes.add(c));
      }
    });

    const zoneGeometries = await resolveZones(neededCodes, store);

    const result = {
      ...data,
      zoneGeometries,
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
