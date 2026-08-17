import { createFileRoute, redirect } from "@tanstack/react-router";

import { CrudSection } from "@/components/admin/CrudSection";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { UsersSection } from "@/components/admin/UsersSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteRow, useOffers, useSaveRow } from "@/hooks/useAdminData";
import {
  useAnnouncements,
  useLessons,
  useMaterials,
  useModules,
} from "@/hooks/useMembersData";
import { fetchIsAdmin } from "@/lib/admin";
import { useGrants } from "@/hooks/useAccess";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    if (!(await fetchIsAdmin())) throw redirect({ to: "/inicio" });
  },
  head: () => ({
    meta: [
      { title: "Administração — Método Mirian Serrano" },
      {
        name: "description",
        content:
          "Painel para cadastrar módulos, aulas, materiais, recados e ofertas da área de membros.",
      },
      { property: "og:title", content: "Administração — Método Mirian Serrano" },
      {
        property: "og:description",
        content: "Gerencie aulas, materiais, recados e ofertas da área de membros.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const modules = useModules();
  const lessons = useLessons();
  const materials = useMaterials();
  const announcements = useAnnouncements();
  const offers = useOffers();
  const grants = useGrants();

  const saveModule = useSaveRow("modules", "modules");
  const deleteModule = useDeleteRow("modules", "modules");
  const saveLesson = useSaveRow("lessons", "lessons");
  const deleteLesson = useDeleteRow("lessons", "lessons");
  const saveMaterial = useSaveRow("materials", "materials");
  const deleteMaterial = useDeleteRow("materials", "materials");
  const saveAnnouncement = useSaveRow("announcements", "announcements");
  const deleteAnnouncement = useDeleteRow("announcements", "announcements");
  const saveGrant = useSaveRow("access_grants", "access-grants");
  const deleteGrant = useDeleteRow("access_grants", "access-grants");
  const saveOffer = useSaveRow("offers", "offers");
  const deleteOffer = useDeleteRow("offers", "offers");

  const moduleOptions = (modules.data ?? []).map((item) => ({
    value: item.id,
    label: item.title,
  }));
  const moduleTitle = (id: string | null) =>
    moduleOptions.find((option) => option.value === id)?.label ?? "Sem módulo";

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-3xl text-primary">Administração</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Cadastre módulos e aulas, envie materiais, publique recados e divulgue novas ofertas.
      </p>

      <Tabs defaultValue="conteudo" className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="conteudo">Módulos</TabsTrigger>
          <TabsTrigger value="aulas">Aulas</TabsTrigger>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="recados">Recados</TabsTrigger>
          <TabsTrigger value="ofertas">Ofertas</TabsTrigger>
          <TabsTrigger value="acessos">Acessos</TabsTrigger>
          <TabsTrigger value="ajustes">Ajustes</TabsTrigger>
        </TabsList>

        <TabsContent value="conteudo" className="mt-4">
          <CrudSection
            title="Módulos"
            description="Organize o curso em módulos e defina a ordem de exibição."
            addLabel="Novo módulo"
            isLoading={modules.isLoading}
            items={modules.data ?? []}
            fields={[
              { name: "title", label: "Título", type: "text", required: true },
              { name: "description", label: "Descrição", type: "textarea" },
              { name: "position", label: "Ordem", type: "number" },
              { name: "cover_url", label: "Imagem de capa (URL)", type: "text" },
              {
                name: "required_plan",
                label: "Plano necessário",
                type: "select",
                options: [
                  { value: "classico", label: "Clássico (R$ 27,90)" },
                  { value: "completo", label: "Completo (R$ 47,90)" },
                ],
              },
              { name: "coming_soon", label: "Em breve", type: "switch" },
            ]}
            renderTitle={(item) => String(item["title"])}
            renderSubtitle={(item) =>
              `Ordem ${String(item["position"])} · ${
                item["required_plan"] === "classico" ? "clássico" : "completo"
              }${item["coming_soon"] ? " · em breve" : ""}`
            }
            onSave={(values, id) => saveModule.mutate({ values, id })}
            onDelete={(id) => deleteModule.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="aulas" className="mt-4">
          <CrudSection
            title="Aulas"
            description="Adicione as aulas com o link do vídeo (YouTube, Vimeo ou Panda)."
            addLabel="Nova aula"
            isLoading={lessons.isLoading}
            items={lessons.data ?? []}
            fields={[
              {
                name: "module_id",
                label: "Módulo",
                type: "select",
                options: moduleOptions,
                required: true,
              },
              { name: "title", label: "Título", type: "text", required: true },
              { name: "description", label: "Descrição", type: "textarea" },
              {
                name: "video_url",
                label: "Link do vídeo",
                type: "text",
                placeholder: "https://www.youtube.com/watch?v=...",
              },
              { name: "duration_minutes", label: "Duração (min)", type: "number" },
              { name: "position", label: "Ordem", type: "number" },
            ]}
            renderTitle={(item) => String(item["title"])}
            renderSubtitle={(item) =>
              `${moduleTitle(item["module_id"] as string)} · ordem ${String(item["position"])}`
            }
            onSave={(values, id) => saveLesson.mutate({ values, id })}
            onDelete={(id) => deleteLesson.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="materiais" className="mt-4">
          <CrudSection
            title="Materiais"
            description="Moldes, PDFs e arquivos para download das alunas."
            addLabel="Novo material"
            isLoading={materials.isLoading}
            items={materials.data ?? []}
            fields={[
              { name: "title", label: "Título", type: "text", required: true },
              { name: "description", label: "Descrição", type: "textarea" },
              { name: "file_url", label: "Link do arquivo", type: "text" },
              {
                name: "kind",
                label: "Tipo",
                type: "select",
                options: [
                  { value: "pdf", label: "PDF" },
                  { value: "molde", label: "Molde" },
                  { value: "link", label: "Link" },
                  { value: "video", label: "Vídeo" },
                ],
              },
              {
                name: "module_id",
                label: "Módulo (opcional)",
                type: "select",
                options: moduleOptions,
              },
              { name: "position", label: "Ordem", type: "number" },
            ]}
            renderTitle={(item) => String(item["title"])}
            renderSubtitle={(item) => String(item["kind"] ?? "")}
            onSave={(values, id) => saveMaterial.mutate({ values, id })}
            onDelete={(id) => deleteMaterial.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="recados" className="mt-4">
          <CrudSection
            title="Recados e avisos"
            description="Publique avisos que aparecem na Comunidade e no Início."
            addLabel="Novo recado"
            isLoading={announcements.isLoading}
            items={announcements.data ?? []}
            fields={[
              { name: "title", label: "Título", type: "text", required: true },
              { name: "body", label: "Mensagem", type: "textarea", required: true },
              { name: "link_url", label: "Link (opcional)", type: "text" },
              { name: "pinned", label: "Fixar no topo", type: "switch" },
            ]}
            renderTitle={(item) => String(item["title"])}
            renderSubtitle={(item) => (item["pinned"] ? "Fixado" : "Publicado")}
            onSave={(values, id) => saveAnnouncement.mutate({ values, id })}
            onDelete={(id) => deleteAnnouncement.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="ofertas" className="mt-4">
          <CrudSection
            title="Ofertas"
            description="Divulgue novos cursos, mentorias e promoções para as alunas."
            addLabel="Nova oferta"
            isLoading={offers.isLoading}
            items={offers.data ?? []}
            fields={[
              { name: "title", label: "Título", type: "text", required: true },
              { name: "description", label: "Descrição", type: "textarea" },
              { name: "price_label", label: "Preço (texto livre)", type: "text" },
              { name: "cta_label", label: "Texto do botão", type: "text" },
              { name: "cta_url", label: "Link de compra", type: "text" },
              { name: "image_url", label: "Imagem (URL)", type: "text" },
              { name: "highlight", label: "Destacar", type: "switch" },
              { name: "active", label: "Ativa", type: "switch" },
              { name: "position", label: "Ordem", type: "number" },
            ]}
            renderTitle={(item) => String(item["title"])}
            renderSubtitle={(item) =>
              `${item["active"] ? "Ativa" : "Inativa"}${item["price_label"] ? ` · ${String(item["price_label"])}` : ""}`
            }
            onSave={(values, id) => saveOffer.mutate({ values, id })}
            onDelete={(id) => deleteOffer.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="acessos" className="mt-4">
          <CrudSection
            title="Acessos liberados"
            description="Somente e-mails desta lista conseguem entrar. Compras da Cakto entram automaticamente."
            addLabel="Liberar e-mail"
            isLoading={grants.isLoading}
            items={grants.data ?? []}
            fields={[
              { name: "email", label: "E-mail da compra", type: "text", required: true },
              {
                name: "plan",
                label: "Plano",
                type: "select",
                options: [
                  { value: "classico", label: "Clássico (módulo inicial)" },
                  { value: "completo", label: "Completo (todos os módulos)" },
                ],
                required: true,
              },
              { name: "order_id", label: "Código do pedido (opcional)", type: "text" },
              { name: "note", label: "Observação", type: "textarea" },
            ]}
            renderTitle={(item) => String(item["email"])}
            renderSubtitle={(item) =>
              `${item["plan"] === "completo" ? "Completo" : "Clássico"} · ${String(item["source"] ?? "manual")}`
            }
            onSave={(values, id) => saveGrant.mutate({ values, id })}
            onDelete={(id) => deleteGrant.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="ajustes" className="mt-4">
          <SettingsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
