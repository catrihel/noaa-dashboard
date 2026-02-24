import { useState, useMemo, useCallback, useRef } from 'react';
import { useAlerts } from './hooks/useAlerts';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import AlertPopup from './components/AlertPopup';

const DEFAULT_FILTERS = {
  severities:  [],   // [] = all
  eventTypes:  [],   // [] = all
  state:       '',
  keyword:     '',
};

export default function App() {
  const { alerts, loading, error, lastUpdated, totalCount, countdown, refetch } = useAlerts();

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filters, setFilters]             = useState(DEFAULT_FILTERS);
  const [sidebarOpen, setSidebarOpen]     = useState(true);

  // MapView exposes a flyToBounds helper through this ref
  const mapRef = useRef(null);

  // ── Derived state ──────────────────────────────────────────────────────────
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const p = alert.properties ?? {};

      if (filters.severities.length && !filters.severities.includes(p.severity)) return false;
      if (filters.eventTypes.length  && !filters.eventTypes.includes(p.event))   return false;

      if (filters.state) {
        const stateUC = filters.state.toUpperCase();
        const ugc     = p.geocode?.UGC ?? [];
        const area    = (p.areaDesc ?? '').toLowerCase();
        if (!ugc.some(c => c.startsWith(stateUC)) && !area.includes(filters.state.toLowerCase())) {
          return false;
        }
      }

      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const hay = `${p.headline ?? ''} ${p.description ?? ''} ${p.event ?? ''} ${p.areaDesc ?? ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }

      return true;
    });
  }, [alerts, filters]);

  // Set of feature IDs that pass the current filter (used to dim others on the map)
  const filteredIds = useMemo(
    () => new Set(filteredAlerts.map(a => a.id ?? a.properties?.id)),
    [filteredAlerts],
  );

  // Unique event types from all loaded alerts
  const availableEventTypes = useMemo(
    () => [...new Set(alerts.map(a => a.properties?.event).filter(Boolean))].sort(),
    [alerts],
  );

  const isFiltered =
    filters.severities.length > 0 || filters.eventTypes.length > 0 ||
    filters.state !== ''            || filters.keyword !== '';

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAlertSelect = useCallback((alert) => {
    setSelectedAlert(alert);
    const nav = mapRef.current;
    if (!nav) return;

    if (alert.geometry) {
      // Zoom to the alert's polygon bounds
      nav.flyToBounds(alert.geometry);
    } else {
      // No polygon — fly to the first state mentioned in UGC codes
      const ugc = alert.properties?.geocode?.UGC ?? [];
      const stateCode = ugc[0]?.slice(0, 2);
      if (stateCode) {
        // Import centroids lazily from StateAlertCounts module isn't possible here,
        // so use a small inline lookup for the fallback fly-to
        const CENTROIDS = {
          AL:[32.81,-86.79], AK:[64.20,-153.37], AZ:[34.05,-111.09], AR:[34.80,-92.20],
          CA:[37.17,-119.45], CO:[39.00,-105.55], CT:[41.60,-72.75], DE:[39.00,-75.51],
          FL:[28.63,-82.45], GA:[32.69,-83.44], HI:[20.80,-156.33], ID:[44.07,-114.74],
          IL:[40.00,-89.00], IN:[39.77,-86.44], IA:[42.08,-93.50], KS:[38.48,-98.38],
          KY:[37.53,-85.30], LA:[30.98,-91.96], ME:[45.25,-69.00], MD:[38.80,-76.64],
          MA:[42.26,-71.81], MI:[44.66,-85.60], MN:[46.39,-94.64], MS:[32.74,-89.67],
          MO:[38.46,-92.29], MT:[46.88,-110.36], NE:[41.49,-99.90], NV:[38.80,-116.42],
          NH:[43.45,-71.56], NJ:[40.06,-74.41], NM:[34.52,-106.25], NY:[42.95,-75.53],
          NC:[35.56,-79.39], ND:[47.47,-100.47], OH:[40.37,-82.70], OK:[35.59,-97.49],
          OR:[43.80,-120.55], PA:[40.88,-77.80], RI:[41.68,-71.56], SC:[33.92,-80.90],
          SD:[44.44,-100.23], TN:[35.86,-86.35], TX:[31.47,-99.33], UT:[39.32,-111.09],
          VT:[44.07,-72.67], VA:[37.43,-78.66], WA:[47.38,-120.45], WV:[38.64,-80.62],
          WI:[44.27,-89.62], WY:[43.08,-107.29], DC:[38.90,-77.02], PR:[18.22,-66.59],
        };
        const c = CENTROIDS[stateCode];
        if (c) nav.flyToLatLng(c[0], c[1], 7);
      }
    }
  }, []);

  const handleFilterChange = useCallback(patch => setFilters(prev => ({ ...prev, ...patch })), []);
  const handleClearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden">

      <Header
        totalCount={totalCount}
        filteredCount={filteredAlerts.length}
        isFiltered={isFiltered}
        lastUpdated={lastUpdated}
        countdown={countdown}
        loading={loading}
        error={error}
        onRefresh={refetch}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
      />

      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <div
          className={`
            flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out
            ${sidebarOpen ? 'w-80' : 'w-0'}
          `}
        >
          {sidebarOpen && (
            <Sidebar
              alerts={alerts}
              filteredAlerts={filteredAlerts}
              selectedAlert={selectedAlert}
              filters={filters}
              availableEventTypes={availableEventTypes}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              onAlertSelect={handleAlertSelect}
              loading={loading}
            />
          )}
        </div>

        {/* ── Map + detail popup ────────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          <MapView
            alerts={alerts}
            filteredAlerts={filteredAlerts}
            filteredIds={filteredIds}
            selectedAlert={selectedAlert}
            onAlertSelect={handleAlertSelect}
            mapRef={mapRef}
          />

          {selectedAlert && (
            <AlertPopup
              alert={selectedAlert}
              onClose={() => setSelectedAlert(null)}
            />
          )}
        </div>

      </div>
    </div>
  );
}
