/**
 * Agent Systems Department -- June-2026 arXiv T2 concept tests.
 *
 * The 38 T2 concepts from AGENT-SYSTEMS-CONCEPT-SHORTLIST.md, authored in the
 * department's light pattern (empty panels). Assertions mirror the T1 suite:
 * valid RosettaConcept fields, id prefix agent-, complexPlanePosition internal
 * consistency, relationships >= 2, panels is a Map, and dept-local targetId
 * resolution (D-13; external ai-computation and skill refs accepted).
 */

import { describe, it, expect } from 'vitest';
import {
  governanceTaxonomy,
  algorithmSteering,
  biTemporalFactInvalidation,
  constraintCompatibleRetrieval,
  constraintInducedToolSuppression,
  contextProprioception,
  costAwareSpeculation,
  declarativeProtocolEnactment,
  evolvableContextUnits,
  experienceInternalizationCollapse,
  formalAgentVerification,
  hierarchicalMemoryNavigation,
  inWeightSkill,
  indexSideReasoning,
  intentionGraphToolDiscovery,
  loopSpecification,
  memoryDepth,
  memoryValidityGate,
  multiOrderCommunication,
  multimodalSkillDistillation,
  nuggetGroundedJudging,
  onDemandToolForging,
  operatorVocabularyThesis,
  orchestrationMetaSkill,
  persistentDecisionHistory,
  planTensorRank,
  queryAwareGraphTraversal,
  riemannianMemoryRetrieval,
  safetyRuleEvolution,
  sameCapabilityRiskRetrieval,
  selfMutatingPoisoning,
  skillIncidenceComposition,
  skillInternalization,
  submodularContextSelection,
  transactiveMemory,
  verifiableSkillContract,
  compositionalKvCache,
  labelFreeSkillRefinement,
  // existing agent- concepts (25 original + 22 T1) as resolution targets
  contentAddressedStorage,
  engramMaturation,
  hybridRetrieval,
  intentRouting,
  memoryConsolidation,
  constraintDecay,
  dynamicAutonomy,
  executionGroundedSelection,
  harnessAsSubstrate,
  structuredSpecGate,
  complianceTraceCheck,
  counterfactualUtility,
  episodePackage,
  longRangeDependency,
  pairedTraceAudit,
  constraintDrift,
  coordinationSurface,
  critiqueAndRoute,
  fastSlowCoevolution,
  spectralTopology,
  counterfactualAudit,
  knowingDoingGap,
  skillAsArtifact,
  skillIrCompilation,
  skillPrivilegeBoundary,
  semanticConcurrencyControl,
  selectorPriorityArbitration,
  latentAgentCommunication,
  causalToolFrontier,
  declarativeAgentControl,
  goalStateInference,
  llmAsCode,
  adaptiveRetrievalStopping,
  admissionTimeHubnessGate,
  answerConditionedInformationGain,
  decisionAwareContextSelection,
  memoryUseWarrant,
  temporalSupersessionMemory,
  capabilityControlledSelfEvolution,
  compositionalBehavioralLeakage,
  compositionalSkillEvolution,
  operationalAnchorPreservation,
  toolContractInference,
  traceToSkillInduction,
  evaluatorValidityAudit,
  silentFailureTaxonomy,
  skillCoverageMetric,
} from './index.js';
import { memoryValidityGate } from './agent-memory/memory-validity-gate.js';
import { runDependencyGraph } from './integration-evaluation/run-dependency-graph.js';
import { governanceTaxonomy } from './multi-agent-orchestration/governance-taxonomy.js';
import { planTensorRank } from './multi-agent-orchestration/plan-tensor-rank.js';
import { heldOutEvolutionGate } from './skill-design/held-out-evolution-gate.js';
import { multimodalSkillDistillation } from './skill-design/multimodal-skill-distillation.js';
import { selfMutatingPoisoning } from './skill-design/self-mutating-poisoning.js';
import { federatedSkillEvolution } from './skill-design/federated-skill-evolution.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const t2Concepts: RosettaConcept[] = [
  governanceTaxonomy,
  algorithmSteering,
  biTemporalFactInvalidation,
  constraintCompatibleRetrieval,
  constraintInducedToolSuppression,
  contextProprioception,
  costAwareSpeculation,
  declarativeProtocolEnactment,
  evolvableContextUnits,
  experienceInternalizationCollapse,
  formalAgentVerification,
  hierarchicalMemoryNavigation,
  inWeightSkill,
  indexSideReasoning,
  intentionGraphToolDiscovery,
  loopSpecification,
  memoryDepth,
  memoryValidityGate,
  multiOrderCommunication,
  multimodalSkillDistillation,
  nuggetGroundedJudging,
  onDemandToolForging,
  operatorVocabularyThesis,
  orchestrationMetaSkill,
  persistentDecisionHistory,
  planTensorRank,
  queryAwareGraphTraversal,
  riemannianMemoryRetrieval,
  safetyRuleEvolution,
  sameCapabilityRiskRetrieval,
  selfMutatingPoisoning,
  skillIncidenceComposition,
  skillInternalization,
  submodularContextSelection,
  transactiveMemory,
  verifiableSkillContract,
  compositionalKvCache,
  labelFreeSkillRefinement,
];

const t2ConceptNames = [
  'governanceTaxonomy',
  'algorithmSteering',
  'biTemporalFactInvalidation',
  'constraintCompatibleRetrieval',
  'constraintInducedToolSuppression',
  'contextProprioception',
  'costAwareSpeculation',
  'declarativeProtocolEnactment',
  'evolvableContextUnits',
  'experienceInternalizationCollapse',
  'formalAgentVerification',
  'hierarchicalMemoryNavigation',
  'inWeightSkill',
  'indexSideReasoning',
  'intentionGraphToolDiscovery',
  'loopSpecification',
  'memoryDepth',
  'memoryValidityGate',
  'multiOrderCommunication',
  'multimodalSkillDistillation',
  'nuggetGroundedJudging',
  'onDemandToolForging',
  'operatorVocabularyThesis',
  'orchestrationMetaSkill',
  'persistentDecisionHistory',
  'planTensorRank',
  'queryAwareGraphTraversal',
  'riemannianMemoryRetrieval',
  'safetyRuleEvolution',
  'sameCapabilityRiskRetrieval',
  'selfMutatingPoisoning',
  'skillIncidenceComposition',
  'skillInternalization',
  'submodularContextSelection',
  'transactiveMemory',
  'verifiableSkillContract',
  'compositionalKvCache',
  'labelFreeSkillRefinement',
];

// Resolution target set for agent- targetIds (T2 cohort + all 47 existing dept concepts).
const allDeptConcepts: RosettaConcept[] = [
  ...t2Concepts,
  contentAddressedStorage,
  engramMaturation,
  hybridRetrieval,
  intentRouting,
  memoryConsolidation,
  constraintDecay,
  dynamicAutonomy,
  executionGroundedSelection,
  harnessAsSubstrate,
  structuredSpecGate,
  complianceTraceCheck,
  counterfactualUtility,
  episodePackage,
  longRangeDependency,
  pairedTraceAudit,
  constraintDrift,
  coordinationSurface,
  critiqueAndRoute,
  fastSlowCoevolution,
  spectralTopology,
  counterfactualAudit,
  knowingDoingGap,
  skillAsArtifact,
  skillIrCompilation,
  skillPrivilegeBoundary,
  semanticConcurrencyControl,
  selectorPriorityArbitration,
  latentAgentCommunication,
  causalToolFrontier,
  declarativeAgentControl,
  goalStateInference,
  llmAsCode,
  adaptiveRetrievalStopping,
  admissionTimeHubnessGate,
  answerConditionedInformationGain,
  decisionAwareContextSelection,
  memoryUseWarrant,
  temporalSupersessionMemory,
  capabilityControlledSelfEvolution,
  compositionalBehavioralLeakage,
  compositionalSkillEvolution,
  operationalAnchorPreservation,
  toolContractInference,
  traceToSkillInduction,
  evaluatorValidityAudit,
  silentFailureTaxonomy,
  skillCoverageMetric,
  memoryValidityGate,
  runDependencyGraph,
  governanceTaxonomy,
  planTensorRank,
  heldOutEvolutionGate,
  multimodalSkillDistillation,
  selfMutatingPoisoning,
  skillInternalization,
  compositionalKvCache,
  federatedSkillEvolution,
];

describe('Agent Systems Department -- June-2026 arXiv T2 concepts', () => {
  describe('ASJT-01: Valid RosettaConcept fields', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s has non-empty id, name, domain=agent-systems, and description',
      (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('agent-systems');
        expect(c.description.length).toBeGreaterThan(10);
      }
    );
  });

  describe('ASJT-02: id prefix agent-', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s id starts with agent-',
      (_n, c) => {
        expect(c.id.startsWith('agent-')).toBe(true);
      }
    );
  });

  describe('ASJT-03: complexPlanePosition validation', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s complexPlanePosition magnitude and angle agree with real/imaginary',
      (_n, c) => {
        const pos = c.complexPlanePosition!;
        expect(pos).toBeDefined();
        const expectedMag = Math.sqrt(pos.real * pos.real + pos.imaginary * pos.imaginary);
        expect(pos.magnitude).toBeCloseTo(expectedMag, 5);
        const expectedAngle = Math.atan2(pos.imaginary, pos.real);
        expect(pos.angle).toBeCloseTo(expectedAngle, 5);
      }
    );
  });

  describe('ASJT-04: relationships (>= 2)', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s has >= 2 relationships',
      (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      }
    );
  });

  describe('ASJT-05: panels is a Map (empty allowed for this wave)', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s has panels as a Map',
      (_n, c) => {
        expect(c.panels).toBeInstanceOf(Map);
      }
    );
  });

  describe('ASJT-06: Dept-local targetId resolution', () => {
    const deptPrefix = 'agent-';
    const localIds = new Set(allDeptConcepts.map((c) => c.id));

    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s agent- targetIds resolve within the dept',
      (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
          // external refs (ai-computation-*, typed-skill-graph-selection, skill-injection-guardian) accepted per D-13
        }
      }
    );
  });
});
