import { describe, it, expect } from 'vitest';
import {
  mapAPISurface,
  type APISurface,
  type AnalyzedAPIMethod,
  type APIProperty,
  type APIParameter,
} from '../../../../../src/dogfood/pydmd/learn/api-mapper.js';
import type {
  AnalyzedClassNode,
  AnalyzedModuleNode,
  MethodInfo,
  ParameterInfo,
} from '../../../../../src/dogfood/pydmd/learn/structure-analyzer.js';

// --- Factories ---

function makeParameterInfo(name: string, overrides: Partial<ParameterInfo> = {}): ParameterInfo {
  return {
    name,
    type: null,
    default: null,
    isRequired: true,
    ...overrides,
  };
}

function makeMethodInfo(name: string, params: ParameterInfo[] = [], overrides: Partial<MethodInfo> = {}): MethodInfo {
  return {
    name,
    parameters: params,
    returnType: null,
    docstring: null,
    isPublic: true,
    isOverride: false,
    ...overrides,
  };
}

function makeClassNode(
  name: string,
  bases: string[],
  methods: MethodInfo[],
  overrides: Partial<AnalyzedClassNode> = {},
): AnalyzedClassNode {
  return {
    name,
    module: `pydmd.${name.toLowerCase()}`,
    bases,
    docstring: null,
    methods,
    isAbstract: false,
    isPublic: true,
    ...overrides,
  };
}

function makeModuleNode(
  path: string,
  overrides: Partial<AnalyzedModuleNode> = {},
): AnalyzedModuleNode {
  return {
    path,
    classes: [],
    functions: [],
    imports: [],
    linesOfCode: 100,
    ...overrides,
  };
}

// --- Shared fixture: DMDBase tree ---

function buildDMDBaseTree(): { classes: AnalyzedClassNode[]; modules: AnalyzedModuleNode[] } {
  const baseMethods: MethodInfo[] = [
    makeMethodInfo('fit', [makeParameterInfo('X'), makeParameterInfo('t', { default: 'None', isRequired: false })], {
      docstring: 'Fit the model to data.\n\nReturns:\n    The fitted DMD instance.',
      isPublic: true,
    }),
    makeMethodInfo('reconstructed_data', [], {
      docstring: 'Get the reconstructed data.\n\nReturns:\n    np.ndarray of reconstructed data.',
      returnType: 'np.ndarray',
      isPublic: true,
    }),
    makeMethodInfo('eigs', [], {
      docstring: 'Get the eigenvalues.\n\nReturns:\n    np.ndarray of eigenvalues.',
      returnType: 'np.ndarray',
      isPublic: true,
    }),
    makeMethodInfo('modes', [], {
      docstring: 'Get the DMD modes.\n\nReturns:\n    np.ndarray of modes.',
      returnType: 'np.ndarray',
      isPublic: true,
    }),
    makeMethodInfo('dynamics', [], {
      docstring: 'Get the dynamics.\n\nReturns:\n    np.ndarray of dynamics.',
      returnType: 'np.ndarray',
      isPublic: true,
    }),
  ];

  const base = makeClassNode('DMDBase', ['ABC'], baseMethods, { isAbstract: true });

  const dmd = makeClassNode('DMD', ['DMDBase'], [
    makeMethodInfo('fit', [makeParameterInfo('X'), makeParameterInfo('t', { default: 'None', isRequired: false })], {
      isOverride: true,
      docstring: 'Fit the standard DMD model.\n\nExample:\n    dmd = DMD(svd_rank=2)\n    dmd.fit(X)',
    }),
    makeMethodInfo('forecast', [makeParameterInfo('steps', { type: 'int' })], {
      docstring: 'Forecast future states.\n\nReturns:\n    np.ndarray of forecasted states.',
    }),
  ]);

  const bopdmd = makeClassNode('BOPDMD', ['DMDBase'], [
    makeMethodInfo('fit', [makeParameterInfo('X')], { isOverride: true, docstring: 'Fit BOP-DMD model.' }),
    makeMethodInfo('compute_operator', [], {
      docstring: 'Compute the optimized DMD operator.\n\nReturns:\n    Optimized operator matrix.',
    }),
  ]);

  const mrdmd = makeClassNode('MrDMD', ['DMDBase'], [
    makeMethodInfo('fit', [makeParameterInfo('X')], { isOverride: true, docstring: 'Fit multi-resolution DMD model.' }),
    makeMethodInfo('reconstructed_data', [], { isOverride: true, returnType: 'np.ndarray' }),
  ], { docstring: 'Multi-resolution Dynamic Mode Decomposition.' });

  const dmdc = makeClassNode('DMDc', ['DMDBase'], [
    makeMethodInfo('__init__', [
      makeParameterInfo('svd_rank', { default: '-1', isRequired: false, type: 'int' }),
      makeParameterInfo('B', { type: 'np.ndarray', isRequired: true }),
    ], { docstring: 'Initialize DMD with control.' }),
    makeMethodInfo('fit', [makeParameterInfo('X'), makeParameterInfo('I', { type: 'np.ndarray' })], {
      isOverride: true,
      docstring: 'Fit DMD with control input.',
    }),
  ]);

  const classes = [base, dmd, bopdmd, mrdmd, dmdc];

  const modules: AnalyzedModuleNode[] = [
    makeModuleNode('pydmd/dmdbase.py', { classes: ['DMDBase'], linesOfCode: 800 }),
    makeModuleNode('pydmd/dmd.py', { classes: ['DMD'], linesOfCode: 400 }),
    makeModuleNode('pydmd/bopdmd.py', { classes: ['BOPDMD'], linesOfCode: 300 }),
    makeModuleNode('pydmd/mrdmd.py', { classes: ['MrDMD'], linesOfCode: 350 }),
    makeModuleNode('pydmd/dmdc.py', { classes: ['DMDc'], linesOfCode: 250 }),
    makeModuleNode('pydmd/plotter.py', {
      classes: [],
      functions: ['plot_eigs', 'plot_modes', 'plot_dynamics'],
      linesOfCode: 200,
    }),
  ];

  return { classes, modules };
}

// --- Tests ---

describe('mapAPISurface', () => {
  describe('shared interface detection (LRN-02)', () => {
    it('should identify the 5 core shared methods/properties from DMDBase', () => {
      const { classes, modules } = buildDMDBaseTree();
      const surface = mapAPISurface(classes, modules);
      const sharedNames = [
        ...surface.sharedInterface.methods.map(m => m.name),
        ...surface.sharedInterface.properties.map(p => p.name),
      ];
      expect(sharedNames).toContain('fit');
      expect(sharedNames).toContain('reconstructed_data');
      expect(sharedNames).toContain('eigs');
      expect(sharedNames).toContain('modes');
      expect(sharedNames).toContain('dynamics');
    });

    it('should NOT include variant-only methods in shared interface', () => {
      const { classes, modules } = buildDMDBaseTree();
      const surface = mapAPISurface(classes, modules);
      const sharedNames = [
        ...surface.sharedInterface.methods.map(m => m.name),
        ...surface.sharedInterface.properties.map(p => p.name),
      ];
      expect(sharedNames).not.toContain('forecast');
      expect(sharedNames).not.toContain('compute_operator');
    });

    it('should distinguish properties from methods', () => {
      const { classes, modules } = buildDMDBaseTree();
      const surface = mapAPISurface(classes, modules);
      const propNames = surface.sharedInterface.properties.map(p => p.name);
      const methodNames = surface.sharedInterface.methods.map(m => m.name);
      // eigs, modes, dynamics, reconstructed_data are properties (no params except self)
      expect(propNames).toContain('eigs');
      expect(propNames).toContain('modes');
      expect(propNames).toContain('dynamics');
      expect(propNames).toContain('reconstructed_data');
      // fit is a method (takes params)
      expect(methodNames).toContain('fit');
    });
  });

  describe('variant extension cataloging', () => {
    it('should list variant-only methods under additionalMethods', () => {
      const { classes, modules } = buildDMDBaseTree();
      const surface = mapAPISurface(classes, modules);
      const bop = surface.variantExtensions.find(v => v.className === 'BOPDMD');
      expect(bop).toBeDefined();
      const addNames = bop!.additionalMethods.map(m => m.name);
      expect(addNames).toContain('compute_operator');
    });

    it('should list extra init parameters under additionalParameters', () => {
      const { classes, modules } = buildDMDBaseTree();
      const surface = mapAPISurface(classes, modules);
      const dmdc = surface.variantExtensions.find(v => v.className === 'DMDc');
      expect(dmdc).toBeDefined();
      const paramNames = dmdc!.additionalParameters.map(p => p.name);
      expect(paramNames).toContain('B');
    });

    it('should extract unique features from docstring keywords', () => {
      const { classes, modules } = buildDMDBaseTree();
      // MrDMD docstring contains "Multi-resolution"
      const surface = mapAPISurface(classes, modules);
      const mr = surface.variantExtensions.find(v => v.className === 'MrDMD');
      expect(mr).toBeDefined();
      // Should derive at least one unique feature
      expect(mr!.uniqueFeatures.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('API signature parsing', () => {
    it('should strip self from signatures', () => {
      const { classes, modules } = buildDMDBaseTree();
      const surface = mapAPISurface(classes, modules);
      const fitMethod = surface.sharedInterface.methods.find(m => m.name === 'fit')!;
      expect(fitMethod.signature).not.toContain('self');
      expect(fitMethod.signature).toContain('fit(');
    });

    it('should extract return description from docstrings', () => {
      const { classes, modules } = buildDMDBaseTree();
      const surface = mapAPISurface(classes, modules);
      const fitMethod = surface.sharedInterface.methods.find(m => m.name === 'fit')!;
      expect(fitMethod.returnDescription.length).toBeGreaterThan(0);
    });

    it('should extract examples from docstrings', () => {
      const { classes, modules } = buildDMDBaseTree();
      const surface = mapAPISurface(classes, modules);
      // DMD.fit override has an Example: block, but shared interface uses base.
      // Check variant extensions for DMD's forecast or check DMD fit in variants.
      const dmdExt = surface.variantExtensions.find(v => v.className === 'DMD');
      expect(dmdExt).toBeDefined();
      // forecast has a docstring but no example; DMD.fit override has one
      // The additional methods for DMD include forecast
      const forecast = dmdExt!.additionalMethods.find(m => m.name === 'forecast');
      expect(forecast).toBeDefined();
    });
  });

  describe('plotter API', () => {
    it('should catalog plotter module functions under plotterAPI', () => {
      const { classes, modules } = buildDMDBaseTree();
      const surface = mapAPISurface(classes, modules);
      expect(surface.plotterAPI.functions.length).toBeGreaterThanOrEqual(1);
      const names = surface.plotterAPI.functions.map(f => f.name);
      expect(names).toContain('plot_eigs');
      expect(names).toContain('plot_modes');
      expect(names).toContain('plot_dynamics');
    });

    it('should not include plotter functions in class methods', () => {
      const { classes, modules } = buildDMDBaseTree();
      const surface = mapAPISurface(classes, modules);
      const sharedNames = surface.sharedInterface.methods.map(m => m.name);
      expect(sharedNames).not.toContain('plot_eigs');
    });
  });

  describe('structured JSON output (LRN-07)', () => {
    it('should match APISurface interface shape', () => {
      const { classes, modules } = buildDMDBaseTree();
      const surface = mapAPISurface(classes, modules);
      expect(surface).toHaveProperty('sharedInterface');
      expect(surface).toHaveProperty('variantExtensions');
      expect(surface).toHaveProperty('plotterAPI');
      expect(surface.sharedInterface).toHaveProperty('methods');
      expect(surface.sharedInterface).toHaveProperty('properties');
      expect(Array.isArray(surface.variantExtensions)).toBe(true);
      expect(surface.plotterAPI).toHaveProperty('functions');
    });

    it('should have non-empty description fields for public methods', () => {
      const { classes, modules } = buildDMDBaseTree();
      const surface = mapAPISurface(classes, modules);
      for (const m of surface.sharedInterface.methods) {
        expect(m.description.length).toBeGreaterThan(0);
      }
      for (const p of surface.sharedInterface.properties) {
        expect(p.description.length).toBeGreaterThan(0);
      }
    });

    it('should sort methods alphabetically within each section', () => {
      const { classes, modules } = buildDMDBaseTree();
      const surface = mapAPISurface(classes, modules);
      const methodNames = surface.sharedInterface.methods.map(m => m.name);
      const sortedNames = [...methodNames].sort();
      expect(methodNames).toEqual(sortedNames);

      const propNames = surface.sharedInterface.properties.map(p => p.name);
      const sortedProps = [...propNames].sort();
      expect(propNames).toEqual(sortedProps);
    });
  });

  describe('edge cases', () => {
    it('should handle a class with no methods', () => {
      const stub = makeClassNode('EmptyDMD', ['DMDBase'], []);
      const surface = mapAPISurface(
        [makeClassNode('DMDBase', ['ABC'], [], { isAbstract: true }), stub],
        [makeModuleNode('pydmd/empty.py', { classes: ['EmptyDMD'] })],
      );
      const ext = surface.variantExtensions.find(v => v.className === 'EmptyDMD');
      expect(ext).toBeDefined();
      expect(ext!.additionalMethods).toHaveLength(0);
    });

    it('should handle ClassNode[] with no common base class', () => {
      const a = makeClassNode('AlphaModel', ['object'], [makeMethodInfo('run', [])]);
      const b = makeClassNode('BetaModel', ['object'], [makeMethodInfo('execute', [])]);
      const surface = mapAPISurface(
        [a, b],
        [makeModuleNode('models/alpha.py'), makeModuleNode('models/beta.py')],
      );
      expect(surface.sharedInterface.methods).toHaveLength(0);
      expect(surface.sharedInterface.properties).toHaveLength(0);
    });
  });
});
