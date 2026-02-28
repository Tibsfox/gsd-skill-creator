/**
 * End-to-end integration tests for the PyDMD dogfood pipeline.
 * Phase 407 Plan 02 -- validates full pipeline wiring and interface contracts.
 *
 * Tests that each layer's output satisfies the next layer's input requirements,
 * and that the full URL -> observations flow connects correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Install pipeline ---
import { detectPythonProject } from '../../../../src/dogfood/pydmd/install/python-detector.js';
import { createVenv } from '../../../../src/dogfood/pydmd/install/venv-manager.js';
import { runHealthCheck } from '../../../../src/dogfood/pydmd/install/health-check.js';
import type { CommandExecutor } from '../../../../src/dogfood/pydmd/install/venv-manager.js';

// --- Learn pipeline ---
import { analyzeStructure } from '../../../../src/dogfood/pydmd/learn/structure-analyzer.js';
import { extractConcepts } from '../../../../src/dogfood/pydmd/learn/concept-extractor.js';
import { parseTutorials } from '../../../../src/dogfood/pydmd/learn/tutorial-parser.js';
import { synthesizePatterns } from '../../../../src/dogfood/pydmd/learn/pattern-synthesizer.js';

// --- Generate pipeline ---
import { composeSkill } from '../../../../src/dogfood/pydmd/generate/skill-composer.js';
import { buildReferences } from '../../../../src/dogfood/pydmd/generate/reference-builder.js';
import { generateScripts } from '../../../../src/dogfood/pydmd/generate/script-generator.js';

// --- Validate pipeline ---
import { checkAccuracy } from '../../../../src/dogfood/pydmd/validate/accuracy-checker.js';
import { replayTutorials } from '../../../../src/dogfood/pydmd/validate/tutorial-replay.js';

// --- Integration bridge ---
import { bridgeToObservations } from '../../../../src/dogfood/pydmd/integration/learn-to-observe.js';

// --- Types ---
import type {
  RepoManifest,
  KnowledgeGraph,
  PythonProjectInfo,
  VenvConfig,
  VenvResult,
  HealthCheckConfig,
  HealthReport,
  InstallManifest,
  ClassNode,
  ModuleNode,
  TutorialSummary,
  AlgorithmVariant,
  Concept,
  DecisionNode,
  Connection,
  UsagePattern,
  Pitfall,
} from '../../../../src/dogfood/pydmd/types.js';

import type { ComplexPlaneMap } from '../../../../src/dogfood/pydmd/learn/complex-plane-mapper.js';
import type { GeneratedSkill } from '../../../../src/dogfood/pydmd/generate/types.js';
import type { AccuracyReport } from '../../../../src/dogfood/pydmd/validate/types.js';
import type { LearnedObservation, BridgeResult } from '../../../../src/dogfood/pydmd/integration/types.js';

// --- Fixtures ---

const PYPROJECT_TOML = `
[build-system]
build-backend = "setuptools.build_meta"

[project]
name = "pydmd"
requires-python = ">=3.8"
dependencies = [
  "numpy>=1.20",
  "scipy>=1.5",
  "matplotlib",
]

[project.optional-dependencies]
test = [
  "pytest",
  "pytest-cov",
]
dev = [
  "flake8",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
`;

const DIR_ENTRIES = [
  'pyproject.toml',
  'pydmd/',
  'pydmd/__init__.py',
  'pydmd/dmdbase.py',
  'pydmd/dmd.py',
  'pydmd/bopdmd.py',
  'pydmd/mrdmd.py',
  'pydmd/dmdc.py',
  'pydmd/edmd.py',
  'pydmd/cdmd.py',
  'pydmd/optdmd.py',
  'pydmd/spdmd.py',
  'pydmd/fbdmd.py',
  'pydmd/hankeldmd.py',
  'pydmd/lando.py',
  'pydmd/rdmd.py',
  'tests/',
  'tests/test_dmd.py',
  'tutorials/',
  'tutorials/tutorial1.py',
  'tutorials/tutorial2.py',
  'tutorials/tutorial3.py',
  'docs/',
  'docs/index.rst',
];

const FILES_MAP: Record<string, string> = {
  'pyproject.toml': PYPROJECT_TOML,
  'conftest.py': '# conftest',
};

function makeDMDBaseSource(): string {
  return `
from abc import ABC

class DMDBase(ABC):
    """Dynamic Mode Decomposition base class.

    This class provides the shared interface for all DMD variants using
    singular value decomposition and eigendecomposition.
    """
    def __init__(self, svd_rank=-1):
        """Initialize DMD with SVD rank truncation."""
        self.svd_rank = svd_rank

    def fit(self, X):
        """Fit DMD model to data X."""
        import numpy as np
        U, s, Vt = np.linalg.svd(X, full_matrices=False)
        self._eigs = s[:self.svd_rank] if self.svd_rank > 0 else s
        return self

    def reconstruct(self):
        """Reconstruct data from DMD modes."""
        pass

    @property
    def eigs(self):
        """Eigenvalues of the DMD operator."""
        return self._eigs

    @property
    def modes(self):
        """DMD spatial modes."""
        return self._modes

    @property
    def dynamics(self):
        """Time dynamics of each mode."""
        return self._dynamics
`;
}

function makeDMDSource(): string {
  return `
from .dmdbase import DMDBase

class DMD(DMDBase):
    """Standard Dynamic Mode Decomposition.

    Unlike advanced variants, standard DMD works best on clean, stationary data.
    Uses SVD for rank truncation.
    Tutorial 1 demonstrates basic usage.
    """
    def __init__(self, svd_rank=-1):
        super().__init__(svd_rank=svd_rank)
`;
}

function makeBOPDMDSource(): string {
  return `
from .dmdbase import DMDBase

class BOPDMD(DMDBase):
    """Bagging Optimized DMD.

    Handles noisy data via bagging and optimization.
    Mathematical basis: Combines bagging with optimized DMD for noise robustness.
    Tutorial 2 demonstrates noise-robust analysis.
    """
    def __init__(self, svd_rank=-1, trial_size=10):
        super().__init__(svd_rank=svd_rank)
        self.trial_size = trial_size
`;
}

function makeMrDMDSource(): string {
  return `
from .dmdbase import DMDBase

class MrDMD(DMDBase):
    """Multi-Resolution Dynamic Mode Decomposition.

    Decomposes data at multiple temporal resolutions.
    Designed for systems with multiple timescales.
    Mathematical basis: Recursive SVD across dyadic time windows.
    Tutorial 3 demonstrates multi-scale analysis.
    """
    def __init__(self, svd_rank=-1, max_level=3):
        super().__init__(svd_rank=svd_rank)
        self.max_level = max_level
`;
}

function makeFbDMDSource(): string {
  return `
from .dmdbase import DMDBase

class FbDMD(DMDBase):
    """Forward-Backward DMD.

    Averages forward and backward DMD for noise reduction.
    Unlike standard DMD, this variant reduces the bias from noisy measurements.
    Mathematical basis: Averages forward and backward linear operators.
    """
    def __init__(self, svd_rank=-1):
        super().__init__(svd_rank=svd_rank)
`;
}

function makeDMDcSource(): string {
  return `
from .dmdbase import DMDBase

class DMDc(DMDBase):
    """DMD with Control.

    Separates autonomous dynamics from control-driven response.
    Designed for systems with external forcing inputs.
    Mathematical basis: Augmented state-space with control matrix B.
    """
    def __init__(self, svd_rank=-1):
        super().__init__(svd_rank=svd_rank)
`;
}

function makeEDMDSource(): string {
  return `
from .dmdbase import DMDBase

class EDMD(DMDBase):
    """Extended DMD.

    Approximates the Koopman operator for weakly nonlinear systems
    using lifting functions.
    Mathematical basis: Koopman operator approximation via lifted observables.
    """
    def __init__(self, svd_rank=-1, kernel=None):
        super().__init__(svd_rank=svd_rank)
        self.kernel = kernel
`;
}

function makeOptDMDSource(): string {
  return `
from .dmdbase import DMDBase

class OptDMD(DMDBase):
    """Optimized DMD.

    Computes the optimal closed-form DMD solution.
    Mathematical basis: Variable projection optimization.
    """
    def __init__(self, svd_rank=-1):
        super().__init__(svd_rank=svd_rank)
`;
}

function makeSpDMDSource(): string {
  return `
from .dmdbase import DMDBase

class SpDMD(DMDBase):
    """Sparsity-Promoting DMD.

    Selects a sparse subset of DMD modes.
    Mathematical basis: L1-penalized optimization for mode selection.
    """
    def __init__(self, svd_rank=-1, gamma=1.0):
        super().__init__(svd_rank=svd_rank)
        self.gamma = gamma
`;
}

function makeHankelDMDSource(): string {
  return `
from .dmdbase import DMDBase

class HankelDMD(DMDBase):
    """Hankel DMD (time-delay embedding).

    Uses Hankel matrix for time-delay embedding.
    Mathematical basis: Augments state with time-delayed copies via Hankel matrix.
    """
    def __init__(self, svd_rank=-1, d=1):
        super().__init__(svd_rank=svd_rank)
        self.d = d
`;
}

function makeLANDOSource(): string {
  return `
from .dmdbase import DMDBase

class LANDO(DMDBase):
    """LANDO: Learning Nonlinear Dynamics with Operator theory.

    Handles strongly nonlinear dynamics via kernel methods.
    Mathematical basis: Kernel-based Koopman operator approximation.
    """
    def __init__(self, svd_rank=-1, kernel=None):
        super().__init__(svd_rank=svd_rank)
        self.kernel = kernel
`;
}

function makeTutorialSource(n: number, variant: string): string {
  return `# Tutorial ${n}: ${variant} Analysis

"""Tutorial demonstrating ${variant} usage."""

import numpy as np
from pydmd import ${variant}

# Create synthetic data
x = np.linspace(0, 2 * np.pi, 64)
t = np.linspace(0, 4 * np.pi, 128)
X = np.sin(x)[:, None] * np.exp(1j * 0.5 * t)[None, :]
data = np.real(X)

# Instantiate and fit
model = ${variant}(svd_rank=2)
model.fit(data)

# Analyze results
print(model.eigs)
print(model.modes.shape)
print(model.dynamics.shape)

# Reconstruct
reconstructed = model.reconstructed_data

import matplotlib.pyplot as plt
plt.plot(model.dynamics[0].real)
plt.show()

# Key insight: ${variant} effectively captures dominant modes in this data type.
`;
}

const SOURCES = [
  { path: 'pydmd/dmdbase.py', content: makeDMDBaseSource() },
  { path: 'pydmd/dmd.py', content: makeDMDSource() },
  { path: 'pydmd/bopdmd.py', content: makeBOPDMDSource() },
  { path: 'pydmd/mrdmd.py', content: makeMrDMDSource() },
  { path: 'pydmd/fbdmd.py', content: makeFbDMDSource() },
  { path: 'pydmd/dmdc.py', content: makeDMDcSource() },
  { path: 'pydmd/edmd.py', content: makeEDMDSource() },
  { path: 'pydmd/optdmd.py', content: makeOptDMDSource() },
  { path: 'pydmd/spdmd.py', content: makeSpDMDSource() },
  { path: 'pydmd/hankeldmd.py', content: makeHankelDMDSource() },
  { path: 'pydmd/lando.py', content: makeLANDOSource() },
];

const TUTORIALS = [
  { path: 'tutorials/tutorial1.py', content: makeTutorialSource(1, 'DMD'), number: 1 },
  { path: 'tutorials/tutorial2.py', content: makeTutorialSource(2, 'BOPDMD'), number: 2 },
  { path: 'tutorials/tutorial3.py', content: makeTutorialSource(3, 'MrDMD'), number: 3 },
  { path: 'tutorials/tutorial4.py', content: makeTutorialSource(4, 'FbDMD'), number: 4 },
  { path: 'tutorials/tutorial5.py', content: makeTutorialSource(5, 'DMDc'), number: 5 },
  { path: 'tutorials/tutorial6.py', content: makeTutorialSource(6, 'EDMD'), number: 6 },
  { path: 'tutorials/tutorial7.py', content: makeTutorialSource(7, 'OptDMD'), number: 7 },
  { path: 'tutorials/tutorial8.py', content: makeTutorialSource(8, 'SpDMD'), number: 8 },
  { path: 'tutorials/tutorial9.py', content: makeTutorialSource(9, 'HankelDMD'), number: 9 },
  { path: 'tutorials/tutorial10.py', content: makeTutorialSource(10, 'LANDO'), number: 10 },
];

const MANIFEST: RepoManifest = {
  url: 'https://github.com/PyDMD/PyDMD',
  localPath: '/tmp/pydmd',
  language: 'python',
  buildSystem: 'pyproject.toml',
  pythonVersion: '3.10',
  dependencies: {
    core: ['numpy>=1.20', 'scipy>=1.5', 'matplotlib'],
    test: ['pytest', 'pytest-cov'],
    dev: ['flake8'],
  },
  testFramework: 'pytest',
  healthCheck: { passed: 100, failed: 0, skipped: 5, errors: [] },
  structure: {
    sourceDir: 'pydmd/',
    testDir: 'tests/',
    tutorialDir: 'tutorials/',
    docsDir: 'docs/',
  },
  entryPoints: ['pydmd'],
  timestamp: new Date().toISOString(),
};

function makeComplexPlaneMap(): ComplexPlaneMap {
  return {
    eigenvalueInterpretation: {
      unitCircle: 'Neutrally stable modes',
      realAxis: 'Growth/decay without oscillation',
      imaginaryAxis: 'Pure oscillation',
      origin: 'Zero mode',
    },
    modeInterpretation: {
      spatialModes: 'Coherent spatial patterns',
      temporalDynamics: 'Time evolution via eigenvalue powers',
      amplitudes: 'Mode energy contribution',
    },
    connectionToFramework: {
      sinCos: 'Oscillation decomposition',
      tangentLine: 'Instantaneous growth rate',
      versine: 'Phase offset metric',
      eulerFormula: 'exp(i*theta) = cos(theta) + i*sin(theta)',
    },
    pedagogicalNarrative: [
      'DMD eigenvalues on the complex plane encode both stability and frequency.',
    ],
  };
}

// ============================================================
// Tests
// ============================================================

describe('end-to-end pipeline', () => {
  it('full pipeline: detect -> venv -> health -> learn -> generate -> validate -> bridge', async () => {
    // --- INSTALL PHASE ---

    // Step 1: Detect Python project
    const projectInfo = detectPythonProject(FILES_MAP, DIR_ENTRIES);
    expect(projectInfo.isPython).toBe(true);
    expect(projectInfo.buildSystem).toBe('pyproject-setuptools');

    // Step 2: Create venv (mocked executor)
    const mockExec: CommandExecutor = vi.fn()
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 })   // venv create
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 })   // pip upgrade
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 })   // pip install
      .mockResolvedValueOnce({ stdout: 'numpy==1.24\nscipy==1.10\n', stderr: '', exitCode: 0 }) // pip freeze
      .mockResolvedValueOnce({ stdout: '50000000\t/tmp/.sc-venv', stderr: '', exitCode: 0 });    // du

    const venvConfig: VenvConfig = {
      projectPath: '/tmp/pydmd',
      venvPath: '/tmp/pydmd/.sc-venv',
      pythonVersion: '3.10',
      installGroups: ['core', 'test'],
    };
    const venvResult = await createVenv(venvConfig, projectInfo, mockExec);
    expect(venvResult.success).toBe(true);
    expect(venvResult.pythonPath).toContain('python');

    // Step 3: Health check (mocked executor)
    const healthExec: CommandExecutor = vi.fn()
      .mockResolvedValueOnce({
        stdout: '100 passed, 0 failed, 5 skipped in 12.34s',
        stderr: '',
        exitCode: 0,
      });

    const healthConfig: HealthCheckConfig = {
      venvResult,
      projectPath: '/tmp/pydmd',
      testFramework: 'pytest',
      timeout: 300,
      maxTestOutput: 65536,
    };
    const healthReport = await runHealthCheck(healthConfig, healthExec);
    expect(healthReport.overall).toBe('pass');
    expect(healthReport.testResults.passed).toBe(100);

    // Assemble install manifest
    const installManifest: InstallManifest = {
      projectInfo,
      venvResult,
      healthReport,
      fileCount: DIR_ENTRIES.length,
      totalSizeBytes: venvResult.sizeBytes,
      timestamp: new Date().toISOString(),
    };

    // --- Health gate: continue only if pass or partial ---
    expect(['pass', 'partial']).toContain(healthReport.overall);

    // --- LEARN PHASE ---

    // Step 4: Analyze structure
    const structureResult = analyzeStructure(SOURCES, MANIFEST);
    expect(structureResult.classes.length).toBeGreaterThanOrEqual(10);
    expect(structureResult.modules.length).toBeGreaterThanOrEqual(10);

    // Convert to ClassNode[] and ModuleNode[] for synthesis
    const classNodes: ClassNode[] = structureResult.classes.map(c => ({
      name: c.name,
      parent: c.bases[0] ?? null,
      module: c.module,
      methods: c.methods.map(m => m.name),
      isAbstract: c.isAbstract,
    }));

    const moduleNodes: ModuleNode[] = structureResult.modules.map(m => ({
      path: m.path,
      classes: m.classes,
      imports: m.imports.map(i => i.module),
      linesOfCode: m.linesOfCode,
    }));

    // Step 5: Extract concepts
    const conceptResult = extractConcepts(SOURCES, MANIFEST);
    expect(conceptResult.concepts.length).toBeGreaterThanOrEqual(3);
    expect(conceptResult.variants.length).toBeGreaterThanOrEqual(8);

    // Convert ExtractedConcept[] to Concept[] for synthesis
    const concepts: Concept[] = conceptResult.concepts.map(c => ({
      name: c.name,
      category: c.category,
      description: c.description,
      relatedConcepts: c.relatedConcepts,
      sourceFiles: c.codeLocation,
    }));

    // Step 6: Parse tutorials
    const tutorialSummaries = parseTutorials(TUTORIALS, MANIFEST);
    expect(tutorialSummaries.length).toBeGreaterThanOrEqual(10);
    expect(tutorialSummaries[0].variant).toBeDefined();

    // Step 7: Synthesize into KnowledgeGraph
    const knowledgeGraph = synthesizePatterns({
      classes: classNodes,
      modules: moduleNodes,
      concepts,
      variants: conceptResult.variants,
      tutorials: tutorialSummaries,
      complexPlaneMap: makeComplexPlaneMap(),
      manifest: MANIFEST,
    });

    expect(knowledgeGraph.project.name).toBe('PyDMD');
    expect(knowledgeGraph.architecture.classHierarchy.length).toBeGreaterThan(0);
    expect(knowledgeGraph.concepts.algorithmic.length).toBeGreaterThanOrEqual(8);
    expect(knowledgeGraph.patterns.selection.length).toBeGreaterThan(0);
    expect(knowledgeGraph.tutorials.length).toBeGreaterThanOrEqual(10);

    // --- GENERATE PHASE ---

    // Step 8: Compose skill
    const skill = composeSkill(knowledgeGraph);
    expect(skill.skillMd).toContain('Quick Reference');
    expect(skill.skillMd).toContain('Choosing Your Algorithm');
    expect(skill.skillMd).toContain('Core Concepts');
    expect(skill.wordCount).toBeLessThan(5000);

    // Step 9: Build references
    const references = buildReferences(knowledgeGraph);
    expect(references.algorithmVariants.length).toBeGreaterThan(0);
    expect(references.mathematicalFoundations.length).toBeGreaterThan(0);
    expect(references.apiReference.length).toBeGreaterThan(0);
    expect(references.complexPlaneConnections.length).toBeGreaterThan(0);

    // Step 10: Generate scripts
    const scripts = generateScripts(knowledgeGraph);
    expect(scripts.quickDmd.length).toBeGreaterThan(0);
    expect(scripts.compareVariants.length).toBeGreaterThan(0);
    expect(scripts.visualizeModes.length).toBeGreaterThan(0);

    // --- VALIDATE PHASE ---

    // Step 11: Check accuracy
    const accuracy = checkAccuracy(skill, references, knowledgeGraph);
    expect(accuracy.overallScore).toBeGreaterThanOrEqual(0);
    expect(accuracy.overallScore).toBeLessThanOrEqual(100);
    expect(accuracy.apiAccuracy.methodsClaimed).toBeGreaterThan(0);

    // Step 12: Replay tutorials
    const replay = replayTutorials(skill, knowledgeGraph);
    expect(replay.results.length).toBe(knowledgeGraph.tutorials.length);
    expect(replay.maxScore).toBe(knowledgeGraph.tutorials.length * 5);

    // --- INTEGRATION PHASE ---

    // Step 13: Bridge to observations
    const bridgeResult = bridgeToObservations(knowledgeGraph);
    expect(bridgeResult.observations.length).toBeGreaterThan(0);
    expect(bridgeResult.stats.totalObservations).toBe(bridgeResult.observations.length);

    // Verify all observation sources start with "sc:learn/"
    for (const obs of bridgeResult.observations) {
      expect(obs.source).toMatch(/^sc:learn\//);
    }

    // Verify observation types are present
    const types = new Set(bridgeResult.observations.map(o => o.type));
    expect(types.has('learned-concept')).toBe(true);
    expect(types.has('learned-pattern')).toBe(true);
    expect(types.has('learned-decision-model')).toBe(true);
  });

  it('pipeline halts when health check fails', async () => {
    // Mock executor returns a failing health check
    const healthExec: CommandExecutor = vi.fn()
      .mockResolvedValueOnce({
        stdout: '40 passed, 60 failed in 30.00s',
        stderr: '',
        exitCode: 1,
      });

    const venvResult: VenvResult = {
      success: true,
      venvPath: '/tmp/.sc-venv',
      pythonPath: '/tmp/.sc-venv/bin/python',
      installedPackages: ['numpy==1.24'],
      installErrors: [],
      sizeBytes: 50000000,
    };

    const healthConfig: HealthCheckConfig = {
      venvResult,
      projectPath: '/tmp/pydmd',
      testFramework: 'pytest',
      timeout: 300,
      maxTestOutput: 65536,
    };

    const healthReport = await runHealthCheck(healthConfig, healthExec);
    expect(healthReport.overall).toBe('fail');
    expect(healthReport.testResults.passed).toBe(40);
    expect(healthReport.testResults.failed).toBe(60);

    // Gate check: pipeline should NOT proceed past health gate
    const passesGate = healthReport.overall === 'pass' || healthReport.overall === 'partial';
    expect(passesGate).toBe(false);
  });

  it('pipeline handles partial knowledge graph gracefully', () => {
    // KnowledgeGraph with empty tutorials and crossReferences
    const partialKG: KnowledgeGraph = {
      project: { name: 'PyDMD', version: '1.0', description: 'Partial DMD', license: 'MIT' },
      architecture: {
        classHierarchy: [{ name: 'DMD', parent: null, module: 'pydmd.dmd', methods: ['fit'], isAbstract: false }],
        apiSurface: [{ class: 'DMD', name: 'fit', signature: 'fit()', returnType: 'DMD', docstring: 'Fit model.', isInherited: false }],
        moduleMap: [{ path: 'pydmd/dmd.py', classes: ['DMD'], imports: [], linesOfCode: 20 }],
      },
      concepts: {
        mathematical: [],
        algorithmic: [{
          name: 'Standard DMD',
          class: 'DMD',
          purpose: 'Basic DMD',
          distinguishing: [],
          parameters: [],
          mathBasis: 'SVD',
          tutorial: null,
        }],
        domain: [],
      },
      patterns: {
        usage: [],
        selection: [{
          question: 'Do you have data?',
          yes: 'Standard DMD',
          no: 'No variant',
        }],
        pitfalls: [],
      },
      tutorials: [],
      crossReferences: { complexPlane: [], skillCreator: [] },
    };

    // Generate phase should not crash
    const skill = composeSkill(partialKG);
    expect(skill.skillMd).toBeDefined();
    expect(skill.wordCount).toBeGreaterThan(0);

    const references = buildReferences(partialKG);
    expect(references.algorithmVariants).toBeDefined();

    const scripts = generateScripts(partialKG);
    expect(scripts.quickDmd).toBeDefined();

    // Validate phase should not crash
    const accuracy = checkAccuracy(skill, references, partialKG);
    expect(accuracy.overallScore).toBeGreaterThanOrEqual(0);

    // Bridge should still produce output (from the single variant)
    const bridgeResult = bridgeToObservations(partialKG);
    expect(bridgeResult.observations.length).toBeGreaterThan(0);
    expect(bridgeResult.stats.concepts).toBe(1);
  });
});

describe('interface contracts', () => {
  it('RepoManifest satisfies learn pipeline input requirements', () => {
    // The learn pipeline requires specific fields from RepoManifest
    const manifest = MANIFEST;

    // Structure fields required by analyzeStructure and parseTutorials
    expect(manifest.structure).toBeDefined();
    expect(typeof manifest.structure.sourceDir).toBe('string');
    expect(typeof manifest.structure.testDir).toBe('string');
    expect(typeof manifest.structure.tutorialDir).toBe('string');

    // Entry points required for package identification
    expect(Array.isArray(manifest.entryPoints)).toBe(true);
    expect(manifest.entryPoints.length).toBeGreaterThan(0);

    // Health check required for gate logic
    expect(manifest.healthCheck).toBeDefined();
    expect(typeof manifest.healthCheck.passed).toBe('number');
    expect(typeof manifest.healthCheck.failed).toBe('number');

    // Python project info
    expect(manifest.language).toBe('python');
    expect(['pyproject.toml', 'setup.py', 'setup.cfg']).toContain(manifest.buildSystem);
  });

  it('KnowledgeGraph satisfies SkillComposer input requirements', () => {
    // Build a KnowledgeGraph via the pipeline
    const structureResult = analyzeStructure(SOURCES, MANIFEST);
    const classNodes: ClassNode[] = structureResult.classes.map(c => ({
      name: c.name,
      parent: c.bases[0] ?? null,
      module: c.module,
      methods: c.methods.map(m => m.name),
      isAbstract: c.isAbstract,
    }));
    const moduleNodes: ModuleNode[] = structureResult.modules.map(m => ({
      path: m.path,
      classes: m.classes,
      imports: m.imports.map(i => i.module),
      linesOfCode: m.linesOfCode,
    }));
    const conceptResult = extractConcepts(SOURCES, MANIFEST);
    const concepts: Concept[] = conceptResult.concepts.map(c => ({
      name: c.name,
      category: c.category,
      description: c.description,
      relatedConcepts: c.relatedConcepts,
      sourceFiles: c.codeLocation,
    }));
    const tutorialSummaries = parseTutorials(TUTORIALS, MANIFEST);

    const kg = synthesizePatterns({
      classes: classNodes,
      modules: moduleNodes,
      concepts,
      variants: conceptResult.variants,
      tutorials: tutorialSummaries,
      complexPlaneMap: makeComplexPlaneMap(),
      manifest: MANIFEST,
    });

    // SkillComposer requires:
    expect(Array.isArray(kg.concepts.algorithmic)).toBe(true);
    expect(Array.isArray(kg.patterns.selection)).toBe(true);
    expect(Array.isArray(kg.patterns.usage)).toBe(true);
    expect(Array.isArray(kg.tutorials)).toBe(true);

    // Selection must have at least one DecisionNode
    expect(kg.patterns.selection.length).toBeGreaterThan(0);
    const firstNode = kg.patterns.selection[0];
    expect(typeof firstNode.question).toBe('string');
    expect(firstNode.yes).toBeDefined();
    expect(firstNode.no).toBeDefined();

    // Algorithmic concepts must have required AlgorithmVariant fields
    for (const variant of kg.concepts.algorithmic) {
      expect(typeof variant.name).toBe('string');
      expect(typeof variant.class).toBe('string');
      expect(typeof variant.purpose).toBe('string');
      expect(Array.isArray(variant.distinguishing)).toBe(true);
      expect(Array.isArray(variant.parameters)).toBe(true);
      expect(typeof variant.mathBasis).toBe('string');
    }

    // Usage patterns must have steps and variants
    for (const pattern of kg.patterns.usage) {
      expect(typeof pattern.name).toBe('string');
      expect(Array.isArray(pattern.steps)).toBe(true);
      expect(typeof pattern.codeExample).toBe('string');
      expect(Array.isArray(pattern.variants)).toBe(true);
    }
  });

  it('Generated skill satisfies progressive disclosure format', () => {
    // Build full KG and compose skill
    const structureResult = analyzeStructure(SOURCES, MANIFEST);
    const classNodes: ClassNode[] = structureResult.classes.map(c => ({
      name: c.name,
      parent: c.bases[0] ?? null,
      module: c.module,
      methods: c.methods.map(m => m.name),
      isAbstract: c.isAbstract,
    }));
    const moduleNodes: ModuleNode[] = structureResult.modules.map(m => ({
      path: m.path,
      classes: m.classes,
      imports: m.imports.map(i => i.module),
      linesOfCode: m.linesOfCode,
    }));
    const conceptResult = extractConcepts(SOURCES, MANIFEST);
    const concepts: Concept[] = conceptResult.concepts.map(c => ({
      name: c.name,
      category: c.category,
      description: c.description,
      relatedConcepts: c.relatedConcepts,
      sourceFiles: c.codeLocation,
    }));
    const tutorialSummaries = parseTutorials(TUTORIALS, MANIFEST);

    const kg = synthesizePatterns({
      classes: classNodes,
      modules: moduleNodes,
      concepts,
      variants: conceptResult.variants,
      tutorials: tutorialSummaries,
      complexPlaneMap: makeComplexPlaneMap(),
      manifest: MANIFEST,
    });

    const skill = composeSkill(kg);
    const references = buildReferences(kg);
    const scripts = generateScripts(kg);

    // Required sections in progressive disclosure format
    expect(skill.skillMd).toContain('Quick Reference');
    expect(skill.skillMd).toContain('Choosing Your Algorithm');
    expect(skill.skillMd).toContain('Core Concepts');

    // Word count under limit
    expect(skill.wordCount).toBeLessThan(5000);

    // References has 4 documents
    expect(references.algorithmVariants.length).toBeGreaterThan(0);
    expect(references.mathematicalFoundations.length).toBeGreaterThan(0);
    expect(references.apiReference.length).toBeGreaterThan(0);
    expect(references.complexPlaneConnections.length).toBeGreaterThan(0);

    // Scripts has 3 scripts
    expect(scripts.quickDmd.length).toBeGreaterThan(0);
    expect(scripts.compareVariants.length).toBeGreaterThan(0);
    expect(scripts.visualizeModes.length).toBeGreaterThan(0);
  });

  it('Observation records satisfy SessionObserver schema', () => {
    // Build minimal KG with all three observation types
    const kg: KnowledgeGraph = {
      project: { name: 'PyDMD', version: '1.0', description: 'Test', license: 'MIT' },
      architecture: {
        classHierarchy: [],
        apiSurface: [],
        moduleMap: [],
      },
      concepts: {
        mathematical: [],
        algorithmic: [{
          name: 'Standard DMD',
          class: 'DMD',
          purpose: 'Basic',
          distinguishing: [],
          parameters: [{ name: 'svd_rank', type: 'int', default: '-1', description: 'Rank' }],
          mathBasis: 'SVD',
          tutorial: 1,
        }],
        domain: [],
      },
      patterns: {
        usage: [{
          name: 'standard-dmd-workflow',
          steps: ['Import', 'Create', 'Fit'],
          codeExample: 'from pydmd import DMD',
          variants: ['DMD'],
        }],
        selection: [{
          question: 'Is data noisy?',
          yes: 'FbDMD',
          no: 'Standard DMD',
        }],
        pitfalls: [],
      },
      tutorials: [],
      crossReferences: { complexPlane: [], skillCreator: [] },
    };

    const result = bridgeToObservations(kg);

    // Each observation must have required fields
    for (const obs of result.observations) {
      expect(typeof obs.id).toBe('string');
      expect(obs.id.length).toBeGreaterThan(0);

      expect(['learned-concept', 'learned-pattern', 'learned-decision-model']).toContain(obs.type);

      expect(typeof obs.source).toBe('string');
      expect(obs.source).toMatch(/^sc:learn\//);

      expect(obs.pattern).toBeDefined();
      expect(typeof obs.pattern).toBe('object');

      expect(typeof obs.confidence).toBe('number');
      expect(obs.confidence).toBeGreaterThanOrEqual(0);
      expect(obs.confidence).toBeLessThanOrEqual(1);

      // Provenance must have all 4 fields
      expect(typeof obs.provenance.githubUrl).toBe('string');
      expect(typeof obs.provenance.filePath).toBe('string');
      expect(typeof obs.provenance.extractionMethod).toBe('string');
      expect(typeof obs.provenance.observationId).toBe('string');

      expect(typeof obs.timestamp).toBe('string');
    }

    // Must have all three types
    const types = new Set(result.observations.map(o => o.type));
    expect(types.size).toBe(3);
  });

  it('AccuracyReport satisfies validation requirements', () => {
    // Build full pipeline to get an actual AccuracyReport
    const structureResult = analyzeStructure(SOURCES, MANIFEST);
    const classNodes: ClassNode[] = structureResult.classes.map(c => ({
      name: c.name,
      parent: c.bases[0] ?? null,
      module: c.module,
      methods: c.methods.map(m => m.name),
      isAbstract: c.isAbstract,
    }));
    const moduleNodes: ModuleNode[] = structureResult.modules.map(m => ({
      path: m.path,
      classes: m.classes,
      imports: m.imports.map(i => i.module),
      linesOfCode: m.linesOfCode,
    }));
    const conceptResult = extractConcepts(SOURCES, MANIFEST);
    const concepts: Concept[] = conceptResult.concepts.map(c => ({
      name: c.name,
      category: c.category,
      description: c.description,
      relatedConcepts: c.relatedConcepts,
      sourceFiles: c.codeLocation,
    }));
    const tutorialSummaries = parseTutorials(TUTORIALS, MANIFEST);

    const kg = synthesizePatterns({
      classes: classNodes,
      modules: moduleNodes,
      concepts,
      variants: conceptResult.variants,
      tutorials: tutorialSummaries,
      complexPlaneMap: makeComplexPlaneMap(),
      manifest: MANIFEST,
    });

    const skill = composeSkill(kg);
    const references = buildReferences(kg);
    const report = checkAccuracy(skill, references, kg);

    // AccuracyReport shape validation
    expect(report.apiAccuracy).toBeDefined();
    expect(typeof report.apiAccuracy.methodsClaimed).toBe('number');
    expect(typeof report.apiAccuracy.methodsVerified).toBe('number');
    expect(typeof report.apiAccuracy.methodsMissing).toBe('number');
    expect(typeof report.apiAccuracy.signatureMatches).toBe('number');
    expect(Array.isArray(report.apiAccuracy.signatureMismatches)).toBe(true);

    expect(report.algorithmAccuracy).toBeDefined();
    expect(typeof report.algorithmAccuracy.variantsClaimed).toBe('number');
    expect(typeof report.algorithmAccuracy.variantsVerified).toBe('number');
    expect(typeof report.algorithmAccuracy.purposeCorrect).toBe('number');
    expect(typeof report.algorithmAccuracy.parameterCorrect).toBe('number');

    expect(report.decisionTreeAccuracy).toBeDefined();
    expect(typeof report.decisionTreeAccuracy.totalPaths).toBe('number');
    expect(typeof report.decisionTreeAccuracy.pathsValidated).toBe('number');
    expect(Array.isArray(report.decisionTreeAccuracy.pathsIncorrect)).toBe(true);

    expect(report.coverageMetrics).toBeDefined();
    expect(typeof report.coverageMetrics.apiCoverage).toBe('number');
    expect(typeof report.coverageMetrics.variantCoverage).toBe('number');
    expect(typeof report.coverageMetrics.tutorialCoverage).toBe('number');

    // overallScore is a number 0-100
    expect(typeof report.overallScore).toBe('number');
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
  });
});
