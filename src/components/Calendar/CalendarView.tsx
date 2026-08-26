'use client';

import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar'; // <-- Añadido View
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AppointmentModal from '../Modals/AppointmentModal';
import { supabase } from '../../lib/supabase';

const localizer = momentLocalizer(moment);

export default function CalendarView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  // NUEVO: Estados para forzar que los botones de navegación y vistas funcionen
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
        originalData: appt // Guardamos los datos para usarlos en los colores
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

  // NUEVO: Asignar colores según el estado de la cita
  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3b82f6'; // Azul por defecto
    let color = '#ffffff';

    if (event.originalData.status === 'SCHEDULED') {
      backgroundColor = '#22c55e'; // Verde
    } else if (event.originalData.status === 'NOT_CONFIRMED') {
      backgroundColor = '#eab308'; // Amarillo
      color = '#1e293b'; // Texto oscuro para contrastar con el amarillo
    } else if (event.originalData.status === 'NOT_AVAILABLE') {
      backgroundColor = '#ef4444'; // Rojo
    }

    return {
      style: {
        backgroundColor,
        color,
        border: 'none',
        borderRadius: '6px',
        opacity: 0.95,
      }
    };
  };

  // NUEVO: Diseño profesional para el interior de la cita (arregla el tamaño de letra)
  const CustomEvent = ({ event }: any) => (
    <div className="p-1 h-full flex flex-col justify-start overflow-hidden">
      <span className="font-semibold text-sm leading-tight truncate">{event.originalData.client_name}</span>
      <span className="text-xs opacity-90 leading-tight truncate mt-0.5">{event.originalData.type}</span>
    </div>
  );

  return (
    // Añadimos flex flex-col para que el calendario ocupe bien el espacio
    <div className="p-4 bg-white rounded-lg shadow h-[80vh] relative flex flex-col">
      
{/* NUEVO: Forzamos colores oscuros y arreglamos los botones que rompía Tailwind */}
      <style dangerouslySetInnerHTML={{__html: `
        .rbc-header { color: #0f172a !important; font-weight: 600 !important; padding: 8px 0 !important; }
        .rbc-time-header-content { border-left: 1px solid #e2e8f0 !important; }
        .rbc-time-content { border-top: 1px solid #e2e8f0 !important; }
        .rbc-timeslot-group { border-bottom: 1px solid #e2e8f0 !important; color: #64748b !important; }
        .rbc-btn-group button { color: #334155 !important; }
        .rbc-btn-group button.rbc-active { background-color: #e2e8f0 !important; color: #0f172a !important; box-shadow: inset 0 3px 5px rgba(0,0,0,.125) !important; }
        
        /* CORRECCIÓN: Texto central de la fecha oscuro y en negrita */
        .rbc-toolbar-label { color: #0f172a !important; font-weight: 600 !important; font-size: 1.125rem !important; }
      `}} />

      <Calendar
        localizer={localizer}
        events={events}
        date={currentDate} // Controlamos la fecha
        onNavigate={(newDate) => setCurrentDate(newDate)} // Hacemos que funcione Next/Back
        view={currentView} // Controlamos la vista
        onView={(newView) => setCurrentView(newView)} // Hacemos que funcione Week/Month
        startAccessor="start"
        endAccessor="end"
        min={new Date(new Date().setHours(8, 0, 0, 0))}
        max={new Date(new Date().setHours(19, 0, 0, 0))}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        eventPropGetter={eventStyleGetter} // Aplicamos los colores
        components={{ event: CustomEvent }} // Aplicamos el texto bonito
        style={{ flex: 1 }}
      />

      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        selectedDate={selectedDate}
        selectedAppointment={selectedAppointment}
        onSaveSuccess={fetchAppointments} 
      />
    </div>
  );
}