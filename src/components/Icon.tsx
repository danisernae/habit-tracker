import type { ReactElement } from 'react';
import type { HabitIcon } from '../lib/palette';

/** Íconos de trazo (los mismos del diseño). Decorativos: el texto al lado ya dice qué son. */
const PATHS: Record<HabitIcon | 'plus' | 'check' | 'left' | 'right' | 'sun' | 'calendar' | 'chart' | 'plate' | 'minus' | 'close', ReactElement> = {
  agua: <path d="M12 3c-3.5 4.5-6 7.8-6 11a6 6 0 0 0 12 0c0-3.2-2.5-6.5-6-11z" />,
  ejercicio: <path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11" />,
  dieta: (
    <>
      <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z" />
      <path d="M5 19l8-8" />
    </>
  ),
  sinAzucar: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2.5" />
      <path d="M4 4l16 16" />
    </>
  ),
  skincare: (
    <>
      <path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z" />
      <path d="M19 15v5M16.5 17.5h5" />
    </>
  ),
  lectura: (
    <>
      <path d="M4 5.5C6.5 4.5 9.5 4.5 12 6.5c2.5-2 5.5-2 8-1v13c-2.5-1-5.5-1-8 1-2.5-2-5.5-2-8-1z" />
      <path d="M12 6.5v13" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  chart: <path d="M5 20V11M12 20V5M19 20v-6" />,
  plate: (
    <>
      <circle cx="13" cy="12" r="6.5" />
      <circle cx="13" cy="12" r="3" />
      <path d="M4 4v6M2.5 4v3.5a1.5 1.5 0 0 0 3 0V4M4 10v10" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, strokeWidth = 2 }: { name: IconName; size?: number; strokeWidth?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}
