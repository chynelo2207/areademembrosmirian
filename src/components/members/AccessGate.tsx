import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMyPlan } from "@/hooks/useAccess";
import { useCurrentUser } from "@/hooks/useMembersData";
import { Skeleton } from "@/components/ui/skeleton";

type Props = { children: React.ReactNode; onSignOut: () => void };

export function AccessGate({ children, onSignOut }: Props) {
  const plan = useMyPlan();
  const { data: user } = useCurrentUser();

  if (plan.isLoading) {
    return (
      <div className="mx-auto max-w-md space-y-3 px-4 py-16">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!plan.data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <Lock className="h-7 w-7 text-primary" aria-hidden="true" />
        <h1 className="font-serif text-3xl text-primary">Acesso não liberado</h1>
        <p className="text-sm text-muted-foreground">
          Não encontramos uma compra ativa para o e-mail <strong>{user?.email}</strong>. Se você já
          comprou, entre com o mesmo e-mail usado no pagamento — ou fale com o suporte para
          liberarmos seu acesso.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <a href="https://metodomirianserrano.lovable.app" target="_blank" rel="noopener noreferrer">
              Quero comprar o curso
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/suporte">Falar com o suporte</Link>
          </Button>
          <Button variant="ghost" onClick={onSignOut}>
            Entrar com outro e-mail
          </Button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
