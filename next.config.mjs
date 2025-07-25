/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.resolve.fallback = {
            fs: false,
            path: false,
            os: false,
            ...config.resolve.fallback
        };
        return config;
    },
};

export default nextConfig;
