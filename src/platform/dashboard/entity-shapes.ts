/**
 * Entity shape/color rendering system for the GSD Dashboard.
 *
 * Provides the visual vocabulary: entity type determines shape
 * (circle, rectangle, hexagon, chevron, diamond, dot) and domain
 * determines color (frontend blue, backend green, testing amber,
 * infrastructure purple, observation teal, silicon rose).
 *
 * Pure render functions, no I/O. SVG shapes are self-contained
 * inline strings suitable for embedding in HTML and work with
 * file:// protocol (no external references).
 *
 * @module dashboard/entity-shapes
 */

// ============================================================================
// Types
// ============================================================================

/** Entity types with distinct SVG shape representations. */
export type EntityType = 'agent' | 'skill' | 'team' | 'milestone' | 'adapter' | 'plan';

/** Domain categories with distinct color encodings. */
export type DomainType = 'frontend' | 'backend' | 'testing' | 'infrastructure' | 'observation' | 'silicon';

/** SVG shape primitive definition for an entity type. */
export interface EntityShapeConfig {
  /** SVG element tag name (circle, rect, polygon). */
  tag: string;
  /** SVG viewBox attribute value. */
  viewBox: string;
  /** SVG shape element markup (self-closing, without fill). */
  path: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * SVG shape definitions for each entity type, using a 24x24 viewBox.
 */
export const ENTITY_SHAPES: Record<EntityType, EntityShapeConfig> = {
  agent: {
    tag: 'circle',
    viewBox: '0 0 24 24',
    path: '<circle cx="12" cy="12" r="10" />',
  },
  skill: {
    tag: 'rect',
    viewBox: '0 0 24 24',
    path: '<rect x="2" y="6" width="20" height="12" rx="2" />',
  },
  team: {
    tag: 'polygon',
    viewBox: '0 0 24 24',
    path: '<polygon points="12,2 22,7 22,17 12,22 2,17 2,7" />',
  },
  milestone: {
    tag: 'polygon',
    viewBox: '0 0 24 24',
    path: '<polygon points="2,4 16,4 22,12 16,20 2,20 8,12" />',
  },
  adapter: {
    tag: 'polygon',
    viewBox: '0 0 24 24',
    path: '<polygon points="12,2 22,12 12,22 2,12" />',
  },
  plan: {
    tag: 'circle',
    viewBox: '0 0 24 24',
    path: '<circle cx="12" cy="12" r="5" />',
  },
};

/**
 * CSS custom property references for each domain color.
 */
export const DOMAIN_COLORS: Record<DomainType, string> = {
  frontend: 'var(--domain-frontend)',
  backend: 'var(--domain-backend)',
  testing: 'var(--domain-testing)',
  infrastructure: 'var(--domain-infrastructure)',
  observation: 'var(--domain-observation)',
  silicon: 'var(--domain-silicon)',
};

// ============================================================================
// Render functions
// ============================================================================

/**
 * Render an inline SVG string for an entity shape filled with a domain color.
 *
 * @param entity - The entity type determining the shape.
 * @param domain - The domain determining the fill color.
 * @param size   - SVG width/height in pixels (default 16).
 * @returns Self-contained inline SVG string.
 */
export function renderEntityShape(entity: EntityType, domain: DomainType, size: number = 16): string {
  const shape = ENTITY_SHAPES[entity];
  const color = DOMAIN_COLORS[domain];

  // Extract tag and attributes from the path, inject fill
  const filledPath = shape.path.replace('/>', ` fill="${color}" />`);

  return `<svg class="entity-shape entity-${entity} domain-${domain}" width="${size}" height="${size}" viewBox="${shape.viewBox}">${filledPath}</svg>`;
}

/**
 * Return CSS styles for entity shapes and domain colors.
 *
 * Includes:
 * - Domain color CSS custom properties with hex fallback values
 * - .entity-shape base class
 * - .entity-{type} classes (one per EntityType)
 * - .domain-{domain} fill classes
 *
 * @returns CSS string.
 */
export function renderEntityShapeStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Entity Shape/Color System
   ----------------------------------------------------------------------- */

:root {
  --domain-frontend: #58a6ff;
  --domain-backend: #3fb950;
  --domain-testing: #d29922;
  --domain-infrastructure: #bc8cff;
  --domain-observation: #39d2c0;
  --domain-silicon: #f778ba;
}

.entity-shape {
  display: inline-block;
  vertical-align: middle;
}

.entity-agent {}
.entity-skill {}
.entity-team {}
.entity-milestone {}
.entity-adapter {}
.entity-plan {}

.domain-frontend { fill: var(--domain-frontend); }
.domain-backend { fill: var(--domain-backend); }
.domain-testing { fill: var(--domain-testing); }
.domain-infrastructure { fill: var(--domain-infrastructure); }
.domain-observation { fill: var(--domain-observation); }
.domain-silicon { fill: var(--domain-silicon); }
`;
}
