/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // ✅ Cambiado a false para evitar conflictos con Supabase
  typescript: {
    ignoreBuildErrors: true,
  },
  // 🔹 Sin claves 'turbo' ni 'turbopack' para evitar warnings
}

module.exports = nextConfig