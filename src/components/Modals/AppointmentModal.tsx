'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { APPOINTMENT_TYPES, AppointmentTypeId, APPOINTMENT_STATUSES, AppointmentStatusId } from '../../lib/appointmentConstants';
import { supabase } from '../../lib/supabase';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedAppointment?: any | null;
  onSaveSuccess: () => void;
}

// Actualizamos la estructura de datos
interface FormData {
  title: string;
  type: AppointmentTypeId | '';
  status: AppointmentStatusId | ''; 
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  comments: string;
}

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
        setValue('title', selectedAppointment.client_name);
        setValue('type', selectedAppointment.type as AppointmentTypeId);
        setValue('status', selectedAppointment.status as AppointmentStatusId || 'NOT_CONFIRMED');
        setValue('comments', selectedAppointment.comments || '');
        
        // Extraemos Fecha, Hora Inicio y Hora Fin
        const startLocal = new Date(selectedAppointment.start_time);
        const endLocal = new Date(selectedAppointment.end_time);

        setValue('date', `${startLocal.getFullYear()}-${pad(startLocal.getMonth() + 1)}-${pad(startLocal.getDate())}`);
        setValue('startTime', `${pad(startLocal.getHours())}:${pad(startLocal.getMinutes())}`);
        setValue('endTime', `${pad(endLocal.getHours())}:${pad(endLocal.getMinutes())}`);

      } else if (selectedDate) {
        // MODO CREACIÓN
        setValue('status', 'NOT_CONFIRMED'); 
        
        setValue('date', `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`);
        setValue('startTime', `${pad(selectedDate.getHours())}:${pad(selectedDate.getMinutes())}`);
        // No seteamos endTime aquí para que se autocalcule al elegir el Tipo
      }
    }
  }, [isOpen, selectedDate, selectedAppointment, reset, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!data.type) return alert("Por favor, selecciona un tipo de cita.");
    if (!data.status) return alert("Por favor, selecciona un estado.");
    if (!data.startTime || !data.endTime) return alert("Falta definir la hora de inicio o fin.");
    
    // Unimos la fecha separada con las horas para guardar en base de datos
    const startDateTime = new Date(`${data.date}T${data.startTime}`);
    const endDateTime = new Date(`${data.date}T${data.endTime}`);
    
    // Calculamos la duración final exacta según lo que haya dejado el usuario
    const durationMins = (endDateTime.getTime() - startDateTime.getTime()) / 60000;

    const LAWYER_ID = 'e90a225a-ad56-4c4e-bf31-abd6992a4a6f';

    if (selectedAppointment) {
      const { error } = await supabase
        .from('Appointment')
        .update({
          client_name: data.title,
          type: data.type,
          status: data.status, 
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          duration: durationMins,
          comments: data.comments,
        })
        .eq('id', selectedAppointment.id);

      if (error) return alert("Hubo un error al actualizar.");
    } else {
      const { error } = await supabase
        .from('Appointment')
        .insert({
          client_name: data.title,
          type: data.type,
          status: data.status, 
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          duration: durationMins,
          comments: data.comments,
          lawyer_id: LAWYER_ID,
        });

      if (error) return alert("Hubo un error al crear.");
    }

    onSaveSuccess();
    onClose(); 
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta cita de forma permanente?")) return;
    const { error } = await supabase.from('Appointment').delete().eq('id', selectedAppointment.id);
    if (error) return alert("Hubo un error al eliminar la cita.");
    onSaveSuccess();
    onClose();
  };

  // --- LÓGICA DE EVENTOS (ONCHANGE) Y CÁLCULO EN TIEMPO REAL ---

  const { onChange: typeOnChange, onBlur: typeOnBlur, name: typeName, ref: typeRef } = register('type', { required: true });
  const { onChange: startOnChange, onBlur: startOnBlur, name: startName, ref: startRef } = register('startTime', { required: true });

  const watchStartTime = watch('startTime');
  const watchEndTime = watch('endTime');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">
            {selectedAppointment ? 'Editar Cita' : 'Agendar Nueva Cita'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="appointment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Título del Caso / Cliente *</label>
              <input {...register("title", { required: true })} type="text" className="w-full bg-white text-slate-900 font-medium border border-slate-300 shadow-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="Ej. Sirotsky et al vs AIG" />
            </div>

            {/* Tipo y Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Cita *</label>
                <select 
                  name={typeName} 
                  ref={typeRef} 
                  onBlur={typeOnBlur}
                  onChange={(e) => {
                    typeOnChange(e);
                    const selectedType = e.target.value as AppointmentTypeId;
                    if (selectedType && watchStartTime) {
                      const dur = APPOINTMENT_TYPES[selectedType].durationMinutes;
                      setValue('endTime', addMinutesToTime(watchStartTime, dur));
                    }
                  }}
                  className="w-full bg-white text-slate-900 font-medium border border-slate-300 shadow-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="">Seleccione tipo...</option>
                  {Object.values(APPOINTMENT_TYPES).map((appt) => (
                    <option key={appt.id} value={appt.id}>{appt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado *</label>
                <select {...register("status", { required: true })} className="w-full bg-white text-slate-900 font-medium border border-slate-300 shadow-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                  <option value="">Seleccione estado...</option>
                  {Object.values(APPOINTMENT_STATUSES).map((status) => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fecha, Inicio, Fin y Duración */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
                <input {...register("date", { required: true })} type="date" className="w-full bg-white text-slate-900 font-medium border border-slate-300 shadow-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Inicio *</label>
                <input 
                  type="time" 
                  name={startName}
                  ref={startRef}
                  onBlur={startOnBlur}
                  onChange={(e) => {
                    startOnChange(e);
                    const newStart = e.target.value;
                    const currentType = watch('type') as AppointmentTypeId;
                    if (newStart && currentType) {
                      const dur = APPOINTMENT_TYPES[currentType].durationMinutes;
                      setValue('endTime', addMinutesToTime(newStart, dur));
                    }
                  }}
                  className="w-full bg-white text-slate-900 font-medium border border-slate-300 shadow-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fin *</label>
                <input {...register("endTime", { required: true })} type="time" className="w-full bg-white text-slate-900 font-medium border border-slate-300 shadow-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>

              <div className="flex flex-col justify-center h-[46px]">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Duración</span>
                <span className="text-blue-700 font-bold bg-blue-100 px-3 py-1 rounded-md inline-block w-max">
                  {renderDurationBadge()}
                </span>
              </div>
            </div>

            {/* Comentarios */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comentarios y Detalles</label>
              <textarea {...register("comments")} rows={4} className="w-full bg-white text-slate-900 font-medium border border-slate-300 shadow-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="Incluye detalles a discutir, mediadores, necesidad de intérprete..."></textarea>
            </div>
            
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3">
          <div>
            {selectedAppointment && (
              <button type="button" onClick={handleDelete} className="px-5 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 shadow-sm transition-all">
                Eliminar Cita
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all">
              Cancelar
            </button>
            <button type="submit" form="appointment-form" className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all">
              {selectedAppointment ? 'Guardar Cambios' : 'Guardar Cita'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}