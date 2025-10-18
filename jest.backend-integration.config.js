export default {
  // display name
  displayName: "backend-integration",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.integration.test.js", 
    "<rootDir>/helpers/*.integration.test.js", 
    "<rootDir>/middlewares/*.integration.test.js",
    "<rootDir>/models/*.integration.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**",
    "helpers/**",
    "middlewares/**",
    "models/**",
  ],
  coveragePathIgnorePatterns: ["/node_modules/", "\.test\.js"],
  coverageDirectory: "coverage/backend-integration",
  passWithNoTests: true,
};
