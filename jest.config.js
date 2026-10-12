module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["/node_modules/"],
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
  maxWorkers: 1, // Run tests sequentially to avoid database conflicts
  // Runs before any test suite, even for direct `npx jest` invocations
  // that bypass the `pretest` npm hook.  Fails closed when .env.test is
  // missing, not labelled DB_ENVIRONMENT=test, or targets the same project
  // as the root .env (production guard).
  globalSetup: "./scripts/check-test-env.js",
};
