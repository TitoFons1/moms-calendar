export const APPOINTMENT_TYPES = {
  MOTION_CALENDAR: { id: 'MOTION_CALENDAR', name: 'Motion Calendar Hearing', durationMinutes: 60 },
  SPECIAL_SET_MOTION: { id: 'SPECIAL_SET_MOTION', name: 'Special Set Motion', durationMinutes: 30 },
  CALENDAR_CALL: { id: 'CALENDAR_CALL', name: 'Calendar Call', durationMinutes: 90 },
  CASE_MANAGEMENT: { id: 'CASE_MANAGEMENT', name: 'Case Management Hearing', durationMinutes: 90 },
  PRE_LIT_MEDIATION: { id: 'PRE_LIT_MEDIATION', name: 'Pre-Lit Mediation', durationMinutes: 120 },
  MEDIATION_LITIGATION: { id: 'MEDIATION_LITIGATION', name: 'Mediation in Litigation', durationMinutes: 180 },
  CR_FA_DEPOSITION: { id: 'CR_FA_DEPOSITION', name: 'CR or FA Deposition', durationMinutes: 120 }, 
  CLIENT_DEPOSITION: { id: 'CLIENT_DEPOSITION', name: 'Client Deposition', durationMinutes: 120 }, 
  WITNESS_DEPOSITION: { id: 'WITNESS_DEPOSITION', name: 'Witness Deposition', durationMinutes: 180 },
  CLIENT_CALL: { id: 'CLIENT_CALL', name: 'Client Calls (not discovery)', durationMinutes: 30 },
  OC_CALL: { id: 'OC_CALL', name: 'OC Calls', durationMinutes: 30 },
  CLIENT_DISCOVERY_CALL: { id: 'CLIENT_DISCOVERY_CALL', name: 'Client Discovery Call', durationMinutes: 60 },
  PRE_MEDIATION_CALL: { id: 'PRE_MEDIATION_CALL', name: 'Pre-Mediation Call', durationMinutes: 30 },
  CLIENT_IN_PERSON: { id: 'CLIENT_IN_PERSON', name: 'Client in-person Meeting', durationMinutes: 30 },
  SITE_VISIT: { id: 'SITE_VISIT', name: 'Site visits / inspections', durationMinutes: 60 },
} as const;

export const APPOINTMENT_STATUSES = {
  NOT_AVAILABLE: { id: 'NOT_AVAILABLE', name: 'Not available' },
  NOT_CONFIRMED: { id: 'NOT_CONFIRMED', name: 'Not confirmed' },
  SCHEDULED: { id: 'SCHEDULED', name: 'Scheduled' },
} as const;

export type AppointmentStatusId = keyof typeof APPOINTMENT_STATUSES;
export type AppointmentTypeId = keyof typeof APPOINTMENT_TYPES;