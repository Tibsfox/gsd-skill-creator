/**
 * Validates cartridge integrity — checks concept references,
 * required fields, and structural consistency.
 */

import type { Cartridge, CartridgeValidation } from './types.js';

export function validateCartridge(cartridge: Cartridge): CartridgeValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const conceptIds = new Set(cartridge.deepMap.concepts.map((c) => c.id));

  // Check for duplicate concept IDs
  if (conceptIds.size !== cartridge.deepMap.concepts.length) {
    errors.push('Deep map contains duplicate concept IDs');
  }

  // Check connections reference valid concepts
  for (const conn of cartridge.deepMap.connections) {
    if (!conceptIds.has(conn.from)) {
      errors.push(`Connection references unknown concept: ${conn.from}`);
    }
    if (!conceptIds.has(conn.to)) {
      errors.push(`Connection references unknown concept: ${conn.to}`);
    }
  }

  // Check entry points reference valid concepts
  for (const ep of cartridge.deepMap.entryPoints) {
    if (!conceptIds.has(ep)) {
      errors.push(`Entry point references unknown concept: ${ep}`);
    }
  }

  // Check progression path steps reference valid concepts
  for (const path of cartridge.deepMap.progressionPaths) {
    for (const step of path.steps) {
      if (!conceptIds.has(step)) {
        errors.push(`Progression path "${path.name}" references unknown concept: ${step}`);
      }
    }
  }

  // Check story chapter conceptRefs reference valid concepts
  for (const chapter of cartridge.story.chapters) {
    for (const ref of chapter.conceptRefs) {
      if (!conceptIds.has(ref)) {
        warnings.push(`Story chapter "${chapter.title}" references unknown concept: ${ref}`);
      }
    }
  }

  // Check chipset has vocabulary
  if (cartridge.chipset.vocabulary.length === 0) {
    errors.push('Cartridge chipset has empty vocabulary');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
