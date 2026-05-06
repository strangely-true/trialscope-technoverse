/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    const apiTarget =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000"

    return [
      {
        source: "/api/:path*",
        destination: `${apiTarget}/:path*`,
      },
    ]
  },
}

export default nextConfig
