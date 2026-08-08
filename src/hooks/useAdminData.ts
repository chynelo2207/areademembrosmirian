import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteRow, fetchIsAdmin, fetchOffers, saveRow } from "@/lib/admin";

export function useIsAdmin() {
  return useQuery({ queryKey: ["is-admin"], queryFn: fetchIsAdmin });
}

export function useOffers() {
  return useQuery({ queryKey: ["offers"], queryFn: fetchOffers });
}

type Table = "modules" | "lessons" | "materials" | "announcements" | "offers";

export function useSaveRow(table: Table, queryKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ values, id }: { values: Record<string, unknown>; id?: string | undefined }) =>
      saveRow(table, values, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Salvo com sucesso");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteRow(table: Table, queryKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRow(table, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Removido");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
