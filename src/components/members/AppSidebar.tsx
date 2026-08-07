import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Download, Home, LifeBuoy, Megaphone } from "lucide-react";

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

const items = [
  { title: "Início", url: "/inicio", icon: Home },
  { title: "Módulos e aulas", url: "/modulos", icon: BookOpen },
  { title: "Materiais", url: "/materiais", icon: Download },
  { title: "Comunidade", url: "/comunidade", icon: Megaphone },
  { title: "Suporte", url: "/suporte", icon: LifeBuoy },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (router) => router.location.pathname });

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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
