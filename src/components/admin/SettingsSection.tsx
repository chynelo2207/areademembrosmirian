import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveSetting, useSettings } from "@/hooks/useAccess";

const FIELDS = [
  { key: "upgrade_url", label: "Link de upgrade para o completo" },
  { key: "upgrade_price_label", label: "Preço do upgrade (ex: R$ 119,98)" },
  { key: "classic_price_label", label: "Preço do plano clássico" },
  { key: "complete_price_label", label: "Preço do plano completo" },
] as const;

export function SettingsSection() {
  const settings = useSettings();
  const saveSetting = useSaveSetting();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings.data) setValues(settings.data);
  }, [settings.data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">Ajustes dos planos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <div className="flex gap-2">
              <Input
                id={field.key}
                value={values[field.key] ?? ""}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.key]: event.target.value }))
                }
              />
              <Button
                variant="outline"
                onClick={() =>
                  saveSetting.mutate({ key: field.key, value: values[field.key] ?? "" })
                }
              >
                Salvar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
