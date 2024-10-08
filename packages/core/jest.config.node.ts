import type { Config } from 'jest'
import { baseJestConfig } from './jest.config.base'

const config: Config = {
  ...baseJestConfig,
  testEnvironment: 'node', // browser-like
}

export default config
