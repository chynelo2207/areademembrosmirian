import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Crown, ExternalLink, Lock, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLessons, useModules, useProgress } from "@/hooks/useMembersData";
import { useCoverUrls } from "@/hooks/useCoverUrls";
import { modulePercent, type ModuleRow } from "@/lib/members";
import { canOpenModule, DEFAULT_UPGRADE_URL } from "@/lib/access";
import { useMyPlan, useSettings } from "@/hooks/useAccess";

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
  const settings = useSettings();
  const upgradeUrl = settings.data?.["upgrade_url"] || DEFAULT_UPGRADE_URL;
  const upgradePrice = settings.data?.["upgrade_price_label"] || "R$ 119,98";
  const isClassico = plan.data === "classico";
  const coverUrl = useCoverUrls((modules.data ?? []).map((item) => item.cover_url));

  const lockedCount = (modules.data ?? []).filter(
    (m) => m.required_plan === "completo" && !m.coming_soon,
  ).length;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-serif text-3xl text-primary">Módulos e aulas</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Escolha um módulo e comece a assistir. Conteúdo na ordem recomendada.
      </p>

      {isClassico && lockedCount > 0 && (
        <Card className="mt-6 border-gold/60 bg-accent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-gold" />
              <CardTitle className="font-serif text-xl">Desbloqueie todos os módulos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você tem acesso ao módulo inicial. Libere mais{" "}
              <strong className="text-foreground">{lockedCount}</strong> módulos do curso completo
              por <strong className="text-foreground">{upgradePrice}</strong>.
            </p>
            <Button asChild>
              <a href={upgradeUrl} target="_blank" rel="noopener noreferrer">
                Fazer upgrade agora <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {modules.isLoading || lessons.isLoading || progress.isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-video w-full rounded-xl" />
            ))
          : (modules.data ?? []).map((module) => {
              const stats = modulePercent(lessons.data ?? [], progress.data ?? [], module.id);
              const unlocked = canOpenModule(plan.data ?? null, module.required_plan);
              const card = (
                <ModuleCard
                  module={module}
                  cover={coverUrl(module.cover_url)}
                  unlocked={unlocked}
                  total={stats.total}
                  done={stats.done}
                  percent={stats.percent}
                  upgradePrice={upgradePrice}
                />
              );

              return module.coming_soon ? (
                <div key={module.id}>{card}</div>
              ) : !unlocked ? (
                <Link key={module.id} to="/upgrade" className="block">
                  {card}
                </Link>
              ) : (
                <Link
                  key={module.id}
                  to="/modulos/$moduleId"
                  params={{ moduleId: module.id }}
                  className="block"
                >
                  {card}
                </Link>
              );
            })}
      </div>
    </div>
  );
}

type CardProps = {
  module: ModuleRow;
  cover: string | null;
  unlocked: boolean;
  total: number;
  done: number;
  percent: number;
  upgradePrice: string;
};

function ModuleCard({
  module,
  cover,
  unlocked,
  total,
  done,
  percent,
  upgradePrice,
}: CardProps) {
  const blocked = module.coming_soon || !unlocked;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-xl">
      <div className="relative aspect-video w-full overflow-hidden bg-secondary">
        {cover ? (
          <img
            src={cover}
            alt={`Capa do módulo ${module.title}`}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              blocked ? "opacity-60 grayscale" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/90">
            <span className="font-serif text-5xl text-primary-foreground/80">
              {module.position}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {module.coming_soon ? (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" /> Em breve
            </Badge>
          ) : !unlocked ? (
            <Badge className="gap-1 bg-gold text-gold-foreground">
              <Crown className="h-3 w-3" /> Curso completo
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" /> {total} aulas
            </Badge>
          )}
        </div>

        {!blocked && (
          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-card/90 shadow-lg">
              <Play className="ml-0.5 h-6 w-6 text-primary" />
            </span>
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4">
          <span className="text-[0.6rem] uppercase tracking-[0.25em] text-primary-foreground/80">
            Módulo {module.position}
          </span>
          <h2 className="mt-0.5 line-clamp-2 font-serif text-lg leading-snug text-primary-foreground">
            {module.title}
          </h2>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {module.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{module.description}</p>
        )}
        {!module.coming_soon && !unlocked && (
          <p className="text-xs text-muted-foreground">
            Faz parte do curso completo. Libere por{" "}
            <strong className="text-foreground">{upgradePrice}</strong>.
          </p>
        )}
        {!module.coming_soon && unlocked && (
          <div className="flex items-center gap-3">
            <Progress value={percent} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">
              {done}/{total}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
