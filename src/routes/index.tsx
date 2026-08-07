import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Download, LifeBuoy } from "lucide-react";

import heroImage from "@/assets/members-hero.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Área de Membros — Curso Corset e Corselet Noiva | Mirian Serrano" },
      {
        name: "description",
        content:
          "Acesse a área de membros do Curso Corset ou Corselet Noiva e Moda Festa: 11 módulos, moldes para download, avisos e suporte direto.",
      },
      {
        property: "og:title",
        content: "Área de Membros — Curso Corset e Corselet Noiva | Mirian Serrano",
      },
      {
        property: "og:description",
        content: "Aulas, moldes e suporte do Método Mirian Serrano em um só lugar.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <section className="grid min-h-screen lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Método Mirian Serrano
          </p>
          <h1 className="mt-6 font-serif text-4xl leading-tight text-primary sm:text-5xl">
            Área de membros do Curso Corset ou Corselet Noiva e Moda Festa
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground">
            Todas as aulas, moldes e materiais do método em um ambiente exclusivo, com seu
            progresso salvo aula por aula.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Entrar na área de membros
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <dl className="mt-14 grid gap-6 sm:grid-cols-3">
            <div>
              <BookOpen className="h-5 w-5 text-gold" />
              <dt className="mt-3 font-serif text-lg text-foreground">11 módulos</dt>
              <dd className="text-sm text-muted-foreground">Do molde base ao alto padrão.</dd>
            </div>
            <div>
              <Download className="h-5 w-5 text-gold" />
              <dt className="mt-3 font-serif text-lg text-foreground">Materiais</dt>
              <dd className="text-sm text-muted-foreground">Moldes e tabelas para baixar.</dd>
            </div>
            <div>
              <LifeBuoy className="h-5 w-5 text-gold" />
              <dt className="mt-3 font-serif text-lg text-foreground">Suporte</dt>
              <dd className="text-sm text-muted-foreground">Atendimento direto com a equipe.</dd>
            </div>
          </dl>
        </div>

        <div className="relative min-h-[320px] bg-secondary">
          <img
            src={heroImage}
            alt="Corselet de noiva estruturado em manequim de atelier"
            width={1600}
            height={912}
            className="h-full w-full object-cover"
          />
        </div>
      </section>
    </main>
  );
}
