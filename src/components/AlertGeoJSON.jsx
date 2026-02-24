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
 *   alerts       – raw Feature[] (may include null-geometry items, which are skipped)
 *   filteredIds  – Set<string> of feature IDs that match current filters
 *                  Empty set = show all at full opacity
 *   selectedId   – id of the currently selected alert (highlighted)
 *   onAlertClick – (feature) => void
 */
export default function AlertGeoJSON({ alerts, zoneGeometries, filteredIds, selectedId, onAlertClick }) {
  const map      = useMap();
  const groupRef = useRef(null);

  // Create the layer group once when the map mounts; remove on unmount.
  useEffect(() => {
    const group = L.layerGroup().addTo(map);
    groupRef.current = group;
    return () => {
      group.remove();
      groupRef.current = null;
    };
  }, [map]);

  // Rebuild all polygons whenever alerts, filters, or selection change.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    group.clearLayers();

    alerts.forEach((alert) => {
      // Use the alert's inline geometry, or fall back to a GeometryCollection
      // built from its UGC zone codes (most NOAA alerts have no inline polygon).
      let geometry = alert.geometry;
      if (!geometry && zoneGeometries) {
        const ugc       = alert.properties?.geocode?.UGC ?? [];
        const zoneGeoms = ugc.map(c => zoneGeometries[c]).filter(Boolean);
        if (zoneGeoms.length > 0) {
          geometry = { type: 'GeometryCollection', geometries: zoneGeoms };
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

      try {
        const geoLayer = L.geoJSON(
          { type: 'Feature', geometry, properties: alert.properties ?? {} },
          {
            style:          () => baseStyle,
            onEachFeature:  (_, lyr) => {
              const p = alert.properties ?? {};

              // Tooltip
              lyr.bindTooltip(
                `<strong style="font-size:12px">${p.event ?? 'Alert'}</strong>` +
                `<br/><span style="color:#94a3b8;font-size:11px">${p.severity ?? 'Unknown'}</span>` +
                (p.areaDesc ? `<br/><span style="color:#64748b;font-size:10px">${p.areaDesc.substring(0, 60)}${p.areaDesc.length > 60 ? '…' : ''}</span>` : ''),
                { sticky: true },
              );

              lyr.on({
                click: () => onAlertClick(alert),

                mouseover(e) {
                  if (dimmed) return;
                  e.target.setStyle({
                    ...baseStyle,
                    weight:      (baseStyle.weight ?? 1) + 1.5,
                    fillOpacity: Math.min((baseStyle.fillOpacity ?? 0.3) + 0.2, 0.9),
                  });
                  e.target.bringToFront();
                },

                mouseout(e) {
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
  }, [alerts, zoneGeometries, filteredIds, selectedId, onAlertClick]);

  return null;
}
