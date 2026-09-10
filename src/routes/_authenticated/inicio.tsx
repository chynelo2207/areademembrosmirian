import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Crown, Download, ExternalLink, Megaphone, PlayCircle } from "lucide-react";

import heroImage from "@/assets/members-hero.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyPlan, useSettings } from "@/hooks/useAccess";
import {
  useAnnouncements,
  useCurrentUser,
  useLessons,
  useModules,
  useProgress,
} from "@/hooks/useMembersData";
import { DEFAULT_UPGRADE_URL } from "@/lib/access";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início — Área de Membros Método Mirian Serrano" },
      {
        name: "description",
        content: "Continue de onde parou e acompanhe seu progresso no curso de corselets.",
      },
      { property: "og:title", content: "Início — Área de Membros Método Mirian Serrano" },
      { property: "og:description", content: "Seu painel de aulas e progresso." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: user } = useCurrentUser();
  const modules = useModules();
  const lessons = useLessons();
  const progress = useProgress();
  const announcements = useAnnouncements();

  const firstName = (
    ((user?.user_metadata?.["full_name"] as string | undefined) ?? user?.email ?? "aluna").split(
      " ",
    )[0] ?? ""
  ).replace(/@.*/, "");

  const allLessons = lessons.data ?? [];
  const done = progress.data ?? [];
  const totalPercent =
    allLessons.length === 0 ? 0 : Math.round((done.length / allLessons.length) * 100);

  const nextLesson = allLessons
    .slice()
    .sort((a, b) => a.position - b.position)
    .find((lesson) => !done.includes(lesson.id));
  const nextModule = modules.data?.find((m) => m.id === nextLesson?.module_id);
  const loading = modules.isLoading || lessons.isLoading || progress.isLoading;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid md:grid-cols-[1.3fr_1fr]">
          <div className="p-7 sm:p-9">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
              Bem-vinda
            </p>
            <h1 className="mt-3 font-serif text-3xl capitalize text-primary sm:text-4xl">
              Olá, {firstName}
            </h1>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Curso Corset ou Corselet Noiva e Moda Festa. Siga na ordem dos módulos para dominar
              molde, estrutura e acabamento.
            </p>

            <div className="mt-7 max-w-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Seu progresso</span>
                <span className="font-medium text-foreground">{totalPercent}%</span>
              </div>
              <Progress value={totalPercent} className="mt-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {done.length} de {allLessons.length} aulas concluídas
              </p>
            </div>

            {nextLesson ? (
              <Button asChild className="mt-7">
                <Link to="/aula/$lessonId" params={{ lessonId: nextLesson.id }}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Continuar: {nextModule?.title.slice(0, 34)} · {nextLesson.title}
                </Link>
              </Button>
            ) : (
              <Button asChild className="mt-7" variant="outline">
                <Link to="/modulos">Ver todos os módulos</Link>
              </Button>
            )}
          </div>
          <div className="relative hidden min-h-[220px] md:block">
            <img
              src={heroImage}
              alt="Corselet estruturado de noiva em manequim"
              width={1600}
              height={912}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link to="/modulos" className="group">
          <Card className="h-full transition-colors group-hover:border-gold">
            <CardHeader>
              <BookOpen className="h-5 w-5 text-gold" />
              <CardTitle className="font-serif text-xl">Módulos e aulas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {modules.data?.length ?? 0} módulos · {allLessons.length} aulas
            </CardContent>
          </Card>
        </Link>
        <Link to="/materiais" className="group">
          <Card className="h-full transition-colors group-hover:border-gold">
            <CardHeader>
              <Download className="h-5 w-5 text-gold" />
              <CardTitle className="font-serif text-xl">Materiais</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Moldes, tabelas e guias para baixar
            </CardContent>
          </Card>
        </Link>
        <Link to="/suporte" className="group">
          <Card className="h-full transition-colors group-hover:border-gold">
            <CardHeader>
              <ArrowRight className="h-5 w-5 text-gold" />
              <CardTitle className="font-serif text-xl">Suporte</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Dúvidas sobre aulas, acesso ou pagamento
            </CardContent>
          </Card>
        </Link>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-primary">Avisos</h2>
          <Link to="/comunidade" className="text-sm text-muted-foreground hover:text-primary">
            Ver tudo
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {announcements.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            (announcements.data ?? []).slice(0, 2).map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-gold" />
                    <CardTitle className="font-serif text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{item.body}</CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {loading && <Skeleton className="h-4 w-32" />}
    </div>
  );
}
