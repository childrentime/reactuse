import type { Config } from "@jest/types";

export const baseJestConfig: Config.InitialOptions = {
  clearMocks: true,
  coverageDirectory: "coverage",
};
