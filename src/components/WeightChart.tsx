import { useState, type PointerEvent } from 'react';
import { fromKey, shortDate } from '../lib/dates';
import { fmtNum } from '../lib/foods';

interface Point {
  date: string;
  day: number;
  kg: number;
}

const W = 340;
const H = 180;
const PAD = { top: 16, right: 14, bottom: 26, left: 34 };

const label = (key: string) => shortDate(fromKey(key)).replace(/ de \d{4}$/, '');

/** Peso vs. fecha. Una sola serie: sin leyenda, el título la nombra. Tocar o pasar el dedo muestra cada registro. */
export function WeightChart({ points }: { points: Point[] }) {
  const [active, setActive] = useState<number | null>(null);
  if (points.length === 0) return null;

  const kgs = points.map((p) => p.kg);
  const lo = Math.floor(Math.min(...kgs) - 0.5);
  const hi = Math.ceil(Math.max(...kgs) + 0.5);
  const lastDay = Math.max(points[points.length - 1].day, 1);
  const x = (day: number) => PAD.left + (points.length === 1 ? (W - PAD.left - PAD.right) / 2 : (day / lastDay) * (W - PAD.left - PAD.right));
  const y = (kg: number) => PAD.top + ((hi - kg) / (hi - lo)) * (H - PAD.top - PAD.bottom);
  const step = Math.max(1, Math.ceil((hi - lo) / 4));
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v += step) ticks.push(v);

  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.kg).toFixed(1)}`).join('');
  const shown = active ?? points.length - 1;
  const sp = points[shown];

  function onPointer(e: PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(x(p.day) - px) < Math.abs(x(points[best].day) - px)) best = i;
    });
    setActive(best);
  }

  const first = points[0];
  const last = points[points.length - 1];
  const summary = `Peso de ${fmtNum(first.kg)} kg el ${label(first.date)} a ${fmtNum(last.kg)} kg el ${label(last.date)}, ${points.length} registros.`;

  return (
    <figure className="card chart-card">
      <figcaption className="chart-head">
        <span className="bold">Peso (kg)</span>
        <span className="muted small" aria-live="polite">
          {label(sp.date)} · <span className="chart-value">{fmtNum(sp.kg)} kg</span>
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        role="img"
        aria-label={summary}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={() => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={PAD.left - 6} y={y(t)} className="chart-axis" textAnchor="end" dominantBaseline="middle">
              {t}
            </text>
          </g>
        ))}
        <text x={x(first.day)} y={H - 6} className="chart-axis" textAnchor={points.length === 1 ? 'middle' : 'start'}>
          {label(first.date)}
        </text>
        {points.length > 1 && (
          <text x={x(last.day)} y={H - 6} className="chart-axis" textAnchor="end">
            {label(last.date)}
          </text>
        )}
        {active !== null && <line x1={x(sp.day)} x2={x(sp.day)} y1={PAD.top} y2={H - PAD.bottom} className="chart-hair" />}
        <path d={path} className="chart-line" />
        {points.map((p, i) => (
          <circle key={p.date} cx={x(p.day)} cy={y(p.kg)} r={i === shown ? 5 : 4} className="chart-dot" />
        ))}
      </svg>
    </figure>
  );
}
