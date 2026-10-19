import type { CSSProperties } from 'react';
import { Icon } from '../components/Icon';
import { ProgressRing } from '../components/Common';
import { longDate, sameDay, isFuture, weekDays, WEEK_LETTERS } from '../lib/dates';
import { colorHex, colorInk } from '../lib/palette';
import { currentStreak, dayMessage, isDone, isScheduled } from '../lib/stats';
import type { Habit } from '../lib/types';
import { useStore } from '../store';

export function Today() {
  const { habits, data, toggleCheck } = useStore();
  const today = new Date();
  const todays = habits.filter((h) => isScheduled(h, today));
  const done = todays.filter((h) => isDone(data.checks, h.id, today)).length;
  const pct = todays.length ? Math.round((done / todays.length) * 100) : 0;

  return (
    <main className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{longDate(today)}</p>
          <h1 className="title">Hoy</h1>
        </div>
        <a href="#/nuevo" className="round-btn dark" aria-label="Nuevo hábito">
          <Icon name="plus" size={20} strokeWidth={2.4} />
        </a>
      </header>

      <section className="card progress-card" aria-label={`Progreso de hoy: ${pct}%`}>
        <ProgressRing pct={pct} />
        <div>
          <p className="progress-msg">{dayMessage(done, todays.length)}</p>
          <p className="muted">
            {done} de {todays.length} hábitos cumplidos
          </p>
        </div>
      </section>

      <WeekStrip habits={habits} today={today} />

      <div className="section-head">
        <h2>Mis hábitos</h2>
        <span className="muted small">Toca para marcar</span>
      </div>

      {todays.length === 0 ? (
        <p className="empty">
          Hoy no tienes hábitos programados. <a href="#/nuevo">Crea uno</a>.
        </p>
      ) : (
        <ul className="habit-list">
          {todays.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              done={isDone(data.checks, h.id, today)}
              streak={currentStreak(h, data.checks, today)}
              onToggle={() => toggleCheck(h.id, today)}
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

function WeekStrip({ habits, today }: { habits: Habit[]; today: Date }) {
  const { data } = useStore();
  return (
    <div className="week-strip">
      {weekDays(today).map((day, i) => {
        const isToday = sameDay(day, today);
        const future = isFuture(day, today);
        return (
          <div key={i} className={`week-day${isToday ? ' today' : ''}`}>
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
          </div>
        );
      })}
    </div>
  );
}
