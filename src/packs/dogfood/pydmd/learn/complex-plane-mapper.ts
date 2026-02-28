/**
 * Complex Plane mapper: connects DMD eigenvalue analysis to the unit circle
 * framework used throughout the skill-creator ecosystem.
 *
 * Produces a ComplexPlaneMap with eigenvalue interpretation, mode interpretation,
 * framework connections, and a pedagogical narrative.
 */

import type { AlgorithmVariant } from '../types.js';
import type { ExtractedConcept } from './concept-extractor.js';

/** Maps DMD eigenvalue analysis to the unit circle framework. */
export interface ComplexPlaneMap {
  eigenvalueInterpretation: {
    unitCircle: string;
    realAxis: string;
    imaginaryAxis: string;
    origin: string;
  };
  modeInterpretation: {
    spatialModes: string;
    temporalDynamics: string;
    amplitudes: string;
  };
  connectionToFramework: {
    sinCos: string;
    tangentLine: string;
    versine: string;
    eulerFormula: string;
  };
  pedagogicalNarrative: string;
}

// --- Content generators ---

function hasEigenvalueConcepts(concepts: ExtractedConcept[]): boolean {
  return concepts.some(
    c =>
      c.name.toLowerCase().includes('eigendecomposition') ||
      c.name.toLowerCase().includes('eigenvalue') ||
      c.abbreviation === 'EIG' ||
      c.complexPlaneConnection !== null,
  );
}

function buildEigenvalueInterpretation(
  _concepts: ExtractedConcept[],
  _variants: AlgorithmVariant[],
): ComplexPlaneMap['eigenvalueInterpretation'] {
  return {
    unitCircle:
      'The unit circle |lambda| = 1 is the stability boundary for discrete-time DMD eigenvalues. ' +
      'Modes with eigenvalues on the circle are neutrally stable (pure oscillation). ' +
      'This maps directly to the skill-creator\'s unit circle where skills at radius 1.0 represent fully developed competencies.',

    realAxis:
      'Real eigenvalues encode pure growth (lambda > 1) or pure decay (0 < lambda < 1) without oscillation. ' +
      'Negative real eigenvalues indicate period-2 oscillation. ' +
      'On the real axis, DMD modes represent monotonic trends in the data.',

    imaginaryAxis:
      'The angle arg(lambda) of a DMD eigenvalue determines the oscillation frequency of its corresponding mode. ' +
      'Pure imaginary eigenvalues represent quarter-period dynamics. ' +
      'Frequency extraction from DMD maps to angular velocity in the skill-creator\'s theta coordinate.',

    origin:
      'An eigenvalue at the origin represents a mode that decays to zero in one timestep -- ' +
      'a purely transient feature. In the skill-creator framework, this corresponds to an ' +
      'observation that has no persistence.',
  };
}

function buildModeInterpretation(
  _concepts: ExtractedConcept[],
  _variants: AlgorithmVariant[],
): ComplexPlaneMap['modeInterpretation'] {
  return {
    spatialModes:
      'DMD spatial modes phi_i form an (often non-orthogonal) basis for the data. ' +
      'Each mode captures a spatial pattern that evolves with its own eigenvalue. ' +
      'In the skill-creator framework, modes correspond to independent skill dimensions -- ' +
      'orthogonal capabilities that compose into complex behaviors.',

    temporalDynamics:
      'Each mode\'s temporal evolution follows lambda^n, tracing a spiral on the complex plane: ' +
      'inward spiral for decay, outward for growth, circle for neutral stability. ' +
      'This mirrors how skill activation traces a path through the complex plane during a work session.',

    amplitudes:
      'Mode amplitudes |b_i| weight the contribution of each mode to the full reconstruction. ' +
      'High-amplitude modes dominate the dynamics. In the skill-creator framework, amplitude maps ' +
      'to skill relevance -- high-magnitude skills are loaded first under the token budget.',
  };
}

function buildFrameworkConnections(
  _concepts: ExtractedConcept[],
  _variants: AlgorithmVariant[],
): ComplexPlaneMap['connectionToFramework'] {
  return {
    sinCos:
      'DMD decomposes temporal dynamics into oscillating components via ' +
      'e^(i*omega*t) = cos(omega*t) + i*sin(omega*t). Each mode\'s time evolution is a ' +
      'sinusoidal oscillation, just as skill activation patterns decompose into periodic ' +
      'components on the unit circle.',

    tangentLine:
      'At any point on a DMD eigenvalue\'s spiral trajectory, the tangent line indicates ' +
      'the instantaneous rate of change -- growth direction and oscillation phase. This ' +
      'parallels the skill-creator\'s tangent-line activation model where skill relevance ' +
      'is computed as the tangent to the skill\'s position on the unit circle.',

    versine:
      'The versine ver(theta) = 1 - cos(theta) measures the gap between a point on the ' +
      'unit circle and the real axis. In DMD, this naturally measures how far a mode\'s ' +
      'eigenvalue deviates from pure growth/decay -- quantifying the oscillatory component. ' +
      'In skill-creator, versine measures the gap between current and target skill positions.',

    eulerFormula:
      'DMD\'s fundamental equation lambda = e^(omega * dt) is a direct application of ' +
      'Euler\'s formula. Mode composition via superposition of e^(i*theta_k) terms mirrors ' +
      'the skill-creator\'s Euler composition model where complex skill behaviors emerge ' +
      'from combining simpler rotational components.',
  };
}

function buildPedagogicalNarrative(
  concepts: ExtractedConcept[],
  _variants: AlgorithmVariant[],
): string {
  const hasEigen = hasEigenvalueConcepts(concepts);

  const intro = hasEigen
    ? 'Dynamic Mode Decomposition extracts eigenvalues that live on or near the unit circle ' +
      'in the complex plane. Each eigenvalue encodes two pieces of information: its magnitude ' +
      'determines whether the associated mode is growing, decaying, or neutrally stable, while ' +
      'its angle determines the oscillation frequency of that mode.'
    : 'Dynamic Mode Decomposition produces eigenvalues in the complex plane that encode the ' +
      'fundamental dynamics of a system. These eigenvalues naturally organize around the unit ' +
      'circle, where magnitude encodes stability and angle encodes frequency.';

  const mapping =
    'Stable modes have eigenvalues inside the unit circle and decay over time. Growing modes ' +
    'lie outside the circle and amplify. Neutrally stable modes sit exactly on the circle, ' +
    'oscillating forever without growth or decay. This geometric picture is identical to the ' +
    'framework the skill-creator uses to represent skill positions: a skill at radius 1.0 on ' +
    'the unit circle is fully developed, while skills inside the circle are still growing.';

  const connection =
    'The mapping between DMD and the skill-creator is not merely an analogy. Both systems use ' +
    'the complex exponential e^(i*theta) to decompose behavior into composable rotational ' +
    'components. In DMD, mode superposition reconstructs the original dynamics. In the ' +
    'skill-creator, Euler composition combines independent skill dimensions into complex ' +
    'competencies. The mathematical machinery is the same: eigenvalue decomposition on the ' +
    'unit circle.';

  return `${intro} ${mapping} ${connection}`;
}

// --- Main mapping function ---

export function mapComplexPlane(
  concepts: ExtractedConcept[],
  variants: AlgorithmVariant[],
): ComplexPlaneMap {
  return {
    eigenvalueInterpretation: buildEigenvalueInterpretation(concepts, variants),
    modeInterpretation: buildModeInterpretation(concepts, variants),
    connectionToFramework: buildFrameworkConnections(concepts, variants),
    pedagogicalNarrative: buildPedagogicalNarrative(concepts, variants),
  };
}
