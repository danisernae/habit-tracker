import { useState, type FormEvent } from 'react';
import { Icon } from '../components/Icon';
import { toKey, WEEK_LETTERS, WEEK_NAMES, WEEK_TO_GETDAY } from '../lib/dates';
import { COLOR_KEYS, colorHex, colorInk, HABIT_COLORS, ICON_KEYS, ICON_LABELS, type HabitColor, type HabitIcon } from '../lib/palette';
import type { Habit } from '../lib/types';
import { newId, useStore } from '../store';

/** Crear o editar un hábito, con vista previa en vivo. */
export function HabitForm({ habitId }: { habitId?: string }) {
  const { habits, saveHabit, deleteHabit } = useStore();
  const editing = habits.find((h) => h.id === habitId);

  const [name, setName] = useState(editing?.name ?? '');
  const [detail, setDetail] = useState(editing?.detail ?? '');
  const [color, setColor] = useState<HabitColor>(editing?.color ?? 'lila');
  const [icon, setIcon] = useState<HabitIcon>(editing?.icon ?? 'lectura');
  const todayKey = toKey(new Date());
  const [start, setStart] = useState(editing?.createdAt ?? todayKey);
  const [days, setDays] = useState<boolean[]>(() =>
    WEEK_TO_GETDAY.map((d) => (editing ? editing.weekdays.includes(d) : true)),
  );

  const active = days.filter(Boolean).length;
  const freq = active === 7 ? 'Todos los días' : active === 0 ? 'Elige al menos un día' : `${active} días por semana`;
  const canSave = name.trim().length > 0 && active > 0;

  function goBack() {
    window.location.hash = '#/hoy';
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    const habit: Habit = {
      id: editing?.id ?? newId(),
      name: name.trim(),
      detail: detail.trim(),
      color,
      icon,
      weekdays: WEEK_TO_GETDAY.filter((_, i) => days[i]),
      createdAt: start && start <= todayKey ? start : todayKey,
      order: editing?.order ?? Math.max(-1, ...habits.map((h) => h.order)) + 1,
    };
    saveHabit(habit);
    goBack();
  }

  function onDelete() {
    if (editing && window.confirm(`¿Eliminar "${editing.name}" y todo su historial?`)) {
      deleteHabit(editing.id);
      goBack();
    }
  }

  return (
    <main className="screen form-screen">
      <header className="row gap-12">
        <a href="#/hoy" className="round-btn" aria-label="Volver">
          <Icon name="left" size={18} strokeWidth={2.4} />
        </a>
        <h1 className="title small-title">{editing ? 'Editar hábito' : 'Nuevo hábito'}</h1>
      </header>

      <div className="preview" style={{ background: colorHex(color), color: colorInk(color) }} aria-hidden="true">
        <span className="preview-icon">
          <Icon name={icon} size={24} />
        </span>
        <span className="habit-text">
          <span className="habit-name">{name.trim() || 'Tu nuevo hábito'}</span>
          <span className="habit-meta">{detail.trim() ? `${detail.trim()} · ${freq}` : freq}</span>
        </span>
        <span className="preview-check" />
      </div>

      <form className="stack-18" onSubmit={onSubmit}>
        <div className="stack-8">
          <label htmlFor="nombre" className="field-label">
            Nombre
          </label>
          <input id="nombre" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Leer 10 páginas" />
        </div>

        <div className="stack-8">
          <label htmlFor="detalle" className="field-label">
            Detalle <span className="muted">(opcional)</span>
          </label>
          <input id="detalle" className="input" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Ej: 8 vasos, 30 min" />
        </div>

        <fieldset className="stack-8">
          <legend className="field-label">Color</legend>
          <div className="row gap-10">
            {COLOR_KEYS.map((c) => (
              <button
                key={c}
                type="button"
                className="swatch-btn"
                style={{ background: colorHex(c) }}
                aria-label={HABIT_COLORS[c].label}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="stack-8">
          <legend className="field-label">Ícono</legend>
          <div className="icon-grid">
            {ICON_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                className="icon-btn"
                aria-label={ICON_LABELS[k]}
                aria-pressed={icon === k}
                style={icon === k ? { background: colorHex(color), color: colorInk(color) } : undefined}
                onClick={() => setIcon(k)}
              >
                <Icon name={k} />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="stack-8">
          <legend className="field-label">¿Qué días?</legend>
          <div className="day-grid">
            {WEEK_LETTERS.map((l, i) => (
              <button
                key={i}
                type="button"
                className="day-btn"
                aria-label={WEEK_NAMES[i]}
                aria-pressed={days[i]}
                onClick={() => setDays((d) => d.map((v, j) => (j === i ? !v : v)))}
              >
                {l}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="stack-8">
          <label htmlFor="inicio" className="field-label">
            ¿Desde cuándo?
          </label>
          <input
            id="inicio"
            type="date"
            className="input"
            value={start}
            max={todayKey}
            onChange={(e) => setStart(e.target.value)}
          />
          <p className="muted xsmall">Los días antes de esta fecha no cuentan en tu porcentaje.</p>
        </div>

        <button type="submit" className="primary-btn" disabled={!canSave}>
          Guardar hábito
        </button>
        {editing && (
          <button type="button" className="danger-btn" onClick={onDelete}>
            Eliminar hábito
          </button>
        )}
      </form>
    </main>
  );
}
