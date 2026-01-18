/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'github.com',
            },
            {
                protocol: 'https',
                hostname: '*.s3.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: '*.s3.*.amazonaws.com',
            },
        ],
        // Image optimization enabled (default behavior)
    },
    // Performance optimizations
    compiler: {
        // Remove console logs in production
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
    },
    // Enable experimental features for better performance
    experimental: {
        optimizePackageImports: [
            '@fluentui/react-icons',
            'lucide-react',
            'antd',
            '@ant-design/icons',
            'date-fns',
        ],
    },
    // Turbopack configuration (Turbopack handles most optimizations automatically)
    turbopack: {
        // Turbopack automatically optimizes bundling and caching
        // File system caching is enabled by default in Next.js 16.1
        // No additional configuration needed - Turbopack is faster out of the box
    },
    // Optimize build output
    // swcMinify is removed as it is default

    // Reduce bundle size
    modularizeImports: {
        'lucide-react': {
            transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
        },
        // @fluentui/react-icons doesn't need transformation - direct imports work fine
    },
};

export default nextConfig;
