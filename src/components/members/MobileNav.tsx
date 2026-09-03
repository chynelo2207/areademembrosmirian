import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Download, Home, LifeBuoy, Megaphone } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { title: "Início", url: "/inicio", icon: Home },
  { title: "Aulas", url: "/modulos", icon: BookOpen },
  { title: "Materiais", url: "/materiais", icon: Download },
  { title: "Avisos", url: "/comunidade", icon: Megaphone },
  { title: "Suporte", url: "/suporte", icon: LifeBuoy },
] as const;

/** Barra de navegação inferior — aparência de aplicativo no celular. */
export function MobileNav() {
  const pathname = useRouterState({ select: (router) => router.location.pathname });

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const active =
            item.url === "/inicio" ? pathname === item.url : pathname.startsWith(item.url);
          return (
            <li key={item.url} className="flex-1">
              <Link
                to={item.url}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[3.5rem] flex-col items-center justify-center gap-1 px-1 py-2 text-[0.68rem] transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("h-5 w-5", active && "text-primary")} />
                <span className="leading-none">{item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
