import { useMemo, useState } from "react";
import { KeyRound, Search, ShieldCheck } from "lucide-react";

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
  useUsers,
} from "@/hooks/useUsers";

export function UsersSection() {
  const users = useUsers();
  const setPassword = useSetUserPassword();
  const setAdmin = useSetUserAdmin();
  const changeOwn = useChangeOwnPassword();

  const [target, setTarget] = useState<{ id: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [ownPassword, setOwnPassword] = useState("");

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
          {users.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {users.error && (
            <p className="text-sm text-destructive">{(users.error as Error).message}</p>
          )}
          {(users.data ?? []).map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.plan
                    ? user.plan === "completo"
                      ? "Plano completo"
                      : "Plano clássico"
                    : "Sem compra liberada"}
                  {user.lastSignInAt
                    ? ` · último acesso ${new Date(user.lastSignInAt).toLocaleDateString("pt-BR")}`
                    : " · nunca acessou"}
                </p>
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
          {!users.isLoading && (users.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma conta criada ainda.</p>
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
    </div>
  );
}
