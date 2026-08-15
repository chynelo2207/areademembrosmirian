import { createFileRoute } from "@tanstack/react-router";

type CaktoPayload = Record<string, unknown>;

function pick(source: CaktoPayload, path: string[]): unknown {
  let current: unknown = source;
  for (const key of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function findEmail(payload: CaktoPayload): string | null {
  const candidates = [
    ["customer", "email"],
    ["data", "customer", "email"],
    ["buyer", "email"],
    ["data", "buyer", "email"],
    ["email"],
    ["data", "email"],
  ];
  for (const path of candidates) {
    const value = pick(payload, path);
    if (typeof value === "string" && value.includes("@")) return value.trim().toLowerCase();
  }
  return null;
}

function findAmount(payload: CaktoPayload): number | null {
  const candidates = [
    ["amount"],
    ["data", "amount"],
    ["total"],
    ["data", "total"],
    ["offer", "price"],
    ["data", "offer", "price"],
    ["product", "price"],
    ["data", "product", "price"],
  ];
  for (const path of candidates) {
    const value = pick(payload, path);
    const numeric = typeof value === "string" ? Number(value) : value;
    if (typeof numeric === "number" && Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return null;
}

function findStatus(payload: CaktoPayload): string {
  const candidates = [["status"], ["data", "status"], ["event"], ["type"]];
  for (const path of candidates) {
    const value = pick(payload, path);
    if (typeof value === "string") return value.toLowerCase();
  }
  return "";
}

const APPROVED = ["paid", "approved", "aprovado", "purchase_approved", "completed", "authorized"];
const REFUNDED = ["refunded", "chargeback", "refused", "canceled", "cancelled", "estornado"];

export const Route = createFileRoute("/api/public/cakto")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["CAKTO_WEBHOOK_SECRET"];
        const url = new URL(request.url);
        const provided =
          request.headers.get("x-webhook-secret") ?? url.searchParams.get("secret") ?? "";
        if (!secret || provided !== secret) {
          return new Response("Invalid secret", { status: 401 });
        }

        let payload: CaktoPayload;
        try {
          payload = (await request.json()) as CaktoPayload;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const email = findEmail(payload);
        if (!email) return new Response("Missing customer email", { status: 400 });

        const status = findStatus(payload);
        const amount = findAmount(payload);
        const orderId = (() => {
          for (const path of [["id"], ["data", "id"], ["order", "id"], ["data", "order", "id"]]) {
            const value = pick(payload, path);
            if (typeof value === "string" || typeof value === "number") return String(value);
          }
          return null;
        })();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (REFUNDED.some((item) => status.includes(item))) {
          await supabaseAdmin.from("access_grants").delete().ilike("email", email);
          return Response.json({ ok: true, action: "revoked", email });
        }

        if (!APPROVED.some((item) => status.includes(item))) {
          return Response.json({ ok: true, action: "ignored", status });
        }

        // R$ 27,90 => clássico. R$ 47,90 (ou upgrade de R$ 20) => completo.
        const plan = amount !== null && amount > 0 && amount < 40 && amount > 25 ? "classico" : "completo";

        const { data: existing } = await supabaseAdmin
          .from("access_grants")
          .select("id, plan")
          .ilike("email", email)
          .maybeSingle();

        if (existing) {
          const upgraded = existing.plan === "completo" || plan === "completo";
          await supabaseAdmin
            .from("access_grants")
            .update({
              plan: upgraded ? "completo" : "classico",
              source: "cakto",
              order_id: orderId,
            })
            .eq("id", existing.id);
          return Response.json({ ok: true, action: "updated", email, plan: upgraded ? "completo" : "classico" });
        }

        await supabaseAdmin
          .from("access_grants")
          .insert({ email, plan, source: "cakto", order_id: orderId });

        return Response.json({ ok: true, action: "created", email, plan });
      },
    },
  },
});
