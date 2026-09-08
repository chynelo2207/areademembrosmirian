import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Image as ImageIcon, Table } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMaterials } from "@/hooks/useMembersData";
import { resolveMaterialUrl } from "@/lib/members";

async function openMaterial(fileUrl: string) {
  try {
    const url = await resolveMaterialUrl(fileUrl);
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Não foi possível abrir o arquivo");
  }
}


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
              const isCompleto = material.required_plan === "completo";
              const isImage =
                material.kind === "imagem" ||
                /\.(png|jpe?g|webp|gif|avif)$/i.test(material.file_url ?? "");
              const Icon = isImage ? ImageIcon : material.kind === "planilha" ? Table : FileText;
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
                    <Badge variant="secondary" className="mt-2">
                      {isCompleto ? "Curso completo" : "Clássico e completo"}
                    </Badge>
                  </div>
                  {material.file_url ? (
                    <Button
                      variant="outline"
                      onClick={() => void openMaterial(material.file_url as string)}
                    >
                      <Download className="mr-2 h-4 w-4" /> {isImage ? "Abrir" : "Baixar"}
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
