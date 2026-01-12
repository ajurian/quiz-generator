import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart({
      srcDirectory: "src/presentation",
    }),
    nitro({ preset: "vercel" }),
    react(),
    tailwindcss(),
  ],
  define: {
    "import.meta.env.VITE_VERCEL_URL": JSON.stringify(process.env.VERCEL_URL),
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
  },
});
