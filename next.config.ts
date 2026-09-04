import type { NextConfig } from "next";

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
            {   // not used, just kept as an example
                source: '/statistics',
                destination: '/activity',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
