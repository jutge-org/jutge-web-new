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

    async redirects() {
        return [
            {
                source: '/reset-password/:token',
                destination: '/password-reset',
                permanent: false,
            },
            {
                source: '/utilities/draw',
                destination: '/utilities/whiteboard',
                permanent: true,
            },
            {
                source: '/utilities/pyodide',
                destination: '/interpreters/pyodide',
                permanent: true,
            },
            {
                source: '/utilities/pyweb',
                destination: '/interpreters/pyweb',
                permanent: true,
            },
            {
                source: '/utilities/jscpp',
                destination: '/interpreters/jscpp',
                permanent: true,
            },
            {
                source: '/wrapped',
                destination: '/activity/wrapped',
                permanent: true,
            },
            {
                source: '/students',
                destination: '/participants',
                permanent: true,
            },
        ]
    },
}

export default nextConfig
