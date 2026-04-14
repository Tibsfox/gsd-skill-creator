/**
 * Legacy adapter — bridges the v1 content-cartridge schema
 * (`src/bundles/cartridge/types.ts`) and the unified cartridge-forge schema
 * (`src/cartridge/types.ts`).
 *
 * The legacy schema carries a single content-shaped payload (deepMap + story)
 * plus a single narrative voice projection (chipset) at top level. Under the
 * unified model, that is a Cartridge with exactly two chipsets: one `content`
 * kind, one `voice` kind. All other top-level fields (id/name/version/author/
 * description/trust/dependencies/metadata) map 1:1.
 *
 * Provenance has no legacy analog. When adapting legacy → unified we synthesize
 * a minimal provenance block marked with `origin: 'legacy-adapter'` so the
 * result validates under the new schema. The reverse direction drops
 * provenance (it is not round-trip-significant for legacy consumers).
 *
 * Round-trip contract (tested in legacy-adapter.test.ts):
 *   legacyOf(unifiedOf(legacy)) deep-equal legacy
 * for every existing content cartridge in `data/cartridges/`.
 */

import {
  CartridgeSchema as LegacyCartridgeSchema,
  type Cartridge as LegacyCartridge,
} from '../bundles/cartridge/types.js';
import {
  CartridgeSchema,
  type Cartridge,
  type ContentChipset,
  type VoiceChipset,
} from './types.js';

const LEGACY_ADAPTER_ORIGIN = 'legacy-adapter';
const LEGACY_ADAPTER_CREATED_AT = '1970-01-01T00:00:00Z';

/**
 * Convert a legacy content cartridge into the unified cartridge format.
 *
 * Shape changes:
 * - `deepMap` + `story` → single `content` chipset
 * - `chipset` (narrative voice) → single `voice` chipset
 * - Synthesizes `provenance` with origin='legacy-adapter' and a sentinel
 *   createdAt that the reverse direction recognizes as "no-op drop".
 */
export function legacyToUnified(legacy: LegacyCartridge): Cartridge {
  // Validate the input through its own schema first — if it's malformed,
  // fail here rather than produce a bogus unified cartridge.
  const parsed = LegacyCartridgeSchema.parse(legacy);

  const content: ContentChipset = {
    kind: 'content',
    deepMap: parsed.deepMap,
    story: parsed.story,
  };

  const voice: VoiceChipset = {
    kind: 'voice',
    vocabulary: parsed.chipset.vocabulary,
    orientation: parsed.chipset.orientation,
    voice: parsed.chipset.voice,
    ...(parsed.chipset.museAffinity !== undefined
      ? { museAffinity: parsed.chipset.museAffinity }
      : {}),
  };

  const unified: Cartridge = {
    id: parsed.id,
    name: parsed.name,
    version: parsed.version,
    author: parsed.author,
    description: parsed.description,
    trust: parsed.trust,
    provenance: {
      origin: LEGACY_ADAPTER_ORIGIN,
      createdAt: LEGACY_ADAPTER_CREATED_AT,
    },
    chipsets: [content, voice],
    ...(parsed.dependencies !== undefined
      ? { dependencies: parsed.dependencies }
      : {}),
    ...(parsed.metadata !== undefined ? { metadata: parsed.metadata } : {}),
  };

  return CartridgeSchema.parse(unified);
}

/**
 * Convert a unified cartridge back into the legacy content-cartridge format.
 *
 * Requires that the unified cartridge contain exactly one `content` chipset
 * and exactly one `voice` chipset. Other chipset kinds are incompatible with
 * the legacy single-domain shape and cause an error — legacy consumers cannot
 * represent a department/coprocessor/metrics cartridge.
 *
 * Provenance is discarded. The legacy schema has no provenance field.
 */
export function unifiedToLegacy(cartridge: Cartridge): LegacyCartridge {
  const parsed = CartridgeSchema.parse(cartridge);

  const contentChipsets = parsed.chipsets.filter((c) => c.kind === 'content');
  const voiceChipsets = parsed.chipsets.filter((c) => c.kind === 'voice');

  if (contentChipsets.length !== 1) {
    throw new Error(
      `legacy-adapter: expected exactly 1 content chipset, found ${contentChipsets.length}`,
    );
  }
  if (voiceChipsets.length !== 1) {
    throw new Error(
      `legacy-adapter: expected exactly 1 voice chipset, found ${voiceChipsets.length}`,
    );
  }

  const disallowed = parsed.chipsets.filter(
    (c) => c.kind !== 'content' && c.kind !== 'voice',
  );
  if (disallowed.length > 0) {
    const kinds = disallowed.map((c) => c.kind).join(', ');
    throw new Error(
      `legacy-adapter: cannot represent non-content/voice chipsets in legacy format (found: ${kinds})`,
    );
  }

  const content = contentChipsets[0] as ContentChipset;
  const voice = voiceChipsets[0] as VoiceChipset;

  const legacy: LegacyCartridge = {
    id: parsed.id,
    name: parsed.name,
    version: parsed.version,
    author: parsed.author,
    description: parsed.description,
    trust: parsed.trust,
    deepMap: content.deepMap,
    story: content.story,
    chipset: {
      vocabulary: voice.vocabulary,
      orientation: voice.orientation,
      voice: voice.voice,
      ...(voice.museAffinity !== undefined
        ? { museAffinity: voice.museAffinity }
        : {}),
    },
    ...(parsed.dependencies !== undefined
      ? { dependencies: parsed.dependencies }
      : {}),
    ...(parsed.metadata !== undefined ? { metadata: parsed.metadata } : {}),
  };

  return LegacyCartridgeSchema.parse(legacy);
}

/** True if this unified cartridge was produced by `legacyToUnified`. */
export function isLegacyAdapted(cartridge: Cartridge): boolean {
  return (
    cartridge.provenance.origin === LEGACY_ADAPTER_ORIGIN &&
    cartridge.provenance.createdAt === LEGACY_ADAPTER_CREATED_AT
  );
}
