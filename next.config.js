/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // 🔹 Sin claves 'turbo' ni 'turbopack' para evitar warnings
}

module.exports = nextConfig