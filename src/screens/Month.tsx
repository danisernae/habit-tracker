import { useState } from 'react';
import { MonthArrows, StatTile } from '../components/Common';
import { addMonths, isFuture, leadingBlanks, longDate, monthDays, monthName, sameDay, startOfMonth, toKey, WEEK_LETTERS } from '../lib/dates';
import { COLOR_KEYS, colorHex, colorInk } from '../lib/palette';
import { currentStreak, isDone, isScheduled, monthSummary } from '../lib/stats';
import { useStore } from '../store';

const ALL_GRADIENT = `conic-gradient(${COLOR_KEYS.map((c, i) => `${colorHex(c)} ${i * 20}% ${(i + 1) * 20}%`).join(',')})`;

export function Month() {
  const { habits, data } = useStore();
  const today = new Date();
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [filter, setFilter] = useState<string | null>(null);
  const selected = habits.find((h) => h.id === filter) ?? null;

  const summary = monthSummary(selected ? [selected] : habits, data.checks, month, today);
  let stats: [string, string, string, string];
  if (selected) {
    const row = summary.perHabit[0];
    stats = [
      `${row.done}/${row.scheduled}`,
      'días cumplidos',
      `${currentStreak(selected, data.checks, today)} días`,
      `racha actual · mejor ${row.bestStreak}`,
    ];
  } else {
    stats = [
      `${summary.pct}%`,
      `de cumplimiento en ${monthName(month).toLowerCase()}`,
      String(summary.perfectDays),
      summary.perfectDays === 1 ? 'día perfecto' : 'días perfectos',
    ];
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Tu calendario</p>
          <h1 className="title">{monthName(month)}</h1>
        </div>
        <MonthArrows onPrev={() => setMonth((m) => addMonths(m, -1))} onNext={() => setMonth((m) => addMonths(m, 1))} />
      </header>

      <div className="chips" role="group" aria-label="Filtrar por hábito">
        <button type="button" className="chip" aria-pressed={filter === null} onClick={() => setFilter(null)}>
          <span className="chip-dot" style={{ background: ALL_GRADIENT }} />
          Todos
        </button>
        {habits.map((h) => (
          <button key={h.id} type="button" className="chip" aria-pressed={filter === h.id} onClick={() => setFilter(h.id)}>
            <span className="chip-dot" style={{ background: colorHex(h.color) }} />
            {h.name}
          </button>
        ))}
      </div>

      <section className="card calendar" aria-label={`Calendario de ${monthName(month)}`}>
        <div className="cal-grid cal-head" aria-hidden="true">
          {WEEK_LETTERS.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
        <div className="cal-grid">
          {Array.from({ length: leadingBlanks(month) }, (_, i) => (
            <span key={`b${i}`} />
          ))}
          {monthDays(month).map((day) => {
            const future = isFuture(day, today);
            const isToday = sameDay(day, today);
            const selDone = selected ? isDone(data.checks, selected.id, day) : false;
            const cls = ['cal-day', future ? 'future' : '', isToday ? 'today' : ''].join(' ');
            const style =
              selected && selDone && !future
                ? { background: colorHex(selected.color), color: colorInk(selected.color) }
                : selected && !future
                  ? { color: 'var(--muted)' }
                  : undefined;
            const content = (
              <>
                <span className="cal-num">{day.getDate()}</span>
                {!future && !selected && (
                  <span className="cal-dots" aria-hidden="true">
                    {habits
                      .filter((h) => isScheduled(h, day))
                      .map((h) => (
                        <span
                          key={h.id}
                          className="dot"
                          style={isDone(data.checks, h.id, day) ? { background: colorHex(h.color) } : undefined}
                        />
                      ))}
                  </span>
                )}
              </>
            );
            return future ? (
              <div key={day.getDate()} className={cls} style={style}>
                {content}
              </div>
            ) : (
              <a
                key={day.getDate()}
                href={isToday ? '#/hoy' : `#/hoy/${toKey(day)}`}
                className={cls}
                style={style}
                aria-label={`Marcar ${longDate(day)}`}
              >
                {content}
              </a>
            );
          })}
        </div>
      </section>

      <div className="grid-2">
        <StatTile value={stats[0]} label={stats[1]} />
        <StatTile value={stats[2]} label={stats[3]} />
      </div>
    </main>
  );
}
