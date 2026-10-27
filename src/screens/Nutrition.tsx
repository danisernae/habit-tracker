import { useRef, useState, type CSSProperties } from 'react';
import { Icon } from '../components/Icon';
import { NutritionTabs, ProgressRing } from '../components/Common';
import { estimateFood, type Estimated } from '../lib/ai';
import { addDays, dayTitle, isFuture, longDate, parseKey, sameDay, toKey } from '../lib/dates';
import {
  equivalentText,
  fmtNum,
  FOOD_GROUPS,
  GROUPS,
  MEAL_LABELS,
  MEALS,
  mealForHour,
  parseAmount,
  portionsLabel,
  unitLabel,
  type Equivalent,
  type FoodGroup,
  type Meal,
} from '../lib/foods';
import { INK } from '../lib/palette';
import {
  countByGroup,
  dailyTarget,
  dayNutrition,
  entryKcal,
  entryPortions,
  mainGroup,
  nutritionMessage,
  scaledPortions,
} from '../lib/stats';
import type { AiFood, EntryBase, FoodEntry, Portions } from '../lib/types';
import { useNutrition } from '../nutrition';

const groupStyle = (g: FoodGroup) =>
  ({ '--c': GROUPS[g].hex, '--fg': GROUPS[g].lightText ? '#FFFFFF' : INK }) as CSSProperties;

/** "2 harinas · 1 grasa" */
const splitText = (split: Portions) =>
  FOOD_GROUPS.filter((g) => (split[g] ?? 0) > 0)
    .map((g) => portionsLabel(g, split[g]!))
    .join(' · ');

/** Base para ajustar la cantidad de una equivalencia; null si su cantidad no empieza con un número. */
function baseOf(e: Equivalent): EntryBase | null {
  const parsed = parseAmount(e.amount);
  return parsed ? { food: e.food, qty: parsed.qty, unit: parsed.unit, portions: e.portions ?? 1 } : null;
}

const baseText = (b: EntryBase, qty: number) => `${b.food} (${fmtNum(qty)}${b.unit ? ` ${b.unit}` : ''})`;

/** Lo que se come en un día: hoy (#/nutricion) o un día pasado (#/nutricion/AAAA-MM-DD). */
export function Nutrition({ dayKey }: { dayKey?: string }) {
  const { nutrition, settings, addFood, removeFood, moveFood, updateFood } = useNutrition();
  const today = new Date();
  const parsed = parseKey(dayKey);
  const day = parsed && !isFuture(parsed, today) ? parsed : today;
  const key = toKey(day);
  const isToday = sameDay(day, today);
  const entries = nutrition.days[key] ?? [];
  const totals = dayNutrition(entries, settings);
  const [meal, setMeal] = useState<Meal>(() => (isToday ? mealForHour(today.getHours()) : 'desayuno'));
  const mealCount = countByGroup(entries, meal);
  const [picking, setPicking] = useState<FoodGroup | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const editDialog = useRef<HTMLDialogElement>(null);
  const left = settings.kcalGoal - totals.kcal;

  const dayHref = (d: Date) => (sameDay(d, today) ? '#/nutricion' : `#/nutricion/${toKey(d)}`);

  function openPicker(g: FoodGroup) {
    if (g === 'agua') {
      addFood(key, { group: g, food: equivalentText(settings.foods.agua[0] ?? { food: 'Agua', amount: '1 vaso' }), meal });
      return;
    }
    setPicking(g);
    dialog.current?.showModal();
  }

  /** Una equivalencia con la cantidad que se comió, o algo escrito a mano (1 porción). */
  function pick(choice: { base: EntryBase; qty: number } | { food: string; portions: number }) {
    if (picking) {
      const entry =
        'base' in choice
          ? { food: baseText(choice.base, choice.qty), base: choice.base, qty: choice.qty, portions: scaledPortions(choice.base, choice.qty) }
          : { food: choice.food, ...(choice.portions !== 1 ? { portions: choice.portions } : {}) };
      addFood(key, { group: picking, meal, ...entry });
    }
    dialog.current?.close();
  }

  function openEdit(e: FoodEntry) {
    setEditing(e);
    editDialog.current?.showModal();
  }

  function saveEdit(qty: number) {
    if (!editing) return;
    if (editing.base) {
      updateFood(key, editing.id, { qty, food: baseText(editing.base, qty), portions: scaledPortions(editing.base, qty) });
    } else {
      updateFood(key, editing.id, { portions: qty });
    }
    editDialog.current?.close();
  }

  function addAi(f: AiFood) {
    addFood(key, { group: mainGroup(f.split), food: f.name, meal, split: f.split, kcal: f.kcal, protein: f.protein, fat: f.fat });
  }

  function removeLastWater() {
    const last = [...entries].reverse().find((e) => e.group === 'agua' && !e.split);
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

      <section className="card progress-card" aria-label={`Calorías del día: ${totals.kcal} de ${settings.kcalGoal}`}>
        <ProgressRing pct={totals.kcalPct} label={String(totals.kcal)} />
        <div>
          <p className="progress-msg">{nutritionMessage(totals.kcal, settings.kcalGoal)}</p>
          <p className="muted">
            {totals.kcal} de {settings.kcalGoal} kcal · {left >= 0 ? `te quedan ${left}` : `${-left} de más`}
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

      <AiCard meal={meal} recent={nutrition.aiFoods ?? []} code={settings.aiCode} onAdd={addAi} />

      <ul className="food-list">
        {FOOD_GROUPS.map((g) => {
          const info = GROUPS[g];
          const n = totals.count[g];
          const target = dailyTarget(settings, g);
          const planned = settings.plan[meal][g];
          if (target === 0 && n === 0 && settings.foods[g].length === 0) return null;
          return (
            <li key={g} className={`food-card${target > 0 && n >= target ? ' full' : ''}`} style={groupStyle(g)}>
              <span className="food-count" aria-hidden="true">
                {fmtNum(n)}
              </span>
              <div className="grow stack-4">
                <span className="habit-name">{info.label}</span>
                <span className="habit-meta">
                  {fmtNum(n)} de {target} {unitLabel(g, target)}
                  {settings.values[g].kcal > 0 && ` · ${fmtNum(settings.values[g].kcal)} kcal c/u`}
                </span>
                <span className="pips" aria-hidden="true">
                  {Array.from({ length: Math.ceil(Math.max(target, n)) }, (_, i) => (
                    <span key={i} className={i < n ? (i < target ? 'on' : 'extra') : ''} />
                  ))}
                </span>
                {planned > 0 && (
                  <span className="xsmall muted">
                    {MEAL_LABELS[meal]}: {fmtNum(mealCount[g])} de {planned}
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

      <EatenList
        entries={entries}
        kcalOf={(e) => entryKcal(e, settings)}
        onRemove={(id) => removeFood(key, id)}
        onMove={(id, m) => moveFood(key, id, m)}
        onEdit={openEdit}
      />

      <dialog ref={dialog} className="sheet" onClose={() => setPicking(null)} aria-labelledby="sheet-title">
        {picking && <FoodPicker group={picking} meal={meal} onPick={pick} onClose={() => dialog.current?.close()} />}
      </dialog>

      <dialog ref={editDialog} className="sheet" onClose={() => setEditing(null)} aria-labelledby="qty-title">
        {editing && (
          <QuantityForm
            group={editing.group}
            base={editing.base ?? { food: editing.food, qty: 1, unit: 'porciones', portions: 1 }}
            initialQty={editing.base ? (editing.qty ?? editing.base.qty) : (editing.portions ?? 1)}
            eyebrow={`${MEAL_LABELS[editing.meal]} · ajustar cantidad`}
            submitLabel="Guardar"
            onSubmit={saveEdit}
            onBack={() => editDialog.current?.close()}
          />
        )}
      </dialog>
    </main>
  );
}

/** Escribir lo que se comió y que la IA calcule las calorías (busca en internet si es una marca). */
function AiCard({
  meal,
  recent,
  code,
  onAdd,
}: {
  meal: Meal;
  recent: AiFood[];
  code?: string;
  onAdd: (f: AiFood) => void;
}) {
  const { rememberAiFood } = useNutrition();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<(AiFood & { note?: string }) | null>(null);

  async function ask() {
    const food = text.trim();
    if (!food || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r: Estimated = await estimateFood(food, code);
      setResult(r);
      const { note: _note, ...saved } = r;
      rememberAiFood(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo calcular.');
    } finally {
      setLoading(false);
    }
  }

  function add() {
    if (!result) return;
    onAdd(result);
    setResult(null);
    setText('');
  }

  return (
    <section className="card ai-card stack-10" aria-labelledby="ai-title">
      <div>
        <h2 id="ai-title" className="ai-title">
          <Icon name="sparkle" size={18} /> Calcular con IA
        </h2>
        <p className="muted small">Escribe qué comiste y cuánto. Si es una marca, la busca en internet.</p>
      </div>
      <form
        className="row gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <input
          className="input grow"
          placeholder="Ej: 1 rebanada de pizza"
          aria-label="¿Qué comiste?"
          maxLength={200}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="secondary-btn add-other" disabled={!text.trim() || loading}>
          {loading ? 'Calculando…' : 'Calcular'}
        </button>
      </form>

      {error && (
        <p className="small error-text" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="ai-result stack-8" role="status">
          <div className="row gap-10">
            <span className="grow bold">{result.name}</span>
            <span className="ai-kcal">{result.kcal} kcal</span>
          </div>
          <p className="muted small">
            Proteína {result.protein} g · Grasa {result.fat} g · Carbohidratos {result.carbs} g
          </p>
          {splitText(result.split) && <p className="small">Equivale a: {splitText(result.split)}</p>}
          {result.note && <p className="muted xsmall">{result.note}</p>}
          <p className="muted xsmall">Fuente: {result.source}. Es un aproximado.</p>
          <div className="grid-2">
            <button type="button" className="secondary-btn" onClick={() => setResult(null)}>
              Descartar
            </button>
            <button type="button" className="primary-btn compact" onClick={add}>
              Agregar a {MEAL_LABELS[meal].toLowerCase()}
            </button>
          </div>
        </div>
      )}

      {!result && recent.length > 0 && (
        <div className="stack-4">
          <span className="xsmall muted">Calculados antes (toca para verlos de nuevo):</span>
          <div className="chips">
            {recent.map((f) => (
              <button key={f.name} type="button" className="chip" onClick={() => setResult(f)}>
                {f.name} · {f.kcal}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
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
  onPick: (choice: { base: EntryBase; qty: number } | { food: string; portions: number }) => void;
  onClose: () => void;
}) {
  const { settings } = useNutrition();
  const info = GROUPS[group];
  const [other, setOther] = useState('');
  const [chosen, setChosen] = useState<EntryBase | null>(null);

  if (chosen) {
    return (
      <QuantityForm
        group={group}
        base={chosen}
        initialQty={chosen.qty}
        eyebrow={`${MEAL_LABELS[meal]} · ${info.label}`}
        submitLabel="Agregar"
        onSubmit={(qty) => onPick({ base: chosen, qty })}
        onBack={() => setChosen(null)}
      />
    );
  }

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
      <p className="muted small">Elige una equivalencia: cada una cuenta como 1 porción, salvo que diga otra cosa.</p>
      <div className="equiv-list">
        {settings.foods[group].map((e) => (
          <button
            key={equivalentText(e)}
            type="button"
            className="equiv-btn"
            style={groupStyle(group)}
            onClick={() => {
              const base = baseOf(e);
              if (base) setChosen(base);
              else onPick({ food: equivalentText(e), portions: e.portions ?? 1 });
            }}
          >
            <span className="swatch" style={{ background: 'var(--c)' }} />
            <span className="grow">{e.food}</span>
            <span className="equiv-amount">
              {e.amount}
              {e.portions && e.portions !== 1 && <span className="equiv-portions"> = {portionsLabel(group, e.portions)}</span>}
            </span>
          </button>
        ))}
      </div>
      <form
        className="row gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (other.trim()) onPick({ food: other.trim(), portions: 1 });
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
      <a href="#/plan" className="small link">
        Editar equivalencias en Mi plan
      </a>
    </div>
  );
}

/** "¿Cuánto comiste?": la cantidad en la unidad de la equivalencia, con las porciones y kcal al momento. */
function QuantityForm({
  group,
  base,
  initialQty,
  eyebrow,
  submitLabel,
  onSubmit,
  onBack,
}: {
  group: FoodGroup;
  base: EntryBase;
  initialQty: number;
  eyebrow: string;
  submitLabel: string;
  onSubmit: (qty: number) => void;
  onBack: () => void;
}) {
  const { settings } = useNutrition();
  const [text, setText] = useState(fmtNum(initialQty));
  const n = Number(text.replace(',', '.'));
  const valid = text.trim() !== '' && Number.isFinite(n) && n > 0 && n <= 5000;
  const portions = valid ? scaledPortions(base, n) : 0;
  const kcal = Math.round(portions * settings.values[group].kcal);
  const step = base.qty >= 20 ? 10 : 0.5;

  return (
    <form
      className="stack-10"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(n);
      }}
    >
      <div className="row gap-10">
        <button type="button" className="round-btn" aria-label="Volver" onClick={onBack}>
          <Icon name="left" size={18} strokeWidth={2.4} />
        </button>
        <div className="grow">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="qty-title">{base.food}</h2>
        </div>
      </div>
      <p className="muted small">
        {base.unit === 'porciones'
          ? '¿Cuántas porciones comiste?'
          : `1 porción = ${fmtNum(base.qty / base.portions)} ${base.unit}. ¿Cuánto comiste?`}
      </p>
      <div className="row gap-10 qty-row">
        <button type="button" className="round-btn" aria-label="Menos" onClick={() => valid && n - step > 0 && setText(fmtNum(n - step))}>
          <Icon name="minus" size={18} strokeWidth={2.4} />
        </button>
        <input
          className="input qty-input"
          inputMode="decimal"
          aria-label={`Cantidad en ${base.unit}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <span className="bold qty-unit">{base.unit}</span>
        <button type="button" className="round-btn" aria-label="Más" onClick={() => valid && setText(fmtNum(n + step))}>
          <Icon name="plus" size={18} strokeWidth={2.4} />
        </button>
      </div>
      <p className="qty-result" aria-live="polite">
        {valid ? (
          <>
            = {portionsLabel(group, portions)}
            {settings.values[group].kcal > 0 && <span className="muted"> · {kcal} kcal</span>}
          </>
        ) : (
          <span className="muted">Escribe una cantidad.</span>
        )}
      </p>
      <button type="submit" className="primary-btn" disabled={!valid}>
        {submitLabel}
      </button>
    </form>
  );
}

/** Lo que se registró en el día, agrupado por comida. Cada registro se puede pasar a otra comida o quitar. */
function EatenList({
  entries,
  kcalOf,
  onRemove,
  onMove,
  onEdit,
}: {
  entries: FoodEntry[];
  kcalOf: (e: FoodEntry) => number;
  onRemove: (id: string) => void;
  onMove: (id: string, meal: Meal) => void;
  onEdit: (e: FoodEntry) => void;
}) {
  const shown = (e: FoodEntry) => e.group !== 'agua' || !!e.split;
  const meals = MEALS.filter((m) => entries.some((e) => e.meal === m && shown(e)));
  return (
    <section className="stack-10">
      <div className="section-head">
        <h2>Lo que comiste</h2>
      </div>
      {meals.length === 0 ? (
        <p className="empty">Aún no has registrado comidas este día. Toca + en un grupo o calcula con IA.</p>
      ) : (
        meals.map((m) => (
          <div key={m} className="card list-card">
            <p className="bold eaten-meal">{MEAL_LABELS[m]}</p>
            <ul className="eaten">
              {entries
                .filter((e) => e.meal === m && shown(e))
                .map((e) => (
                  <li key={e.id} className="eaten-row">
                    <span className="swatch" style={{ background: GROUPS[e.group].hex }} />
                    {e.split ? (
                      // Lo calculado con IA trae sus propias kcal: para otra cantidad, se vuelve a calcular.
                      <span className="grow stack-4 eaten-text">
                        <span>{e.food}</span>
                        <span className="muted xsmall">
                          {splitText(entryPortions(e))} · {kcalOf(e)} kcal
                        </span>
                      </span>
                    ) : (
                      <button type="button" className="grow stack-4 eaten-text eaten-edit" aria-label={`Ajustar cantidad: ${e.food}`} onClick={() => onEdit(e)}>
                        <span>{e.food}</span>
                        <span className="muted xsmall">
                          {splitText(entryPortions(e))} · {kcalOf(e)} kcal · <span className="link">ajustar</span>
                        </span>
                      </button>
                    )}
                    <select
                      className="meal-select"
                      aria-label={`Cambiar de comida: ${e.food}`}
                      value={e.meal}
                      onChange={(ev) => onMove(e.id, ev.target.value as Meal)}
                    >
                      {MEALS.map((mm) => (
                        <option key={mm} value={mm}>
                          {MEAL_LABELS[mm]}
                        </option>
                      ))}
                    </select>
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
