import { useQuery } from "@tanstack/react-query";

import { resolveMaterialUrl } from "@/lib/members";

/**
 * Resolve as capas dos módulos: links externos passam direto,
 * arquivos enviados no painel viram link temporário assinado.
 */
export function useCoverUrls(covers: (string | null)[]) {
  const storagePaths = Array.from(
    new Set(covers.filter((value): value is string => !!value && value.startsWith("storage:"))),
  ).sort();

  const query = useQuery({
    queryKey: ["cover-urls", storagePaths],
    enabled: storagePaths.length > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const entries = await Promise.all(
        storagePaths.map(async (value) => {
          try {
            return [value, await resolveMaterialUrl(value)] as const;
          } catch {
            return [value, ""] as const;
          }
        }),
      );
      return Object.fromEntries(entries) as Record<string, string>;
    },
  });

  return (cover: string | null): string | null => {
    if (!cover) return null;
    if (!cover.startsWith("storage:")) return cover;
    return query.data?.[cover] || null;
  };
}
