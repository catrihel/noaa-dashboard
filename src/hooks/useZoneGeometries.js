/**
 * Fetches NWS zone polygon geometry directly from api.weather.gov (CORS-enabled).
 *
 * Strategy
 * ────────
 * • Zone boundaries rarely change, so we cache them in localStorage forever.
 * • On first visit ~1254 unique zone codes need fetching; with HTTP/2 multiplexing
 *   and a 20-worker pool this completes in the background over ~2-3 minutes.
 * • Subsequent page loads are instant — everything served from localStorage.
 * • Polygons appear progressively as zones load (state updates every 50 zones).
 * • Passing filteredAlerts prioritises whatever the user is currently looking at.
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'noaa_zone_geom_v1';

const MARINE_PREFIXES = new Set([
  'AM','AN','GM','LC','LE','LH','LM','LO','LS',
  'PH','PK','PM','PS','PZ','SL',
]);

function getZoneType(code) {
  if (MARINE_PREFIXES.has(code.slice(0, 2).toUpperCase())) return 'marine';
  const t = code[2]?.toUpperCase();
  if (t === 'C') return 'county';
  if (t === 'F') return 'fire';
  return 'forecast';
}

// ── Module-level shared state ──────────────────────────────────────────────
// Initialise from localStorage so returning visitors get instant polygons.
const mem = (() => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
})();

const inFlight = new Set(); // deduplicate concurrent fetches

function fetchZone(id) {
  if (id in mem || inFlight.has(id)) return Promise.resolve();
  inFlight.add(id);
  return fetch(
    `https://api.weather.gov/zones/${getZoneType(id)}/${id}`,
    { headers: { Accept: 'application/geo+json' }, signal: AbortSignal.timeout(10_000) },
  )
    .then(r => r.ok ? r.json() : null)
    .then(d => { mem[id] = d?.geometry ?? null; })
    .catch(() => { mem[id] = null; })
    .finally(() => inFlight.delete(id));
}

// Worker-pool fetch: `concurrency` workers drain the `ids` queue in parallel.
async function fetchPool(ids, concurrency = 20) {
  let i = 0;
  async function worker() {
    while (i < ids.length) {
      await fetchZone(ids[i++]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, worker));
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mem)); } catch {}
}

// ── Hook ──────────────────────────────────────────────────────────────────
/**
 * Returns a { zoneId: geometry } map that grows as zones load.
 * Pass `filteredAlerts` so zones for the current view are fetched first.
 */
export function useZoneGeometries(alerts) {
  const [snapshot, setSnapshot] = useState(() => ({ ...mem }));

  useEffect(() => {
    if (!alerts.length) return;

    // Collect UGC codes for alerts that have no inline polygon geometry
    const needed = new Set();
    alerts.forEach(a => {
      if (!a.geometry) {
        (a.properties?.geocode?.UGC ?? []).forEach(c => needed.add(c));
      }
    });

    const missing = [...needed].filter(id => !(id in mem) && !inFlight.has(id));

    if (!missing.length) {
      // Everything already cached — just sync snapshot
      setSnapshot(prev => {
        const hasNew = needed.size && [...needed].some(id => mem[id] && !prev[id]);
        return hasNew ? { ...mem } : prev;
      });
      return;
    }

    let cancelled = false;

    (async () => {
      // Fetch in chunks of 50 so we update the map progressively
      const CHUNK = 50;
      for (let i = 0; i < missing.length; i += CHUNK) {
        if (cancelled) break;
        await fetchPool(missing.slice(i, i + CHUNK));
        if (!cancelled) {
          setSnapshot({ ...mem });
          persist();
        }
      }
    })();

    return () => { cancelled = true; };
  }, [alerts]); // eslint-disable-line react-hooks/exhaustive-deps

  return snapshot;
}
