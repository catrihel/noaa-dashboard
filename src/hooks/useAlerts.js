import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { getSeverityOrder } from '../utils/severity';

// In dev, VITE_API_URL is undefined → empty string → Vite proxy handles /api/*
// In prod, Netlify Function intercepts /api/alerts (no env var needed)
const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * Loads NWS alerts once on mount (from the server-side snapshot).
 * Manual refresh passes ?refresh=1, which tells the Netlify Function
 * to fetch fresh data from NOAA and save a new snapshot.
 *
 * Returns:
 *   alerts      – Feature[] sorted by severity then newest-first
 *   loading     – true only during the first fetch
 *   error       – error string or null
 *   lastUpdated – Date of last successful fetch
 *   totalCount  – total reported by NOAA
 *   refetch     – call to trigger a manual refresh
 */
export function useAlerts() {
  const [alerts, setAlerts]                   = useState([]);
  const [zoneGeometries, setZoneGeometries]   = useState({});
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [lastUpdated, setLastUpdated]         = useState(null);
  const [totalCount, setTotalCount]           = useState(0);

  const mountedRef = useRef(true);

  const fetchAlerts = useCallback(async (refresh = false) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/alerts`, {
        params: refresh ? { refresh: '1' } : {},
      });

      if (!mountedRef.current) return;

      const features = [...(data.features ?? [])].sort((a, b) => {
        const sA = getSeverityOrder(a.properties?.severity);
        const sB = getSeverityOrder(b.properties?.severity);
        if (sA !== sB) return sA - sB;
        return (new Date(b.properties?.sent ?? 0)) - (new Date(a.properties?.sent ?? 0));
      });

      setAlerts(features);
      setZoneGeometries(data.zoneGeometries ?? {});
      setTotalCount(data.pagination?.total ?? features.length);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.response?.data?.error ?? err.message ?? 'Failed to fetch');
      console.error('[useAlerts]', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => fetchAlerts(true), [fetchAlerts]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAlerts(false);
    return () => { mountedRef.current = false; };
  }, [fetchAlerts]);

  return { alerts, zoneGeometries, loading, error, lastUpdated, totalCount, refetch };
}
