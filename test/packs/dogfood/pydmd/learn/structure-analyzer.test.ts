import { describe, it, expect } from 'vitest';
import {
  analyzeStructure,
  type AnalyzedClassNode,
  type AnalyzedModuleNode,
  type MethodInfo,
  type ParameterInfo,
  type ImportInfo,
} from '../../../../../src/dogfood/pydmd/learn/structure-analyzer.js';
import type { RepoManifest } from '../../../../../src/dogfood/pydmd/types.js';

// --- Factories ---

function makePythonMethod(
  name: string,
  params: string[] = [],
  options: { docstring?: string; decorator?: string; returnType?: string } = {},
): string {
  const lines: string[] = [];
  if (options.decorator) lines.push(`    ${options.decorator}`);
  const allParams = ['self', ...params].join(', ');
  const ret = options.returnType ? ` -> ${options.returnType}` : '';
  lines.push(`    def ${name}(${allParams})${ret}:`);
  if (options.docstring) {
    lines.push(`        """${options.docstring}"""`);
  }
  lines.push('        pass');
  return lines.join('\n');
}

function makePythonSource(
  className: string,
  bases: string[] = ['object'],
  methods: string[] = [],
  options: { docstring?: string; isAbstract?: boolean; extraBody?: string } = {},
): string {
  const lines: string[] = [];
  lines.push('import numpy as np');
  if (options.isAbstract) {
    lines.push('from abc import ABC, abstractmethod');
  }
  lines.push('');
  const basesStr = bases.join(', ');
  lines.push(`class ${className}(${basesStr}):`);
  if (options.docstring) {
    lines.push(`    """${options.docstring}"""`);
  }
  if (options.extraBody) {
    lines.push(options.extraBody);
  }
  if (methods.length === 0 && !options.extraBody) {
    lines.push('    pass');
  }
  for (const m of methods) {
    lines.push(m);
  }
  return lines.join('\n');
}

function makeRepoManifest(overrides: Partial<RepoManifest> = {}): RepoManifest {
  return {
    url: 'https://github.com/PyDMD/PyDMD',
    localPath: '/tmp/pydmd',
    language: 'python',
    buildSystem: 'pyproject.toml',
    pythonVersion: '3.11',
    dependencies: { core: ['numpy'], test: ['pytest'], dev: ['black'] },
    testFramework: 'pytest',
    healthCheck: { passed: 100, failed: 0, skipped: 2, errors: [] },
    structure: { sourceDir: 'pydmd/', testDir: 'tests/', tutorialDir: 'tutorials/', docsDir: 'docs/' },
    entryPoints: ['pydmd/__init__.py'],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// --- Tests ---

describe('analyzeStructure', () => {
  describe('class hierarchy parsing (LRN-01)', () => {
    it('should parse a basic class definition with methods', () => {
      const source = makePythonSource('DMD', ['DMDBase'], [
        makePythonMethod('fit', ['X', 't=None']),
        makePythonMethod('predict', ['X']),
      ]);
      const { classes } = analyzeStructure(
        [{ path: 'pydmd/dmd.py', content: source }],
        makeRepoManifest(),
      );
      expect(classes).toHaveLength(1);
      expect(classes[0].name).toBe('DMD');
      expect(classes[0].bases).toContain('DMDBase');
      expect(classes[0].methods.length).toBeGreaterThanOrEqual(2);
    });

    it('should return one ClassNode per class from multiple files', () => {
      const src1 = makePythonSource('DMD', ['DMDBase'], [makePythonMethod('fit', ['X'])]);
      const src2 = makePythonSource('BOPDMD', ['DMDBase'], [makePythonMethod('fit', ['X'])]);
      const { classes } = analyzeStructure(
        [
          { path: 'pydmd/dmd.py', content: src1 },
          { path: 'pydmd/bopdmd.py', content: src2 },
        ],
        makeRepoManifest(),
      );
      expect(classes).toHaveLength(2);
      const names = classes.map(c => c.name);
      expect(names).toContain('DMD');
      expect(names).toContain('BOPDMD');
    });

    it('should detect abstract classes via ABC base or @abstractmethod', () => {
      const source = makePythonSource('DMDBase', ['ABC'], [
        makePythonMethod('fit', ['X'], { decorator: '@abstractmethod' }),
      ], { isAbstract: true });
      const { classes } = analyzeStructure(
        [{ path: 'pydmd/dmdbase.py', content: source }],
        makeRepoManifest(),
      );
      expect(classes[0].isAbstract).toBe(true);
    });

    it('should mark underscore-prefixed classes as not public', () => {
      const source = makePythonSource('_InternalHelper', ['object'], [
        makePythonMethod('run', []),
      ]);
      const { classes } = analyzeStructure(
        [{ path: 'pydmd/_helper.py', content: source }],
        makeRepoManifest(),
      );
      expect(classes[0].isPublic).toBe(false);
    });
  });

  describe('inheritance tree resolution', () => {
    it('should resolve full DMDBase tree with multiple variants', () => {
      const base = makePythonSource('DMDBase', ['ABC'], [
        makePythonMethod('fit', ['X'], { decorator: '@abstractmethod' }),
        makePythonMethod('reconstructed_data', []),
      ], { isAbstract: true });
      const dmd = makePythonSource('DMD', ['DMDBase'], [
        makePythonMethod('fit', ['X']),
      ]);
      const bopdmd = makePythonSource('BOPDMD', ['DMDBase'], [
        makePythonMethod('fit', ['X']),
      ]);
      const mrdmd = makePythonSource('MrDMD', ['DMDBase'], [
        makePythonMethod('fit', ['X']),
      ]);
      const { classes } = analyzeStructure(
        [
          { path: 'pydmd/dmdbase.py', content: base },
          { path: 'pydmd/dmd.py', content: dmd },
          { path: 'pydmd/bopdmd.py', content: bopdmd },
          { path: 'pydmd/mrdmd.py', content: mrdmd },
        ],
        makeRepoManifest(),
      );
      const dmdNode = classes.find(c => c.name === 'DMD')!;
      const bopNode = classes.find(c => c.name === 'BOPDMD')!;
      const mrNode = classes.find(c => c.name === 'MrDMD')!;
      expect(dmdNode.bases).toContain('DMDBase');
      expect(bopNode.bases).toContain('DMDBase');
      expect(mrNode.bases).toContain('DMDBase');
    });

    it('should keep unknown bases as-is without error', () => {
      const source = makePythonSource('Foo', ['SomeExternalBase'], [
        makePythonMethod('run', []),
      ]);
      const { classes } = analyzeStructure(
        [{ path: 'pydmd/foo.py', content: source }],
        makeRepoManifest(),
      );
      expect(classes[0].bases).toContain('SomeExternalBase');
    });

    it('should identify 15+ variant classes from a realistic set', () => {
      const variants = [
        'DMDBase', 'DMD', 'BOPDMD', 'MrDMD', 'CDMD', 'DMDc', 'FbDMD',
        'HankelDMD', 'HODMD', 'OptDMD', 'SpDMD', 'SubspaceDMD', 'RDMD',
        'EDMD', 'LANDO', 'ParametricDMD',
      ];
      const sources = variants.map((v, i) => ({
        path: `pydmd/${v.toLowerCase()}.py`,
        content: makePythonSource(
          v,
          i === 0 ? ['ABC'] : ['DMDBase'],
          [makePythonMethod('fit', ['X'])],
          i === 0 ? { isAbstract: true } : {},
        ),
      }));
      const { classes } = analyzeStructure(sources, makeRepoManifest());
      expect(classes.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('method extraction', () => {
    it('should parse parameters with defaults', () => {
      const source = makePythonSource('DMD', ['DMDBase'], [
        makePythonMethod('fit', ['X', 't=None']),
      ]);
      const { classes } = analyzeStructure(
        [{ path: 'pydmd/dmd.py', content: source }],
        makeRepoManifest(),
      );
      const fitMethod = classes[0].methods.find(m => m.name === 'fit')!;
      expect(fitMethod).toBeDefined();
      const xParam = fitMethod.parameters.find(p => p.name === 'X')!;
      expect(xParam.isRequired).toBe(true);
      const tParam = fitMethod.parameters.find(p => p.name === 't')!;
      expect(tParam.isRequired).toBe(false);
      expect(tParam.default).toBe('None');
    });

    it('should extract type hints and return types', () => {
      const src = [
        'import numpy as np',
        '',
        'class DMD(DMDBase):',
        '    def predict(self, X: np.ndarray) -> np.ndarray:',
        '        """Predict."""',
        '        pass',
      ].join('\n');
      const { classes } = analyzeStructure(
        [{ path: 'pydmd/dmd.py', content: src }],
        makeRepoManifest(),
      );
      const pred = classes[0].methods.find(m => m.name === 'predict')!;
      expect(pred).toBeDefined();
      expect(pred.returnType).toBe('np.ndarray');
      const xParam = pred.parameters.find(p => p.name === 'X')!;
      expect(xParam.type).toBe('np.ndarray');
    });

    it('should mark overridden methods', () => {
      const base = makePythonSource('DMDBase', ['ABC'], [
        makePythonMethod('fit', ['X'], { decorator: '@abstractmethod' }),
      ], { isAbstract: true });
      const child = makePythonSource('DMD', ['DMDBase'], [
        makePythonMethod('fit', ['X']),
      ]);
      const { classes } = analyzeStructure(
        [
          { path: 'pydmd/dmdbase.py', content: base },
          { path: 'pydmd/dmd.py', content: child },
        ],
        makeRepoManifest(),
      );
      const dmd = classes.find(c => c.name === 'DMD')!;
      const fit = dmd.methods.find(m => m.name === 'fit')!;
      expect(fit.isOverride).toBe(true);
    });

    it('should filter dunder methods except __init__', () => {
      const src = [
        'class DMD(DMDBase):',
        '    def __init__(self, svd_rank=-1):',
        '        pass',
        '    def __repr__(self):',
        '        return "DMD"',
        '    def __len__(self):',
        '        return 0',
        '    def fit(self, X):',
        '        pass',
      ].join('\n');
      const { classes } = analyzeStructure(
        [{ path: 'pydmd/dmd.py', content: src }],
        makeRepoManifest(),
      );
      const methodNames = classes[0].methods.map(m => m.name);
      expect(methodNames).toContain('__init__');
      expect(methodNames).toContain('fit');
      expect(methodNames).not.toContain('__repr__');
      expect(methodNames).not.toContain('__len__');
    });
  });

  describe('module mapping', () => {
    it('should produce ModuleNode per file with path, classes, functions, imports', () => {
      const src = [
        'from numpy import array',
        'from .dmdbase import DMDBase',
        '',
        'class DMD(DMDBase):',
        '    def fit(self, X):',
        '        pass',
        '',
        'def helper():',
        '    pass',
      ].join('\n');
      const { modules } = analyzeStructure(
        [{ path: 'pydmd/dmd.py', content: src }],
        makeRepoManifest(),
      );
      expect(modules).toHaveLength(1);
      expect(modules[0].path).toBe('pydmd/dmd.py');
      expect(modules[0].classes).toContain('DMD');
      expect(modules[0].functions).toContain('helper');
      expect(modules[0].imports.length).toBeGreaterThanOrEqual(1);
      expect(modules[0].linesOfCode).toBeGreaterThan(0);
    });

    it('should include __init__.py files with empty classes', () => {
      const src = [
        'from .dmd import DMD',
        'from .bopdmd import BOPDMD',
      ].join('\n');
      const { modules } = analyzeStructure(
        [{ path: 'pydmd/__init__.py', content: src }],
        makeRepoManifest(),
      );
      expect(modules).toHaveLength(1);
      expect(modules[0].classes).toHaveLength(0);
      expect(modules[0].imports.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('docstring extraction', () => {
    it('should extract triple-quoted docstrings', () => {
      const src = [
        'class DMD(DMDBase):',
        '    """Dynamic Mode Decomposition.',
        '',
        '    Implements the standard DMD algorithm.',
        '    """',
        '    def fit(self, X):',
        '        """Fit the DMD model."""',
        '        pass',
      ].join('\n');
      const { classes } = analyzeStructure(
        [{ path: 'pydmd/dmd.py', content: src }],
        makeRepoManifest(),
      );
      expect(classes[0].docstring).toContain('Dynamic Mode Decomposition');
      const fit = classes[0].methods.find(m => m.name === 'fit')!;
      expect(fit.docstring).toContain('Fit the DMD model');
    });

    it('should return null for missing docstrings', () => {
      const src = [
        'class DMD(DMDBase):',
        '    def fit(self, X):',
        '        pass',
      ].join('\n');
      const { classes } = analyzeStructure(
        [{ path: 'pydmd/dmd.py', content: src }],
        makeRepoManifest(),
      );
      expect(classes[0].docstring).toBeNull();
      const fit = classes[0].methods.find(m => m.name === 'fit')!;
      expect(fit.docstring).toBeNull();
    });

    it('should preserve LaTeX math expressions in docstrings', () => {
      const src = [
        'class DMD(DMDBase):',
        '    """DMD computes $A = U \\Sigma V^*$ decomposition.',
        '',
        '    Uses \\\\(X = U \\Sigma V^T\\\\) internally."""',
        '    pass',
      ].join('\n');
      const { classes } = analyzeStructure(
        [{ path: 'pydmd/dmd.py', content: src }],
        makeRepoManifest(),
      );
      expect(classes[0].docstring).toContain('$A = U \\Sigma V^*$');
      expect(classes[0].docstring).toContain('\\\\(X = U \\Sigma V^T\\\\)');
    });

    it('should truncate docstrings at 500 characters', () => {
      const longDoc = 'A'.repeat(600);
      const src = makePythonSource('DMD', ['DMDBase'], [], { docstring: longDoc });
      const { classes } = analyzeStructure(
        [{ path: 'pydmd/dmd.py', content: src }],
        makeRepoManifest(),
      );
      expect(classes[0].docstring!.length).toBeLessThanOrEqual(500);
    });
  });

  describe('edge cases', () => {
    it('should handle empty files without crashing', () => {
      const { classes, modules } = analyzeStructure(
        [{ path: 'pydmd/empty.py', content: '' }],
        makeRepoManifest(),
      );
      expect(classes).toHaveLength(0);
      expect(modules).toHaveLength(1);
      expect(modules[0].classes).toHaveLength(0);
    });

    it('should handle files with only functions (no classes)', () => {
      const src = [
        'import numpy as np',
        '',
        'def standalone_func(x):',
        '    return x * 2',
        '',
        'def another_func():',
        '    pass',
      ].join('\n');
      const { classes, modules } = analyzeStructure(
        [{ path: 'pydmd/utils.py', content: src }],
        makeRepoManifest(),
      );
      expect(classes).toHaveLength(0);
      expect(modules[0].classes).toHaveLength(0);
      expect(modules[0].functions).toContain('standalone_func');
      expect(modules[0].functions).toContain('another_func');
    });

    it('should degrade gracefully on files with non-standard formatting', () => {
      const src = [
        'class Weird( DMDBase , ABC ):',
        '    # no docstring, odd spacing',
        '    def fit(self,X,   t = None ):',
        '        x = 1',
        '        return x',
      ].join('\n');
      const { classes } = analyzeStructure(
        [{ path: 'pydmd/weird.py', content: src }],
        makeRepoManifest(),
      );
      // Should still extract something, not crash
      expect(classes.length).toBeGreaterThanOrEqual(1);
      expect(classes[0].name).toBe('Weird');
    });
  });
});
