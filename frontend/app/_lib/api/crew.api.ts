import { api } from "../axios";
import type { ApiResponse } from "../types/api.types";

export interface CaseHistoryVisit {
  notes: string;
  medications: string;
  date: string;
}

export interface CaseHistoryResult {
  visits: CaseHistoryVisit[];
}

function normalizeVisit(value: unknown): CaseHistoryVisit | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  return {
    notes: String(record.notes ?? ""),
    medications: String(record.medications ?? ""),
    date: String(record.date ?? ""),
  };
}

function normalizeVisitsArray(value: unknown): CaseHistoryVisit[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value
    .map((item) => normalizeVisit(item))
    .filter((item): item is CaseHistoryVisit => item !== null);
}

function parseJson(value: unknown): unknown | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractVisits(value: unknown): CaseHistoryVisit[] {
  const directList = normalizeVisitsArray(value);
  if (directList) {
    return directList;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    const directVisits = normalizeVisitsArray(record.visits);
    if (directVisits) {
      return directVisits;
    }

    if (record.pydantic && typeof record.pydantic === "object") {
      const pydanticRecord = record.pydantic as Record<string, unknown>;
      const pydanticVisits = normalizeVisitsArray(pydanticRecord.visits);
      if (pydanticVisits) {
        return pydanticVisits;
      }
    }

    if (record.json_dict && typeof record.json_dict === "object") {
      const jsonDictRecord = record.json_dict as Record<string, unknown>;
      const jsonDictVisits = normalizeVisitsArray(jsonDictRecord.visits);
      if (jsonDictVisits) {
        return jsonDictVisits;
      }
    }

    const parsedRaw = parseJson(record.raw);
    if (parsedRaw) {
      const rawVisits = extractVisits(parsedRaw);
      if (rawVisits.length) {
        return rawVisits;
      }
    }

    if (Array.isArray(record.tasks_output)) {
      for (const task of record.tasks_output) {
        const taskVisits = extractVisits(task);
        if (taskVisits.length) {
          return taskVisits;
        }
      }
    }
  }

  const parsed = parseJson(value);
  if (parsed) {
    return extractVisits(parsed);
  }

  return [];
}

export const crewApi = {
  getCaseHistory: (petId: string) =>
    api.get<ApiResponse<unknown>>(`/agent/crew/${petId}`).then((r) => {
      const envelope = r.data;
      const normalized: ApiResponse<CaseHistoryResult> = {
        ...envelope,
        data: {
          visits: extractVisits(envelope.data),
        },
      };
      return normalized;
    }),
};
