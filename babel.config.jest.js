// This file only applies to Jest tests.
// Next.js does not need a babel config (and in fact breaks when one is provided; see https://nextjs.org/docs/messages/babel-font-loader-conflict).
// However, Jest needs it to transpile React.
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};
