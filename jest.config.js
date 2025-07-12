module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { configFile: './babel.config.jest.js' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
    '^.+\\.(css|scss|sass)$': 'identity-obj-proxy',
    '^@stackframe/stack$': '<rootDir>/app/__mocks__/stack.js',
    '^@stackframe/stack-shared$': '<rootDir>/app/__mocks__/stack-shared.js',
    '^next/navigation$': '<rootDir>/app/__mocks__/next-navigation.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', 'test-utils.tsx'],
  transformIgnorePatterns: [
    '/node_modules/(?!@stackframe/stack-shared)/',
  ],
}; 