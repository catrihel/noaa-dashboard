import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { getSeverityConfig } from '../utils/severity';

/**
 * Renders NOAA alert polygons imperatively on the Leaflet map.
 *
 * Uses a LayerGroup + L.geoJSON rather than react-leaflet's <GeoJSON>
 * component to avoid reconciliation quirks with react-leaflet v5.
 *
 * Props:
 *   alerts           – raw Feature[] (may include null-geometry items, which are skipped)
 *   countyGeometries – { fipsCode: geometry } map for zone-only alerts
 *   filteredIds      – Set<string> of feature IDs that match current filters
 *                      Empty set = show all at full opacity
 *   selectedId       – id of the currently selected alert (highlighted)
 *   onAlertClick     – (feature) => void
 */
export default function AlertGeoJSON({ alerts, countyGeometries, filteredIds, selectedId, onAlertClick }) {
  const map        = useMap();
  const groupRef   = useRef(null);
  const tooltipRef = useRef(null);

  // Create the layer group and ONE shared tooltip when the map mounts.
  // A single tooltip instance means only one can ever be visible at a time,
  // which avoids the bringToFront() DOM-reorder issue that drops mouseout
  // events and leaves per-layer tooltips permanently open.
  useEffect(() => {
    const group = L.layerGroup().addTo(map);
    groupRef.current = group;
    tooltipRef.current = L.tooltip({ sticky: true, opacity: 0.95 });
    return () => {
      group.remove();
      groupRef.current = null;
      if (tooltipRef.current) {
        map.removeLayer(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, [map]);

  // Rebuild all polygons whenever alerts, filters, or selection change.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    group.clearLayers();

    alerts.forEach((alert) => {
      // Use the alert's inline geometry, or fall back to a GeometryCollection
      // built from county FIPS codes derived from geocode.SAME.
      let geometry = alert.geometry;
      if (!geometry && countyGeometries) {
        // SAME codes: "PSSCCC" format — strip leading digit to get 5-digit FIPS
        const same        = alert.properties?.geocode?.SAME ?? [];
        const countyGeoms = same
          .map(s => s.length === 6 ? countyGeometries[s.slice(1)] : null)
          .filter(Boolean);
        if (countyGeoms.length > 0) {
          geometry = { type: 'GeometryCollection', geometries: countyGeoms };
        }
      }
      if (!geometry) return;

      const id       = alert.id ?? alert.properties?.id;
      const cfg      = getSeverityConfig(alert.properties?.severity);
      const selected = id === selectedId;
      const dimmed   = filteredIds.size > 0 && !filteredIds.has(id);

      const baseStyle = dimmed
        ? { color: cfg.color, fillColor: cfg.fillColor, fillOpacity: 0.05,  weight: 0.5, opacity: 0.2 }
        : {
            color:       selected ? '#ffffff' : cfg.color,
            fillColor:   cfg.fillColor,
            fillOpacity: selected ? Math.min(cfg.fillOpacity + 0.2, 0.85) : cfg.fillOpacity,
            weight:      selected ? cfg.weight + 1.5 : cfg.weight,
            opacity:     1,
          };

      const p = alert.properties ?? {};
      const tooltipContent =
        `<strong style="font-size:12px">${p.event ?? 'Alert'}</strong>` +
        `<br/><span style="color:#94a3b8;font-size:11px">${p.severity ?? 'Unknown'}</span>` +
        (p.areaDesc ? `<br/><span style="color:#64748b;font-size:10px">${p.areaDesc.substring(0, 60)}${p.areaDesc.length > 60 ? '…' : ''}</span>` : '');

      try {
        const geoLayer = L.geoJSON(
          { type: 'Feature', geometry, properties: p },
          {
            style:         () => baseStyle,
            onEachFeature: (_, lyr) => {
              lyr.on({
                click: () => onAlertClick(alert),

                mouseover(e) {
                  // Show the shared tooltip at the cursor position.
                  // addTo is idempotent — safe to call even if already on map.
                  const tt = tooltipRef.current;
                  if (tt) tt.setContent(tooltipContent).setLatLng(e.latlng).addTo(map);

                  if (dimmed) return;
                  e.target.setStyle({
                    ...baseStyle,
                    weight:      (baseStyle.weight ?? 1) + 1.5,
                    fillOpacity: Math.min((baseStyle.fillOpacity ?? 0.3) + 0.2, 0.9),
                  });
                  e.target.bringToFront();
                },

                mousemove(e) {
                  // Keep the tooltip following the cursor.
                  tooltipRef.current?.setLatLng(e.latlng);
                },

                mouseout(e) {
                  // Explicitly remove the shared tooltip from the map.
                  const tt = tooltipRef.current;
                  if (tt) map.removeLayer(tt);
                  e.target.setStyle(baseStyle);
                },
              });
            },
          },
        );

        group.addLayer(geoLayer);
      } catch {
        // Skip features with malformed geometry silently
      }
    });
  }, [alerts, countyGeometries, filteredIds, selectedId, onAlertClick, map]);

  return null;
}
