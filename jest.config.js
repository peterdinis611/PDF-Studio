/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
  },
  clearMocks: true,
  setupFiles: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "src/shared/**/*.ts",
    "src/client/fonts.ts",
    "src/client/factories.ts",
    "src/client/smartGuides.ts",
    "src/client/pdfImport.ts",
    "src/server/services/fontEmbed.ts",
    "src/server/services/pdfImport.ts",
    "src/server/audit.ts",
    "src/server/auditAccess.ts",
    "!src/**/*.d.ts",
  ],
};

export default config;
