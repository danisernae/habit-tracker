import { Icon } from './Icon';

/** `label` reemplaza el texto del centro (por defecto, el %). El anillo se llena hasta 100. */
export function ProgressRing({ pct, size = 76, stroke = 9, label }: { pct: number; size?: number; stroke?: number; label?: string }) {
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
          strokeDasharray={`${(circ * Math.min(pct, 100)) / 100} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-label">{label ?? `${pct}%`}</span>
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

export type Route = 'hoy' | 'mes' | 'resumen' | 'nutricion';

export function BottomNav({ current }: { current: Route }) {
  const items: Array<{ route: Route; label: string; icon: 'sun' | 'calendar' | 'chart' | 'plate' }> = [
    { route: 'hoy', label: 'Hoy', icon: 'sun' },
    { route: 'mes', label: 'Mes', icon: 'calendar' },
    { route: 'resumen', label: 'Resumen', icon: 'chart' },
    { route: 'nutricion', label: 'Nutrición', icon: 'plate' },
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

/** Pestañas de Nutrición: el día (porciones) y el seguimiento (peso, IMC, % grasa). */
export function NutritionTabs({ current }: { current: 'dia' | 'seguimiento' }) {
  return (
    <nav className="tabs" aria-label="Nutrición">
      <a href="#/nutricion" aria-current={current === 'dia' ? 'page' : undefined}>
        Día
      </a>
      <a href="#/seguimiento" aria-current={current === 'seguimiento' ? 'page' : undefined}>
        Seguimiento
      </a>
    </nav>
  );
}
