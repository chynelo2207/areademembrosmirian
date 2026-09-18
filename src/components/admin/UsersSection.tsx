import { useMemo, useState } from "react";
import { FileText, KeyRound, ListChecks, Search, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useChangeOwnPassword,
  useSetUserAdmin,
  useSetUserPassword,
  useUserProgress,
  useUsers,
} from "@/hooks/useUsers";

const REFUND_STATUSES = ["refunded", "refund", "chargeback", "revoked", "estornado", "cancelado", "canceled", "cancelled"];

function statusLabel(user: { plan: "classico" | "completo" | null; lastPurchaseStatus: string | null }) {
  if (user.plan) return user.plan === "completo" ? "Plano completo" : "Plano clássico";
  if (user.lastPurchaseStatus && REFUND_STATUSES.some((s) => user.lastPurchaseStatus?.includes(s))) {
    return "Reembolsado / acesso revogado";
  }
  return "Sem compra liberada";
}

function ProgressDialog({ userId, email, onClose }: { userId: string | null; email: string; onClose: () => void }) {
  const progress = useUserProgress(userId);

  return (
    <Dialog open={userId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Progresso de {email}</DialogTitle>
        </DialogHeader>

        {progress.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {progress.error && (
          <p className="text-sm text-destructive">{(progress.error as Error).message}</p>
        )}

        {progress.data && (
          <div className="space-y-5">
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <ListChecks className="h-4 w-4" /> Aulas concluídas ({progress.data.completedLessons}/
                {progress.data.totalLessons})
              </h3>
              {progress.data.lessons.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma aula concluída.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {progress.data.lessons.map((lesson, index) => (
                    <li key={index} className="flex justify-between gap-3 text-muted-foreground">
                      <span className="truncate">
                        {lesson.moduleTitle} — {lesson.title}
                      </span>
                      <span className="shrink-0">
                        {new Date(lesson.completedAt).toLocaleString("pt-BR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4" /> Materiais abertos/baixados
              </h3>
              {progress.data.materials.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum material aberto.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {progress.data.materials.map((material, index) => (
                    <li key={index} className="flex justify-between gap-3 text-muted-foreground">
                      <span className="truncate">{material.title}</span>
                      <span className="shrink-0">
                        {new Date(material.viewedAt).toLocaleString("pt-BR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Histórico de compras</h3>
              {progress.data.purchases.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem registro de compra.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {progress.data.purchases.map((purchase, index) => (
                    <li key={index} className="flex justify-between gap-3 text-muted-foreground">
                      <span>
                        {purchase.provider} · {purchase.plan} · {purchase.status}
                      </span>
                      <span className="shrink-0">
                        {new Date(purchase.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function UsersSection() {
  const users = useUsers();
  const setPassword = useSetUserPassword();
  const setAdmin = useSetUserAdmin();
  const changeOwn = useChangeOwnPassword();

  const [target, setTarget] = useState<{ id: string; email: string } | null>(null);
  const [progressTarget, setProgressTarget] = useState<{ id: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [ownPassword, setOwnPassword] = useState("");
  const [query, setQuery] = useState("");

  const visibleUsers = useMemo(() => {
    const rows = users.data ?? [];
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((user) => user.email.toLowerCase().includes(term));
  }, [users.data, query]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl text-primary">Minha senha</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Altere a senha da sua própria conta de administrador (mínimo 10 caracteres).
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1 space-y-1.5">
            <Label htmlFor="own-password">Nova senha</Label>
            <Input
              id="own-password"
              type="password"
              value={ownPassword}
              onChange={(event) => setOwnPassword(event.target.value)}
              placeholder="••••••••••"
            />
          </div>
          <Button
            disabled={ownPassword.length < 10 || changeOwn.isPending}
            onClick={() => {
              changeOwn.mutate(ownPassword, { onSuccess: () => setOwnPassword("") });
            }}
          >
            Salvar senha
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl text-primary">Alunos e administradores</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Veja quem tem conta, defina novas senhas e promova administradores.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              placeholder="Pesquisar por e-mail…"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {users.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {users.error && (
            <p className="text-sm text-destructive">{(users.error as Error).message}</p>
          )}
          {visibleUsers.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {statusLabel(user)}
                  {user.lastSignInAt
                    ? ` · último acesso ${new Date(user.lastSignInAt).toLocaleDateString("pt-BR")}`
                    : " · nunca acessou"}
                </p>
                <div className="mt-2 flex max-w-xs items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${
                          user.lessonsTotal > 0
                            ? Math.round((user.lessonsCompleted / user.lessonsTotal) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {user.lessonsTotal > 0
                      ? Math.round((user.lessonsCompleted / user.lessonsTotal) * 100)
                      : 0}
                    % do curso
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    · {user.materialsDownloaded}/{user.materialsTotal} materiais
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {user.isAdmin && (
                  <Badge variant="secondary" className="gap-1">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </Badge>
                )}
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={user.isAdmin}
                    disabled={setAdmin.isPending}
                    onCheckedChange={(checked) =>
                      setAdmin.mutate({ userId: user.id, isAdmin: checked })
                    }
                  />
                  <span className="text-xs text-muted-foreground">Admin</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProgressTarget({ id: user.id, email: user.email })}
                >
                  <ListChecks className="mr-1.5 h-4 w-4" />
                  Progresso
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTarget({ id: user.id, email: user.email });
                    setNewPassword("");
                  }}
                >
                  <KeyRound className="mr-1.5 h-4 w-4" />
                  Senha
                </Button>
              </div>
            </div>
          ))}
          {!users.isLoading && visibleUsers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {query.trim() ? `Nenhuma conta para “${query}”.` : "Nenhuma conta criada ainda."}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Definir nova senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{target?.email}</p>
            <Label htmlFor="student-password">Nova senha (mínimo 10 caracteres)</Label>
            <Input
              id="student-password"
              type="text"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Ex.: Corset#Mirian2026"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)}>
              Cancelar
            </Button>
            <Button
              disabled={newPassword.length < 10 || setPassword.isPending}
              onClick={() => {
                if (!target) return;
                setPassword.mutate(
                  { userId: target.id, password: newPassword },
                  { onSuccess: () => setTarget(null) },
                );
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProgressDialog
        userId={progressTarget?.id ?? null}
        email={progressTarget?.email ?? ""}
        onClose={() => setProgressTarget(null)}
      />
    </div>
  );
}
