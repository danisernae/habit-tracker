import { Icon } from './Icon';

export function ProgressRing({ pct, size = 76, stroke = 9 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(circ * pct) / 100} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-label">{pct}%</span>
    </div>
  );
}

export function MonthArrows({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="row gap-6">
      <button type="button" className="round-btn" aria-label="Mes anterior" onClick={onPrev}>
        <Icon name="left" size={18} strokeWidth={2.4} />
      </button>
      <button type="button" className="round-btn" aria-label="Mes siguiente" onClick={onNext}>
        <Icon name="right" size={18} strokeWidth={2.4} />
      </button>
    </div>
  );
}

export function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="card stat-tile">
      <div className="stat-value">{value}</div>
      <div className="muted small">{label}</div>
    </div>
  );
}

export type Route = 'hoy' | 'mes' | 'resumen';

export function BottomNav({ current }: { current: Route }) {
  const items: Array<{ route: Route; label: string; icon: 'sun' | 'calendar' | 'chart' }> = [
    { route: 'hoy', label: 'Hoy', icon: 'sun' },
    { route: 'mes', label: 'Mes', icon: 'calendar' },
    { route: 'resumen', label: 'Resumen', icon: 'chart' },
  ];
  return (
    <nav className="bottom-nav" aria-label="Navegación">
      {items.map((it) => (
        <a
          key={it.route}
          href={`#/${it.route}`}
          className={current === it.route ? 'active' : ''}
          aria-current={current === it.route ? 'page' : undefined}
        >
          <Icon name={it.icon} size={24} />
          {it.label}
        </a>
      ))}
    </nav>
  );
}
