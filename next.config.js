const path = require('path');
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      // Detect and parse YAML frontmatter so it isn't rendered
      [
        'remark-frontmatter',
        [
          'yaml', // support YAML between --- delimiters
        ],
      ],
      [
        'remark-mdx-frontmatter',
        { name: 'metadata' }, // export metadata so it can still be imported
      ],
    ],
    rehypePlugins: [],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8000/api/:path*'
            : '/api/',
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

module.exports = withMDX(nextConfig);
