'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, momentLocalizer, View, Formats, NavigateAction } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AppointmentModal from '../Modals/AppointmentModal';
import SettingsPanel from '../Settings/SettingsPanel';
import FilterBar from './FilterBar';
import NowIndicators from './NowIndicators';
import { supabase } from '../../lib/supabase';
import { APPOINTMENT_TYPES } from '../../lib/appointmentConstants';
import { BLOCK_TYPE, REMINDER_TYPE, isBlock, isCancelled, isReminderEntry, visualFor } from '../../lib/statusStyles';
import { StatusFilterKey, effectiveLocalZone, useSettings } from '../../lib/settings';
import { dayKey, readReminder } from '../../lib/reminders';

moment.locale('es');
const localizer = momentLocalizer(moment);

const VIEWS: View[] = ['month', 'week', 'day', 'agenda'];
const VIEW_LABELS: Record<string, string> = {
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
};

const typeLabel = (type?: string) => {
  if (!type || type === BLOCK_TYPE || type === REMINDER_TYPE) return '';
  return APPOINTMENT_TYPES[type as keyof typeof APPOINTMENT_TYPES]?.name || type;
};

/* ---------- Formatos: siempre 12 horas (AM / PM) ---------- */
const time12 = (date: Date) => moment(date).format('h:mm A');

const CALENDAR_FORMATS: Formats = {
  timeGutterFormat: 'h A',
  eventTimeRangeFormat: ({ start, end }) => `${time12(start)} – ${time12(end)}`,
  selectRangeFormat: ({ start, end }) => `${time12(start)} – ${time12(end)}`,
  agendaTimeFormat: 'h:mm A',
  agendaTimeRangeFormat: ({ start, end }) => `${time12(start)} – ${time12(end)}`,
  agendaDateFormat: 'ddd D MMM',
  dateFormat: 'D',
  dayFormat: 'ddd D',
  monthHeaderFormat: 'MMMM [de] YYYY',
  dayHeaderFormat: 'dddd, D [de] MMMM',
  dayRangeHeaderFormat: ({ start, end }) => {
    const a = moment(start);
    const b = moment(end);
    if (a.month() === b.month()) return `${a.format('D')} – ${b.format('D [de] MMMM, YYYY')}`;
    if (a.year() === b.year()) return `${a.format('D [de] MMM')} – ${b.format('D [de] MMM, YYYY')}`;
    return `${a.format('D MMM YYYY')} – ${b.format('D MMM YYYY')}`;
  },
};

const MESSAGES = {
  today: 'Hoy',
  previous: 'Anterior',
  next: 'Siguiente',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Cita',
  allDay: 'Todo el día',
  noEventsInRange: 'No hay citas en estas fechas.',
  showMore: (total: number) => `+${total} más`,
};

/* ---------- Barra superior estilo Google Calendar ---------- */
const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'left' ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
  </svg>
);

const Bell = ({ className = 'h-3 w-3' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10.5 20a2 2 0 0 0 3 0" />
  </svg>
);

type ToolbarBits = {
  label: string;
  view: View;
  onNavigate: (action: NavigateAction) => void;
  onView: (view: View) => void;
};

const CustomToolbar = ({ label, view, onNavigate, onView }: ToolbarBits) => (
  <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
    <button
      type="button"
      onClick={() => onNavigate('TODAY')}
      className="rounded-full border border-line bg-panel px-4 py-2 text-[14px] font-bold text-ink shadow-sm transition-all duration-200 hover:border-brand hover:bg-brand-soft active:scale-95"
    >
      Hoy
    </button>

    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Anterior"
        title="Anterior"
        onClick={() => onNavigate('PREV')}
        className="rounded-full p-2 text-ink-soft transition-all duration-200 hover:bg-brand-soft hover:text-ink active:scale-90"
      >
        <Chevron dir="left" />
      </button>
      <button
        type="button"
        aria-label="Siguiente"
        title="Siguiente"
        onClick={() => onNavigate('NEXT')}
        className="rounded-full p-2 text-ink-soft transition-all duration-200 hover:bg-brand-soft hover:text-ink active:scale-90"
      >
        <Chevron dir="right" />
      </button>
    </div>

    <h2 className="min-w-0 flex-1 truncate text-lg font-bold text-ink first-letter:uppercase sm:text-xl">
      {label}
    </h2>

    <div className="flex items-center gap-1 rounded-full border border-line bg-panel p-1 shadow-sm">
      {VIEWS.map((name) => {
        const active = view === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onView(name)}
            aria-pressed={active}
            className={`rounded-full px-3.5 py-1.5 text-[14px] font-bold transition-all duration-200 active:scale-95 ${
              active ? 'bg-brand text-white shadow-sm' : 'text-ink-soft hover:bg-brand-soft hover:text-ink'
            }`}
          >
            {VIEW_LABELS[name]}
          </button>
        );
      })}
    </div>
  </div>
);

/* ---------- Cabecera de los nombres de día en la vista de mes ---------- */
const MonthColumnHeader = ({ date }: { date: Date }) => (
  <span className="text-[13px] font-bold uppercase tracking-wider text-ink-soft">
    {moment(date).format('ddd').replace('.', '')}
  </span>
);

export default function CalendarView() {
  const settings = useSettings();
  const rootRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('week');

  const fetchAppointments = async () => {
    const { data, error } = await supabase.from('Appointment').select('*');
    if (error) {
      console.error('Error descargando citas:', error);
      return;
    }
    if (data) {
      const formattedEvents = data.map((appt) => ({
        id: appt.id,
        title: appt.client_name,
        start: new Date(appt.start_time),
        end: new Date(appt.end_time),
        originalData: appt,
      }));
      setEvents(formattedEvents);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedAppointment(null);
    setSelectedDate(slotInfo.start);
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedAppointment(event.originalData);
    setIsModalOpen(true);
  };

  // Franja visible: la que se elija en los filtros / configuración
  const dayBounds = useMemo(() => {
    const base = moment().startOf('day');
    const start = base.clone().add(settings.dayStartHour, 'hours');
    const end =
      settings.dayEndHour >= 24
        ? base.clone().endOf('day')
        : base.clone().add(settings.dayEndHour, 'hours');
    const scrollHour = Math.min(Math.max(settings.dayStartHour, 8), Math.max(settings.dayEndHour - 1, 0));
    return {
      min: start.toDate(),
      max: end.toDate(),
      scrollTo: base.clone().add(scrollHour, 'hours').toDate(),
    };
  }, [settings.dayStartHour, settings.dayEndHour]);

  // Filtros por estado + papelera de canceladas
  const visibleEvents = useMemo(
    () =>
      events.filter((event) => {
        const status = event.originalData?.status as string | undefined;
        if (isCancelled(status)) return settings.showCancelled;
        if (isReminderEntry(event.originalData)) return settings.showReminders;
        if (status && status in settings.statusFilters) {
          return settings.statusFilters[status as StatusFilterKey];
        }
        return true;
      }),
    [events, settings.showCancelled, settings.showReminders, settings.statusFilters]
  );

  // Recordatorios agrupados por día (para el indicador discreto de la cabecera)
  const remindersByDay = useMemo(() => {
    const map = new Map<string, { at: Date; title: string }[]>();
    visibleEvents.forEach((event) => {
      // Un recordatorio suelto cuenta en su propio día; una cita, en el día de su aviso
      const at = isReminderEntry(event.originalData)
        ? new Date(event.start)
        : readReminder(event.originalData);
      if (!at) return;
      const key = dayKey(at);
      const list = map.get(key) ?? [];
      list.push({ at, title: event.originalData?.client_name ?? 'Cita' });
      map.set(key, list);
    });
    map.forEach((list) => list.sort((a, b) => a.at.getTime() - b.at.getTime()));
    return map;
  }, [visibleEvents]);

  /** Chapita pequeña: "hay N recordatorios este día". El detalle va en el tooltip. */
  const ReminderBadge = ({ date, className = '' }: { date: Date; className?: string }) => {
    const list = remindersByDay.get(dayKey(date));
    if (!list?.length) return null;
    const detail = list
      .map((item) => `• ${moment(item.at).format('h:mm A')} — ${item.title}`)
      .join('\n');
    return (
      <span
        title={`${list.length === 1 ? 'Recordatorio' : 'Recordatorios'}:\n${detail}`}
        aria-label={`${list.length} recordatorio(s) este día`}
        className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-[1px] text-[10px] font-black leading-none shadow-sm ${className}`}
        style={{ background: 'var(--rem-bg)', color: 'var(--rem-ink)' }}
      >
        <Bell className="h-[10px] w-[10px]" />
        {list.length}
      </span>
    );
  };

  /** Cabecera de día con el aviso de recordatorios al lado del número. */
  const DayHeaderWithReminders = ({ date }: { date: Date }) => {
    const isToday = moment(date).isSame(moment(), 'day');
    return (
      <div className="flex flex-col items-center gap-0.5 py-1">
        <span className={`text-[12px] font-bold uppercase tracking-wider ${isToday ? 'text-brand' : 'text-ink-soft'}`}>
          {moment(date).format('ddd').replace('.', '')}
        </span>
        <span className="flex items-center gap-1">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full text-[18px] font-bold transition-colors duration-200 ${
              isToday ? 'bg-brand text-white shadow-sm' : 'text-ink'
            }`}
          >
            {moment(date).format('D')}
          </span>
          <ReminderBadge date={date} />
        </span>
      </div>
    );
  };

  /** Número de día del mes, con el mismo aviso discreto. */
  const MonthDateHeader = ({
    label,
    date,
    onDrillDown,
  }: {
    label: string;
    date: Date;
    onDrillDown?: () => void;
  }) => (
    <div className="flex items-center justify-end gap-1">
      <ReminderBadge date={date} />
      <button type="button" className="rbc-button-link" onClick={onDrillDown}>
        {label}
      </button>
    </div>
  );

  // El color lo pinta la tarjeta interior; aquí solo dejamos el hueco limpio
  const eventStyleGetter = () => ({
    style: { backgroundColor: 'transparent', border: 'none', padding: 0, boxShadow: 'none' },
  });

  const tooltipAccessor = (event: any) =>
    [
      `${time12(event.start)} – ${time12(event.end)}`,
      event.originalData?.client_name ?? '',
      typeLabel(event.originalData?.type),
      visualFor(event.originalData?.status).label,
    ]
      .filter(Boolean)
      .join('\n');

  /* ---------- Tarjeta de cita (día / semana) ---------- */
  const CustomEvent = ({ event }: any) => {
    const status = event.originalData?.status as string | undefined;
    const visual = visualFor(status);
    const cancelled = isCancelled(status);
    const block = isBlock(status);
    const minutes = (event.end.getTime() - event.start.getTime()) / 60000;
    const compact = minutes < 45;
    const showType = minutes >= 60 && !block && !!typeLabel(event.originalData?.type);
    const name = event.originalData?.client_name;
    const hasReminder = Boolean(readReminder(event.originalData));
    const reminderEntry = isReminderEntry(event.originalData);

    // Recordatorio suelto: una sola línea, sin ocupar más de lo necesario
    if (reminderEntry) {
      return (
        <div className="h-full w-full pr-[3px] pb-[2px]">
          <div
            className={`ev-card flex h-full w-full items-center gap-1.5 overflow-hidden rounded-[10px] px-2 shadow-sm ${
              cancelled ? 'ev-card--cancelled' : ''
            }`}
            style={{
              background: visual.bg,
              color: visual.ink,
              borderLeft: `4px solid ${visual.accent}`,
            }}
          >
            <Bell className="h-3 w-3 shrink-0" />
            <span className="whitespace-nowrap text-[11.5px] font-bold leading-none">
              {moment(event.start).format('h:mm A')}
            </span>
            <span className={`truncate text-[12.5px] font-bold leading-none ${cancelled ? 'line-through' : ''}`}>
              {name}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full w-full pr-[3px] pb-[2px]">
        <div
          className={`ev-card flex h-full w-full flex-col overflow-hidden rounded-[10px] px-2 py-1 shadow-sm ${
            cancelled ? 'ev-card--cancelled' : ''
          }`}
          style={{
            background: visual.bg,
            color: visual.ink,
            borderLeft: `4px solid ${visual.accent}`,
          }}
        >
          {compact ? (
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span
                aria-hidden
                className="ev-when-roomy flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                style={{ background: visual.accent, color: visual.ink }}
              >
                {visual.icon}
              </span>
              {hasReminder && <Bell className="ev-when-roomy h-3 w-3 shrink-0 opacity-90" />}
              <span className={`truncate text-[13px] font-bold leading-none ${cancelled ? 'line-through' : ''}`}>
                {name}
              </span>
              <span className="ev-when-wide ml-auto whitespace-nowrap text-[11px] font-semibold leading-none opacity-90">
                {moment(event.start).format('h:mm A')}
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="ev-when-roomy flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                  style={{ background: visual.accent, color: visual.ink }}
                >
                  {visual.icon}
                </span>
                <span className="whitespace-nowrap text-[12px] font-bold leading-none">
                  {time12(event.start)}
                  <span className="ev-when-wide"> – {time12(event.end)}</span>
                </span>
                {hasReminder && <Bell className="ml-auto h-3 w-3 shrink-0 opacity-90" />}
              </div>
              <span className={`mt-1 truncate text-[15px] font-bold leading-tight ${cancelled ? 'line-through' : ''}`}>
                {name}
              </span>
              {showType && (
                <span className="truncate text-[12.5px] font-medium leading-tight opacity-90">
                  {typeLabel(event.originalData?.type)}
                </span>
              )}
              {cancelled && minutes >= 60 && (
                <span className="truncate text-[11.5px] font-bold uppercase tracking-wide opacity-90">
                  Cancelada
                </span>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  /* ---------- Cita en vista de mes (una sola línea) ---------- */
  const MonthEvent = ({ event }: any) => {
    const status = event.originalData?.status as string | undefined;
    const visual = visualFor(status);
    const cancelled = isCancelled(status);
    const hasReminder = Boolean(readReminder(event.originalData));
    return (
      <div
        className={`ev-card flex items-center gap-1.5 overflow-hidden rounded-md px-1.5 py-[3px] ${
          cancelled ? 'ev-card--cancelled' : ''
        }`}
        style={{ background: visual.bg, color: visual.ink }}
      >
        <span aria-hidden className="text-[10px] font-black leading-none opacity-90">
          {visual.icon}
        </span>
        <span className="whitespace-nowrap text-[11.5px] font-bold leading-none">
          {moment(event.start).format('h:mm A')}
        </span>
        <span className={`truncate text-[12.5px] font-semibold leading-none ${cancelled ? 'line-through' : ''}`}>
          {event.originalData?.client_name}
        </span>
        {hasReminder && <Bell className="ml-auto h-[11px] w-[11px] shrink-0 opacity-90" />}
      </div>
    );
  };

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-0 flex-col rounded-3xl border border-line bg-panel p-3 shadow-[var(--shadow-card)] transition-colors duration-300 sm:p-4"
    >
      <FilterBar settings={settings} onOpenSettings={() => setIsSettingsOpen(true)} />

      <Calendar
        localizer={localizer}
        events={visibleEvents}
        formats={CALENDAR_FORMATS}
        messages={MESSAGES}
        views={VIEWS}
        date={currentDate}
        onNavigate={(newDate) => setCurrentDate(newDate)}
        view={currentView}
        onView={(newView) => setCurrentView(newView)}
        startAccessor="start"
        endAccessor="end"
        tooltipAccessor={tooltipAccessor}
        min={dayBounds.min}
        max={dayBounds.max}
        scrollToTime={dayBounds.scrollTo}
        step={30}
        timeslots={2}
        dayLayoutAlgorithm="no-overlap"
        popup
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar,
          event: CustomEvent,
          week: { header: DayHeaderWithReminders },
          day: { header: DayHeaderWithReminders },
          month: { header: MonthColumnHeader, dateHeader: MonthDateHeader, event: MonthEvent },
        }}
        style={{ flex: 1, minHeight: 0 }}
      />

      <NowIndicators
        rootRef={rootRef}
        view={currentView}
        startHour={settings.dayStartHour}
        endHour={settings.dayEndHour}
        localTimeZone={effectiveLocalZone(settings)}
        localLabel={settings.localLabel}
        lawyerTimeZone={settings.lawyerTimeZone}
        lawyerLabel={settings.lawyerLabel}
        showLocal={settings.showLocalNow}
        showLawyer={settings.showLawyerNow}
      />

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        selectedAppointment={selectedAppointment}
        onSaveSuccess={fetchAppointments}
      />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
      />
    </div>
  );
}
