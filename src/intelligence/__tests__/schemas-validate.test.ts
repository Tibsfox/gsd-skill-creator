import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Ajv2020, type AnySchema } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const here = dirname(fileURLToPath(import.meta.url));
const schemasDir = resolve(here, '..', 'schemas');
const examplesDir = resolve(schemasDir, '__examples__');

function loadJson(p: string): unknown {
  return JSON.parse(readFileSync(p, 'utf-8'));
}

// ajv-formats default export is CJS-style; ESM interop yields the namespace.
const addFormatsFn = (
  addFormats as unknown as { default?: typeof addFormats }
).default ?? addFormats;

function makeAjv(): Ajv2020 {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (addFormatsFn as any)(ajv);
  return ajv;
}

const SCHEMAS = [
  'vision-seed-meta',
  'bundle-manifest',
  'console-request',
] as const;

describe('intelligence/schemas — Draft 2020-12 round-trip with examples', () => {
  for (const name of SCHEMAS) {
    describe(name, () => {
      const schema = loadJson(resolve(schemasDir, `${name}.schema.json`)) as AnySchema;
      const positive = loadJson(resolve(examplesDir, `${name}.positive.json`));
      const negative = loadJson(resolve(examplesDir, `${name}.negative.json`));
      const ajv = makeAjv();
      const validate = ajv.compile(schema);

      it('accepts the positive example', () => {
        const ok = validate(positive);
        if (!ok) {
          throw new Error(JSON.stringify(validate.errors, null, 2));
        }
        expect(ok).toBe(true);
      });

      it('rejects the negative example', () => {
        const ok = validate(negative);
        expect(ok).toBe(false);
        expect((validate.errors ?? []).length).toBeGreaterThan(0);
      });
    });
  }
});
