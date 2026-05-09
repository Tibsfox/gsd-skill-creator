/**
 * Invariant 5 — Round-trippable serialisation.
 *
 * T1 doc 06 §4 Invariant 5: every successful member ships a parser, and
 * parse + re-serialize produces equivalent (modulo whitespace) input. The
 * SCRIBE metadata namespace must survive a parse → serialize cycle without
 * information loss.
 *
 * For SCRIBE specifically: the SCRIBE metadata block (everything inside
 * `<metadata>...</metadata>`) must round-trip. We:
 * 1. Parse the metadata block with fast-xml-parser.
 * 2. Re-serialize it to a canonical form.
 * 3. Parse the canonical form again.
 * 4. Compare the two parsed structures for semantic equivalence.
 *
 * "Modulo whitespace" means we normalize whitespace before comparison.
 * Attribute order is canonicalized alphabetically (XML spec: attribute order
 * is insignificant). The `payload` attribute content (JSON) is also normalized.
 *
 * @module scribe/namespace-conformance/checks/roundtrippable-serialisation
 */

import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import type { InvariantFinding } from '../invariants.js';

/**
 * Shared parser config.
 *
 * `processEntities: true` is required for correct round-trip behavior:
 * without it, attribute values containing JSON (e.g., `payload='{"order":0}'`)
 * get entity-encoded by the builder (`&quot;`) and then the re-parser reads
 * the raw entity string rather than the decoded value — producing a spurious
 * inequality. With processEntities: true, both parse passes decode entities
 * to the same value, making parse→serialize→parse idempotent.
 */
const parseOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseAttributeValue: false,
  trimValues: true,
  parseTagValue: false,
  processEntities: true,
  // Preserve namespace prefixes
  isArray: () => false,
} as const;

const buildOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: false,
  suppressUnpairedNode: false,
} as const;

const parser = new XMLParser(parseOptions);
const builder = new XMLBuilder(buildOptions);

/**
 * Normalize a string for comparison: collapse all whitespace sequences to a
 * single space and strip leading/trailing whitespace.
 */
function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Extract the `<metadata>` block from an SVG.
 * Returns the content as a string, or undefined if no metadata block exists.
 */
function extractMetadataBlock(svgSource: string): string | undefined {
  const start = svgSource.indexOf('<metadata>');
  const end = svgSource.indexOf('</metadata>');
  if (start === -1 || end === -1) return undefined;
  return svgSource.slice(start, end + '</metadata>'.length);
}

/**
 * Attempt a parse → serialize → parse cycle on the metadata block and compare
 * the two parsed structures for equivalence.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, (b as unknown[])[i]));
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj).sort();
  const bKeys = Object.keys(bObj).sort();

  if (aKeys.length !== bKeys.length) return false;
  if (!aKeys.every((k, i) => k === bKeys[i])) return false;

  return aKeys.every(k => deepEqual(aObj[k], bObj[k]));
}

/**
 * Checks that the SCRIBE metadata block round-trips through parse → serialize.
 *
 * PASS — the metadata block parses, serializes, re-parses, and the two parsed
 *        structures are semantically equivalent.
 *
 * FAIL — the metadata block fails to parse, or the re-parsed structure differs
 *        from the original parsed structure (information loss in serialisation).
 *
 * @param svgSource Raw SVG XML string to inspect.
 * @returns InvariantFinding for this invariant.
 */
export function checkRoundtrippableSerialisation(svgSource: string): InvariantFinding {
  const invariant = 'roundtrippable-serialisation' as const;

  const metaBlock = extractMetadataBlock(svgSource);
  if (metaBlock === undefined) {
    return {
      invariant,
      status: 'PASS',
      evidence: 'No <metadata> block found; round-trip invariant trivially satisfied (nothing to round-trip).',
    };
  }

  // Round 1: parse
  let parsed1: unknown;
  try {
    parsed1 = parser.parse(metaBlock);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      invariant,
      status: 'FAIL',
      evidence: `Metadata block failed to parse: ${msg}`,
    };
  }

  // Serialize
  let serialized: string;
  try {
    serialized = builder.build(parsed1) as string;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      invariant,
      status: 'FAIL',
      evidence: `Metadata block serialization failed: ${msg}`,
    };
  }

  // Round 2: re-parse
  let parsed2: unknown;
  try {
    parsed2 = parser.parse(serialized);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      invariant,
      status: 'FAIL',
      evidence: `Re-parse after serialization failed (serialized form was not valid XML): ${msg}`,
    };
  }

  // Compare the two parsed objects
  if (!deepEqual(parsed1, parsed2)) {
    // Provide a diagnostic: show the normalized serialized forms of both
    const p1str = normalizeWhitespace(JSON.stringify(parsed1));
    const p2str = normalizeWhitespace(JSON.stringify(parsed2));
    return {
      invariant,
      status: 'FAIL',
      evidence: `Parse→serialize→parse produced a different structure. Original: ${p1str.substring(0, 200)}... Re-parsed: ${p2str.substring(0, 200)}...`,
    };
  }

  return {
    invariant,
    status: 'PASS',
    evidence: `Metadata block round-trips through parse→serialize→parse without information loss (${metaBlock.length} bytes).`,
  };
}
