/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'github.com',
            },
        ],
        unoptimized: true,
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
    // Optimize webpack configuration
    webpack: (config, { dev, isServer }) => {
        // Optimize for faster compilation in development
        if (dev && !isServer) {
            config.watchOptions = {
                poll: 800,
                aggregateTimeout: 300,
                ignored: ['**/node_modules', '**/.git', '**/.next'],
            };
            
            // Cache optimization for faster rebuilds
            config.cache = {
                type: 'filesystem',
            };
        }
        
        // Optimize chunk splitting for production
        if (!isServer && !dev) {
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        // Vendor chunk for large libraries
                        antd: {
                            name: 'antd',
                            test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
                            priority: 30,
                            reuseExistingChunk: true,
                        },
                        fluentui: {
                            name: 'fluentui',
                            test: /[\\/]node_modules[\\/]@fluentui[\\/]/,
                            priority: 25,
                            reuseExistingChunk: true,
                        },
                        reactVendor: {
                            name: 'react-vendor',
                            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                            priority: 20,
                            reuseExistingChunk: true,
                        },
                        charts: {
                            name: 'charts',
                            test: /[\\/]node_modules[\\/](recharts|@fullcalendar)[\\/]/,
                            priority: 15,
                            reuseExistingChunk: true,
                        },
                        query: {
                            name: 'query',
                            test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
                            priority: 14,
                            reuseExistingChunk: true,
                        },
                        common: {
                            name: 'common',
                            minChunks: 2,
                            priority: 10,
                            reuseExistingChunk: true,
                        },
                    },
                },
            };
        }
        
        return config;
    },
    // Optimize build output
    swcMinify: true,
    // Reduce bundle size
    modularizeImports: {
        'lucide-react': {
            transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
        },
        '@fluentui/react-icons': {
            transform: '@fluentui/react-icons/lib/esm/components/{{member}}',
        },
    },
};

export default nextConfig;
