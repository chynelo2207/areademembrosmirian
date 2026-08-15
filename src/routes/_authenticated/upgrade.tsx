import { createFileRoute } from "@tanstack/react-router";
import { Check, ExternalLink, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyPlan, useSettings } from "@/hooks/useAccess";
import { useModules } from "@/hooks/useMembersData";
import { DEFAULT_UPGRADE_URL } from "@/lib/access";

export const Route = createFileRoute("/_authenticated/upgrade")({
  head: () => ({
    meta: [
      { title: "Liberar curso completo — Método Mirian Serrano" },
      {
        name: "description",
        content:
          "Quem já está na plataforma com o plano clássico libera todos os módulos pagando apenas a diferença.",
      },
      { property: "og:title", content: "Liberar curso completo — Método Mirian Serrano" },
      {
        property: "og:description",
        content: "Desbloqueie todos os módulos do Curso Corset e Corselet Noiva.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UpgradePage,
});

function UpgradePage() {
  const plan = useMyPlan();
  const settings = useSettings();
  const modules = useModules();

  const upgradeUrl = settings.data?.["upgrade_url"] || DEFAULT_UPGRADE_URL;
  const upgradePrice = settings.data?.["upgrade_price_label"] || "R$ 20,00";
  const locked = (modules.data ?? []).filter((m) => m.required_plan === "completo");
  const alreadyComplete = plan.data === "completo" || plan.data === "admin";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-3xl text-primary">Curso completo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        No plano clássico você tem o módulo inicial. Para liberar todos os módulos, quem já está
        aqui dentro paga apenas a diferença.
      </p>

      <Card className="mt-6 border-gold/60 bg-accent">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="font-serif text-2xl">Liberar todos os módulos</CardTitle>
            <Badge variant="secondary">Só para alunas</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-serif text-3xl text-primary">{upgradePrice}</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {locked.slice(0, 12).map((module) => (
              <li key={module.id} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {module.title}
              </li>
            ))}
          </ul>
          {alreadyComplete ? (
            <p className="mt-6 rounded-md bg-card p-4 text-sm text-foreground">
              Seu acesso já está completo — todos os módulos estão liberados.
            </p>
          ) : (
            <Button asChild className="mt-6 w-full sm:w-auto">
              <a href={upgradeUrl} target="_blank" rel="noopener noreferrer">
                Liberar agora <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> A liberação é feita automaticamente pelo e-mail usado no
            pagamento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
