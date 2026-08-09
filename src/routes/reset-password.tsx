import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Criar nova senha — Método Mirian Serrano" },
      {
        name: "description",
        content: "Crie uma nova senha para acessar a área de membros do Método Mirian Serrano.",
      },
      { property: "og:title", content: "Criar nova senha — Método Mirian Serrano" },
      { property: "og:description", content: "Recupere o acesso à sua área de membros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get("type") === "recovery") setRecoveryReady(true);

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setRecoveryReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) setRecoveryReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 10) {
      toast.error("Use uma senha com pelo menos 10 caracteres");
      return;
    }
    if (password !== confirmation) {
      toast.error("As senhas não são iguais");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível salvar a nova senha", { description: error.message });
      return;
    }
    setUpdated(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
          {updated ? <CheckCircle2 aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
        </div>
        <h1 className="mt-4 text-center font-serif text-3xl text-primary">
          {updated ? "Senha atualizada" : "Criar nova senha"}
        </h1>

        {updated ? (
          <div className="mt-6 space-y-5 text-center">
            <p className="text-sm text-muted-foreground">
              Sua nova senha foi salva. Você já pode acessar todas as aulas.
            </p>
            <Button className="w-full" onClick={() => navigate({ to: "/inicio", replace: true })}>
              Entrar na área de membros
            </Button>
          </div>
        ) : recoveryReady ? (
          <form onSubmit={handleUpdate} className="mt-7 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={10}
                maxLength={72}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">Use pelo menos 10 caracteres.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                minLength={10}
                maxLength={72}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        ) : (
          <div className="mt-6 space-y-5 text-center">
            <p className="text-sm text-muted-foreground">
              Este link é inválido ou expirou. Solicite um novo link na tela de acesso.
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/auth" })}>
              Voltar para o acesso
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}