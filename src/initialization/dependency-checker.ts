/**
 * Dependency validation at startup.
 * Ensures critical dependencies are available before CLI operations.
 */

/**
 * Check if @huggingface/transformers module is available.
 * This is optional - embeddings can fall back to heuristics.
 */
export function checkTransformersAvailable(): boolean {
  try {
    require.resolve('@huggingface/transformers');
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate all required dependencies at startup.
 * Returns true if all critical deps are available.
 */
export function validateDependencies(): { available: boolean; missing: string[] } {
  const missing: string[] = [];

  // Check optional but important dependencies
  if (!checkTransformersAvailable()) {
    missing.push('@huggingface/transformers (embeddings will use heuristic fallback)');
  }

  return {
    available: missing.length === 0,
    missing,
  };
}

/**
 * Log dependency check results for debugging.
 */
export function logDependencyInfo(): void {
  const result = validateDependencies();
  
  if (result.missing.length > 0) {
    console.warn('Warning: Some optional dependencies are missing:');
    result.missing.forEach(dep => console.warn(`  - ${dep}`));
    console.warn('Note: The tool will continue with reduced functionality.');
  }
}
