import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxying /api to the backend in dev so the frontend can just call
// fetch("/api/...") without worrying about ports or CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});