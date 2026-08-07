import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { AppSidebar } from "@/components/members/AppSidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useMembersData";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
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

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const name =
    (user?.user_metadata?.["full_name"] as string | undefined) ?? user?.email ?? "Aluna";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:px-5">
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
          <main className="flex-1 px-4 py-8 sm:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
