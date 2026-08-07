import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLessons, useModules, useProgress } from "@/hooks/useMembersData";
import { modulePercent } from "@/lib/members";

export const Route = createFileRoute("/_authenticated/modulos/$moduleId")({
  head: () => ({
    meta: [
      { title: "Aulas do módulo — Método Mirian Serrano" },
      { name: "description", content: "Lista de aulas do módulo com seu progresso." },
      { property: "og:title", content: "Aulas do módulo — Método Mirian Serrano" },
      { property: "og:description", content: "Assista às aulas e marque seu progresso." },
    ],
  }),
  component: ModuleDetail,
});

function ModuleDetail() {
  const { moduleId } = Route.useParams();
  const modules = useModules();
  const lessons = useLessons();
  const progress = useProgress();

  const module = modules.data?.find((item) => item.id === moduleId);
  const moduleLessons = (lessons.data ?? [])
    .filter((lesson) => lesson.module_id === moduleId)
    .sort((a, b) => a.position - b.position);
  const done = progress.data ?? [];
  const stats = modulePercent(lessons.data ?? [], done, moduleId);

  if (modules.isLoading || lessons.isLoading) {
    return <Skeleton className="mx-auto h-64 max-w-3xl" />;
  }

  if (!module) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-muted-foreground">Módulo não encontrado.</p>
        <Link to="/modulos" className="mt-3 inline-block text-sm text-primary">
          Voltar para módulos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/modulos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Módulos
      </Link>

      <span className="mt-6 block text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
        Módulo {module.position}
      </span>
      <h1 className="mt-1 font-serif text-3xl leading-tight text-primary">{module.title}</h1>
      {module.description && (
        <p className="mt-3 text-sm text-muted-foreground">{module.description}</p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Progress value={stats.percent} className="h-1.5 max-w-xs flex-1" />
        <span className="text-xs text-muted-foreground">
          {stats.done} de {stats.total} concluídas
        </span>
      </div>

      <ul className="mt-8 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {moduleLessons.length === 0 && (
          <li className="p-5 text-sm text-muted-foreground">
            As aulas deste módulo serão liberadas em breve.
          </li>
        )}
        {moduleLessons.map((lesson) => {
          const isDone = done.includes(lesson.id);
          return (
            <li key={lesson.id}>
              <Link
                to="/aula/$lessonId"
                params={{ lessonId: lesson.id }}
                className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary"
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-cta" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 text-sm text-foreground">{lesson.title}</span>
                {lesson.duration_minutes && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {lesson.duration_minutes} min
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
