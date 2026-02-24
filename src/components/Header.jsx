import { formatCountdown, pluralise } from '../utils/formatters';

export default function Header({
  totalCount, filteredCount, isFiltered,
  lastUpdated, countdown,
  loading, error,
  onRefresh, sidebarOpen, onToggleSidebar,
}) {
  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700 shrink-0 z-10 gap-2">

      {/* Left: sidebar toggle + branding */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors shrink-0"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={sidebarOpen
                ? 'M4 6h16M4 12h10M4 18h16'
                : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0 w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-slate-100 leading-none truncate">NOAA Weather Dashboard</h1>
            <p className="text-xs text-slate-500 leading-none mt-0.5 hidden sm:block">Real-time NWS Alerts</p>
          </div>
        </div>
      </div>

      {/* Center: live indicator + alert count */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5">
          {error ? (
            <><span className="w-2 h-2 rounded-full bg-red-500 shrink-0" /><span className="text-xs text-red-400">Error</span></>
          ) : loading ? (
            <><span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shrink-0" /><span className="text-xs text-slate-400">Loading…</span></>
          ) : (
            <><span className="w-2 h-2 rounded-full bg-green-500 pulse-live shrink-0" /><span className="text-xs text-slate-400">Live</span></>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 rounded-full">
          <svg className="w-3.5 h-3.5 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
          </svg>
          <span className="text-xs font-medium text-slate-200">
            {loading ? '…' : (
              <>
                {pluralise(isFiltered ? filteredCount : totalCount, 'alert')}
                {isFiltered && !loading && (
                  <span className="text-slate-500 ml-1">/ {totalCount}</span>
                )}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Right: timestamps + refresh */}
      <div className="flex items-center gap-2 min-w-0">
        {lastUpdated && (
          <div className="hidden md:flex flex-col items-end leading-none gap-0.5">
            <span className="text-xs text-slate-500">Updated {lastUpdated.toLocaleTimeString()}</span>
            <span className="text-xs text-slate-600">Refresh in {formatCountdown(countdown)}</span>
          </div>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Refresh now"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </header>
  );
}
