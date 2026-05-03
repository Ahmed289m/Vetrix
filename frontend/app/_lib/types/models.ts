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
  client_name?: string;
  notes?: string;
  pet_id: string;
  doctor_id: string;
  doctor_name?: string;
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

export interface DrugDoseSpecies {
  value?: number | null;
  unit?: string | null;
  frequency?: string | null;
}

export interface DrugDose {
  dog?: DrugDoseSpecies | null;
  cat?: DrugDoseSpecies | null;
  route?: string | null;
}

export interface DrugConcentration {
  value?: number | null;
  unit?: string | null;
  form?: string | null;
}

export interface DrugToxicitySpecies {
  severity?: string | null;
  notes?: string | null;
}

export interface DrugToxicity {
  dog?: DrugToxicitySpecies | null;
  cat?: DrugToxicitySpecies | null;
}

export interface Drug {
  drug_id: string;
  name: string;
  class: string;
  indications: string[];
  dose: DrugDose;
  concentration: DrugConcentration[];
  side_effects: string[];
  contraindications: string[];
  interactions: string[];
  toxicity: DrugToxicity;
  clinic_id?: string | null;
}

export interface DrugCreate {
  name: string;
  class: string;
  indications?: string[];
  dose?: DrugDose;
  concentration?: DrugConcentration[];
  side_effects?: string[];
  contraindications?: string[];
  interactions?: string[];
  toxicity?: DrugToxicity;
  clinic_id?: string | null;
}

export interface DrugUpdate {
  name?: string;
  class?: string;
  indications?: string[];
  dose?: DrugDose;
  concentration?: DrugConcentration[];
  side_effects?: string[];
  contraindications?: string[];
  interactions?: string[];
  toxicity?: DrugToxicity;
  clinic_id?: string | null;
}

/* ── Drug Interaction Check ──────────────────────────────────────── */

export interface DrugInteractionWarning {
  drug_a: string;
  drug_a_id: string;
  drug_b: string;
  drug_b_id: string;
  reason: string;
  severity: string;
}

export interface DrugInteractionResult {
  has_interactions: boolean;
  warnings: DrugInteractionWarning[];
}

/* ── Prescription ─────────────────────────────────────────────────── */

export interface Prescription {
  prescription_id: string;
  clinic_id: string;
  client_id: string;
  pet_id: string;
  prescriptionItem_ids: string[];
  status?: string;
}

export interface PrescriptionCreate {
  client_id: string;
  pet_id: string;
  /** One or more groups; each group becomes one prescription item */
  item_drug_ids?: string[][];
  /** Or link existing item ids directly */
  prescriptionItem_ids?: string[];
}

export interface PrescriptionUpdate {
  client_id?: string;
  pet_id?: string;
  prescriptionItem_ids?: string[];
}

/* ── Prescription Item ────────────────────────────────────────────── */

export interface PrescriptionItem {
  prescriptionItem_id: string;
  drug_ids: string[];
  drugDose: string;
  clinic_id: string;
}

export interface PrescriptionItemCreate {
  drug_ids: string[];
  drugDose: string;
}

export interface PrescriptionItemUpdate {
  drug_ids?: string[];
  drugDose?: string;
}
