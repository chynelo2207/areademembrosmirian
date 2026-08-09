import { createFileRoute, redirect, useNavigate, useSearch } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const value = search["redirect"];
    return typeof value === "string" ? { redirect: value } : {};
  },
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: safePath(search.redirect) });
  },
  head: () => ({
    meta: [
      { title: "Entrar — Área de Membros Método Mirian Serrano" },
      {
        name: "description",
        content: "Acesse suas aulas, moldes e materiais do Curso Corset e Corselet Noiva.",
      },
      { property: "og:title", content: "Entrar — Área de Membros Método Mirian Serrano" },
      {
        property: "og:description",
        content: "Login da área de membros do Método Mirian Serrano.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function safePath(value?: string) {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/inicio";
}

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const destination = safePath(search.redirect);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: destination, replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [destination, navigate]);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("E-mail ou senha incorretos", {
        description: "Se você criou a conta com Google ou esqueceu a senha, use “Esqueci minha senha”.",
      });
      return;
    }
    navigate({ to: destination, replace: true });
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    if (fullName.trim().length < 2) {
      toast.error("Informe seu nome completo");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim() },
      },
    });
    setLoading(false);
    if (error) {
      const weakPassword = error.message.toLowerCase().includes("weak") || error.message.toLowerCase().includes("guess");
      toast.error("Não foi possível criar a conta", {
        description: weakPassword
          ? "Essa senha é muito comum. Escolha uma senha exclusiva com pelo menos 10 caracteres."
          : error.message,
      });
      return;
    }
    if (data.user?.identities?.length === 0) {
      toast.info("Este e-mail já possui uma conta", {
        description: "Entre com Google ou use “Esqueci minha senha” para criar uma senha.",
      });
      return;
    }
    if (!data.session) {
      setCheckEmail(true);
      toast.success("Confirme seu e-mail para ativar o acesso");
    }
  }

  async function handleForgotPassword() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      toast.error("Informe seu e-mail primeiro");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o link", { description: error.message });
      return;
    }
    setRecoverySent(true);
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: destination, replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <p className="text-center text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground">
          Método Mirian Serrano
        </p>
        <h1 className="mt-3 text-center font-serif text-3xl text-primary">Área de membros</h1>

        {checkEmail || recoverySent ? (
          <div className="mt-8 rounded-lg bg-accent p-5 text-center text-sm text-accent-foreground">
            <MailCheck className="mx-auto mb-3 h-6 w-6 text-primary" aria-hidden="true" />
            {recoverySent ? (
              <p>Enviamos para <strong>{email}</strong> um link para você criar uma nova senha.</p>
            ) : (
              <p>Enviamos um link de confirmação para <strong>{email}</strong>. Confirme para liberar seu acesso.</p>
            )}
            <Button variant="link" className="mt-2" onClick={() => { setCheckEmail(false); setRecoverySent(false); }}>
              Voltar
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="entrar" className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar">
              <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    maxLength={72}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="text-right">
                    <Button type="button" variant="link" className="h-auto px-0 py-0 text-xs" onClick={handleForgotPassword} disabled={loading}>
                      Esqueci minha senha
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="criar">
              <form onSubmit={handleSignUp} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    required
                    maxLength={100}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">E-mail</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    required
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Senha</Label>
                  <Input
                    id="password-signup"
                    type="password"
                    required
                    minLength={10}
                    maxLength={72}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Use pelo menos 10 caracteres e evite senhas comuns.</p>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando..." : "Criar minha conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">ou</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogle}>
          Continuar com Google
        </Button>
      </div>
    </main>
  );
}
