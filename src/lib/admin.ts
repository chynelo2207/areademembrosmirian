import { supabase } from "@/integrations/supabase/client";

export type OfferRow = {
  id: string;
  title: string;
  description: string | null;
  cta_label: string;
  cta_url: string | null;
  image_url: string | null;
  price_label: string | null;
  highlight: boolean;
  active: boolean;
  position: number;
};

export const OFFER_COLUMNS =
  "id, title, description, cta_label, cta_url, image_url, price_label, highlight, active, position";

export async function fetchOffers(): Promise<OfferRow[]> {
  const { data, error } = await supabase
    .from("offers")
    .select(OFFER_COLUMNS)
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchIsAdmin(): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return false;
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (error) return false;
  return Boolean(data);
}

type Table = "modules" | "lessons" | "materials" | "announcements" | "offers";

export async function saveRow(table: Table, values: Record<string, unknown>, id?: string | undefined) {
  if (id) {
    const { error } = await supabase
      .from(table)
      .update(values as never)
      .eq("id", id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from(table).insert(values as never);
  if (error) throw error;
}

export async function deleteRow(table: Table, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}
