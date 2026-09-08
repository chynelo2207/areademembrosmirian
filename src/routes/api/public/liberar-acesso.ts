import { createFileRoute } from "@tanstack/react-router";

type Body = {
  email?: unknown;
  plan?: unknown;
  plano?: unknown;
  product?: unknown;
  produto?: unknown;
  order_id?: unknown;
  note?: unknown;
};

const CLASSICO_WORDS = ["classico", "clássico", "basico", "básico", "27", "27.90", "27,90"];
const COMPLETO_WORDS = ["completo", "profissional", "full", "47", "47.90", "47,90", "upgrade", "complemento"];

function resolvePlan(raw: unknown): "classico" | "completo" | null {
  if (typeof raw === "number") {
    const value = raw > 1000 ? raw / 100 : raw;
    if (value >= 25 && value < 40) return "classico";
    if (value >= 40) return "completo";
    return null;
  }
  if (typeof raw !== "string") return null;
  const text = raw.trim().toLowerCase();
  if (!text) return null;
  if (COMPLETO_WORDS.some((word) => text.includes(word))) return "completo";
  if (CLASSICO_WORDS.some((word) => text.includes(word))) return "classico";
  return null;
}

export const Route = createFileRoute("/api/public/liberar-acesso")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["CAKTO_WEBHOOK_SECRET"];
        const url = new URL(request.url);
        const sent = [
          request.headers.get("x-webhook-secret"),
          request.headers.get("secret"),
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, ""),
          url.searchParams.get("secret"),
        ].filter((item): item is string => typeof item === "string" && item.length > 0);

        if (!secret || !sent.includes(secret)) {
          return new Response("Invalid secret", { status: 401 });
        }

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const email =
          typeof body.email === "string" && body.email.includes("@")
            ? body.email.trim().toLowerCase()
            : null;
        if (!email) return Response.json({ ok: false, error: "email inválido" }, { status: 400 });

        const plan =
          resolvePlan(body.plan) ??
          resolvePlan(body.plano) ??
          resolvePlan(body.product) ??
          resolvePlan(body.produto);
        if (!plan) {
          return Response.json(
            { ok: false, error: "informe plan: 'classico' ou 'completo'" },
            { status: 400 },
          );
        }

        const orderId =
          typeof body.order_id === "string" || typeof body.order_id === "number"
            ? String(body.order_id)
            : null;
        const note = typeof body.note === "string" ? body.note : null;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: existing, error: selectError } = await supabaseAdmin
          .from("access_grants")
          .select("id, plan")
          .ilike("email", email)
          .maybeSingle();
        if (selectError) {
          return Response.json({ ok: false, error: "erro ao consultar acesso" }, { status: 500 });
        }

        if (existing) {
          const finalPlan = existing.plan === "completo" || plan === "completo" ? "completo" : "classico";
          const { error } = await supabaseAdmin
            .from("access_grants")
            .update({ plan: finalPlan, source: "api", order_id: orderId, note })
            .eq("id", existing.id);
          if (error) return Response.json({ ok: false, error: "erro ao atualizar" }, { status: 500 });
          return Response.json({ ok: true, action: "updated", email, plan: finalPlan });
        }

        const { error } = await supabaseAdmin
          .from("access_grants")
          .insert({ email, plan, source: "api", order_id: orderId, note });
        if (error) return Response.json({ ok: false, error: "erro ao criar acesso" }, { status: 500 });

        return Response.json({ ok: true, action: "created", email, plan });
      },
    },
  },
});
