/**
 * SCRIBE SVGO config builder.
 *
 * Canonical source for the a11y-preserving and round-trip-preserving SVGO
 * configurations used by T2 and T3 cartridges.
 *
 * Substrate-conformance rule (enforced by Component 09):
 *   - removeTitle, removeDesc, removeMetadata are ALWAYS false.
 *   - Opts are OPT-OUT, not opt-in. The substrate-conformance test asserts
 *     the defaults cannot be silently stripped.
 *
 * Usage (programmatic):
 *   import { createSvgoConfig } from './svgo-config.js';
 *   const config = createSvgoConfig({ preserveRoundTrip: true });
 *   // then: const result = optimize(svgString, config);
 *
 * @module scribe/svg-validator/svgo-config
 */

/** Options controlling which set of SVGO overrides to apply. */
export interface SvgoConfigOptions {
  /**
   * When true, additionally preserve SCRIBE round-trip metadata:
   *   - cleanupIds: false (don't rename data-node-id references)
   *   - keepDataAttrs: true (preserve data-* attributes)
   *   - keepUnknownContent: true (preserve <scribe:*> namespaced elements)
   *
   * When false (T2 baseline), only a11y preservation is active.
   */
  readonly preserveRoundTrip?: boolean;
}

/**
 * An SVGO plugin descriptor object.
 * We type it broadly so the returned config is usable without importing
 * SVGO's own types (SVGO is an optional peer dep in the cartridges).
 */
export interface SvgoPlugin {
  readonly name: string;
  readonly params?: Record<string, unknown>;
}

/**
 * An SVGO configuration object suitable for passing to `optimize()`.
 */
export interface SvgoConfig {
  readonly multipass: boolean;
  readonly js2svg?: Record<string, unknown>;
  readonly plugins: ReadonlyArray<SvgoPlugin>;
}

/**
 * Build an SVGO configuration that preserves a11y attributes and, optionally,
 * SCRIBE round-trip metadata.
 *
 * SUBSTRATE INVARIANTS (DO NOT CHANGE without a substrate decision review):
 *   - removeTitle: false   — always
 *   - removeDesc: false    — always
 *   - removeMetadata: false — always
 *
 * @param opts.preserveRoundTrip - When true, adds T3 round-trip protections.
 * @returns An SVGO config object.
 */
export function createSvgoConfig(opts: SvgoConfigOptions = {}): SvgoConfig {
  const { preserveRoundTrip = false } = opts;

  // Base a11y-preserving overrides (T2 baseline; items 1-5 of the checklist).
  const baseOverrides: Record<string, unknown> = {
    // Never remove viewBox; required for resolution-independent rendering.
    removeViewBox: false,
    // Never remove title/desc; they are the accessibility name and description.
    // SUBSTRATE-PINNED: the conformance test asserts these cannot be opted out.
    removeTitle: false,
    removeDesc: false,
    // Keep the document XML declaration in standalone files.
    removeXMLProcInstruction: false,
    // Don't collapse groups carrying semantic role / aria-label.
    collapseGroups: false,
    // Don't merge or simplify paths — SCRIBE authors path shapes deliberately.
    mergePaths: false,
    convertShapeToPath: false,
  };

  // Round-trip-specific additions (T3; when preserveRoundTrip=true).
  if (preserveRoundTrip) {
    // SUBSTRATE-PINNED: removeMetadata must remain false when preserving round-trip.
    baseOverrides['removeMetadata'] = false;

    // CRITICAL: don't rename IDs — SCRIBE node IDs (n1, n2, …) must match
    // between <scribe:node id=...> and <g class="node" id=...>.
    baseOverrides['cleanupIds'] = false;

    // Preserve custom namespace content (<scribe:*>), data-* attributes,
    // and aria attributes.
    baseOverrides['removeUnknownsAndDefaults'] = {
      keepDataAttrs: true,
      keepAriaAttrs: true,
      unknownAttrs: false,
      defaultAttrs: false,
      unknownContent: false,
    };
  } else {
    // T2 baseline: removeMetadata is also preserved (a11y metadata is valid).
    baseOverrides['removeMetadata'] = false;
  }

  const plugins: SvgoPlugin[] = [
    {
      name: 'preset-default',
      params: {
        overrides: baseOverrides,
      },
    },
    // Explicitly preserve aria-* attributes; some SVGO versions need this
    // even with overrides on preset-default.
    {
      name: 'removeAttrs',
      params: {
        attrs: '(class:none)', // no-op pattern — preserveAttrs is the active constraint
        preserveAttrs: ['aria-.*', 'role', 'tabindex'],
      },
    },
  ];

  // For round-trip mode, add the explicit removeUnknownsAndDefaults plugin
  // (some SVGO versions require this as a standalone plugin, not just overrides).
  if (preserveRoundTrip) {
    plugins.push({
      name: 'removeUnknownsAndDefaults',
      params: {
        keepDataAttrs: true,
        keepAriaAttrs: true,
        unknownAttrs: false,
        defaultAttrs: false,
        unknownContent: false,
      },
    });
  }

  const config: SvgoConfig = {
    multipass: true,
    plugins,
  };

  // Round-trip mode uses pretty-printing to preserve readability for
  // human-editable SCRIBE SVGs (per T3 svgo-roundtrip.config.js).
  if (preserveRoundTrip) {
    return {
      ...config,
      js2svg: { pretty: true, indent: 2 },
    };
  }

  return config;
}
