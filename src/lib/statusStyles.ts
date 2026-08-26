/**
 * Estilos por estado de cita.
 *
 * Los colores viven en variables CSS (globals.css) para que el modo oscuro
 * cambie solo, sin lógica de JS. Cada estado se distingue por TRES señales,
 * no solo por el color: tono, icono y etiqueta de texto.
 */

export type StatusVisual = {
  label: string;
  icon: string;
  bg: string;
  accent: string;
  ink: string;
};

/** Estado que usamos como "papelera": la cita se conserva pero queda cancelada. */
export const CANCELLED_STATUS = 'CANCELLED';

/** Tipo que guardamos en las franjas de "Not available" (el tipo no aplica). */
export const BLOCK_TYPE = 'NOT_AVAILABLE';

/** Título fijo de las franjas de no disponibilidad. */
export const BLOCK_TITLE = 'Not available';

/**
 * Entradas que no son citas, sino recordatorios sueltos ("acordarme de X").
 * Se distinguen por el campo `type`, que es texto libre en la tabla.
 */
export const REMINDER_TYPE = 'REMINDER';
export const REMINDER_STATUS = 'REMINDER';

/** Minutos que ocupa un recordatorio en la rejilla (no tiene hora de fin real). */
export const REMINDER_SLOT_MINUTES = 30;

/** Los tres estados que se pueden elegir a mano. */
export const STATUS_VISUALS: Record<string, StatusVisual> = {
  SCHEDULED: {
    label: 'Confirmada',
    icon: '✓',
    bg: 'var(--ev-green-bg)',
    accent: 'var(--ev-green-accent)',
    ink: 'var(--ev-green-ink)',
  },
  NOT_CONFIRMED: {
    label: 'Sin confirmar',
    icon: '?',
    bg: 'var(--ev-amber-bg)',
    accent: 'var(--ev-amber-accent)',
    ink: 'var(--ev-amber-ink)',
  },
  NOT_AVAILABLE: {
    label: 'No disponible',
    icon: '✕',
    bg: 'var(--ev-red-bg)',
    accent: 'var(--ev-red-accent)',
    ink: 'var(--ev-red-ink)',
  },
};

export const REMINDER_VISUAL: StatusVisual = {
  label: 'Recordatorio',
  icon: '!',
  bg: 'var(--rem-bg)',
  accent: 'var(--rem-accent)',
  ink: 'var(--rem-ink)',
};

export const CANCELLED_VISUAL: StatusVisual = {
  label: 'Cancelada',
  icon: '⌫',
  bg: 'var(--ev-slate-bg)',
  accent: 'var(--ev-slate-accent)',
  ink: 'var(--ev-slate-ink)',
};

export const DEFAULT_VISUAL: StatusVisual = {
  label: 'Otro',
  icon: '•',
  bg: 'var(--ev-blue-bg)',
  accent: 'var(--ev-blue-accent)',
  ink: 'var(--ev-blue-ink)',
};

export const visualFor = (status?: string | null): StatusVisual => {
  if (status === CANCELLED_STATUS) return CANCELLED_VISUAL;
  if (status === REMINDER_STATUS) return REMINDER_VISUAL;
  return (status && STATUS_VISUALS[status]) || DEFAULT_VISUAL;
};

export const isCancelled = (status?: string | null) => status === CANCELLED_STATUS;
export const isBlock = (status?: string | null) => status === 'NOT_AVAILABLE';

/** ¿Es un recordatorio suelto en lugar de una cita? Lo marca el campo `type`. */
export const isReminderEntry = (appointment?: { type?: string | null } | null) =>
  appointment?.type === REMINDER_TYPE;
