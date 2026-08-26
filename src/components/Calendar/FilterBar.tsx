'use client';

import {
  Settings,
  StatusFilterKey,
  clockInZone,
  effectiveLocalZone,
  hourLabel,
  updateSettings,
} from '../../lib/settings';
import { CANCELLED_VISUAL, REMINDER_VISUAL, STATUS_VISUALS } from '../../lib/statusStyles';
import { useNowTick } from '../../lib/useNowTick';

type Props = {
  settings: Settings;
  onOpenSettings: () => void;
};

const START_HOURS = Array.from({ length: 24 }, (_, hour) => hour);

export default function FilterBar({ settings, onOpenSettings }: Props) {
  useNowTick(); // refresca los relojes cada 15 s
  const now = new Date();
  const localZone = effectiveLocalZone(settings);

  const toggleStatus = (key: StatusFilterKey) =>
    updateSettings({
      statusFilters: { ...settings.statusFilters, [key]: !settings.statusFilters[key] },
    });

  const endHours = Array.from({ length: 24 - settings.dayStartHour }, (_, i) => settings.dayStartHour + 1 + i);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* Filtros por estado (también hacen de leyenda) */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(Object.keys(STATUS_VISUALS) as StatusFilterKey[]).map((key) => {
          const visual = STATUS_VISUALS[key];
          const active = settings.statusFilters[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleStatus(key)}
              aria-pressed={active}
              title={active ? `Ocultar ${visual.label.toLowerCase()}` : `Mostrar ${visual.label.toLowerCase()}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold shadow-sm transition-all duration-200 active:scale-95 ${
                active ? 'ring-1 ring-black/10' : 'border border-line bg-panel-2 opacity-60 hover:opacity-100'
              }`}
              style={active ? { background: visual.bg, color: visual.ink } : undefined}
            >
              <span
                aria-hidden
                className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black"
                style={{
                  background: active ? visual.accent : visual.bg,
                  color: active ? visual.ink : visual.ink,
                }}
              >
                {visual.icon}
              </span>
              <span className={active ? '' : 'text-ink-soft'}>{visual.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => updateSettings({ showReminders: !settings.showReminders })}
          aria-pressed={settings.showReminders}
          title="Mostrar los recordatorios sueltos"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold shadow-sm transition-all duration-200 active:scale-95 ${
            settings.showReminders
              ? 'ring-1 ring-black/10'
              : 'border border-line bg-panel-2 text-ink-soft opacity-60 hover:opacity-100'
          }`}
          style={settings.showReminders ? { background: REMINDER_VISUAL.bg, color: REMINDER_VISUAL.ink } : undefined}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
            <path d="M10.5 20a2 2 0 0 0 3 0" />
          </svg>
          Recordatorios
        </button>

        <button
          type="button"
          onClick={() => updateSettings({ showCancelled: !settings.showCancelled })}
          aria-pressed={settings.showCancelled}
          title="Mostrar las citas que se eliminaron"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold shadow-sm transition-all duration-200 active:scale-95 ${
            settings.showCancelled
              ? 'ring-1 ring-black/10'
              : 'border border-dashed border-line bg-panel-2 text-ink-soft opacity-70 hover:opacity-100'
          }`}
          style={settings.showCancelled ? { background: CANCELLED_VISUAL.bg, color: CANCELLED_VISUAL.ink } : undefined}
        >
          <span aria-hidden className="text-[11px] font-black">{CANCELLED_VISUAL.icon}</span>
          Canceladas
        </button>
      </div>

      {/* Franja de horas visible */}
      <div className="flex items-center gap-1.5 rounded-full border border-line bg-panel-2 px-3 py-1">
        <span className="hidden text-[12px] font-bold uppercase tracking-wide text-ink-soft sm:inline">Horario</span>
        <select
          aria-label="Hora de inicio del calendario"
          value={settings.dayStartHour}
          onChange={(e) => updateSettings({ dayStartHour: Number(e.target.value) })}
          className="rounded-md bg-transparent px-1 py-0.5 text-[13px] font-bold text-ink outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          {START_HOURS.map((hour) => (
            <option key={hour} value={hour}>{hourLabel(hour)}</option>
          ))}
        </select>
        <span className="text-[12px] font-semibold text-ink-soft">a</span>
        <select
          aria-label="Hora de fin del calendario"
          value={settings.dayEndHour}
          onChange={(e) => updateSettings({ dayEndHour: Number(e.target.value) })}
          className="rounded-md bg-transparent px-1 py-0.5 text-[13px] font-bold text-ink outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          {endHours.map((hour) => (
            <option key={hour} value={hour}>{hourLabel(hour)}</option>
          ))}
        </select>
      </div>

      {/* Relojes: el mío y el del despacho */}
      <div className="ml-auto flex items-center gap-2">
        {settings.showLocalNow && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel-2 px-3 py-1.5 text-[13px] font-bold text-ink"
            title={`${settings.localLabel} · ${localZone}`}
          >
            <span aria-hidden className="h-[3px] w-4 rounded-full" style={{ background: 'var(--now)' }} />
            <span className="hidden text-ink-soft xl:inline">{settings.localLabel}</span>
            <span className="tabular-nums">{clockInZone(now, localZone)}</span>
          </span>
        )}
        {settings.showLawyerNow && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel-2 px-3 py-1.5 text-[13px] font-bold text-ink"
            title={`${settings.lawyerLabel} · ${settings.lawyerTimeZone}`}
          >
            <span
              aria-hidden
              className="h-0 w-4"
              style={{ borderTop: '3px dashed var(--now-2)' }}
            />
            <span className="hidden text-ink-soft xl:inline">{settings.lawyerLabel}</span>
            <span className="tabular-nums">{clockInZone(now, settings.lawyerTimeZone)}</span>
          </span>
        )}

        <button
          type="button"
          onClick={onOpenSettings}
          title="Configuración"
          aria-label="Configuración"
          className="flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-[13px] font-bold text-ink shadow-sm transition-all duration-200 hover:border-brand hover:bg-brand-soft active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.87 1.2v.17a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 2.6 15a1.7 1.7 0 0 0-1.2-1.53H1.3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6h.08A1.7 1.7 0 0 0 10.6 3.4V3.3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.2 1.53h.17a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.53 1.2Z" />
          </svg>
          <span className="hidden lg:inline">Configuración</span>
        </button>
      </div>
    </div>
  );
}
