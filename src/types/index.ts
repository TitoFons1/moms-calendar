export interface Lawyer {
  id: string;
  name: string;
  email?: string;
}

export interface Appointment {
  id: string;
  client_name?: string;
  type: string;
  status: 'PENDING' | 'CONFIRMED' | 'BLOCKED';
  start_time: string; // Supabase devuelve las fechas como strings en formato ISO
  end_time: string;
  duration: number;
  comments?: string;
  lawyer_id: string;
}