/**
 * Translation Engine — Design Targets.
 *
 * Maps ExtractedParameters to design specifications: SVG illustrations,
 * color palette exports (JSON/CSS/Tailwind), and layout grid specs.
 * Output is declarative description for design workflows and documentation.
 */

import type { ExtractedParameters } from './types.js';

/** Supported palette export formats. */
export type PaletteFormat = 'json' | 'css' | 'tailwind';

// ============================================================================
// SVG Translator
// ============================================================================

/**
 * Produces a valid SVG string reflecting extracted geometry and colors.
 */
export function toSVG(params: ExtractedParameters): string {
  const count = Math.min(params.geometry.proportions.elementCount ?? 40, 200);
  const palette = params.color.palette;
  const arr = params.geometry.arrangement;
  const goldenAngle = params.geometry.constants.goldenAngle ?? 2.399963;
  const energy = params.feel.energy;
  const viewSize = 400;
  const cx = viewSize / 2;
  const cy = viewSize / 2;

  const elements: string[] = [];

  for (let i = 0; i < count; i++) {
    const color = palette[i % palette.length];
    let x: number, y: number, r: number;

    if (arr === 'spiral' || arr === 'organic') {
      const angle = i * goldenAngle;
      const dist = Math.sqrt(i) * (viewSize / 20);
      x = cx + dist * Math.cos(angle);
      y = cy + dist * Math.sin(angle);
      r = Math.max(2, 6 - i * 0.05);
    } else if (arr === 'grid') {
      const cols = Math.ceil(Math.sqrt(count));
      const spacing = viewSize / (cols + 1);
      x = spacing + (i % cols) * spacing;
      y = spacing + Math.floor(i / cols) * spacing;
      r = spacing * 0.3;
    } else if (arr === 'radial') {
      const angle = i * (Math.PI * 2 / count);
      const dist = viewSize / 3;
      x = cx + dist * Math.cos(angle);
      y = cy + dist * Math.sin(angle);
      r = 5;
    } else {
      // linear
      const spacing = viewSize / (count + 1);
      x = spacing + i * spacing;
      y = cy;
      r = 5;
    }

    const opacity = (1 - params.material.surfaces[0]?.reflectivity * 0.3).toFixed(2);
    elements.push(
      `  <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color.hex}" opacity="${opacity}" />`,
    );
  }

  // Color definitions
  const defs = palette.map((c, i) =>
    `    <linearGradient id="color-${i}"><stop stop-color="${c.hex}" /></linearGradient>`,
  ).join('\n');

  // Optional animation
  const animation = energy > 0.3
    ? `\n  <style>circle { animation: breathe ${(3 - energy * 2).toFixed(1)}s ease-in-out infinite alternate; } @keyframes breathe { to { opacity: 0.6; } }</style>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" width="${viewSize}" height="${viewSize}">
  <!-- Generated from extracted parameters — abstract representation, not traced copy -->
  <defs>
${defs}
  </defs>${animation}
  <rect width="${viewSize}" height="${viewSize}" fill="${palette.find(c => c.role === 'background')?.hex ?? '#FFFFFF'}" />
${elements.join('\n')}
</svg>`;
}

// ============================================================================
// Palette Exports
// ============================================================================

/**
 * Exports color palette in the specified format.
 */
export function toPalette(params: ExtractedParameters, format: PaletteFormat): string {
  const palette = params.color.palette;

  switch (format) {
    case 'json':
      return JSON.stringify({
        name: 'extracted-palette',
        temperature: params.color.temperature,
        relationships: params.color.relationships,
        colors: palette.map(c => ({
          name: c.name,
          hex: c.hex,
          role: c.role,
        })),
      }, null, 2);

    case 'css':
      return `/* Palette extracted from creator's work */\n:root {\n${palette.map(c =>
        `  --color-${sanitizeCSS(c.role)}: ${c.hex}; /* ${c.name} */`,
      ).join('\n')}\n  --color-temperature: ${params.color.temperature};\n}`;

    case 'tailwind':
      return `// Palette extracted from creator's work\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${palette.map(c =>
        `        '${sanitizeCSS(c.role)}': '${c.hex}', // ${c.name}`,
      ).join('\n')}\n      },\n    },\n  },\n};`;

    default:
      return '';
  }
}

// ============================================================================
// Layout Specification
// ============================================================================

/**
 * Produces a markdown layout specification from geometry parameters.
 */
export function toLayoutSpec(params: ExtractedParameters): string {
  const g = params.geometry;
  const count = g.proportions.elementCount ?? 'unspecified';

  const constantsTable = Object.entries(g.constants).length > 0
    ? '\n### Mathematical Constants\n\n| Constant | Value |\n|----------|-------|\n' +
      Object.entries(g.constants).map(([k, v]) => `| ${k} | ${v} |`).join('\n')
    : '';

  const proportionsTable = Object.entries(g.proportions).length > 0
    ? '\n### Proportions\n\n| Property | Value |\n|----------|-------|\n' +
      Object.entries(g.proportions).map(([k, v]) => `| ${k} | ${v} |`).join('\n')
    : '';

  const responsive = typeof count === 'number'
    ? `\n### Responsive Breakpoints\n\n| Breakpoint | Suggested Layout |\n|-----------|------------------|\n` +
      `| < 480px | ${Math.ceil(count * 0.4)} elements, compact spacing |\n` +
      `| 480-768px | ${Math.ceil(count * 0.7)} elements, medium spacing |\n` +
      `| > 768px | ${count} elements, full spacing |`
    : '';

  return `# Layout Specification

## Arrangement

- **Primary Shape:** ${g.primaryShape}
- **Pattern:** ${g.arrangement}
- **Symmetry:** ${g.symmetry}
- **Element Count:** ${count}
${constantsTable}
${proportionsTable}

## Density Map

- **Center:** Highest density — elements cluster near the origin
- **Mid-range:** Moderate density — spacing increases with distance
- **Edges:** Lowest density — sparse, breathing room at boundaries

## Feel Mapping

| Dimension | Value | Layout Effect |
|-----------|-------|---------------|
| Order | ${params.feel.order.toFixed(2)} | ${params.feel.order > 0.5 ? 'Snap to grid lines' : 'Allow organic offset'} |
| Handmade | ${params.feel.handmade.toFixed(2)} | ${params.feel.handmade > 0.5 ? 'Add per-element jitter' : 'Precise positioning'} |
| Energy | ${params.feel.energy.toFixed(2)} | ${params.feel.energy > 0.3 ? 'Include animation/transitions' : 'Static layout'} |
${responsive}`;
}

/**
 * Routes to the appropriate design translator.
 */
export function translateDesign(
  params: ExtractedParameters,
  output: 'svg' | PaletteFormat | 'layout',
): string {
  switch (output) {
    case 'svg': return toSVG(params);
    case 'json':
    case 'css':
    case 'tailwind': return toPalette(params, output);
    case 'layout': return toLayoutSpec(params);
    default: return '';
  }
}

// ============================================================================
// Internal Helpers
// ============================================================================

function sanitizeCSS(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
