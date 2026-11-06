import { defineConfig, devices } from "@playwright/test";
const base = process.env.TEST_BASE || "/";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.DEPLOYED_URL || `http://127.0.0.1:4173${base}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: process.env.DEPLOYED_URL
    ? undefined
    : {
        command: `node scripts/serve-static.mjs --root ${process.env.STATIC_ROOT || "dist"} --mount ${base}`,
        url: `http://127.0.0.1:4173${base}`,
        reuseExistingServer: !process.env.CI,
      },
});
