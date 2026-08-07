import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Megaphone, Pin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnnouncements } from "@/hooks/useMembersData";

export const Route = createFileRoute("/_authenticated/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade e avisos — Método Mirian Serrano" },
      {
        name: "description",
        content: "Novidades, avisos das turmas e grupo de alunas do Método Mirian Serrano.",
      },
      { property: "og:title", content: "Comunidade e avisos — Método Mirian Serrano" },
      { property: "og:description", content: "Avisos e grupo de alunas do curso." },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const announcements = useAnnouncements();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-3xl text-primary">Comunidade</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Avisos, novidades do curso e o grupo das alunas.
      </p>

      <Card className="mt-6 border-gold/50 bg-accent">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-xl text-accent-foreground">
            Grupo de alunas no WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-sm text-sm text-accent-foreground/80">
            Troque experiências, mostre suas peças e acompanhe avisos rápidos.
          </p>
          <Button asChild>
            <a
              href="https://wa.me/5500000000000"
              target="_blank"
              rel="noopener noreferrer"
            >
              Entrar no grupo <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-3">
        {announcements.isLoading
          ? Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))
          : (announcements.data ?? []).map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Megaphone className="h-4 w-4 text-gold" />
                    <CardTitle className="font-serif text-lg">{item.title}</CardTitle>
                    {item.pinned && (
                      <Badge variant="secondary" className="gap-1">
                        <Pin className="h-3 w-3" /> Fixado
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  {item.link_url && (
                    <Button asChild variant="link" className="mt-1 px-0">
                      <a href={item.link_url} target="_blank" rel="noopener noreferrer">
                        Abrir link
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
