const path = require('node:path');

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  // Point to the original test files
  roots: [path.resolve(__dirname, '../src/tests')],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  transform: {
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                node: 'current',
              },
            },
          ],
        ],
      },
    ],
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
