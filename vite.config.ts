import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const cspPlugin = (apiBaseUrl: string): Plugin => {
  return {
    name: "html-csp-injector",
    apply: "build",
    transformIndexHtml(html: string) {
      let apiOrigin = "";
      try {
        if (apiBaseUrl) {
          const url = new URL(apiBaseUrl);
          apiOrigin = url.origin;
        }
      } catch {
        apiOrigin = "";
      }

      const connectSources = ["'self'", apiOrigin, "http://localhost:3000", "https://*.onrender.com"]
        .filter(Boolean)
        .join(" ");

      const csp = [
        "default-src 'self'",
        `connect-src ${connectSources}`,
        "img-src 'self' data: https: blob:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "script-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
      ].join("; ");

      return html.replace(
        "<head>",
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`
      );
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL || "http://localhost:3000/api/v1/store";

  return {
    plugins: [react(), cspPlugin(apiBaseUrl)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: [
              "react",
              "react-dom",
              "react-router-dom",
              "@tanstack/react-query",
              "@tanstack/react-table",
              "zustand",
              "axios",
              "dayjs",
            ],
            charts: ["recharts"],
            forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          },
        },
      },
    },
    server: {
      port: 5173,
    },
  };
});
