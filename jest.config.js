module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  verbose: true,
  collectCoverage: false,
  collectCoverageFrom: [
    'app.js',
    'index.js',
    'js/**/*.js',
    '!js/libs/**',
    '!js/runtime/logger.js'
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 45,
      lines: 45,
      statements: 45,
    },
  },
  coverageReporters: ['text', 'lcov'],
  testTimeout: 10000,
};
