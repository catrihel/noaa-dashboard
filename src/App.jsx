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
    if (alert.geometry && mapRef.current?.flyToBounds) {
      mapRef.current.flyToBounds(alert.geometry);
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
