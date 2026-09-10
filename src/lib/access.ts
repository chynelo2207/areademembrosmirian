import { supabase } from "@/integrations/supabase/client";

export type Plan = "admin" | "completo" | "classico" | null;

export type AccessGrantRow = {
  id: string;
  email: string;
  plan: "classico" | "completo";
  source: string;
  order_id: string | null;
  note: string | null;
  created_at: string;
};

export type SettingRow = { key: string; value: string | null };

export async function fetchMyPlan(): Promise<Plan> {
  const { data, error } = await supabase.rpc("my_plan");
  if (error) throw error;
  return (data as Plan) ?? null;
}

export async function fetchGrants(): Promise<AccessGrantRow[]> {
  const { data, error } = await supabase
    .from("access_grants")
    .select("id, email, plan, source, order_id, note, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("app_settings").select("key, value");
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of (data ?? []) as SettingRow[]) map[row.key] = row.value ?? "";
  return map;
}

export async function saveSetting(key: string, value: string) {
  const { error } = await supabase.from("app_settings").upsert({ key, value });
  if (error) throw error;
}

export const DEFAULT_UPGRADE_URL = "https://pay.wiapy.com/iWJwRQvGe-si";

export function canOpenModule(plan: Plan, requiredPlan: "classico" | "completo") {
  if (plan === "admin" || plan === "completo") return true;
  if (plan === "classico") return requiredPlan === "classico";
  return false;
}
