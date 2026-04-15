"use client";

import * as React from "react";
import { motion, AnimatePresence } from "@/app/_components/fast-motion";
import {
  Pill,
  Plus,
  Search,
  Shield,
  Globe,
  Building2,
  FlaskConical,
  AlertTriangle,
  ChevronRight,
  X,
  Trash2,
  Pencil,
  Lock,
  Info,
  Upload,
  FileJson,
} from "lucide-react";
import { useFormik } from "formik";

import { useAuth } from "@/app/_hooks/useAuth";
import {
  useDrugs,
  useCreateDrug,
  useUpdateDrug,
  useDeleteDrug,
} from "@/app/_hooks/queries/use-drugs";
import { useClinics } from "@/app/_hooks/queries/use-clinics";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Textarea } from "@/app/_components/ui/textarea";
import { DashboardForm } from "@/app/_components/ui/dashboard-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import type { Drug, DrugCreate } from "@/app/_lib/types/models";

/* ── Permission helpers ────────────────────────────────────────────────
 * Backend service logic (drug_service.py):
 *   - Admin (is_superuser): manage ALL drugs, can set/clear clinic_id
 *   - Owner / Staff: manage ONLY drugs where clinic_id === their clinic_id
 *     (service auto-assigns clinic_id on create, strips it on update)
 *   - Doctor / Client: read-only
 *
 * Backend RBAC (permissions.py) now grants DRUGS_CREATE/UPDATE/DELETE
 * to owner + staff so the route guard passes. Service layer enforces scope.
 * ────────────────────────────────────────────────────────────────────── */

type ManageLevel = "admin" | "clinic" | "readonly";

function useManageLevel(): ManageLevel {
  const { user } = useAuth();
  if (!user) return "readonly";
  if (user.isSuperuser || user.role === "admin") return "admin";
  if (user.role === "owner" || user.role === "staff") return "clinic";
  return "readonly";
}

function canManageDrug(
  drug: Drug,
  level: ManageLevel,
  clinicId: string | null,
): boolean {
  if (level === "admin") return true;
  if (level === "clinic")
    return !!drug.clinic_id && drug.clinic_id === clinicId;
  return false;
}

/* ── Tag / JSON helpers ───────────────────────────────────────────────── */
const parseTagArray = (raw: string): string[] =>
  raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const tagArrayToString = (arr: string[]): string => arr.join(", ");

const parseJsonSafe = (raw: string): Record<string, unknown> => {
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
};

/* ── Skeleton ─────────────────────────────────────────────────────────── */
function DrugSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-20 rounded-2xl bg-white/5 border border-white/5"
        />
      ))}
    </div>
  );
}

/* ── Scope badge ──────────────────────────────────────────────────────── */
function ScopeBadge({ drug, clinicName }: { drug: Drug; clinicName?: string }) {
  if (!drug.clinic_id) {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/10">
        <Globe className="w-3 h-3" />
        Global
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald/10 text-emerald border border-emerald/10">
      <Building2 className="w-3 h-3" />
      {clinicName ?? "Clinic"}
    </span>
  );
}

/* ── Drug Row ─────────────────────────────────────────────────────────── */
function DrugRow({
  drug,
  index,
  manageable,
  clinicName,
  onSelect,
  onEdit,
  onDelete,
}: {
  drug: Drug;
  index: number;
  manageable: boolean;
  clinicName?: string;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.32, ease: "easeOut" }}
      onClick={onSelect}
      className="group relative bg-white/5 backdrop-blur-md border border-white/5 hover:border-emerald/20 rounded-2xl px-5 py-4 cursor-pointer transition-all duration-300 hover:bg-white/[0.08] hover:shadow-[0_0_28px_-8px_rgba(16,185,129,0.12)]"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald/20 to-cyan-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
          <Pill className="w-5 h-5 text-emerald" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-black text-foreground tracking-tight group-hover:text-emerald transition-colors">
              {drug.name}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-white/5 text-muted-foreground">
              {drug.drugClass}
            </span>
            <ScopeBadge drug={drug} clinicName={clinicName} />
            {manageable && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/10">
                manageable
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {drug.indications?.slice(0, 3).join(" · ") ||
              "No indications listed"}
          </p>
        </div>

        {/* Action buttons */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {manageable && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald/10 hover:text-emerald"
                title="Edit drug"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400"
                title="Delete drug"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-emerald/60 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Detail Panel ─────────────────────────────────────────────────────── */
function DrugDetailPanel({
  drug,
  manageable,
  clinicName,
  onClose,
  onEdit,
  onDelete,
}: {
  drug: Drug;
  manageable: boolean;
  clinicName?: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar bg-sidebar/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_0_60px_-15px_rgba(16,185,129,0.2)] p-4 sm:p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald/25 to-cyan-500/15 flex items-center justify-center shadow-inner">
              <Pill className="w-7 h-7 text-emerald" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">
                {drug.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white/5 border border-white/5 text-muted-foreground">
                  {drug.drugClass}
                </span>
                <ScopeBadge drug={drug} clinicName={clinicName} />
              </div>
              {drug.clinic_id && (
                <p className="text-[10px] font-mono text-muted-foreground/50 mt-1">
                  clinic: {drug.clinic_id}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detail sections */}
        <div className="space-y-3">
          <DetailSection
            icon={<FlaskConical className="w-4 h-4 text-emerald" />}
            label="Indications"
            items={drug.indications}
          />
          <DetailSection
            icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
            label="Side Effects"
            items={drug.sideEffects}
          />
          <DetailSection
            icon={<Shield className="w-4 h-4 text-red-400" />}
            label="Contraindications"
            items={drug.contraindications}
          />
          <DetailSection
            icon={<Pill className="w-4 h-4 text-cyan-400" />}
            label="Drug Interactions"
            items={drug.drugInteractions}
          />

          {drug.dosage && Object.keys(drug.dosage).length > 0 && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Dosage Guidelines
              </p>
              <pre className="text-xs text-foreground/85 whitespace-pre-wrap font-mono leading-relaxed">
                {JSON.stringify(drug.dosage, null, 2)}
              </pre>
            </div>
          )}
          {drug.toxicity && Object.keys(drug.toxicity).length > 0 && (
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">
                Toxicity Information
              </p>
              <pre className="text-xs text-foreground/85 whitespace-pre-wrap font-mono leading-relaxed">
                {JSON.stringify(drug.toxicity, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Actions */}
        {manageable ? (
          <div className="flex gap-3 pt-2 border-t border-white/5">
            <Button
              onClick={onEdit}
              className="flex-1 bg-emerald hover:bg-emerald/90 text-white font-black h-12 rounded-xl shadow-lg shadow-emerald/20 gap-2"
            >
              <Pencil className="w-4 h-4" /> Edit Drug
            </Button>
            <Button
              onClick={onDelete}
              variant="ghost"
              className="flex-1 h-12 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 font-bold gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-xs text-muted-foreground/50 font-semibold">
            <Lock className="w-3.5 h-3.5" />
            {drug.clinic_id
              ? "This drug belongs to another clinic — read only."
              : "Global drug — contact admin to modify."}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function DetailSection({
  icon,
  label,
  items,
}: {
  icon: React.ReactNode;
  label: string;
  items?: string[];
}) {
  if (!items?.length) return null;
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 border border-white/5 text-foreground/80"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── CRUD Form ─────────────────────────────────────────────────────────── */
type DrugFormValues = {
  name: string;
  drugClass: string;
  indications: string;
  sideEffects: string;
  contraindications: string;
  drugInteractions: string;
  dosageDog: string;
  dosageCat: string;
  toxicityDog: string;
  toxicityCat: string;
  toxicitySeverityDog: string;
  toxicitySeverityCat: string;
  clinic_id: string; // "" means null (global), used by admin only
};

function DrugCrudForm({
  isOpen,
  onOpenChange,
  selectedDrug,
  level,
  clinicId,
  userClinicName,
  clinics,
  onSuccess,
}: {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  selectedDrug: Drug | null;
  level: ManageLevel;
  clinicId: string | null;
  userClinicName: string | null;
  clinics: Array<{ clinic_id: string; clinicName: string }>;
  onSuccess: () => void;
}) {
  const createDrug = useCreateDrug();
  const updateDrug = useUpdateDrug();
  const isAdmin = level === "admin";

  const formik = useFormik<DrugFormValues>({
    initialValues: {
      name: "",
      drugClass: "",
      indications: "",
      sideEffects: "",
      contraindications: "",
      drugInteractions: "",
      dosageDog: "",
      dosageCat: "",
      toxicityDog: "",
      toxicityCat: "",
      toxicitySeverityDog: "",
      toxicitySeverityCat: "",
      clinic_id: "",
    },
    onSubmit: (values, { setSubmitting, resetForm }) => {
      // Build payload — clinic_id is admin-only in the frontend payload.
      // For staff/owner the backend service auto-assigns it and ignores the field.
      const payload: DrugCreate = {
        name: values.name.trim(),
        drugClass: values.drugClass.trim(),
        indications: parseTagArray(values.indications),
        sideEffects: parseTagArray(values.sideEffects),
        contraindications: parseTagArray(values.contraindications),
        drugInteractions: parseTagArray(values.drugInteractions),
        dosage: {
          ...(values.dosageDog ? { dog: values.dosageDog.trim() } : {}),
          ...(values.dosageCat ? { cat: values.dosageCat.trim() } : {}),
        },
        toxicity: {
          ...(values.toxicityDog ? { dog: values.toxicityDog.trim() } : {}),
          ...(values.toxicityCat ? { cat: values.toxicityCat.trim() } : {}),
          ...(values.toxicitySeverityDog
            ? { severityDog: values.toxicitySeverityDog }
            : {}),
          ...(values.toxicitySeverityCat
            ? { severityCat: values.toxicitySeverityCat }
            : {}),
        },
        // Only send clinic_id from the form if admin (let backend auto-assign for others)
        ...(isAdmin && { clinic_id: values.clinic_id || null }),
      };

      if (selectedDrug) {
        updateDrug.mutate(
          { id: selectedDrug.drug_id, data: payload },
          {
            onSuccess: () => {
              setSubmitting(false);
              resetForm();
              onSuccess();
            },
            onError: () => setSubmitting(false),
          },
        );
      } else {
        createDrug.mutate(payload, {
          onSuccess: () => {
            setSubmitting(false);
            resetForm();
            onSuccess();
          },
          onError: () => setSubmitting(false),
        });
      }
    },
  });

  // Populate when editing
  React.useEffect(() => {
    if (isOpen) {
      if (selectedDrug) {
        formik.setValues({
          name: selectedDrug.name,
          drugClass: selectedDrug.drugClass,
          indications: tagArrayToString(selectedDrug.indications ?? []),
          sideEffects: tagArrayToString(selectedDrug.sideEffects ?? []),
          contraindications: tagArrayToString(
            selectedDrug.contraindications ?? [],
          ),
          drugInteractions: tagArrayToString(
            selectedDrug.drugInteractions ?? [],
          ),
          dosageDog: (selectedDrug.dosage as any)?.dog ?? "",
          dosageCat: (selectedDrug.dosage as any)?.cat ?? "",
          toxicityDog: (selectedDrug.toxicity as any)?.dog ?? "",
          toxicityCat: (selectedDrug.toxicity as any)?.cat ?? "",
          toxicitySeverityDog: (selectedDrug.toxicity as any)?.severityDog ?? "",
          toxicitySeverityCat: (selectedDrug.toxicity as any)?.severityCat ?? "",
          clinic_id: selectedDrug.clinic_id ?? "",
        });
      } else {
        formik.resetForm();
        // Admin starts with no clinic, staff/owner hint — doesn't matter, backend assigns
        if (!isAdmin && clinicId) {
          formik.setFieldValue("clinic_id", clinicId);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedDrug]);

  // Clinic hint for non-admin
  const clinicHint = !isAdmin
    ? (userClinicName ??
      clinics.find((c) => c.clinic_id === clinicId)?.clinicName ??
      clinicId)
    : null;

  return (
    <DashboardForm
      title={selectedDrug ? "Edit Drug" : "Add New Drug"}
      description={
        selectedDrug
          ? `Updating formulary record for ${selectedDrug.name}`
          : isAdmin
            ? "Register a drug — optionally assign to a clinic"
            : `Adding clinic drug — will be assigned to ${clinicHint ?? "your clinic"}`
      }
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onSubmit={(e) =>
        formik.handleSubmit(e as React.FormEvent<HTMLFormElement>)
      }
      submitLabel={
        formik.isSubmitting
          ? "Saving…"
          : selectedDrug
            ? "Save Changes"
            : "Add Drug"
      }
    >
      <div className="space-y-5">
        {/* Name + Class */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Drug Name" required>
            <Input
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              placeholder="e.g. Amoxicillin"
              className="h-12 bg-white/5 border-white/5 focus:border-emerald/30 rounded-xl font-semibold"
            />
          </Field>
          <Field label="Drug Class" required>
            <Input
              name="drugClass"
              value={formik.values.drugClass}
              onChange={formik.handleChange}
              placeholder="e.g. Antibiotic"
              className="h-12 bg-white/5 border-white/5 focus:border-emerald/30 rounded-xl font-semibold"
            />
          </Field>
        </div>

        {/* Admin: Clinic selector */}
        {isAdmin && (
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                Clinic Assignment (Admin Only)
              </p>
            </div>
            <Select
              value={formik.values.clinic_id}
              onValueChange={(val) =>
                formik.setFieldValue(
                  "clinic_id",
                  val === "__global__" ? "" : val,
                )
              }
            >
              <SelectTrigger className="h-12 bg-white/5 border-white/5 focus:border-blue-400/30 rounded-xl font-semibold">
                <SelectValue placeholder="Global (no clinic)" />
              </SelectTrigger>
              <SelectContent className="bg-sidebar/95 backdrop-blur-xl border-white/5 rounded-2xl p-2">
                <SelectItem
                  value="__global__"
                  className="rounded-xl font-bold py-3 cursor-pointer focus:bg-blue-500/10 focus:text-blue-400"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Global (visible to all)
                  </span>
                </SelectItem>
                {clinics.map((c) => (
                  <SelectItem
                    key={c.clinic_id}
                    value={c.clinic_id}
                    className="rounded-xl font-bold py-3 cursor-pointer focus:bg-emerald/10 focus:text-emerald"
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> {c.clinicName}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground/50 font-semibold px-1 flex items-center gap-1.5">
              <Info className="w-3 h-3" />
              Leave as Global to make this drug visible across all clinics.
            </p>
          </div>
        )}

        {/* Non-admin clinic hint */}
        {!isAdmin && clinicHint && (
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald/10 to-emerald/5 border border-emerald/20 p-4 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald/10 blur-[40px] rounded-full pointer-events-none" />
            <div className="flex items-start gap-4 mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald/10 flex items-center justify-center shrink-0 border border-emerald/20">
                <Building2 className="w-6 h-6 text-emerald" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-black text-emerald tracking-tight">
                  Clinic Assignment
                </h4>
                <p className="text-xs font-semibold text-emerald/80 leading-relaxed max-w-lg">
                  This drug will be exclusively assigned to{" "}
                  <span className="font-bold underline decoration-emerald/30 decoration-2 underline-offset-2">
                    {clinicHint}
                  </span>
                  .<br />
                  <span className="opacity-75">
                    It will not be visible to other clinics.
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 px-1">
          Separate multiple entries with commas
        </p>

        <Field label="Indications">
          <Input
            name="indications"
            value={formik.values.indications}
            onChange={formik.handleChange}
            placeholder="e.g. Bacterial infections, Respiratory tract"
            className="h-12 bg-white/5 border-white/5 focus:border-emerald/30 rounded-xl"
          />
        </Field>
        <Field label="Side Effects">
          <Input
            name="sideEffects"
            value={formik.values.sideEffects}
            onChange={formik.handleChange}
            placeholder="e.g. Nausea, Vomiting, Diarrhea"
            className="h-12 bg-white/5 border-white/5 focus:border-amber-400/30 rounded-xl"
          />
        </Field>
        <Field label="Contraindications">
          <Input
            name="contraindications"
            value={formik.values.contraindications}
            onChange={formik.handleChange}
            placeholder="e.g. Penicillin allergy, Renal failure"
            className="h-12 bg-white/5 border-white/5 focus:border-red-400/30 rounded-xl"
          />
        </Field>
        <Field label="Drug Interactions">
          <Input
            name="drugInteractions"
            value={formik.values.drugInteractions}
            onChange={formik.handleChange}
            placeholder="e.g. Warfarin, Methotrexate"
            className="h-12 bg-white/5 border-white/5 focus:border-cyan-400/30 rounded-xl"
          />
        </Field>
        {/* Specific Destructured Dosage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Dosage (Dog)">
            <Input
              name="dosageDog"
              value={formik.values.dosageDog}
              onChange={formik.handleChange}
              placeholder="e.g. 10mg/kg q8-12h"
              className="h-12 bg-white/5 border-white/5 focus:border-emerald/30 rounded-xl"
            />
          </Field>
          <Field label="Dosage (Cat)">
            <Input
              name="dosageCat"
              value={formik.values.dosageCat}
              onChange={formik.handleChange}
              placeholder="e.g. 5mg/kg q8-12h"
              className="h-12 bg-white/5 border-white/5 focus:border-emerald/30 rounded-xl"
            />
          </Field>
        </div>

        {/* Specific Destructured Toxicity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Toxicity (Dog)">
            <Input
              name="toxicityDog"
              value={formik.values.toxicityDog}
              onChange={formik.handleChange}
              placeholder="e.g. 500mg/kg"
              className="h-12 bg-muted/40 dark:bg-white/5 border-border dark:border-white/5 focus:border-red-400/30 rounded-xl"
            />
          </Field>
          <Field label="Toxicity (Cat)">
            <Input
              name="toxicityCat"
              value={formik.values.toxicityCat}
              onChange={formik.handleChange}
              placeholder="e.g. 300mg/kg"
              className="h-12 bg-muted/40 dark:bg-white/5 border-border dark:border-white/5 focus:border-red-400/30 rounded-xl"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Toxicity Severity (Dog)">
            <Select
              value={formik.values.toxicitySeverityDog}
              onValueChange={(val) =>
                formik.setFieldValue("toxicitySeverityDog", val)
              }
            >
              <SelectTrigger className="h-12 bg-muted/40 dark:bg-white/5 border-border dark:border-white/5 focus:border-red-400/30 rounded-xl font-semibold">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent className="bg-background/95 dark:bg-sidebar/95 backdrop-blur-xl border-border dark:border-white/5 rounded-2xl p-2">
                <SelectItem value="High" className="rounded-xl font-bold py-3 cursor-pointer focus:bg-red-500/20 focus:text-red-400">High</SelectItem>
                <SelectItem value="Medium" className="rounded-xl font-bold py-3 cursor-pointer focus:bg-amber-500/20 focus:text-amber-400">Medium</SelectItem>
                <SelectItem value="Low" className="rounded-xl font-bold py-3 cursor-pointer focus:bg-yellow-500/20 focus:text-yellow-400">Low</SelectItem>
                <SelectItem value="No" className="rounded-xl font-bold py-3 cursor-pointer focus:bg-emerald-500/20 focus:text-emerald-400">No Risk</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Toxicity Severity (Cat)">
            <Select
              value={formik.values.toxicitySeverityCat}
              onValueChange={(val) =>
                formik.setFieldValue("toxicitySeverityCat", val)
              }
            >
              <SelectTrigger className="h-12 bg-muted/40 dark:bg-white/5 border-border dark:border-white/5 focus:border-red-400/30 rounded-xl font-semibold">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent className="bg-background/95 dark:bg-sidebar/95 backdrop-blur-xl border-border dark:border-white/5 rounded-2xl p-2">
                <SelectItem value="High" className="rounded-xl font-bold py-3 cursor-pointer focus:bg-red-500/20 focus:text-red-400">High</SelectItem>
                <SelectItem value="Medium" className="rounded-xl font-bold py-3 cursor-pointer focus:bg-amber-500/20 focus:text-amber-400">Medium</SelectItem>
                <SelectItem value="Low" className="rounded-xl font-bold py-3 cursor-pointer focus:bg-yellow-500/20 focus:text-yellow-400">Low</SelectItem>
                <SelectItem value="No" className="rounded-xl font-bold py-3 cursor-pointer focus:bg-emerald-500/20 focus:text-emerald-400">No Risk</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    </DashboardForm>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
        {label}
        {required && <span className="text-emerald ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

/* ── Bulk Import Modal ─────────────────────────────────────────────────── */
function ImportJsonModal({
  isOpen,
  onOpenChange,
  isAdmin,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
}) {
  const createDrug = useCreateDrug();
  const [jsonText, setJsonText] = React.useState("");
  const [error, setError] = React.useState("");
  const [isImporting, setIsImporting] = React.useState(false);

  const handleImport = async () => {
    setError("");
    if (!jsonText.trim()) return;

    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error("The JSON root must be an array of drug objects.");
      }
      setIsImporting(true);

      // Execute all creations in parallel
      const importPromises = parsed.map(async (item: any) => {
        if (!item.name || !item.drugClass) {
          throw new Error("One or more items missing required 'name' or 'drugClass'.");
        }

        const payload = {
          name: item.name,
          drugClass: item.drugClass,
          indications: Array.isArray(item.indications) ? item.indications : [],
          sideEffects: Array.isArray(item.sideEffects) ? item.sideEffects : [],
          contraindications: Array.isArray(item.contraindications) ? item.contraindications : [],
          drugInteractions: Array.isArray(item.drugInteractions) ? item.drugInteractions : [],
          dosage: typeof item.dosage === "object" && item.dosage !== null ? item.dosage : {},
          toxicity: typeof item.toxicity === "object" && item.toxicity !== null ? item.toxicity : {},
          ...(isAdmin && item.clinic_id !== undefined ? { clinic_id: item.clinic_id } : {})
        };

        return createDrug.mutateAsync(payload as any);
      });

      await Promise.all(importPromises);

      setIsImporting(false);
      onOpenChange(false);
      setJsonText("");
    } catch (e: any) {
      setIsImporting(false);
      setError(e.message || "Failed to parse JSON. Please check the format.");
    }
  };

  return (
    <DashboardForm
      title="Import Drugs via JSON"
      description="Paste a standard JSON array of drug objects to import in bulk."
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onSubmit={(e) => {
        e.preventDefault();
        handleImport();
      }}
      submitLabel={isImporting ? "Importing Drugs..." : "Start Import"}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold leading-relaxed shadow-inner">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4" /> Error parsing payload
            </div>
            {error}
          </div>
        )}
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3 text-xs font-medium text-blue-300/80">
          <p className="font-bold flex items-center gap-2.5 text-blue-400 text-sm">
            <FileJson className="w-5 h-5" /> Expected JSON Shape Example:
          </p>
          <pre className="p-4 bg-black/20 rounded-xl overflow-x-auto text-[10px] text-blue-200/90 font-mono shadow-inner border border-black/20">
            {`[
  {
    "name": "Amoxicillin",
    "drugClass": "Antibiotic",
    "indications": ["Bacterial infections"],
    "sideEffects": ["Diarrhea"],
    "contraindications": [],
    "drugInteractions": [],
    "dosage": { "dog": "10mg/kg q8-12h", "cat": "5mg/kg q8-12h" },
    "toxicity": { "LD50": "500mg/kg", "severity": "Low" }
  }
]`}
          </pre>
        </div>
        <div className="space-y-2.5">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
            JSON Payload
          </Label>
          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={10}
            className="p-4 bg-white/5 border-white/5 focus:border-emerald/30 rounded-2xl font-mono text-xs resize-none shadow-inner"
            placeholder="[ { ... }, { ... } ]"
          />
        </div>
      </div>
    </DashboardForm>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function DrugsPage() {
  const { user } = useAuth();
  const level = useManageLevel();
  const isAdmin = level === "admin";
  const isClinicStaff = level === "clinic";
  const clinicId = user?.clinicId ?? null;

  const [search, setSearch] = React.useState("");
  const [scopeFilter, setScopeFilter] = React.useState<
    "all" | "global" | "clinic"
  >("all");
  const [selectedDrug, setSelectedDrug] = React.useState<Drug | null>(null);
  const [editDrug, setEditDrug] = React.useState<Drug | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);

  const { data: drugsData, isLoading, isError } = useDrugs();
  const { data: clinicsData } = useClinics();
  const deleteDrug = useDeleteDrug();

  const allDrugs = drugsData?.data ?? [];
  const clinics = clinicsData?.data ?? [];

  // Clinic name lookup
  const clinicNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    clinics.forEach((c) => {
      map[c.clinic_id] = c.clinicName;
    });
    return map;
  }, [clinics]);

  const getClinicName = (cid?: string | null) =>
    cid ? (clinicNameMap[cid] ?? cid) : undefined;

  /* Filtered list:
   * - Backend already filters for staff/owner (returns only global + their clinic).
   * - Admin receives all. We apply additional client-side scope filter for admin. */
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return allDrugs.filter((d) => {
      const matchSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.drugClass.toLowerCase().includes(q) ||
        d.indications?.some((i) => i.toLowerCase().includes(q));
      const matchScope =
        scopeFilter === "all" ||
        (scopeFilter === "global" && !d.clinic_id) ||
        (scopeFilter === "clinic" && !!d.clinic_id);
      return matchSearch && matchScope;
    });
  }, [allDrugs, search, scopeFilter]);

  const globalCount = allDrugs.filter((d) => !d.clinic_id).length;
  const clinicCount = allDrugs.filter((d) => !!d.clinic_id).length;

  const handleOpenAdd = () => {
    setEditDrug(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (drug: Drug) => {
    setSelectedDrug(null);
    setEditDrug(drug);
    setIsFormOpen(true);
  };

  const handleDelete = (drug: Drug) => {
    if (!confirm(`Delete "${drug.name}"? This cannot be undone.`)) return;
    deleteDrug.mutate(drug.drug_id);
    if (selectedDrug?.drug_id === drug.drug_id) setSelectedDrug(null);
  };

  const canAdd = level !== "readonly";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-5 h-5 text-emerald fill-emerald/20" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">
              Pharmacology
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Drug Formulary
          </h1>
          <p className="text-muted-foreground font-medium">
            {allDrugs.length} drugs visible ·{" "}
            <span className="text-blue-400">{globalCount} global</span> ·{" "}
            <span className="text-emerald">{clinicCount} clinic-specific</span>
          </p>
        </div>
        {canAdd && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={() => setIsImportOpen(true)}
              variant="outline"
              className="bg-transparent hover:bg-white/5 border-white/10 text-foreground font-bold px-5 h-12 rounded-xl transition-all w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import JSON
            </Button>
            <Button
              onClick={handleOpenAdd}
              className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center justify-center gap-2 group transition-all duration-300 rounded-xl w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300 shrink-0" />
              Add Drug
            </Button>
          </div>
        )}
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total",
            value: allDrugs.length,
            color: "text-foreground",
            bg: "bg-white/5",
          },
          {
            label: "Global",
            value: globalCount,
            color: "text-blue-400",
            bg: "bg-blue-500/5",
            icon: <Globe className="w-4 h-4 text-blue-400" />,
          },
          {
            label: "Clinic",
            value: clinicCount,
            color: "text-emerald",
            bg: "bg-emerald/5",
            icon: <Building2 className="w-4 h-4 text-emerald" />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} border border-white/5 rounded-2xl px-5 py-4`}
          >
            <div className="flex items-center gap-2 mb-1">
              {s.icon}
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
            </div>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Role info banner ── */}
      {isClinicStaff && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-xs font-semibold text-amber-400">
          <Building2 className="w-4 h-4 shrink-0" />
          <span>
            You can manage drugs assigned to{" "}
            <span className="font-black">
              {user?.clinicName ?? "your clinic"}
            </span>
            . Global drugs are read-only — contact admin to modify them.
          </span>
        </div>
      )}
      {level === "readonly" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-xs font-semibold text-muted-foreground">
          <Lock className="w-4 h-4 shrink-0" />
          You have read-only access to the formulary as{" "}
          <span className="capitalize font-black text-foreground/70">
            {user?.role}
          </span>
          .
        </div>
      )}

      {/* ── Search + Scope filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald transition-colors" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, class, or indication…"
            className="pl-11 h-12 bg-white/5 border-white/5 focus:border-emerald/30 rounded-xl font-medium"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "global", "clinic"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setScopeFilter(f)}
              className={`px-4 h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                scopeFilter === f
                  ? "bg-emerald text-white shadow-lg shadow-emerald/20"
                  : "bg-white/5 border border-white/5 text-muted-foreground hover:border-emerald/20 hover:text-emerald"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Drug list ── */}
      {isLoading ? (
        <DrugSkeleton />
      ) : isError ? (
        <div className="text-center py-16 text-red-400 font-semibold">
          Failed to load drugs. Please try again.
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Pill className="w-12 h-12 text-muted-foreground/20 mx-auto" />
          <p className="text-muted-foreground font-semibold">
            {search ? "No drugs match your search." : "No drugs found."}
          </p>
          {canAdd && !search && (
            <Button
              onClick={handleOpenAdd}
              variant="ghost"
              className="text-emerald hover:bg-emerald/10 border border-emerald/20 rounded-xl font-bold"
            >
              <Plus className="w-4 h-4 mr-2" /> Add the first drug
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((drug, i) => {
            const manageable = canManageDrug(drug, level, clinicId);
            return (
              <DrugRow
                key={drug.drug_id}
                drug={drug}
                index={i}
                manageable={manageable}
                clinicName={isAdmin ? getClinicName(drug.clinic_id) : undefined}
                onSelect={() => setSelectedDrug(drug)}
                onEdit={() => handleOpenEdit(drug)}
                onDelete={() => handleDelete(drug)}
              />
            );
          })}
        </div>
      )}

      {/* ── Detail panel ── */}
      <AnimatePresence>
        {selectedDrug && (
          <DrugDetailPanel
            drug={selectedDrug}
            manageable={canManageDrug(selectedDrug, level, clinicId)}
            clinicName={
              isAdmin ? getClinicName(selectedDrug.clinic_id) : undefined
            }
            onClose={() => setSelectedDrug(null)}
            onEdit={() => handleOpenEdit(selectedDrug)}
            onDelete={() => handleDelete(selectedDrug)}
          />
        )}
      </AnimatePresence>

      {/* ── CRUD form ── */}
      {canAdd && (
        <DrugCrudForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          selectedDrug={editDrug}
          level={level}
          clinicId={clinicId}
          userClinicName={user?.clinicName ?? null}
          clinics={clinics}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditDrug(null);
          }}
        />
      )}

      {/* ── Import Modal ── */}
      {canAdd && (
        <ImportJsonModal
          isOpen={isImportOpen}
          onOpenChange={setIsImportOpen}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
