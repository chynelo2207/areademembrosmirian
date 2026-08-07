import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Clock, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLessons, useModules, useProgress } from "@/hooks/useMembersData";
import { modulePercent } from "@/lib/members";

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
                    {!module.coming_soon && (
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
