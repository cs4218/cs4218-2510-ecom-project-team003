export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.test.js", 
    "<rootDir>/helpers/*.test.js", 
    "<rootDir>/middlewares/*.test.js",
    "<rootDir>/models/*.test.js",
  ],

  testPathIgnorePatterns: [
    "/node_modules/",
    "\.integration\.test\.js",
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
  coverageDirectory: "coverage/backend",
  passWithNoTests: true,
};
