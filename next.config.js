/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove deprecated appDir option
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  // Add proper configuration for modern Next.js
  images: {
    domains: ['localhost'],
  },
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features here if needed
  },
}

module.exports = nextConfig 