import type { Journey, ChatMessage, PatientContext } from '@/lib/types/journey';

export const demoPatient: PatientContext = {
  profile: {
    id: 'demo-patient-001',
    name: 'Ahmed Al-Rashidi',
    dateOfBirth: '1985-03-12',
    insuranceId: 'INS-7823941',
  },
  medications: [
    { name: 'Metformin', dose: '500mg', frequency: 'Twice daily' },
    { name: 'Lisinopril', dose: '10mg', frequency: 'Once daily' },
  ],
  allergies: ['Penicillin', 'Sulfonamides'],
  currentJourneyId: 'journey-demo-001',
};

export const demoJourney: Journey = {
  id: 'journey-demo-001',
  state: 'Booked',
  urgency: 'MEDIUM',
  patient: demoPatient,
  appointment: {
    doctorName: 'Dr. Sarah Ahmed',
    specialty: 'Neurology',
    date: '2026-10-05',
    time: '14:30',
    clinicName: 'Emirates Specialty Clinic',
    location: 'Dubai Healthcare City, Building 27',
    confirmationRef: 'APPT-284731',
    status: 'confirmed',
  },
  insurance: {
    status: 'pending',
  },
  prescription: {
    uploaded: false,
  },
  delivery: {
    status: 'not_started',
  },
  createdAt: '2026-09-30T10:00:00Z',
  updatedAt: '2026-09-30T11:30:00Z',
};

export const demoMessages: ChatMessage[] = [
  {
    id: 'msg-001',
    role: 'assistant',
    content:
      "Hello, I'm Shifa — your AI care coordinator.\n\nI can help guide you to the right care, coordinate your appointment, and follow your journey — but I'm not a doctor and I won't diagnose or prescribe.\n\nHow are you feeling today?",
    timestamp: '2026-09-30T10:00:00Z',
  },
  {
    id: 'msg-002',
    role: 'user',
    content: "I've been having severe headaches for three days and some dizziness.",
    timestamp: '2026-09-30T10:01:00Z',
  },
  {
    id: 'msg-003',
    role: 'assistant',
    content:
      "Thank you for sharing that. I want to make sure I understand your situation properly.\n\nCan you tell me — on a scale of 1 to 10, how would you rate the intensity of the headaches?",
    timestamp: '2026-09-30T10:01:30Z',
  },
];

export const demoClinicAppointments = [
  {
    id: 'journey-demo-001',
    patientName: 'Ahmed Al-Rashidi',
    time: '14:30',
    specialty: 'Neurology',
    status: 'confirmed' as const,
    urgency: 'MEDIUM' as const,
  },
  {
    id: 'journey-demo-002',
    patientName: 'Fatima Al-Zaabi',
    time: '15:00',
    specialty: 'General Practice',
    status: 'confirmed' as const,
    urgency: 'LOW' as const,
  },
  {
    id: 'journey-demo-003',
    patientName: 'Mohammed Hassan',
    time: '15:45',
    specialty: 'Cardiology',
    status: 'pending' as const,
    urgency: 'HIGH' as const,
  },
];
