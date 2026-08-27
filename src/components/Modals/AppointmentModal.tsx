'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { APPOINTMENT_TYPES, AppointmentTypeId, AppointmentStatusId } from '../../lib/appointmentConstants';
import { supabase } from '../../lib/supabase';
import {
  BLOCK_TITLE,
  BLOCK_TYPE,
  CANCELLED_STATUS,
  CANCELLED_VISUAL,
  REMINDER_SLOT_MINUTES,
  REMINDER_STATUS,
  REMINDER_TYPE,
  REMINDER_VISUAL,
  STATUS_VISUALS,
  isReminderEntry,
  visualFor,
} from '../../lib/statusStyles';
import {
  buildReminderPayload,
  readReminder,
  stripReminderMarker,
  toLocalInputValue,
} from '../../lib/reminders';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedAppointment?: any | null;
  onSaveSuccess: () => void;
}

type EntryKind = 'APPOINTMENT' | 'REMINDER';

// Actualizamos la estructura de datos
interface FormData {
  entryKind: EntryKind;
  title: string;
  type: AppointmentTypeId | '';
  status: AppointmentStatusId | '';
  date: string;         // YYYY-MM-DD
  startTime: string;    // HH:mm
  endTime: string;      // HH:mm
  reminderDate: string; // YYYY-MM-DD (aviso de una cita, opcional)
  reminderTime: string; // HH:mm (aviso de una cita, opcional)
  comments: string;
}

// Estilos compartidos de los campos (legibles y con foco muy visible)
const FIELD =
  'w-full rounded-xl border border-line bg-panel p-2.5 text-[14.5px] font-medium text-ink shadow-sm outline-none transition-all duration-200 focus:border-brand focus:ring-4 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:border-line disabled:bg-panel-2 disabled:text-ink-soft disabled:shadow-none';
const FIELD_LOCKED =
  'w-full cursor-not-allowed rounded-xl border border-line bg-panel-2 p-2.5 text-[14.5px] font-semibold text-ink-soft shadow-none outline-none';
const LABEL = 'mb-1 block text-[13px] font-semibold text-ink';
const LABEL_MUTED = 'mb-1 block text-[13px] font-semibold text-ink-soft';
const CHIP =
  'rounded-lg border border-line bg-panel px-2.5 py-1.5 text-[12.5px] font-bold text-ink-soft shadow-sm transition-all duration-200 hover:border-brand hover:text-ink active:scale-95';

const CalendarIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9.5h18M8 3v3M16 3v3" />
  </svg>
);

const BellIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10.5 20a2 2 0 0 0 3 0" />
  </svg>
);

export default function AppointmentModal({ isOpen, onClose, selectedDate, selectedAppointment, onSaveSuccess }: AppointmentModalProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>();

  // Helpers para manejar fechas y horas
  const pad = (n: number) => n.toString().padStart(2, '0');

  const addMinutesToTime = (timeStr: string, mins: number) => {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMins = h * 60 + m + mins;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    return `${pad(endH)}:${pad(endM)}`;
  };

  useEffect(() => {
    if (isOpen) {
      reset();

      if (selectedAppointment) {
        // MODO EDICIÓN
        const reminderEntry = isReminderEntry(selectedAppointment);
        setValue('entryKind', reminderEntry ? 'REMINDER' : 'APPOINTMENT');
        setValue('title', selectedAppointment.client_name);
        setValue('type', selectedAppointment.type as AppointmentTypeId);
        setValue('status', selectedAppointment.status as AppointmentStatusId || 'NOT_CONFIRMED');
        setValue('comments', stripReminderMarker(selectedAppointment.comments));

        // Extraemos Fecha, Hora Inicio y Hora Fin
        const startLocal = new Date(selectedAppointment.start_time);
        const endLocal = new Date(selectedAppointment.end_time);

        setValue('date', `${startLocal.getFullYear()}-${pad(startLocal.getMonth() + 1)}-${pad(startLocal.getDate())}`);
        setValue('startTime', `${pad(startLocal.getHours())}:${pad(startLocal.getMinutes())}`);
        setValue('endTime', `${pad(endLocal.getHours())}:${pad(endLocal.getMinutes())}`);

        // Aviso guardado de una cita (columna propia o marca en comentarios)
        const reminder = readReminder(selectedAppointment);
        if (reminder && !reminderEntry) {
          const [remDate, remTime] = toLocalInputValue(reminder).split('T');
          setValue('reminderDate', remDate);
          setValue('reminderTime', remTime);
        }

      } else if (selectedDate) {
        // MODO CREACIÓN
        setValue('entryKind', 'APPOINTMENT');
        setValue('status', 'NOT_CONFIRMED');

        setValue('date', `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`);
        setValue('startTime', `${pad(selectedDate.getHours())}:${pad(selectedDate.getMinutes())}`);
        // No seteamos endTime aquí para que se autocalcule al elegir el Tipo
      }
    }
  }, [isOpen, selectedDate, selectedAppointment, reset, setValue]);

  // Cerrar con la tecla Escape. En móvil el diálogo ocupa la pantalla entera,
  // así que además congelamos el scroll de la página que queda detrás.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  const watchStartTime = watch('startTime');
  const watchEndTime = watch('endTime');
  const watchStatus = watch('status');
  const watchReminderDate = watch('reminderDate');
  const watchReminderTime = watch('reminderTime');
  const entryKind = watch('entryKind') ?? 'APPOINTMENT';

  const isReminder = entryKind === 'REMINDER';
  // Franja de no disponibilidad: no hace falta cliente ni tipo de cita
  const isBlocked = !isReminder && watchStatus === 'NOT_AVAILABLE';
  const wasCancelled = selectedAppointment?.status === CANCELLED_STATUS;
  const isEditing = Boolean(selectedAppointment);

  /** Cambia entre cita y recordatorio, dejando los campos coherentes. */
  const selectEntryKind = (kind: EntryKind) => {
    setValue('entryKind', kind);
    if (kind === 'REMINDER') {
      setValue('type', REMINDER_TYPE as AppointmentTypeId);
      setValue('status', REMINDER_STATUS as AppointmentStatusId);
      setValue('endTime', '');
      setValue('reminderDate', '');
      setValue('reminderTime', '');
      if (watch('title') === BLOCK_TITLE) setValue('title', '');
    } else {
      setValue('type', '');
      setValue('status', 'NOT_CONFIRMED');
    }
  };

  const onSubmit = async (data: FormData) => {
    const reminderMode = data.entryKind === 'REMINDER';

    if (!data.title) {
      return alert(reminderMode ? "Escribe de qué te tienes que acordar." : "Por favor, escribe el título del caso o cliente.");
    }
    if (!data.date || !data.startTime) return alert("Falta la fecha o la hora.");

    const LAWYER_ID = 'e90a225a-ad56-4c4e-bf31-abd6992a4a6f';
    const startDateTime = new Date(`${data.date}T${data.startTime}`);

    /* ---------- Recordatorio suelto: solo título, fecha, hora y notas ---------- */
    if (reminderMode) {
      const endDateTime = new Date(startDateTime.getTime() + REMINDER_SLOT_MINUTES * 60000);
      const payload = {
        client_name: data.title,
        type: REMINDER_TYPE,
        status: wasCancelled ? CANCELLED_STATUS : REMINDER_STATUS,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration: REMINDER_SLOT_MINUTES,
        comments: stripReminderMarker(data.comments),
      };

      if (selectedAppointment) {
        const { error } = await supabase.from('Appointment').update(payload).eq('id', selectedAppointment.id);
        if (error) return alert("Hubo un error al actualizar el recordatorio.");
      } else {
        const { error } = await supabase.from('Appointment').insert({ ...payload, lawyer_id: LAWYER_ID });
        if (error) return alert("Hubo un error al crear el recordatorio.");
      }

      onSaveSuccess();
      onClose();
      return;
    }

    /* ---------- Cita ---------- */
    const blocked = data.status === 'NOT_AVAILABLE';

    if (!data.status) return alert("Por favor, selecciona un estado.");
    if (!blocked && !data.type) return alert("Por favor, selecciona un tipo de cita.");
    if (!data.endTime) return alert("Falta definir la hora de fin.");
    if (Boolean(data.reminderDate) !== Boolean(data.reminderTime)) {
      return alert("El recordatorio necesita fecha y hora. Rellena las dos o déjalas vacías.");
    }

    const clientName = blocked ? BLOCK_TITLE : data.title;
    const type = blocked ? BLOCK_TYPE : data.type;
    const endDateTime = new Date(`${data.date}T${data.endTime}`);
    const durationMins = (endDateTime.getTime() - startDateTime.getTime()) / 60000;

    // El aviso va a su columna si existe; si no, a una marca en comentarios
    const reminderFields = await buildReminderPayload(data.reminderDate, data.reminderTime, data.comments);

    if (selectedAppointment) {
      const { error } = await supabase
        .from('Appointment')
        .update({
          client_name: clientName,
          type,
          status: data.status,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          duration: durationMins,
          ...reminderFields,
        })
        .eq('id', selectedAppointment.id);

      if (error) return alert("Hubo un error al actualizar.");
    } else {
      const { error } = await supabase
        .from('Appointment')
        .insert({
          client_name: clientName,
          type,
          status: data.status,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          duration: durationMins,
          lawyer_id: LAWYER_ID,
          ...reminderFields,
        });

      if (error) return alert("Hubo un error al crear.");
    }

    onSaveSuccess();
    onClose();
  };

  /** "Eliminar" = mandar a canceladas. La entrada se conserva y puede volver. */
  const handleCancelAppointment = async () => {
    const what = isReminder ? 'El recordatorio' : 'La cita';
    if (!window.confirm(`${what} se marcará como CANCELADO. Podrás verlo activando el filtro «Canceladas» y restaurarlo cuando quieras. ¿Continuamos?`)) return;
    const { error } = await supabase
      .from('Appointment')
      .update({ status: CANCELLED_STATUS })
      .eq('id', selectedAppointment.id);
    if (error) return alert("Hubo un error al cancelar.");
    onSaveSuccess();
    onClose();
  };

  const handleRestore = async () => {
    const { error } = await supabase
      .from('Appointment')
      .update({ status: isReminderEntry(selectedAppointment) ? REMINDER_STATUS : 'NOT_CONFIRMED' })
      .eq('id', selectedAppointment.id);
    if (error) return alert("Hubo un error al restaurar.");
    onSaveSuccess();
    onClose();
  };

  const handleHardDelete = async () => {
    if (!window.confirm("Esto borra la entrada de forma DEFINITIVA y no se puede recuperar. ¿Seguro?")) return;
    const { error } = await supabase.from('Appointment').delete().eq('id', selectedAppointment.id);
    if (error) return alert("Hubo un error al eliminar.");
    onSaveSuccess();
    onClose();
  };

  // --- LÓGICA DE EVENTOS (ONCHANGE) Y CÁLCULO EN TIEMPO REAL ---

  const { onChange: typeOnChange, onBlur: typeOnBlur, name: typeName, ref: typeRef } = register('type');
  const { onChange: startOnChange, onBlur: startOnBlur, name: startName, ref: startRef } = register('startTime', { required: true });

  const selectStatus = (id: string) => {
    setValue('status', id as AppointmentStatusId, { shouldValidate: true });
    if (id === 'NOT_AVAILABLE') {
      setValue('title', BLOCK_TITLE);
      setValue('type', BLOCK_TYPE as AppointmentTypeId);
    } else if (watch('title') === BLOCK_TITLE || watch('type') === (BLOCK_TYPE as AppointmentTypeId)) {
      setValue('title', '');
      setValue('type', '');
    }
  };

  /** Coloca el aviso X minutos antes del inicio de la cita. */
  const setReminderBefore = (minutesBefore: number) => {
    const date = watch('date');
    const start = watch('startTime');
    if (!date || !start) return alert("Primero indica la fecha y la hora de inicio de la cita.");
    const at = new Date(`${date}T${start}`);
    at.setMinutes(at.getMinutes() - minutesBefore);
    const [remDate, remTime] = toLocalInputValue(at).split('T');
    setValue('reminderDate', remDate);
    setValue('reminderTime', remTime);
  };

  const clearReminder = () => {
    setValue('reminderDate', '');
    setValue('reminderTime', '');
  };

  // Función para calcular el texto bonito de la duración (Ej: 1h 30m)
  const renderDurationBadge = () => {
    if (!watchStartTime || !watchEndTime) return '--';
    const [sh, sm] = watchStartTime.split(':').map(Number);
    const [eh, em] = watchEndTime.split(':').map(Number);

    let diffMins = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMins < 0) diffMins += 24 * 60; // Por si pasa de medianoche

    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;

    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  if (!isOpen) return null;

  const hasReminder = Boolean(watchReminderDate && watchReminderTime);
  const heading = isReminder
    ? (isEditing ? 'Editar recordatorio' : 'Nuevo recordatorio')
    : (isEditing ? 'Editar cita' : 'Agendar nueva cita');

  const KIND_OPTIONS: { id: EntryKind; label: string; hint: string; icon: React.ReactNode }[] = [
    { id: 'APPOINTMENT', label: 'Cita', hint: 'con hora de inicio y fin', icon: <CalendarIcon /> },
    { id: 'REMINDER', label: 'Recordatorio', hint: 'algo que hacer a una hora', icon: <BellIcon /> },
  ];

  return (
    /* Móvil: hoja a pantalla completa, que es donde se agradece cada píxel.
       Desde `md` vuelve a ser un diálogo DENTRO de la tarjeta del calendario. */
    <div
      className="anim-fade-in fixed inset-0 z-50 flex items-stretch justify-center bg-slate-950/55 backdrop-blur-sm md:absolute md:z-40 md:items-center md:rounded-3xl md:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="anim-pop-in sheet-safe flex h-full w-full flex-col overflow-hidden bg-panel shadow-[var(--shadow-pop)] md:h-auto md:max-h-full md:max-w-2xl md:rounded-2xl md:border md:border-line"
      >

        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-5 sm:py-3.5">
          <h2 className="flex min-w-0 items-center gap-2 text-[16px] font-bold text-ink sm:text-[17px]">
            {isReminder ? <BellIcon className="h-[18px] w-[18px] shrink-0" /> : <CalendarIcon className="h-[18px] w-[18px] shrink-0" />}
            <span className="truncate">{heading}</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-ink-soft transition-all duration-200 hover:bg-brand-soft hover:text-ink active:scale-90"
          >
            &times;
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3.5 sm:px-5 sm:py-4">
          {wasCancelled && (
            <div
              className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl px-3.5 py-2.5"
              style={{ background: CANCELLED_VISUAL.bg, color: CANCELLED_VISUAL.ink }}
            >
              <span className="text-[13.5px] font-bold">
                {CANCELLED_VISUAL.icon} {isReminder ? 'Este recordatorio está cancelado.' : 'Esta cita está cancelada.'} Sigue guardado por si hace falta.
              </span>
              <button
                type="button"
                onClick={handleRestore}
                className="rounded-lg bg-panel px-3.5 py-1.5 text-[13px] font-bold text-ink shadow-sm transition-all duration-200 hover:brightness-105 active:scale-95"
              >
                Restaurar
              </button>
            </div>
          )}

          <form id="appointment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">

            {/* Tipo de entrada: cita o recordatorio */}
            <div>
              <label className={LABEL}>Tipo de entrada *</label>
              <input type="hidden" {...register("entryKind")} />
              {isEditing ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13.5px] font-bold"
                  style={
                    isReminder
                      ? { background: REMINDER_VISUAL.bg, color: REMINDER_VISUAL.ink }
                      : { background: 'var(--brand-soft)', color: 'var(--brand)' }
                  }
                >
                  {isReminder ? <BellIcon className="h-3.5 w-3.5" /> : <CalendarIcon className="h-3.5 w-3.5" />}
                  {isReminder ? 'Recordatorio' : 'Cita'}
                  <span className="font-medium opacity-80">· no se puede cambiar al editar</span>
                </span>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {KIND_OPTIONS.map((option) => {
                    const active = entryKind === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => selectEntryKind(option.id)}
                        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200 active:scale-[0.99] ${
                          active
                            ? 'border-brand bg-brand-soft shadow-sm'
                            : 'border-line bg-panel-2 hover:border-brand'
                        }`}
                      >
                        <span className={active ? 'text-brand' : 'text-ink-soft'}>{option.icon}</span>
                        <span>
                          <span className={`block text-[14px] font-bold ${active ? 'text-ink' : 'text-ink-soft'}`}>
                            {option.label}
                          </span>
                          <span className="block text-[12px] text-ink-soft">{option.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* -------------------- RECORDATORIO SUELTO -------------------- */}
            {isReminder ? (
              <>
                <div>
                  <label className={LABEL}>¿De qué te tienes que acordar? *</label>
                  <input
                    {...register("title", { required: true })}
                    type="text"
                    className={FIELD}
                    placeholder="Ej. Dar seguimiento a los exhibits del caso Sirotsky"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-xl border border-line bg-panel-2 p-2.5 min-[420px]:grid-cols-2 sm:p-3">
                  <div>
                    <label className={LABEL}>Fecha *</label>
                    <input {...register("date", { required: true })} type="date" className={FIELD} />
                  </div>
                  <div>
                    <label className={LABEL}>Hora *</label>
                    <input
                      type="time"
                      name={startName}
                      ref={startRef}
                      onBlur={startOnBlur}
                      onChange={startOnChange}
                      className={FIELD}
                    />
                  </div>
                  <p className="text-[12.5px] font-medium text-ink-soft min-[420px]:col-span-2">
                    Un recordatorio no tiene hora de fin: aparece en el calendario como un aviso de ese momento.
                  </p>
                </div>

                <div>
                  <label className={LABEL}>Notas (opcional)</label>
                  <textarea {...register("comments")} rows={3} className={FIELD} placeholder="Detalles útiles: a quién llamar, qué documento revisar..."></textarea>
                </div>
              </>
            ) : (
              /* -------------------- CITA -------------------- */
              <>
                <div>
                  <label className={LABEL}>Estado *</label>
                  <input type="hidden" {...register("status")} />
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(STATUS_VISUALS).map((id) => {
                      const visual = visualFor(id);
                      const active = watchStatus === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => selectStatus(id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13.5px] font-bold shadow-sm transition-all duration-200 active:scale-95 ${
                            active
                              ? 'ring-2 ring-offset-2 ring-offset-[var(--panel)] ring-[var(--ink)]'
                              : 'opacity-55 hover:opacity-100'
                          }`}
                          style={{ background: visual.bg, color: visual.ink }}
                        >
                          <span
                            aria-hidden
                            className="flex h-4 w-4 items-center justify-center rounded-full text-[11px] font-black"
                            style={{ background: visual.accent, color: visual.ink }}
                          >
                            {visual.icon}
                          </span>
                          {visual.label}
                        </button>
                      );
                    })}
                  </div>
                  {isBlocked && (
                    <p className="mt-2 rounded-lg border border-line bg-panel-2 px-3 py-2 text-[12.5px] font-medium text-ink-soft">
                      Franja de <span className="font-bold text-ink">no disponibilidad</span>: se guarda como
                      «{BLOCK_TITLE}». Solo hacen falta la fecha y las horas.
                    </p>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={isBlocked ? LABEL_MUTED : LABEL}>
                      Título del caso / cliente {isBlocked ? '(no aplica)' : '*'}
                    </label>
                    {/* Mismo input siempre (solo lectura si es una franja de no disponibilidad),
                        para que React no lo cambie de controlado a no controlado. */}
                    <input
                      {...register("title")}
                      type="text"
                      readOnly={isBlocked}
                      tabIndex={isBlocked ? -1 : undefined}
                      aria-disabled={isBlocked}
                      className={isBlocked ? FIELD_LOCKED : FIELD}
                      placeholder={isBlocked ? BLOCK_TITLE : 'Ej. Sirotsky et al vs AIG'}
                    />
                  </div>

                  <div>
                    <label className={isBlocked ? LABEL_MUTED : LABEL}>
                      Tipo de cita {isBlocked ? '(no aplica)' : '*'}
                    </label>
                    <select
                      name={typeName}
                      ref={typeRef}
                      onBlur={typeOnBlur}
                      disabled={isBlocked}
                      onChange={(e) => {
                        typeOnChange(e);
                        const selectedType = e.target.value as AppointmentTypeId;
                        if (selectedType && watchStartTime) {
                          const dur = APPOINTMENT_TYPES[selectedType].durationMinutes;
                          setValue('endTime', addMinutesToTime(watchStartTime, dur));
                        }
                      }}
                      className={FIELD}
                    >
                      {isBlocked ? (
                        <option value={BLOCK_TYPE}>No aplica — franja no disponible</option>
                      ) : (
                        <>
                          <option value="">Seleccione tipo...</option>
                          {Object.values(APPOINTMENT_TYPES).map((appt) => (
                            <option key={appt.id} value={appt.id}>{appt.name}</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Fecha, Inicio, Fin, Duración y aviso */}
                <div className="grid grid-cols-2 items-end gap-3 rounded-xl border border-line bg-panel-2 p-2.5 sm:p-3 md:grid-cols-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className={LABEL}>Fecha *</label>
                    <input {...register("date", { required: true })} type="date" className={FIELD} />
                  </div>

                  <div>
                    <label className={LABEL}>Inicio *</label>
                    <input
                      type="time"
                      name={startName}
                      ref={startRef}
                      onBlur={startOnBlur}
                      onChange={(e) => {
                        startOnChange(e);
                        const newStart = e.target.value;
                        const currentType = watch('type') as AppointmentTypeId;
                        if (newStart && currentType && currentType !== (BLOCK_TYPE as AppointmentTypeId)) {
                          const dur = APPOINTMENT_TYPES[currentType].durationMinutes;
                          setValue('endTime', addMinutesToTime(newStart, dur));
                        }
                      }}
                      className={FIELD}
                    />
                  </div>

                  <div>
                    <label className={LABEL}>Fin *</label>
                    <input {...register("endTime")} type="time" className={FIELD} />
                  </div>

                  <div>
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-soft">Duración</span>
                    <span className="inline-block w-max rounded-lg bg-brand-soft px-3 py-1.5 text-[14px] font-bold text-brand">
                      {renderDurationBadge()}
                    </span>
                  </div>

                  {/* Aviso de esta cita (fecha + hora, sin hora fin) */}
                  <div className="col-span-2 mt-1 border-t border-line pt-3 md:col-span-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink">
                        <BellIcon />
                        Avisarme antes
                        <span className="font-medium text-ink-soft">(opcional)</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => setReminderBefore(24 * 60)} className={CHIP}>1 día antes</button>
                        <button type="button" onClick={() => setReminderBefore(120)} className={CHIP}>2 h antes</button>
                        {hasReminder && (
                          <button type="button" onClick={clearReminder} className={CHIP}>Quitar</button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div className="md:col-span-1">
                        <label className={LABEL}>Fecha del aviso</label>
                        <input {...register("reminderDate")} type="date" className={FIELD} />
                      </div>
                      <div className="md:col-span-1">
                        <label className={LABEL}>Hora del aviso</label>
                        <input {...register("reminderTime")} type="time" className={FIELD} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Comentarios y detalles</label>
                  <textarea {...register("comments")} rows={2} className={FIELD} placeholder="Incluye detalles a discutir, mediadores, necesidad de intérprete..."></textarea>
                </div>
              </>
            )}

          </form>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line bg-panel-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {isEditing && !wasCancelled && (
              <button type="button" onClick={handleCancelAppointment} className="w-full rounded-xl border border-red-300 sm:w-auto bg-panel px-4 py-2 text-[13.5px] font-bold text-red-600 shadow-sm transition-all duration-200 hover:bg-red-50 active:scale-95 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10">
                {isReminder ? 'Eliminar recordatorio' : 'Eliminar cita'}
              </button>
            )}
            {isEditing && wasCancelled && (
              <button type="button" onClick={handleHardDelete} className="w-full rounded-xl border border-red-300 sm:w-auto bg-panel px-4 py-2 text-[13.5px] font-bold text-red-600 shadow-sm transition-all duration-200 hover:bg-red-50 active:scale-95 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10">
                Eliminar definitivamente
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-line bg-panel px-4 py-2.5 text-[13.5px] font-bold text-ink shadow-sm transition-all duration-200 hover:bg-brand-soft active:scale-95 sm:flex-none sm:py-2">
              Cancelar
            </button>
            <button type="submit" form="appointment-form" className="flex-1 rounded-xl bg-brand px-5 py-2.5 text-[13.5px] font-bold text-white shadow-sm transition-all duration-200 hover:brightness-110 active:scale-95 sm:flex-none sm:py-2">
              {isEditing ? 'Guardar cambios' : (isReminder ? 'Guardar recordatorio' : 'Guardar cita')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
