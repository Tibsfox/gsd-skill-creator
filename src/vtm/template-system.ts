/**
 * VTM template loader, mustache-style renderer, and template registry.
 *
 * Provides three subsystems:
 * - loadTemplate(): reads .md template files from disk with memory caching
 * - renderTemplate(): substitutes {{placeholder}} tokens, {{#if}} conditionals,
 *   and {{#each}} loops in template content
 * - createTemplateRegistry(): factory returning a registry for all 7 VTM
 *   templates with custom template registration support
 *
 * Placeholder syntax uses mustache-style {{name}} tokens chosen because
 * square brackets conflict with markdown link syntax and ${name} conflicts
 * with TypeScript template literals in code blocks.
 *
 * @module vtm/template-system
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { z } from 'zod';
import {
  VisionDocumentSchema,
  MilestoneSpecSchema,
  ComponentSpecSchema,
  WaveExecutionPlanSchema,
  TestPlanSchema,
  ResearchReferenceSchema,
} from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** All 7 built-in VTM template names. */
export const VTM_TEMPLATE_NAMES = [
  'vision',
  'milestone-spec',
  'component-spec',
  'wave-plan',
  'test-plan',
  'readme',
  'research-reference',
] as const;

/** Type for a single VTM template name. */
export type VtmTemplateName = (typeof VTM_TEMPLATE_NAMES)[number];

/**
 * Maps logical template names to on-disk filenames.
 *
 * Most templates follow the pattern `{name}-template.md`, but wave-plan
 * maps to `wave-execution-plan-template.md` on disk.
 */
const TEMPLATE_FILENAME_MAP: Record<string, string> = {
  'vision': 'vision-template.md',
  'milestone-spec': 'milestone-spec-template.md',
  'component-spec': 'component-spec-template.md',
  'wave-plan': 'wave-execution-plan-template.md',
  'test-plan': 'test-plan-template.md',
  'readme': 'readme-template.md',
  'research-reference': 'research-reference-template.md',
};

/** Default base directory for VTM templates. */
const DEFAULT_BASE_PATH = '.claude/commands/vision-to-mission/';

// ---------------------------------------------------------------------------
// Template loader
// ---------------------------------------------------------------------------

/** Loaded template result from disk. */
export interface LoadedTemplate {
  name: string;
  content: string;
  path: string;
}

/** Options for loadTemplate. */
export interface LoadTemplateOptions {
  /** Base directory containing template files. */
  basePath?: string;
  /** When true, bypasses the memory cache and re-reads from disk. */
  reload?: boolean;
}

/** Module-level cache keyed by resolved absolute path. */
const templateCache = new Map<string, LoadedTemplate>();

/**
 * Resolves the on-disk filename for a template name.
 *
 * Uses the explicit filename map for built-in templates. Falls back to
 * the `{name}-template.md` pattern for custom/unknown names.
 */
function resolveFilename(name: string): string {
  return TEMPLATE_FILENAME_MAP[name] ?? `${name}-template.md`;
}

/**
 * Loads a template file from disk by name.
 *
 * Resolves `{basePath}/{name}-template.md` (or the mapped filename for
 * built-in templates), reads the file content, and caches it in memory.
 * Subsequent calls return the cached version unless `reload: true`.
 *
 * @param name - Logical template name (e.g. 'vision', 'component-spec')
 * @param options - Optional basePath and reload flag
 * @returns LoadedTemplate or null if the file does not exist
 */
export async function loadTemplate(
  name: string,
  options?: LoadTemplateOptions,
): Promise<LoadedTemplate | null> {
  const basePath = options?.basePath ?? DEFAULT_BASE_PATH;
  const reload = options?.reload ?? false;
  const filename = resolveFilename(name);
  const filePath = resolve(basePath, filename);

  // Return cached version if available and not reloading
  if (!reload && templateCache.has(filePath)) {
    return templateCache.get(filePath)!;
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    const loaded: LoadedTemplate = { name, content, path: filePath };
    templateCache.set(filePath, loaded);
    return loaded;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Template renderer
// ---------------------------------------------------------------------------

/**
 * Renders a template string by substituting placeholders, conditionals, and loops.
 *
 * Processing order (matters for correctness):
 * 1. {{#each key}}...{{/each}} — expand array items
 * 2. {{#if key}}...{{else}}...{{/if}} — conditional sections
 * 3. {{key}} — simple placeholder substitution
 *
 * Unresolved placeholders remain as-is in the output (visible, not stripped).
 *
 * @param content - Template string with mustache-style tokens
 * @param variables - Key-value map for substitution
 * @returns Rendered string
 */
export function renderTemplate(
  content: string,
  variables: Record<string, unknown>,
): string {
  let result = content;

  // Step 1: Process {{#each key}}...{{/each}} blocks
  result = result.replace(
    /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_match, key: string, body: string) => {
      const value = variables[key];
      if (!Array.isArray(value)) {
        return '';
      }
      return value
        .map((item) => {
          // Substitute {{prop}} within the body using item properties
          return body.replace(/\{\{(\w+)\}\}/g, (_m, prop: string) => {
            if (
              item != null &&
              typeof item === 'object' &&
              prop in (item as Record<string, unknown>)
            ) {
              return String((item as Record<string, unknown>)[prop]);
            }
            return `{{${prop}}}`;
          });
        })
        .join('');
    },
  );

  // Step 2: Process {{#if key}}...{{else}}...{{/if}} and {{#if key}}...{{/if}}
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
    (_match, key: string, ifBranch: string, elseBranch?: string) => {
      const value = variables[key];
      const isTruthy = Boolean(value);
      if (isTruthy) {
        return ifBranch;
      }
      return elseBranch ?? '';
    },
  );

  // Step 3: Process simple {{key}} placeholders
  result = result.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    if (key in variables) {
      return String(variables[key]);
    }
    return `{{${key}}}`;
  });

  return result;
}

// ---------------------------------------------------------------------------
// Template metadata and registry
// ---------------------------------------------------------------------------

/** Metadata describing a single template's purpose and variable requirements. */
export interface TemplateMeta {
  name: string;
  purpose: string;
  requiredVariables: string[];
  optionalVariables: string[];
  outputFormat: string;
}

/** Result from registry.get() — metadata plus loaded content. */
export interface TemplateEntry {
  meta: TemplateMeta;
  content: string;
}

/** The registry API surface. */
export interface TemplateRegistry {
  listAll(): TemplateMeta[];
  get(name: string): Promise<TemplateEntry | null>;
  getNames(): string[];
  register(meta: TemplateMeta, content: string): void;
}

/**
 * Built-in registry metadata for all 7 VTM templates.
 *
 * Required/optional variables are derived from analyzing the actual template
 * content and the corresponding Zod schemas in types.ts.
 */
const BUILT_IN_REGISTRY: ReadonlyArray<TemplateMeta> = Object.freeze([
  {
    name: 'vision',
    purpose: 'Vision document guide for project conceptualization',
    requiredVariables: [
      'name',
      'date',
      'status',
      'dependsOn',
      'context',
      'vision',
      'problemStatement',
      'coreConcept',
      'architecture',
      'modules',
      'chipsetConfig',
      'successCriteria',
      'throughLine',
    ],
    optionalVariables: ['relationships'],
    outputFormat: 'markdown',
  },
  {
    name: 'milestone-spec',
    purpose: 'Milestone specification with component breakdown and model rationale',
    requiredVariables: [
      'name',
      'date',
      'visionDocument',
      'estimatedExecution',
      'missionObjective',
      'architectureOverview',
      'deliverables',
      'componentBreakdown',
      'modelRationale',
    ],
    optionalVariables: [
      'researchReference',
      'systemLayers',
      'crossComponentInterfaces',
      'safetyBoundaries',
      'preComputedKnowledge',
    ],
    outputFormat: 'markdown',
  },
  {
    name: 'component-spec',
    purpose: 'Self-contained build instruction for one pipeline component',
    requiredVariables: [
      'name',
      'milestone',
      'wave',
      'modelAssignment',
      'estimatedTokens',
      'dependencies',
      'produces',
      'objective',
      'context',
      'technicalSpec',
      'implementationSteps',
      'testCases',
      'verificationGate',
    ],
    optionalVariables: ['safetyBoundaries'],
    outputFormat: 'markdown',
  },
  {
    name: 'wave-plan',
    purpose: 'Multi-wave parallel execution plan with dependency tracking',
    requiredVariables: [
      'milestoneName',
      'milestoneSpec',
      'totalTasks',
      'parallelTracks',
      'sequentialDepth',
      'estimatedWallTime',
      'criticalPath',
      'waveSummary',
      'waves',
    ],
    optionalVariables: ['cacheOptimization', 'dependencyGraph', 'riskFactors'],
    outputFormat: 'markdown',
  },
  {
    name: 'test-plan',
    purpose: 'Categorized test plan with verification matrix',
    requiredVariables: [
      'milestoneName',
      'milestoneSpec',
      'visionDocument',
      'totalTests',
      'safetyCriticalCount',
      'targetCoverage',
      'categories',
      'tests',
      'verificationMatrix',
    ],
    optionalVariables: [],
    outputFormat: 'markdown',
  },
  {
    name: 'readme',
    purpose: 'Mission package readme with execution summary and usage instructions',
    requiredVariables: [
      'milestoneName',
      'date',
      'status',
      'visionDocument',
      'contents',
      'howToUse',
      'executionSummary',
    ],
    optionalVariables: ['researchReference', 'dependencies', 'notes'],
    outputFormat: 'markdown',
  },
  {
    name: 'research-reference',
    purpose: 'Research reference compilation with topics and bibliography',
    requiredVariables: [
      'name',
      'date',
      'status',
      'sourceDocument',
      'purpose',
      'howToUse',
      'sourceOrganizations',
      'topics',
    ],
    optionalVariables: ['integrationNotes'],
    outputFormat: 'markdown',
  },
]);

/**
 * Creates a template registry instance.
 *
 * Factory function (not a class) following existing VTM module patterns.
 * Returns a registry object with listAll(), get(), getNames(), and register().
 *
 * Custom templates can be added via register() and will appear in listAll()
 * and getNames(). Custom templates with the same name as a built-in template
 * will override it.
 *
 * @param basePath - Optional base directory for loading built-in templates
 * @returns TemplateRegistry instance
 */
export function createTemplateRegistry(basePath?: string): TemplateRegistry {
  const customTemplates = new Map<string, { meta: TemplateMeta; content: string }>();
  const resolvedBasePath = basePath ?? DEFAULT_BASE_PATH;

  return {
    listAll(): TemplateMeta[] {
      // Start with built-in templates, then override/add custom ones
      const metaMap = new Map<string, TemplateMeta>();
      for (const meta of BUILT_IN_REGISTRY) {
        metaMap.set(meta.name, meta);
      }
      for (const [name, entry] of customTemplates) {
        metaMap.set(name, entry.meta);
      }
      return Array.from(metaMap.values());
    },

    async get(name: string): Promise<TemplateEntry | null> {
      // Check custom templates first (overrides built-in)
      const custom = customTemplates.get(name);
      if (custom) {
        return { meta: custom.meta, content: custom.content };
      }

      // Check if it's a known built-in template
      const builtInMeta = BUILT_IN_REGISTRY.find((m) => m.name === name);
      if (!builtInMeta) {
        return null;
      }

      // Load from disk
      const loaded = await loadTemplate(name, { basePath: resolvedBasePath });
      if (!loaded) {
        return null;
      }

      return { meta: builtInMeta, content: loaded.content };
    },

    getNames(): string[] {
      const nameSet = new Set<string>();
      for (const meta of BUILT_IN_REGISTRY) {
        nameSet.add(meta.name);
      }
      for (const name of customTemplates.keys()) {
        nameSet.add(name);
      }
      return Array.from(nameSet).sort();
    },

    register(meta: TemplateMeta, content: string): void {
      customTemplates.set(meta.name, { meta, content });
    },
  };
}

// ---------------------------------------------------------------------------
// Template validator
// ---------------------------------------------------------------------------

/** A single diagnostic produced by template validation. */
export interface TemplateDiagnostic {
  severity: 'error' | 'warning';
  /** Field path (e.g. "name", "chipsetConfig.skills") or placeholder name. */
  section: string;
  message: string;
  /** Line number in rendered output where issue found, if determinable. */
  line?: number;
}

/** Result returned by validateRenderedTemplate. */
export interface ValidationResult {
  valid: boolean;
  errors: TemplateDiagnostic[];
  warnings: TemplateDiagnostic[];
}

/**
 * Maps template names to their corresponding Zod schemas.
 *
 * 'readme' maps to null because README is freeform markdown with no
 * structured schema to validate against.
 */
const TEMPLATE_SCHEMA_MAP: Record<string, z.ZodTypeAny | null> = {
  'vision': VisionDocumentSchema,
  'milestone-spec': MilestoneSpecSchema,
  'component-spec': ComponentSpecSchema,
  'wave-plan': WaveExecutionPlanSchema,
  'test-plan': TestPlanSchema,
  'readme': null,
  'research-reference': ResearchReferenceSchema,
};

/**
 * Validates rendered template output against the corresponding Zod schema.
 *
 * Produces structured diagnostics:
 * - Schema violations are errors (severity 'error')
 * - Unresolved {{placeholder}} tokens are warnings (severity 'warning')
 * - Unresolved block tokens ({{#if}}, {{#each}}, {{/if}}, {{/each}}, {{else}})
 *   are warnings
 *
 * Warnings do not affect validity — a result with only warnings is still valid.
 *
 * @param templateName - Logical template name (e.g. 'vision', 'component-spec')
 * @param renderedContent - The rendered template output to scan for unresolved tokens
 * @param parsedData - Optional parsed data object to validate against the Zod schema
 * @returns ValidationResult with valid flag, errors array, and warnings array
 */
export function validateRenderedTemplate(
  templateName: string,
  renderedContent: string,
  parsedData?: unknown,
): ValidationResult {
  const errors: TemplateDiagnostic[] = [];
  const warnings: TemplateDiagnostic[] = [];

  // Step 1: Look up schema. Unknown template name is an error.
  if (!(templateName in TEMPLATE_SCHEMA_MAP)) {
    return {
      valid: false,
      errors: [
        {
          severity: 'error',
          section: 'templateName',
          message: `Unknown template name: ${templateName}`,
        },
      ],
      warnings: [],
    };
  }

  const schema = TEMPLATE_SCHEMA_MAP[templateName];

  // Step 2: If parsedData is provided and schema exists, run Zod safeParse.
  if (parsedData !== undefined && schema !== null) {
    const result = schema.safeParse(parsedData);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          severity: 'error',
          section: issue.path.map(String).join('.') || templateName,
          message: issue.message,
        });
      }
    }
  }

  // Step 3: Scan renderedContent for unresolved {{placeholder}} tokens.
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const seenPlaceholders = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = placeholderRegex.exec(renderedContent)) !== null) {
    const name = match[1];
    if (!seenPlaceholders.has(name)) {
      seenPlaceholders.add(name);
      // Compute line number (1-based) by counting newlines before match position
      const textBefore = renderedContent.slice(0, match.index);
      const line = textBefore.split('\n').length;
      warnings.push({
        severity: 'warning',
        section: name,
        message: `Unresolved placeholder: {{${name}}}`,
        line,
      });
    }
  }

  // Step 4: Detect unresolved block tokens in rendered content.
  const blockTokenRegex = /(\{\{#if\s+\w+\}\}|\{\{#each\s+\w+\}\}|\{\{\/if\}\}|\{\{\/each\}\}|\{\{else\}\})/g;
  let blockMatch: RegExpExecArray | null;

  while ((blockMatch = blockTokenRegex.exec(renderedContent)) !== null) {
    const token = blockMatch[1];
    const textBefore = renderedContent.slice(0, blockMatch.index);
    const line = textBefore.split('\n').length;
    warnings.push({
      severity: 'warning',
      section: 'block-token',
      message: `Unresolved block token: ${token}`,
      line,
    });
  }

  // Step 5: Return result. Valid when no errors, regardless of warnings.
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
