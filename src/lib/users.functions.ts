import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ManagedUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  isAdmin: boolean;
  plan: "classico" | "completo" | null;
  /** Último status conhecido de compra (approved, refunded, chargeback...), mesmo se o acesso já foi revogado. */
  lastPurchaseStatus: string | null;
};

export type UserProgress = {
  totalLessons: number;
  completedLessons: number;
  lessons: { title: string; moduleTitle: string; completedAt: string }[];
  materials: { title: string; viewedAt: string }[];
  purchases: { plan: string; status: string; provider: string; createdAt: string }[];
};

async function assertAdmin(supabase: {
  rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => Promise<{ data: unknown }>;
}, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Apenas administradores podem gerenciar usuários.");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(error.message);

    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const { data: grants } = await supabaseAdmin.from("access_grants").select("email, plan");
    const { data: purchases } = await supabaseAdmin
      .from("purchases")
      .select("email, status, created_at")
      .order("created_at", { ascending: false });

    const adminIds = new Set(
      (roles ?? []).filter((row) => row.role === "admin").map((row) => row.user_id),
    );
    const planByEmail = new Map(
      (grants ?? []).map((row) => [row.email.toLowerCase(), row.plan as "classico" | "completo"]),
    );
    // purchases já vem ordenado do mais recente pro mais antigo, então o primeiro
    // valor setado no map para cada e-mail é o status mais recente.
    const lastStatusByEmail = new Map<string, string>();
    for (const row of purchases ?? []) {
      const key = row.email.toLowerCase();
      if (!lastStatusByEmail.has(key)) lastStatusByEmail.set(key, row.status);
    }

    return data.users.map((user) => ({
      id: user.id,
      email: user.email ?? "",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      isAdmin: adminIds.has(user.id),
      plan: planByEmail.get((user.email ?? "").toLowerCase()) ?? null,
      lastPurchaseStatus: lastStatusByEmail.get((user.email ?? "").toLowerCase()) ?? null,
    }));
  });

export const getUserProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<UserProgress> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(
      data.userId,
    );
    if (authError || !authUser.user?.email) throw new Error("Aluno não encontrado.");
    const email = authUser.user.email;

    const [{ data: allLessons }, { data: doneLessons }, { data: modules }, { data: views }, { data: materials }, { data: purchaseHistory }] =
      await Promise.all([
        supabaseAdmin.from("lessons").select("id, title, module_id"),
        supabaseAdmin
          .from("lesson_progress")
          .select("lesson_id, completed_at")
          .eq("user_id", data.userId),
        supabaseAdmin.from("modules").select("id, title"),
        supabaseAdmin
          .from("material_views")
          .select("material_id, viewed_at")
          .eq("user_id", data.userId)
          .order("viewed_at", { ascending: false }),
        supabaseAdmin.from("materials").select("id, title"),
        supabaseAdmin
          .from("purchases")
          .select("plan, status, provider, created_at")
          .ilike("email", email)
          .order("created_at", { ascending: false }),
      ]);

    const moduleTitleById = new Map((modules ?? []).map((m) => [m.id, m.title]));
    const lessonById = new Map((allLessons ?? []).map((l) => [l.id, l]));
    const materialTitleById = new Map((materials ?? []).map((m) => [m.id, m.title]));

    const lessons = (doneLessons ?? [])
      .map((row) => {
        const lesson = lessonById.get(row.lesson_id);
        return {
          title: lesson?.title ?? "Aula removida",
          moduleTitle: lesson ? (moduleTitleById.get(lesson.module_id) ?? "—") : "—",
          completedAt: row.completed_at,
        };
      })
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

    return {
      totalLessons: (allLessons ?? []).length,
      completedLessons: (doneLessons ?? []).length,
      lessons,
      materials: (views ?? []).map((row) => ({
        title: materialTitleById.get(row.material_id) ?? "Material removido",
        viewedAt: row.viewed_at,
      })),
      purchases: (purchaseHistory ?? []).map((row) => ({
        plan: row.plan,
        status: row.status,
        provider: row.provider,
        createdAt: row.created_at,
      })),
    };
  });

export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        password: z.string().min(10, "A senha precisa ter ao menos 10 caracteres").max(72),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), isAdmin: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    if (data.userId === context.userId && !data.isAdmin) {
      throw new Error("Você não pode remover o seu próprio acesso de administrador.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.isAdmin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
