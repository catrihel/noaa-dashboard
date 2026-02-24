import { SEVERITY_COLORS, SEVERITY_ORDER } from '../utils/alertColors';

export default function Legend() {
  return (
    <div className="legend">
      <div className="legend__title">Severity</div>
      {SEVERITY_ORDER.map(s => (
        <div key={s} className="legend__item">
          <span className="legend__dot" style={{ background: SEVERITY_COLORS[s] }} />
          <span className="legend__label">{s}</span>
        </div>
      ))}
    </div>
  );
}
