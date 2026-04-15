import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/app/_lib/api/users.api";
import type { UserCreate, UserUpdate } from "@/app/_lib/types/models";

export const USERS_KEY = ["users"] as const;
const LIST_STALE_TIME = 1000 * 60 * 2;
const DETAIL_STALE_TIME = 1000 * 60;
const QUERY_GC_TIME = 1000 * 60 * 30;

export function useUsers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: () => usersApi.list(),
    staleTime: LIST_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    enabled: options?.enabled !== false,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: [...USERS_KEY, id],
    queryFn: () => usersApi.get(id),
    enabled: !!id,
    staleTime: DETAIL_STALE_TIME,
    gcTime: QUERY_GC_TIME,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserCreate) => usersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) =>
      usersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.resetPassword(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}
