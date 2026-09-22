import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  retries: 0,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3011",
    channel: process.platform === "win32" ? "msedge" : undefined,
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/browser-server.mjs",
    url: "http://127.0.0.1:3011/api/health",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
