import { existsSync } from "node:fs"
import { defineConfig, devices } from "@playwright/test"

/**
 * End-to-end tests: a real browser against a real API and database.
 *
 *   npm run e2e          start the E2E stack (if needed) and run every test
 *   npm run e2e:ui       the same in the Playwright UI, step by step
 *   npm run e2e:report   open the last HTML report
 *
 * The stack is separate from the working one: API on :8100 with a fresh
 * <db>_e2e database seeded with the demo accounts, site on :4100 built for it.
 * See e2e/README.md.
 */

if (existsSync("e2e/.env")) process.loadEnvFile("e2e/.env")

const FRONT_PORT = process.env.E2E_FRONT_PORT ?? "4100"
const API_PORT = process.env.E2E_API_PORT ?? "8100"
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${FRONT_PORT}`
const ci = Boolean(process.env.CI)

// Windows has Edge: no browser download. Elsewhere: `npx playwright install chromium`.
const channel = process.env.E2E_BROWSER_CHANNEL || (process.platform === "win32" ? "msedge" : undefined)

export default defineConfig({
  testDir: "e2e",
  // Tests share the demo accounts, so files run one after another.
  workers: 1,
  fullyParallel: false,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  outputDir: "test-results/e2e",
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    locale: "ru-RU",
    timezoneId: "Asia/Dushanbe",
    // The trace has a snapshot of every step; video would need an ffmpeg download.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts$/, use: { ...devices["Desktop Chrome"], channel } },
    {
      name: "desktop",
      testMatch: /\.e2e\.ts$/,
      testIgnore: /mobile\.e2e\.ts$/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], channel },
    },
    {
      name: "mobile",
      testMatch: /mobile\.e2e\.ts$/,
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"], channel },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: "node e2e/stack/backend.mjs",
          url: `http://127.0.0.1:${API_PORT}/health`,
          timeout: 180_000,
          reuseExistingServer: !ci,
          stdout: "pipe",
        },
        {
          command: "node e2e/stack/front.mjs",
          url: baseURL,
          timeout: 600_000,
          reuseExistingServer: !ci,
          stdout: "pipe",
        },
      ],
})
