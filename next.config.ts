import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // Only use standalone when building for Docker
    output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,

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
                // not used, just kept as an example
                source: '/statistics',
                destination: '/activity',
                permanent: true,
            },
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
        ]
    },
}

export default nextConfig
