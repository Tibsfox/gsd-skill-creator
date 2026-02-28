/**
 * Reference document builder for the PyDMD knowledge skill.
 * Transforms a KnowledgeGraph into 4 deep-dive reference markdown files.
 */

import type { KnowledgeGraph, AlgorithmVariant, APIMethod, Concept, Connection } from '../types.js';

/** Set of 4 reference documents generated from a KnowledgeGraph. */
export interface ReferenceSet {
  /** Per-variant detail: class name, purpose, parameters, examples, math basis. */
  algorithmVariants: string;
  /** SVD, eigendecomposition, Koopman theory, DMD operator foundations. */
  mathematicalFoundations: string;
  /** Complete public API catalog grouped by class. */
  apiReference: string;
  /** DMD eigenvalues on the unit circle, continuous vs discrete time. */
  complexPlaneConnections: string;
}

const BACK_LINK = '[Back to SKILL.md](../SKILL.md)\n\n';

/**
 * Build 4 reference documents from a KnowledgeGraph.
 * Each document starts with a back-link to SKILL.md and uses progressive disclosure.
 */
export function buildReferences(graph: KnowledgeGraph): ReferenceSet {
  return {
    algorithmVariants: buildAlgorithmVariants(graph),
    mathematicalFoundations: buildMathematicalFoundations(graph),
    apiReference: buildAPIReference(graph),
    complexPlaneConnections: buildComplexPlaneConnections(graph),
  };
}

// --- Algorithm Variants ---

function buildAlgorithmVariants(graph: KnowledgeGraph): string {
  const lines: string[] = [
    BACK_LINK,
    '# Algorithm Variants Reference\n',
    `PyDMD provides ${graph.concepts.algorithmic.length} algorithm variants, each targeting specific data characteristics and analytical goals.\n`,
    '',
  ];

  for (const variant of graph.concepts.algorithmic) {
    lines.push(buildVariantSection(variant));
  }

  return lines.join('\n');
}

function buildVariantSection(variant: AlgorithmVariant): string {
  const lines: string[] = [];

  // Heading with name and class
  lines.push(`### ${variant.name} (\`${variant.class}\`)\n`);

  // Purpose
  lines.push(`**Purpose:** ${variant.purpose}\n`);

  // Distinguishing features
  if (variant.distinguishing.length > 0) {
    lines.push('**What sets it apart:**\n');
    for (const feature of variant.distinguishing) {
      lines.push(`- ${feature}`);
    }
    lines.push('');
  }

  // Key Parameters
  if (variant.parameters.length > 0) {
    lines.push('**Key Parameters:**\n');
    for (const param of variant.parameters) {
      const defaultStr = param.default !== null ? ` (default: \`${param.default}\`)` : '';
      lines.push(`- \`${param.name}\` (*${param.type}*)${defaultStr} -- ${param.description}`);
    }
    lines.push('');
  }

  // Mathematical Basis
  lines.push(`**Mathematical Basis:** ${variant.mathBasis}\n`);

  // Usage Example
  lines.push('**Usage Example:**\n');
  lines.push('```python');
  lines.push(`from pydmd import ${variant.class}`);
  lines.push('');
  lines.push(`# Create ${variant.name} instance`);
  if (variant.parameters.length > 0) {
    const paramStr = variant.parameters
      .filter(p => p.default !== null)
      .map(p => `${p.name}=${p.default}`)
      .join(', ');
    lines.push(`model = ${variant.class}(${paramStr})`);
  } else {
    lines.push(`model = ${variant.class}()`);
  }
  lines.push('');
  lines.push('# Fit to snapshot data');
  lines.push('model.fit(X)');
  lines.push('');
  lines.push('# Analyze results');
  lines.push('eigenvalues = model.eigs');
  lines.push('modes = model.modes');
  lines.push('reconstructed = model.reconstructed_data');
  lines.push('```\n');

  // Tutorial reference
  if (variant.tutorial !== null) {
    lines.push(`*See Tutorial ${variant.tutorial} for a worked example.*\n`);
  }

  lines.push('---\n');

  return lines.join('\n');
}

// --- Mathematical Foundations ---

function buildMathematicalFoundations(graph: KnowledgeGraph): string {
  const lines: string[] = [
    BACK_LINK,
    '# Mathematical Foundations\n',
    'This document covers the mathematical theory underlying Dynamic Mode Decomposition and its variants.\n',
    '',
  ];

  // SVD section
  lines.push('## Singular Value Decomposition (SVD)\n');
  const svdConcept = graph.concepts.mathematical.find(c =>
    c.name.toLowerCase().includes('singular value'),
  );
  if (svdConcept) {
    lines.push(`${svdConcept.description}\n`);
  }
  lines.push('SVD factorizes the data matrix as $X = U \\Sigma V^*$, where:\n');
  lines.push('- $U$ contains the left singular vectors (spatial modes)');
  lines.push('- $\\Sigma$ holds the singular values (energy ranking)');
  lines.push('- $V^*$ contains the right singular vectors (temporal coefficients)\n');
  lines.push('**Rank Truncation:** By retaining only the top $r$ singular values, DMD filters noise and reduces dimensionality. The `svd_rank` parameter controls this truncation.\n');
  lines.push('');

  // Eigendecomposition section
  lines.push('## Eigendecomposition\n');
  const eigenConcept = graph.concepts.mathematical.find(c =>
    c.name.toLowerCase().includes('eigendecomposition'),
  );
  if (eigenConcept) {
    lines.push(`${eigenConcept.description}\n`);
  }
  lines.push('The DMD operator $A$ is computed such that $X\' \\approx AX$. Its eigendecomposition $A = W \\Lambda W^{-1}$ yields:\n');
  lines.push('- **Eigenvalues** ($\\lambda_i$): encode growth/decay rates and oscillation frequencies');
  lines.push('- **Eigenvectors** ($w_i$): the DMD modes representing spatial patterns\n');
  lines.push('In discrete time, eigenvalues on the unit circle indicate neutral stability. Inside the circle means decay; outside means growth.\n');
  lines.push('');

  // DMD Operator
  lines.push('## The DMD Operator\n');
  lines.push('DMD seeks the best-fit linear operator $A$ satisfying $X\' \\approx AX$, where $X$ and $X\'$ are time-shifted snapshot matrices. Rather than computing $A$ directly (which may be very large), DMD projects onto the SVD subspace:\n');
  lines.push('$$\\tilde{A} = U^* X\' V \\Sigma^{-1}$$\n');
  lines.push('This reduced operator captures the essential dynamics in a lower-dimensional space.\n');
  lines.push('');

  // Koopman theory
  lines.push('## Koopman Operator Theory\n');
  const koopmanConcept = graph.concepts.mathematical.find(c =>
    c.name.toLowerCase().includes('koopman'),
  );
  if (koopmanConcept) {
    lines.push(`${koopmanConcept.description}\n`);
  }
  lines.push('The Koopman operator is an infinite-dimensional linear operator that governs the evolution of observables of a nonlinear dynamical system. Extended DMD (EDMD) and LANDO approximate this operator from data, enabling linear analysis of nonlinear dynamics.\n');
  lines.push('');

  // Connections to PCA/Fourier
  lines.push('## Connections to Related Methods\n');
  lines.push('- **PCA (Principal Component Analysis):** SVD-based like DMD, but PCA captures variance while DMD captures dynamics. DMD modes are ordered by frequency, not energy.');
  lines.push('- **Fourier Analysis:** DMD generalizes Fourier analysis to non-periodic, spatially varying data. Each DMD mode has a single frequency, unlike Fourier which assumes global periodicity.\n');

  return lines.join('\n');
}

// --- API Reference ---

function buildAPIReference(graph: KnowledgeGraph): string {
  const lines: string[] = [
    BACK_LINK,
    '# API Reference\n',
    `Complete public API catalog for PyDMD ${graph.project.version}.\n`,
    '',
  ];

  // Group methods by class
  const methodsByClass = new Map<string, APIMethod[]>();
  for (const method of graph.architecture.apiSurface) {
    const existing = methodsByClass.get(method.class) ?? [];
    existing.push(method);
    methodsByClass.set(method.class, existing);
  }

  // Base class first
  const baseClassName = 'DMDBase';
  const baseMethods = methodsByClass.get(baseClassName);
  if (baseMethods) {
    lines.push(`## ${baseClassName} (Shared Interface)\n`);
    lines.push('All DMD variants inherit these core methods:\n');
    for (const method of baseMethods) {
      lines.push(`### \`${method.name}${method.signature}\`\n`);
      lines.push(`Returns: \`${method.returnType}\`\n`);
      lines.push(`${method.docstring}\n`);
      if (method.isInherited) {
        lines.push('*Inherited from parent class.*\n');
      }
      lines.push('');
    }
    methodsByClass.delete(baseClassName);
  }

  // Variant-specific methods
  if (methodsByClass.size > 0) {
    lines.push('## Variant-Specific Methods\n');
    lines.push('These methods are available only on specific variant classes:\n');

    for (const [className, methods] of Array.from(methodsByClass.entries())) {
      lines.push(`### ${className}\n`);
      for (const method of methods) {
        lines.push(`#### \`${method.name}${method.signature}\`\n`);
        lines.push(`Returns: \`${method.returnType}\`\n`);
        lines.push(`${method.docstring}\n`);
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

// --- Complex Plane Connections ---

function buildComplexPlaneConnections(graph: KnowledgeGraph): string {
  const lines: string[] = [
    BACK_LINK,
    '# Complex Plane Connections\n',
    'How DMD eigenvalues and modes relate to the complex plane framework.\n',
    '',
  ];

  lines.push('## Eigenvalues on the Unit Circle\n');
  lines.push('In discrete-time DMD, the eigenvalue $\\lambda_i$ of the DMD operator encodes both growth/decay and oscillation:\n');
  lines.push('- $|\\lambda_i| = 1$: neutrally stable mode (on the unit circle)');
  lines.push('- $|\\lambda_i| < 1$: decaying mode (inside the unit circle)');
  lines.push('- $|\\lambda_i| > 1$: growing mode (outside the unit circle)');
  lines.push('- $\\arg(\\lambda_i)$: oscillation frequency of the mode\n');
  lines.push('');

  lines.push('## Continuous vs Discrete Time\n');
  lines.push('Continuous-time eigenvalues $\\omega_i = \\log(\\lambda_i) / \\Delta t$ map to the imaginary axis for neutral stability, the left half-plane for decay, and the right half-plane for growth.\n');
  lines.push('');

  // Connections from the knowledge graph
  if (graph.crossReferences.complexPlane.length > 0) {
    lines.push('## Connections\n');
    for (const conn of graph.crossReferences.complexPlane) {
      lines.push(`### ${conn.from} <-> ${conn.to}\n`);
      lines.push(`${conn.relationship}\n`);
      lines.push(`*Connection strength: ${conn.strength.toFixed(2)}*\n`);
      lines.push('');
    }
  }

  // skill-creator connection
  if (graph.crossReferences.skillCreator.length > 0) {
    lines.push('## Connection to Skill-Creator Framework\n');
    for (const conn of graph.crossReferences.skillCreator) {
      lines.push(`- **${conn.from}** relates to **${conn.to}**: ${conn.relationship}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
