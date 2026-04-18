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

export const crewApi = {
  getCaseHistory: (petId: string) =>
    api.get<ApiResponse<unknown>>(`/agent/crew/${petId}`).then((r) => r.data),
};
