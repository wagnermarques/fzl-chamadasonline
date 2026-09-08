import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves this app under https://<user>.github.io/<repo>/, so
// the production build needs every asset path prefixed with /<repo>/. Local
// dev keeps the root path. Override with GH_PAGES_BASE if the repo is ever
// renamed or a custom domain is used (base "/" in that case).
const GITHUB_PAGES_BASE = process.env.GH_PAGES_BASE ?? "/fzl-chamadasonline/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? GITHUB_PAGES_BASE : "/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Chamada Online",
        short_name: "Chamada",
        description: "Registro de presença em eventos escolares",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // Only precache the app shell; check-in submissions always go to
        // the network live (a stale rotating code cached offline would be
        // meaningless once replayed).
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3333",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
}));
