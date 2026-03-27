/**
 * Structure analyzer: parses Python source files to map class hierarchy,
 * method signatures, module dependencies, and docstrings.
 *
 * Phase 405 Plan 01 -- Track A of the learn engine.
 */

import type { RepoManifest } from '../types.js';

// --- Rich analysis types (extend the simpler types.ts shapes) ---

export interface ParameterInfo {
  name: string;
  type: string | null;
  default: string | null;
  isRequired: boolean;
}

export interface MethodInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType: string | null;
  docstring: string | null;
  isPublic: boolean;
  isOverride: boolean;
}

export interface ImportInfo {
  module: string;
  names: string[];
  isRelative: boolean;
}

export interface AnalyzedClassNode {
  name: string;
  module: string;
  bases: string[];
  docstring: string | null;
  methods: MethodInfo[];
  isAbstract: boolean;
  isPublic: boolean;
}

export interface AnalyzedModuleNode {
  path: string;
  classes: string[];
  functions: string[];
  imports: ImportInfo[];
  linesOfCode: number;
}

export interface AnalyzeResult {
  classes: AnalyzedClassNode[];
  modules: AnalyzedModuleNode[];
}

// --- Internal helpers ---

const MAX_DOCSTRING_LENGTH = 500;

/** Extract a triple-quoted docstring starting at the given line index. */
function extractDocstring(lines: string[], startIdx: number): { text: string | null; endIdx: number } {
  if (startIdx >= lines.length) return { text: null, endIdx: startIdx };

  const line = lines[startIdx];
  const trimmed = line.trimStart();

  // Check for triple-quote opening (""" or ''')
  for (const quote of ['"""', "'''"]) {
    const qIdx = trimmed.indexOf(quote);
    if (qIdx !== 0) continue;

    const afterOpen = trimmed.slice(quote.length);

    // Single-line docstring: """text"""
    const closeIdx = afterOpen.indexOf(quote);
    if (closeIdx >= 0) {
      const text = afterOpen.slice(0, closeIdx).trim();
      return { text: text.length > 0 ? text.slice(0, MAX_DOCSTRING_LENGTH) : null, endIdx: startIdx };
    }

    // Multi-line docstring
    const parts: string[] = [afterOpen];
    let idx = startIdx + 1;
    while (idx < lines.length) {
      const l = lines[idx];
      const ci = l.indexOf(quote);
      if (ci >= 0) {
        parts.push(l.slice(0, ci));
        const raw = parts.join('\n').trim();
        return { text: raw.length > 0 ? raw.slice(0, MAX_DOCSTRING_LENGTH) : null, endIdx: idx };
      }
      parts.push(l);
      idx++;
    }
    // Unterminated docstring -- return what we have
    const raw = parts.join('\n').trim();
    return { text: raw.length > 0 ? raw.slice(0, MAX_DOCSTRING_LENGTH) : null, endIdx: idx - 1 };
  }

  return { text: null, endIdx: startIdx };
}

/** Parse Python import statements from a line. */
function parseImport(line: string): ImportInfo | null {
  const trimmed = line.trimStart();

  // from X import Y, Z
  const fromMatch = trimmed.match(/^from\s+(\.{0,3}\S*)\s+import\s+(.+)$/);
  if (fromMatch) {
    const mod = fromMatch[1];
    const names = fromMatch[2].split(',').map(n => n.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
    return { module: mod, names, isRelative: mod.startsWith('.') };
  }

  // import X, Y
  const importMatch = trimmed.match(/^import\s+(.+)$/);
  if (importMatch) {
    const parts = importMatch[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
    return { module: parts[0], names: parts, isRelative: false };
  }

  return null;
}

/** Parse a Python parameter string (everything after 'self,' or just 'self'). */
function parseParameters(paramStr: string): ParameterInfo[] {
  if (!paramStr || paramStr.trim().length === 0) return [];

  const params: ParameterInfo[] = [];
  let depth = 0;
  let current = '';

  // Split on commas respecting parens/brackets
  for (const ch of paramStr) {
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (ch === ',' && depth === 0) {
      if (current.trim()) params.push(parseSingleParam(current.trim()));
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) params.push(parseSingleParam(current.trim()));

  return params;
}

/** Parse a single Python parameter like "X: np.ndarray = None". */
function parseSingleParam(raw: string): ParameterInfo {
  // Handle bare * (keyword-only separator)
  if (raw === '*') {
    return { name: '*', type: null, default: null, isRequired: false };
  }

  let name = raw;
  let type: string | null = null;
  let defaultVal: string | null = null;

  // Check for default value (respecting nested parens)
  const eqIdx = findTopLevelChar(raw, '=');
  if (eqIdx >= 0) {
    defaultVal = raw.slice(eqIdx + 1).trim();
    name = raw.slice(0, eqIdx).trim();
  }

  // Check for type annotation
  const colonIdx = findTopLevelChar(name, ':');
  if (colonIdx >= 0) {
    type = name.slice(colonIdx + 1).trim();
    name = name.slice(0, colonIdx).trim();
  }

  // Strip leading * or **
  if (name.startsWith('**')) name = name.slice(2);
  else if (name.startsWith('*')) name = name.slice(1);

  return {
    name,
    type: type || null,
    default: defaultVal || null,
    isRequired: defaultVal === null,
  };
}

/** Find the index of a character at the top level (not inside parens/brackets). */
function findTopLevelChar(s: string, ch: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === ch && depth === 0) return i;
  }
  return -1;
}

/** Get the indentation level (number of leading spaces) of a line. */
function indentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

// --- Core parsing ---

interface RawClassInfo {
  name: string;
  bases: string[];
  docstring: string | null;
  methods: MethodInfo[];
  isAbstract: boolean;
  isPublic: boolean;
  startLine: number;
}

/** Parse all classes and module-level functions from a Python source string. */
function parseSource(content: string, filePath: string): {
  classes: RawClassInfo[];
  functions: string[];
  imports: ImportInfo[];
  linesOfCode: number;
} {
  const lines = content.split('\n');
  const classes: RawClassInfo[] = [];
  const functions: string[] = [];
  const imports: ImportInfo[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const indent = indentLevel(line);

    // Parse imports (top level only, indent === 0)
    if (indent === 0) {
      const imp = parseImport(line);
      if (imp) {
        imports.push(imp);
        i++;
        continue;
      }
    }

    // Parse class definition (top level, indent === 0)
    const classMatch = trimmed.match(/^class\s+(\w+)\s*\(([^)]*)\)\s*:/);
    if (classMatch && indent === 0) {
      const className = classMatch[1];
      const basesStr = classMatch[2];
      const bases = basesStr.split(',').map(b => b.trim()).filter(Boolean);

      const hasAbcBase = bases.some(b => b === 'ABC' || b === 'abc.ABC');
      let isAbstract = hasAbcBase;
      const isPublic = !className.startsWith('_');

      // Check for class docstring on next line
      const { text: classDoc, endIdx: docEnd } = extractDocstring(lines, i + 1);
      let methodStart = classDoc !== null ? docEnd + 1 : i + 1;

      // Parse methods within this class body
      const methods: MethodInfo[] = [];
      let j = methodStart;
      while (j < lines.length) {
        const mLine = lines[j];
        const mTrimmed = mLine.trimStart();
        const mIndent = indentLevel(mLine);

        // End of class body: back to indent 0 and non-empty
        if (mTrimmed.length > 0 && mIndent === 0) break;

        // Decorator check
        let hasAbstractDecorator = false;
        if (mTrimmed.startsWith('@abstractmethod')) {
          hasAbstractDecorator = true;
          isAbstract = true;
          j++;
          continue;
        }
        if (mTrimmed.startsWith('@')) {
          // Other decorator -- skip
          if (mTrimmed === '@abstractmethod') hasAbstractDecorator = true;
          j++;
          continue;
        }

        // Method definition
        const defMatch = mTrimmed.match(/^def\s+(\w+)\s*\((.*)$/);
        if (defMatch && mIndent > 0) {
          const methodName = defMatch[1];

          // Filter dunder methods except __init__
          if (methodName.startsWith('__') && methodName.endsWith('__') && methodName !== '__init__') {
            // Check for decorator on previous line
            j++;
            // Skip method body
            while (j < lines.length) {
              const bl = lines[j];
              const bi = indentLevel(bl);
              if (bl.trimStart().length > 0 && bi <= mIndent) break;
              j++;
            }
            hasAbstractDecorator = false;
            continue;
          }

          // Collect full signature (may span multiple lines if parens not closed)
          let sigRaw = defMatch[2];
          let sigLineIdx = j;
          while (!sigRaw.includes('):') && !sigRaw.match(/\)\s*(->.*)?:/) && sigLineIdx < lines.length - 1) {
            sigLineIdx++;
            sigRaw += ' ' + lines[sigLineIdx].trim();
          }

          // Extract return type and parameter string
          let returnType: string | null = null;
          let paramSection = sigRaw;

          // Find the closing paren and extract return type
          const closingMatch = paramSection.match(/^(.*?)\)\s*(?:->\s*(.+?))?\s*:/);
          if (closingMatch) {
            paramSection = closingMatch[1];
            returnType = closingMatch[2]?.trim() || null;
          }

          // Strip 'self' from parameters
          let cleanParams = paramSection.trim();
          if (cleanParams.startsWith('self')) {
            cleanParams = cleanParams.replace(/^self\s*,?\s*/, '');
          }

          const parameters = parseParameters(cleanParams);

          // Check for method docstring
          const { text: methodDoc, endIdx: mDocEnd } = extractDocstring(lines, sigLineIdx + 1);

          // Check if previous non-empty line was @abstractmethod
          let isAbstractMethod = hasAbstractDecorator;
          if (!isAbstractMethod) {
            // Look back for decorator
            let lookBack = j - 1;
            while (lookBack >= 0 && lines[lookBack].trim().length === 0) lookBack--;
            if (lookBack >= 0 && lines[lookBack].trimStart() === '@abstractmethod') {
              isAbstractMethod = true;
              isAbstract = true;
            }
          }

          methods.push({
            name: methodName,
            parameters,
            returnType,
            docstring: methodDoc,
            isPublic: !methodName.startsWith('_') || methodName === '__init__',
            isOverride: false, // resolved in post-processing
          });

          j = methodDoc !== null ? mDocEnd + 1 : sigLineIdx + 1;
          hasAbstractDecorator = false;
          continue;
        }

        j++;
        hasAbstractDecorator = false;
      }

      classes.push({
        name: className,
        bases,
        docstring: classDoc,
        methods,
        isAbstract,
        isPublic,
        startLine: i,
      });
      i = j;
      continue;
    }

    // Parse module-level functions (indent === 0)
    const funcMatch = trimmed.match(/^def\s+(\w+)\s*\(/);
    if (funcMatch && indent === 0) {
      functions.push(funcMatch[1]);
      i++;
      continue;
    }

    i++;
  }

  // Count non-empty, non-comment lines
  const linesOfCode = lines.filter(l => {
    const t = l.trim();
    return t.length > 0 && !t.startsWith('#');
  }).length;

  return { classes, functions, imports, linesOfCode };
}

/** Convert file path to Python module notation. */
function pathToModule(filePath: string): string {
  return filePath
    .replace(/\.py$/, '')
    .replace(/\//g, '.')
    .replace(/__init__$/, '')
    .replace(/\.$/, '');
}

// --- Main export ---

/** Analyze Python source files to extract class hierarchy and module structure. */
export function analyzeStructure(
  sources: { path: string; content: string }[],
  _manifest: RepoManifest,
): AnalyzeResult {
  const allClasses: AnalyzedClassNode[] = [];
  const allModules: AnalyzedModuleNode[] = [];

  // Phase 1: Parse each source file
  for (const { path, content } of sources) {
    const parsed = parseSource(content, path);
    const moduleName = pathToModule(path);

    for (const cls of parsed.classes) {
      allClasses.push({
        name: cls.name,
        module: moduleName,
        bases: cls.bases,
        docstring: cls.docstring,
        methods: cls.methods,
        isAbstract: cls.isAbstract,
        isPublic: cls.isPublic,
      });
    }

    allModules.push({
      path,
      classes: parsed.classes.map(c => c.name),
      functions: parsed.functions,
      imports: parsed.imports,
      linesOfCode: parsed.linesOfCode,
    });
  }

  // Phase 2: Resolve inheritance overrides
  const classMap = new Map<string, AnalyzedClassNode>();
  for (const cls of allClasses) {
    classMap.set(cls.name, cls);
  }

  for (const cls of allClasses) {
    for (const baseName of cls.bases) {
      const baseClass = classMap.get(baseName);
      if (!baseClass) continue;
      const baseMethodNames = new Set(baseClass.methods.map(m => m.name));
      for (const method of cls.methods) {
        if (baseMethodNames.has(method.name)) {
          method.isOverride = true;
        }
      }
    }
  }

  return { classes: allClasses, modules: allModules };
}
