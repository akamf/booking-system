/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@booking/api', '@booking/domain', '@booking/types', '@booking/ui'],
  // typedRoutes disabled — we use dynamic `next=…` redirect strings throughout
  // and the typed-routes generic can't represent them without a `Route` cast
  // at every call site. Re-enable once the route surface stabilizes.
};

export default nextConfig;
