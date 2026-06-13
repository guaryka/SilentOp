import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/SilentOp',
  assetPrefix: '/SilentOp/',
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: '/SilentOp',
  },
};

export default nextConfig;
