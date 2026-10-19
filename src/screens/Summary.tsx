import { useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { MonthArrows } from '../components/Common';
import { addMonths, isFuture, monthDays, monthKey, monthName, startOfMonth, toKey } from '../lib/dates';
import { colorHex, colorInk } from '../lib/palette';
import { isDone, MOODS, monthSummary, verdict } from '../lib/stats';
import { parseData, useStore } from '../store';

/** Evaluación del mes. Abre en el mes anterior (el que ya terminó) si hay hábitos desde entonces. */
export function Summary() {
  const { habits, data, setReflection } = useStore();
  const today = new Date();
  const [month, setMonth] = useState(() => {
    const thisMonth = startOfMonth(today);
    const earliest = habits.map((h) => h.createdAt).sort()[0];
    return earliest && earliest < monthKey(thisMonth) + '-01' ? addMonths(thisMonth, -1) : thisMonth;
  });

  const s = monthSummary(habits, data.checks, month, today);
  const prevMonth = addMonths(month, -1);
  const prev = monthSummary(habits, data.checks, prevMonth, today);
  const diff = s.pct - prev.pct;
  const key = monthKey(month);
  const reflection = data.reflections[key] ?? { mood: -1, note: '' };
  const days = monthDays(month);

  return (
    <main className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Resumen del mes</p>
          <h1 className="title">{monthName(month)}</h1>
        </div>
        <MonthArrows onPrev={() => setMonth((m) => addMonths(m, -1))} onNext={() => setMonth((m) => addMonths(m, 1))} />
      </header>

      <section className="score-card">
        <div className="score-top">
          <div>
            <p className="score-label">Cumplimiento total</p>
            <p className="score-pct">{s.pct}%</p>
          </div>
          <p className="score-verdict">{s.scheduled === 0 ? 'Aún sin datos' : verdict(s.pct)}</p>
        </div>
        <div className="bar light" aria-hidden="true">
          <span style={{ width: `${s.pct}%` }} />
        </div>
        <div className="grid-3">
          <div>
            <p className="mini-value">{s.perfectDays}</p>
            <p className="mini-label">días perfectos</p>
          </div>
          <div>
            <p className="mini-value">{s.checks}</p>
            <p className="mini-label">hábitos marcados</p>
          </div>
          <div>
            <p className="mini-value">{prev.scheduled === 0 ? '—' : `${diff >= 0 ? '+' : ''}${diff} pts`}</p>
            <p className="mini-label">vs. {monthName(prevMonth).toLowerCase()}</p>
          </div>
        </div>
      </section>

      <section className="stack-10">
        <h2>Por hábito</h2>
        <div className="card list-card">
          {s.perHabit.map((r) => (
            <div key={r.habit.id} className="habit-stat">
              <div className="row gap-10">
                <span className="swatch" style={{ background: colorHex(r.habit.color) }} />
                <span className="grow bold">{r.habit.name}</span>
                <span className="muted small">
                  {r.done}/{r.scheduled} {r.scheduled === 1 ? 'día' : 'días'}
                </span>
                <span className="stat-pct">{r.pct}%</span>
              </div>
              <div className="bar" aria-hidden="true">
                <span style={{ width: `${r.pct}%`, background: colorHex(r.habit.color) }} />
              </div>
              <p className="muted xsmall">Mejor racha: {r.bestStreak} {r.bestStreak === 1 ? 'día' : 'días'} seguidos</p>
            </div>
          ))}
        </div>
      </section>

      <section className="stack-10">
        <h2>Mapa del mes</h2>
        <div className="card heatmap">
          {habits.map((h) => (
            <div key={h.id} className="heat-row" role="img" aria-label={`${h.name}: días cumplidos en el mes`}>
              <span className="heat-label" style={{ background: colorHex(h.color) }} />
              <span className="heat-cells" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
                {days.map((d) => (
                  <span
                    key={d.getDate()}
                    style={!isFuture(d, today) && isDone(data.checks, h.id, d) ? { background: colorHex(h.color) } : undefined}
                  />
                ))}
              </span>
            </div>
          ))}
          <div className="heat-axis" aria-hidden="true">
            <span>1</span>
            <span>10</span>
            <span>20</span>
            <span>{days.length}</span>
          </div>
        </div>
      </section>

      {s.strongest && s.weakest && (
        <div className="grid-2">
          <div
            className="highlight"
            style={{ background: colorHex(s.strongest.habit.color), color: colorInk(s.strongest.habit.color) } as CSSProperties}
          >
            <p className="hl-label">Tu fuerte</p>
            <p className="hl-name">{s.strongest.habit.name}</p>
            <p className="small">{s.strongest.pct}% del mes</p>
          </div>
          <div className="highlight card">
            <p className="hl-label muted">A mejorar</p>
            <p className="hl-name">{s.weakest.habit.name}</p>
            <p className="small muted">{s.weakest.pct}% del mes</p>
          </div>
        </div>
      )}

      <section className="stack-10">
        <h2>¿Cómo te sentiste este mes?</h2>
        <div className="moods" role="group" aria-label="Cómo te sentiste">
          {MOODS.map((m, i) => (
            <button
              key={m}
              type="button"
              className="mood"
              aria-pressed={reflection.mood === i}
              onClick={() => setReflection(key, { mood: i })}
            >
              {m}
            </button>
          ))}
        </div>
        <label htmlFor="nota" className="field-label">
          Nota para el próximo mes
        </label>
        <textarea
          id="nota"
          rows={3}
          className="input"
          placeholder="¿Qué te ayudó? ¿Qué vas a cambiar?"
          value={reflection.note}
          onChange={(e) => setReflection(key, { note: e.target.value })}
        />
      </section>

      <Backup />
    </main>
  );
}

/** Descargar los datos en un archivo y cargarlos de nuevo (por ejemplo, en otro celular). */
function Backup() {
  const { data, replaceData } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');

  async function onExport() {
    const name = `habit-tracker-respaldo-${toKey(new Date())}.json`;
    const file = new File([JSON.stringify(data, null, 2)], name, { type: 'application/json' });
    // En el celular se abre el menú de compartir (Guardar en Archivos, enviarlo por WhatsApp…).
    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Respaldo de Habit Tracker' });
        setStatus('Respaldo listo.');
      } catch {
        /* se cerró el menú de compartir */
      }
      return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Respaldo descargado.');
  }

  async function onImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const next = parseData(await file.text());
    if (!next) {
      setStatus('Ese archivo no es un respaldo de Habit Tracker.');
      return;
    }
    if (window.confirm('¿Cargar este respaldo? Reemplaza los hábitos y marcas que tienes ahora en este dispositivo.')) {
      replaceData(next);
      setStatus(`Respaldo cargado: ${next.habits.length} hábitos.`);
    }
  }

  return (
    <section className="stack-10">
      <h2>Tus datos</h2>
      <p className="muted small">
        Se guardan solo en este dispositivo. Descarga un respaldo de vez en cuando para no perderlos.
      </p>
      <div className="grid-2">
        <button type="button" className="secondary-btn" onClick={onExport}>
          Descargar respaldo
        </button>
        <button type="button" className="secondary-btn" onClick={() => fileInput.current?.click()}>
          Cargar respaldo
        </button>
      </div>
      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onImport} />
      {status && (
        <p className="muted small" role="status">
          {status}
        </p>
      )}
    </section>
  );
}
