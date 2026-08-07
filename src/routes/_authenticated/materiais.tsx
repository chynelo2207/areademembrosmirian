import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Table } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMaterials, useModules } from "@/hooks/useMembersData";

export const Route = createFileRoute("/_authenticated/materiais")({
  head: () => ({
    meta: [
      { title: "Materiais para download — Método Mirian Serrano" },
      {
        name: "description",
        content: "Moldes, tabelas de medidas e guias do curso de corselets para baixar.",
      },
      { property: "og:title", content: "Materiais para download — Método Mirian Serrano" },
      { property: "og:description", content: "Moldes, tabelas e guias do método." },
    ],
  }),
  component: MaterialsPage,
});

function MaterialsPage() {
  const materials = useMaterials();
  const modules = useModules();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-3xl text-primary">Materiais</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Moldes, tabelas e guias de apoio. Baixe e imprima quando precisar.
      </p>

      <div className="mt-8 space-y-3">
        {materials.isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))
          : (materials.data ?? []).map((material) => {
              const module = modules.data?.find((item) => item.id === material.module_id);
              const Icon = material.kind === "planilha" ? Table : FileText;
              return (
                <div
                  key={material.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-[12rem] flex-1">
                    <h2 className="font-serif text-lg text-foreground">{material.title}</h2>
                    {material.description && (
                      <p className="text-sm text-muted-foreground">{material.description}</p>
                    )}
                    {module && (
                      <Badge variant="secondary" className="mt-2">
                        Módulo {module.position}
                      </Badge>
                    )}
                  </div>
                  {material.file_url ? (
                    <Button asChild variant="outline">
                      <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" /> Baixar
                      </a>
                    </Button>
                  ) : (
                    <Badge variant="secondary">Em publicação</Badge>
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
}
