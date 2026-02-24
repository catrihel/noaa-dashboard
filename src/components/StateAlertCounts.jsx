import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { STATE_CENTROIDS } from '../utils/centroids';

const SEVERITY_ORDER = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };

const SEVERITY_COLORS = {
  Extreme: { bg: '#fef2f2', border: '#fca5a5', dot: '#ef4444', text: '#991b1b' },
  Severe:  { bg: '#fff7ed', border: '#fdba74', dot: '#f97316', text: '#9a3412' },
  Moderate:{ bg: '#fefce8', border: '#fde047', dot: '#eab308', text: '#854d0e' },
  Minor:   { bg: '#eff6ff', border: '#93c5fd', dot: '#3b82f6', text: '#1e40af' },
  Unknown: { bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8', text: '#475569' },
};

function analyzeByState(alerts) {
  const data = {};
  alerts.forEach(alert => {
    const ugc      = alert.properties?.geocode?.UGC ?? [];
    const severity = alert.properties?.severity ?? 'Unknown';
    const states   = new Set(ugc.map(c => c.slice(0, 2)));

    states.forEach(s => {
      if (!data[s]) data[s] = { count: 0, worstSeverity: 'Unknown' };
      data[s].count++;
      if (SEVERITY_ORDER[severity] < SEVERITY_ORDER[data[s].worstSeverity]) {
        data[s].worstSeverity = severity;
      }
    });
  });
  return data;
}

function makeBadge(stateCode, count, worstSeverity) {
  const pal = SEVERITY_COLORS[worstSeverity] ?? SEVERITY_COLORS.Unknown;

  return L.divIcon({
    html: `
      <div style="
        display:flex;
        align-items:center;
        gap:5px;
        background:${pal.bg};
        border:1.5px solid ${pal.border};
        border-radius:999px;
        padding:3px 9px 3px 7px;
        box-shadow:0 2px 8px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.04);
        font-family:system-ui,sans-serif;
        white-space:nowrap;
        pointer-events:none;
      ">
        <span style="
          width:7px;height:7px;border-radius:50%;
          background:${pal.dot};flex-shrink:0;
        "></span>
        <span style="font-size:10px;font-weight:700;color:#475569;letter-spacing:0.04em">
          ${stateCode}
        </span>
        <span style="font-size:13px;font-weight:800;color:${pal.text};line-height:1;letter-spacing:-0.01em">
          ${count}
        </span>
      </div>`,
    className: '',
    iconSize:   [80, 24],
    iconAnchor: [40, 12],
  });
}

export default function StateAlertCounts({ alerts }) {
  const map      = useMap();
  const groupRef = useRef(null);

  useEffect(() => {
    const group = L.layerGroup().addTo(map);
    groupRef.current = group;
    return () => { group.remove(); groupRef.current = null; };
  }, [map]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.clearLayers();

    const stateData = analyzeByState(alerts);

    Object.entries(stateData).forEach(([code, { count, worstSeverity }]) => {
      const centroid = STATE_CENTROIDS[code];
      if (!centroid || count < 1) return;

      group.addLayer(
        L.marker(centroid, {
          icon:         makeBadge(code, count, worstSeverity),
          interactive:  false,
          zIndexOffset: 600,
        })
      );
    });
  }, [alerts]);

  return null;
}
