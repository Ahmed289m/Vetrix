import type { UserRole } from "./api.types";
export type { UserRole } from "./api.types";

/* ── Pet ──────────────────────────────────────────────────────────── */

export type PetType = "cat" | "dog" | "other";

export interface Pet {
  pet_id: string;
  name: string;
  breed?: string;
  weight: number;
  type: PetType;
  client_id: string;
  clinic_id: string;
  owner_id?: string;
  is_active?: boolean;
}

export interface PetCreate {
  name: string;
  weight: number;
  type: PetType;
  client_id?: string; // Auto-set from token for CLIENT role
}

export interface PetUpdate {
  name?: string;
  weight?: number;
  type?: PetType;
  client_id?: string;
}

/* ── Appointment ──────────────────────────────────────────────────── */

export interface Appointment {
  appointment_id: string;
  clinic_id: string;
  pet_id: string;
  client_id: string;
  doctor_id?: string;
  appointment_date?: string;
  reason?: string;
  status: string;
}

export interface AppointmentCreate {
  pet_id: string;
  client_id?: string; // Auto-set from token for CLIENT role
  doctor_id?: string;
  appointment_date?: string;
  reason?: string;
}

export interface AppointmentUpdate {
  pet_id?: string;
  client_id?: string;
  status?: string;
  doctor_id?: string;
  appointment_date?: string;
  reason?: string;
}

/* ── User ─────────────────────────────────────────────────────────── */

export interface User {
  user_id: string;
  fullname: string;
  phone: string;
  email: string;
  role: UserRole;
  clinic_id: string | null;
  is_active: boolean;
  is_superuser: boolean;
}

/**
 * Create user - email and password are auto-generated on backend
 * Only provide fullname, phone, role, and optionally clinic_id
 */
export interface UserCreate {
  fullname: string;
  phone: string;
  clinic_id?: string;
  role: UserRole;
}

/**
 * Response when creating a user - includes generated credentials
 */
export interface UserCreated extends User {
  password: string; // Generated password - shown only on creation
}

export interface UserUpdate {
  fullname?: string;
  phone?: string;
  role?: UserRole;
  clinic_id?: string;
  email?: string;
  password?: string;
  is_active?: boolean;
}

/* ── Clinic ───────────────────────────────────────────────────────── */

export interface Clinic {
  clinic_id: string;
  clinicName: string;
  address: string;
  phone: string;
  subscriptionStatus: string;
}

export interface ClinicCreate {
  clinicName: string;
  address: string;
  phone: string;
  subscriptionStatus: string;
}

export interface ClinicUpdate {
  clinicName?: string;
  address?: string;
  phone?: string;
  subscriptionStatus?: string;
}

/* ── Visit ────────────────────────────────────────────────────────── */

export interface Visit {
  visit_id: string;
  prescription_id?: string;
  clinic_id: string;
  client_id: string;
  notes?: string;
  pet_id: string;
  doctor_id: string;
  date: string;
}

export interface VisitCreate {
  prescription_id?: string;
  client_id: string;
  notes?: string;
  pet_id: string;
  doctor_id: string;
  date: string;
}

export interface VisitUpdate {
  prescription_id?: string;
  client_id?: string;
  notes?: string;
  pet_id?: string;
  doctor_id?: string;
  date?: string;
}

/* ── Drug ─────────────────────────────────────────────────────────── */

export interface Drug {
  drug_id: string;
  name: string;
  drugClass: string;
  indications: string[];
  dosage: Record<string, any>;
  sideEffects: string[];
  contraindications: string[];
  drugInteractions: string[];
  toxicity: Record<string, any>;
  clinic_id?: string | null;
}

export interface DrugCreate {
  name: string;
  drugClass: string;
  indications: string[];
  dosage: Record<string, any>;
  sideEffects: string[];
  contraindications: string[];
  drugInteractions: string[];
  toxicity: Record<string, any>;
  clinic_id?: string | null;
}

export interface DrugUpdate {
  name?: string;
  drugClass?: string;
  indications?: string[];
  dosage?: Record<string, any>;
  sideEffects?: string[];
  contraindications?: string[];
  drugInteractions?: string[];
  toxicity?: Record<string, any>;
  clinic_id?: string | null;
}

/* ── Prescription ─────────────────────────────────────────────────── */

export interface Prescription {
  prescription_id: string;
  clinic_id: string;
  client_id: string;
  pet_id: string;
  prescriptionItem_id: string;
  status?: string;
}

export interface PrescriptionCreate {
  client_id: string;
  pet_id: string;
  prescriptionItem_id: string;
}

export interface PrescriptionUpdate {
  client_id?: string;
  pet_id?: string;
  prescriptionItem_id?: string;
}

/* ── Prescription Item ────────────────────────────────────────────── */

export interface PrescriptionItem {
  prescriptionItem_id: string;
  drug_id: string;
  drugDose: string;
  clinic_id: string;
}

export interface PrescriptionItemCreate {
  drug_id: string;
  drugDose: string;
}

export interface PrescriptionItemUpdate {
  drug_id?: string;
  drugDose?: string;
}
