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
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useFormik } from "formik";

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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/_components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/app/_lib/utils";
import type { Drug, DrugCreate } from "@/app/_lib/types/models";

/* ── Permission helpers ────────────────────────────────────────────────
 * Backend service logic (drug_service.py):
 *   - Admin (is_superuser): manage ALL drugs, can set/clear clinic_id
 *   - Owner / Doctor: manage ONLY drugs where clinic_id === their clinic_id
 *     (service auto-assigns clinic_id on create, strips it on update)
 *   - Staff / Client: read-only
 *
 * Backend RBAC (permissions.py) now grants DRUGS_CREATE/UPDATE/DELETE
 * to owner + doctor so the route guard passes. Service layer enforces scope.
 * ────────────────────────────────────────────────────────────────────── */

type ManageLevel = "admin" | "clinic" | "readonly";

function useManageLevel(): ManageLevel {
  const { user } = useAuth();
  if (!user) return "readonly";
  if (user.isSuperuser || user.role === "admin") return "admin";
  if (user.role === "owner" || user.role === "doctor") return "clinic";
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
    const notes = toDisplayText(value.notes);
    if (notes) return notes;
    const description = toDisplayText(value.description);
    if (description) return description;
    const fallbackValue = toDisplayText(value.value);
    if (fallbackValue) return fallbackValue;
  }
  return toDisplayText(value);
};

const extractToxicitySeverity = (value: unknown): string => {
  if (isRecord(value)) {
    const severity = toDisplayText(value.severity);
    if (severity) return severity;
    return toDisplayText(value.status);
  }
  return toDisplayText(value);
};

const formatDoseSpecies = (value: unknown): string => {
  if (!isRecord(value)) return toDisplayText(value);
  const valueLabel = toDisplayText(value.value);
  const unit = toDisplayText(value.unit);
  const frequency = toDisplayText(value.frequency);
  const head = [valueLabel, unit].filter(Boolean).join(" ");
  return [head, frequency].filter(Boolean).join(" ").trim();
};

const formatConcentrationItem = (value: unknown): string => {
  if (!isRecord(value)) return toDisplayText(value);
  const valueLabel = toDisplayText(value.value);
  const unit = toDisplayText(value.unit);
  const form = toDisplayText(value.form);
  const head = [valueLabel, unit].filter(Boolean).join(" ");
  return [head, form].filter(Boolean).join(" · ").trim();
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
              {drug.class}
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
  allDrugs,
  onClose,
  onEdit,
  onDelete,
}: {
  drug: Drug;
  manageable: boolean;
  clinicName?: string;
  allDrugs: Drug[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useLang();
  const toxicityData = asObject(drug.toxicity);
  const dogToxicity = extractToxicityDescription(toxicityData.dog);
  const catToxicity = extractToxicityDescription(toxicityData.cat);
  const dogSeverity = extractToxicitySeverity(toxicityData.dog);
  const catSeverity = extractToxicitySeverity(toxicityData.cat);

  const hasToxicityDetails = !!dogToxicity || !!catToxicity;

  const doseData = asObject(drug.dose);
  const doseRoute = toDisplayText(doseData.route);
  const dogDoseLabel = formatDoseSpecies(doseData.dog);
  const catDoseLabel = formatDoseSpecies(doseData.cat);
  const hasDoseDetails = !!dogDoseLabel || !!catDoseLabel || !!doseRoute;
  const concentrationItems = Array.isArray(drug.concentration)
    ? drug.concentration
    : [];

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
                  {drug.class}
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
            items={drug.side_effects}
          />
          <DetailSection
            icon={<Shield className="w-4 h-4 text-red-400" />}
            label={t("contraindications_label")}
            items={drug.contraindications}
          />
          <DetailSection
            icon={<Pill className="w-4 h-4 text-cyan-400" />}
            label={t("drug_interactions_label")}
            items={drug.interactions?.map((interaction) => {
              const found = allDrugs.find((d) => d.drug_id === interaction);
              return found ? found.name : interaction;
            })}
          />

          {hasDoseDetails && (
            <div className="p-4 rounded-2xl bg-tint/5 border border-tint/5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="w-4 h-4 text-cyan-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("dosage_guidelines")}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dogDoseLabel && (
                  <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-1">
                      Dog
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {dogDoseLabel}
                    </p>
                  </div>
                )}
                {catDoseLabel && (
                  <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-1">
                      Cat
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {catDoseLabel}
                    </p>
                  </div>
                )}
                {doseRoute && (
                  <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 sm:col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-1">
                      Route
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {doseRoute}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {concentrationItems.length > 0 && (
            <div className="p-4 rounded-2xl bg-tint/5 border border-tint/5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="w-4 h-4 text-emerald" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Concentration
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {concentrationItems.map((c, i) => {
                  const label = formatConcentrationItem(c);
                  if (!label) return null;
                  return (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald/10 border border-emerald/20 text-emerald"
                    >
                      {label}
                    </span>
                  );
                })}
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
type ConcentrationFormItem = { value: string; unit: string; form: string };

type DrugFormValues = {
  name: string;
  class: string;
  indications: string;
  side_effects: string;
  contraindications: string;
  interactions: string[];
  doseDogValue: string;
  doseDogUnit: string;
  doseDogFrequency: string;
  doseCatValue: string;
  doseCatUnit: string;
  doseCatFrequency: string;
  doseRoute: string;
  concentration: ConcentrationFormItem[];
  toxicityDogNotes: string;
  toxicityCatNotes: string;
  toxicityDogSeverity: string;
  toxicityCatSeverity: string;
  clinic_id: string; // "" means null (global), used by admin only
};

const EMPTY_CONCENTRATION: ConcentrationFormItem = {
  value: "",
  unit: "",
  form: "",
};

const parseNumber = (raw: string): number | undefined => {
  if (!raw.trim()) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

const buildDosePayload = (values: DrugFormValues) => {
  const dogValue = parseNumber(values.doseDogValue);
  const catValue = parseNumber(values.doseCatValue);
  const dog =
    dogValue !== undefined ||
    values.doseDogUnit.trim() ||
    values.doseDogFrequency.trim()
      ? {
          ...(dogValue !== undefined ? { value: dogValue } : {}),
          ...(values.doseDogUnit.trim()
            ? { unit: values.doseDogUnit.trim() }
            : {}),
          ...(values.doseDogFrequency.trim()
            ? { frequency: values.doseDogFrequency.trim() }
            : {}),
        }
      : undefined;
  const cat =
    catValue !== undefined ||
    values.doseCatUnit.trim() ||
    values.doseCatFrequency.trim()
      ? {
          ...(catValue !== undefined ? { value: catValue } : {}),
          ...(values.doseCatUnit.trim()
            ? { unit: values.doseCatUnit.trim() }
            : {}),
          ...(values.doseCatFrequency.trim()
            ? { frequency: values.doseCatFrequency.trim() }
            : {}),
        }
      : undefined;
  const route = values.doseRoute.trim();
  return {
    ...(dog ? { dog } : {}),
    ...(cat ? { cat } : {}),
    ...(route ? { route } : {}),
  };
};

const buildConcentrationPayload = (values: DrugFormValues) =>
  values.concentration
    .map((c) => {
      const value = parseNumber(c.value);
      const unit = c.unit.trim();
      const form = c.form.trim();
      if (value === undefined && !unit && !form) return null;
      return {
        ...(value !== undefined ? { value } : {}),
        ...(unit ? { unit } : {}),
        ...(form ? { form } : {}),
      };
    })
    .filter((c): c is { value?: number; unit?: string; form?: string } => !!c);

const buildToxicityPayload = (values: DrugFormValues) => {
  const dog =
    values.toxicityDogNotes.trim() || values.toxicityDogSeverity
      ? {
          ...(values.toxicityDogSeverity
            ? { severity: values.toxicityDogSeverity }
            : {}),
          ...(values.toxicityDogNotes.trim()
            ? { notes: values.toxicityDogNotes.trim() }
            : {}),
        }
      : undefined;
  const cat =
    values.toxicityCatNotes.trim() || values.toxicityCatSeverity
      ? {
          ...(values.toxicityCatSeverity
            ? { severity: values.toxicityCatSeverity }
            : {}),
          ...(values.toxicityCatNotes.trim()
            ? { notes: values.toxicityCatNotes.trim() }
            : {}),
        }
      : undefined;
  return {
    ...(dog ? { dog } : {}),
    ...(cat ? { cat } : {}),
  };
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
  allDrugs,
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
  allDrugs: Drug[];
  onSuccess: () => void;
}) {
  const createDrug = useCreateDrug();
  const updateDrug = useUpdateDrug();
  const { t } = useLang();
  const isAdmin = level === "admin";

  const formik = useFormik<DrugFormValues>({
    initialValues: {
      name: "",
      class: "",
      indications: "",
      side_effects: "",
      contraindications: "",
      interactions: [],
      doseDogValue: "",
      doseDogUnit: "",
      doseDogFrequency: "",
      doseCatValue: "",
      doseCatUnit: "",
      doseCatFrequency: "",
      doseRoute: "",
      concentration: [],
      toxicityDogNotes: "",
      toxicityCatNotes: "",
      toxicityDogSeverity: "",
      toxicityCatSeverity: "",
      clinic_id: "",
    },
    onSubmit: (values, { setSubmitting, resetForm }) => {
      const selectedClinicId = values.clinic_id || null;

      const payload: DrugCreate = {
        name: values.name.trim(),
        class: values.class.trim(),
        indications: parseTagArray(values.indications),
        side_effects: parseTagArray(values.side_effects),
        contraindications: parseTagArray(values.contraindications),
        interactions: values.interactions,
        dose: buildDosePayload(values),
        concentration: buildConcentrationPayload(values),
        toxicity: buildToxicityPayload(values),
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
        const dose = asObject(selectedDrug.dose);
        const dogDose = asObject(dose.dog);
        const catDose = asObject(dose.cat);
        const toxicity = asObject(selectedDrug.toxicity);
        const dogTox = asObject(toxicity.dog);
        const catTox = asObject(toxicity.cat);
        const concentration: ConcentrationFormItem[] = Array.isArray(
          selectedDrug.concentration,
        )
          ? selectedDrug.concentration.map((c) => {
              const obj = asObject(c);
              return {
                value: asText(obj.value),
                unit: asText(obj.unit),
                form: asText(obj.form),
              };
            })
          : [];

        formik.setValues({
          name: selectedDrug.name,
          class: selectedDrug.class,
          indications: tagArrayToString(selectedDrug.indications ?? []),
          side_effects: tagArrayToString(selectedDrug.side_effects ?? []),
          contraindications: tagArrayToString(
            selectedDrug.contraindications ?? [],
          ),
          interactions: selectedDrug.interactions ?? [],
          doseDogValue: asText(dogDose.value),
          doseDogUnit: asText(dogDose.unit),
          doseDogFrequency: asText(dogDose.frequency),
          doseCatValue: asText(catDose.value),
          doseCatUnit: asText(catDose.unit),
          doseCatFrequency: asText(catDose.frequency),
          doseRoute: asText(dose.route),
          concentration,
          toxicityDogNotes: asText(dogTox.notes),
          toxicityCatNotes: asText(catTox.notes),
          toxicityDogSeverity: asText(dogTox.severity),
          toxicityCatSeverity: asText(catTox.severity),
          clinic_id: selectedDrug.clinic_id ?? "",
        });
      } else {
        formik.resetForm();
        // Admin starts with no clinic, doctor/owner hint — backend assigns clinic scope
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
              name="class"
              value={formik.values.class}
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
            name="side_effects"
            value={formik.values.side_effects}
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full h-12 bg-tint/5 border-tint/5 focus:border-cyan-400/30 rounded-xl justify-between font-normal text-left px-3 text-muted-foreground"
              >
                {formik.values.interactions.length > 0
                  ? `${formik.values.interactions.length} drugs selected`
                  : "Select interactive drugs..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-100 p-0 rounded-2xl border-tint/10 shadow-xl"
              align="start"
            >
              <Command>
                <CommandInput placeholder="Search drugs..." className="h-11" />
                <CommandList>
                  <CommandEmpty>No drugs found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto custom-scrollbar">
                    {allDrugs
                      .filter((d) => d.drug_id !== selectedDrug?.drug_id)
                      .map((d) => {
                        const isSelected =
                          formik.values.interactions.includes(d.drug_id);
                        return (
                          <CommandItem
                            key={d.drug_id}
                            value={d.name}
                            onSelect={() => {
                              const next = isSelected
                                ? formik.values.interactions.filter(
                                    (id) => id !== d.drug_id,
                                  )
                                : [
                                    ...formik.values.interactions,
                                    d.drug_id,
                                  ];
                              formik.setFieldValue("interactions", next);
                            }}
                            className="cursor-pointer font-medium py-2 px-3 data-[selected=true]:bg-cyan-500/10 data-[selected=true]:text-cyan-400"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-cyan-400",
                                isSelected ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {d.name}{" "}
                            <span className="ml-2 text-xs opacity-50 font-normal">
                              ({d.class})
                            </span>
                          </CommandItem>
                        );
                      })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {formik.values.interactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {formik.values.interactions.map((id) => {
                const d = allDrugs.find((x) => x.drug_id === id);
                if (!d) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                  >
                    {d.name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        formik.setFieldValue(
                          "interactions",
                          formik.values.interactions.filter((x) => x !== id),
                        );
                      }}
                      className="hover:bg-cyan-500/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </Field>
        {/* Structured dose: dog/cat (value, unit, frequency) + route */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
            {t("dosage_dog")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Value">
              <Input
                name="doseDogValue"
                type="number"
                step="any"
                value={formik.values.doseDogValue}
                onChange={formik.handleChange}
                placeholder="10"
                className="h-12 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl"
              />
            </Field>
            <Field label="Unit">
              <Input
                name="doseDogUnit"
                value={formik.values.doseDogUnit}
                onChange={formik.handleChange}
                placeholder="mg/kg"
                className="h-12 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl"
              />
            </Field>
            <Field label="Frequency">
              <Input
                name="doseDogFrequency"
                value={formik.values.doseDogFrequency}
                onChange={formik.handleChange}
                placeholder="q8-12h"
                className="h-12 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl"
              />
            </Field>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
            {t("dosage_cat")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Value">
              <Input
                name="doseCatValue"
                type="number"
                step="any"
                value={formik.values.doseCatValue}
                onChange={formik.handleChange}
                placeholder="5"
                className="h-12 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl"
              />
            </Field>
            <Field label="Unit">
              <Input
                name="doseCatUnit"
                value={formik.values.doseCatUnit}
                onChange={formik.handleChange}
                placeholder="mg/kg"
                className="h-12 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl"
              />
            </Field>
            <Field label="Frequency">
              <Input
                name="doseCatFrequency"
                value={formik.values.doseCatFrequency}
                onChange={formik.handleChange}
                placeholder="q8-12h"
                className="h-12 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl"
              />
            </Field>
          </div>
        </div>
        <Field label="Route">
          <Input
            name="doseRoute"
            value={formik.values.doseRoute}
            onChange={formik.handleChange}
            placeholder="PO, IV, SC..."
            className="h-12 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl"
          />
        </Field>

        {/* Concentration array editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Concentration
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                formik.setFieldValue("concentration", [
                  ...formik.values.concentration,
                  { ...EMPTY_CONCENTRATION },
                ])
              }
              className="h-8 text-emerald hover:bg-emerald/10 gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
          {formik.values.concentration.length === 0 && (
            <p className="text-xs text-muted-foreground/50 px-1">
              No concentrations added yet.
            </p>
          )}
          {formik.values.concentration.map((c, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end"
            >
              <Field label="Value">
                <Input
                  type="number"
                  step="any"
                  value={c.value}
                  onChange={(e) => {
                    const next = [...formik.values.concentration];
                    next[idx] = { ...c, value: e.target.value };
                    formik.setFieldValue("concentration", next);
                  }}
                  placeholder="250"
                  className="h-11 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl"
                />
              </Field>
              <Field label="Unit">
                <Input
                  value={c.unit}
                  onChange={(e) => {
                    const next = [...formik.values.concentration];
                    next[idx] = { ...c, unit: e.target.value };
                    formik.setFieldValue("concentration", next);
                  }}
                  placeholder="mg"
                  className="h-11 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl"
                />
              </Field>
              <Field label="Form">
                <Input
                  value={c.form}
                  onChange={(e) => {
                    const next = [...formik.values.concentration];
                    next[idx] = { ...c, form: e.target.value };
                    formik.setFieldValue("concentration", next);
                  }}
                  placeholder="tablet"
                  className="h-11 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-xl"
                />
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const next = formik.values.concentration.filter(
                    (_, i) => i !== idx,
                  );
                  formik.setFieldValue("concentration", next);
                }}
                className="h-11 w-11 rounded-xl text-red-400 hover:bg-red-500/10"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Toxicity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("toxicity_dog")}>
            <Input
              name="toxicityDogNotes"
              value={formik.values.toxicityDogNotes}
              onChange={formik.handleChange}
              placeholder="e.g. LD50 500mg/kg"
              className="h-12 bg-muted/40 border-border focus:border-red-400/30 rounded-xl"
            />
          </Field>
          <Field label={t("toxicity_cat")}>
            <Input
              name="toxicityCatNotes"
              value={formik.values.toxicityCatNotes}
              onChange={formik.handleChange}
              placeholder="e.g. LD50 300mg/kg"
              className="h-12 bg-muted/40 border-border focus:border-red-400/30 rounded-xl"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("toxicity_severity_dog")}>
            <Select
              value={formik.values.toxicityDogSeverity}
              onValueChange={(val) =>
                formik.setFieldValue("toxicityDogSeverity", val)
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
              value={formik.values.toxicityCatSeverity}
              onValueChange={(val) =>
                formik.setFieldValue("toxicityCatSeverity", val)
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
type ImportDrugResult = { name: string; status: "pending" | "ok" | "fail"; error?: string };

function ImportJsonModal({ isOpen, onOpenChange, isAdmin }: { isOpen: boolean; onOpenChange: (open: boolean) => void; isAdmin: boolean }) {
  const createDrug = useCreateDrug();
  const { t } = useLang();
  const [jsonText, setJsonText] = React.useState("");
  const [parseError, setParseError] = React.useState("");
  const [phase, setPhase] = React.useState<"input" | "running" | "done">("input");
  const [items, setItems] = React.useState<ImportDrugResult[]>([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [startedAt, setStartedAt] = React.useState<number>(0);
  const [elapsed, setElapsed] = React.useState(0);

  // Tick elapsed time while running
  React.useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 500);
    return () => clearInterval(id);
  }, [phase, startedAt]);

  const done = items.filter(i => i.status === "ok").length;
  const failed = items.filter(i => i.status === "fail").length;
  const total = items.length;
  const progress = total > 0 ? Math.round((currentIdx / total) * 100) : 0;
  const avgMs = currentIdx > 0 ? elapsed / currentIdx : 1200;
  const remaining = Math.max(0, Math.round(((total - currentIdx) * avgMs) / 1000));

  const resetModal = () => {
    setPhase("input");
    setJsonText("");
    setParseError("");
    setItems([]);
    setCurrentIdx(0);
    setElapsed(0);
  };

  const buildPayload = (item: UnknownRecord, isAdmin: boolean): DrugCreate | null => {
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const cls = typeof item.class === "string" ? item.class.trim() : "";
    if (!name || !cls) return null;

    const concentrationItems = Array.isArray(item.concentration)
      ? item.concentration.map((c) => (isRecord(c) ? c : null)).filter((c): c is UnknownRecord => c !== null)
          .map((c) => ({
            ...(typeof c.value === "number" ? { value: c.value } : {}),
            ...(typeof c.unit === "string" && c.unit.trim() ? { unit: c.unit.trim() } : {}),
            ...(typeof c.form === "string" && c.form.trim() ? { form: c.form.trim() } : {}),
          }))
      : [];

    const rawDose = isRecord(item.dose) ? item.dose : {};
    const normSpecies = (ds: unknown) => {
      if (!isRecord(ds)) return undefined;
      return { ...(ds.value != null ? { value: ds.value } : {}), ...(typeof ds.unit === "string" && ds.unit ? { unit: ds.unit.trim() } : {}), ...(typeof ds.frequency === "string" && ds.frequency ? { frequency: ds.frequency.trim() } : {}) };
    };
    const rawRoute = rawDose.route;
    const normalizedRoute = Array.isArray(rawRoute) ? rawRoute.filter(Boolean).join("/") : typeof rawRoute === "string" ? rawRoute.trim() : undefined;
    const normalizedDose: DrugCreate["dose"] = {
      ...(rawDose.dog ? { dog: normSpecies(rawDose.dog) as NonNullable<DrugCreate["dose"]>["dog"] } : {}),
      ...(rawDose.cat ? { cat: normSpecies(rawDose.cat) as NonNullable<DrugCreate["dose"]>["cat"] } : {}),
      ...(normalizedRoute ? { route: normalizedRoute } : {}),
    };

    const rawTox = isRecord(item.toxicity) ? item.toxicity : {};
    const hasDogCat = isRecord(rawTox.dog) || isRecord(rawTox.cat);
    let normalizedToxicity: DrugCreate["toxicity"] = {};
    if (hasDogCat) {
      normalizedToxicity = rawTox as DrugCreate["toxicity"];
    } else {
      const flat: Record<string, string> = {};
      if (typeof rawTox.notes === "string" && rawTox.notes.trim()) flat.notes = rawTox.notes.trim();
      if (typeof rawTox.severity === "string" && rawTox.severity.trim()) flat.severity = rawTox.severity.trim();
      if (Object.keys(flat).length > 0) normalizedToxicity = { dog: flat as NonNullable<DrugCreate["toxicity"]>["dog"], cat: flat as NonNullable<DrugCreate["toxicity"]>["cat"] };
    }

    return {
      name, class: cls,
      indications: asStringArray(item.indications),
      side_effects: asStringArray(item.side_effects),
      contraindications: asStringArray(item.contraindications),
      interactions: asStringArray(item.interactions),
      dose: normalizedDose,
      concentration: concentrationItems,
      toxicity: normalizedToxicity,
      ...(isAdmin && (typeof item.clinic_id === "string" || item.clinic_id === null) && { clinic_id: item.clinic_id }),
    };
  };

  const handleImport = async () => {
    setParseError("");
    try {
      const parsed: unknown = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error("JSON root must be an array [ ... ]");
      const initialItems: ImportDrugResult[] = parsed.map((item, i) => ({
        name: isRecord(item) && typeof item.name === "string" ? item.name.trim() : `Item #${i + 1}`,
        status: "pending",
      }));
      setItems(initialItems);
      setCurrentIdx(0);
      setStartedAt(Date.now());
      setElapsed(0);
      setPhase("running");

      // Sequential — so progress is accurate
      for (let i = 0; i < parsed.length; i++) {
        setCurrentIdx(i);
        const item = parsed[i];
        if (!isRecord(item)) {
          setItems(prev => { const n = [...prev]; n[i] = { ...n[i], status: "fail", error: "Not a JSON object" }; return n; });
          continue;
        }
        const payload = buildPayload(item, isAdmin);
        if (!payload) {
          setItems(prev => { const n = [...prev]; n[i] = { ...n[i], status: "fail", error: "Missing name or class" }; return n; });
          continue;
        }
        try {
          await createDrug.mutateAsync(payload);
          setItems(prev => { const n = [...prev]; n[i] = { ...n[i], status: "ok" }; return n; });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "API error";
          setItems(prev => { const n = [...prev]; n[i] = { ...n[i], status: "fail", error: msg }; return n; });
        }
      }
      setCurrentIdx(parsed.length);
      setPhase("done");
    } catch (e: unknown) {
      setParseError(e instanceof Error ? e.message : "Failed to parse JSON.");
    }
  };

  // Auto-close 2s after a fully-successful import
  React.useEffect(() => {
    if (phase !== "done" || failed > 0) return;
    const id = setTimeout(() => { onOpenChange(false); resetModal(); }, 2000);
    return () => clearTimeout(id);
  }, [phase, failed]);

  const handleClose = () => { if (phase === "running") return; onOpenChange(false); resetModal(); };

  return (
    <DashboardForm
      title={phase === "done" ? (failed === 0 ? "Import Complete ✓" : "Import Finished with Errors") : t("import_drugs_json")}
      description={phase === "input" ? t("import_drugs_desc") : phase === "running" ? `Processing ${currentIdx + 1} of ${total}…` : `${done} imported · ${failed} failed`}
      isOpen={isOpen}
      onOpenChange={handleClose}
      onSubmit={(e) => { e.preventDefault(); if (phase === "input") handleImport(); else if (phase === "done") { onOpenChange(false); resetModal(); } }}
      submitLabel={phase === "running" ? "Importing…" : phase === "done" ? "Close" : t("start_import")}
    >
      <div className="space-y-4">

        {/* ── INPUT PHASE ── */}
        {phase === "input" && (
          <>
            {parseError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{parseError}</span>
              </div>
            )}
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3 text-xs">
              <p className="font-bold flex items-center gap-2 text-blue-400 text-sm"><FileJson className="w-4 h-4" /> {t("json_shape_example")}</p>
              <pre className="block p-3 bg-black/20 rounded-xl overflow-x-auto text-[10px] text-blue-200/90 font-mono border border-blue-500/10 leading-relaxed">{`[\n  {\n    "name": "Amoxicillin",\n    "class": "Antibiotic",\n    "indications": ["Bacterial infections"],\n    "side_effects": ["Diarrhea"],\n    "contraindications": [],\n    "interactions": [],\n    "dose": {\n      "dog": { "value": "11-22", "unit": "mg/kg", "frequency": "q8-12h" },\n      "cat": { "value": "11-22", "unit": "mg/kg", "frequency": "q8-12h" },\n      "route": ["PO", "IV"]\n    },\n    "concentration": [{ "value": 250, "unit": "mg", "form": "tablet" }],\n    "toxicity": { "severity": "Low", "notes": "LD50 500mg/kg" }\n  }\n]`}</pre>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">{t("json_payload")}</Label>
              <Textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={10}
                className="p-4 bg-tint/5 border-tint/5 focus:border-emerald/30 rounded-2xl font-mono text-xs resize-none shadow-inner"
                placeholder="[ { ... }, { ... } ]" />
            </div>
          </>
        )}

        {/* ── RUNNING PHASE ── */}
        {phase === "running" && (
          <div className="space-y-4">
            {/* Header stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Total", val: total, color: "text-foreground" },
                { label: "Done", val: done, color: "text-emerald" },
                { label: "Failed", val: failed, color: failed > 0 ? "text-red-400" : "text-muted-foreground/40" },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl bg-tint/5 border border-tint/5">
                  <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                <span>{currentIdx} / {total} drugs</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{remaining}s left</span>
              </div>
              <div className="h-2.5 rounded-full bg-tint/10 overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald to-cyan-400"
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ ease: "linear", duration: 0.4 }} />
              </div>
              <p className="text-[10px] text-muted-foreground text-right">{progress}% · {Math.round(elapsed / 1000)}s elapsed</p>
            </div>

            {/* Current item */}
            {currentIdx < total && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald/5 border border-emerald/15">
                <Loader2 className="w-4 h-4 text-emerald animate-spin shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{items[currentIdx]?.name}</p>
                  <p className="text-[10px] text-muted-foreground">Uploading…</p>
                </div>
              </div>
            )}

            {/* Per-item log */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {items.slice(0, currentIdx).map((item, i) => (
                <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${item.status === "ok" ? "bg-emerald/5 border border-emerald/15" : "bg-red-500/5 border border-red-500/15"}`}>
                  {item.status === "ok"
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                  <span className={`font-semibold flex-1 truncate ${item.status === "ok" ? "text-emerald" : "text-red-400"}`}>{item.name}</span>
                  {item.error && <span className="text-[10px] text-red-400/70 truncate max-w-[120px]">{item.error}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DONE PHASE ── */}
        {phase === "done" && (
          <div className="space-y-4">
            {failed === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 rounded-2xl bg-emerald/15 border border-emerald/25 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald" />
                </motion.div>
                <div>
                  <p className="text-lg font-black text-emerald">All {done} drugs imported!</p>
                  <p className="text-xs text-muted-foreground mt-1">Closing automatically…</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{done} succeeded · {failed} failed — review errors below</span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                  {items.map((item, i) => (
                    <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${item.status === "ok" ? "bg-emerald/5 border border-emerald/15" : "bg-red-500/5 border border-red-500/15"}`}>
                      {item.status === "ok"
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                      <span className={`font-semibold flex-1 truncate ${item.status === "ok" ? "text-emerald" : "text-red-400"}`}>{item.name}</span>
                      {item.error && <span className="text-[10px] text-red-400/70 truncate max-w-[140px]">{item.error}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardForm>
  );
}


/* ── Delete Confirm Modal ──────────────────────────────────────────────── */
function DeleteConfirmModal({
  drug, open, onClose, onConfirm, isPending,
}: { drug: Drug | null; open: boolean; onClose: () => void; onConfirm: () => void; isPending: boolean; }) {
  const [done, setDone] = React.useState(false);
  React.useEffect(() => { if (!open) setDone(false); }, [open]);
  React.useEffect(() => {
    if (!isPending && done) { const id = setTimeout(onClose, 1200); return () => clearTimeout(id); }
  }, [isPending, done]);

  const handleConfirm = () => { setDone(false); onConfirm(); };
  React.useEffect(() => { if (!isPending && open && done === false && drug) setDone(true); }, [isPending]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
          onClick={isPending ? undefined : onClose}>
          <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5">
            {isPending ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <Loader2 className="w-10 h-10 text-red-400 animate-spin" />
                <div>
                  <p className="font-black text-base">Deleting…</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">Removing <span className="font-bold text-foreground">{drug?.name}</span></p>
                </div>
              </div>
            ) : done ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald/10 border border-emerald/20 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald" />
                </div>
                <p className="font-black text-base text-emerald">Deleted!</p>
                <p className="text-xs text-muted-foreground">Closing…</p>
              </motion.div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-base">Delete Drug</h3>
                    <p className="text-xs text-muted-foreground">This cannot be undone.</p>
                  </div>
                </div>
                <div className="px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10 text-sm font-bold truncate">{drug?.name}</div>
                <div className="flex gap-3">
                  <button onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-sm font-bold transition-colors">Cancel</button>
                  <button onClick={handleConfirm}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-sm font-black transition-colors">Delete</button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}






/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function DrugsPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const level = useManageLevel();
  const isAdmin = level === "admin";
  const isOwner = user?.role === "owner";
  const isClinicManager = level === "clinic";
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
  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = React.useState<Drug | null>(null);
  // Bulk delete progress
  const [bulkProgress, setBulkProgress] = React.useState<{ open: boolean; total: number; done: number; failed: number; current: string; phase: "running" | "done" }>({
    open: false, total: 0, done: 0, failed: 0, current: "", phase: "running",
  });

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
   * - Backend already filters for non-admin users (returns only global + their clinic).
   * - Admin receives all. We apply additional client-side scope filter for admin. */
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return allDrugs.filter((d) => {
      const matchSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        (d.class ?? "").toLowerCase().includes(q) ||
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
    setSelectedDrugIds((prev) => {
      const next = prev.filter((id) => allowed.has(id));
      if (
        next.length === prev.length &&
        next.every((id, index) => id === prev[index])
      ) {
        return prev;
      }
      return next;
    });
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
    setDeleteTarget(drug);
    if (selectedDrug?.drug_id === drug.drug_id) setSelectedDrug(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteDrug.mutate(deleteTarget.drug_id, {
      onSuccess: () => setSelectedDrugIds(prev => prev.filter(id => id !== deleteTarget.drug_id)),
    });
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
    const ids = [...selectedDrugIds];
    setBulkProgress({ open: true, total: ids.length, done: 0, failed: 0, current: "", phase: "running" });
    let done = 0; let failed = 0;
    for (const id of ids) {
      const drug = allDrugs.find(d => d.drug_id === id);
      setBulkProgress(p => ({ ...p, current: drug?.name ?? id }));
      try {
        await deleteDrug.mutateAsync(id);
        done++;
        setBulkProgress(p => ({ ...p, done }));
      } catch {
        failed++;
        setBulkProgress(p => ({ ...p, failed }));
      }
    }
    setSelectedDrugIds([]);
    setBulkProgress(p => ({ ...p, phase: "done", current: "" }));
    setTimeout(() => setBulkProgress(p => ({ ...p, open: false })), 1800);
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
      {isClinicManager && (
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
            allDrugs={allDrugs}
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
          allDrugs={allDrugs}
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

      {/* ── Delete Confirm Modal ── */}
      <DeleteConfirmModal
        drug={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isPending={deleteDrug.isPending}
      />

      {/* ── Bulk Delete Progress Overlay ── */}
      <AnimatePresence>
        {bulkProgress.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5">
              {bulkProgress.phase === "done" ? (
                <div className="flex flex-col items-center gap-3 py-3 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-14 h-14 rounded-2xl bg-emerald/10 border border-emerald/20 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald" />
                  </motion.div>
                  <div>
                    <p className="font-black text-base text-emerald">{bulkProgress.done} deleted!</p>
                    {bulkProgress.failed > 0 && <p className="text-xs text-red-400 mt-0.5">{bulkProgress.failed} failed</p>}
                    <p className="text-xs text-muted-foreground mt-1">Closing…</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                      <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                    </div>
                    <div>
                      <p className="font-black text-sm">Deleting {bulkProgress.total} drugs…</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-xs">{bulkProgress.current}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                      <span>{bulkProgress.done + bulkProgress.failed} / {bulkProgress.total}</span>
                      <span className="text-emerald">{bulkProgress.done} done · <span className="text-red-400">{bulkProgress.failed} failed</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-tint/10 overflow-hidden">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400"
                        animate={{ width: `${Math.round(((bulkProgress.done + bulkProgress.failed) / bulkProgress.total) * 100)}%` }}
                        transition={{ ease: "linear", duration: 0.3 }} />
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
