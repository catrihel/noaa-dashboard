import { useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import AlertGeoJSON from './AlertGeoJSON';

const US_CENTER  = [38.5, -96];
const US_ZOOM    = 4;
const US_BOUNDS  = [[15, -170], [72, -60]];

// CartoDB Dark Matter — free, no API key
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Inner component that gains map access via useMap() and:
 *  - exposes mapRef.flyToBounds for the parent to call
 *  - flies to the selected alert whenever it changes
 */
function MapController({ selectedAlert, mapRef }) {
  const map = useMap();

  // Expose flyToBounds through mapRef
  useEffect(() => {
    if (!mapRef) return;
    mapRef.current = {
      flyToBounds(geometry) {
        if (!geometry) return;
        try {
          const bounds = L.geoJSON(geometry).getBounds();
          if (bounds.isValid()) {
            map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 9, duration: 0.8 });
          }
        } catch { /* ignore */ }
      },
    };
  }, [map, mapRef]);

  // Fly when selection changes
  useEffect(() => {
    if (!selectedAlert?.geometry) return;
    try {
      const bounds = L.geoJSON(selectedAlert.geometry).getBounds();
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 9, duration: 0.8 });
      }
    } catch { /* ignore */ }
  }, [selectedAlert, map]);

  return null;
}

export default function MapView({ alerts, filteredIds, selectedAlert, onAlertSelect, mapRef }) {
  const selectedId = selectedAlert?.id ?? selectedAlert?.properties?.id;

  return (
    <MapContainer
      center={US_CENTER}
      zoom={US_ZOOM}
      maxBounds={US_BOUNDS}
      maxBoundsViscosity={0.4}
      zoomControl={false}
      className="w-full h-full"
      style={{ background: '#0f172a' }}
    >
      <TileLayer
        url={TILE_URL}
        attribution={TILE_ATTR}
        subdomains="abcd"
        maxZoom={19}
      />

      <ZoomControl position="bottomright" />

      <AlertGeoJSON
        alerts={alerts}
        filteredIds={filteredIds}
        selectedId={selectedId}
        onAlertClick={onAlertSelect}
      />

      <MapController selectedAlert={selectedAlert} mapRef={mapRef} />
    </MapContainer>
  );
}
