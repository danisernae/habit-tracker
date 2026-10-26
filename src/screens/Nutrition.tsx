import { useRef, useState, type CSSProperties } from 'react';
import { Icon } from '../components/Icon';
import { NutritionTabs, ProgressRing } from '../components/Common';
import { addDays, dayTitle, isFuture, longDate, parseKey, sameDay, toKey } from '../lib/dates';
import { FOOD_GROUPS, GROUPS, KCAL_GOAL, MEAL_LABELS, MEALS, mealForHour, unitLabel, type FoodGroup, type Meal } from '../lib/foods';
import { INK } from '../lib/palette';
import { countByGroup, dayNutrition, mealTarget, nutritionMessage } from '../lib/stats';
import type { FoodEntry } from '../lib/types';
import { useNutrition } from '../nutrition';

const groupStyle = (g: FoodGroup) =>
  ({ '--c': GROUPS[g].hex, '--fg': GROUPS[g].lightText ? '#FFFFFF' : INK }) as CSSProperties;

const kcalText = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

/** Lo que se come en un día: hoy (#/nutricion) o un día pasado (#/nutricion/AAAA-MM-DD). */
export function Nutrition({ dayKey }: { dayKey?: string }) {
  const { nutrition, addFood, removeFood } = useNutrition();
  const today = new Date();
  const parsed = parseKey(dayKey);
  const day = parsed && !isFuture(parsed, today) ? parsed : today;
  const key = toKey(day);
  const isToday = sameDay(day, today);
  const entries = nutrition.days[key] ?? [];
  const totals = dayNutrition(entries);
  const [meal, setMeal] = useState<Meal>(() => (isToday ? mealForHour(today.getHours()) : 'desayuno'));
  const mealCount = countByGroup(entries, meal);
  const [picking, setPicking] = useState<FoodGroup | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const left = KCAL_GOAL - totals.kcal;

  const dayHref = (d: Date) => (sameDay(d, today) ? '#/nutricion' : `#/nutricion/${toKey(d)}`);

  function openPicker(g: FoodGroup) {
    if (g === 'agua') {
      addFood(key, g, GROUPS.agua.equivalents[0], meal);
      return;
    }
    setPicking(g);
    dialog.current?.showModal();
  }

  function pick(food: string) {
    if (picking) addFood(key, picking, food, meal);
    dialog.current?.close();
  }

  function removeLastWater() {
    const last = [...entries].reverse().find((e) => e.group === 'agua');
    if (last) removeFood(key, last.id);
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{longDate(day)}</p>
          <h1 className="title">{isToday ? 'Nutrición' : dayTitle(day, today)}</h1>
        </div>
        <div className="row gap-6">
          <a href={dayHref(addDays(day, -1))} className="round-btn" aria-label="Día anterior">
            <Icon name="left" size={18} strokeWidth={2.4} />
          </a>
          {isToday ? (
            <span className="round-btn disabled" aria-hidden="true">
              <Icon name="right" size={18} strokeWidth={2.4} />
            </span>
          ) : (
            <a href={dayHref(addDays(day, 1))} className="round-btn" aria-label="Día siguiente">
              <Icon name="right" size={18} strokeWidth={2.4} />
            </a>
          )}
        </div>
      </header>

      <NutritionTabs current="dia" />

      <section className="card progress-card" aria-label={`Calorías del día: ${totals.kcal} de ${KCAL_GOAL}`}>
        <ProgressRing pct={totals.kcalPct} label={String(totals.kcal)} />
        <div>
          <p className="progress-msg">{nutritionMessage(totals.kcal)}</p>
          <p className="muted">
            {totals.kcal} de {KCAL_GOAL} kcal · {left >= 0 ? `te quedan ${left}` : `${-left} de más`}
          </p>
          <p className="muted small">
            Proteína {totals.protein} g · Grasa {totals.fat} g
          </p>
        </div>
      </section>

      <fieldset className="stack-8">
        <legend className="field-label">¿En qué comida?</legend>
        <div className="chips">
          {MEALS.map((m) => (
            <button key={m} type="button" className="chip" aria-pressed={meal === m} onClick={() => setMeal(m)}>
              {MEAL_LABELS[m]}
            </button>
          ))}
        </div>
      </fieldset>

      <ul className="food-list">
        {FOOD_GROUPS.map((g) => {
          const info = GROUPS[g];
          const n = totals.count[g];
          const planned = mealTarget(meal, g);
          return (
            <li key={g} className={`food-card${n >= info.target ? ' full' : ''}`} style={groupStyle(g)}>
              <span className="food-count" aria-hidden="true">
                {n}
              </span>
              <div className="grow stack-4">
                <span className="habit-name">{info.label}</span>
                <span className="habit-meta">
                  {n} de {info.target} {unitLabel(g, info.target)}
                  {info.kcal > 0 && ` · ${kcalText(info.kcal)} kcal c/u`}
                </span>
                <span className="pips" aria-hidden="true">
                  {Array.from({ length: Math.max(info.target, n) }, (_, i) => (
                    <span key={i} className={i < n ? (i < info.target ? 'on' : 'extra') : ''} />
                  ))}
                </span>
                {planned > 0 && (
                  <span className="xsmall muted">
                    {MEAL_LABELS[meal]}: {mealCount[g]} de {planned}
                  </span>
                )}
              </div>
              {g === 'agua' && n > 0 && (
                <button type="button" className="round-btn" aria-label="Quitar un vaso de agua" onClick={removeLastWater}>
                  <Icon name="minus" size={18} strokeWidth={2.4} />
                </button>
              )}
              <button
                type="button"
                className="round-btn dark"
                aria-label={g === 'agua' ? 'Agregar un vaso de agua' : `Agregar ${info.label.toLowerCase()}`}
                onClick={() => openPicker(g)}
              >
                <Icon name="plus" size={18} strokeWidth={2.4} />
              </button>
            </li>
          );
        })}
      </ul>

      <EatenList entries={entries} onRemove={(id) => removeFood(key, id)} />

      <dialog ref={dialog} className="sheet" onClose={() => setPicking(null)} aria-labelledby="sheet-title">
        {picking && (
          <FoodPicker group={picking} meal={meal} onPick={pick} onClose={() => dialog.current?.close()} />
        )}
      </dialog>
    </main>
  );
}

function FoodPicker({
  group,
  meal,
  onPick,
  onClose,
}: {
  group: FoodGroup;
  meal: Meal;
  onPick: (food: string) => void;
  onClose: () => void;
}) {
  const info = GROUPS[group];
  const [other, setOther] = useState('');
  return (
    <div className="stack-10">
      <div className="row gap-10">
        <div className="grow">
          <p className="eyebrow">{MEAL_LABELS[meal]}</p>
          <h2 id="sheet-title">{info.label}</h2>
        </div>
        <button type="button" className="round-btn" aria-label="Cerrar" onClick={onClose}>
          <Icon name="close" size={18} strokeWidth={2.4} />
        </button>
      </div>
      <p className="muted small">Elige una equivalencia: cada una cuenta como 1 porción.</p>
      <div className="equiv-list">
        {info.equivalents.map((food) => (
          <button key={food} type="button" className="equiv-btn" style={groupStyle(group)} onClick={() => onPick(food)}>
            <span className="swatch" style={{ background: 'var(--c)' }} />
            {food}
          </button>
        ))}
      </div>
      <form
        className="row gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (other.trim()) onPick(other.trim());
        }}
      >
        <input
          className="input grow"
          placeholder="Otro (1 porción)"
          aria-label={`Otra porción de ${info.label.toLowerCase()}`}
          value={other}
          onChange={(e) => setOther(e.target.value)}
        />
        <button type="submit" className="secondary-btn add-other" disabled={!other.trim()}>
          Agregar
        </button>
      </form>
    </div>
  );
}

/** Lo que se registró en el día, agrupado por comida. Cada porción se puede quitar. */
function EatenList({
  entries,
  onRemove,
}: {
  entries: FoodEntry[];
  onRemove: (id: string) => void;
}) {
  const meals = MEALS.filter((m) => entries.some((e) => e.meal === m && e.group !== 'agua'));
  return (
    <section className="stack-10">
      <div className="section-head">
        <h2>Lo que comiste</h2>
      </div>
      {meals.length === 0 ? (
        <p className="empty">Aún no has registrado comidas este día. Toca + en un grupo para agregar una porción.</p>
      ) : (
        meals.map((m) => (
          <div key={m} className="card list-card">
            <p className="bold eaten-meal">{MEAL_LABELS[m]}</p>
            <ul className="eaten">
              {entries
                .filter((e) => e.meal === m && e.group !== 'agua')
                .map((e) => (
                  <li key={e.id} className="row gap-10">
                    <span className="swatch" style={{ background: GROUPS[e.group].hex }} />
                    <span className="grow">
                      {e.food}
                      <span className="muted xsmall"> · {GROUPS[e.group].label}</span>
                    </span>
                    <button type="button" className="icon-only" aria-label={`Quitar ${e.food}`} onClick={() => onRemove(e.id)}>
                      <Icon name="close" size={16} strokeWidth={2.4} />
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
