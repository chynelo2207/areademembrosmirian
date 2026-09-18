import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { getUserProgress, listUsers, setUserAdmin, setUserPassword } from "@/lib/users.functions";

export function useUsers() {
  const fetchUsers = useServerFn(listUsers);
  return useQuery({ queryKey: ["managed-users"], queryFn: () => fetchUsers() });
}

export function useUserProgress(userId: string | null) {
  const fetchProgress = useServerFn(getUserProgress);
  return useQuery({
    queryKey: ["user-progress", userId],
    queryFn: () => fetchProgress({ data: { userId: userId as string } }),
    enabled: Boolean(userId),
  });
}

export function useSetUserPassword() {
  const run = useServerFn(setUserPassword);
  return useMutation({
    mutationFn: (data: { userId: string; password: string }) => run({ data }),
    onSuccess: () => toast.success("Senha atualizada"),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSetUserAdmin() {
  const queryClient = useQueryClient();
  const run = useServerFn(setUserAdmin);
  return useMutation({
    mutationFn: (data: { userId: string; isAdmin: boolean }) => run({ data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      toast.success("Permissão atualizada");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Sua senha foi alterada"),
    onError: (error: Error) => toast.error(error.message),
  });
}
