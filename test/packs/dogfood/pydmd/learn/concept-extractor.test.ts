import { describe, it, expect } from 'vitest';
import type { RepoManifest, AlgorithmVariant } from '../../../../../src/packs/dogfood/pydmd/types.js';
import {
  extractConcepts,
  type ExtractedConcept,
} from '../../../../../src/packs/dogfood/pydmd/learn/concept-extractor.js';

// --- Factories ---

function makeRepoManifest(overrides: Partial<RepoManifest> = {}): RepoManifest {
  return {
    url: 'https://github.com/PyDMD/PyDMD',
    localPath: '/tmp/pydmd',
    language: 'python',
    buildSystem: 'pyproject.toml',
    pythonVersion: '3.11',
    dependencies: { core: ['numpy', 'scipy'], test: ['pytest'], dev: ['black'] },
    testFramework: 'pytest',
    healthCheck: { passed: 100, failed: 0, skipped: 2, errors: [] },
    structure: { sourceDir: 'pydmd/', testDir: 'tests/', tutorialDir: 'tutorials/', docsDir: 'docs/' },
    entryPoints: ['pydmd/__init__.py'],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makePythonSourceWithSVD(): { path: string; content: string } {
  return {
    path: 'pydmd/dmdbase.py',
    content: `"""
DMDBase module.

Implements the core Dynamic Mode Decomposition algorithm using SVD.

The decomposition follows:
$X = U \\\\Sigma V^*$

where U contains the spatial modes, Sigma the singular values, and V*
the temporal dynamics.

References:
    Schmid, P. J. (2010). Dynamic mode decomposition of numerical and experimental data.
"""
import numpy as np
from scipy.linalg import svd

class DMDBase:
    """Base class for all DMD variants.

    Uses Singular Value Decomposition (SVD) to compute the reduced
    representation of the data matrix.
    """

    def __init__(self, svd_rank=-1, exact=False):
        self.svd_rank = svd_rank
        self.exact = exact

    def fit(self, X):
        """Compute the DMD from input data X."""
        U, s, Vh = np.linalg.svd(X, full_matrices=False)
        # Truncate based on svd_rank
        if self.svd_rank > 0:
            U = U[:, :self.svd_rank]
            s = s[:self.svd_rank]
            Vh = Vh[:self.svd_rank, :]
        self._eigs = np.linalg.eig(U.conj().T @ X[:, 1:] @ Vh.conj().T @ np.diag(1.0/s))[0]
        return self
`,
  };
}

function makePythonSourceWithEigen(): { path: string; content: string } {
  return {
    path: 'pydmd/dmd.py',
    content: `"""
Standard DMD module.

Eigenvalue computation for mode analysis.
"""
import numpy as np

class DMD(DMDBase):
    """Standard Dynamic Mode Decomposition.

    Computes eigenvalues and eigenvectors of the linear operator
    that best approximates the dynamics in the data.
    """

    def _compute_modes(self, Atilde):
        """Compute eigenvalue decomposition of the reduced operator."""
        eigenvalues, eigenvectors = np.linalg.eig(Atilde)
        return eigenvalues, eigenvectors
`,
  };
}

function makePythonSourceWithKoopman(): { path: string; content: string } {
  return {
    path: 'pydmd/edmd.py',
    content: `"""
Extended DMD (EDMD) module.

Implements the Koopman operator approximation through observable functions.
Uses lifting functions to map data into a higher-dimensional feature space
where the dynamics are approximately linear.
"""
import numpy as np

class EDMD(DMDBase):
    """Extended Dynamic Mode Decomposition.

    Approximates the Koopman operator using user-defined observable functions.
    The lifted state z = g(x) evolves linearly: z_{k+1} = K z_k,
    where K is the finite-dimensional approximation of the Koopman operator.

    Tutorial 12 demonstrates basic EDMD usage.
    """

    def __init__(self, observables=None, svd_rank=-1):
        super().__init__(svd_rank=svd_rank)
        self.observables = observables

    def _lift(self, X):
        """Apply lifting functions to transform data."""
        if self.observables is not None:
            return np.column_stack([obs(X) for obs in self.observables])
        return X
`,
  };
}

function makePythonSourceWithRankTruncation(): { path: string; content: string } {
  return {
    path: 'pydmd/utils.py',
    content: `"""
Utility functions for DMD computations.

Provides rank truncation utilities for SVD-based methods.
"""
import numpy as np

def compute_svd_rank(s, svd_rank=-1, tol=1e-6):
    """Compute the rank truncation for SVD.

    Determines how many singular values to retain based on
    the svd_rank parameter or automatic truncation criteria.
    """
    if svd_rank == 0:
        # Automatic rank via hard threshold
        omega = lambda x: 0.56 * x**3 - 0.95 * x**2 + 1.82 * x + 1.43
        rank = np.sum(s > omega(np.median(s)) * np.median(s))
        return max(rank, 1)
    elif svd_rank > 0:
        return min(svd_rank, len(s))
    else:
        return len(s)
`,
  };
}

function makePythonSourceWithHankel(): { path: string; content: string } {
  return {
    path: 'pydmd/hankeldmd.py',
    content: `"""
Hankel DMD module.

Uses time-delay embedding via Hankel matrix construction to capture
temporal relationships in the data.
"""
import numpy as np

class HankelDMD(DMDBase):
    """DMD with time-delay embedding.

    Constructs a Hankel matrix from the time series data to augment
    the state space with delayed copies. This enables DMD to capture
    dynamics that depend on past states.

    The Hankel matrix H stacks d delayed copies:
    H = [x_0, x_1, ..., x_{n-d}]
        [x_1, x_2, ..., x_{n-d+1}]
        ...
        [x_{d-1}, x_d, ..., x_{n-1}]
    """

    def __init__(self, d=1, svd_rank=-1):
        super().__init__(svd_rank=svd_rank)
        self.d = d

    def _hankel(self, X):
        """Construct the Hankel matrix from input data."""
        n = X.shape[1] - self.d + 1
        return np.vstack([X[:, i:i+n] for i in range(self.d)])
`,
  };
}

function makeVariantSource(
  className: string,
  docstring: string,
  methods: string[] = [],
): { path: string; content: string } {
  const methodDefs = methods
    .map(m => `    def ${m}(self):\n        pass`)
    .join('\n\n');

  return {
    path: `pydmd/${className.toLowerCase()}.py`,
    content: `"""${className} module."""
import numpy as np

class ${className}(DMDBase):
    """${docstring}"""

    def __init__(self, svd_rank=-1):
        super().__init__(svd_rank=svd_rank)

${methodDefs}
`,
  };
}

// --- Tests ---

describe('concept-extractor', () => {
  describe('mathematical concept identification (LRN-03)', () => {
    it('identifies SVD concept from numpy.linalg.svd calls', () => {
      const sources = [makePythonSourceWithSVD()];
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts(sources, manifest);
      const svd = concepts.find(c => c.abbreviation === 'SVD');
      expect(svd).toBeDefined();
      expect(svd!.name).toBe('Singular Value Decomposition');
      expect(svd!.category).toBe('mathematical');
    });

    it('identifies Eigendecomposition concept from eig() calls', () => {
      const sources = [makePythonSourceWithEigen()];
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts(sources, manifest);
      const eigen = concepts.find(c => c.name === 'Eigendecomposition');
      expect(eigen).toBeDefined();
      expect(eigen!.category).toBe('mathematical');
    });

    it('identifies Koopman Operator Theory from docstrings', () => {
      const sources = [makePythonSourceWithKoopman()];
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts(sources, manifest);
      const koopman = concepts.find(c => c.name === 'Koopman Operator Theory');
      expect(koopman).toBeDefined();
      expect(koopman!.category).toBe('mathematical');
    });

    it('identifies Rank Truncation from svd_rank parameter usage', () => {
      const sources = [makePythonSourceWithRankTruncation()];
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts(sources, manifest);
      const rank = concepts.find(c => c.name === 'Rank Truncation');
      expect(rank).toBeDefined();
      expect(rank!.category).toBe('algorithmic');
    });

    it('identifies Time-Delay Embedding from Hankel matrix construction', () => {
      const sources = [makePythonSourceWithHankel()];
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts(sources, manifest);
      const tde = concepts.find(c => c.name === 'Time-Delay Embedding');
      expect(tde).toBeDefined();
      expect(tde!.category).toBe('algorithmic');
    });

    it('each concept has non-empty description and codeLocation', () => {
      const sources = [
        makePythonSourceWithSVD(),
        makePythonSourceWithEigen(),
        makePythonSourceWithKoopman(),
      ];
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts(sources, manifest);
      expect(concepts.length).toBeGreaterThanOrEqual(3);
      for (const c of concepts) {
        expect(c.description.length).toBeGreaterThan(10);
        expect(c.codeLocation.length).toBeGreaterThanOrEqual(1);
        expect(c.category).toBeTruthy();
      }
    });
  });

  describe('algorithm variant extraction', () => {
    it('extracts BOPDMD variant with bagging info', () => {
      const source = makeVariantSource(
        'BOPDMD',
        `Bagging Optimized DMD.

Unlike standard DMD, BOP-DMD uses bagging (bootstrap aggregating)
to produce robust eigenvalue estimates. Additionally, it applies
optimization to refine the DMD modes.

The mathematical basis is a bagging ensemble of optimized SVD decompositions.

See tutorials/tutorial_8 for usage.`,
        ['fit', 'predict'],
      );
      const manifest = makeRepoManifest();
      const { variants } = extractConcepts([source], manifest);
      const bop = variants.find(v => v.class === 'BOPDMD');
      expect(bop).toBeDefined();
      expect(bop!.name).toContain('BOP');
      expect(bop!.purpose.length).toBeGreaterThan(0);
      expect(bop!.distinguishing.length).toBeGreaterThanOrEqual(1);
      expect(bop!.mathBasis.length).toBeGreaterThan(0);
      expect(bop!.tutorial).toBe(8);
    });

    it('extracts MrDMD variant with multi-resolution features', () => {
      const source = makeVariantSource(
        'MrDMD',
        `Multi-Resolution Dynamic Mode Decomposition.

Performs DMD at multiple temporal resolutions, specifically designed for
multi-resolution decomposition of complex signals.

Mathematical basis: recursive SVD at successive temporal scales.`,
        ['fit', 'predict'],
      );
      const manifest = makeRepoManifest();
      const { variants } = extractConcepts([source], manifest);
      const mr = variants.find(v => v.class === 'MrDMD');
      expect(mr).toBeDefined();
      expect(mr!.distinguishing).toEqual(
        expect.arrayContaining([expect.stringMatching(/multi-resolution/i)]),
      );
    });

    it('extracts DMDc variant with control parameters', () => {
      const source: { path: string; content: string } = {
        path: 'pydmd/dmdc.py',
        content: `"""DMDc module."""
import numpy as np

class DMDc(DMDBase):
    """DMD with Control.

    Extends standard DMD to incorporate external control inputs.
    The system model becomes: x_{k+1} = A x_k + B u_k

    Unlike standard DMD, this variant accounts for exogenous control signals.

    Mathematical basis: joint SVD of augmented state-control matrix.
    """

    def __init__(self, svd_rank=-1, B=None):
        super().__init__(svd_rank=svd_rank)
        self.B = B
`,
      };
      const manifest = makeRepoManifest();
      const { variants } = extractConcepts([source], manifest);
      const dmdc = variants.find(v => v.class === 'DMDc');
      expect(dmdc).toBeDefined();
      expect(dmdc!.name).toContain('Control');
      expect(dmdc!.parameters.some(p => p.name === 'B')).toBe(true);
    });

    it('extracts EDMD variant referencing Koopman', () => {
      const sources = [makePythonSourceWithKoopman()];
      const manifest = makeRepoManifest();
      const { variants } = extractConcepts(sources, manifest);
      const edmd = variants.find(v => v.class === 'EDMD');
      expect(edmd).toBeDefined();
      expect(edmd!.mathBasis.toLowerCase()).toContain('koopman');
      expect(edmd!.tutorial).toBe(12);
    });

    it('each variant has non-empty required fields', () => {
      const sources = [
        makePythonSourceWithSVD(),
        makePythonSourceWithKoopman(),
        makeVariantSource('BOPDMD', 'Bagging Optimized DMD. Uses bagging for robust SVD. Mathematical basis: bagging SVD.'),
      ];
      const manifest = makeRepoManifest();
      const { variants } = extractConcepts(sources, manifest);
      for (const v of variants) {
        expect(v.name.length).toBeGreaterThan(0);
        expect(v.class.length).toBeGreaterThan(0);
        expect(v.purpose.length).toBeGreaterThan(0);
        expect(v.distinguishing.length).toBeGreaterThanOrEqual(1);
        expect(v.mathBasis.length).toBeGreaterThan(0);
      }
    });

    it('populates tutorial number from "Tutorial N" reference', () => {
      const source = makeVariantSource(
        'FbDMD',
        'Forward-Backward DMD.\n\nSee Tutorial 5 for details.\n\nMathematical basis: averaged forward-backward SVD.',
      );
      const manifest = makeRepoManifest();
      const { variants } = extractConcepts([source], manifest);
      const fb = variants.find(v => v.class === 'FbDMD');
      expect(fb).toBeDefined();
      expect(fb!.tutorial).toBe(5);
    });

    it('sets tutorial to null when no tutorial reference', () => {
      const source = makeVariantSource(
        'SpDMD',
        'Sparsity-Promoting DMD.\n\nPromotes sparsity in the DMD solution.\n\nMathematical basis: L1-regularized optimization.',
      );
      const manifest = makeRepoManifest();
      const { variants } = extractConcepts([source], manifest);
      const sp = variants.find(v => v.class === 'SpDMD');
      expect(sp).toBeDefined();
      expect(sp!.tutorial).toBeNull();
    });
  });

  describe('docstring mining', () => {
    it('extracts LaTeX mathematical formulation from docstrings', () => {
      const sources = [makePythonSourceWithSVD()];
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts(sources, manifest);
      const svd = concepts.find(c => c.abbreviation === 'SVD');
      expect(svd).toBeDefined();
      expect(svd!.mathematicalFormulation).toBeTruthy();
      expect(svd!.mathematicalFormulation).toContain('$');
    });

    it('sets mathematicalFormulation to null when no math in docstring', () => {
      const source: { path: string; content: string } = {
        path: 'pydmd/simple.py',
        content: `"""Simple module with no math formulas."""

class SimpleThing(DMDBase):
    """A simple thing with no mathematical content.

    This class does basic operations.

    Mathematical basis: simple averaging.
    """

    def __init__(self):
        pass
`,
      };
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts([source], manifest);
      // concepts from this source should have null formulation if no LaTeX
      const mathConcepts = concepts.filter(c => c.mathematicalFormulation !== null);
      // No LaTeX in this source, so no concept should have a formulation from it
      for (const c of concepts) {
        if (c.codeLocation.length === 1 && c.codeLocation[0] === 'pydmd/simple.py') {
          expect(c.mathematicalFormulation).toBeNull();
        }
      }
    });

    it('extracts reference info from docstrings', () => {
      const sources = [makePythonSourceWithSVD()];
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts(sources, manifest);
      const svd = concepts.find(c => c.abbreviation === 'SVD');
      expect(svd).toBeDefined();
      // SVD source has a References section
      expect(svd!.description.length).toBeGreaterThan(20);
    });
  });

  describe('related concept linking', () => {
    it('links SVD and Eigendecomposition bidirectionally', () => {
      const sources = [makePythonSourceWithSVD(), makePythonSourceWithEigen()];
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts(sources, manifest);
      const svd = concepts.find(c => c.abbreviation === 'SVD');
      const eigen = concepts.find(c => c.name === 'Eigendecomposition');
      expect(svd).toBeDefined();
      expect(eigen).toBeDefined();
      expect(svd!.relatedConcepts).toContain('Eigendecomposition');
      expect(eigen!.relatedConcepts).toContain('Singular Value Decomposition');
    });

    it('links Koopman concept to EDMD variant', () => {
      const sources = [makePythonSourceWithKoopman()];
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts(sources, manifest);
      const koopman = concepts.find(c => c.name === 'Koopman Operator Theory');
      expect(koopman).toBeDefined();
      expect(koopman!.relatedConcepts).toContain('EDMD');
    });
  });

  describe('complex plane connection strings', () => {
    it('assigns connection for eigenvalue-related concepts', () => {
      const sources = [makePythonSourceWithEigen()];
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts(sources, manifest);
      const eigen = concepts.find(c => c.name === 'Eigendecomposition');
      expect(eigen).toBeDefined();
      expect(eigen!.complexPlaneConnection).toBeTruthy();
      expect(eigen!.complexPlaneConnection!.length).toBeGreaterThan(20);
    });

    it('assigns null for concepts with no complex plane link', () => {
      const sources = [makePythonSourceWithRankTruncation()];
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts(sources, manifest);
      const rank = concepts.find(c => c.name === 'Rank Truncation');
      expect(rank).toBeDefined();
      expect(rank!.complexPlaneConnection).toBeNull();
    });
  });

  describe('structured JSON output (LRN-07)', () => {
    it('outputs concepts matching ExtractedConcept interface', () => {
      const sources = [
        makePythonSourceWithSVD(),
        makePythonSourceWithEigen(),
        makePythonSourceWithKoopman(),
      ];
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts(sources, manifest);
      for (const c of concepts) {
        expect(typeof c.name).toBe('string');
        expect(typeof c.abbreviation).toBe('string');
        expect(typeof c.category).toBe('string');
        expect(['mathematical', 'algorithmic', 'domain']).toContain(c.category);
        expect(typeof c.description).toBe('string');
        expect(c.mathematicalFormulation === null || typeof c.mathematicalFormulation === 'string').toBe(true);
        expect(Array.isArray(c.codeLocation)).toBe(true);
        expect(Array.isArray(c.relatedConcepts)).toBe(true);
        expect(c.complexPlaneConnection === null || typeof c.complexPlaneConnection === 'string').toBe(true);
      }
    });

    it('outputs variants matching AlgorithmVariant interface', () => {
      const sources = [
        makePythonSourceWithSVD(),
        makePythonSourceWithKoopman(),
        makeVariantSource('BOPDMD', 'Bagging Optimized DMD. Uses bagging. Mathematical basis: bagging SVD.'),
      ];
      const manifest = makeRepoManifest();
      const { variants } = extractConcepts(sources, manifest);
      for (const v of variants) {
        expect(typeof v.name).toBe('string');
        expect(typeof v.class).toBe('string');
        expect(typeof v.purpose).toBe('string');
        expect(Array.isArray(v.distinguishing)).toBe(true);
        expect(Array.isArray(v.parameters)).toBe(true);
        expect(typeof v.mathBasis).toBe('string');
        expect(v.tutorial === null || typeof v.tutorial === 'number').toBe(true);
      }
    });

    it('all category values are valid', () => {
      const sources = [
        makePythonSourceWithSVD(),
        makePythonSourceWithEigen(),
        makePythonSourceWithKoopman(),
        makePythonSourceWithRankTruncation(),
        makePythonSourceWithHankel(),
      ];
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts(sources, manifest);
      const validCategories = ['mathematical', 'algorithmic', 'domain'];
      for (const c of concepts) {
        expect(validCategories).toContain(c.category);
      }
    });
  });

  describe('deduplication', () => {
    it('merges same concept found in multiple files', () => {
      const source1 = makePythonSourceWithSVD();
      const source2: { path: string; content: string } = {
        path: 'pydmd/optdmd.py',
        content: `"""OptDMD module."""
import numpy as np
from scipy.linalg import svd

class OptDMD(DMDBase):
    """Optimized DMD.

    Uses variable projection optimization of the SVD-based decomposition.
    Mathematical basis: variable projection optimization of SVD.
    """

    def fit(self, X):
        U, s, Vh = np.linalg.svd(X, full_matrices=False)
        return self
`,
      };
      const manifest = makeRepoManifest();
      const { concepts } = extractConcepts([source1, source2], manifest);
      const svdConcepts = concepts.filter(c => c.abbreviation === 'SVD');
      expect(svdConcepts).toHaveLength(1);
      expect(svdConcepts[0].codeLocation.length).toBeGreaterThanOrEqual(2);
    });
  });
});
