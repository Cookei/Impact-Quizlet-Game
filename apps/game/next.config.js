module.exports = {
  reactStrictMode: true,
  transpilePackages: ['dataset'],
  basePath: '/game',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.staticflickr.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.quizlet.com',
        port: '',
      },
    ],
  },
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true,
  },
};
