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

interface CaseHistoryPayload {
  pet_id: string;
  case_history: unknown;
}

export const crewApi = {
  getCaseHistoryData: (petId: string) =>
    api
      .get<ApiResponse<CaseHistoryPayload>>(`/agent/case-history/${petId}`)
      .then((r) => r.data),

  summarizeCaseHistory: (caseHistory: unknown) =>
    api
      .post<ApiResponse<unknown>>(`/agent/crew`, {
        case_history: caseHistory,
      })
      .then((r) => r.data),

  getCaseHistory: async (petId: string) => {
    const historyResponse = await crewApi.getCaseHistoryData(petId);
    const caseHistory = historyResponse.data?.case_history ?? { visits: [] };
    return crewApi.summarizeCaseHistory(caseHistory);
  },
};
