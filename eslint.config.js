import ririd from '@ririd/eslint-config'
import reactHooksPlugin from 'eslint-plugin-react-hooks'

export default ririd(
  {
    react: true,
    typescript: true,
    formatters: true,
    ignores: [
      'scripts/templates/**',
      'packages/website-docusaurus/**',
      '**/*.test.ts',
      '**/*.md',
      '**/*.spec.ts',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-types': 'off',
      'semi': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': 'off',
      'curly': 'off',
      'import/export': 'warn',
      'unused-imports/no-unused-vars': 'off',
      'react/no-unknown-property': 'off',
      'ts/no-unused-expressions': 'off',
      'react/prefer-destructuring-assignment': 'off',
    },
  },
)
