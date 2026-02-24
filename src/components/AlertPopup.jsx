import { getSeverityConfig } from '../utils/severity';
import { formatDate, formatRelative, isExpired } from '../utils/formatters';

export default function AlertPopup({ alert, onClose }) {
  if (!alert) return null;

  const p   = alert.properties ?? {};
  const cfg = getSeverityConfig(p.severity);
  const expired = isExpired(p.expires);

  return (
    <div className="animate-slide-in-right absolute top-0 right-0 h-full w-full sm:w-[420px] z-[1000] flex flex-col bg-slate-800 border-l border-slate-700 shadow-2xl overflow-hidden">

      {/* ── Band header ─────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-start justify-between gap-3 shrink-0"
        style={{ borderBottom: `3px solid ${cfg.color}` }}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${cfg.tw.badge}`}>
              {p.severity ?? 'Unknown'}
            </span>
            {expired && (
              <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-slate-600 text-slate-300">
                Expired
              </span>
            )}
          </div>
          <h2 className="mt-1.5 text-sm font-semibold text-slate-100 leading-snug">
            {p.event ?? 'Unknown Event'}
          </h2>
        </div>

        <button onClick={onClose}
          className="shrink-0 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          aria-label="Close">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">

        {p.headline && (
          <p className="text-slate-300 font-medium leading-snug">{p.headline}</p>
        )}

        {/* Timing */}
        <div className="grid grid-cols-2 gap-2">
          <Meta label="Effective" value={formatDate(p.effective)} sub={formatRelative(p.effective)} />
          <Meta label="Expires"   value={formatDate(p.expires)}
            sub={formatRelative(p.expires)} subClass={expired ? 'text-red-400' : 'text-slate-400'} />
          {p.onset && <Meta label="Onset" value={formatDate(p.onset)} sub={formatRelative(p.onset)} />}
          {p.ends  && <Meta label="Ends"  value={formatDate(p.ends)}  sub={formatRelative(p.ends)}  />}
        </div>

        {/* Properties */}
        <div className="grid grid-cols-2 gap-2">
          <Meta label="Severity"  value={p.severity  ?? 'N/A'} valueClass={cfg.tw.text} />
          <Meta label="Certainty" value={p.certainty ?? 'N/A'} />
          <Meta label="Urgency"   value={p.urgency   ?? 'N/A'} />
          <Meta label="Status"    value={p.status    ?? 'N/A'} />
        </div>

        {p.areaDesc && (
          <Section title="Affected Areas">
            <p className="text-slate-300 leading-relaxed">{p.areaDesc}</p>
          </Section>
        )}

        {p.description && (
          <Section title="Description">
            <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300 leading-relaxed">
              {p.description}
            </pre>
          </Section>
        )}

        {p.instruction && (
          <Section title="Instructions">
            <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300 leading-relaxed">
              {p.instruction}
            </pre>
          </Section>
        )}

        {p.senderName && (
          <Section title="Issuing Office">
            <p className="text-slate-300">{p.senderName}</p>
          </Section>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-slate-700 shrink-0 flex items-center justify-between">
        <a href={p['@id'] ?? '#'} target="_blank" rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors">
          View on weather.gov ↗
        </a>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

function Meta({ label, value, sub, valueClass, subClass }) {
  return (
    <div className="bg-slate-900/60 rounded p-2.5">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-xs font-medium ${valueClass ?? 'text-slate-200'}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${subClass ?? 'text-slate-400'}`}>{sub}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{title}</h3>
      {children}
    </div>
  );
}
