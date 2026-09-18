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
        const candidates = [
          request.headers.get("x-webhook-secret"),
          request.headers.get("x-cakto-secret"),
          request.headers.get("x-cakto-signature"),
          request.headers.get("secret"),
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, ""),
          url.searchParams.get("secret"),
        ].filter((item): item is string => typeof item === "string" && item.length > 0);
        if (!secret || !candidates.includes(secret)) {
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

        // Sempre grava um registro permanente do evento (mesmo reembolso), independente
        // do que acontecer com o acesso. Isso mantém o histórico mesmo depois que
        // access_grants for apagado.
        const logPurchase = (planForLog: "classico" | "completo", statusForLog: string) =>
          supabaseAdmin.from("purchases").upsert(
            {
              email,
              plan: planForLog,
              provider: "cakto",
              checkout_id: orderId,
              transaction_id: orderId ?? `cakto-${email}-${Date.now()}`,
              status: statusForLog,
              raw: payload as never,
            },
            { onConflict: "provider,transaction_id" },
          );

        if (REFUNDED.some((item) => status.includes(item))) {
          const { data: existingGrant } = await supabaseAdmin
            .from("access_grants")
            .select("plan")
            .ilike("email", email)
            .maybeSingle();
          await supabaseAdmin.from("access_grants").delete().ilike("email", email);
          await logPurchase(existingGrant?.plan ?? "classico", "refunded");
          return Response.json({ ok: true, action: "revoked", email });
        }

        if (!APPROVED.some((item) => status.includes(item))) {
          return Response.json({ ok: true, action: "ignored", status });
        }

        // R$ 27,90 => clássico. R$ 47,90 (ou upgrade de R$ 20) => completo.
        // Valores podem chegar em reais ou centavos.
        const value = amount === null ? null : amount > 1000 ? amount / 100 : amount;
        const plan = value !== null && value >= 25 && value < 40 ? "classico" : "completo";

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
          await logPurchase(upgraded ? "completo" : "classico", "approved");
          return Response.json({ ok: true, action: "updated", email, plan: upgraded ? "completo" : "classico" });
        }

        await supabaseAdmin
          .from("access_grants")
          .insert({ email, plan, source: "cakto", order_id: orderId });
        await logPurchase(plan, "approved");

        return Response.json({ ok: true, action: "created", email, plan });
      },
    },
  },
});
