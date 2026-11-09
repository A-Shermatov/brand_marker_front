/**
 * Starts the API for the E2E run: on its own port, against its own database
 * (the working database name + "_e2e"), recreated and seeded on every start.
 *
 * Mock payments, no e-mail, rate limits lifted, CORS for the E2E front only:
 * the run never touches the working database, the payment gateway or SMTP.
 *
 * Settings (environment or e2e/.env): see e2e/.env.example.
 */

import { spawn, spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const front = resolve(here, "..", "..")
const localEnv = join(front, "e2e", ".env")
if (existsSync(localEnv)) process.loadEnvFile(localEnv)

const API_PORT = process.env.E2E_API_PORT ?? "8100"
const FRONT_PORT = process.env.E2E_FRONT_PORT ?? "4100"

function fail(message) {
  console.error(`[e2e backend] ${message}`)
  process.exit(1)
}

const backendDir = [
  process.env.E2E_BACKEND_DIR,
  join(front, "..", "b2b_backend"),
  join(front, "..", "backend"),
]
  .filter(Boolean)
  .map((dir) => resolve(front, dir))
  .find((dir) => existsSync(join(dir, "app", "main.py")))
if (!backendDir) fail("backend folder not found: set E2E_BACKEND_DIR")

const python =
  process.env.E2E_PYTHON ??
  [".venv", "venv"]
    .flatMap((venv) => [join(backendDir, venv, "Scripts", "python.exe"), join(backendDir, venv, "bin", "python")])
    .find(existsSync) ??
  "python"

/** DATABASE_URL from the backend .env, with the database renamed to <name>_e2e. */
function e2eDatabaseUrl() {
  if (process.env.E2E_DATABASE_URL) return process.env.E2E_DATABASE_URL
  const envFile = join(backendDir, ".env")
  const line = existsSync(envFile)
    ? readFileSync(envFile, "utf8")
        .split(/\r?\n/)
        .find((l) => l.startsWith("DATABASE_URL="))
    : undefined
  const base = process.env.DATABASE_URL ?? line?.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "")
  if (!base) fail("no DATABASE_URL: set E2E_DATABASE_URL or DATABASE_URL in the backend .env")
  const url = new URL(base)
  const name = url.pathname.replace(/^\//, "")
  url.pathname = `/${name.endsWith("_e2e") ? name : `${name}_e2e`}`
  return url.toString()
}

const databaseUrl = e2eDatabaseUrl()
const frontOrigins = [`http://localhost:${FRONT_PORT}`, `http://127.0.0.1:${FRONT_PORT}`]
const lifted = "100000"

const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  APP_ENV: "development",
  PAYMENT_PROVIDER: "mock",
  ALLOW_MOCK_PAYMENTS: "true",
  ALIF_TERMINAL_KEY: "",
  ALIF_TERMINAL_PASSWORD: "",
  SMTP_HOST: "",
  SMTP_FROM_EMAIL: "",
  CORS_ORIGINS: frontOrigins.join(","),
  FRONTEND_URL: frontOrigins[0],
  PUBLIC_API_URL: `http://127.0.0.1:${API_PORT}`,
  // Uploaded files (photos) are served by this API, not by the dev one on 8000.
  FILES_BASE_URL: `http://localhost:${API_PORT}/uploads`,
  RATE_LIMIT_LOGIN_PER_MINUTE: lifted,
  RATE_LIMIT_LOGIN_PER_ACCOUNT: lifted,
  RATE_LIMIT_REGISTER_PER_MINUTE: lifted,
  RATE_LIMIT_REFRESH_PER_MINUTE: lifted,
  RATE_LIMIT_GLOBAL_PER_MINUTE: lifted,
  RATE_LIMIT_2FA_VERIFY_PER_MINUTE: lifted,
  RATE_LIMIT_2FA_SETUP_PER_MINUTE: lifted,
  RATE_LIMIT_PASSWORD_FORGOT_PER_MINUTE: lifted,
  RATE_LIMIT_PASSWORD_RESET_PER_MINUTE: lifted,
  PYTHONUNBUFFERED: "1",
  PYTHONIOENCODING: "utf-8",
}

if (process.env.E2E_KEEP_DB !== "1") {
  const prepared = spawnSync(python, [join(here, "prepare_db.py")], { cwd: backendDir, env, stdio: "inherit" })
  if (prepared.error) fail(`cannot run ${python}: ${prepared.error.message} (set E2E_PYTHON)`)
  if (prepared.status !== 0) fail("could not prepare the E2E database")
}

const api = spawn(python, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", API_PORT], {
  cwd: backendDir,
  env,
  stdio: "inherit",
})
api.on("exit", (code) => process.exit(code ?? 0))
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => api.kill(signal))
