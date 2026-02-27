import type { TemplateData } from './types.js';

export type TemplateRegistry = Map<string, string>;

/* ---- Max depth for partial recursion ---- */
const MAX_PARTIAL_DEPTH = 10;

/* ---- HTML escaping ---- */

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

/* ---- Dot-notation property resolution ---- */

function resolve(path: string, data: unknown): unknown {
  if (path === '.') return data;
  const parts = path.split('.');
  let current: unknown = data;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/* ---- Partial expansion ---- */

function expandPartials(
  template: string,
  registry: TemplateRegistry,
  depth: number,
): string {
  if (depth >= MAX_PARTIAL_DEPTH) return template;

  return template.replace(/\{\{>(\w+)\}\}/g, (_match, name: string) => {
    const partial = registry.get(name);
    if (partial === undefined) return '';
    return expandPartials(partial, registry, depth + 1);
  });
}

/* ---- Section processing ---- */

/**
 * Process {{#section}}...{{/section}} blocks.
 * - If value is an array, iterate (each element available as {{.}})
 * - If value is truthy, render the block once
 * - If value is falsy, remove the block
 */
function processSections(template: string, data: unknown): string {
  // Match section blocks (non-greedy, innermost first)
  const SECTION_RE = /\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;

  let result = template;
  let previous = '';

  // Iterate until no more sections change (handles nested sections)
  while (result !== previous) {
    previous = result;
    result = result.replace(SECTION_RE, (_match, path: string, body: string) => {
      const value = resolve(path, data);

      if (Array.isArray(value)) {
        return value
          .map((item) => {
            // For primitive arrays, {{.}} resolves to the item
            // For object arrays, properties resolve normally
            return processInterpolation(body, item);
          })
          .join('');
      }

      if (value) {
        return body;
      }

      return '';
    });
  }

  return result;
}

/* ---- Interpolation processing ---- */

function processInterpolation(template: string, data: unknown): string {
  let result = template;

  // Process raw interpolation {{{var}}} first (no escaping)
  result = result.replace(/\{\{\{([^}]+)\}\}\}/g, (_match, path: string) => {
    const value = resolve(path.trim(), data);
    if (value == null) return '';
    return String(value);
  });

  // Process escaped interpolation {{var}}
  result = result.replace(/\{\{([^#/>][^}]*)\}\}/g, (_match, path: string) => {
    // Handle {{.}} for array iteration context
    const trimmed = path.trim();
    const value = resolve(trimmed, data);
    if (value == null) return '';
    return escapeHtml(String(value));
  });

  return result;
}

/* ---- Public API ---- */

/**
 * Load templates from a directory.
 *
 * Templates are .html files. Names derived from filename without extension.
 * Partials in `partials/` subdirectory use just their filename (no prefix).
 */
export async function loadTemplates(
  templateDir: string,
  readFn?: (path: string) => Promise<string>,
  walkFn?: (dir: string) => Promise<string[]>,
): Promise<TemplateRegistry> {
  if (!readFn || !walkFn) {
    throw new Error('readFn and walkFn are required');
  }

  const files = await walkFn(templateDir);
  const registry: TemplateRegistry = new Map();

  for (const file of files) {
    if (!file.endsWith('.html')) continue;

    const content = await readFn(`${templateDir}/${file}`);

    // Derive template name: strip extension, strip partials/ prefix
    let name = file.replace(/\.html$/, '');
    if (name.startsWith('partials/')) {
      name = name.slice('partials/'.length);
    }

    registry.set(name, content);
  }

  return registry;
}

/**
 * Render a template by name with the given data context.
 *
 * Processing order:
 * 1. Select template from registry
 * 2. Expand partials (recursive, max depth 10)
 * 3. Process section blocks (conditionals/iteration)
 * 4. Process raw interpolation ({{{var}}})
 * 5. Process escaped interpolation ({{var}})
 */
export function renderTemplate(
  name: string,
  data: TemplateData,
  registry: TemplateRegistry,
): string {
  const template = registry.get(name);
  if (template === undefined) {
    return '';
  }

  // 1. Expand partials
  let result = expandPartials(template, registry, 0);

  // 2. Process sections
  result = processSections(result, data);

  // 3. Process interpolation (raw first, then escaped)
  result = processInterpolation(result, data);

  return result;
}
