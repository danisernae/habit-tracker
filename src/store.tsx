import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toKey } from './lib/dates';
import type { AppData, Habit, Reflection } from './lib/types';

/**
 * Los datos se guardan en el navegador (localStorage), en este mismo dispositivo.
 * Para sincronizar entre celular y computador habría que agregar un backend (ver CLAUDE.md).
 */
const STORAGE_KEY = 'habitos:v1';

function defaultData(): AppData {
  const today = toKey(new Date());
  const base: Array<Pick<Habit, 'name' | 'detail' | 'color' | 'icon'>> = [
    { name: 'Tomar agua', detail: '8 vasos', color: 'cielo', icon: 'agua' },
    { name: 'Hacer ejercicio', detail: '30 min', color: 'mora', icon: 'ejercicio' },
    { name: 'Seguir la dieta', detail: 'Plan del día', color: 'avena', icon: 'dieta' },
    { name: 'Sin azúcar', detail: 'Todo el día', color: 'rosa', icon: 'sinAzucar' },
    { name: 'Skin care', detail: 'Mañana y noche', color: 'lila', icon: 'skincare' },
  ];
  return {
    version: 1,
    habits: base.map((h, i) => ({
      ...h,
      id: newId(),
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      createdAt: today,
      order: i,
    })),
    checks: {},
    reflections: {},
  };
}

/** Lee datos guardados o de un respaldo. Devuelve null si el texto no es un respaldo válido. */
export function parseData(raw: string): AppData | null {
  try {
    const parsed = JSON.parse(raw) as AppData;
    const ok =
      parsed &&
      parsed.version === 1 &&
      Array.isArray(parsed.habits) &&
      typeof parsed.checks === 'object' &&
      typeof parsed.reflections === 'object';
    // Solo los campos de hábitos: un respaldo trae también `nutricion`, que se guarda aparte.
    return ok ? { version: 1, habits: parsed.habits, checks: parsed.checks, reflections: parsed.reflections } : null;
  } catch {
    return null;
  }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? parseData(raw) : null;
    if (parsed) return parsed;
  } catch {
    /* almacenamiento no disponible: se empieza de cero */
  }
  return defaultData();
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface Store {
  data: AppData;
  habits: Habit[];
  toggleCheck: (habitId: string, day: Date) => void;
  saveHabit: (habit: Habit) => void;
  deleteHabit: (habitId: string) => void;
  setReflection: (month: string, patch: Partial<Reflection>) => void;
  replaceData: (data: AppData) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* sin espacio o modo privado: se sigue en memoria */
    }
  }, [data]);

  const store = useMemo<Store>(() => {
    const habits = [...data.habits].sort((a, b) => a.order - b.order);
    return {
      data,
      habits,
      toggleCheck(habitId, day) {
        const key = toKey(day);
        setData((d) => {
          const current = d.checks[key] ?? [];
          const marking = !current.includes(habitId);
          const next = marking ? [...current, habitId] : current.filter((id) => id !== habitId);
          // Marcar un día anterior al inicio del hábito mueve su inicio a ese día.
          const habits = marking
            ? d.habits.map((h) => (h.id === habitId && key < h.createdAt ? { ...h, createdAt: key } : h))
            : d.habits;
          return { ...d, habits, checks: { ...d.checks, [key]: next } };
        });
      },
      saveHabit(habit) {
        setData((d) => {
          const exists = d.habits.some((h) => h.id === habit.id);
          return {
            ...d,
            habits: exists ? d.habits.map((h) => (h.id === habit.id ? habit : h)) : [...d.habits, habit],
          };
        });
      },
      deleteHabit(habitId) {
        setData((d) => {
          const checks: AppData['checks'] = {};
          for (const [k, ids] of Object.entries(d.checks)) checks[k] = ids.filter((id) => id !== habitId);
          return { ...d, habits: d.habits.filter((h) => h.id !== habitId), checks };
        });
      },
      setReflection(month, patch) {
        setData((d) => {
          const prev = d.reflections[month] ?? { mood: -1, note: '' };
          return { ...d, reflections: { ...d.reflections, [month]: { ...prev, ...patch } } };
        });
      },
      replaceData(next) {
        setData(next);
      },
    };
  }, [data]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider');
  return ctx;
}
