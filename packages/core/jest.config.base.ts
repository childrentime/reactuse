import type { Config } from 'jest'

export const baseJestConfig: Config = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
}
