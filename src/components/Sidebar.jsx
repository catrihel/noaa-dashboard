import { SEVERITY_CONFIG } from '../utils/severity';
import FilterPanel from './FilterPanel';
import AlertList from './AlertList';

function SeveritySummary({ alerts }) {
  const counts = { Extreme: 0, Severe: 0, Moderate: 0, Minor: 0 };
  alerts.forEach(a => {
    const s = a.properties?.severity;
    if (s in counts) counts[s]++;
  });

  return (
    <div className="grid grid-cols-4 border-b border-slate-200 shrink-0">
      {Object.entries(counts).map(([level, count]) => {
        const cfg = SEVERITY_CONFIG[level];
        return (
          <div key={level} className="flex flex-col items-center py-2.5 gap-0.5">
            <span className="text-base font-bold leading-none" style={{ color: cfg.color }}>
              {count}
            </span>
            <span className="text-xs text-slate-400 leading-none">{level.slice(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Sidebar({
  alerts, filteredAlerts, selectedAlert,
  filters, availableEventTypes,
  onFilterChange, onClearFilters,
  onAlertSelect, loading,
}) {
  return (
    <div className="w-80 h-full flex flex-col bg-white border-r border-slate-200 overflow-hidden">

      <div className="px-3 py-2 border-b border-slate-200 shrink-0 bg-slate-50">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Active Alerts</h2>
      </div>

      {!loading && <SeveritySummary alerts={filteredAlerts} />}

      <div className="shrink-0 overflow-y-auto">
        <FilterPanel
          filters={filters}
          availableEventTypes={availableEventTypes}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          filteredCount={filteredAlerts.length}
          totalCount={alerts.length}
        />
      </div>

      <div className="px-3 py-1.5 shrink-0 bg-slate-50 border-b border-slate-200">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Results ({filteredAlerts.length})
        </h3>
      </div>

      <AlertList
        alerts={filteredAlerts}
        selectedAlert={selectedAlert}
        onAlertSelect={onAlertSelect}
        loading={loading}
      />
    </div>
  );
}
