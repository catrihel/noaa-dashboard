import { getSeverityColor } from '../utils/alertColors';

function fmt(iso) {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleString();
}

export default function AlertDetail({ alert, onClose }) {
  if (!alert) return null;
  const color = getSeverityColor(alert.severity);

  return (
    <div className="alert-detail">
      <div className="alert-detail__header" style={{ borderLeftColor: color }}>
        <div className="alert-detail__header-text">
          <span className="alert-detail__severity" style={{ color }}>{alert.severity}</span>
          <span className="alert-detail__event">{alert.event}</span>
        </div>
        <button className="alert-detail__close" onClick={onClose}>✕</button>
      </div>

      <div className="alert-detail__body">
        {alert.headline && (
          <p className="alert-detail__headline">{alert.headline}</p>
        )}

        <div className="alert-detail__meta">
          <span><strong>Area:</strong> {alert.areaDesc || 'N/A'}</span>
          <span><strong>Urgency:</strong> {alert.urgency}</span>
          <span><strong>Certainty:</strong> {alert.certainty}</span>
          <span><strong>Onset:</strong> {fmt(alert.onset)}</span>
          <span><strong>Expires:</strong> {fmt(alert.expires)}</span>
        </div>

        {alert.description && (
          <div className="alert-detail__section">
            <div className="alert-detail__section-title">Description</div>
            <p className="alert-detail__text">{alert.description}</p>
          </div>
        )}

        {alert.instruction && (
          <div className="alert-detail__section">
            <div className="alert-detail__section-title">Instructions</div>
            <p className="alert-detail__text">{alert.instruction}</p>
          </div>
        )}
      </div>
    </div>
  );
}
