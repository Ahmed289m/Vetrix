import { useMutation } from "@tanstack/react-query";
import { crewApi } from "@/app/_lib/api/crew.api";

type CaseHistoryParams = {
  petId: string;
  petType?: string;
  lang?: "en" | "ar";
};

export function useCaseHistoryCrew() {
  return useMutation({
    mutationFn: (params: CaseHistoryParams) => crewApi.getVisitsInfo(params),
  });
}

export function useCustomerServiceCrew() {
  return useMutation({
    mutationFn: ({
      userPrompt,
      history,
    }: {
      userPrompt: string;
      history: { role: "user" | "assistant"; content: string }[];
    }) => crewApi.sendCustomerServiceMessage(userPrompt, history),
  });
}
