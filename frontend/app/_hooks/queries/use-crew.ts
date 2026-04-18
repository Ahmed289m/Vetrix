import { useMutation } from "@tanstack/react-query";
import { crewApi } from "@/app/_lib/api/crew.api";

export function useCaseHistoryCrew() {
  return useMutation({
    mutationFn: (petId: string) => crewApi.getCaseHistory(petId),
  });
}
