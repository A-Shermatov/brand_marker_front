/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8080/api/:path*',
      },
      {
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