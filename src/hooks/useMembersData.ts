import { useQuery } from "@tanstack/react-query";

import {
  fetchAnnouncements,
  fetchLessons,
  fetchMaterials,
  fetchModules,
  fetchProgress,
} from "@/lib/members";
import { supabase } from "@/integrations/supabase/client";

export function useModules() {
  return useQuery({ queryKey: ["modules"], queryFn: fetchModules });
}

export function useLessons() {
  return useQuery({ queryKey: ["lessons"], queryFn: fetchLessons });
}

export function useProgress() {
  return useQuery({ queryKey: ["progress"], queryFn: fetchProgress });
}

export function useMaterials() {
  return useQuery({ queryKey: ["materials"], queryFn: fetchMaterials });
}

export function useAnnouncements() {
  return useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  });
}
