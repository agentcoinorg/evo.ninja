module.exports = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  rewrites: async () => {
    return [
      {
        source: '/agents-api/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8000/agents-api/:path*'
            : '/app/agents-api/',
      },
    ]
  },
};
