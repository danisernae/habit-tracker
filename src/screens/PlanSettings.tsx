import { useState } from 'react';
import { Icon } from '../components/Icon';
import { NutritionTabs } from '../components/Common';
import {
  DEFAULT_SETTINGS,
  equivalentText,
  fmtNum,
  FOOD_GROUPS,
  GROUPS,
  MEAL_LABELS,
  MEALS,
  portionsLabel,
  type Equivalent,
  type FoodGroup,
  type Meal,
} from '../lib/foods';
import { dailyTarget, planKcal } from '../lib/stats';
import { useNutrition } from '../nutrition';

/** "72,5" o "72.5" → 72.5; vacío o inválido → undefined. Acepta 0. */
function parseNum(text: string): number | undefined {
  const n = Number(text.replace(',', '.').trim());
  return text.trim() && Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** "Mi plan": meta de calorías, porciones por comida, valores por porción, equivalencias y código de la IA. */
export function PlanSettings() {
  const { settings, saveSettings, resetSettings } = useNutrition();
  const [meal, setMeal] = useState<Meal>('desayuno');
  const [goal, setGoal] = useState(String(settings.kcalGoal));
  // Los campos que se editan libremente se vuelven a montar al restablecer el plan.
  const [version, setVersion] = useState(0);

  function setPortions(g: FoodGroup, n: number) {
    const next = Math.max(0, Math.min(20, n));
    saveSettings({ plan: { ...settings.plan, [meal]: { ...settings.plan[meal], [g]: next } } });
  }

  function setValue(g: FoodGroup, field: 'kcal' | 'protein' | 'fat', text: string) {
    const n = parseNum(text);
    if (n === undefined) return;
    saveSettings({ values: { ...settings.values, [g]: { ...settings.values[g], [field]: n } } });
  }

  function setFoods(g: FoodGroup, foods: Equivalent[]) {
    saveSettings({ foods: { ...settings.foods, [g]: foods } });
  }

  const total = planKcal(settings);

  return (
    <main className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Nutrición</p>
          <h1 className="title">Mi plan</h1>
        </div>
      </header>

      <NutritionTabs current="plan" />

      <section className="card form-card stack-10" aria-labelledby="goal-title">
        <h2 id="goal-title">Meta de calorías</h2>
        <label className="row gap-10">
          <input
            className="input goal-input"
            inputMode="numeric"
            value={goal}
            aria-label="Calorías al día"
            onChange={(e) => {
              setGoal(e.target.value);
              const n = parseNum(e.target.value);
              if (n && n >= 500 && n <= 6000) saveSettings({ kcalGoal: Math.round(n) });
            }}
            onBlur={() => setGoal(String(settings.kcalGoal))}
          />
          <span className="muted">kcal al día</span>
        </label>
        <p className="muted small">Las porciones de tu plan suman {total} kcal al día.</p>
      </section>

      <section className="stack-10" aria-labelledby="plan-title">
        <div>
          <h2 id="plan-title">Porciones por comida</h2>
          <p className="muted small">Cuántas porciones de cada grupo debes comer. El total del día es la suma de las comidas.</p>
        </div>
        <div className="chips" role="group" aria-label="Comida">
          {MEALS.map((m) => (
            <button key={m} type="button" className="chip" aria-pressed={meal === m} onClick={() => setMeal(m)}>
              {MEAL_LABELS[m]}
            </button>
          ))}
        </div>
        <ul className="card list-card plan-list">
          {FOOD_GROUPS.map((g) => {
            const n = settings.plan[meal][g];
            return (
              <li key={g} className="row gap-10">
                <span className="swatch" style={{ background: GROUPS[g].hex }} />
                <span className="grow stack-4">
                  <span className="bold">{GROUPS[g].label}</span>
                  <span className="muted xsmall">Al día: {dailyTarget(settings, g)}</span>
                </span>
                <span className="stepper">
                  <button
                    type="button"
                    className="round-btn"
                    aria-label={`Una porción menos de ${GROUPS[g].label.toLowerCase()} en ${MEAL_LABELS[meal].toLowerCase()}`}
                    disabled={n === 0}
                    onClick={() => setPortions(g, n - 1)}
                  >
                    <Icon name="minus" size={16} strokeWidth={2.4} />
                  </button>
                  <span className="stepper-value" aria-live="polite">
                    {n}
                  </span>
                  <button
                    type="button"
                    className="round-btn"
                    aria-label={`Una porción más de ${GROUPS[g].label.toLowerCase()} en ${MEAL_LABELS[meal].toLowerCase()}`}
                    onClick={() => setPortions(g, n + 1)}
                  >
                    <Icon name="plus" size={16} strokeWidth={2.4} />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section key={`foods-${version}`} className="stack-10">
        <div>
          <h2>Equivalencias</h2>
          <p className="muted small">Lo que aparece al tocar + en cada grupo. Puedes quitar o agregar opciones.</p>
        </div>
        {FOOD_GROUPS.map((g) => (
          <details key={g} className="card details-card">
            <summary>
              <span className="swatch" style={{ background: GROUPS[g].hex }} />
              <span className="grow bold">{GROUPS[g].label}</span>
              <span className="muted small">{settings.foods[g].length}</span>
            </summary>
            <EquivalentsEditor group={g} foods={settings.foods[g]} onChange={(f) => setFoods(g, f)} />
            <div className="values-grid">
              <span className="xsmall muted values-title">1 porción aporta:</span>
              {(['kcal', 'protein', 'fat'] as const).map((field) => (
                <label key={field} className="stack-4">
                  <span className="xsmall bold">{field === 'kcal' ? 'kcal' : field === 'protein' ? 'Proteína g' : 'Grasa g'}</span>
                  <input
                    className="input small-input"
                    inputMode="decimal"
                    defaultValue={fmtNum(settings.values[g][field])}
                    onChange={(e) => setValue(g, field, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </details>
        ))}
      </section>

      <section className="card form-card stack-10" aria-labelledby="ai-code-title">
        <h2 id="ai-code-title">Código de la IA</h2>
        <p className="muted small">
          Si en Vercel configuraste <code>APP_ACCESS_CODE</code>, escribe aquí el mismo código para poder calcular con IA.
        </p>
        <input
          className="input"
          type="password"
          autoComplete="off"
          placeholder="Código"
          aria-label="Código de la IA"
          defaultValue={settings.aiCode ?? ''}
          onChange={(e) => saveSettings({ aiCode: e.target.value.trim() || undefined })}
        />
      </section>

      <button
        type="button"
        className="danger-btn"
        onClick={() => {
          if (window.confirm('¿Volver al plan original? Se pierden los cambios de porciones, valores y equivalencias.')) {
            resetSettings();
            setGoal(String(DEFAULT_SETTINGS.kcalGoal));
            setVersion((v) => v + 1);
          }
        }}
      >
        Volver al plan original
      </button>
    </main>
  );
}

function EquivalentsEditor({ group, foods, onChange }: { group: FoodGroup; foods: Equivalent[]; onChange: (f: Equivalent[]) => void }) {
  const [food, setFood] = useState('');
  const [amount, setAmount] = useState('');
  const [portions, setPortions] = useState('1');
  const n = parseNum(portions);
  const canAdd = food.trim() && amount.trim() && n !== undefined && n > 0;

  return (
    <div className="stack-10 details-body">
      <ul className="eaten">
        {foods.map((e, i) => (
          <li key={`${equivalentText(e)}-${i}`} className="row gap-10">
            <span className="grow">
              {e.food} <span className="muted">· {e.amount}</span>
              {e.portions && e.portions !== 1 && <span className="muted xsmall"> = {portionsLabel(group, e.portions)}</span>}
            </span>
            <button
              type="button"
              className="icon-only"
              aria-label={`Quitar ${e.food} (${e.amount})`}
              onClick={() => onChange(foods.filter((_, j) => j !== i))}
            >
              <Icon name="close" size={16} strokeWidth={2.4} />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="stack-8"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (!canAdd) return;
          onChange([...foods, { food: food.trim(), amount: amount.trim(), ...(n !== 1 ? { portions: n } : {}) }]);
          setFood('');
          setAmount('');
          setPortions('1');
        }}
      >
        <input className="input" placeholder="Alimento (ej: Yuca cocida)" aria-label="Alimento" value={food} onChange={(e) => setFood(e.target.value)} />
        <div className="grid-2">
          <input className="input" placeholder="Cantidad (ej: 60 g)" aria-label="Cantidad" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <label className="row gap-6">
            <input className="input" inputMode="decimal" aria-label="Porciones que vale" value={portions} onChange={(e) => setPortions(e.target.value)} />
            <span className="muted xsmall">porc.</span>
          </label>
        </div>
        <button type="submit" className="secondary-btn" disabled={!canAdd}>
          Agregar opción
        </button>
      </form>
    </div>
  );
}
