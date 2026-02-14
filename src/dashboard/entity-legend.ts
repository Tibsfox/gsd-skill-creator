/**
 * Entity legend component and panel header shape helper.
 *
 * Provides a collapsible legend showing all entity shapes and domain
 * colors, plus a helper function for adding entity shapes to panel
 * headers.
 *
 * Uses <details>/<summary> HTML5 pattern for collapsibility (no JS).
 * Pure render functions, no I/O.
 *
 * @module dashboard/entity-legend
 */

import {
  renderEntityShape,
  ENTITY_SHAPES,
  DOMAIN_COLORS,
  type EntityType,
  type DomainType,
} from './entity-shapes.js';

// ============================================================================
// Constants
// ============================================================================

/** Panel type to entity/domain mapping for header shapes. */
const PANEL_SHAPE_MAP: Record<string, { entity: EntityType; domain: DomainType }> = {
  activity: { entity: 'plan', domain: 'observation' },
  terminal: { entity: 'adapter', domain: 'infrastructure' },
  staging: { entity: 'skill', domain: 'backend' },
};

// ============================================================================
// Render functions
// ============================================================================

/**
 * Render a collapsible entity shape/color legend.
 *
 * Shows all 6 entity shapes with labels and all 6 domain colors
 * with swatches in a two-section grid layout. Uses CSS-only
 * <details>/<summary> for collapse behavior.
 *
 * @returns HTML string for the legend component.
 */
export function renderEntityLegend(): string {
  // Entity type items
  const entityItems = (Object.keys(ENTITY_SHAPES) as EntityType[])
    .map((entity) => {
      const label = entity.charAt(0).toUpperCase() + entity.slice(1);
      const svg = renderEntityShape(entity, 'frontend', 20);
      return `      <div class="entity-legend-item">${svg} <span>${label}</span></div>`;
    })
    .join('\n');

  // Domain color items
  const domainItems = (Object.keys(DOMAIN_COLORS) as DomainType[])
    .map((domain) => {
      const label = domain.charAt(0).toUpperCase() + domain.slice(1);
      return `      <div class="entity-legend-item"><span class="domain-swatch domain-${domain}"></span> <span>${label}</span></div>`;
    })
    .join('\n');

  return `<details class="entity-legend" open>
  <summary class="entity-legend-toggle">Shape &amp; Color Legend</summary>
  <div class="entity-legend-grid">
    <div class="entity-legend-section">
      <h4>Entity Types</h4>
${entityItems}
    </div>
    <div class="entity-legend-section">
      <h4>Domains</h4>
${domainItems}
    </div>
  </div>
</details>`;
}

/**
 * Return CSS styles for the entity legend component.
 *
 * @returns CSS string with grid layout for legend items.
 */
export function renderEntityLegendStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Entity Legend
   ----------------------------------------------------------------------- */

.entity-legend {
  background: var(--surface, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-md, 1rem);
  margin-top: var(--space-lg, 1.5rem);
}

.entity-legend-toggle {
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted, #8b949e);
  list-style: none;
  user-select: none;
}

.entity-legend-toggle::-webkit-details-marker {
  display: none;
}

.entity-legend-toggle::before {
  content: '\\25B6';
  display: inline-block;
  margin-right: 0.5em;
  font-size: 0.7em;
  transition: transform 0.2s;
}

.entity-legend[open] .entity-legend-toggle::before {
  transform: rotate(90deg);
}

.entity-legend-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md, 1rem);
  margin-top: var(--space-md, 1rem);
}

.entity-legend-section h4 {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #8b949e);
  margin-bottom: var(--space-sm, 0.5rem);
}

.entity-legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 2px 0;
  font-size: 0.8rem;
  color: var(--text, #e6edf3);
}

.domain-swatch {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.domain-swatch.domain-frontend { background-color: var(--domain-frontend, #58a6ff); }
.domain-swatch.domain-backend { background-color: var(--domain-backend, #3fb950); }
.domain-swatch.domain-testing { background-color: var(--domain-testing, #d29922); }
.domain-swatch.domain-infrastructure { background-color: var(--domain-infrastructure, #bc8cff); }
.domain-swatch.domain-observation { background-color: var(--domain-observation, #39d2c0); }
.domain-swatch.domain-silicon { background-color: var(--domain-silicon, #f778ba); }

@media (max-width: 480px) {
  .entity-legend-grid {
    grid-template-columns: 1fr;
  }
}
`;
}

/**
 * Return the appropriate entity shape SVG for a panel header.
 *
 * @param panelType - Panel identifier ('activity', 'terminal', 'staging').
 * @returns SVG string for the panel shape, or empty string if unknown.
 */
export function renderPanelHeaderShape(panelType: string): string {
  const mapping = PANEL_SHAPE_MAP[panelType];
  if (!mapping) return '';
  return renderEntityShape(mapping.entity, mapping.domain, 14);
}
