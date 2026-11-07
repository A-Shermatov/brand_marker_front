/**
 * Starts the site for the E2E run on its own port, talking to the E2E API.
 *
 * By default it makes a production build and serves it, like the server does:
 * no compile-on-first-visit delays, and it runs next to a `next dev` already
 * open on this folder (Next.js allows only one dev server per folder).
 * E2E_FRONT_MODE=dev (or --dev) runs `next dev` instead; E2E_SKIP_BUILD=1 serves the last build.
 *
 * Settings (environment or e2e/.env): see e2e/.env.example.
 */

import { spawn, spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const front = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")
const localEnv = join(front, "e2e", ".env")
if (existsSync(localEnv)) process.loadEnvFile(localEnv)

const API_PORT = process.env.E2E_API_PORT ?? "8100"
const FRONT_PORT = process.env.E2E_FRONT_PORT ?? "4100"
const next = join(front, "node_modules", "next", "dist", "bin", "next")

const env = {
  ...process.env,
  NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}/api/v1`,
  NEXT_PUBLIC_USE_API: "true",
  NEXT_PUBLIC_FILES_BASE_URL: `http://localhost:${API_PORT}`,
  NEXT_TELEMETRY_DISABLED: "1",
}

const dev = process.env.E2E_FRONT_MODE === "dev" || process.argv.includes("--dev")
if (!dev && process.env.E2E_SKIP_BUILD !== "1") {
  console.log(`[e2e front] building the site for the API on :${API_PORT}…`)
  const built = spawnSync(process.execPath, [next, "build", "--webpack"], { cwd: front, env, stdio: "inherit" })
  if (built.status !== 0) {
    console.error("[e2e front] build failed")
    process.exit(1)
  }
}

const site = spawn(process.execPath, [next, dev ? "dev" : "start", "-p", FRONT_PORT], {
  cwd: front,
  env,
  stdio: "inherit",
})
site.on("exit", (code) => process.exit(code ?? 0))
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => site.kill(signal))
