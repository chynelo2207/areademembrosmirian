import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchGrants, fetchMyPlan, fetchSettings, saveSetting } from "@/lib/access";

export function useMyPlan() {
  return useQuery({ queryKey: ["my-plan"], queryFn: fetchMyPlan });
}

export function useGrants() {
  return useQuery({ queryKey: ["access-grants"], queryFn: fetchGrants });
}

export function useSettings() {
  return useQuery({ queryKey: ["app-settings"], queryFn: fetchSettings });
}

export function useSaveSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => saveSetting(key, value),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("Ajuste salvo");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
