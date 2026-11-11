import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { serviceWorker } from "./src/pwa/serviceWorkerPlugin";

export default defineConfig({
  plugins: [react(), serviceWorker()],
  build: { outDir: "build" },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
  },
});
