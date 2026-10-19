import type { CSSProperties } from 'react';
import { Icon } from '../components/Icon';
import { ProgressRing } from '../components/Common';
import { dayTitle, isFuture, longDate, parseKey, sameDay, toKey, weekDays, WEEK_LETTERS, WEEK_NAMES } from '../lib/dates';
import { colorHex, colorInk } from '../lib/palette';
import { currentStreak, dayMessage, habitsForDay, isDone, isScheduled } from '../lib/stats';
import type { Habit } from '../lib/types';
import { useStore } from '../store';

/** Marcar los hábitos de un día: hoy (#/hoy) o un día pasado (#/hoy/AAAA-MM-DD). */
export function Today({ dayKey }: { dayKey?: string }) {
  const { habits, data, toggleCheck } = useStore();
  const today = new Date();
  const parsed = parseKey(dayKey);
  const day = parsed && !isFuture(parsed, today) ? parsed : today;
  const isToday = sameDay(day, today);
  const todays = habitsForDay(habits, day);
  const done = todays.filter((h) => isDone(data.checks, h.id, day)).length;
  const pct = todays.length ? Math.round((done / todays.length) * 100) : 0;

  return (
    <main className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{longDate(day)}</p>
          <h1 className="title">{dayTitle(day, today)}</h1>
        </div>
        <a href="#/nuevo" className="round-btn dark" aria-label="Nuevo hábito">
          <Icon name="plus" size={20} strokeWidth={2.4} />
        </a>
      </header>

      <section className="card progress-card" aria-label={`Progreso del día: ${pct}%`}>
        <ProgressRing pct={pct} />
        <div>
          <p className="progress-msg">{dayMessage(done, todays.length)}</p>
          <p className="muted">
            {done} de {todays.length} hábitos cumplidos
          </p>
        </div>
      </section>

      <WeekStrip habits={habits} day={day} today={today} />

      <div className="section-head">
        <h2>Mis hábitos</h2>
        {isToday ? (
          <span className="muted small">Toca para marcar</span>
        ) : (
          <a href="#/hoy" className="small link">
            Volver a hoy
          </a>
        )}
      </div>

      {todays.length === 0 ? (
        <p className="empty">
          {isToday ? 'Hoy no tienes hábitos programados.' : `No tienes hábitos programados los ${WEEK_NAMES[(day.getDay() + 6) % 7].toLowerCase()}.`}{' '}
          <a href="#/nuevo">Crea uno</a>.
        </p>
      ) : (
        <ul className="habit-list">
          {todays.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              done={isDone(data.checks, h.id, day)}
              streak={currentStreak(h, data.checks, today)}
              onToggle={() => toggleCheck(h.id, day)}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

function HabitRow({ habit, done, streak, onToggle }: { habit: Habit; done: boolean; streak: number; onToggle: () => void }) {
  const style = { '--c': colorHex(habit.color), '--fg': colorInk(habit.color) } as CSSProperties;
  const light = colorInk(habit.color) === '#FFFFFF';
  return (
    <li className={`habit-card${done ? ' done' : ''}${light ? ' light' : ''}`} style={style}>
      <a href={`#/editar/${habit.id}`} className="habit-main" aria-label={`Editar ${habit.name}`}>
        <span className="habit-icon">
          <Icon name={habit.icon} />
        </span>
        <span className="habit-text">
          <span className="habit-name">{habit.name}</span>
          <span className="habit-meta">
            {habit.detail ? `${habit.detail} · ` : ''}racha {streak} {streak === 1 ? 'día' : 'días'}
          </span>
        </span>
      </a>
      <button
        type="button"
        className="check-btn"
        aria-pressed={done}
        aria-label={done ? `Desmarcar ${habit.name}` : `Marcar ${habit.name}`}
        onClick={onToggle}
      >
        <Icon name="check" size={20} strokeWidth={3} />
      </button>
    </li>
  );
}

/** La semana del día elegido. Cada día pasado es un enlace para marcarlo; el elegido va en oscuro. */
function WeekStrip({ habits, day: selectedDay, today }: { habits: Habit[]; day: Date; today: Date }) {
  const { data } = useStore();
  return (
    <div className="week-strip">
      {weekDays(selectedDay).map((day, i) => {
        const selected = sameDay(day, selectedDay);
        const isToday = sameDay(day, today);
        const future = isFuture(day, today);
        const cls = `week-day${selected ? ' selected' : ''}${isToday ? ' today' : ''}${future ? ' future' : ''}`;
        const content = (
          <>
            <span className="week-letter">{WEEK_LETTERS[i]}</span>
            <span className="week-num">{day.getDate()}</span>
            <span className="week-dots" aria-hidden="true">
              {habits
                .filter((h) => isScheduled(h, day))
                .map((h) => (
                  <span
                    key={h.id}
                    className="dot"
                    style={!future && isDone(data.checks, h.id, day) ? { background: colorHex(h.color) } : undefined}
                  />
                ))}
            </span>
          </>
        );
        return future ? (
          <div key={i} className={cls}>
            {content}
          </div>
        ) : (
          <a
            key={i}
            href={isToday ? '#/hoy' : `#/hoy/${toKey(day)}`}
            className={cls}
            aria-label={`${WEEK_NAMES[i]} ${day.getDate()}`}
            aria-current={selected ? 'date' : undefined}
          >
            {content}
          </a>
        );
      })}
    </div>
  );
}
