import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Renders a count badge at each US state centroid showing how many of the
 * currently-filtered alerts affect that state.
 *
 * Badge colour scales with urgency:
 *   ≥ 10 alerts → red   |   ≥ 5 → orange   |   < 5 → dark slate
 */

// Geographic centre of each state / territory
const STATE_CENTROIDS = {
  AL: [32.81, -86.79],  AK: [64.20, -153.37], AZ: [34.05, -111.09],
  AR: [34.80, -92.20],  CA: [37.17, -119.45], CO: [39.00, -105.55],
  CT: [41.60, -72.75],  DE: [39.00, -75.51],  FL: [28.63, -82.45],
  GA: [32.69, -83.44],  HI: [20.80, -156.33], ID: [44.07, -114.74],
  IL: [40.00, -89.00],  IN: [39.77, -86.44],  IA: [42.08, -93.50],
  KS: [38.48, -98.38],  KY: [37.53, -85.30],  LA: [30.98, -91.96],
  ME: [45.25, -69.00],  MD: [38.80, -76.64],  MA: [42.26, -71.81],
  MI: [44.66, -85.60],  MN: [46.39, -94.64],  MS: [32.74, -89.67],
  MO: [38.46, -92.29],  MT: [46.88, -110.36], NE: [41.49, -99.90],
  NV: [38.80, -116.42], NH: [43.45, -71.56],  NJ: [40.06, -74.41],
  NM: [34.52, -106.25], NY: [42.95, -75.53],  NC: [35.56, -79.39],
  ND: [47.47, -100.47], OH: [40.37, -82.70],  OK: [35.59, -97.49],
  OR: [43.80, -120.55], PA: [40.88, -77.80],  RI: [41.68, -71.56],
  SC: [33.92, -80.90],  SD: [44.44, -100.23], TN: [35.86, -86.35],
  TX: [31.47, -99.33],  UT: [39.32, -111.09], VT: [44.07, -72.67],
  VA: [37.43, -78.66],  WA: [47.38, -120.45], WV: [38.64, -80.62],
  WI: [44.27, -89.62],  WY: [43.08, -107.29], DC: [38.90, -77.02],
  PR: [18.22, -66.59],  GU: [13.44, 144.79],
};

/** Extract the 2-letter state code from a UGC zone string like "CAZ001" → "CA" */
function countsFromAlerts(alerts) {
  const counts = {};
  alerts.forEach(alert => {
    const ugc = alert.properties?.geocode?.UGC ?? [];
    const states = new Set(ugc.map(c => c.slice(0, 2)));
    states.forEach(s => { counts[s] = (counts[s] ?? 0) + 1; });
  });
  return counts;
}

function makeBadgeIcon(count) {
  const bg =
    count >= 10 ? 'rgba(239,68,68,0.92)'   :
    count >=  5 ? 'rgba(249,115,22,0.92)'  :
                  'rgba(15,23,42,0.88)';

  const border =
    count >= 10 ? 'rgba(239,68,68,0.6)'  :
    count >=  5 ? 'rgba(249,115,22,0.5)' :
                  'rgba(148,163,184,0.35)';

  return L.divIcon({
    html: `<div style="
      background:${bg};
      border:1px solid ${border};
      border-radius:999px;
      padding:1px 7px;
      font-size:11px;
      font-weight:700;
      color:#f8fafc;
      white-space:nowrap;
      line-height:18px;
      box-shadow:0 2px 8px rgba(0,0,0,0.55);
      font-family:system-ui,sans-serif;
      cursor:default;
    ">${count}</div>`,
    className: '',
    iconSize:   [32, 20],
    iconAnchor: [16, 10],
  });
}

export default function StateAlertCounts({ alerts }) {
  const map      = useMap();
  const groupRef = useRef(null);

  // Create layer group once on mount, remove on unmount
  useEffect(() => {
    const group = L.layerGroup().addTo(map);
    groupRef.current = group;
    return () => { group.remove(); groupRef.current = null; };
  }, [map]);

  // Rebuild badges whenever filtered alerts change
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.clearLayers();

    const counts = countsFromAlerts(alerts);

    Object.entries(counts).forEach(([code, count]) => {
      const centroid = STATE_CENTROIDS[code];
      if (!centroid || count < 1) return;

      const marker = L.marker(centroid, {
        icon:         makeBadgeIcon(count),
        interactive:  false,   // badges don't capture clicks
        zIndexOffset: 600,
      });
      group.addLayer(marker);
    });
  }, [alerts]);

  return null;
}
