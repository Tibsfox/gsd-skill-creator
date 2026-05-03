/**
 * meta.json schema validation.
 *
 * Validates a `VisionSeedMeta` object against
 * `src/intelligence/schemas/vision-seed-meta.schema.json` (Phase 821 / C00)
 * via ajv before staging. D-25-14: invalid meta → abort BEFORE any write.
 *
 * Phase 825 / C10 (T4).
 */

import { Ajv2020, type ErrorObject } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { VisionSeedMeta } from '../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(here, '..', 'schemas', 'vision-seed-meta.schema.json');

// ajv-formats default export is CJS-style; ESM interop yields the namespace.
const addFormatsFn = (
  addFormats as unknown as { default?: typeof addFormats }
).default ?? addFormats;

let cachedValidator: ((data: unknown) => boolean) & {
  errors?: ErrorObject[] | null;
};

function getValidator() {
  if (cachedValidator) return cachedValidator;
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (addFormatsFn as any)(ajv);
  const schemaText = readFileSync(SCHEMA_PATH, 'utf8');
  const schema = JSON.parse(schemaText);
  cachedValidator = ajv.compile(schema);
  return cachedValidator;
}

export class MetaValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: ErrorObject[],
  ) {
    super(message);
    this.name = 'MetaValidationError';
  }
}

/** Validate a VisionSeedMeta object; throw with descriptive errors if invalid. */
export function validateMeta(meta: unknown): asserts meta is VisionSeedMeta {
  const validate = getValidator();
  if (!validate(meta)) {
    const errs = validate.errors ?? [];
    const msg = errs
      .map((e) => `${e.instancePath || '/'}: ${e.message}`)
      .join('; ');
    throw new MetaValidationError(
      `vision seed meta failed schema validation: ${msg}`,
      errs,
    );
  }
}
