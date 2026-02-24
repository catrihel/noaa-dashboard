import { SEVERITY_LEVELS, getSeverityConfig } from '../utils/severity';
import { US_STATES } from '../utils/formatters';

export default function FilterPanel({
  filters, availableEventTypes,
  onFilterChange, onClearFilters,
  filteredCount, totalCount,
}) {
  const hasFilters =
    filters.severities.length > 0 || filters.eventTypes.length > 0 ||
    filters.state !== '' || filters.keyword !== '';

  const toggleSeverity  = (lvl)  =>
    onFilterChange({ severities: filters.severities.includes(lvl)
      ? filters.severities.filter(s => s !== lvl)
      : [...filters.severities, lvl] });

  const toggleEventType = (type) =>
    onFilterChange({ eventTypes: filters.eventTypes.includes(type)
      ? filters.eventTypes.filter(t => t !== type)
      : [...filters.eventTypes, type] });

  return (
    <div className="p-3 space-y-3 border-b border-slate-700">

      {/* Count + clear */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          <span className="font-semibold text-slate-200">{filteredCount}</span>
          {' '}of{' '}
          <span className="font-semibold text-slate-200">{totalCount}</span>
          {' '}alerts shown
        </span>
        {hasFilters && (
          <button onClick={onClearFilters}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Clear all
          </button>
        )}
      </div>

      {/* Keyword search */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Search</label>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Keyword, area, headline…"
            value={filters.keyword}
            onChange={e => onFilterChange({ keyword: e.target.value })}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {filters.keyword && (
            <button onClick={() => onFilterChange({ keyword: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* State */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">State / Territory</label>
        <select
          value={filters.state}
          onChange={e => onFilterChange({ state: e.target.value })}
          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
        >
          <option value="">All states</option>
          {US_STATES.map(({ code, name }) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      {/* Severity chips */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Severity</label>
        <div className="flex flex-wrap gap-1.5">
          {SEVERITY_LEVELS.map(level => {
            const cfg    = getSeverityConfig(level);
            const active = filters.severities.includes(level);
            return (
              <button key={level} onClick={() => toggleSeverity(level)}
                className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all
                  ${active
                    ? `${cfg.tw.badge} ${cfg.tw.border}`
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}
                `}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Event types */}
      {availableEventTypes.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">
            Event Type
            {filters.eventTypes.length > 0 && (
              <span className="ml-1.5 text-blue-400 normal-case">({filters.eventTypes.length} selected)</span>
            )}
          </label>
          <div className="max-h-40 overflow-y-auto space-y-0.5 pr-0.5">
            {availableEventTypes.map(type => {
              const active = filters.eventTypes.includes(type);
              return (
                <button key={type} onClick={() => toggleEventType(type)}
                  className={`
                    w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center gap-2
                    ${active
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}
                  `}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-blue-400' : 'bg-slate-600'}`} />
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
