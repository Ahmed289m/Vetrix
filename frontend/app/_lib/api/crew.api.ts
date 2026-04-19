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
  pet_type?: string;
  case_history: unknown;
}

interface GetVisitsInfoParams {
  petId: string;
  petType?: string;
  lang?: "en" | "ar";
}

export const crewApi = {
  getVisitInfo: ({ petId, petType }: GetVisitsInfoParams) => {
    const query = petType?.trim()
      ? `?pet_type=${encodeURIComponent(petType.trim().toLowerCase())}`
      : "";
    return api
      .get<
        ApiResponse<CaseHistoryPayload>
      >(`/agent/case-history/${petId}${query}`)
      .then((r) => r.data);
  },

  summarizeCaseHistory: (caseHistory: unknown, lang: "en" | "ar" = "en") =>
    api
      .post<ApiResponse<unknown>>(`/agent/crew`, {
        case_history: caseHistory,
        language: lang,
      })
      .then((r) => r.data),

  getVisitsInfo: async ({
    petId,
    petType,
    lang = "en",
  }: GetVisitsInfoParams) => {
    const historyResponse = await crewApi.getVisitInfo({ petId, petType });
    const caseHistory = historyResponse.data?.case_history ?? { visits: [] };
    return crewApi.summarizeCaseHistory(caseHistory, lang);
  },
};
