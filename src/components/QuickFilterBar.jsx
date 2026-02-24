import { useMemo } from 'react';

/**
 * Horizontal scrolling chip bar showing all active event types.
 * Clicking a chip toggles that type in the event-type filter.
 * The "All" chip clears the event-type filter.
 */
export default function QuickFilterBar({ alerts, filters, onFilterChange }) {
  const typeCounts = useMemo(() => {
    const counts = {};
    alerts.forEach(a => {
      const t = a.properties?.event;
      if (t) counts[t] = (counts[t] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [alerts]);

  if (!typeCounts.length) return null;

  const active = filters.eventTypes;

  const toggle = (type) =>
    onFilterChange({
      eventTypes: active.includes(type)
        ? active.filter(t => t !== type)
        : [...active, type],
    });

  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 bg-white border-b border-slate-200 shrink-0">

      {/* All chip */}
      <button
        onClick={() => onFilterChange({ eventTypes: [] })}
        className={`
          shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all
          ${active.length === 0
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
            : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'}
        `}
      >
        All
      </button>

      {/* Divider */}
      <div className="w-px h-4 bg-slate-200 shrink-0 mx-0.5" />

      {typeCounts.map(([type, count]) => {
        const on = active.includes(type);
        return (
          <button
            key={type}
            onClick={() => toggle(type)}
            className={`
              shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium
              border transition-all whitespace-nowrap
              ${on
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'}
            `}
          >
            {type}
            <span className={`
              inline-flex items-center justify-center min-w-[16px] h-[16px] px-1
              rounded-full text-[10px] font-bold tabular-nums
              ${on ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}
            `}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
