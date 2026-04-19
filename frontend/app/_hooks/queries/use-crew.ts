import { useMutation } from "@tanstack/react-query";
import { crewApi } from "@/app/_lib/api/crew.api";

type CaseHistoryParams = {
  petId: string;
  petType?: string;
};

export function useCaseHistoryCrew() {
  return useMutation({
    mutationFn: (params: CaseHistoryParams) => crewApi.getVisitsInfo(params),
  });
}
