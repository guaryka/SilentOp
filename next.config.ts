import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Uncomment and change to your repository name if deploying to a subfolder (e.g., username.github.io/silentop-dashboard)
  // basePath: '/silentop-dashboard',
};

export default nextConfig;
