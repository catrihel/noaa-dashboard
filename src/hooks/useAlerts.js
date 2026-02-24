import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { getSeverityOrder } from '../utils/severity';

const POLL_MS = 60_000;

// In dev, VITE_API_URL is undefined → empty string → Vite proxy handles /api/*
// In prod, set VITE_API_URL=https://your-backend.railway.app in Netlify env vars
const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * Fetches active NWS alerts via the local proxy and polls every 60 seconds.
 *
 * Returns:
 *   alerts       – Feature[] sorted by severity then newest-first
 *   loading      – true only during the first fetch
 *   error        – error string or null
 *   lastUpdated  – Date of last successful fetch
 *   totalCount   – total reported by NOAA pagination
 *   countdown    – seconds until next auto-refresh
 *   refetch      – call to trigger an immediate refresh + reset timer
 */
export function useAlerts() {
  const [alerts, setAlerts]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [totalCount, setTotalCount]   = useState(0);
  const [countdown, setCountdown]     = useState(POLL_MS / 1000);

  const pollRef      = useRef(null);
  const tickRef      = useRef(null);
  const mountedRef   = useRef(true);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/alerts`, {
        params: { status: 'actual', message_type: 'alert', limit: 500 },
      });

      if (!mountedRef.current) return;

      const features = [...(data.features ?? [])].sort((a, b) => {
        const sA = getSeverityOrder(a.properties?.severity);
        const sB = getSeverityOrder(b.properties?.severity);
        if (sA !== sB) return sA - sB;
        return (new Date(b.properties?.sent ?? 0)) - (new Date(a.properties?.sent ?? 0));
      });

      setAlerts(features);
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

  // ── countdown tick ─────────────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    clearInterval(tickRef.current);
    setCountdown(POLL_MS / 1000);
    tickRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(tickRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ── manual refresh ─────────────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    clearInterval(pollRef.current);
    await fetchAlerts();
    startCountdown();
    pollRef.current = setInterval(async () => {
      await fetchAlerts();
      startCountdown();
    }, POLL_MS);
  }, [fetchAlerts, startCountdown]);

  // ── mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    fetchAlerts().then(startCountdown);

    pollRef.current = setInterval(async () => {
      await fetchAlerts();
      startCountdown();
    }, POLL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(pollRef.current);
      clearInterval(tickRef.current);
    };
  }, [fetchAlerts, startCountdown]);

  return { alerts, loading, error, lastUpdated, totalCount, countdown, refetch };
}
