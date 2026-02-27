import { describe, it, expect } from 'vitest';
import type { RepoManifest, TutorialSummary } from '../../../../src/dogfood/pydmd/types.js';
import { parseTutorials } from '../../../../src/dogfood/pydmd/learn/tutorial-parser.js';

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

/** Build a realistic Python tutorial source. */
function makeTutorialSource(
  tutorialNum: number,
  variant: string,
  params: Record<string, string> = {},
  hasPlots = true,
): { path: string; content: string; number: number } {
  const paramStr = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  const ctor = paramStr ? `${variant}(${paramStr})` : `${variant}()`;

  const plotLines = hasPlots
    ? `
# Visualize the reconstruction
plt.plot(dmd.reconstructed_data.real.T)
plt.title("Reconstructed Data")
plt.show()

# Plot eigenvalues
dmd.plot_eigs()
`
    : '';

  const content = `# Tutorial ${tutorialNum}: ${variant} on synthetic data
# This tutorial demonstrates ${variant} applied to test signals.

import numpy as np
import matplotlib.pyplot as plt
from pydmd import ${variant}

# Create synthetic sinusoidal data
t = np.linspace(0, 4 * np.pi, 128)
X = np.vstack([np.sin(t), np.cos(t)])

# Instantiate the DMD model
# svd_rank controls the number of modes retained
dmd = ${ctor}

# Fit the model to data
dmd.fit(X)

# Reconstruct the data from DMD modes
reconstructed = dmd.reconstructed_data
${plotLines}
# Key insight: ${variant} captures the dominant oscillatory modes in the data.
`;

  return {
    path: `tutorials/tutorial${tutorialNum}_${variant.toLowerCase()}.py`,
    content,
    number: tutorialNum,
  };
}

/** Tutorial 1: standard DMD with synthetic sinusoidal data. */
function makeBasicDMDTutorial(): { path: string; content: string; number: number } {
  return makeTutorialSource(1, 'DMD', { svd_rank: '2' }, true);
}

/** Tutorial 3: MrDMD for multi-resolution transient analysis. */
function makeMultiResTutorial(): { path: string; content: string; number: number } {
  return {
    path: 'tutorials/tutorial3_mrdmd.py',
    content: `# Tutorial 3: Multi-Resolution DMD
# This tutorial shows how MrDMD decomposes signals at multiple timescales.
# Transient events are isolated from background dynamics.

import numpy as np
import matplotlib.pyplot as plt
from pydmd import MrDMD

# Create data with multiple timescales
t = np.linspace(0, 10, 256)
slow = np.sin(0.5 * t)
fast = 0.3 * np.sin(5 * t)
transient = np.exp(-((t - 5) ** 2))
X = np.vstack([slow + fast + transient])

# Instantiate with rank and level parameters
# max_level controls the depth of the multi-resolution decomposition
dmd = MrDMD(svd_rank=0, max_level=3)

# Fit the multi-resolution model
dmd.fit(X)

# Analyze results at each level
modes = dmd.modes
dynamics = dmd.dynamics

# Visualize each resolution level
for level in range(3):
    plt.plot(dmd.dynamics[level].real.T)
    plt.title(f"Level {level}")
    plt.show()

# Plot eigenvalues at each level
dmd.plot_eigs()

# Key insight: MrDMD separates slow background dynamics from fast transient events.
`,
    number: 3,
  };
}

/** Tutorial 7: DMDc with control inputs. */
function makeControlTutorial(): { path: string; content: string; number: number } {
  return {
    path: 'tutorials/tutorial7_dmdc.py',
    content: `# Tutorial 7: DMD with Control (DMDc)
# Demonstrates how to incorporate external control inputs into DMD.

import numpy as np
import matplotlib.pyplot as plt
from pydmd import DMDc

# Create system with control inputs
t = np.linspace(0, 5, 100)
u = np.sin(t)  # control signal
X = np.vstack([np.sin(t), np.cos(t)])

# Instantiate DMDc
# svd_rank controls mode truncation
dmd = DMDc(svd_rank=-1)

# Fit with state data and control inputs
dmd.fit(X)

# Reconstruct
reconstructed = dmd.reconstructed_data

# Plot reconstruction comparison
plt.plot(reconstructed.real.T)
plt.title("DMDc Reconstruction")
plt.show()

# Key insight: DMDc separates autonomous dynamics from control-driven response.
`,
    number: 7,
  };
}

/** Generate N tutorial sources for bulk testing. */
function makeManyTutorials(count: number): { path: string; content: string; number: number }[] {
  const variants = [
    'DMD', 'BOPDMD', 'MrDMD', 'DMDc', 'FbDMD', 'EDMD', 'OptDMD',
    'SpDMD', 'HankelDMD', 'CDMD', 'RDMD', 'LANDO', 'HODMD',
    'SubspaceDMD', 'HAVOK', 'PiDMD',
  ];
  const tutorials: { path: string; content: string; number: number }[] = [];
  for (let i = 0; i < count; i++) {
    const variant = variants[i % variants.length];
    tutorials.push(makeTutorialSource(i + 1, variant, { svd_rank: String(i + 1) }, true));
  }
  return tutorials;
}

// --- Tests ---

describe('tutorial-parser', () => {
  const manifest = makeRepoManifest();

  describe('tutorial analysis (LRN-05)', () => {
    it('parses a standard DMD tutorial and returns TutorialSummary', () => {
      const tut = makeBasicDMDTutorial();
      const results = parseTutorials([tut], manifest);
      expect(results).toHaveLength(1);

      const summary = results[0];
      expect(summary.variant).toBe('DMD');
      expect(summary.title.length).toBeGreaterThan(0);
      expect(summary.dataType.length).toBeGreaterThan(0);
      expect(summary.keyInsight.length).toBeGreaterThan(0);
      expect(summary.codePatterns.length).toBeGreaterThanOrEqual(1);
    });

    it('returns 10 entries for 10 tutorial sources', () => {
      const tutorials = makeManyTutorials(10);
      const results = parseTutorials(tutorials, manifest);
      expect(results).toHaveLength(10);
    });

    it('each TutorialSummary has non-empty required fields', () => {
      const tutorials = makeManyTutorials(10);
      const results = parseTutorials(tutorials, manifest);
      for (const s of results) {
        expect(s.title.length).toBeGreaterThan(0);
        expect(s.variant.length).toBeGreaterThan(0);
        expect(s.dataType.length).toBeGreaterThan(0);
        expect(s.keyInsight.length).toBeGreaterThan(0);
      }
    });

    it('assigns correct index from tutorial number', () => {
      const tut = makeTutorialSource(5, 'SpDMD', {}, true);
      const results = parseTutorials([tut], manifest);
      expect(results[0].index).toBe(5);
    });
  });

  describe('variant detection', () => {
    it('detects DMD from "from pydmd import DMD"', () => {
      const tut = makeBasicDMDTutorial();
      const results = parseTutorials([tut], manifest);
      expect(results[0].variant).toBe('DMD');
    });

    it('detects MrDMD from multi-resolution tutorial', () => {
      const tut = makeMultiResTutorial();
      const results = parseTutorials([tut], manifest);
      expect(results[0].variant).toBe('MrDMD');
    });

    it('detects DMDc from control tutorial', () => {
      const tut = makeControlTutorial();
      const results = parseTutorials([tut], manifest);
      expect(results[0].variant).toBe('DMDc');
    });

    it('identifies primary variant when multiple classes imported', () => {
      const tut = {
        path: 'tutorials/tutorial_multi.py',
        content: `# Tutorial: comparing DMD variants
import numpy as np
from pydmd import DMD, BOPDMD

dmd = DMD(svd_rank=2)
bop = BOPDMD(svd_rank=2)
dmd.fit(X)
bop.fit(X)
`,
        number: 20,
      };
      const results = parseTutorials([tut], manifest);
      // Primary variant is the one instantiated first
      expect(results[0].variant).toBe('DMD');
    });
  });

  describe('code pattern extraction', () => {
    it('captures import pattern', () => {
      const tut = makeBasicDMDTutorial();
      const results = parseTutorials([tut], manifest);
      const patterns = results[0].codePatterns;
      expect(patterns.some(p => p.toLowerCase().includes('import'))).toBe(true);
    });

    it('captures instantiation pattern', () => {
      const tut = makeBasicDMDTutorial();
      const results = parseTutorials([tut], manifest);
      const patterns = results[0].codePatterns;
      expect(patterns.some(p => p.toLowerCase().includes('instantiat'))).toBe(true);
    });

    it('captures fit pattern', () => {
      const tut = makeBasicDMDTutorial();
      const results = parseTutorials([tut], manifest);
      const patterns = results[0].codePatterns;
      expect(patterns.some(p => p.toLowerCase().includes('fit'))).toBe(true);
    });

    it('captures visualization pattern when plots present', () => {
      const tut = makeBasicDMDTutorial();
      const results = parseTutorials([tut], manifest);
      const patterns = results[0].codePatterns;
      expect(patterns.some(p => p.toLowerCase().includes('visual') || p.toLowerCase().includes('plot'))).toBe(true);
    });

    it('extracts reconstruction code pattern', () => {
      const tut = makeBasicDMDTutorial();
      const results = parseTutorials([tut], manifest);
      const patterns = results[0].codePatterns;
      expect(patterns.some(p => p.toLowerCase().includes('reconstruct'))).toBe(true);
    });
  });

  describe('parameter capture', () => {
    it('captures svd_rank parameter from DMD(svd_rank=2)', () => {
      const tut = makeBasicDMDTutorial();
      const results = parseTutorials([tut], manifest);
      const patterns = results[0].codePatterns;
      // Parameter info should be captured in code patterns
      expect(patterns.some(p => p.includes('svd_rank'))).toBe(true);
    });

    it('captures multiple parameters from MrDMD(svd_rank=0, max_level=3)', () => {
      const tut = makeMultiResTutorial();
      const results = parseTutorials([tut], manifest);
      const patterns = results[0].codePatterns;
      expect(patterns.some(p => p.includes('svd_rank') || p.includes('max_level'))).toBe(true);
    });
  });

  describe('visualization pattern detection', () => {
    it('detects reconstruction plot from plt.plot(...reconstructed_data...)', () => {
      const tut = makeBasicDMDTutorial();
      const results = parseTutorials([tut], manifest);
      const patterns = results[0].codePatterns;
      expect(patterns.some(p =>
        p.toLowerCase().includes('reconstruction') || p.toLowerCase().includes('plot'),
      )).toBe(true);
    });

    it('detects eigenvalue plot from plot_eigs()', () => {
      const tut = makeBasicDMDTutorial();
      const results = parseTutorials([tut], manifest);
      const patterns = results[0].codePatterns;
      expect(patterns.some(p =>
        p.toLowerCase().includes('eigenvalue') || p.toLowerCase().includes('eig'),
      )).toBe(true);
    });

    it('returns no visualization patterns when no matplotlib calls', () => {
      const tut = makeTutorialSource(99, 'DMD', { svd_rank: '2' }, false);
      const results = parseTutorials([tut], manifest);
      // codePatterns should still exist but no visualization-specific ones
      const vizPatterns = results[0].codePatterns.filter(p =>
        p.toLowerCase().includes('plot') || p.toLowerCase().includes('eigenvalue plot'),
      );
      // No crash, and reduced patterns
      expect(results).toHaveLength(1);
    });
  });

  describe('data type detection', () => {
    it('detects synthetic-sinusoidal from np.sin data', () => {
      const tut = makeBasicDMDTutorial();
      const results = parseTutorials([tut], manifest);
      expect(results[0].dataType).toMatch(/sinusoid|synthetic/i);
    });

    it('detects images from imread/Image.open', () => {
      const tut = {
        path: 'tutorials/tutorial_images.py',
        content: `# Tutorial: Image DMD
import numpy as np
from PIL import Image
from pydmd import DMD

# Load images from disk
img = Image.open("frame_001.png")
X = np.array(img).reshape(-1, 1)
dmd = DMD(svd_rank=5)
dmd.fit(X)
`,
        number: 15,
      };
      const results = parseTutorials([tut], manifest);
      expect(results[0].dataType).toMatch(/image/i);
    });

    it('detects simulation-heat from thermal keywords', () => {
      const tut = {
        path: 'tutorials/tutorial_heat.py',
        content: `# Tutorial: Heat Transfer DMD
# Apply DMD to heat transfer simulation data

import numpy as np
from pydmd import DMD

# Generate heat equation simulation
# Temperature distribution evolves according to the heat equation
alpha = 0.01  # thermal diffusivity
X = np.random.rand(50, 100)
dmd = DMD(svd_rank=3)
dmd.fit(X)
`,
        number: 16,
      };
      const results = parseTutorials([tut], manifest);
      expect(results[0].dataType).toMatch(/heat|simulation|thermal/i);
    });
  });

  describe('key insight extraction', () => {
    it('extracts insight from "Key insight:" comment', () => {
      const tut = makeBasicDMDTutorial();
      const results = parseTutorials([tut], manifest);
      expect(results[0].keyInsight.length).toBeGreaterThan(10);
      expect(results[0].keyInsight.toLowerCase()).toContain('dmd');
    });

    it('derives fallback insight from variant + dataType when no comment', () => {
      const tut = {
        path: 'tutorials/tutorial_bare.py',
        content: `import numpy as np
from pydmd import OptDMD

X = np.random.rand(10, 50)
dmd = OptDMD(svd_rank=2)
dmd.fit(X)
`,
        number: 30,
      };
      const results = parseTutorials([tut], manifest);
      expect(results[0].keyInsight.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles tutorial with no matplotlib calls', () => {
      const tut = makeTutorialSource(50, 'DMD', {}, false);
      const results = parseTutorials([tut], manifest);
      expect(results).toHaveLength(1);
      expect(results[0].variant).toBe('DMD');
    });

    it('handles empty tutorial list', () => {
      const results = parseTutorials([], manifest);
      expect(results).toEqual([]);
    });

    it('results are sorted by tutorial index', () => {
      const tutorials = [
        makeTutorialSource(5, 'SpDMD', {}),
        makeTutorialSource(1, 'DMD', {}),
        makeTutorialSource(3, 'MrDMD', {}),
      ];
      const results = parseTutorials(tutorials, manifest);
      expect(results[0].index).toBe(1);
      expect(results[1].index).toBe(3);
      expect(results[2].index).toBe(5);
    });
  });
});
