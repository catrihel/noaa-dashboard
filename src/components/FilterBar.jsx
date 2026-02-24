import { SEVERITY_ORDER } from '../utils/alertColors';

export default function FilterBar({
  allEventTypes,
  selectedEvents,
  setSelectedEvents,
  selectedSeverity,
  setSelectedSeverity,
}) {
  function toggleEvent(eventType) {
    setSelectedEvents(prev =>
      prev.includes(eventType)
        ? prev.filter(e => e !== eventType)
        : [...prev, eventType]
    );
  }

  return (
    <div className="filter-bar">
      <div className="filter-bar__group">
        <label className="filter-bar__label">Event type:</label>
        <div className="filter-bar__select-wrap">
          <select
            className="filter-bar__select"
            multiple
            size={1}
            value={selectedEvents}
            onChange={e => {
              const vals = Array.from(e.target.selectedOptions, o => o.value);
              setSelectedEvents(vals);
            }}
          >
            {allEventTypes.map(et => (
              <option key={et} value={et}>{et}</option>
            ))}
          </select>
          {selectedEvents.length > 0 && (
            <button
              className="filter-bar__clear"
              onClick={() => setSelectedEvents([])}
            >
              ✕ Clear
            </button>
          )}
        </div>
        {selectedEvents.length > 0 && (
          <div className="filter-bar__tags">
            {selectedEvents.map(e => (
              <span key={e} className="filter-tag" onClick={() => toggleEvent(e)}>
                {e} ✕
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="filter-bar__group">
        <label className="filter-bar__label">Severity:</label>
        <div className="filter-bar__buttons">
          {['All', ...SEVERITY_ORDER].map(s => (
            <button
              key={s}
              className={`filter-btn${selectedSeverity === s ? ' filter-btn--active' : ''}`}
              onClick={() => setSelectedSeverity(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
