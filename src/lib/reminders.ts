'use client';

import { supabase } from './supabase';

/**
 * Recordatorios ("reminders") de una cita: una fecha y hora sueltas, sin hora fin.
 *
 * La tabla Appointment todavía no tiene columna propia, así que:
 *  - si existe `reminder_at` (timestamptz), se usa esa columna;
 *  - si no, el recordatorio viaja en `comments` con una marca al final
 *    que la interfaz nunca muestra: [REMINDER:2026-08-27T09:00].
 *
 * Para pasar al almacenamiento limpio basta con ejecutar una vez en Supabase:
 *   alter table "Appointment" add column reminder_at timestamptz;
 * La app lo detecta sola y deja de usar la marca.
 */

const MARKER = /\s*\[REMINDER:([^\]]+)\]/;

let columnAvailable: boolean | null = null;

export const hasReminderColumn = async (): Promise<boolean> => {
  if (columnAvailable !== null) return columnAvailable;
  const { error } = await supabase.from('Appointment').select('reminder_at').limit(1);
  columnAvailable = !error;
  return columnAvailable;
};

const pad = (n: number) => n.toString().padStart(2, '0');

/** "YYYY-MM-DDTHH:mm" en hora local, tal y como lo escriben los inputs. */
export const toLocalInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

type ReminderSource = { reminder_at?: string | null; comments?: string | null } | null | undefined;

/** Lee el recordatorio de una cita, venga de la columna o de la marca. */
export const readReminder = (appointment: ReminderSource): Date | null => {
  const raw = appointment?.reminder_at;
  if (raw) {
    const fromColumn = new Date(raw);
    if (!Number.isNaN(fromColumn.getTime())) return fromColumn;
  }
  const match = typeof appointment?.comments === 'string' ? appointment.comments.match(MARKER) : null;
  if (!match) return null;
  const fromMarker = new Date(match[1]);
  return Number.isNaN(fromMarker.getTime()) ? null : fromMarker;
};

/** Comentarios sin la marca técnica, que es lo que se muestra y se edita. */
export const stripReminderMarker = (comments?: string | null): string =>
  (comments ?? '').replace(MARKER, '').trimEnd();

/**
 * Campos que hay que guardar según dónde pueda vivir el recordatorio.
 * `date` y `time` son los valores de los inputs (YYYY-MM-DD y HH:mm).
 */
export const buildReminderPayload = async (
  date: string,
  time: string,
  comments: string
): Promise<{ comments: string; reminder_at?: string | null }> => {
  const clean = stripReminderMarker(comments);
  const hasBoth = Boolean(date && time);
  const useColumn = await hasReminderColumn();

  if (useColumn) {
    return {
      comments: clean,
      reminder_at: hasBoth ? new Date(`${date}T${time}`).toISOString() : null,
    };
  }

  return {
    comments: hasBoth ? `${clean}${clean ? '\n' : ''}[REMINDER:${date}T${time}]` : clean,
  };
};

/** Clave de día (YYYY-MM-DD) para agrupar recordatorios en el calendario. */
export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
