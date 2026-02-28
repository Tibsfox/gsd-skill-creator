// === Proof Composer ===
//
// Transforms CompositionPath output from the composition engine into formal
// reasoning chains with numbered steps, justifications citing specific
// primitive IDs, and intermediate results.

import type {
  MathematicalPrimitive,
  CompositionPath,
  CompositionStep,
  CompositionType,
  DomainId,
} from '../../core/types/mfe-types.js';

// === Proof Types ===

export interface ProofChain {
  /** Brief description of what is being proven/composed. */
  title: string;
  /** Ordered proof steps. */
  steps: ProofStep[];
  /** Final result statement. */
  conclusion: string;
  /** All primitive IDs referenced in the proof. */
  primitivesUsed: string[];
  /** Domains crossed during the proof. */
  domainsSpanned: DomainId[];
  /** Types of composition used in the proof. */
  compositionTypes: CompositionType[];
}

export interface ProofStep {
  /** 1-indexed step number. */
  stepNumber: number;
  /** Which primitive is invoked. */
  primitiveId: string;
  /** Human-readable name. */
  primitiveName: string;
  /** What is done: "Apply", "Compose with", "Nest into". */
  action: string;
  /** "By [Primitive Name] (ID): [formal statement excerpt]" */
  justification: string;
  /** What this step produces. */
  intermediateResult: string;
  /** null for first step (establishment), composition type for others. */
  compositionType: CompositionType | null;
  /** For parallel: "Branch A", "Branch B", "Merge". */
  branchLabel?: string;
}

export interface ProofError {
  code: 'EMPTY_PATH' | 'MISSING_PRIMITIVE' | 'INVALID_STEP';
  message: string;
}

// === Proof Composer ===

export class ProofComposer {
  private readonly primitives: Map<string, MathematicalPrimitive>;

  constructor(primitives: Map<string, MathematicalPrimitive>) {
    this.primitives = primitives;
  }

  /**
   * Transform a CompositionPath into a formal ProofChain.
   *
   * @param path - CompositionPath from the composition engine
   * @param title - Optional title for the proof
   * @returns ProofChain on success, ProofError on failure
   */
  composeProof(path: CompositionPath, title?: string): ProofChain | ProofError {
    // Validate: non-empty path
    if (!path.steps || path.steps.length === 0) {
      return {
        code: 'EMPTY_PATH',
        message: 'Cannot compose proof from an empty composition path',
      };
    }

    // Validate: all primitives exist in lookup map
    for (const step of path.steps) {
      if (!this.primitives.has(step.primitive)) {
        return {
          code: 'MISSING_PRIMITIVE',
          message: `Primitive "${step.primitive}" referenced in composition path not found in registry`,
        };
      }
    }

    // Detect composition types from the steps
    const detectedTypes = this.detectCompositionTypes(path.steps);

    // Build proof steps based on composition type patterns
    const proofSteps = this.buildProofSteps(path.steps, detectedTypes);

    // Collect metadata
    const primitivesUsed = Array.from(
      new Set(proofSteps.map((s) => s.primitiveId)),
    );
    const domainsSpanned = Array.from(
      new Set(
        proofSteps
          .map((s) => this.primitives.get(s.primitiveId)?.domain)
          .filter((d): d is DomainId => d !== undefined),
      ),
    );
    const compositionTypes = Array.from(
      new Set(
        proofSteps
          .map((s) => s.compositionType)
          .filter((t): t is CompositionType => t !== null),
      ),
    );

    // Build conclusion from the last step
    const lastStep = proofSteps[proofSteps.length - 1];
    const conclusion = lastStep.intermediateResult;

    // Determine title
    const proofTitle =
      title || this.generateTitle(proofSteps, path.domainsSpanned);

    return {
      title: proofTitle,
      steps: proofSteps,
      conclusion,
      primitivesUsed,
      domainsSpanned,
      compositionTypes,
    };
  }

  /**
   * Detect the composition type for each step by analyzing the action text.
   */
  private detectCompositionTypes(
    steps: CompositionStep[],
  ): Map<number, CompositionType> {
    const typeMap = new Map<number, CompositionType>();

    for (const step of steps) {
      const action = step.action.toLowerCase();
      if (action.includes('parallel') || action.includes('combine')) {
        typeMap.set(step.stepNumber, 'parallel');
      } else if (action.includes('nest')) {
        typeMap.set(step.stepNumber, 'nested');
      } else if (
        action.includes('compose') ||
        action.includes('sequential')
      ) {
        typeMap.set(step.stepNumber, 'sequential');
      }
      // First step (Establish) gets no type — handled in buildProofSteps
    }

    return typeMap;
  }

  /**
   * Build proof steps with proper formatting based on composition type.
   */
  private buildProofSteps(
    compositionSteps: CompositionStep[],
    detectedTypes: Map<number, CompositionType>,
  ): ProofStep[] {
    const proofSteps: ProofStep[] = [];

    // Check if this path contains parallel compositions
    const hasParallel = Array.from(detectedTypes.values()).includes('parallel');

    for (let i = 0; i < compositionSteps.length; i++) {
      const cStep = compositionSteps[i];
      const prim = this.primitives.get(cStep.primitive)!;
      const isFirst = i === 0;
      const compositionType = isFirst
        ? null
        : detectedTypes.get(cStep.stepNumber) || 'sequential';

      // Build justification
      const justification = this.buildJustification(prim);

      // Build action
      const action = this.buildAction(prim, compositionType, isFirst);

      // Build intermediate result
      const intermediateResult = cStep.outputType || prim.computationalForm;

      // Build the proof step
      const proofStep: ProofStep = {
        stepNumber: i + 1,
        primitiveId: prim.id,
        primitiveName: prim.name,
        action,
        justification,
        intermediateResult,
        compositionType,
      };

      // Add branch labels for parallel compositions
      if (hasParallel) {
        proofStep.branchLabel = this.assignBranchLabel(
          i,
          compositionSteps.length,
          compositionType,
          isFirst,
        );
      }

      proofSteps.push(proofStep);
    }

    // For parallel paths, add a merge step if we have branches but no explicit merge
    if (hasParallel && proofSteps.length >= 2) {
      const lastStep = proofSteps[proofSteps.length - 1];
      if (!lastStep.branchLabel?.includes('Merge')) {
        lastStep.branchLabel = 'Merge';
      }
    }

    return proofSteps;
  }

  /**
   * Build a justification string from a primitive.
   */
  private buildJustification(prim: MathematicalPrimitive): string {
    return `By ${prim.name} (${prim.id}): ${prim.formalStatement}`;
  }

  /**
   * Build an action string based on composition type.
   */
  private buildAction(
    prim: MathematicalPrimitive,
    compositionType: CompositionType | null,
    isFirst: boolean,
  ): string {
    if (isFirst || compositionType === null) {
      return `Establish ${prim.name}`;
    }

    switch (compositionType) {
      case 'sequential':
        return `Compose with ${prim.name}`;
      case 'parallel':
        return `Combine in parallel with ${prim.name}`;
      case 'nested':
        return `Nest into ${prim.name}`;
    }
  }

  /**
   * Assign branch labels for parallel compositions.
   */
  private assignBranchLabel(
    index: number,
    totalSteps: number,
    compositionType: CompositionType | null,
    isFirst: boolean,
  ): string | undefined {
    if (isFirst) {
      return 'Branch A';
    }

    if (compositionType === 'parallel') {
      // If this is the last step, it's the merge
      if (index === totalSteps - 1) {
        return 'Merge';
      }
      return 'Branch B';
    }

    // Non-parallel steps in a parallel path
    if (index === totalSteps - 1) {
      return 'Merge';
    }

    return undefined;
  }

  /**
   * Generate a default title if none provided.
   */
  private generateTitle(
    steps: ProofStep[],
    domainsSpanned: DomainId[],
  ): string {
    if (steps.length === 0) return 'Empty proof';
    const first = steps[0].primitiveName;
    const last = steps[steps.length - 1].primitiveName;
    if (first === last) return `Proof involving ${first}`;
    return `Composition from ${first} to ${last}`;
  }
}
