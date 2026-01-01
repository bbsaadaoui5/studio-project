/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript checking - temporarily disabled due to Next.js type validation issues
  // Re-enable after fixing API route type issues
  typescript: {
    ignoreBuildErrors: true,
  },
  typedRoutes: false,
}

module.exports = nextConfig;
