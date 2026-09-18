import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Film } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLessons, useModules, useProgress } from "@/hooks/useMembersData";
import { toEmbedUrl, toggleLessonDone } from "@/lib/members";

const AUTO_COMPLETE_MS = 20_000;

export const Route = createFileRoute("/_authenticated/aula/$lessonId")({
  head: () => ({
    meta: [
      { title: "Aula — Área de Membros Método Mirian Serrano" },
      { name: "description", content: "Assista à aula e marque como concluída." },
      { property: "og:title", content: "Aula — Área de Membros Método Mirian Serrano" },
      { property: "og:description", content: "Player da aula com controle de progresso." },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lessons = useLessons();
  const modules = useModules();
  const progress = useProgress();

  const lesson = lessons.data?.find((item) => item.id === lessonId);
  const module = modules.data?.find((item) => item.id === lesson?.module_id);
  const siblings = (lessons.data ?? [])
    .filter((item) => item.module_id === lesson?.module_id)
    .sort((a, b) => a.position - b.position);
  const index = siblings.findIndex((item) => item.id === lessonId);
  const previous = index > 0 ? siblings[index - 1] : undefined;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;
  const isDone = (progress.data ?? []).includes(lessonId);
  const autoMarkedRef = useRef(false);

  const mutation = useMutation({
    mutationFn: (vars: { done: boolean; auto?: boolean }) => toggleLessonDone(lessonId, vars.done),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      if (vars.done) {
        toast.success(vars.auto ? "Aula marcada como concluída" : "Aula concluída!");
      } else {
        toast.success("Marcação removida");
      }
      // Só pula pra próxima aula quando a pessoa clica manualmente em "concluída";
      // na marcação automática ela ainda pode estar assistindo o vídeo.
      if (vars.done && !vars.auto && next) {
        navigate({ to: "/aula/$lessonId", params: { lessonId: next.id } });
      }
    },
    onError: () => toast.error("Não foi possível salvar seu progresso"),
  });

  // Marca a aula como concluída automaticamente depois de 20s na página,
  // sem depender da pessoa clicar em "marcar como concluída".
  useEffect(() => {
    autoMarkedRef.current = false;
    if (isDone) return;
    const timer = setTimeout(() => {
      if (!autoMarkedRef.current) {
        autoMarkedRef.current = true;
        mutation.mutate({ done: true, auto: true });
      }
    }, AUTO_COMPLETE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, isDone]);

  if (lessons.isLoading || modules.isLoading) {
    return <Skeleton className="mx-auto h-72 max-w-4xl" />;
  }

  if (!lesson || !module) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-muted-foreground">Aula não encontrada.</p>
        <Link to="/modulos" className="mt-3 inline-block text-sm text-primary">
          Voltar para módulos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/modulos/$moduleId"
        params={{ moduleId: module.id }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {module.title}
      </Link>

      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-primary">
        <div className="aspect-video w-full">
          {lesson.video_url ? (
            <iframe
              src={toEmbedUrl(lesson.video_url)}
              referrerPolicy="strict-origin-when-cross-origin"
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-primary-foreground">
              <Film className="h-8 w-8 opacity-70" />
              <p className="text-sm opacity-80">Vídeo desta aula em publicação</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-primary">{lesson.title}</h1>
          {lesson.duration_minutes && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {lesson.duration_minutes} minutos
            </p>
          )}
        </div>
        <Button
          variant={isDone ? "outline" : "default"}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ done: !isDone })}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {isDone ? "Concluída" : "Marcar como concluída"}
        </Button>
      </div>

      {lesson.description && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{lesson.description}</p>
      )}

      <div className="mt-10 flex items-center justify-between border-t border-border pt-5">
        {previous ? (
          <Button variant="ghost" asChild>
            <Link to="/aula/$lessonId" params={{ lessonId: previous.id }}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {previous.title}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button variant="ghost" asChild>
            <Link to="/aula/$lessonId" params={{ lessonId: next.id }}>
              {next.title} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
