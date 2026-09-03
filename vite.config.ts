// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        // Registration happens only through src/lib/pwa.ts (guarded wrapper).
        injectRegister: null,
        // Never emit or register a service worker in dev / Lovable preview.
        devOptions: { enabled: false },
        filename: "sw.js",
        // O build do TanStack Start emite os arquivos do cliente em dist/client.
        outDir: "dist/client",
        manifest: {
          name: "Área de Membros — Método Mirian Serrano",
          short_name: "Método Mirian",
          description:
            "Aulas, moldes e materiais do Curso Corset ou Corselet Noiva e Moda Festa.",
          lang: "pt-BR",
          dir: "ltr",
          start_url: "/inicio",
          scope: "/",
          display: "standalone",
          orientation: "portrait-primary",
          background_color: "#fdfbf8",
          theme_color: "#521e15",
          categories: ["education"],
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "/icons/maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          // Only hashed static build output is precached — never user data or HTML.
          globPatterns: ["**/*.{js,css,woff,woff2}"],
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              // HTML navigations: always try the network first so new releases land.
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: {
                cacheName: "html-navigations",
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
            {
              // Same-origin hashed assets and images.
              urlPattern: ({ url, request, sameOrigin }) =>
                sameOrigin &&
                (request.destination === "image" ||
                  request.destination === "font" ||
                  url.pathname.startsWith("/_build/") ||
                  url.pathname.startsWith("/assets/")),
              handler: "CacheFirst",
              options: {
                cacheName: "static-assets",
                expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              // Google Fonts stylesheets/files.
              urlPattern: ({ url }) =>
                url.origin === "https://fonts.googleapis.com" ||
                url.origin === "https://fonts.gstatic.com",
              handler: "StaleWhileRevalidate",
              options: { cacheName: "google-fonts" },
            },
          ],
        },
      }),
    ],
  },
});
