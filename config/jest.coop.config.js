// The legacy Jest configuration references a missing setupTests.ts. Keep
// these physics/network tests independent of the old UI test setup.
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/multiplayer/__tests__/**/*.test.js'],
  transform: { '^.+\\.js$': '<rootDir>/config/jest/babelTransform.js' },
};
