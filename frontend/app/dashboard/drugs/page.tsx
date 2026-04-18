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
import { toast } from "sonner";

import { useAuth } from "@/app/_hooks/useAuth";
import { useLang } from "@/app/_hooks/useLanguage";
import {
  useDrugs,
  useCreateDrug,
  useUpdateDrug,
  useDeleteDrug,
} from "@/app/_hooks/queries/use-drugs";
import { useClinics } from "@/app/_hooks/queries/use-clinics";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Checkbox } from "@/app/_components/ui/checkbox";
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

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const asText = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

const asObject = (value: unknown): UnknownRecord =>
  isRecord(value) ? value : {};

const toDisplayText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
};

const extractToxicityDescription = (value: unknown): string => {
  if (isRecord(value)) {
    const description = toDisplayText(value.description);
    if (description) return description;
    const fallbackValue = toDisplayText(value.value);
    if (fallbackValue) return fallbackValue;
  }
  return toDisplayText(value);
};

const extractToxicitySeverity = (value: unknown): string => {
  if (isRecord(value)) {
    return toDisplayText(value.status);
  }
  return toDisplayText(value);
};

const getSeverityBadgeTone = (severity: string): string => {
  const normalized = severity.toLowerCase();
  if (normalized === "high") {
    return "bg-red-500/15 border-red-500/25 text-red-300";
  }
  if (normalized === "medium") {
    return "bg-amber-500/15 border-amber-500/25 text-amber-300";
  }
  if (normalized === "low") {
    return "bg-yellow-500/15 border-yellow-500/25 text-yellow-300";
  }
  return "bg-emerald/15 border-emerald/25 text-emerald";
};

type ClinicOption = { clinic_id: string; clinicName: string };
const EMPTY_DRUGS: Drug[] = [];
const EMPTY_CLINICS: ClinicOption[] = [];

/* ── Skeleton ─────────────────────────────────────────────────────────── */
function DrugSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-20 rounded-2xl bg-tint/5 border border-tint/5"
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
  selected,
  selectable,
  onSelect,
  onToggleSelect,
  onEdit,
  onDelete,
}: {
  drug: Drug;
  index: number;
  manageable: boolean;
  clinicName?: string;
  selected: boolean;
  selectable: boolean;
  onSelect: () => void;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.32, ease: "easeOut" }}
      onClick={onSelect}
      className="group relative bg-tint/5 backdrop-blur-md border border-tint/5 hover:border-emerald/20 rounded-2xl px-5 py-4 cursor-pointer transition-all duration-300 hover:bg-tint/8 hover:shadow-[0_0_28px_-8px_rgba(16,185,129,0.12)]"
    >
      <div className="flex items-center gap-4">
        {selectable && (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selected}
              onCheckedChange={onToggleSelect}
              className="border-emerald/30 data-[state=checked]:bg-emerald data-[state=checked]:text-white"
              aria-label="Select drug"
            />
          </div>
        )}

        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-linear-to-br from-emerald/20 to-cyan-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
          <Pill className="w-5 h-5 text-emerald" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-black text-foreground tracking-tight group-hover:text-emerald transition-colors">
              {drug.name}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-tint/5 text-muted-foreground">
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
                className="h-9 w-9 rounded-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-emerald/10 hover:text-emerald"
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
                className="h-9 w-9 rounded-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400"
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
  const { t } = useLang();
  const toxicityData = asObject(drug.toxicity);
  const dogToxicity = extractToxicityDescription(toxicityData.dog);
  const catToxicity = extractToxicityDescription(toxicityData.cat);
  const dogSeverity =
    extractToxicitySeverity(toxicityData.severityDog) ||
    extractToxicitySeverity(toxicityData.dog);
  const catSeverity =
    extractToxicitySeverity(toxicityData.severityCat) ||
    extractToxicitySeverity(toxicityData.cat);
  const genericToxicityEntries = Object.entries(toxicityData).filter(
    ([key]) =>
      key !== "dog" &&
      key !== "cat" &&
      key !== "severityDog" &&
      key !== "severityCat",
  );

  const hasToxicityDetails =
    !!dogToxicity || !!catToxicity || genericToxicityEntries.length > 0;

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
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar bg-sidebar/80 backdrop-blur-3xl border border-tint/10 rounded-3xl shadow-[0_0_60px_-15px_rgba(16,185,129,0.2)] p-4 sm:p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-emerald/25 to-cyan-500/15 flex items-center justify-center shadow-inner">
              <Pill className="w-7 h-7 text-emerald" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">
                {drug.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-tint/5 border border-tint/5 text-muted-foreground">
                  {drug.drugClass}
                </span>
                <ScopeBadge drug={drug} clinicName={clinicName} />
              </div>
              {drug.clinic_id && (
                <p className="text-[10px] font-mono text-muted-foreground/50 mt-1">
                  {t("clinic")}: {drug.clinic_id}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-tint/10 transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detail sections */}
        <div className="space-y-3">
          <DetailSection
            icon={<FlaskConical className="w-4 h-4 text-emerald" />}
            label={t("indications_label")}
            items={drug.indications}
          />
          <DetailSection
            icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
            label={t("side_effects")}
            items={drug.sideEffects}
          />
          <DetailSection
            icon={<Shield className="w-4 h-4 text-red-400" />}
            label={t("contraindications_label")}
            items={drug.contraindications}
          />
          <DetailSection
            icon={<Pill className="w-4 h-4 text-cyan-400" />}
            label={t("drug_interactions_label")}
            items={drug.drugInteractions}
          />

          {drug.dosage && Object.keys(drug.dosage).length > 0 && (
            <div className="p-4 rounded-2xl bg-tint/5 border border-tint/5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="w-4 h-4 text-cyan-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("dosage_guidelines")}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(drug.dosage as Record<string, string>).map(
                  ([k, v]) => (
                    <div
                      key={k}
                      className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-1">
                        {k}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {String(v)}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
          {hasToxicityDetails && (
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
                  {t("toxicity_information")}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dogToxicity && (
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
                        Dog
                      </p>
                      {dogSeverity && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${getSeverityBadgeTone(dogSeverity)}`}
                        >
                          {dogSeverity}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {dogToxicity}
                    </p>
                  </div>
                )}

                {catToxicity && (
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
                        Cat
                      </p>
                      {catSeverity && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${getSeverityBadgeTone(catSeverity)}`}
                        >
                          {catSeverity}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {catToxicity}
                    </p>
                  </div>
                )}

                {genericToxicityEntries.map(([k, v]) => {
                  const value = extractToxicityDescription(v);
                  if (!value) return null;
                  return (
                    <div
                      key={k}
                      className="p-3 rounded-xl bg-red-500/5 border border-red-500/10"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">
                        {k}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {manageable ? (
          <div className="flex gap-3 pt-2 border-t border-tint/5">
            <Button
              onClick={onEdit}
              className="flex-1 bg-emerald hover:bg-emerald/90 text-white font-black h-12 rounded-xl shadow-lg shadow-emerald/20 gap-2"
            >
              <Pencil className="w-4 h-4" /> {t("edit_drug")}
            </Button>
            <Button
              onClick={onDelete}
              variant="ghost"
              className="flex-1 h-12 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 font-bold gap-2"
            >
              <Trash2 className="w-4 h-4" /> {t("delete_drug")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-2 border-t border-tint/5 text-xs text-muted-foreground/50 font-semibold">
            <Lock className="w-3.5 h-3.5" />
            {drug.clinic_id
              ? t("read_only_other_clinic")
              : t("global_contact_admin")}
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
    <div className="p-4 rounded-2xl bg-tint/5 border border-border/30">
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
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-tint/5 border border-tint/5 text-foreground/90"
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
  ownerClinicOptions,
  enableClinicSelectionForOwner,
  defaultClinicIdForCreate,
  onSuccess,
}: {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  selectedDrug: Drug | null;
  level: ManageLevel;
  clinicId: string | null;
  userClinicName: string | null;
  clinics: Array<{ clinic_id: string; clinicName: string }>;
  ownerClinicOptions: Array<{ clinic_id: string; clinicName: string }>;
  enableClinicSelectionForOwner: boolean;
  defaultClinicIdForCreate: string | null;
  onSuccess: () => void;
}) {
  const createDrug = useCreateDrug();
  const updateDrug = useUpdateDrug();
  const { t } = useLang();
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
      const selectedClinicId = values.clinic_id || null;

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
        ...(isAdmin && { clinic_id: selectedClinicId }),
        ...(!isAdmin &&
          enableClinicSelectionForOwner &&
          selectedClinicId && { clinic_id: selectedClinicId }),
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
        const dosage = asObject(selectedDrug.dosage);
        const toxicity = asObject(selectedDrug.toxicity);
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
          dosageDog: asText(dosage.dog),
          dosageCat: asText(dosage.cat),
          toxicityDog: asText(toxicity.dog),
          toxicityCat: asText(toxicity.cat),
          toxicitySeverityDog: asText(toxicity.severityDog),
          toxicitySeverityCat: asText(toxicity.severityCat),
          clinic_id: selectedDrug.clinic_id ?? "",
        });
      } else {
        formik.resetForm();
        // Admin starts with no clinic, staff/owner hint — doesn't matter, backend assigns
        if (!isAdmin && defaultClinicIdForCreate) {
          formik.setFieldValue("clinic_id", defaultClinicIdForCreate);
        } else if (!isAdmin && clinicId) {
          formik.setFieldValue("clinic_id", clinicId);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedDrug]);

  // Clinic hint for non-admin
  const clinicHintId =
    !isAdmin && enableClinicSelectionForOwner
      ? formik.values.clinic_id || defaultClinicIdForCreate
      : clinicId;

  const clinicHint = !isAdmin
    ? (userClinicName ??
      clinics.find((c) => c.clinic_id === clinicHintId)?.clinicName ??
      clinicHintId)
    : null;

  return (
    <DashboardForm
      title={selectedDrug ? t("edit_drug_title") : t("add_new_drug")}
      description={
        selectedDrug
          ? `${t("updating_formulary_for")} ${selectedDrug.name}`
          : isAdmin
            ? t("admin_register_drug_hint")
            : `${t("clinic_drug_adding_hint")} ${clinicHint ?? t("your_clinic")}`
      }
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onSubmit={(e) =>
        formik.handleSubmit(e as React.FormEvent<HTMLFormElement>)
      }
      submitLabel={
        formik.isSubmitting
          ? t("saving_ellipsis")
          : selectedDrug
            ? t("save_changes")
            : t("add_drug")
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
              className="h-12 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl font-semibold"
            />
          </Field>
          <Field label="Drug Class" required>
            <Input
              name="drugClass"
              value={formik.values.drugClass}
              onChange={formik.handleChange}
              placeholder="e.g. Antibiotic"
              className="h-12 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl font-semibold"
            />
          </Field>
        </div>

        {/* Admin: Clinic selector */}
        {isAdmin && (
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                {t("clinic_assignment_admin_only")}
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
              <SelectTrigger className="h-12 bg-tint/5 border-tint/5 focus:border-blue-400/30 rounded-xl font-semibold">
                <SelectValue placeholder={t("global_no_clinic")} />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl p-2">
                <SelectItem
                  value="__global__"
                  className="rounded-xl font-bold py-3 cursor-pointer focus:bg-blue-500/10 focus:text-blue-400"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4" /> {t("global_visible")}
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
              {t("leave_global_hint")}
            </p>
          </div>
        )}

        {/* Owner (multi-clinic): choose target clinic */}
        {!isAdmin &&
          enableClinicSelectionForOwner &&
          ownerClinicOptions.length > 1 && (
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                  {t("clinic_assignment")}
                </p>
              </div>
              <Select
                value={formik.values.clinic_id}
                onValueChange={(val) => formik.setFieldValue("clinic_id", val)}
              >
                <SelectTrigger className="h-12 bg-tint/5 border-tint/5 focus:border-blue-400/30 rounded-xl font-semibold">
                  <SelectValue placeholder={t("clinic")} />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl p-2">
                  {ownerClinicOptions.map((c) => (
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
            </div>
          )}

        {/* Non-admin clinic hint */}
        {!isAdmin && clinicHint && (
          <div className="overflow-hidden rounded-2xl bg-linear-to-br from-emerald/10 to-emerald/5 border border-emerald/20 p-4 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald/10 blur-2xl rounded-full pointer-events-none" />
            <div className="flex items-start gap-4 mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald/10 flex items-center justify-center shrink-0 border border-emerald/20">
                <Building2 className="w-6 h-6 text-emerald" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-black text-emerald tracking-tight">
                  {t("clinic_assignment")}
                </h4>
                <p className="text-xs font-semibold text-emerald/80 leading-relaxed max-w-lg">
                  {t("drug_exclusively_assigned_to")}{" "}
                  <span className="font-bold underline decoration-emerald/30 decoration-2 underline-offset-2">
                    {clinicHint}
                  </span>
                  .<br />
                  <span className="opacity-75">
                    {t("not_visible_other_clinics")}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 px-1">
          {t("separate_with_commas")}
        </p>

        <Field label={t("indications_label")}>
          <Input
            name="indications"
            value={formik.values.indications}
            onChange={formik.handleChange}
            placeholder="e.g. Bacterial infections, Respiratory tract"
            className="h-12 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl"
          />
        </Field>
        <Field label={t("side_effects")}>
          <Input
            name="sideEffects"
            value={formik.values.sideEffects}
            onChange={formik.handleChange}
            placeholder="e.g. Nausea, Vomiting, Diarrhea"
            className="h-12 bg-tint/5 border-tint/5 focus:border-amber-400/30 rounded-xl"
          />
        </Field>
        <Field label={t("contraindications_label")}>
          <Input
            name="contraindications"
            value={formik.values.contraindications}
            onChange={formik.handleChange}
            placeholder="e.g. Penicillin allergy, Renal failure"
            className="h-12 bg-tint/5 border-tint/5 focus:border-red-400/30 rounded-xl"
          />
        </Field>
        <Field label={t("drug_interactions_label")}>
          <Input
            name="drugInteractions"
            value={formik.values.drugInteractions}
            onChange={formik.handleChange}
            placeholder="e.g. Warfarin, Methotrexate"
            className="h-12 bg-tint/5 border-tint/5 focus:border-cyan-400/30 rounded-xl"
          />
        </Field>
        {/* Specific Destructured Dosage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("dosage_dog")}>
            <Input
              name="dosageDog"
              value={formik.values.dosageDog}
              onChange={formik.handleChange}
              placeholder="e.g. 10mg/kg q8-12h"
              className="h-12 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl"
            />
          </Field>
          <Field label={t("dosage_cat")}>
            <Input
              name="dosageCat"
              value={formik.values.dosageCat}
              onChange={formik.handleChange}
              placeholder="e.g. 5mg/kg q8-12h"
              className="h-12 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl"
            />
          </Field>
        </div>

        {/* Specific Destructured Toxicity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("toxicity_dog")}>
            <Input
              name="toxicityDog"
              value={formik.values.toxicityDog}
              onChange={formik.handleChange}
              placeholder="e.g. 500mg/kg"
              className="h-12 bg-muted/40 border-border focus:border-red-400/30 rounded-xl"
            />
          </Field>
          <Field label={t("toxicity_cat")}>
            <Input
              name="toxicityCat"
              value={formik.values.toxicityCat}
              onChange={formik.handleChange}
              placeholder="e.g. 300mg/kg"
              className="h-12 bg-muted/40 border-border focus:border-red-400/30 rounded-xl"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("toxicity_severity_dog")}>
            <Select
              value={formik.values.toxicitySeverityDog}
              onValueChange={(val) =>
                formik.setFieldValue("toxicitySeverityDog", val)
              }
            >
              <SelectTrigger className="h-12 bg-muted/40 border-border focus:border-red-400/30 rounded-xl font-semibold">
                <SelectValue placeholder={t("select_severity")} />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border rounded-2xl p-2">
                <SelectItem
                  value="High"
                  className="rounded-xl font-bold py-3 cursor-pointer focus:bg-red-500/20 focus:text-red-400"
                >
                  {t("high")}
                </SelectItem>
                <SelectItem
                  value="Medium"
                  className="rounded-xl font-bold py-3 cursor-pointer focus:bg-amber-500/20 focus:text-amber-400"
                >
                  {t("medium")}
                </SelectItem>
                <SelectItem
                  value="Low"
                  className="rounded-xl font-bold py-3 cursor-pointer focus:bg-yellow-500/20 focus:text-yellow-400"
                >
                  {t("low")}
                </SelectItem>
                <SelectItem
                  value="No"
                  className="rounded-xl font-bold py-3 cursor-pointer focus:bg-emerald-500/20 focus:text-emerald-400"
                >
                  {t("no_risk")}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("toxicity_severity_cat")}>
            <Select
              value={formik.values.toxicitySeverityCat}
              onValueChange={(val) =>
                formik.setFieldValue("toxicitySeverityCat", val)
              }
            >
              <SelectTrigger className="h-12 bg-muted/40 border-border focus:border-red-400/30 rounded-xl font-semibold">
                <SelectValue placeholder={t("select_severity")} />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border rounded-2xl p-2">
                <SelectItem
                  value="High"
                  className="rounded-xl font-bold py-3 cursor-pointer focus:bg-red-500/20 focus:text-red-400"
                >
                  {t("high")}
                </SelectItem>
                <SelectItem
                  value="Medium"
                  className="rounded-xl font-bold py-3 cursor-pointer focus:bg-amber-500/20 focus:text-amber-400"
                >
                  {t("medium")}
                </SelectItem>
                <SelectItem
                  value="Low"
                  className="rounded-xl font-bold py-3 cursor-pointer focus:bg-yellow-500/20 focus:text-yellow-400"
                >
                  {t("low")}
                </SelectItem>
                <SelectItem
                  value="No"
                  className="rounded-xl font-bold py-3 cursor-pointer focus:bg-emerald-500/20 focus:text-emerald-400"
                >
                  {t("no_risk")}
                </SelectItem>
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
  const { t } = useLang();
  const [jsonText, setJsonText] = React.useState("");
  const [error, setError] = React.useState("");
  const [isImporting, setIsImporting] = React.useState(false);

  const handleImport = async () => {
    setError("");
    if (!jsonText.trim()) return;

    try {
      const parsed: unknown = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error("The JSON root must be an array of drug objects.");
      }
      setIsImporting(true);

      // Execute all creations in parallel
      const importPromises = parsed.map(async (item) => {
        if (!isRecord(item)) {
          throw new Error("Each item must be a JSON object.");
        }

        const name = typeof item.name === "string" ? item.name.trim() : "";
        const drugClass =
          typeof item.drugClass === "string" ? item.drugClass.trim() : "";

        if (!name || !drugClass) {
          throw new Error(
            "One or more items missing required 'name' or 'drugClass'.",
          );
        }

        const payload: DrugCreate = {
          name,
          drugClass,
          indications: asStringArray(item.indications),
          sideEffects: asStringArray(item.sideEffects),
          contraindications: asStringArray(item.contraindications),
          drugInteractions: asStringArray(item.drugInteractions),
          dosage: asObject(item.dosage),
          toxicity: asObject(item.toxicity),
          ...(isAdmin &&
            (typeof item.clinic_id === "string" || item.clinic_id === null) && {
              clinic_id: item.clinic_id,
            }),
        };

        return createDrug.mutateAsync(payload);
      });

      await Promise.all(importPromises);

      setIsImporting(false);
      onOpenChange(false);
      setJsonText("");
    } catch (e: unknown) {
      setIsImporting(false);
      setError(
        e instanceof Error
          ? e.message
          : "Failed to parse JSON. Please check the format.",
      );
    }
  };

  return (
    <DashboardForm
      title={t("import_drugs_json")}
      description={t("import_drugs_desc")}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onSubmit={(e) => {
        e.preventDefault();
        handleImport();
      }}
      submitLabel={isImporting ? t("importing_drugs") : t("start_import")}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold leading-relaxed shadow-inner">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4" /> {t("error_parsing_payload")}
            </div>
            {error}
          </div>
        )}
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3 text-xs font-medium text-blue-300/80">
          <p className="font-bold flex items-center gap-2.5 text-blue-400 text-sm">
            <FileJson className="w-5 h-5" /> {t("json_shape_example")}
          </p>
          <pre className="block w-full p-3 sm:p-4 mx-0 bg-blue-950/5 dark:bg-black/20 rounded-xl overflow-x-auto text-[10px] text-blue-800 dark:text-blue-200/90 font-mono shadow-inner border border-blue-500/10 dark:border-black/20 leading-relaxed">
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
            {t("json_payload")}
          </Label>
          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={10}
            className="p-4 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-2xl font-mono text-xs resize-none shadow-inner"
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
  const { t } = useLang();
  const level = useManageLevel();
  const isAdmin = level === "admin";
  const isOwner = user?.role === "owner";
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
  const [selectedDrugIds, setSelectedDrugIds] = React.useState<string[]>([]);
  const [ownerClinicFilter, setOwnerClinicFilter] =
    React.useState<string>("all");

  const { data: drugsData, isLoading, isError } = useDrugs();
  const { data: clinicsData } = useClinics();
  const deleteDrug = useDeleteDrug();

  const allDrugs = drugsData?.data ?? EMPTY_DRUGS;
  const clinics = clinicsData?.data ?? EMPTY_CLINICS;
  const ownerClinicOptions = isOwner ? clinics : [];

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
      const matchOwnerClinic =
        !isOwner ||
        ownerClinicFilter === "all" ||
        d.clinic_id === ownerClinicFilter;
      return matchSearch && matchScope && matchOwnerClinic;
    });
  }, [allDrugs, search, scopeFilter, isOwner, ownerClinicFilter]);

  const bulkDeletableDrugIds = React.useMemo(
    () =>
      filtered
        .filter((drug) => canManageDrug(drug, level, clinicId))
        .map((drug) => drug.drug_id),
    [filtered, level, clinicId],
  );

  React.useEffect(() => {
    const allowed = new Set(bulkDeletableDrugIds);
    setSelectedDrugIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [bulkDeletableDrugIds]);

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
    deleteDrug.mutate(drug.drug_id, {
      onSuccess: () => {
        setSelectedDrugIds((prev) =>
          prev.filter((drugId) => drugId !== drug.drug_id),
        );
      },
    });
    if (selectedDrug?.drug_id === drug.drug_id) setSelectedDrug(null);
  };

  const toggleDrugSelection = (drugId: string) => {
    setSelectedDrugIds((prev) =>
      prev.includes(drugId)
        ? prev.filter((id) => id !== drugId)
        : [...prev, drugId],
    );
  };

  const toggleSelectAllDrugs = () => {
    setSelectedDrugIds((prev) =>
      prev.length === bulkDeletableDrugIds.length ? [] : bulkDeletableDrugIds,
    );
  };

  const handleBulkDelete = async () => {
    if (selectedDrugIds.length === 0) return;
    const count = selectedDrugIds.length;
    if (!confirm(`Delete ${count} selected drug${count > 1 ? "s" : ""}?`)) {
      return;
    }

    const ids = [...selectedDrugIds];
    const results = await Promise.allSettled(
      ids.map((id) => deleteDrug.mutateAsync(id)),
    );

    const failedIds: string[] = [];
    let successCount = 0;
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        successCount += 1;
      } else {
        failedIds.push(ids[index]);
      }
    });

    if (successCount > 0) {
      toast.success(
        `Deleted ${successCount} drug${successCount > 1 ? "s" : ""}.`,
      );
    }
    if (failedIds.length > 0) {
      toast.error(
        `Failed to delete ${failedIds.length} drug${failedIds.length > 1 ? "s" : ""}.`,
      );
    }

    setSelectedDrugIds(failedIds);
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
              {t("pharmacology")}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            {t("drug_formulary")}
          </h1>
          <p className="text-muted-foreground font-medium">
            {allDrugs.length} {t("drugs_label")} ·{" "}
            <span className="text-blue-400">
              {globalCount} {t("global_visible")}
            </span>
          </p>
        </div>
        {canAdd && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={() => setIsImportOpen(true)}
              variant="outline"
              className="bg-transparent hover:bg-tint/5 border-tint/10 text-foreground font-bold px-5 h-12 rounded-xl transition-all w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t("bulk_import_json")}
            </Button>
            <Button
              onClick={handleOpenAdd}
              className="bg-emerald hover:bg-emerald/90 text-white font-black px-6 h-12 shadow-xl shadow-emerald/20 flex items-center justify-center gap-2 group transition-all duration-300 rounded-xl w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300 shrink-0" />
              {t("add_drug")}
            </Button>
          </div>
        )}
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: t("total_stat_label"),
            value: allDrugs.length,
            color: "text-foreground",
            bg: "bg-tint/5",
          },
          {
            label: t("scope_global"),
            value: globalCount,
            color: "text-blue-400",
            bg: "bg-blue-500/5",
            icon: <Globe className="w-4 h-4 text-blue-400" />,
          },
          {
            label: t("scope_clinic"),
            value: clinicCount,
            color: "text-emerald",
            bg: "bg-emerald/5",
            icon: <Building2 className="w-4 h-4 text-emerald" />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} border border-tint/5 rounded-2xl px-5 py-4`}
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
            {t("you_manage_drugs_for")}{" "}
            <span className="font-black">
              {user?.clinicName ?? t("your_clinic")}
            </span>
            . {t("global_drugs_readonly_notice")}
          </span>
        </div>
      )}
      {level === "readonly" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-tint/5 border border-tint/5 text-xs font-semibold text-muted-foreground">
          <Lock className="w-4 h-4 shrink-0" />
          {t("read_only_formulary_as")}{" "}
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
            placeholder={t("search_drugs")}
            className="pl-11 h-12 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl font-medium"
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
                  : "bg-tint/5 border border-tint/5 text-muted-foreground hover:border-emerald/20 hover:text-emerald"
              }`}
            >
              {f === "all"
                ? t("scope_all")
                : f === "global"
                  ? t("scope_global")
                  : t("scope_clinic")}
            </button>
          ))}
        </div>
        {isOwner && ownerClinicOptions.length > 1 && (
          <Select
            value={ownerClinicFilter}
            onValueChange={setOwnerClinicFilter}
          >
            <SelectTrigger className="h-12 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl font-bold min-w-52">
              <SelectValue placeholder="Clinic filter" />
            </SelectTrigger>
            <SelectContent className="bg-popover/95 backdrop-blur-xl border-tint/5 rounded-2xl p-2">
              <SelectItem value="all" className="rounded-xl font-bold py-3">
                All Clinics
              </SelectItem>
              {ownerClinicOptions.map((c) => (
                <SelectItem
                  key={c.clinic_id}
                  value={c.clinic_id}
                  className="rounded-xl font-bold py-3"
                >
                  {c.clinicName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {bulkDeletableDrugIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald/20 bg-emerald/5 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {selectedDrugIds.length} selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={toggleSelectAllDrugs}
              className="h-9 rounded-xl border-emerald/30 text-emerald hover:bg-emerald/10"
            >
              {selectedDrugIds.length === bulkDeletableDrugIds.length
                ? "Clear selection"
                : "Select all"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleBulkDelete();
              }}
              disabled={selectedDrugIds.length === 0 || deleteDrug.isPending}
              className="h-9 rounded-xl bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-60"
            >
              Delete selected
            </Button>
          </div>
        </div>
      )}

      {/* ── Drug list ── */}
      {isLoading ? (
        <DrugSkeleton />
      ) : isError ? (
        <div className="text-center py-16 text-red-400 font-semibold">
          {t("failed_load_drugs")}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Pill className="w-12 h-12 text-muted-foreground/20 mx-auto" />
          <p className="text-muted-foreground font-semibold">
            {search ? t("no_drugs_match_search") : t("no_drugs_found_text")}
          </p>
          {canAdd && !search && (
            <Button
              onClick={handleOpenAdd}
              variant="ghost"
              className="text-emerald hover:bg-emerald/10 border border-emerald/20 rounded-xl font-bold"
            >
              <Plus className="w-4 h-4 mr-2" /> {t("add_first_drug")}
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
                selected={selectedDrugIds.includes(drug.drug_id)}
                selectable={manageable}
                onSelect={() => setSelectedDrug(drug)}
                onToggleSelect={() => toggleDrugSelection(drug.drug_id)}
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
          ownerClinicOptions={ownerClinicOptions}
          enableClinicSelectionForOwner={isOwner}
          defaultClinicIdForCreate={
            ownerClinicFilter !== "all"
              ? ownerClinicFilter
              : (ownerClinicOptions[0]?.clinic_id ?? clinicId)
          }
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
