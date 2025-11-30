/**
 * Types pour le système de prise de rendez-vous Bootcamp Élite
 */

// Statuts possibles d'une demande de RDV
export type AppointmentStatus = 'pending' | 'contacted' | 'confirmed' | 'cancelled';

// Type de rendez-vous
export type AppointmentType = 
  | 'appel_decouverte'      // Appel découverte 15min
  | 'appel_qualification'   // Appel qualification 30min
  | 'visio_presentation';   // Visio présentation détaillée

// Source de la demande
export type AppointmentSource = 
  | 'pricing_page_cta'      // Bouton sur la page pricing
  | 'immersion_page_cta'    // Bouton sur la page immersion elite
  | 'chatbot_direct'        // Demande directe via chatbot
  | 'homepage_cta';         // CTA page d'accueil

// Interface principale pour une demande de RDV
export interface AppointmentRequest {
  id: string;
  // Informations sur l'offre
  offerId: string;
  offerName: string;
  // Informations client
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location?: string;
  // Détails du RDV
  type: AppointmentType;
  availability: string;
  goals?: string;
  // Métadonnées
  source: AppointmentSource;
  status: AppointmentStatus;
  adminNotes?: string;
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
  // Relation optionnelle
  sessionId?: string;
  userId?: string;
}

// Payload pour créer une nouvelle demande
export interface CreateAppointmentPayload {
  offerId: string;
  offerName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location?: string;
  type: AppointmentType;
  availability: string;
  goals?: string;
  source: AppointmentSource;
  sessionId?: string;
  userId?: string;
}

// États du flux de conversation RDV dans le chatbot
export type RdvFlowStep = 
  | 'ASK_NAME'
  | 'ASK_EMAIL'
  | 'ASK_PHONE'
  | 'ASK_LOCATION'
  | 'ASK_TYPE_RDV'
  | 'ASK_AVAILABILITIES'
  | 'ASK_GOALS'
  | 'ASK_SOURCE'
  | 'SUMMARY_CONFIRM'
  | 'SUBMIT_TO_BACKEND'
  | 'DONE';

// ============================================
// FLOW CONTACT - Collecte intelligente d'infos
// ============================================

// Type de demande de contact
export type ContactRequestType = 
  | 'question_offres'      // Question sur les offres
  | 'support_technique'    // Problème technique
  | 'bootcamp_info'        // Info sur le Bootcamp
  | 'partenariat'          // Demande de partenariat
  | 'autre';               // Autre demande

// États du flux de contact
export type ContactFlowStep = 
  | 'ASK_NAME'
  | 'ASK_EMAIL'
  | 'ASK_PHONE'
  | 'ASK_SUBJECT'
  | 'ASK_MESSAGE'
  | 'SUMMARY_CONFIRM'
  | 'SUBMIT'
  | 'DONE';

// Payload pour une demande de contact
export interface ContactRequestPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: ContactRequestType;
  message: string;
  source: 'chatbot_contact';
  userId?: string;
}

// État du flux contact dans le chatbot
export interface ContactFlowState {
  active: boolean;
  step: ContactFlowStep;
  data: Partial<ContactRequestPayload>;
}

// État initial du flux contact
export const initialContactFlowState: ContactFlowState = {
  active: false,
  step: 'ASK_NAME',
  data: {},
};

// Labels pour les types de contact
export const contactTypeLabels: Record<ContactRequestType, string> = {
  question_offres: 'Question sur les offres',
  support_technique: 'Support technique',
  bootcamp_info: 'Bootcamp / Immersion Élite',
  partenariat: 'Partenariat',
  autre: 'Autre',
};

// ============================================
// FLOW SUPPORT TECHNIQUE - Pour les clients
// ============================================

// États du flux support technique
export type SupportFlowStep = 
  | 'ASK_NAME'
  | 'ASK_EMAIL'
  | 'ASK_OFFER'
  | 'ASK_PROBLEM_TYPE'
  | 'ASK_DESCRIPTION'
  | 'SUMMARY_CONFIRM'
  | 'SUBMIT'
  | 'DONE';

// Type de problème technique
export type SupportProblemType = 
  | 'acces_formation'      // Problème d'accès formation
  | 'acces_discord'        // Problème d'accès Discord
  | 'paiement'             // Problème de paiement
  | 'video_bug'            // Vidéo ne se charge pas
  | 'compte'               // Problème de compte
  | 'autre';               // Autre problème

// Payload pour une demande de support
export interface SupportRequestPayload {
  firstName: string;
  lastName: string;
  email: string;
  offer: string;
  problemType: SupportProblemType;
  description: string;
  source: 'chatbot_support';
  userId?: string;
}

// État du flux support
export interface SupportFlowState {
  active: boolean;
  step: SupportFlowStep;
  data: Partial<SupportRequestPayload>;
}

// État initial du flux support
export const initialSupportFlowState: SupportFlowState = {
  active: false,
  step: 'ASK_NAME',
  data: {},
};

// Labels pour les types de problèmes
export const supportProblemLabels: Record<SupportProblemType, string> = {
  acces_formation: 'Accès à la formation',
  acces_discord: 'Accès Discord',
  paiement: 'Problème de paiement',
  video_bug: 'Vidéo ne se charge pas',
  compte: 'Problème de compte',
  autre: 'Autre problème',
};

// État du flux RDV dans le chatbot
export interface RdvFlowState {
  active: boolean;
  step: RdvFlowStep;
  data: Partial<CreateAppointmentPayload>;
  errors: string[];
}

// Configuration initiale du flux RDV
export const initialRdvFlowState: RdvFlowState = {
  active: false,
  step: 'ASK_NAME',
  data: {},
  errors: [],
};

// Labels pour les types de RDV
export const appointmentTypeLabels: Record<AppointmentType, string> = {
  appel_decouverte: 'Appel découverte (15 min)',
  appel_qualification: 'Appel qualification (30 min)',
  visio_presentation: 'Visio présentation détaillée',
};

// Labels pour les statuts
export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pending: 'En attente',
  contacted: 'Contacté',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
};

// Couleurs pour les statuts (Tailwind)
export const appointmentStatusColors: Record<AppointmentStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  contacted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

