import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DateKey } from './lib/dates';
import { resolveSettings, type Meal, type NutritionSettings } from './lib/foods';
import type { AiFood, BodyEntry, FoodEntry, NutritionData } from './lib/types';
import { newId } from './store';

/**
 * Nutrición se guarda aparte de los hábitos (clave propia), así no toca `habitos:v1`.
 * No cambiar la clave ni `version: 1` sin escribir una migración (ver CLAUDE.md).
 */
const STORAGE_KEY = 'nutricion:v1';

function emptyData(): NutritionData {
  return { version: 1, days: {}, body: [] };
}

/** Lee los datos guardados o los de un respaldo. Devuelve null si no son válidos. */
export function parseNutrition(value: unknown): NutritionData | null {
  const d = value as NutritionData;
  const ok = d && d.version === 1 && typeof d.days === 'object' && d.days !== null && Array.isArray(d.body);
  return ok ? d : null;
}

function load(): NutritionData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? parseNutrition(JSON.parse(raw)) : null;
    if (parsed) return parsed;
  } catch {
    /* almacenamiento no disponible o datos dañados: se empieza de cero */
  }
  return emptyData();
}

interface NutritionStore {
  nutrition: NutritionData;
  /** "Mi plan" con los valores de fábrica completando lo que no se ha cambiado. */
  settings: NutritionSettings;
  addFood: (day: DateKey, entry: Omit<FoodEntry, 'id'>) => void;
  removeFood: (day: DateKey, entryId: string) => void;
  /** Pasa un registro a otra comida (de desayuno a almuerzo, por ejemplo). */
  moveFood: (day: DateKey, entryId: string, meal: Meal) => void;
  saveSettings: (patch: Partial<NutritionSettings>) => void;
  resetSettings: () => void;
  rememberAiFood: (food: AiFood) => void;
  /** Guarda el registro de esa fecha (si ya había uno, lo reemplaza). */
  saveBody: (entry: BodyEntry) => void;
  deleteBody: (date: DateKey) => void;
  setHeight: (cm: number | undefined) => void;
  replaceNutrition: (data: NutritionData) => void;
}

const NutritionContext = createContext<NutritionStore | null>(null);

export function NutritionProvider({ children }: { children: ReactNode }) {
  const [nutrition, setNutrition] = useState<NutritionData>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nutrition));
    } catch {
      /* sin espacio o modo privado: se sigue en memoria */
    }
  }, [nutrition]);

  const store = useMemo<NutritionStore>(
    () => ({
      nutrition,
      settings: resolveSettings(nutrition.settings),
      addFood(day, entry) {
        setNutrition((d) => ({
          ...d,
          days: { ...d.days, [day]: [...(d.days[day] ?? []), { ...entry, id: newId() }] },
        }));
      },
      moveFood(day, entryId, meal) {
        setNutrition((d) => ({
          ...d,
          days: { ...d.days, [day]: (d.days[day] ?? []).map((e) => (e.id === entryId ? { ...e, meal } : e)) },
        }));
      },
      saveSettings(patch) {
        // Solo se guarda lo que se cambió; lo demás sigue tomando los valores de fábrica.
        setNutrition((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
      },
      resetSettings() {
        // El código de la IA no es parte del plan: se conserva.
        setNutrition((d) => ({ ...d, settings: d.settings?.aiCode ? { aiCode: d.settings.aiCode } : undefined }));
      },
      rememberAiFood(food) {
        setNutrition((d) => ({
          ...d,
          aiFoods: [food, ...(d.aiFoods ?? []).filter((f) => f.name.toLowerCase() !== food.name.toLowerCase())].slice(0, 12),
        }));
      },
      removeFood(day, entryId) {
        setNutrition((d) => ({
          ...d,
          days: { ...d.days, [day]: (d.days[day] ?? []).filter((e) => e.id !== entryId) },
        }));
      },
      saveBody(entry) {
        setNutrition((d) => {
          const body = [...d.body.filter((b) => b.date !== entry.date), entry];
          body.sort((a, b) => (a.date < b.date ? -1 : 1));
          return { ...d, body };
        });
      },
      deleteBody(date) {
        setNutrition((d) => ({ ...d, body: d.body.filter((b) => b.date !== date) }));
      },
      setHeight(cm) {
        setNutrition((d) => ({ ...d, heightCm: cm }));
      },
      replaceNutrition(next) {
        setNutrition(next);
      },
    }),
    [nutrition],
  );

  return <NutritionContext.Provider value={store}>{children}</NutritionContext.Provider>;
}

export function useNutrition(): NutritionStore {
  const ctx = useContext(NutritionContext);
  if (!ctx) throw new Error('useNutrition debe usarse dentro de NutritionProvider');
  return ctx;
}
