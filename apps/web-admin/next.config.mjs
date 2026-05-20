/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@booking/api', '@booking/domain', '@booking/types', '@booking/ui'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
