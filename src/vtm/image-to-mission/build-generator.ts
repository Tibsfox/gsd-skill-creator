/**
 * Build Generator + Philosophy Annotator.
 *
 * Produces step-by-step build instructions from extracted parameters,
 * with philosophy annotations explaining WHY each non-obvious decision
 * was made. The build spec is what someone follows to create the output.
 * Philosophy notes make the output feel right, not just technically correct.
 */

import type {
  ExtractedParameters,
  BuildStep,
  BuildSpec,
  TargetMedium,
  UnifiedUnderstanding,
} from './types.js';

// ============================================================================
// Philosophy Reference
// ============================================================================

/** Philosophy notes for common parameter choices. */
const PHILOSOPHY_NOTES: Record<string, (params: ExtractedParameters) => string | null> = {
  goldenAngle: (p) => p.geometry.constants.goldenAngle
    ? `The golden angle (tau * 0.381966 = ${p.geometry.constants.goldenAngle} radians) produces the same non-repeating spiral pattern that organic accumulation creates — sunflower seeds, pine cones, the path someone walks when following sound rather than a grid. A perfect grid would feel mechanical; true randomness would feel chaotic. The golden angle sits in the sweet spot: ordered enough to feel intentional, organic enough to feel handmade.`
    : null,

  blendMultiply: (p) => p.material.blendModes.includes('multiply')
    ? 'Multiply blend mode darkens overlapping colors the way physical shadows work — colored light passing through translucent material absorbs, never adds. This produces the deep, rich shadow tones that screen or overlay would miss.'
    : null,

  blendScreen: (p) => p.material.blendModes.includes('screen')
    ? 'Screen blend mode adds light the way projections overlap — two colored lights on a surface combine to something brighter, never darker. This reproduces the luminous glow effect of projected color.'
    : null,

  handmadeJitter: (p) => p.feel.handmade > 0.5
    ? `Handmade feel (${p.feel.handmade.toFixed(2)}) means each element gets a small random offset from its calculated position. Perfection reads as mechanical; human hands always introduce variation. The offset is proportional to element size — small enough to preserve the overall pattern, large enough to feel alive.`
    : null,

  heightDecay: (p) => p.geometry.proportions.heightDecay
    ? `Element size decreases from center to edge (decay: ${p.geometry.proportions.heightDecay}). This creates visual hierarchy — the center is the anchor, the edges are the breath. It also maps to how physical installations naturally work: the builder starts at the center and works outward, with less material remaining at the periphery.`
    : null,

  ceremony: (p) => p.feel.ceremony > 0.5
    ? `High ceremony value (${p.feel.ceremony.toFixed(2)}) deepens color saturation and adds formality to the composition. The difference between casual and sacred is often just the quality of light and the depth of color.`
    : null,
};

// ============================================================================
// Step Generation
// ============================================================================

/**
 * Generates ordered build steps from extracted parameters.
 * Optional code string is included as the implementation reference.
 */
export function generateSteps(
  params: ExtractedParameters,
  target: TargetMedium = 'canvas',
  code?: string,
): BuildStep[] {
  const steps: BuildStep[] = [];
  let stepNum = 1;

  // Preamble steps
  steps.push({
    step: stepNum++,
    instruction: `Set up ${target} environment with viewport dimensions`,
    doneState: `${target === 'canvas' ? 'Canvas element' : target === 'react' ? 'React component' : target === 'threejs' ? 'Three.js scene' : 'HTML document'} renders a blank background`,
  });

  // Color setup
  steps.push({
    step: stepNum++,
    instruction: `Define color palette: ${params.color.palette.map(c => `${c.name} (${c.hex})`).join(', ')}`,
    doneState: `All ${params.color.palette.length} colors defined and accessible`,
  });

  steps.push({
    step: stepNum++,
    instruction: `Set background to ${params.color.palette.find(c => c.role === 'background')?.hex ?? 'white'}`,
    doneState: 'Background color visible',
  });

  // Geometry
  const count = params.geometry.proportions.elementCount ?? 40;
  steps.push({
    step: stepNum++,
    instruction: `Calculate ${count} element positions using ${params.geometry.arrangement} arrangement`,
    doneState: `${count} (x, y) coordinates computed`,
  });

  if (params.geometry.constants.goldenAngle) {
    steps.push({
      step: stepNum++,
      instruction: `Position each element at angle = index * ${params.geometry.constants.goldenAngle}, radius = sqrt(index) * spacing`,
      doneState: `All ${count} elements have unique positions in a non-repeating ${params.geometry.arrangement}`,
    });
  }

  if (params.geometry.proportions.heightDecay) {
    steps.push({
      step: stepNum++,
      instruction: `Apply size decay: element size = base * (1 - index/count * ${params.geometry.proportions.heightDecay})`,
      doneState: 'Center elements are largest, edge elements smallest',
    });
  }

  // Rendering
  steps.push({
    step: stepNum++,
    instruction: `Draw each element as ${params.geometry.primaryShape} using palette colors (cycle through palette by index)`,
    doneState: `All ${count} elements visible with correct colors`,
  });

  // Material / blend modes
  for (const mode of params.material.blendModes) {
    steps.push({
      step: stepNum++,
      instruction: `Apply ${mode} blend mode for overlapping elements`,
      doneState: `Blend mode "${mode}" active — overlapping areas show ${mode === 'multiply' ? 'darkened' : mode === 'screen' ? 'lightened' : 'blended'} colors`,
    });
  }

  // Feel - handmade
  if (params.feel.handmade > 0.5) {
    steps.push({
      step: stepNum++,
      instruction: `Add per-element position jitter: offset = random * ${(params.feel.handmade * 0.05).toFixed(3)} * element_size`,
      doneState: 'Elements show subtle imperfection in positioning',
    });
  }

  // Feel - energy / animation
  if (params.feel.energy > 0.2) {
    steps.push({
      step: stepNum++,
      instruction: `Add animation loop with speed factor ${(0.2 + params.feel.energy * 1.8).toFixed(2)}`,
      doneState: 'Elements animate smoothly',
    });
  }

  // Code attachment
  if (code) {
    steps.push({
      step: stepNum++,
      instruction: `Integrate generated ${target} code (attached below)`,
      doneState: `Code runs without errors in ${target} environment`,
    });
  }

  // Verification
  steps.push({
    step: stepNum++,
    instruction: 'Verify visual output matches the extracted feel: check energy, intimacy, order, handmade, ceremony dimensions',
    doneState: `Output reads as: energy=${params.feel.energy.toFixed(1)}, intimacy=${params.feel.intimacy.toFixed(1)}, order=${params.feel.order.toFixed(1)}, handmade=${params.feel.handmade.toFixed(1)}, ceremony=${params.feel.ceremony.toFixed(1)}`,
  });

  return steps;
}

/**
 * Adds philosophy annotations to non-obvious build steps.
 * Returns a new array with philosophyNote populated where appropriate.
 */
export function annotatePhilosophy(
  steps: BuildStep[],
  params: ExtractedParameters,
): BuildStep[] {
  return steps.map(step => {
    const instruction = step.instruction.toLowerCase();

    // Check each philosophy note for relevance
    for (const [key, noteFn] of Object.entries(PHILOSOPHY_NOTES)) {
      const note = noteFn(params);
      if (!note) continue;

      if (
        (key === 'goldenAngle' && (instruction.includes('golden') || instruction.includes('2.399'))) ||
        (key === 'blendMultiply' && instruction.includes('multiply')) ||
        (key === 'blendScreen' && instruction.includes('screen')) ||
        (key === 'handmadeJitter' && instruction.includes('jitter')) ||
        (key === 'heightDecay' && instruction.includes('decay')) ||
        (key === 'ceremony' && instruction.includes('ceremony'))
      ) {
        return { ...step, philosophyNote: note };
      }
    }

    return step;
  });
}

/**
 * Composes a complete BuildSpec with preamble and philosophy document.
 */
export function composeBuildSpec(
  steps: BuildStep[],
  params: ExtractedParameters,
  target: TargetMedium,
  code?: string,
): BuildSpec {
  const annotatedSteps = annotatePhilosophy(steps, params);
  const notesCount = annotatedSteps.filter(s => s.philosophyNote).length;

  const philosophyDocument = [
    `# Build Philosophy — ${params.geometry.primaryShape} (${target})`,
    '',
    '## What We\'re Building',
    `A ${params.geometry.arrangement} arrangement of ${params.geometry.proportions.elementCount ?? '~40'} ${params.geometry.primaryShape} elements.`,
    `Temperature: ${params.color.temperature}. Symmetry: ${params.geometry.symmetry}. Feel: ${describeMainFeel(params)}.`,
    '',
    '## Key Decisions',
    ...annotatedSteps
      .filter(s => s.philosophyNote)
      .map(s => `\n### Step ${s.step}: ${s.instruction}\n${s.philosophyNote}`),
    '',
    `## Notes`,
    `${notesCount} non-obvious decisions annotated out of ${steps.length} total steps.`,
    notesCount === 0 ? 'All steps are straightforward — no special philosophy notes needed.' : '',
  ].filter(Boolean).join('\n');

  return {
    target,
    parameters: params,
    steps: annotatedSteps,
    code,
    philosophyDocument,
  };
}

/**
 * Full pipeline: generate steps, annotate, compose spec.
 */
export function generateBuildSpec(
  params: ExtractedParameters,
  target: TargetMedium = 'canvas',
  code?: string,
): BuildSpec {
  const steps = generateSteps(params, target, code);
  return composeBuildSpec(steps, params, target, code);
}

// ============================================================================
// Internal Helpers
// ============================================================================

function describeMainFeel(params: ExtractedParameters): string {
  const dominant = Object.entries(params.feel)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([k, v]) => `${k} (${v.toFixed(1)})`)
    .join(', ');
  return dominant;
}
