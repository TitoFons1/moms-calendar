'use client';

import { useEffect, useMemo } from 'react';
import {
  Settings,
  StatusFilterKey,
  browserTimeZone,
  clockInZone,
  effectiveLocalZone,
  hourLabel,
  resetSettings,
  timeZoneOptions,
  updateSettings,
  zoneOffsetLabel,
} from '../../lib/settings';
import { CANCELLED_VISUAL, STATUS_VISUALS } from '../../lib/statusStyles';
import { useNowTick } from '../../lib/useNowTick';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
};

const FIELD =
  'w-full rounded-xl border border-line bg-panel p-2.5 text-[15px] font-medium text-ink shadow-sm outline-none transition-all duration-200 focus:border-brand focus:ring-4 focus:ring-[var(--ring)]';
const LABEL = 'mb-1.5 block text-[13.5px] font-semibold text-ink';
const SECTION_TITLE = 'text-[12px] font-bold uppercase tracking-wider text-ink-soft';

const Toggle = ({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between gap-4 rounded-xl border border-line bg-panel-2 px-3.5 py-2.5 text-left transition-all duration-200 hover:border-brand active:scale-[0.99]"
  >
    <span>
      <span className="block text-[14px] font-semibold text-ink">{label}</span>
      {hint && <span className="block text-[12.5px] text-ink-soft">{hint}</span>}
    </span>
    <span
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-brand' : 'bg-line'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </span>
  </button>
);

export default function SettingsPanel({ isOpen, onClose, settings }: Props) {
  useNowTick();
  const zones = useMemo(() => timeZoneOptions(), []);
  const localZone = effectiveLocalZone(settings);
  const now = new Date();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const endHours = Array.from({ length: 24 - settings.dayStartHour }, (_, i) => settings.dayStartHour + 1 + i);

  return (
    <div
      className="anim-fade-in absolute inset-0 z-[60] flex items-center justify-center rounded-3xl bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Configuración"
        className="anim-pop-in flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[var(--shadow-pop)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-ink">Configuración</h2>
            <p className="text-[13.5px] text-ink-soft">Zonas horarias, horario visible y filtros</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-2xl leading-none text-ink-soft transition-all duration-200 hover:bg-brand-soft hover:text-ink active:scale-90"
          >
            &times;
          </button>
        </div>

        <div className="min-h-0 space-y-6 overflow-y-auto p-5">
          {/* ---------------- Relojes ---------------- */}
          <section className="space-y-3">
            <h3 className={SECTION_TITLE}>Relojes e indicadores de la hora actual</h3>

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-panel-2 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-[15px] font-bold text-ink">
                <span aria-hidden className="h-[3px] w-5 rounded-full" style={{ background: 'var(--now)' }} />
                {settings.localLabel}: <span className="tabular-nums">{clockInZone(now, localZone)}</span>
              </span>
              <span className="text-ink-soft">|</span>
              <span className="inline-flex items-center gap-2 text-[15px] font-bold text-ink">
                <span aria-hidden className="h-0 w-5" style={{ borderTop: '3px dashed var(--now-2)' }} />
                {settings.lawyerLabel}: <span className="tabular-nums">{clockInZone(now, settings.lawyerTimeZone)}</span>
              </span>
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[12.5px] font-bold text-brand">
                Diferencia: {zoneOffsetLabel(now, localZone, settings.lawyerTimeZone)}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={LABEL}>Mi zona horaria</label>
                <select
                  className={FIELD}
                  value={settings.localTimeZone}
                  onChange={(event) => updateSettings({ localTimeZone: event.target.value })}
                >
                  <option value="">Automática ({browserTimeZone()})</option>
                  {zones.map((zone) => (
                    <option key={`local-${zone.value}`} value={zone.value}>{zone.label}</option>
                  ))}
                </select>
                <input
                  className={`${FIELD} mt-2`}
                  value={settings.localLabel}
                  onChange={(event) => updateSettings({ localLabel: event.target.value })}
                  placeholder="Nombre del reloj (ej. Mi hora)"
                />
              </div>

              <div>
                <label className={LABEL}>Zona horaria del despacho</label>
                <select
                  className={FIELD}
                  value={settings.lawyerTimeZone}
                  onChange={(event) => updateSettings({ lawyerTimeZone: event.target.value })}
                >
                  {zones.map((zone) => (
                    <option key={`lawyer-${zone.value}`} value={zone.value}>{zone.label}</option>
                  ))}
                </select>
                <input
                  className={`${FIELD} mt-2`}
                  value={settings.lawyerLabel}
                  onChange={(event) => updateSettings({ lawyerLabel: event.target.value })}
                  placeholder="Nombre del reloj (ej. Oficina de Miami)"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Toggle
                label="Línea de mi hora"
                hint="Línea continua roja sobre el calendario"
                checked={settings.showLocalNow}
                onChange={(next) => updateSettings({ showLocalNow: next })}
              />
              <Toggle
                label="Línea de la hora del despacho"
                hint="Línea discontinua violeta"
                checked={settings.showLawyerNow}
                onChange={(next) => updateSettings({ showLawyerNow: next })}
              />
            </div>
          </section>

          {/* ---------------- Horario visible ---------------- */}
          <section className="space-y-3">
            <h3 className={SECTION_TITLE}>Horario visible del calendario</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={LABEL}>Mostrar desde</label>
                <select
                  className={FIELD}
                  value={settings.dayStartHour}
                  onChange={(event) => updateSettings({ dayStartHour: Number(event.target.value) })}
                >
                  {Array.from({ length: 24 }, (_, hour) => hour).map((hour) => (
                    <option key={hour} value={hour}>{hourLabel(hour)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Mostrar hasta</label>
                <select
                  className={FIELD}
                  value={settings.dayEndHour}
                  onChange={(event) => updateSettings({ dayEndHour: Number(event.target.value) })}
                >
                  {endHours.map((hour) => (
                    <option key={hour} value={hour}>{hourLabel(hour)}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ---------------- Filtros ---------------- */}
          <section className="space-y-3">
            <h3 className={SECTION_TITLE}>Qué se ve en el calendario</h3>
            <div className="flex flex-wrap gap-2.5">
              {(Object.keys(STATUS_VISUALS) as StatusFilterKey[]).map((key) => {
                const visual = STATUS_VISUALS[key];
                const active = settings.statusFilters[key];
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      updateSettings({
                        statusFilters: { ...settings.statusFilters, [key]: !active },
                      })
                    }
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold shadow-sm transition-all duration-200 active:scale-95 ${
                      active ? '' : 'border border-line bg-panel-2 text-ink-soft opacity-60 hover:opacity-100'
                    }`}
                    style={active ? { background: visual.bg, color: visual.ink } : undefined}
                  >
                    <span aria-hidden className="text-[12px] font-black">{visual.icon}</span>
                    {visual.label}
                  </button>
                );
              })}
            </div>
            <Toggle
              label="Mostrar los recordatorios"
              hint="Los avisos sueltos que no son citas"
              checked={settings.showReminders}
              onChange={(next) => updateSettings({ showReminders: next })}
            />
            <Toggle
              label="Mostrar las canceladas"
              hint="Las citas que se eliminan se guardan y pueden restaurarse"
              checked={settings.showCancelled}
              onChange={(next) => updateSettings({ showCancelled: next })}
            />
            <p className="text-[12.5px] text-ink-soft">
              Las canceladas se muestran en gris ({CANCELLED_VISUAL.icon}) y con el texto tachado.
            </p>
          </section>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-panel-2 px-5 py-3.5">
          <button
            type="button"
            onClick={resetSettings}
            className="rounded-xl border border-line bg-panel px-4 py-2.5 text-[14px] font-bold text-ink-soft shadow-sm transition-all duration-200 hover:text-ink active:scale-95"
          >
            Restaurar valores por defecto
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-brand px-5 py-2.5 text-[14px] font-bold text-white shadow-sm transition-all duration-200 hover:brightness-110 active:scale-95"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
