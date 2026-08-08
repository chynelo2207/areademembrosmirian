import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOffers } from "@/hooks/useAdminData";

export const Route = createFileRoute("/_authenticated/ofertas")({
  head: () => ({
    meta: [
      { title: "Ofertas para alunas — Método Mirian Serrano" },
      {
        name: "description",
        content: "Cursos, mentorias e condições especiais para alunas do Método Mirian Serrano.",
      },
      { property: "og:title", content: "Ofertas para alunas — Método Mirian Serrano" },
      { property: "og:description", content: "Condições especiais para alunas do curso." },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const offers = useOffers();
  const items = (offers.data ?? []).filter((offer) => offer.active);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-3xl text-primary">Ofertas para alunas</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Novidades, mentorias e condições especiais liberadas para quem já está no curso.
      </p>

      <div className="mt-6 space-y-4">
        {offers.isLoading &&
          Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}

        {!offers.isLoading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma oferta disponível no momento. Fique de olho por aqui.
          </p>
        )}

        {items.map((offer) => (
          <Card key={offer.id} className={offer.highlight ? "border-gold/60 bg-accent" : ""}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                <CardTitle className="font-serif text-xl">{offer.title}</CardTitle>
                {offer.highlight && <Badge variant="secondary">Destaque</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              {offer.image_url && (
                <img
                  src={offer.image_url}
                  alt={offer.title}
                  loading="lazy"
                  className="mb-4 aspect-video w-full rounded-md object-cover"
                />
              )}
              {offer.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {offer.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                {offer.price_label && (
                  <span className="font-serif text-lg text-primary">{offer.price_label}</span>
                )}
                {offer.cta_url && (
                  <Button asChild>
                    <a href={offer.cta_url} target="_blank" rel="noopener noreferrer">
                      {offer.cta_label} <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
