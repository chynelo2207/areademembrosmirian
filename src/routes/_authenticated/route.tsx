import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useEffect } from "react";

import { AccessGate } from "@/components/members/AccessGate";
import { AppSidebar } from "@/components/members/AppSidebar";
import { InstallPrompt } from "@/components/members/InstallPrompt";
import { MobileNav } from "@/components/members/MobileNav";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useMembersData";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.user };
  },
  component: MembersLayout,
});

function MembersLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  useEffect(() => {
    if (!user) return;
    void supabase.from("profiles").upsert({
      id: user.id,
      full_name: (user.user_metadata?.["full_name"] as string | undefined) ?? null,
    });
  }, [user]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const name =
    (user?.user_metadata?.["full_name"] as string | undefined) ?? user?.email ?? "Aluna";

  return (
    <AccessGate onSignOut={handleSignOut}>
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header
            className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-card/95 px-3 backdrop-blur sm:px-5"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="hidden text-sm text-muted-foreground sm:inline">
                Curso Corset ou Corselet Noiva e Moda Festa
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="max-w-[9rem] truncate text-sm text-foreground sm:max-w-none">
                {name}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1.5 h-4 w-4" />
                Sair
              </Button>
            </div>
          </header>
          <main className="flex-1 px-4 pb-24 pt-6 sm:px-8 sm:py-8 md:pb-8">
            <Outlet />
          </main>
          <MobileNav />
          <InstallPrompt />
        </div>
      </div>
    </SidebarProvider>
    </AccessGate>
  );
}
