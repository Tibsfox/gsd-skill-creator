/**
 * Skill composer: transforms a KnowledgeGraph into a progressive-disclosure SKILL.md.
 * Phase 406 Plan 01 -- the primary deliverable of the v1.44 milestone.
 *
 * Takes a fully-assembled KnowledgeGraph (from the learn engine) and produces
 * a complete SKILL.md string under 5000 words, with 10 sections following
 * the progressive disclosure format.
 */

import type { KnowledgeGraph, AlgorithmVariant, Pitfall, UsagePattern } from '../types.js';
import type { CompositionConfig, GeneratedSkill, SkillSection } from './types.js';
import { formatDecisionTree } from './decision-tree-formatter.js';
import { countWords } from './word-counter.js';

/** Default composition configuration. */
const DEFAULT_CONFIG: CompositionConfig = {
  maxWords: 5000,
  includeCodeExamples: true,
  includePitfalls: true,
};

/**
 * Compose a SKILL.md from a KnowledgeGraph.
 *
 * Builds each of the 10 required sections in progressive disclosure order,
 * enforces the word count limit, and returns a GeneratedSkill with metadata.
 */
export function composeSkill(
  graph: KnowledgeGraph,
  config?: Partial<CompositionConfig>,
): GeneratedSkill {
  const cfg: CompositionConfig = { ...DEFAULT_CONFIG, ...config };
  const warnings: string[] = [];

  // Build all 10 sections in order
  const sections: SkillSection[] = [
    buildQuickReference(graph, 1),
    buildWhenToUse(graph, 2),
    buildCorePattern(graph, cfg, 3),
    buildChoosingAlgorithm(graph, 4),
    buildCoreConcepts(graph, 5),
    buildCommonPatterns(graph, cfg, 6),
    buildVisualization(graph, cfg, 7),
    buildCommonPitfalls(graph, cfg, 8),
    buildReferences(9),
    buildScripts(10),
  ];

  // Assemble full markdown
  let skillMd = `# PyDMD -- Dynamic Mode Decomposition Skill\n\n`;
  skillMd += `> ${graph.project.description} (v${graph.project.version})\n\n`;

  for (const section of sections) {
    skillMd += section.content + '\n\n';
  }

  // Trim trailing whitespace
  skillMd = skillMd.trimEnd() + '\n';

  // Count words (excludes code blocks per spec)
  let wordCount = countWords(skillMd);

  // Enforce word limit
  if (wordCount > cfg.maxWords) {
    // Truncate pitfalls section first
    const truncatedPitfalls = truncatePitfalls(graph, cfg);
    const pitfallIdx = sections.findIndex(s => s.heading === 'Common Pitfalls');
    if (pitfallIdx >= 0) {
      sections[pitfallIdx] = truncatedPitfalls;
    }

    // Reassemble
    skillMd = `# PyDMD -- Dynamic Mode Decomposition Skill\n\n`;
    skillMd += `> ${graph.project.description} (v${graph.project.version})\n\n`;
    for (const section of sections) {
      skillMd += section.content + '\n\n';
    }
    skillMd = skillMd.trimEnd() + '\n';
    wordCount = countWords(skillMd);

    warnings.push(`Word count exceeded ${cfg.maxWords}; pitfalls section was truncated.`);
  } else if (wordCount > cfg.maxWords - 500) {
    warnings.push(`Word count (${wordCount}) is approaching the ${cfg.maxWords}-word limit.`);
  }

  return { skillMd, wordCount, sections, warnings };
}

// --- Section builders ---

function buildQuickReference(graph: KnowledgeGraph, order: number): SkillSection {
  const lines: string[] = [
    '## Quick Reference',
    '',
    `**Library:** ${graph.project.name} v${graph.project.version}`,
    `**License:** ${graph.project.license}`,
    `**Install:** \`pip install pydmd\``,
    '',
    '```python',
    'from pydmd import DMD',
    'dmd = DMD(svd_rank=2)',
    'dmd.fit(X)  # X: (n_features, n_snapshots)',
    '```',
  ];

  return { heading: 'Quick Reference', content: lines.join('\n'), order };
}

function buildWhenToUse(graph: KnowledgeGraph, order: number): SkillSection {
  const triggers = [
    'dynamic mode decomposition',
    'spatiotemporal modes',
    'data-driven dynamics',
    'PyDMD',
    'DMD analysis',
    'eigenvalue analysis of time series',
  ];

  const domainNames = graph.concepts.domain.map(c => c.name.toLowerCase());
  const extraTriggers = domainNames.filter(
    n => !triggers.some(t => t.toLowerCase() === n),
  );

  const allTriggers = [...triggers, ...extraTriggers].slice(0, 8);

  const lines: string[] = [
    '## When to Use',
    '',
    'Activate this skill when the user mentions:',
    '',
    ...allTriggers.map(t => `- "${t}"`),
    '',
    `**What it does:** ${graph.project.description}. Decomposes spatiotemporal data ` +
    'into modes, eigenvalues, and dynamics for analysis, reconstruction, and prediction.',
  ];

  return { heading: 'When to Use', content: lines.join('\n'), order };
}

function buildCorePattern(
  graph: KnowledgeGraph,
  cfg: CompositionConfig,
  order: number,
): SkillSection {
  // Find the standard workflow pattern
  const stdWorkflow = graph.patterns.usage.find(
    p => p.name.toLowerCase().includes('standard') || p.name.toLowerCase().includes('workflow'),
  );

  const steps = stdWorkflow
    ? stdWorkflow.steps
    : ['Import DMD class', 'Create or load data', 'Instantiate variant', 'Fit model', 'Analyze results'];

  const lines: string[] = [
    '## The Core Pattern',
    '',
    'Every PyDMD analysis follows the same fundamental workflow:',
    '',
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    '',
  ];

  if (cfg.includeCodeExamples) {
    lines.push(
      '```python',
      'import numpy as np',
      'from pydmd import DMD',
      '',
      '# 1. Prepare data: (n_features, n_snapshots)',
      'X = np.load("snapshots.npy")',
      '',
      '# 2. Create and fit',
      'dmd = DMD(svd_rank=2)',
      'dmd.fit(X)',
      '',
      '# 3. Analyze',
      'print(f"Eigenvalues: {dmd.eigs}")',
      'print(f"Modes shape: {dmd.modes.shape}")',
      '',
      '# 4. Reconstruct',
      'X_reconstructed = dmd.reconstructed_data.real',
      '```',
    );
  }

  return { heading: 'The Core Pattern', content: lines.join('\n'), order };
}

function buildChoosingAlgorithm(graph: KnowledgeGraph, order: number): SkillSection {
  const lines: string[] = [
    '## Choosing Your Algorithm',
    '',
    `PyDMD provides ${graph.concepts.algorithmic.length} algorithm variants. ` +
    'Use the following guide to select the right one for your data characteristics.',
    '',
  ];

  // Format the decision tree as prose
  if (graph.patterns.selection.length > 0) {
    lines.push(formatDecisionTree(graph.patterns.selection));
    lines.push('');
  }

  // Quick selection table
  lines.push('### Quick Selection Table');
  lines.push('');
  lines.push('| Data Characteristic | Variant | Key Parameter |');
  lines.push('| --- | --- | --- |');

  const tableRows = buildSelectionTableRows(graph.concepts.algorithmic);
  lines.push(...tableRows);

  return { heading: 'Choosing Your Algorithm', content: lines.join('\n'), order };
}

function buildSelectionTableRows(variants: AlgorithmVariant[]): string[] {
  const rows: string[] = [];

  const characteristics: { trait: string; cls: string; param: string }[] = [
    { trait: 'Clean, stationary data', cls: 'DMD', param: '`svd_rank`' },
    { trait: 'Noisy measurements', cls: 'FbDMD', param: '`svd_rank`' },
    { trait: 'High noise, unknown level', cls: 'BOPDMD', param: '`trial_size`' },
    { trait: 'Multiple timescales', cls: 'MrDMD', param: '`max_level`' },
    { trait: 'Control inputs present', cls: 'DMDc', param: '`svd_rank`' },
    { trait: 'Nonlinear dynamics (weak)', cls: 'EDMD', param: '`kernel`' },
    { trait: 'Nonlinear dynamics (strong)', cls: 'LANDO', param: '`kernel`' },
    { trait: 'Optimal eigenvalue fit', cls: 'OptDMD', param: '`svd_rank`' },
    { trait: 'Sparse mode selection', cls: 'SpDMD', param: '`gamma`' },
    { trait: 'Time-delay embedding', cls: 'HankelDMD', param: '`d`' },
    { trait: 'Very large dataset (compress)', cls: 'CDMD', param: '`compression_matrix`' },
    { trait: 'Very large dataset (random)', cls: 'RDMD', param: '`svd_rank`' },
  ];

  for (const ch of characteristics) {
    // Only include if the variant exists in the graph
    const variant = variants.find(v => v.class === ch.cls);
    if (variant) {
      rows.push(`| ${ch.trait} | \`${variant.class}\` | ${ch.param} |`);
    }
  }

  return rows;
}

function buildCoreConcepts(graph: KnowledgeGraph, order: number): SkillSection {
  const mathConcepts = graph.concepts.mathematical;
  const complexPlane = graph.crossReferences.complexPlane;

  const lines: string[] = [
    '## Core Concepts',
    '',
    '### Modes, Eigenvalues, and Dynamics',
    '',
    'DMD decomposes data into three components:',
    '',
    '- **Spatial modes** -- coherent spatial patterns in the data. Each mode captures ' +
    'a structure that evolves with a single frequency and growth/decay rate.',
    '- **Eigenvalues** -- complex numbers encoding the temporal behavior of each mode. ' +
    'The magnitude determines growth (>1) or decay (<1); the angle determines oscillation frequency.',
    '- **Dynamics** -- the time evolution of each mode, computed as powers of the eigenvalues.',
    '',
  ];

  // Add mathematical foundations from knowledge graph
  if (mathConcepts.length > 0) {
    lines.push('### Mathematical Foundations');
    lines.push('');
    for (const concept of mathConcepts.slice(0, 3)) {
      lines.push(`**${concept.name}:** ${concept.description}`);
      lines.push('');
    }
  }

  // Add complex plane connection
  if (complexPlane.length > 0) {
    lines.push('### Connection to the Complex Plane');
    lines.push('');
    lines.push(
      'DMD eigenvalues live on the complex plane. ' +
      complexPlane[0].relationship + ' ' +
      'This framework connects directly to signal processing, ' +
      'control theory, and the skill-creator complex plane learning system.',
    );
  }

  return { heading: 'Core Concepts', content: lines.join('\n'), order };
}

function buildCommonPatterns(
  graph: KnowledgeGraph,
  cfg: CompositionConfig,
  order: number,
): SkillSection {
  const lines: string[] = [
    '## Common Patterns',
    '',
  ];

  // Pattern 1: Basic Analysis
  lines.push('### Basic Analysis');
  lines.push('');
  lines.push('The simplest DMD workflow for clean, stationary data:');
  lines.push('');
  if (cfg.includeCodeExamples) {
    lines.push(
      '```python',
      'from pydmd import DMD',
      'dmd = DMD(svd_rank=2)',
      'dmd.fit(X)',
      'print(dmd.eigs)  # eigenvalues',
      '```',
      '',
    );
  }

  // Pattern 2: Noisy Data
  lines.push('### Noisy Data');
  lines.push('');
  lines.push('When measurements contain noise, use forward-backward averaging:');
  lines.push('');
  if (cfg.includeCodeExamples) {
    lines.push(
      '```python',
      'from pydmd import FbDMD',
      'fbdmd = FbDMD(svd_rank=5)',
      'fbdmd.fit(X_noisy)',
      'X_clean = fbdmd.reconstructed_data.real',
      '```',
      '',
    );
  }

  // Pattern 3: Multiscale
  lines.push('### Multiscale Dynamics');
  lines.push('');
  lines.push('For data with phenomena at different timescales:');
  lines.push('');
  if (cfg.includeCodeExamples) {
    lines.push(
      '```python',
      'from pydmd import MrDMD',
      'mrdmd = MrDMD(svd_rank=-1, max_level=3)',
      'mrdmd.fit(X)',
      'for level in range(mrdmd.max_level):',
      '    print(f"Level {level}: {len(mrdmd.partial_eigs(level))} modes")',
      '```',
      '',
    );
  }

  // Pattern 4: Prediction
  lines.push('### Prediction');
  lines.push('');
  lines.push('Extrapolate the fitted model forward in time:');
  lines.push('');
  if (cfg.includeCodeExamples) {
    lines.push(
      '```python',
      'from pydmd import DMD',
      'dmd = DMD(svd_rank=4)',
      'dmd.fit(X[:, :80])  # train on first 80 snapshots',
      'future = dmd.predict(X[:, 80:])',
      '```',
      '',
    );
  }

  return { heading: 'Common Patterns', content: lines.join('\n'), order };
}

function buildVisualization(
  graph: KnowledgeGraph,
  cfg: CompositionConfig,
  order: number,
): SkillSection {
  const vizPattern = graph.patterns.usage.find(
    p => p.name.toLowerCase().includes('visual'),
  );

  const lines: string[] = [
    '## Visualization',
    '',
    'Key plots for understanding DMD results:',
    '',
    '- **Eigenvalue plot** -- eigenvalues on the complex plane with unit circle',
    '- **Mode shapes** -- spatial structure of each mode',
    '- **Dynamics** -- temporal evolution of mode amplitudes',
    '',
  ];

  if (cfg.includeCodeExamples) {
    const codeLines = vizPattern?.codeExample
      ? vizPattern.codeExample.split('\n')
      : [
        'import matplotlib.pyplot as plt',
        '',
        '# Eigenvalue plot',
        'dmd.plot_eigs(show_axes=True, show_unit_circle=True)',
        '',
        '# Mode shapes',
        'for i, mode in enumerate(dmd.modes.T[:3]):',
        '    plt.figure()',
        '    plt.plot(mode.real, label=f"Mode {i}")',
        '    plt.legend()',
        '    plt.title(f"DMD Mode {i}")',
      ];

    lines.push('```python', ...codeLines, '```');
  }

  return { heading: 'Visualization', content: lines.join('\n'), order };
}

function buildCommonPitfalls(
  graph: KnowledgeGraph,
  cfg: CompositionConfig,
  order: number,
): SkillSection {
  const pitfalls = cfg.includePitfalls ? graph.patterns.pitfalls.slice(0, 5) : [];

  const lines: string[] = [
    '## Common Pitfalls',
    '',
  ];

  if (pitfalls.length === 0) {
    lines.push('No pitfalls documented for current configuration.');
    return { heading: 'Common Pitfalls', content: lines.join('\n'), order };
  }

  for (const pitfall of pitfalls) {
    lines.push(`### ${pitfall.description}`);
    lines.push('');
    lines.push(`**Symptom:** ${pitfall.symptom}`);
    lines.push('');
    lines.push(`**Cause:** ${pitfall.cause}`);
    lines.push('');
    lines.push(`**Solution:** ${pitfall.solution}`);
    lines.push('');
    if (pitfall.affectsVariants.length > 0) {
      lines.push(`**Affects:** ${pitfall.affectsVariants.map(v => `\`${v}\``).join(', ')}`);
      lines.push('');
    }
  }

  return { heading: 'Common Pitfalls', content: lines.join('\n'), order };
}

function buildReferences(order: number): SkillSection {
  const lines: string[] = [
    '## References',
    '',
    'Detailed reference material is available in the `references/` directory:',
    '',
    '- `references/api-catalog.md` -- complete API documentation for all variants',
    '- `references/math-foundations.md` -- mathematical theory behind each algorithm',
    '- `references/variant-details/` -- per-variant deep-dive documentation',
    '- `references/complex-plane.md` -- connection to the complex plane framework',
  ];

  return { heading: 'References', content: lines.join('\n'), order };
}

function buildScripts(order: number): SkillSection {
  const lines: string[] = [
    '## Scripts',
    '',
    'Helper scripts are available in the `scripts/` directory:',
    '',
    '- `scripts/basic-analysis.py` -- standard DMD workflow template',
    '- `scripts/noisy-data.py` -- noise-robust analysis with FbDMD/BOPDMD',
    '- `scripts/multiscale.py` -- multi-resolution decomposition with MrDMD',
  ];

  return { heading: 'Scripts', content: lines.join('\n'), order };
}

/**
 * Build a truncated pitfalls section when word count exceeds limit.
 * Keeps only the top 3 pitfalls with shorter descriptions.
 */
function truncatePitfalls(graph: KnowledgeGraph, cfg: CompositionConfig): SkillSection {
  const pitfalls = graph.patterns.pitfalls.slice(0, 3);

  const lines: string[] = [
    '## Common Pitfalls',
    '',
    '> Note: Truncated to meet word limit. See `references/pitfalls.md` for full list.',
    '',
  ];

  for (const pitfall of pitfalls) {
    lines.push(`- **${pitfall.description}** -- ${pitfall.solution}`);
  }

  return { heading: 'Common Pitfalls', content: lines.join('\n'), order: 8 };
}
