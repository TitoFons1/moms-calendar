'use client';

import { useSyncExternalStore } from 'react';

/**
 * Preferencias de la aplicación (zonas horarias, horario visible y filtros).
 * Viven en localStorage y se leen con useSyncExternalStore para que cualquier
 * componente vea siempre el mismo valor sin efectos que cambien estado.
 */

export type StatusFilterKey = 'SCHEDULED' | 'NOT_CONFIRMED' | 'NOT_AVAILABLE';

export type Settings = {
  /** Zona horaria propia. Vacío = la del ordenador. */
  localTimeZone: string;
  localLabel: string;
  /** Zona horaria del despacho / la abogada. */
  lawyerTimeZone: string;
  lawyerLabel: string;
  showLocalNow: boolean;
  showLawyerNow: boolean;
  /** Franja de horas que se muestra en el calendario (0-24). */
  dayStartHour: number;
  dayEndHour: number;
  statusFilters: Record<StatusFilterKey, boolean>;
  showReminders: boolean;
  showCancelled: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  localTimeZone: '',
  localLabel: 'Mi hora',
  lawyerTimeZone: 'America/New_York',
  lawyerLabel: 'Oficina (Miami)',
  showLocalNow: true,
  showLawyerNow: true,
  dayStartHour: 0,
  dayEndHour: 24,
  statusFilters: { SCHEDULED: true, NOT_CONFIRMED: true, NOT_AVAILABLE: true },
  showReminders: true,
  showCancelled: false,
};

const KEY = 'moms-calendar-settings';

let cache: Settings | null = null;
const listeners = new Set<() => void>();

const sanitize = (raw: unknown): Settings => {
  const value = (raw ?? {}) as Partial<Settings>;
  const start = Number.isInteger(value.dayStartHour) ? Math.min(23, Math.max(0, value.dayStartHour as number)) : DEFAULT_SETTINGS.dayStartHour;
  const endRaw = Number.isInteger(value.dayEndHour) ? Math.min(24, Math.max(1, value.dayEndHour as number)) : DEFAULT_SETTINGS.dayEndHour;
  return {
    ...DEFAULT_SETTINGS,
    ...value,
    dayStartHour: start,
    dayEndHour: endRaw > start ? endRaw : Math.min(24, start + 1),
    statusFilters: { ...DEFAULT_SETTINGS.statusFilters, ...(value.statusFilters ?? {}) },
  };
};

export const readSettings = (): Settings => {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = sanitize(raw ? JSON.parse(raw) : {});
  } catch {
    cache = DEFAULT_SETTINGS;
  }
  return cache;
};

const readServerSettings = (): Settings => DEFAULT_SETTINGS;

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      cache = null;
      onChange();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
};

export const updateSettings = (patch: Partial<Settings>) => {
  cache = sanitize({ ...readSettings(), ...patch });
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* modo privado: los cambios valen solo para esta sesión */
  }
  listeners.forEach((listener) => listener());
};

export const resetSettings = () => updateSettings(DEFAULT_SETTINGS);

export const useSettings = (): Settings =>
  useSyncExternalStore(subscribe, readSettings, readServerSettings);

/* ---------- Utilidades de horas y zonas ---------- */

/**
 * Etiqueta de una hora del día.
 *
 * `short` es para los selectores estrechos: un <select> se dimensiona con su
 * opción más larga, asi que «12 AM (fin del día)» dejaba un hueco vacío a la
 * derecha con cualquier otra hora elegida.
 */
export const hourLabel = (hour: number, short = false): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour === 24) return short ? '12 AM' : '12 AM (fin del día)';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
};

export const browserTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const effectiveLocalZone = (settings: Settings): string =>
  settings.localTimeZone || browserTimeZone();

/** Minutos desde medianoche que marca el reloj de esa zona en este instante. */
export const minutesInZone = (date: Date, timeZone: string): number => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(date);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    return hour * 60 + minute;
  } catch {
    return date.getHours() * 60 + date.getMinutes();
  }
};

/** Hora en formato 12 h de esa zona (ej. "4:12 PM"). */
export const clockInZone = (date: Date, timeZone: string): string => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return '--:--';
  }
};

/** Diferencia en horas entre dos zonas (ej. "-6 h"). */
export const zoneOffsetLabel = (date: Date, from: string, to: string): string => {
  const diffMinutes = minutesInZone(date, to) - minutesInZone(date, from);
  const wrapped = ((diffMinutes + 720 + 1440) % 1440) - 720;
  if (wrapped === 0) return 'misma hora';
  const sign = wrapped > 0 ? '+' : '−';
  const abs = Math.abs(wrapped);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''} h`;
};

/** Zonas más habituales primero; después, todas las que conozca el navegador. */
export const timeZoneOptions = (): { value: string; label: string }[] => {
  const curated: [string, string][] = [
    ['America/New_York', 'Nueva York / Miami (Este)'],
    ['America/Chicago', 'Chicago / Houston (Centro)'],
    ['America/Denver', 'Denver (Montaña)'],
    ['America/Phoenix', 'Phoenix (Arizona)'],
    ['America/Los_Angeles', 'Los Ángeles (Pacífico)'],
    ['America/Puerto_Rico', 'Puerto Rico'],
    ['America/Santo_Domingo', 'Santo Domingo'],
    ['America/Mexico_City', 'Ciudad de México'],
    ['America/Bogota', 'Bogotá'],
    ['America/Caracas', 'Caracas'],
    ['America/Lima', 'Lima'],
    ['America/Argentina/Buenos_Aires', 'Buenos Aires'],
    ['Europe/Madrid', 'Madrid'],
    ['Europe/London', 'Londres'],
    ['UTC', 'UTC'],
  ];
  const seen = new Set(curated.map(([value]) => value));
  const options = curated.map(([value, label]) => ({ value, label: `${label} — ${value}` }));

  try {
    const all = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] })
      .supportedValuesOf?.('timeZone') ?? [];
    all.forEach((zone) => {
      if (!seen.has(zone)) options.push({ value: zone, label: zone.replace(/_/g, ' ') });
    });
  } catch {
    /* navegador sin Intl.supportedValuesOf: nos quedamos con la lista corta */
  }
  return options;
};
