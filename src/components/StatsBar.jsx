import { SEVERITY_COLORS, SEVERITY_ORDER } from '../utils/alertColors';

function formatTime(date) {
  if (!date) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function countBySeverity(alerts) {
  const counts = {};
  for (const a of alerts) {
    counts[a.severity] = (counts[a.severity] ?? 0) + 1;
  }
  return counts;
}

export default function StatsBar({ alerts, loading, lastUpdated }) {
  const counts = countBySeverity(alerts);

  return (
    <div className="stats-bar">
      <div className="stats-bar__title">NOAA Live Weather Alerts</div>

      <div className="stats-bar__chips">
        <span className="stats-chip stats-chip--total">{alerts.length} active</span>
        {SEVERITY_ORDER.filter(s => counts[s]).map(s => (
          <span
            key={s}
            className="stats-chip"
            style={{ background: SEVERITY_COLORS[s] ?? '#757575' }}
          >
            {counts[s]} {s}
          </span>
        ))}
      </div>

      <div className="stats-bar__refresh">
        {loading && <span className="spinner" title="Refreshing…" />}
        <span className="stats-bar__time">
          Updated: {formatTime(lastUpdated)}
        </span>
      </div>
    </div>
  );
}
