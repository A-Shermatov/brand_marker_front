import { existsSync } from "node:fs"

// Refuse to start on a tampered tree, however Next was started. The npm "pre"
// hooks cover only `npm run dev|build`; `npx next dev`, an IDE task and the E2E
// stack start Next directly, and this file is the first thing Next loads —
// before postcss.config.mjs, where the loader used to hide. Once per process
// tree: the workers Next spawns inherit the flag. The check ships with the
// source only, so a built image (where it is absent) skips it.
if (!process.env.BM_TREE_CHECKED) {
  const check = new URL("./scripts/security-check.mjs", import.meta.url)
  if (existsSync(check)) {
    const { assertCleanTree } = await import(check.href)
    assertCleanTree()
  }
  process.env.BM_TREE_CHECKED = "1"
}

/** @type {import('next').NextConfig} */

// Baseline protection for every page: no framing (clickjacking of "pay" / "release"
// buttons), no MIME sniffing, no full URLs (with tokens/ids) leaking in Referer.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

// Where the Next server proxies /api and /uploads. Read at build time (rewrites are
// baked into the build). The API container listens on 8000 in backend/Dockerfile
// and docker-compose; set BACKEND_INTERNAL_URL to match your deployment.
const BACKEND_INTERNAL_URL = (process.env.BACKEND_INTERNAL_URL || "http://backend:8080").replace(/\/+$/, "")

const nextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_INTERNAL_URL}/api/:path*`,
      },
      {
        // Files are served by the API with nosniff, a CSP sandbox and
        // Content-Disposition: attachment for anything that is not an image/PDF/video.
        source: '/uploads/:path*',
        destination: `${BACKEND_INTERNAL_URL}/uploads/:path*`,
      },
    ]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
