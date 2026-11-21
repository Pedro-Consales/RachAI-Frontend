import { defineConfig, devices } from "@playwright/test";

/**
 * Testes de ponta a ponta contra o backend real.
 * `npm run test:e2e` sobe o Flask (banco novo, ver e2e/backend.mjs) e o Next
 * sozinho. Se os dois já estiverem rodando, reaproveita.
 */
const PORTA = 3100;

export default defineConfig({
  testDir: "e2e",
  // Cada arquivo cria seus próprios Grupos pela API, mas os passos de um arquivo dependem uns dos outros.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] }, grep: /@celular/ },
  ],
  webServer: [
    {
      command: "node e2e/backend.mjs",
      url: "http://127.0.0.1:5000/api/health",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: `npx next dev -p ${PORTA}`,
      url: `http://localhost:${PORTA}/api/health`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
