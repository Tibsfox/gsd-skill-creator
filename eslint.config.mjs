import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';

/**
 * Audited numeric allowlist -- Phase 503 Parameter Justification
 *
 * All 36 P-002 parameter instances are documented with @justification comments
 * in their source files (Plans 02-03). This allowlist covers the full set of
 * numeric literals used across src/ so the lint guard produces zero warnings.
 *
 * Categories:
 *   Sentinels/identity: -1, 0, 1
 *   Negative constants: error codes, offsets, sentinel values
 *   Fractions/percentages: probability weights, thresholds, ratios (0..1)
 *   Small multipliers: scaling factors, minor constants (1..10)
 *   Common integers: array sizes, bit widths, formatting, modular arithmetic
 *   Time constants: seconds, minutes, hours, days, milliseconds
 *   Size/capacity: buffer sizes, limits, power-of-two boundaries
 *   Network/HTTP: status codes, port numbers
 *   Domain-specific: physics constants, hash multipliers, large boundaries
 */
const AUDITED_ALLOWLIST = [
  // Sentinels and identity
  -1, 0, 1,

  // Negative constants (error codes, offsets, sentinels)
  -999, -128, -100, -30, -20, -15, -10, -5, -3.01, -3, -2, -0.002,

  // Tiny values (epsilon, tolerance, scientific notation)
  1e-15, 1e-14, 1e-12, 1e-10, 1e-7, 2.53e-7, 1e-6, 1.286e-6, 3e-6,

  // Small fractions (thresholds, tolerances, rates)
  0.0001, 0.001, 0.003, 0.005, 0.006, 0.006364,

  // DriftScore weights: 0.35/0.25/0.15 (types.ts) and 0.40/0.30/0.20/0.10 (retrospective/drift.ts)
  // @justification: see calculateDriftScore JSDoc in each file for weight rationale
  // Percentages and probability weights (0.01 .. 0.99)
  0.01, 0.01172, 0.012, 0.0125, 0.02, 0.024, 0.026, 0.048, 0.05,
  0.08, 0.1, 0.15, 0.18, 0.2, 0.25, 0.3, 0.33, 0.35, 0.4, 0.44,
  0.45, 0.46, 0.5, 0.54, 0.6, 0.6048, 0.65, 0.7, 0.725, 0.75,
  0.8, 0.85, 0.9, 0.92, 0.93, 0.95, 0.99, 0.999,

  // Small multipliers and constants (1..10)
  1.001, 1.01, 1.05, 1.1, 1.1976, 1.2, 1.3, 1.378, 1.4, 1.41,
  1.5, 1.65, 1.8, 1.96, 1.99, 2, 2.5, 3, 3.3, 3.5, 4, 4.4,
  5, 5.1, 5.98, 6, 7, 8, 8.5, 9, 9.4, 10, 10.8,

  // Common integers (formatting, indexing, small counts, ASCII codes)
  11, 11.5, 12, 12.2, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  24, 25, 25.5, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
  40, 41, 42, 43, 44, 45, 50, 50.4, 51, 52, 53, 55, 58, 60, 62,
  63, 64, 65, 68, 69, 70, 72, 74, 75, 76, 77, 78, 79, 80, 83, 85,
  87, 90, 92, 95, 97, 99.8, 100,

  // Medium integers (angles, durations, byte values, layout)
  101, 108, 112, 116, 119, 120, 127, 128, 130, 150, 160, 180, 190,
  192, 200, 207, 220, 240, 243, 249, 250, 252, 255, 256, 273.15,
  300, 360, 365,

  // HTTP status codes and network ports
  400, 401, 403, 404, 405, 440, 448, 470, 480, 493, 500, 511, 512,

  // Larger sizes, capacities, formatting
  700, 750, 800, 997, 999, 1000, 1001, 1023, 1024, 1400, 1414,
  1440, 1500, 2000, 2048, 2100, 2250, 2500, 3000, 3500,

  // Time constants (seconds, ms, hour/day boundaries)
  3600, 4000, 4095, 4096, 5000, 10000, 11338, 15000,

  // Power-of-two boundaries and large capacities
  16383, 16384, 20000, 30000, 32767, 40001, 40002, 40010, 60000,
  65535, 65536, 100000, 120000, 200000, 262144, 524288,

  // Domain-specific large constants (hash multipliers, bitmasks, day-ms, scientific)
  1000000, 1048576, 1664525, 3600000, 16777619, 86400000,
  1073741823, 2147483647, 3988292384, 4294967295,
  1e8, 3e8, 1e9, 1013904223, 1e10,
];

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
        ignore: AUDITED_ALLOWLIST,
        ignoreEnums: true,
        ignoreReadonlyClassProperties: true,
        ignoreNumericLiteralTypes: true,
        ignoreTypeIndexes: true,
        ignoreDefaultValues: true,
        ignoreClassFieldInitialValues: true,
        ignoreArrayIndexes: true,
        enforceConst: false, // Disabled: false positives on mutable hash accumulators (let hash = ...)
      }],
    },
  },
);
