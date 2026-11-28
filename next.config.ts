import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // Only use standalone when building for Docker
    output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,

    // Server-only JUTGE_DEV_HOST is mirrored for client bundles (site mode on localhost).
    env: {
        NEXT_PUBLIC_JUTGE_DEV_HOST: process.env.JUTGE_DEV_HOST ?? process.env.NEXT_PUBLIC_JUTGE_DEV_HOST ?? '',
    },

    allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',') || [],

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'jutge.org',
                port: '',
                pathname: '/**',
                search: '',
            },
        ],
    },
}

export default nextConfig
