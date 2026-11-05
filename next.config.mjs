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
        destination: 'http://backend:8080/api/:path*',
      },
      {
        // Files are served by the API with nosniff, a CSP sandbox and
        // Content-Disposition: attachment for anything that is not an image/PDF/video.
        source: '/uploads/:path*',
        destination: 'http://backend:8080/uploads/:path*',
      },
    ]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
