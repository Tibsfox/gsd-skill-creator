import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'desktop/**',
      'node_modules/**',
      'src-tauri/**',
      '**/*.test.ts',
      '**/*.spec.ts',
    ],
  },
  // Recommended configs
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // Project-specific rules
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-magic-numbers': 'off', // Disable base rule -- TS rule supersedes
      '@typescript-eslint/no-magic-numbers': ['warn', {
        ignore: [-1, 0, 1],
        ignoreEnums: true,
        ignoreReadonlyClassProperties: true,
        ignoreNumericLiteralTypes: true,
        ignoreTypeIndexes: true,
        ignoreDefaultValues: true,
        ignoreClassFieldInitialValues: true,
        enforceConst: true,
      }],
    },
  },
);
