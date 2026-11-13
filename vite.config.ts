import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base relativo: funziona sia in locale che su GitHub Pages (sotto /<repo>/)
export default defineConfig({
  plugins: [react()],
  base: "./",
});
