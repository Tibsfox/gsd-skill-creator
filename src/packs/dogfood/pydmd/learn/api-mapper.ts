/**
 * API surface mapper: catalogs shared interface, variant extensions,
 * and plotter API from analyzed class hierarchy.
 *
 * Phase 405 Plan 01 -- Track A of the learn engine.
 */

import type { AnalyzedClassNode, AnalyzedModuleNode, MethodInfo, ParameterInfo } from './structure-analyzer.js';

// --- API surface types ---

export interface AnalyzedAPIMethod {
  name: string;
  signature: string;
  description: string;
  examples: string[];
  returnDescription: string;
}

export interface APIProperty {
  name: string;
  type: string;
  description: string;
  readOnly: boolean;
}

export interface APIParameter {
  name: string;
  type: string;
  default: string | null;
  description: string;
}

export interface APISurface {
  sharedInterface: {
    methods: AnalyzedAPIMethod[];
    properties: APIProperty[];
  };
  variantExtensions: {
    className: string;
    additionalMethods: AnalyzedAPIMethod[];
    additionalParameters: APIParameter[];
    uniqueFeatures: string[];
  }[];
  plotterAPI: {
    functions: AnalyzedAPIMethod[];
  };
}

// --- Internal helpers ---

const FALLBACK_DESCRIPTION = 'No description available';

/** Feature keywords to detect in docstrings for uniqueFeatures extraction. */
const FEATURE_KEYWORDS = [
  'multi-resolution', 'compressed', 'sparsity-promoting', 'control',
  'forward-backward', 'optimal', 'hankel', 'higher-order', 'subspace',
  'randomized', 'extended', 'bayesian', 'parametric',
];

/** Check if a method looks like a property (no parameters, returns a value). */
function isPropertyLike(method: MethodInfo): boolean {
  // Properties are methods with no parameters (other than self, which is already stripped)
  return method.parameters.length === 0 && method.name !== '__init__';
}

/** Build a signature string from a method, stripping self. */
function buildSignature(method: MethodInfo): string {
  const params = method.parameters
    .map(p => {
      let s = p.name;
      if (p.type) s += `: ${p.type}`;
      if (p.default !== null) s += ` = ${p.default}`;
      return s;
    })
    .join(', ');
  return `${method.name}(${params})`;
}

/** Extract the first line of a docstring as a description. */
function extractDescription(docstring: string | null): string {
  if (!docstring) return FALLBACK_DESCRIPTION;
  const firstLine = docstring.split('\n')[0].trim();
  return firstLine.length > 0 ? firstLine : FALLBACK_DESCRIPTION;
}

/** Extract a return description from a docstring. */
function extractReturnDescription(docstring: string | null): string {
  if (!docstring) return '';
  const lines = docstring.split('\n');
  let inReturns = false;
  const parts: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^returns?\s*:/i.test(trimmed)) {
      inReturns = true;
      const afterColon = trimmed.replace(/^returns?\s*:\s*/i, '').trim();
      if (afterColon) parts.push(afterColon);
      continue;
    }
    if (inReturns) {
      if (trimmed.length === 0 || /^\w.*:/.test(trimmed)) break;
      parts.push(trimmed);
    }
  }
  return parts.join(' ').trim();
}

/** Extract code examples from a docstring. */
function extractExamples(docstring: string | null): string[] {
  if (!docstring) return [];
  const lines = docstring.split('\n');
  let inExample = false;
  const examples: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^examples?\s*:/i.test(trimmed)) {
      inExample = true;
      continue;
    }
    if (inExample) {
      if (trimmed.length === 0 && current.length > 0) {
        examples.push(current.join('\n'));
        current = [];
      } else if (trimmed.length > 0 && !trimmed.startsWith('>>>')) {
        // Check if we're still in indented code block
        if (line.startsWith('    ') || line.startsWith('\t')) {
          current.push(trimmed);
        } else {
          if (current.length > 0) examples.push(current.join('\n'));
          current = [];
          inExample = false;
        }
      } else if (trimmed.length > 0) {
        current.push(trimmed);
      }
    }
  }
  if (current.length > 0) examples.push(current.join('\n'));
  return examples;
}

/** Convert a MethodInfo to an AnalyzedAPIMethod. */
function methodToAPI(method: MethodInfo): AnalyzedAPIMethod {
  return {
    name: method.name,
    signature: buildSignature(method),
    description: extractDescription(method.docstring),
    examples: extractExamples(method.docstring),
    returnDescription: extractReturnDescription(method.docstring),
  };
}

/** Convert a property-like MethodInfo to an APIProperty. */
function methodToProperty(method: MethodInfo): APIProperty {
  return {
    name: method.name,
    type: method.returnType || 'Any',
    description: extractDescription(method.docstring),
    readOnly: true,
  };
}

/** Extract unique features from a class (docstring + method docs). */
function extractUniqueFeatures(cls: AnalyzedClassNode): string[] {
  const features: string[] = [];
  const text = [
    cls.docstring || '',
    ...cls.methods.map(m => m.docstring || ''),
  ].join(' ').toLowerCase();

  for (const kw of FEATURE_KEYWORDS) {
    if (text.includes(kw)) {
      features.push(kw);
    }
  }
  return features;
}

/** Find the base class from a set of classes. */
function findBaseClass(classes: AnalyzedClassNode[]): AnalyzedClassNode | null {
  // Strategy 1: Explicit abstract class
  const abstractClasses = classes.filter(c => c.isAbstract);
  if (abstractClasses.length === 1) return abstractClasses[0];

  // Strategy 2: Class named *Base
  const baseNamed = classes.find(c => c.name.endsWith('Base'));
  if (baseNamed) return baseNamed;

  // Strategy 3: Most referenced as a base
  const baseCounts = new Map<string, number>();
  for (const cls of classes) {
    for (const b of cls.bases) {
      baseCounts.set(b, (baseCounts.get(b) || 0) + 1);
    }
  }
  let maxCount = 0;
  let maxBase: string | null = null;
  for (const [name, count] of baseCounts) {
    if (count > maxCount) {
      maxCount = count;
      maxBase = name;
    }
  }
  if (maxBase) return classes.find(c => c.name === maxBase) || null;

  return null;
}

// --- Main export ---

/** Map the public API surface from analyzed class hierarchy and module data. */
export function mapAPISurface(
  classes: AnalyzedClassNode[],
  modules: AnalyzedModuleNode[],
): APISurface {
  const baseClass = findBaseClass(classes);

  // Shared interface from base class
  const sharedMethods: AnalyzedAPIMethod[] = [];
  const sharedProperties: APIProperty[] = [];

  if (baseClass) {
    for (const method of baseClass.methods) {
      if (!method.isPublic && method.name !== '__init__') continue;
      if (method.name === '__init__') continue; // __init__ is not part of shared API surface

      if (isPropertyLike(method)) {
        sharedProperties.push(methodToProperty(method));
      } else {
        sharedMethods.push(methodToAPI(method));
      }
    }
  }

  // Sort alphabetically
  sharedMethods.sort((a, b) => a.name.localeCompare(b.name));
  sharedProperties.sort((a, b) => a.name.localeCompare(b.name));

  // Variant extensions: non-base classes
  const baseMethodNames = baseClass
    ? new Set(baseClass.methods.map(m => m.name))
    : new Set<string>();

  const baseInitParams = baseClass
    ? new Set(
        (baseClass.methods.find(m => m.name === '__init__')?.parameters || []).map(p => p.name),
      )
    : new Set<string>();

  const variantExtensions = classes
    .filter(c => c !== baseClass && !c.isAbstract)
    .map(cls => {
      // Additional methods: not in base class, not overrides of base, not __init__
      const additionalMethods = cls.methods
        .filter(m => !baseMethodNames.has(m.name) && m.name !== '__init__' && m.isPublic)
        .map(methodToAPI)
        .sort((a, b) => a.name.localeCompare(b.name));

      // Additional parameters: __init__ params not in base __init__
      const clsInit = cls.methods.find(m => m.name === '__init__');
      const additionalParameters: APIParameter[] = clsInit
        ? clsInit.parameters
            .filter(p => !baseInitParams.has(p.name))
            .map(p => ({
              name: p.name,
              type: p.type || 'Any',
              default: p.default,
              description: extractDescription(clsInit.docstring),
            }))
        : [];

      const uniqueFeatures = extractUniqueFeatures(cls);

      return {
        className: cls.name,
        additionalMethods,
        additionalParameters,
        uniqueFeatures,
      };
    });

  // Plotter API: functions from modules with "plotter" in path
  const plotterFunctions: AnalyzedAPIMethod[] = [];
  for (const mod of modules) {
    if (mod.path.toLowerCase().includes('plotter')) {
      for (const funcName of mod.functions) {
        plotterFunctions.push({
          name: funcName,
          signature: `${funcName}()`,
          description: FALLBACK_DESCRIPTION,
          examples: [],
          returnDescription: '',
        });
      }
    }
  }
  plotterFunctions.sort((a, b) => a.name.localeCompare(b.name));

  return {
    sharedInterface: {
      methods: sharedMethods,
      properties: sharedProperties,
    },
    variantExtensions,
    plotterAPI: {
      functions: plotterFunctions,
    },
  };
}
