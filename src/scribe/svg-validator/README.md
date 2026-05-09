# SCRIBE Shared SVG Validator — Component 03

**Module:** `src/scribe/svg-validator/`
**Mission:** SCRIBE Build-Out, v1.49.621
**Wave:** 1 (parallel with Components 01, 02, 04)

## Purpose

Shared SVGO config builder and a11y / round-trip validator, consumed by:
- **T2 cartridge** (`examples/cartridges/svg-substrate/`) — BLOCKER-tier a11y checks
- **T3 cartridge** (`examples/cartridges/code-svg-hdl-bridge/`) — round-trip extension
- **Component 06** (Wave 2 — Yosys netlist renderer) — output SVG validation

## Module Map

| File | Purpose |
|---|---|
| `index.ts` | Public API barrel: `validateSvg()`, re-exports all sub-modules |
| `a11y-check.ts` | 5-item BLOCKER-tier a11y checker; regex-based, zero deps |
| `svgo-config.ts` | SVGO config builder: `createSvgoConfig({ preserveRoundTrip? })` |
| `round-trip-extension.ts` | DOM-based T3 round-trip validator + `validateRoundTripPayload()` |
| `checklist-spec.ts` | 15-item checklist as typed const (BLOCKER / recommended / scribe-class) |
| `__tests__/` | Unit tests (58 tests, 88.37% branch coverage on a11y-check.ts) |

## Cartridge Consumer Strategy: Sync'd-Copy

The spec offered two paths:
1. Re-export (clean, but breaks cartridge-out-of-repo standalone use)
2. Sync'd-copy (slightly more files, but standalone works)

**Decision: re-export approach for T3 `validate.ts`; static-export copy approach
for the SVGO `.js` configs.**

Rationale:
- TypeScript re-exports (`validate.ts`) work within the repo and keep code DRY.
- SVGO `.config.js` files are static CJS configs consumed by the `svgo` CLI — they
  cannot import TypeScript at runtime. These are kept as static copies that mirror
  the output of `createSvgoConfig()`, with comments cross-referencing the canonical
  TypeScript source.
- `a11y-check.ts` is a re-export wrapper that preserves the CLI interface expected
  by `validate.sh` (`npx tsx validators/a11y-check.ts <file.svg>`).

For cartridge-out-of-repo standalone use, copy `src/scribe/svg-validator/` alongside
the cartridge and update the import paths.

## Substrate Invariants (FROZEN)

The following SVGO options are ALWAYS set to `false` by `createSvgoConfig()`:
- `removeTitle: false`
- `removeDesc: false`
- `removeMetadata: false`

These are substrate-pinned. Component 09 (`svgo-config-preserves-metadata.test.ts`)
asserts these defaults cannot be silently changed. Do NOT add new opt-outs without
a substrate decision review.

## Usage

### a11y check (T2 baseline)

```typescript
import { checkSvgString } from 'src/scribe/svg-validator/index.js';

const result = checkSvgString(svgString);
if (!result.ok) {
  for (const msg of result.messages) console.error(msg);
}
```

### Unified entry point

```typescript
import { validateSvg } from 'src/scribe/svg-validator/index.js';

// T2-style (a11y only):
const result = await validateSvg(svgString);

// T3-style (a11y + round-trip, inject DOMParser in Node):
const result = await validateSvg(svgString, {
  roundTrip: true,
  domParserCtor: MyDOMParserImpl,
});
```

### SVGO config (Component 06 / T3)

```typescript
import { createSvgoConfig } from 'src/scribe/svg-validator/index.js';
import { optimize } from 'svgo';

const config = createSvgoConfig({ preserveRoundTrip: true });
const { data } = optimize(svgString, config);
```

## Component 06 Handoff Note

Component 06 (Yosys netlist renderer, Wave 2) should import from this module:

```typescript
import { validateSvg, createSvgoConfig } from '../svg-validator/index.js';
```

The round-trip SVGO config (`createSvgoConfig({ preserveRoundTrip: true })`) is
the correct config for post-processing Yosys/netlistsvg output, preserving SCRIBE
namespace declarations and `data-node-id` attributes.
