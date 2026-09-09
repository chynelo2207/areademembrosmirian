import { createFileRoute } from "@tanstack/react-router";

type Payload = Record<string, unknown>;

function pick(source: Payload, path: string[]): unknown {
  let current: unknown = source;
  for (const key of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function firstString(payload: Payload, paths: string[][]): string | null {
  for (const path of paths) {
    const value = pick(payload, path);
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

const APPROVED = ["paid", "approved", "aprovado", "aprovada", "purchase_approved", "completed", "authorized", "success"];
const REVOKED = ["refunded", "refund", "chargeback", "canceled", "cancelled", "cancelado", "estornado", "expired"];

export const Route = createFileRoute("/api/public/wiapy")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["WIAPY_WEBHOOK_SECRET"];
        const url = new URL(request.url);
        const sent = [
          request.headers.get("x-wiapy-secret"),
          request.headers.get("x-webhook-secret"),
          request.headers.get("x-webhook-token"),
          request.headers.get("secret"),
          request.headers.get("token"),
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, ""),
          url.searchParams.get("secret"),
          url.searchParams.get("token"),
        ].filter((item): item is string => typeof item === "string" && item.length > 0);

        if (!secret || !sent.includes(secret)) {
          return new Response("Invalid secret", { status: 401 });
        }

        let payload: Payload;
        try {
          payload = (await request.json()) as Payload;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const email = (() => {
          const value = firstString(payload, [
            ["customer", "email"],
            ["buyer", "email"],
            ["client", "email"],
            ["cliente", "email"],
            ["data", "customer", "email"],
            ["data", "buyer", "email"],
            ["data", "client", "email"],
            ["email"],
            ["data", "email"],
          ]);
          return value && value.includes("@") ? value.toLowerCase() : null;
        })();
        if (!email) return Response.json({ ok: false, error: "email não encontrado" }, { status: 400 });

        const buyerName = firstString(payload, [
          ["customer", "name"],
          ["buyer", "name"],
          ["client", "name"],
          ["cliente", "nome"],
          ["data", "customer", "name"],
          ["data", "buyer", "name"],
          ["name"],
          ["nome"],
          ["data", "name"],
        ]);

        const status = (
          firstString(payload, [["status"], ["data", "status"], ["event"], ["type"], ["data", "event"]]) ?? ""
        ).toLowerCase();

        const checkoutId = firstString(payload, [
          ["checkout_id"],
          ["checkoutId"],
          ["checkout", "id"],
          ["data", "checkout_id"],
          ["data", "checkoutId"],
          ["data", "checkout", "id"],
          ["offer", "id"],
          ["data", "offer", "id"],
          ["product", "id"],
          ["data", "product", "id"],
        ]);

        const transactionId =
          firstString(payload, [
            ["transaction_id"],
            ["transactionId"],
            ["payment_id"],
            ["paymentId"],
            ["transaction", "id"],
            ["payment", "id"],
            ["data", "transaction_id"],
            ["data", "transactionId"],
            ["data", "payment_id"],
            ["data", "transaction", "id"],
            ["order_id"],
            ["data", "order_id"],
            ["id"],
            ["data", "id"],
          ]) ?? `${email}:${checkoutId ?? "unknown"}`;

        const basicoId = process.env["WIAPY_CHECKOUT_BASICO_ID"] ?? "";
        const completoId = process.env["WIAPY_CHECKOUT_COMPLETO_ID"] ?? "";

        const plan: "classico" | "completo" | null =
          checkoutId && completoId && checkoutId === completoId
            ? "completo"
            : checkoutId && basicoId && checkoutId === basicoId
              ? "classico"
              : null;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (REVOKED.some((item) => status.includes(item))) {
          await supabaseAdmin.from("access_grants").delete().ilike("email", email);
          await supabaseAdmin
            .from("purchases")
            .upsert(
              {
                email,
                buyer_name: buyerName,
                plan: plan ?? "classico",
                provider: "wiapy",
                checkout_id: checkoutId,
                transaction_id: transactionId,
                status: status || "revoked",
              },
              { onConflict: "provider,transaction_id" },
            );
          return Response.json({ ok: true, action: "revoked", email });
        }

        if (!APPROVED.some((item) => status.includes(item))) {
          return Response.json({ ok: true, action: "ignored", status });
        }

        if (!plan) {
          return Response.json(
            {
              ok: false,
              error:
                "checkout não reconhecido: configure WIAPY_CHECKOUT_BASICO_ID / WIAPY_CHECKOUT_COMPLETO_ID",
              checkout_id: checkoutId,
            },
            { status: 400 },
          );
        }

        // Idempotência: mesma transação já processada => não repete nada.
        const { data: alreadyDone } = await supabaseAdmin
          .from("purchases")
          .select("id, plan")
          .eq("provider", "wiapy")
          .eq("transaction_id", transactionId)
          .maybeSingle();
        if (alreadyDone) {
          return Response.json({ ok: true, action: "already_processed", email, plan: alreadyDone.plan });
        }

        // 1) conta do aluno (cria só se ainda não existir)
        let userId: string | null = null;
        const { data: listed } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const found = listed?.users?.find((user) => (user.email ?? "").toLowerCase() === email);
        if (found) {
          userId = found.id;
        } else {
          const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            email,
            buyerName ? { data: { full_name: buyerName } } : undefined,
          );
          if (!inviteError && invited?.user) {
            userId = invited.user.id;
          } else {
            const { data: created } = await supabaseAdmin.auth.admin.createUser({
              email,
              email_confirm: true,
              password: crypto.randomUUID() + "Aa1!",
              user_metadata: buyerName ? { full_name: buyerName } : {},
            });
            userId = created?.user?.id ?? null;
          }
        }

        // 2) perfil (idempotente)
        if (userId) {
          await supabaseAdmin
            .from("profiles")
            .upsert({ id: userId, full_name: buyerName ?? null }, { onConflict: "id" });
        }

        // 3) liberação de acesso (nunca rebaixa quem já tem completo)
        const { data: existingGrant } = await supabaseAdmin
          .from("access_grants")
          .select("id, plan")
          .ilike("email", email)
          .maybeSingle();

        const finalPlan =
          existingGrant?.plan === "completo" || plan === "completo" ? "completo" : "classico";

        if (existingGrant) {
          await supabaseAdmin
            .from("access_grants")
            .update({
              plan: finalPlan,
              source: "wiapy",
              order_id: transactionId,
              note: buyerName,
            })
            .eq("id", existingGrant.id);
        } else {
          await supabaseAdmin.from("access_grants").insert({
            email,
            plan: finalPlan,
            source: "wiapy",
            order_id: transactionId,
            note: buyerName,
          });
        }

        // 4) histórico da compra
        await supabaseAdmin.from("purchases").upsert(
          {
            email,
            buyer_name: buyerName,
            plan,
            provider: "wiapy",
            checkout_id: checkoutId,
            transaction_id: transactionId,
            status: status || "approved",
          },
          { onConflict: "provider,transaction_id" },
        );

        return Response.json({
          ok: true,
          action: existingGrant ? "updated" : "created",
          email,
          plan: finalPlan,
          user_created: !found,
        });
      },
    },
  },
});
