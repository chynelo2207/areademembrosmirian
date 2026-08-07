import { supabase } from "@/integrations/supabase/client";

export type ModuleRow = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  coming_soon: boolean;
  cover_url: string | null;
};

export type LessonRow = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  position: number;
  video_url: string | null;
  duration_minutes: number | null;
};

export type MaterialRow = {
  id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  file_url: string | null;
  kind: string;
  position: number;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  link_url: string | null;
  pinned: boolean;
  created_at: string;
};

export async function fetchModules(): Promise<ModuleRow[]> {
  const { data, error } = await supabase
    .from("modules")
    .select("id, title, description, position, coming_soon, cover_url")
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchLessons(): Promise<LessonRow[]> {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, module_id, title, description, position, video_url, duration_minutes")
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchProgress(): Promise<string[]> {
  const { data, error } = await supabase.from("lesson_progress").select("lesson_id");
  if (error) throw error;
  return (data ?? []).map((row) => row.lesson_id);
}

export async function fetchMaterials(): Promise<MaterialRow[]> {
  const { data, error } = await supabase
    .from("materials")
    .select("id, module_id, title, description, file_url, kind, position")
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAnnouncements(): Promise<AnnouncementRow[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, link_url, pinned, created_at")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function toggleLessonDone(lessonId: string, done: boolean) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Sessão expirada");
  if (done) {
    const { error } = await supabase
      .from("lesson_progress")
      .upsert({ lesson_id: lessonId, user_id: userData.user.id });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("lesson_progress")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("user_id", userData.user.id);
    if (error) throw error;
  }
}

export function modulePercent(
  lessons: LessonRow[],
  doneIds: string[],
  moduleId: string,
): { total: number; done: number; percent: number } {
  const items = lessons.filter((l) => l.module_id === moduleId);
  const done = items.filter((l) => doneIds.includes(l.id)).length;
  return {
    total: items.length,
    done,
    percent: items.length === 0 ? 0 : Math.round((done / items.length) * 100),
  };
}
