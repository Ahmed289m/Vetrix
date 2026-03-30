import type { UserRole } from "./api.types";

/* ── Pet ──────────────────────────────────────────────────────────── */

export type PetType = "cat" | "dog";

export interface Pet {
  pet_id: string;
  name: string;
  weight: number;
  type: PetType;
  client_id: string;
  clinic_id: string;
  owner_id?: string;
}

export interface PetCreate {
  name: string;
  weight: number;
  type: PetType;
  client_id: string;
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
  status: string;
}

export interface AppointmentCreate {
  pet_id: string;
  client_id: string;
}

export interface AppointmentUpdate {
  pet_id?: string;
  client_id?: string;
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
  prescription_id: string;
  clinic_id: string;
  client_id: string;
  notes?: string;
  pet_id: string;
  doctor_id: string;
  date: string;
}

export interface VisitCreate {
  prescription_id: string;
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
  drugName: string;
  clinic_id: string;
}

export interface DrugCreate {
  drugName: string;
}

export interface DrugUpdate {
  drugName?: string;
}

/* ── Prescription ─────────────────────────────────────────────────── */

export interface Prescription {
  prescription_id: string;
  clinic_id: string;
  client_id: string;
  pet_id: string;
  prescriptionItem_id: string;
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
