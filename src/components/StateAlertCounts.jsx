import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { STATE_CENTROIDS } from '../utils/centroids';

const SEVERITY_ORDER = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };

const SEVERITY_DOT_COLOR = {
  Extreme: '#ef4444',
  Severe:  '#f97316',
  Moderate:'#eab308',
  Minor:   '#3b82f6',
  Unknown: '#94a3b8',
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

function bubbleSize(count) {
  // floor 22px, scales with sqrt of count, capped at 54px
  return Math.min(Math.max(22, Math.round(22 + Math.sqrt(count) * 6)), 54);
}

function makeBubble(count, worstSeverity) {
  const size  = bubbleSize(count);
  const color = SEVERITY_DOT_COLOR[worstSeverity] ?? SEVERITY_DOT_COLOR.Unknown;
  const fs    = Math.max(9, Math.round(size * 0.34));

  return L.divIcon({
    html: `
      <div class="state-bubble" style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:${color};
        border:2px solid rgba(255,255,255,0.7);
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
        display:flex;
        align-items:center;
        justify-content:center;
        font-family:system-ui,sans-serif;
        font-size:${fs}px;
        font-weight:800;
        color:#fff;
        line-height:1;
        cursor:pointer;
      ">${count}</div>`,
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function StateAlertCounts({ alerts, onStateClick }) {
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

      const marker = L.marker(centroid, {
        icon:         makeBubble(count, worstSeverity),
        interactive:  true,
        zIndexOffset: 600,
      });

      marker.on('click', () => {
        map.stop();
        map.flyTo(centroid, 7, { duration: 0.65 });
        onStateClick?.(code);
      });

      group.addLayer(marker);
    });
  }, [alerts, map, onStateClick]);

  return null;
}
