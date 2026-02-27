/**
 * Tutorial parser: extracts usage workflows, parameter choices, and
 * visualization patterns from PyDMD tutorial Python files.
 *
 * Phase 405 Plan 03 -- Track C of the learn engine.
 */

import type { RepoManifest, TutorialSummary } from '../../types.js';

// --- Known DMD class names ---

const KNOWN_DMD_CLASSES = new Set([
  'DMD', 'BOPDMD', 'MrDMD', 'DMDc', 'FbDMD', 'EDMD', 'OptDMD',
  'SpDMD', 'HankelDMD', 'CDMD', 'RDMD', 'LANDO', 'HODMD',
  'SubspaceDMD', 'HAVOK', 'PiDMD', 'ParametricDMD', 'SPDMD',
]);

// --- Variant detection ---

/** Extract the primary DMD class imported from pydmd. */
function detectVariant(content: string): string {
  // Collect all imported DMD classes
  const importPattern = /from\s+pydmd\s+import\s+(.+)/g;
  const imported: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = importPattern.exec(content)) !== null) {
    const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0].trim());
    for (const name of names) {
      if (KNOWN_DMD_CLASSES.has(name)) {
        imported.push(name);
      }
    }
  }

  // Also check "import pydmd" style
  const importAllPattern = /import\s+pydmd/;
  if (importAllPattern.test(content) && imported.length === 0) {
    // Look for pydmd.ClassName usage
    for (const cls of KNOWN_DMD_CLASSES) {
      if (content.includes(`pydmd.${cls}`)) {
        imported.push(cls);
      }
    }
  }

  if (imported.length === 0) return 'Unknown';
  if (imported.length === 1) return imported[0];

  // Multiple imports: find the one instantiated first
  let earliest = Infinity;
  let primary = imported[0];
  for (const cls of imported) {
    const ctorPattern = new RegExp(`\\b${cls}\\s*\\(`);
    const ctorMatch = ctorPattern.exec(content);
    if (ctorMatch && ctorMatch.index < earliest) {
      earliest = ctorMatch.index;
      primary = cls;
    }
  }
  return primary;
}

// --- Title extraction ---

function extractTitle(content: string, tutorialNum: number, variant: string): string {
  const lines = content.split('\n');

  // Look for first markdown-style comment line that is a title
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ') && !trimmed.startsWith('#!')) {
      const title = trimmed.slice(2).trim();
      if (title.length > 3) return title;
    }
  }

  // Look for module docstring
  const docMatch = content.match(/^[\s]*"""([\s\S]*?)"""/);
  if (docMatch) {
    const firstLine = docMatch[1].trim().split('\n')[0].trim();
    if (firstLine.length > 3) return firstLine;
  }

  return `Tutorial ${tutorialNum}: ${variant}`;
}

// --- Data type detection ---

function detectDataType(content: string): string {
  const lower = content.toLowerCase();

  // Image detection
  if (
    lower.includes('imread') ||
    lower.includes('image.open') ||
    lower.includes('.png') ||
    lower.includes('.jpg') ||
    lower.includes('.jpeg')
  ) {
    return 'images';
  }

  // Video detection
  if (lower.includes('video') || (lower.includes('frame') && lower.includes('imshow'))) {
    return 'video';
  }

  // Heat/thermal simulation
  if (
    lower.includes('heat') ||
    lower.includes('thermal') ||
    lower.includes('temperature') ||
    lower.includes('diffusivity')
  ) {
    return 'simulation-heat';
  }

  // Sinusoidal synthetic data
  if (lower.includes('np.sin') || lower.includes('np.cos') || lower.includes('sinusoid')) {
    return 'synthetic-sinusoidal';
  }

  // Noisy data
  if (lower.includes('np.random') && lower.includes('noise')) {
    return 'synthetic-noisy';
  }

  // Generic numerical data
  if (
    lower.includes('np.array') ||
    lower.includes('np.load') ||
    lower.includes('np.random')
  ) {
    return 'numerical-dataset';
  }

  return 'unknown';
}

// --- Code pattern extraction ---

interface PatternRule {
  name: string;
  test: (content: string) => boolean;
  detail: (content: string) => string;
}

const PATTERN_RULES: PatternRule[] = [
  {
    name: 'import',
    test: (c) => /from\s+pydmd\s+import|import\s+pydmd/.test(c),
    detail: (c) => {
      const m = c.match(/from\s+pydmd\s+import\s+(.+)/);
      return m ? `Import DMD class: ${m[1].trim().split(',')[0].trim()}` : 'Import pydmd';
    },
  },
  {
    name: 'data-creation',
    test: (c) => /np\.(sin|cos|random|array|vstack|load|linspace)/.test(c),
    detail: (_c) => 'Create/load data',
  },
  {
    name: 'instantiation',
    test: (c) => {
      for (const cls of KNOWN_DMD_CLASSES) {
        if (new RegExp(`\\b${cls}\\s*\\(`).test(c)) return true;
      }
      return false;
    },
    detail: (c) => {
      // Find the instantiation line and capture parameters
      for (const cls of KNOWN_DMD_CLASSES) {
        const m = c.match(new RegExp(`(${cls}\\s*\\([^)]*\\))`));
        if (m) {
          return `Instantiate ${cls} with parameters: ${m[1]}`;
        }
      }
      return 'Instantiate DMD variant';
    },
  },
  {
    name: 'fit',
    test: (c) => /\.fit\s*\(/.test(c),
    detail: (_c) => 'Fit model to data',
  },
  {
    name: 'reconstruct',
    test: (c) => /\.reconstructed_data|\.reconstruct/.test(c),
    detail: (_c) => 'Reconstruct data from DMD modes',
  },
  {
    name: 'analysis',
    test: (c) => /\.eigs|\.modes|\.dynamics/.test(c),
    detail: (c) => {
      const parts: string[] = [];
      if (/\.eigs/.test(c)) parts.push('eigenvalues');
      if (/\.modes/.test(c)) parts.push('modes');
      if (/\.dynamics/.test(c)) parts.push('dynamics');
      return `Analyze results: ${parts.join(', ')}`;
    },
  },
  {
    name: 'predict',
    test: (c) => /\.predict\s*\(|\.forecast\s*\(/.test(c),
    detail: (_c) => 'Predict future states',
  },
  {
    name: 'visualization-reconstruction',
    test: (c) => /plt\.plot.*reconstructed|plt\.plot.*reconstruct/i.test(c),
    detail: (_c) => 'Reconstruction comparison plot',
  },
  {
    name: 'visualization-eigenvalue',
    test: (c) => /plot_eigs|\.eigs.*plt|plt.*eig/i.test(c),
    detail: (_c) => 'Eigenvalue scatter plot',
  },
  {
    name: 'visualization-mode',
    test: (c) => /plt\.imshow.*mode|mode.*imshow/i.test(c),
    detail: (_c) => 'Mode shape visualization',
  },
  {
    name: 'visualization-dynamics',
    test: (c) => /plt\.plot.*dynamics/i.test(c),
    detail: (_c) => 'Temporal dynamics plot',
  },
  {
    name: 'visualization-generic',
    test: (c) => /plt\.(plot|imshow|show|figure)/.test(c),
    detail: (_c) => 'Visualize results',
  },
];

function extractCodePatterns(content: string): string[] {
  const patterns: string[] = [];
  const seen = new Set<string>();

  for (const rule of PATTERN_RULES) {
    if (rule.test(content) && !seen.has(rule.name)) {
      seen.add(rule.name);
      patterns.push(rule.detail(content));
    }
  }

  return patterns;
}

// --- Key insight extraction ---

function extractKeyInsight(content: string, variant: string, dataType: string): string {
  const lines = content.split('\n');

  // Look for explicit "Key insight:" comment
  for (const line of lines) {
    const trimmed = line.trim();
    const insightMatch = trimmed.match(/^#\s*[Kk]ey\s+[Ii]nsight:\s*(.+)/);
    if (insightMatch) {
      return insightMatch[1].trim();
    }
  }

  // Look for final narrative comments (lines starting with # that form sentences)
  const narrativeComments: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ') && !trimmed.startsWith('#!')) {
      const comment = trimmed.slice(2).trim();
      // Filter out section headers (all caps, short) and code-like comments
      if (comment.length > 20 && !comment.match(/^[A-Z\s]+$/) && comment.includes(' ')) {
        narrativeComments.push(comment);
      }
    }
  }

  if (narrativeComments.length > 0) {
    return narrativeComments[narrativeComments.length - 1];
  }

  // Fallback
  return `Demonstrates ${variant} applied to ${dataType} data.`;
}

// --- Main export ---

/** Parse tutorial Python files to extract usage workflows, parameter choices,
 *  and visualization patterns. */
export function parseTutorials(
  tutorials: { path: string; content: string; number: number }[],
  _manifest: RepoManifest,
): TutorialSummary[] {
  const summaries: TutorialSummary[] = [];

  for (const tut of tutorials) {
    const variant = detectVariant(tut.content);
    const title = extractTitle(tut.content, tut.number, variant);
    const dataType = detectDataType(tut.content);
    const codePatterns = extractCodePatterns(tut.content);
    const keyInsight = extractKeyInsight(tut.content, variant, dataType);

    summaries.push({
      index: tut.number,
      title,
      variant,
      dataType,
      keyInsight,
      codePatterns,
    });
  }

  // Sort by index
  summaries.sort((a, b) => a.index - b.index);

  return summaries;
}
