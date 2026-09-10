import { useRef, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadMaterialFile } from "@/lib/admin";

export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "switch" | "select" | "file";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  accept?: string;
};


export type CrudItem = { id: string } & Record<string, unknown>;

type Props = {
  title: string;
  description: string;
  addLabel: string;
  fields: Field[];
  items: CrudItem[];
  isLoading?: boolean;
  renderTitle: (item: CrudItem) => string;
  renderSubtitle?: (item: CrudItem) => string;
  onSave: (values: Record<string, unknown>, id?: string) => void;
  onDelete: (id: string) => void;
  /** Mostra uma barra de pesquisa que filtra pelo título e pelo subtítulo dos itens. */
  searchPlaceholder?: string;
  /** Conteúdo extra exibido no topo da lista (ex.: resumo de acessos do dia). */
  stats?: React.ReactNode;
};

function emptyValues(fields: Field[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    values[field.name] =
      field.type === "switch" ? false : field.type === "number" ? 0 : "";
  }
  return values;
}

export function CrudSection({
  title,
  description,
  addLabel,
  fields,
  items,
  isLoading,
  renderTitle,
  renderSubtitle,
  onSave,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [values, setValues] = useState<Record<string, unknown>>(() => emptyValues(fields));
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  function startCreate() {
    setEditingId(undefined);
    setValues(emptyValues(fields));
    setOpen(true);
  }

  function startEdit(item: CrudItem) {
    const next = emptyValues(fields);
    for (const field of fields) {
      const raw = item[field.name];
      next[field.name] =
        field.type === "switch"
          ? Boolean(raw)
          : field.type === "number"
            ? Number(raw ?? 0)
            : ((raw as string | null) ?? "");
    }
    setEditingId(item.id);
    setValues(next);
    setOpen(true);
  }

  function submit() {
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = values[field.name];
      if (field.type === "switch") payload[field.name] = Boolean(raw);
      else if (field.type === "number") payload[field.name] = Number(raw) || 0;
      else {
        const text = String(raw ?? "").trim();
        if (field.required && !text) return;
        payload[field.name] = text === "" ? null : text;
      }
    }
    onSave(payload, editingId);
    setOpen(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="font-serif text-xl text-primary">{title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={startCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              {addLabel}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif">
                {editingId ? "Editar" : addLabel}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <Label htmlFor={`${title}-${field.name}`}>{field.label}</Label>
                  {field.type === "textarea" && (
                    <Textarea
                      id={`${title}-${field.name}`}
                      rows={4}
                      placeholder={field.placeholder}
                      value={String(values[field.name] ?? "")}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                      }
                    />
                  )}
                  {(field.type === "text" || field.type === "number") && (
                    <Input
                      id={`${title}-${field.name}`}
                      type={field.type === "number" ? "number" : "text"}
                      placeholder={field.placeholder}
                      value={String(values[field.name] ?? "")}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                      }
                    />
                  )}
                  {field.type === "switch" && (
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`${title}-${field.name}`}
                        checked={Boolean(values[field.name])}
                        onCheckedChange={(checked) =>
                          setValues((prev) => ({ ...prev, [field.name]: checked }))
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {Boolean(values[field.name]) ? "Sim" : "Não"}
                      </span>
                    </div>
                  )}
                  {field.type === "select" && (
                    <Select
                      value={String(values[field.name] ?? "")}
                      onValueChange={(value) =>
                        setValues((prev) => ({ ...prev, [field.name]: value }))
                      }
                    >
                      <SelectTrigger id={`${title}-${field.name}`}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options ?? []).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {field.type === "file" && (
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept={field.accept ?? "application/pdf,image/*"}
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (!file) return;
                          setUploading(field.name);
                          try {
                            const reference = await uploadMaterialFile(file);
                            setValues((prev) => ({ ...prev, [field.name]: reference }));
                            toast.success("Arquivo enviado");
                          } catch (error) {
                            toast.error(
                              error instanceof Error ? error.message : "Falha ao enviar arquivo",
                            );
                          } finally {
                            setUploading(null);
                          }
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploading === field.name}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploading === field.name ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-1.5 h-4 w-4" />
                          )}
                          Enviar PDF ou imagem
                        </Button>
                        {values[field.name] ? (
                          <span className="max-w-[16rem] truncate text-xs text-muted-foreground">
                            {String(values[field.name]).replace(/^storage:\d+-/, "")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Nenhum arquivo enviado
                          </span>
                        )}
                        {values[field.name] ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setValues((prev) => ({ ...prev, [field.name]: "" }))}
                          >
                            Remover
                          </Button>
                        ) : null}
                      </div>
                      <Input
                        id={`${title}-${field.name}`}
                        placeholder="ou cole um link externo (https://...)"
                        value={
                          String(values[field.name] ?? "").startsWith("storage:")
                            ? ""
                            : String(values[field.name] ?? "")
                        }
                        onChange={(event) =>
                          setValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                        }
                      />
                    </div>
                  )}
                </div>

              ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={submit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">Nada cadastrado ainda.</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {renderTitle(item)}
              </p>
              {renderSubtitle && (
                <p className="truncate text-xs text-muted-foreground">
                  {renderSubtitle(item)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("Remover este item?")) onDelete(item.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
