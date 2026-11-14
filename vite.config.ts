import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  // Keep the generated web bundle usable under GitHub Pages subpaths and
  // when it is loaded from Android's appassets origin.
  base: "./",
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: true,
    watch: {
      ignored: [
        "**/public/storybook/**",
        "**/public/coverage/**",
        "**/android-shell/**",
        "**/quarentined/**",
        "**/docs/**",
        "**/scripts/**",
        "**/e2e/**",
        "**/test/**",
        "**/dist/**",
        "**/.git/**",
      ],
    },
  },
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
      target: "react",
      autoCodeSplitting: false,
    }),
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    entries: ["index.html"],
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-router",
      "@tanstack/react-query",
      "lucide-react",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
});
