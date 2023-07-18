import type { Config } from "jest";
import { baseJestConfig } from "./jest.config.base";

const config: Config = {
  ...baseJestConfig,
  testEnvironment: "jsdom", // browser-like
  moduleNameMapper: {
    "^lodash-es$": "lodash",
    "^@testing-library/react$": "@reactuses/test"
  },
  transformIgnorePatterns: [
    "node_modules/(?!(lodash-es)/)",
  ],

};

export default config;
