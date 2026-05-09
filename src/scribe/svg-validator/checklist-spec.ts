/**
 * SCRIBE SVG a11y checklist — typed const representation.
 *
 * Canonical source: examples/cartridges/svg-substrate/a11y-checklist.md
 * (15 items, 3 tiers: BLOCKER, recommended, scribe-class).
 *
 * Do NOT add new rules here without updating the substrate checklist.md.
 * The substrate-conformance test (Component 09) treats this list as frozen.
 *
 * @module scribe/svg-validator/checklist-spec
 */

export type ChecklistTier = 'BLOCKER' | 'recommended' | 'scribe-class';

export interface ChecklistItem {
  /** 1-based item number matching the checklist.md ordering. */
  readonly id: number;
  readonly tier: ChecklistTier;
  /** Short human-readable description of what is checked. */
  readonly description: string;
}

/**
 * The canonical 15-item SCRIBE SVG a11y checklist.
 *
 * BLOCKER items (1-5): must pass for the SVG to be considered valid.
 * Recommended items (6-11): warnings; non-blocking but flagged.
 * SCRIBE-class items (12-15): SCRIBE-specific structural checks.
 */
export const CHECKLIST_ITEMS: ReadonlyArray<ChecklistItem> = Object.freeze([
  // --- BLOCKER tier (items 1-5) ---
  {
    id: 1,
    tier: 'BLOCKER',
    description:
      'Root <svg> has a role attribute (img | graphics-document | graphics-object | presentation | none)',
  },
  {
    id: 2,
    tier: 'BLOCKER',
    description:
      'Root <svg> has aria-labelledby (or aria-label if a description is unnecessary)',
  },
  {
    id: 3,
    tier: 'BLOCKER',
    description: 'First child is <title id="..."> with non-empty text',
  },
  {
    id: 4,
    tier: 'BLOCKER',
    description:
      'Second child is <desc id="..."> with non-empty text (acceptable if aria-label is set)',
  },
  {
    id: 5,
    tier: 'BLOCKER',
    description:
      'No raster <image> elements pointing to PNG/JPEG/GIF/WebP — pure vector only',
  },
  // --- Recommended tier (items 6-11) ---
  {
    id: 6,
    tier: 'recommended',
    description:
      'Colour-and-contrast: WCAG 2.2 §1.4.3/§1.4.11 thresholds met',
  },
  {
    id: 7,
    tier: 'recommended',
    description:
      'Information-conveying colour pairs include a non-colour cue (WCAG 2.2 §1.4.1)',
  },
  {
    id: 8,
    tier: 'recommended',
    description:
      'Animations have a prefers-reduced-motion: reduce fallback',
  },
  {
    id: 9,
    tier: 'recommended',
    description:
      'Auto-playing animations longer than 5 s offer a pause control or non-animated default',
  },
  {
    id: 10,
    tier: 'recommended',
    description:
      'Decorative children inside a meaningful SVG carry aria-hidden="true"',
  },
  {
    id: 11,
    tier: 'recommended',
    description:
      '<title> and <desc> text avoids strings that look like commands an AT might misread',
  },
  // --- SCRIBE-class tier (items 12-15) ---
  {
    id: 12,
    tier: 'scribe-class',
    description:
      'Structural navigation: major groups carry role="graphics-object" with aria-label',
  },
  {
    id: 13,
    tier: 'scribe-class',
    description: 'Validation passes validators/a11y-check.ts',
  },
  {
    id: 14,
    tier: 'scribe-class',
    description:
      'Validation passes xmllint --noout --schema svg.xsd validators/svg.xsd input.svg',
  },
  {
    id: 15,
    tier: 'scribe-class',
    description:
      'Optimisation passes svgo --config validators/svgo.config.js without disturbing required attributes',
  },
]);

/** Items that, if failing, make the SVG invalid (non-negotiable). */
export const BLOCKER_ITEMS = CHECKLIST_ITEMS.filter(
  (i) => i.tier === 'BLOCKER',
);

/** Items that produce warnings but don't block the SVG. */
export const RECOMMENDED_ITEMS = CHECKLIST_ITEMS.filter(
  (i) => i.tier === 'recommended',
);

/** SCRIBE-specific structural items. */
export const SCRIBE_CLASS_ITEMS = CHECKLIST_ITEMS.filter(
  (i) => i.tier === 'scribe-class',
);
