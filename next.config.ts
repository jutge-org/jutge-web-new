import type { NextConfig } from "next";

const nextConfig: NextConfig = {

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
