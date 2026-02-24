import { useState, useEffect, useRef } from 'react';

const NOAA_URL = 'https://api.weather.gov/alerts/active?area=US';
const REFRESH_INTERVAL_MS = 60_000;

function normalizeAlert(feature) {
  const p = feature.properties ?? {};
  return {
    id: feature.id ?? p.id,
    event: p.event ?? 'Unknown Event',
    severity: p.severity ?? 'Unknown',
    urgency: p.urgency ?? 'Unknown',
    certainty: p.certainty ?? 'Unknown',
    headline: p.headline ?? '',
    description: p.description ?? '',
    instruction: p.instruction ?? '',
    areaDesc: p.areaDesc ?? '',
    onset: p.onset ?? null,
    expires: p.expires ?? null,
    geometry: feature.geometry ?? null,
  };
}

export function useNoaaAlerts() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  async function fetchAlerts() {
    try {
      const res = await fetch(NOAA_URL, {
        headers: { Accept: 'application/geo+json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const normalized = (data.features ?? []).map(normalizeAlert);
      setFeatures(normalized);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlerts();
    intervalRef.current = setInterval(fetchAlerts, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  return { features, loading, error, lastUpdated };
}
