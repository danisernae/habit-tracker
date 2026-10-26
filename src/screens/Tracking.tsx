import { useState } from 'react';
import { Icon } from '../components/Icon';
import { NutritionTabs, StatTile } from '../components/Common';
import { WeightChart } from '../components/WeightChart';
import { fromKey, shortDate, toKey } from '../lib/dates';
import { bmi, bmiLabel, bodyChange, previousValue, weightSeries } from '../lib/stats';
import type { BodyEntry } from '../lib/types';
import { useNutrition } from '../nutrition';

/** "72,5" o "72.5" → 72.5; vacío o inválido → undefined. */
function parseNum(text: string): number | undefined {
  const n = Number(text.replace(',', '.').trim());
  return text.trim() && Number.isFinite(n) && n > 0 ? n : undefined;
}

const fmt = (n: number | undefined) => (n === undefined ? '' : String(n).replace('.', ','));
const signed = (n: number) => `${n > 0 ? '+' : ''}${fmt(n)}`;

/** Seguimiento: un registro por fecha con peso, IMC y % de grasa corporal. */
export function Tracking() {
  const { nutrition, saveBody, deleteBody, setHeight } = useNutrition();
  const { body, heightCm } = nutrition;
  const today = toKey(new Date());
  const [date, setDate] = useState(today);
  const existing = body.find((b) => b.date === date);
  const [weight, setWeight] = useState(fmt(existing?.weight));
  const [fat, setFat] = useState(fmt(existing?.fat));
  // Un IMC que se calculó solo se deja vacío, para que se recalcule si cambia el peso.
  const manualBmi = (b?: BodyEntry) => (b?.bmi !== undefined && b.bmi !== bmi(b.weight, heightCm) ? fmt(b.bmi) : '');
  const [bmiText, setBmiText] = useState(manualBmi(existing));
  const [height, setHeightText] = useState(fmt(heightCm));
  const [status, setStatus] = useState('');

  const autoBmi = bmi(parseNum(weight), parseNum(height));
  const entry: BodyEntry = { date, weight: parseNum(weight), fat: parseNum(fat), bmi: parseNum(bmiText) ?? autoBmi };
  const canSave = Boolean(date && date <= today && (entry.weight || entry.fat || entry.bmi));

  const last = body[body.length - 1];
  const lastWith = (f: 'weight' | 'bmi' | 'fat') => [...body].reverse().find((b) => b[f] !== undefined)?.[f];
  const latestWeight = lastWith('weight');
  const latestBmi = lastWith('bmi');
  const latestFat = lastWith('fat');
  const weightChange = bodyChange(body, 'weight');
  const fatChange = bodyChange(body, 'fat');

  function changeDate(next: string) {
    setDate(next);
    const found = body.find((b) => b.date === next);
    setWeight(fmt(found?.weight));
    setFat(fmt(found?.fat));
    setBmiText(manualBmi(found));
    setStatus('');
  }

  function onSave() {
    if (!canSave) return;
    saveBody(entry);
    setStatus(existing ? 'Registro actualizado.' : 'Registro guardado.');
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Nutrición</p>
          <h1 className="title">Seguimiento</h1>
        </div>
      </header>

      <NutritionTabs current="seguimiento" />

      {last ? (
        <div className="grid-3">
          <StatTile
            value={latestWeight !== undefined ? fmt(latestWeight) : '–'}
            label={weightChange !== undefined ? `kg · ${signed(weightChange)}` : 'kg'}
          />
          <StatTile value={latestBmi !== undefined ? fmt(latestBmi) : '–'} label={latestBmi !== undefined ? `IMC · ${bmiLabel(latestBmi)}` : 'IMC'} />
          <StatTile
            value={latestFat !== undefined ? `${fmt(latestFat)}%` : '–'}
            label={fatChange !== undefined ? `grasa · ${signed(fatChange)}` : 'grasa'}
          />
        </div>
      ) : (
        <p className="muted">Registra tu peso, IMC y % de grasa para ver cómo vas cambiando.</p>
      )}
      {weightChange !== undefined && (
        <p className="muted small">Cambios desde tu primer registro.</p>
      )}

      <WeightChart points={weightSeries(body)} />

      <section className="card form-card stack-10" aria-labelledby="body-form">
        <h2 id="body-form">{existing ? 'Editar registro' : 'Nuevo registro'}</h2>
        <label className="stack-4">
          <span className="field-label">Fecha</span>
          <input className="input" type="date" max={today} value={date} onChange={(e) => changeDate(e.target.value)} />
        </label>
        <div className="grid-2">
          <label className="stack-4">
            <span className="field-label">Peso (kg)</span>
            <input className="input" inputMode="decimal" placeholder="Ej: 62,5" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </label>
          <label className="stack-4">
            <span className="field-label">% grasa</span>
            <input className="input" inputMode="decimal" placeholder="Ej: 28" value={fat} onChange={(e) => setFat(e.target.value)} />
          </label>
          <label className="stack-4">
            <span className="field-label">IMC</span>
            <input
              className="input"
              inputMode="decimal"
              placeholder={autoBmi !== undefined ? fmt(autoBmi) : 'Ej: 23,4'}
              value={bmiText}
              onChange={(e) => setBmiText(e.target.value)}
            />
          </label>
          <label className="stack-4">
            <span className="field-label">Estatura (cm)</span>
            <input
              className="input"
              inputMode="decimal"
              placeholder="Ej: 160"
              value={height}
              onChange={(e) => setHeightText(e.target.value)}
              onBlur={() => setHeight(parseNum(height))}
            />
          </label>
        </div>
        <p className="muted xsmall">
          {autoBmi !== undefined && !bmiText
            ? `Con tu estatura, el IMC se calcula solo: ${fmt(autoBmi)}.`
            : 'Si guardas tu estatura, el IMC se calcula solo con el peso.'}
        </p>
        <button type="button" className="primary-btn" disabled={!canSave} onClick={onSave}>
          {existing ? 'Actualizar registro' : 'Guardar registro'}
        </button>
        {status && (
          <p className="muted small" role="status">
            {status}
          </p>
        )}
      </section>

      {body.length > 0 && (
        <section className="stack-10">
          <h2>Historial</h2>
          <ul className="card list-card history">
            {body
              .map((b, i) => ({ b, prev: previousValue(body, i, 'weight') }))
              .reverse()
              .map(({ b, prev }) => (
                <li key={b.date} className="row gap-10">
                  <button type="button" className="history-main" onClick={() => changeDate(b.date)} aria-label={`Editar registro del ${shortDate(fromKey(b.date))}`}>
                    <span className="bold">{shortDate(fromKey(b.date))}</span>
                    <span className="muted small">
                      {[
                        b.weight !== undefined &&
                          `${fmt(b.weight)} kg${prev !== undefined ? ` (${signed(Math.round((b.weight - prev) * 10) / 10)})` : ''}`,
                        b.bmi !== undefined && `IMC ${fmt(b.bmi)}`,
                        b.fat !== undefined && `${fmt(b.fat)}% grasa`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="icon-only"
                    aria-label={`Eliminar registro del ${shortDate(fromKey(b.date))}`}
                    onClick={() => {
                      if (window.confirm('¿Eliminar este registro?')) deleteBody(b.date);
                    }}
                  >
                    <Icon name="close" size={16} strokeWidth={2.4} />
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}
    </main>
  );
}
