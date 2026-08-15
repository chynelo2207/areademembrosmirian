import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Crown, Download, Home, LifeBuoy, Megaphone, Settings, Sparkles } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useIsAdmin } from "@/hooks/useAdminData";
import { useMyPlan } from "@/hooks/useAccess";

const items = [
  { title: "Início", url: "/inicio", icon: Home },
  { title: "Módulos e aulas", url: "/modulos", icon: BookOpen },
  { title: "Materiais", url: "/materiais", icon: Download },
  { title: "Ofertas", url: "/ofertas", icon: Sparkles },
  { title: "Comunidade", url: "/comunidade", icon: Megaphone },
  { title: "Suporte", url: "/suporte", icon: LifeBuoy },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const { data: isAdmin } = useIsAdmin();
  const { data: plan } = useMyPlan();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5">
        <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-sidebar-primary">
          Método
        </span>
        <span className="font-serif text-xl leading-tight text-sidebar-foreground">
          Mirian Serrano
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Área de membros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === "/inicio"
                        ? pathname === item.url
                        : pathname.startsWith(item.url)
                    }
                    tooltip={item.title}
                  >
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {plan === "classico" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/upgrade")}
                    tooltip="Liberar curso completo"
                  >
                    <Link to="/upgrade" className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-sidebar-primary" />
                      <span>Curso completo</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestão</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/admin")}
                    tooltip="Administração"
                  >
                    <Link to="/admin" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Administração</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
