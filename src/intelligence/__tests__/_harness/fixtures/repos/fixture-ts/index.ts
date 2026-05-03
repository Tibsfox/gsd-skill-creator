/**
 * Fixture TypeScript file for integration tests.
 * Provides a small but realistic code surface for analyzer tests.
 */

export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

// Dead code: exported but unused in this fixture
export function unusedExport(): string {
  return 'unused';
}

export const CONSTANT = 42;
