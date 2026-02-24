import { memo } from 'react';
import { getSeverityConfig } from '../utils/severity';
import { truncate, formatRelative } from '../utils/formatters';

const AlertItem = memo(function AlertItem({ alert, isSelected, onClick }) {
  const p   = alert.properties ?? {};
  const cfg = getSeverityConfig(p.severity);

  return (
    <button
      onClick={() => onClick(alert)}
      className={`
        w-full text-left px-3 py-2.5 border-l-2 transition-colors
        hover:bg-slate-700/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500
        ${isSelected ? 'bg-slate-700/80' : 'border-l-transparent hover:border-l-slate-600'}
      `}
      style={isSelected ? { borderLeftColor: cfg.color } : {}}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="shrink-0 mt-[3px] w-2 h-2 rounded-full" style={{ background: cfg.color }} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-xs font-semibold text-slate-200 truncate">
              {p.event ?? 'Unknown Event'}
            </span>
            <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${cfg.tw.badge}`}>
              {(p.severity ?? 'Unknown').slice(0, 3)}
            </span>
          </div>

          <p className="text-xs text-slate-400 line-clamp-2 leading-snug">
            {truncate(p.areaDesc, 85) || 'No area description'}
          </p>

          {p.expires && (
            <p className="text-xs text-slate-600 mt-0.5">
              Expires {formatRelative(p.expires)}
            </p>
          )}
        </div>
      </div>
    </button>
  );
});

export default function AlertList({ alerts, selectedAlert, onAlertSelect, loading }) {
  const selectedId = selectedAlert?.id ?? selectedAlert?.properties?.id;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-500">
        <svg className="w-7 h-7 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Loading alerts…</span>
      </div>
    );
  }

  if (!alerts.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-500 px-4 text-center">
        <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-medium">No matching alerts</p>
        <p className="text-xs">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-slate-700/40">
      {alerts.map((alert) => {
        const id = alert.id ?? alert.properties?.id;
        return (
          <AlertItem
            key={id}
            alert={alert}
            isSelected={id === selectedId}
            onClick={onAlertSelect}
          />
        );
      })}
    </div>
  );
}
