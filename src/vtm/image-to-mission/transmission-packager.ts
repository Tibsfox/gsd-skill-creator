/**
 * Transmission Packager — bundles everything for cross-context handoff.
 *
 * Packages analysis, parameters, build spec, and philosophy into a
 * self-contained TransmissionPackage that another Claude instance can
 * load and use to reproduce or extend the work WITHOUT original images.
 *
 * Solves the transmission problem: creative understanding survives
 * context window boundaries.
 */

import type {
  UnifiedUnderstanding,
  BuildSpec,
  TransmissionPackage,
  TargetMedium,
} from './types.js';

// ============================================================================
// Validation
// ============================================================================

/** Result of self-containment validation. */
export interface ValidationResult {
  valid: boolean;
  checks: { name: string; passed: boolean; detail?: string }[];
}

/**
 * Runs 5 self-containment checks on a transmission package.
 *
 * 1. Parameter completeness — all four categories have values
 * 2. Philosophy coverage — at least 1 note per 3 build steps
 * 3. Process insight present — key understanding captured
 * 4. Observation depth — all four layers populated
 * 5. No dangling references — everything self-contained
 */
export function validate(pkg: TransmissionPackage): ValidationResult {
  const checks: ValidationResult['checks'] = [];

  // 1. Parameter completeness
  const params = pkg.buildSpec.parameters;
  const hasAllParams = params.color.palette.length > 0 &&
    params.geometry.primaryShape.length > 0 &&
    params.material.surfaces.length > 0 &&
    params.feel.energy !== undefined;
  checks.push({
    name: 'parameter-completeness',
    passed: hasAllParams,
    detail: hasAllParams ? undefined : 'Missing values in one or more parameter categories',
  });

  // 2. Philosophy coverage
  const stepsWithNotes = pkg.buildSpec.steps.filter(s => s.philosophyNote).length;
  const expectedNotes = Math.floor(pkg.buildSpec.steps.length / 3);
  const hasPhilosophy = stepsWithNotes >= expectedNotes || pkg.buildSpec.steps.length < 3;
  checks.push({
    name: 'philosophy-coverage',
    passed: hasPhilosophy,
    detail: hasPhilosophy ? undefined
      : `${stepsWithNotes} notes for ${pkg.buildSpec.steps.length} steps (expected >= ${expectedNotes})`,
  });

  // 3. Process insight present
  const hasInsight = !!pkg.analysis.processInsight && pkg.analysis.processInsight.length > 0;
  checks.push({
    name: 'process-insight',
    passed: hasInsight,
    detail: hasInsight ? undefined : 'No process insight captured',
  });

  // 4. Observation depth
  const allLayers = new Set(
    pkg.analysis.observations.flatMap(o => o.layers.map(l => l.layer)),
  );
  const hasFourLayers = allLayers.size >= 4;
  checks.push({
    name: 'observation-depth',
    passed: hasFourLayers,
    detail: hasFourLayers ? undefined
      : `Only ${allLayers.size} observation layers found (expected 4)`,
  });

  // 5. No dangling references
  const hasObservations = pkg.analysis.observations.length > 0;
  const hasSteps = pkg.buildSpec.steps.length > 0;
  const noDangling = hasObservations && hasSteps;
  checks.push({
    name: 'no-dangling-references',
    passed: noDangling,
    detail: noDangling ? undefined : 'Missing observations or build steps',
  });

  return {
    valid: checks.every(c => c.passed),
    checks,
  };
}

// ============================================================================
// Packaging
// ============================================================================

/**
 * Creates a complete transmission package from analysis and build spec.
 */
export function createPackage(
  analysis: UnifiedUnderstanding,
  buildSpec: BuildSpec,
  sourceImageDescriptions: string[] = [],
): TransmissionPackage {
  const pkg: TransmissionPackage = {
    version: '1.0.0',
    created: new Date().toISOString().split('T')[0],
    sourceImages: sourceImageDescriptions,
    analysis,
    buildSpec,
    reproducibility: {
      canExecuteWithoutImages: false,
      requiredContext: [],
    },
  };

  // Validate and set reproducibility
  const result = validate(pkg);
  pkg.reproducibility.canExecuteWithoutImages = result.valid;
  pkg.reproducibility.requiredContext = result.checks
    .filter(c => !c.passed)
    .map(c => c.detail ?? c.name);

  return pkg;
}

// ============================================================================
// Serialization
// ============================================================================

/**
 * Serializes a transmission package to JSON.
 */
export function toJSON(pkg: TransmissionPackage): string {
  return JSON.stringify(pkg, null, 2);
}

/**
 * Serializes a transmission package to human-readable markdown.
 */
export function toMarkdown(pkg: TransmissionPackage): string {
  const sections: string[] = [];

  sections.push('# Image to Mission — Transmission Package');
  sections.push('');
  sections.push(`**Version:** ${pkg.version}`);
  sections.push(`**Created:** ${pkg.created}`);
  sections.push(`**Target:** ${pkg.buildSpec.target}`);
  sections.push(`**Reproducible without images:** ${pkg.reproducibility.canExecuteWithoutImages ? 'Yes' : 'No'}`);

  // Source
  sections.push('');
  sections.push('## Source');
  if (pkg.sourceImages.length > 0) {
    sections.push(pkg.sourceImages.map(s => `- ${s}`).join('\n'));
  } else {
    sections.push('No source image descriptions provided.');
  }

  // Observations
  sections.push('');
  sections.push('## What I Observed');
  for (const obs of pkg.analysis.observations) {
    sections.push(`\n### ${obs.imageId}`);
    for (const layer of obs.layers) {
      sections.push(`\n**${layer.layer}** (confidence: ${layer.confidence})`);
      sections.push(layer.observations.map(o => `- ${o}`).join('\n'));
    }
  }

  // Context
  sections.push('');
  sections.push('## What the Creator Told Me');
  const ctx = pkg.analysis.context;
  for (const [field, value] of Object.entries(ctx)) {
    if (value) {
      sections.push(`- **${field}:** ${value}`);
    }
  }
  if (!Object.values(ctx).some(Boolean)) {
    sections.push('No creator context provided.');
  }

  // Connections
  sections.push('');
  sections.push('## What I Understood');
  if (pkg.analysis.processInsight) {
    sections.push(`\n**Process Insight:** ${pkg.analysis.processInsight}`);
  }
  sections.push(`\n**Connections (${pkg.analysis.connections.length}):**`);
  for (const conn of pkg.analysis.connections) {
    sections.push(`- [${conn.type}] ${conn.description} — ${conn.significance}`);
  }

  // Parameters
  sections.push('');
  sections.push('## Parameters I Extracted');
  const p = pkg.buildSpec.parameters;
  sections.push(`\n**Color:** ${p.color.temperature}, ${p.color.relationships} (${p.color.palette.length} colors)`);
  sections.push(`**Geometry:** ${p.geometry.arrangement} ${p.geometry.primaryShape}, ${p.geometry.symmetry} symmetry`);
  sections.push(`**Material:** ${p.material.lightInteraction} (${p.material.surfaces.map(s => s.name).join(', ')})`);
  sections.push(`**Feel:** energy=${p.feel.energy.toFixed(1)} intimacy=${p.feel.intimacy.toFixed(1)} order=${p.feel.order.toFixed(1)} handmade=${p.feel.handmade.toFixed(1)} ceremony=${p.feel.ceremony.toFixed(1)}`);

  // Build steps
  sections.push('');
  sections.push('## How I Built It');
  for (const step of pkg.buildSpec.steps) {
    sections.push(`\n**Step ${step.step}:** ${step.instruction}`);
    sections.push(`*Done when:* ${step.doneState}`);
    if (step.philosophyNote) {
      sections.push(`\n> *Philosophy:* ${step.philosophyNote}`);
    }
  }

  // For next instance
  sections.push('');
  sections.push('## For the Next Instance');
  if (pkg.reproducibility.canExecuteWithoutImages) {
    sections.push('This package is self-contained. You have everything needed to reproduce or extend this work.');
  } else {
    sections.push('This package has gaps:');
    sections.push(pkg.reproducibility.requiredContext.map(r => `- ${r}`).join('\n'));
  }

  return sections.join('\n');
}
