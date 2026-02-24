import { useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import AlertGeoJSON from './AlertGeoJSON';
import StateAlertCounts from './StateAlertCounts';

const US_CENTER  = [38.5, -96];
const US_ZOOM    = 4;
const US_BOUNDS  = [[15, -170], [72, -60]];

const TILE_URL  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Exposes navigation helpers via mapRef so the parent can call them:
 *   mapRef.current.flyToBounds(geometry)   – fly to a GeoJSON geometry
 *   mapRef.current.flyToLatLng(lat, lng)   – fly to a point (fallback for no-geometry alerts)
 */
function MapController({ mapRef }) {
  const map = useMap();

  useEffect(() => {
    if (!mapRef) return;
    mapRef.current = {
      flyToBounds(geometry) {
        if (!geometry) return;
        try {
          const bounds = L.geoJSON(geometry).getBounds();
          if (bounds.isValid()) {
            map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 10, duration: 0.75 });
          }
        } catch { /* ignore malformed geometry */ }
      },

      flyToLatLng(lat, lng, zoom = 7) {
        map.flyTo([lat, lng], zoom, { duration: 0.75 });
      },
    };
  }, [map, mapRef]);

  return null;
}

export default function MapView({
  alerts,
  filteredAlerts,
  filteredIds,
  selectedAlert,
  onAlertSelect,
  mapRef,
}) {
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

      {/* Alert polygons */}
      <AlertGeoJSON
        alerts={alerts}
        filteredIds={filteredIds}
        selectedId={selectedId}
        onAlertClick={onAlertSelect}
      />

      {/* State-level count badges — updates when filters change */}
      <StateAlertCounts alerts={filteredAlerts} />

      <MapController mapRef={mapRef} />
    </MapContainer>
  );
}
