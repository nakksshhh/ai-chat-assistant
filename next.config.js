/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true 
  },
  // Disable React Strict Mode to prevent double execution in development
  reactStrictMode: false,
  // Netlify configuration
  trailingSlash: true,
  // Ensure compatibility with Netlify
  experimental: {
    esmExternals: false,
  },
};

module.exports = nextConfig;
