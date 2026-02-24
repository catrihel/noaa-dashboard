import { useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import AlertGeoJSON from './AlertGeoJSON';
import StateAlertCounts from './StateAlertCounts';
import { STATE_CENTROIDS } from '../utils/centroids';

const US_CENTER = [38.5, -96];
const US_ZOOM   = 4;
const US_BOUNDS = [[15, -170], [72, -60]];

// CartoDB Positron — clean light basemap, no API key
const TILE_URL  = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Watches selectedAlert and flies to it every time it changes.
 * map.stop() before each animation prevents stacking from rapid clicks.
 */
function MapController({ selectedAlert }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedAlert) return;

    // Cancel any in-progress pan/zoom before starting a new one
    map.stop();

    if (selectedAlert.geometry) {
      try {
        const bounds = L.geoJSON(selectedAlert.geometry).getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 10, duration: 0.65 });
        }
      } catch { /* ignore malformed geometry */ }
    } else {
      // No polygon — fly to the state centroid mentioned in UGC codes
      const ugc       = selectedAlert.properties?.geocode?.UGC ?? [];
      const stateCode = ugc[0]?.slice(0, 2);
      const centroid  = STATE_CENTROIDS[stateCode];
      if (centroid) map.flyTo(centroid, 7, { duration: 0.65 });
    }
  }, [selectedAlert, map]);

  return null;
}

export default function MapView({
  alerts,
  countyGeometries,
  filteredAlerts,
  filteredIds,
  selectedAlert,
  onAlertSelect,
  onStateClick,
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
      style={{ background: '#e2e8f0' }}
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
        countyGeometries={countyGeometries}
        filteredIds={filteredIds}
        selectedId={selectedId}
        onAlertClick={onAlertSelect}
      />

      <StateAlertCounts alerts={filteredAlerts} onStateClick={onStateClick} />

      <MapController selectedAlert={selectedAlert} />
    </MapContainer>
  );
}
