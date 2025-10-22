module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: [
    'alarm-utils.js',
    '!jest.config.js',
    '!coverage/**',
    '!__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  verbose: true,
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Unit Test Results',
      outputPath: 'test-results/jest-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true,
    }]
  ]
};
