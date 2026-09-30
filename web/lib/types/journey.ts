// Journey state machine — matches backend contract exactly
export type JourneyState =
  | 'Intake'
  | 'Triaged'
  | 'Emergency'
  | 'BookingCall'
  | 'Booked'
  | 'VisitDone'
  | 'InsuranceCall'
  | 'NeedsInfo'
  | 'Approved'
  | 'PharmacyOrder'
  | 'Delivered';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export type Locale = 'ar' | 'en';

export interface PatientProfile {
  id: string;
  name: string;
  dateOfBirth?: string;
  insuranceId?: string;
}

export interface Medication {
  name: string;
  dose?: string;
  frequency?: string;
}

export interface PatientContext {
  profile: PatientProfile;
  medications: Medication[];
  allergies: string[];
  currentJourneyId?: string;
}

export interface JourneyAppointment {
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  clinicName: string;
  location: string;
  confirmationRef: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface JourneyInsurance {
  status: 'not_started' | 'calling' | 'pending' | 'needs_info' | 'approved' | 'rejected';
  approvalRef?: string;
  infoRequired?: string;
}

export interface JourneyPrescription {
  uploaded: boolean;
  imageUrl?: string;
  extractedData?: Record<string, string>;
}

export interface JourneyDelivery {
  status: 'not_started' | 'preparing' | 'out_for_delivery' | 'delivered';
  estimatedTime?: string;
}

export interface Journey {
  id: string;
  state: JourneyState;
  urgency?: UrgencyLevel;
  patient: PatientContext;
  appointment?: JourneyAppointment;
  insurance?: JourneyInsurance;
  prescription?: JourneyPrescription;
  delivery?: JourneyDelivery;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isRefusal?: boolean;
  isEmergency?: boolean;
}
