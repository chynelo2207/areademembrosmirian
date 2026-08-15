import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Clock, Crown, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLessons, useModules, useProgress } from "@/hooks/useMembersData";
import { modulePercent } from "@/lib/members";
import { canOpenModule } from "@/lib/access";
import { useMyPlan } from "@/hooks/useAccess";

export const Route = createFileRoute("/_authenticated/modulos/")({
  head: () => ({
    meta: [
      { title: "Módulos do curso — Método Mirian Serrano" },
      {
        name: "description",
        content:
          "Os 11 módulos do Curso Corset ou Corselet Noiva e Moda Festa, do molde base ao acabamento alto padrão.",
      },
      { property: "og:title", content: "Módulos do curso — Método Mirian Serrano" },
      { property: "og:description", content: "Todas as aulas organizadas por módulo." },
    ],
  }),
  component: ModulesPage,
});

function ModulesPage() {
  const modules = useModules();
  const lessons = useLessons();
  const progress = useProgress();
  const plan = useMyPlan();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-3xl text-primary">Módulos e aulas</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Conteúdo completo do curso, na ordem recomendada.
      </p>

      <div className="mt-8 space-y-3">
        {modules.isLoading || lessons.isLoading || progress.isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))
          : (modules.data ?? []).map((module) => {
              const stats = modulePercent(lessons.data ?? [], progress.data ?? [], module.id);
              const unlocked = canOpenModule(plan.data ?? null, module.required_plan);
              const content = (
                <Card className="transition-colors hover:border-gold">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
                          Módulo {module.position}
                        </span>
                        <CardTitle className="mt-1 font-serif text-xl leading-snug">
                          {module.title}
                        </CardTitle>
                      </div>
                      {module.coming_soon ? (
                        <Badge variant="secondary" className="shrink-0 gap-1">
                          <Lock className="h-3 w-3" /> Em breve
                        </Badge>
                      ) : !unlocked ? (
                        <Badge className="shrink-0 gap-1 bg-primary text-primary-foreground">
                          <Crown className="h-3 w-3" /> Curso completo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0 gap-1">
                          <Clock className="h-3 w-3" /> {stats.total} aulas
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {module.description && (
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    )}
                    {!module.coming_soon && !unlocked && (
                      <p className="mt-4 text-xs text-muted-foreground">
                        Este módulo faz parte do curso completo. Libere pagando apenas a diferença.
                      </p>
                    )}
                    {!module.coming_soon && unlocked && (
                      <div className="mt-4 flex items-center gap-3">
                        <Progress value={stats.percent} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {stats.done}/{stats.total}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );

              return module.coming_soon ? (
                <div key={module.id} className="opacity-70">
                  {content}
                </div>
              ) : !unlocked ? (
                <Link key={module.id} to="/upgrade" className="block opacity-80">
                  {content}
                </Link>
              ) : (
                <Link key={module.id} to="/modulos/$moduleId" params={{ moduleId: module.id }}>
                  {content}
                </Link>
              );
            })}
      </div>
    </div>
  );
}
