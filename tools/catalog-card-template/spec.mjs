/**
 * tools/catalog-card-template/spec.mjs — normative catalog-card template spec.
 *
 * Codified at v1.49.658 to close the catalog-card drift class. /btw at
 * v1.49.657 in-flight surfaced 47x byte-spread on MUS catalog cards
 * (118 cards, 443B-20910B); per Lesson #10268 (gate-not-vigilance),
 * converted to BLOCKER gate.
 *
 * Consumers: tools/catalog-card-template/extractor.mjs,
 * tools/update-catalog-indexes.mjs (gate at pre-tag-gate step 8).
 */

export const CARD_TEMPLATE_VERSION = '1.0';

export const TRACK_TEMPLATES = {
  MUS:  { trackLabel: 'MUS',  requiredMetaFields: ['S36', 'SPS', 'NASA'],         optionalMetaFields: [],                maxMetaCount: 3 },
  NASA: { trackLabel: 'NASA', requiredMetaFields: ['MUS', 'SPS', 'ELC'],          optionalMetaFields: ['mission-class'], maxMetaCount: 4 },
  ELC:  { trackLabel: 'ELC',  requiredMetaFields: ['NASA', 'MUS', 'SPS'],         optionalMetaFields: [],                maxMetaCount: 3 },
  SPS:  { trackLabel: 'SPS',  requiredMetaFields: ['NASA', 'MUS', 'ELC'],         optionalMetaFields: ['family'],        maxMetaCount: 4 },
  TRS:  { trackLabel: 'TRS',  requiredMetaFields: ['pack-K', 'bridge-categories'], optionalMetaFields: [],                maxMetaCount: 2 },
};

export const HARD_LIMITS = {
  totalCardBytes: 1500,
  degreeNumChars: 80,
  degreeTitleChars: 150,
  perMetaFieldChars: 120,
  allowedInlineMarkup: ['strong', 'em'],
  forbiddenInlineMarkup: ['a', 'br', 'div', 'style', 'script'],
  forbiddenContentPatterns: [
    /substrate-arc/i,
    /#1\d{4}\b/,
    /FA-\d+-\d+\s+RESOLVED/,
    /obs#\d+\s+first-instance/i,
    /cross-track\s+substrate-emergent/i,
  ],
};

// NASA's index is JS-rendered from CSV; drift lives in per-degree <title>
// tags rather than static cards. Tighter limit because <title> shows in
// browser tabs.
export const NASA_TRACK_OVERRIDE = {
  perTitleByteLimit: 300,
};

export const TRACK_NAMES = Object.keys(TRACK_TEMPLATES);
