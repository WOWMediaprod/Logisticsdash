/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client'],
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
    ],
  },
};

module.exports = nextConfig;