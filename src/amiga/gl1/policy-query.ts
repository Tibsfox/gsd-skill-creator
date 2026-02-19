/**
 * GL-1 policy query handler.
 *
 * Accepts GOVERNANCE_QUERY events via ICD-03 and returns
 * GOVERNANCE_RESPONSE payloads with verdict, reasoning, and clause
 * citations (GOVR-05).
 *
 * Supports 4 query types:
 * - compliance_check: evaluates distribution plans against charter
 * - policy_lookup: searches charter clauses for relevant policy info
 * - weight_review: returns weighting algorithm parameter details
 * - dispute_initiate: provides guidance on creating dispute records
 *
 * All query results are logged in the decision log (GOVR-04).
 */

import type { GovernanceQueryPayload, GovernanceResponsePayload } from '../icd/icd-03.js';
import { RulesEngine, DistributionPlanSchema } from './rules-engine.js';
import type { EvaluationResult, ReasoningStep } from './rules-engine.js';
import { DecisionLog } from './decision-log.js';
import type { Charter, CharterClause } from './charter.js';
import { parseCharter, COMMONS_CHARTER_YAML } from './charter.js';
import { parseWeightingSpec, WEIGHTING_SPEC_YAML } from './weighting-docs.js';
import type { WeightingParameter } from './weighting-docs.js';

// ============================================================================
// PolicyQueryHandler
// ============================================================================

/**
 * Handles governance queries via the ICD-03 interface.
 *
 * Delegates to the rules engine for compliance checks, searches the
 * charter for policy lookups, consults the weighting spec for weight
 * reviews, and provides dispute initiation guidance.
 *
 * All results are logged in the decision log.
 */
export class PolicyQueryHandler {
  private readonly charter: Charter;
  private readonly rulesEngine: RulesEngine;

  /** Public accessor for the decision log. */
  readonly decisionLog: DecisionLog;

  constructor(charter: Charter, decisionLog: DecisionLog) {
    this.charter = charter;
    this.rulesEngine = new RulesEngine(charter);
    this.decisionLog = decisionLog;
  }

  /**
   * Handles a governance query and returns a response.
   *
   * @param query - GovernanceQueryPayload from ICD-03
   * @returns GovernanceResponsePayload conforming to ICD-03
   */
  handle(query: GovernanceQueryPayload): GovernanceResponsePayload {
    switch (query.query_type) {
      case 'compliance_check':
        return this.handleComplianceCheck(query);
      case 'policy_lookup':
        return this.handlePolicyLookup(query);
      case 'weight_review':
        return this.handleWeightReview(query);
      case 'dispute_initiate':
        return this.handleDisputeInitiate(query);
      default:
        return this.makeResponse(
          query,
          'ADVISORY',
          `Unknown query type: ${query.query_type}. Supported types: compliance_check, policy_lookup, weight_review, dispute_initiate.`,
          [],
        );
    }
  }

  // --------------------------------------------------------------------------
  // compliance_check
  // --------------------------------------------------------------------------

  private handleComplianceCheck(query: GovernanceQueryPayload): GovernanceResponsePayload {
    const planData = query.context?.distribution_plan;

    if (!planData) {
      const evalResult = this.makeMinimalEvaluation(
        query.distribution_plan_id ?? 'unknown',
        'NON_COMPLIANT',
        'No distribution plan provided for compliance check',
      );
      this.decisionLog.append(evalResult, 'compliance_check', query.subject, String(query.requestor));
      return this.makeResponse(query, 'NON_COMPLIANT', 'No distribution plan provided for compliance check', []);
    }

    // Parse and evaluate the distribution plan
    const plan = DistributionPlanSchema.parse(planData);
    const evalResult = this.rulesEngine.evaluate(plan);

    // Log the evaluation
    this.decisionLog.append(evalResult, 'compliance_check', query.subject, String(query.requestor));

    // Build reasoning string from all reasoning steps
    const reasoningText = evalResult.reasoning
      .map((step: ReasoningStep) => `[${step.clause_id}] ${step.clause_title}: ${step.detail}`)
      .join('\n');

    return this.makeResponse(query, evalResult.verdict, reasoningText, evalResult.cited_clauses);
  }

  // --------------------------------------------------------------------------
  // policy_lookup
  // --------------------------------------------------------------------------

  private handlePolicyLookup(query: GovernanceQueryPayload): GovernanceResponsePayload {
    const subjectLower = query.subject.toLowerCase();

    // Search charter clauses for matches
    const matchingClauses = this.charter.clauses.filter((clause: CharterClause) => {
      const titleMatch = clause.title.toLowerCase().includes(subjectLower);
      const textMatch = clause.text.toLowerCase().includes(subjectLower);
      const explanationMatch = clause.explanation.toLowerCase().includes(subjectLower);
      return titleMatch || textMatch || explanationMatch;
    });

    let reasoningText: string;
    if (matchingClauses.length === 0) {
      // Try keyword matching on individual words
      const words = subjectLower.split(/\s+/).filter((w) => w.length > 2);
      const keywordMatches = this.charter.clauses.filter((clause: CharterClause) => {
        const combined = `${clause.title} ${clause.text} ${clause.explanation}`.toLowerCase();
        return words.some((word) => combined.includes(word));
      });

      if (keywordMatches.length > 0) {
        reasoningText = keywordMatches
          .map((c: CharterClause) => `${c.title} (${c.id}): ${c.explanation}`)
          .join('\n\n');
      } else {
        reasoningText = `No matching policy clauses found for: ${query.subject}`;
      }
    } else {
      reasoningText = matchingClauses
        .map((c: CharterClause) => `${c.title} (${c.id}): ${c.explanation}`)
        .join('\n\n');
    }

    // Create minimal evaluation for logging
    const evalResult = this.makeMinimalEvaluation('policy-lookup', 'ADVISORY', reasoningText);
    this.decisionLog.append(evalResult, 'policy_lookup', query.subject, String(query.requestor));

    return this.makeResponse(query, 'ADVISORY', reasoningText, []);
  }

  // --------------------------------------------------------------------------
  // weight_review
  // --------------------------------------------------------------------------

  private handleWeightReview(query: GovernanceQueryPayload): GovernanceResponsePayload {
    const spec = parseWeightingSpec(WEIGHTING_SPEC_YAML);
    const subjectLower = query.subject.toLowerCase();

    // Search parameters for matches
    const matchingParams = spec.parameters.filter((param: WeightingParameter) => {
      const nameMatch = param.name.toLowerCase().includes(subjectLower);
      const descMatch = param.description.toLowerCase().includes(subjectLower);
      return nameMatch || descMatch;
    });

    let params: WeightingParameter[];
    if (matchingParams.length === 0) {
      // Try keyword matching
      const words = subjectLower.split(/\s+/).filter((w) => w.length > 2);
      const keywordMatches = spec.parameters.filter((param: WeightingParameter) => {
        const combined = `${param.name} ${param.description}`.toLowerCase();
        return words.some((word) => combined.includes(word));
      });
      params = keywordMatches.length > 0 ? keywordMatches : spec.parameters;
    } else {
      params = matchingParams;
    }

    const reasoningText = params
      .map((p: WeightingParameter) =>
        `${p.name} (${p.type}): ${p.description.trim()}\n` +
        `  Range: ${p.min_value} - ${p.max_value} (default: ${p.default_value})\n` +
        `  Unit: ${p.unit}\n` +
        `  Adjustment: ${p.adjustment_process.trim()}`,
      )
      .join('\n\n');

    // Create minimal evaluation for logging
    const evalResult = this.makeMinimalEvaluation('weight-review', 'ADVISORY', reasoningText);
    this.decisionLog.append(evalResult, 'weight_review', query.subject, String(query.requestor));

    return this.makeResponse(query, 'ADVISORY', reasoningText, []);
  }

  // --------------------------------------------------------------------------
  // dispute_initiate
  // --------------------------------------------------------------------------

  private handleDisputeInitiate(query: GovernanceQueryPayload): GovernanceResponsePayload {
    const reasoningText = `Dispute initiation acknowledged for: ${query.subject}. ` +
      `A formal dispute record should be created using the dispute-record module ` +
      `(GovernanceDisputeSchema). Required: evidence items, disputed item reference, ` +
      `and raiser identification.`;

    const recommendations = [
      'Create dispute record via createDispute()',
      'Provide at least one evidence item',
      'Reference specific ledger entries or weight calculations',
    ];

    // Create minimal evaluation for logging
    const evalResult = this.makeMinimalEvaluation('dispute-initiate', 'ADVISORY', reasoningText);
    this.decisionLog.append(evalResult, 'dispute_initiate', query.subject, String(query.requestor));

    return {
      query_id: query.distribution_plan_id ?? `query-${Date.now()}`,
      verdict: 'ADVISORY',
      reasoning: reasoningText,
      respondent: 'GL-1',
      cited_clauses: [],
      recommendations,
    };
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private makeResponse(
    query: GovernanceQueryPayload,
    verdict: 'COMPLIANT' | 'NON_COMPLIANT' | 'ADVISORY',
    reasoning: string,
    citedClauses: string[],
  ): GovernanceResponsePayload {
    return {
      query_id: query.distribution_plan_id ?? `query-${Date.now()}`,
      verdict,
      reasoning,
      respondent: 'GL-1',
      cited_clauses: citedClauses,
    };
  }

  private makeMinimalEvaluation(
    planId: string,
    verdict: 'COMPLIANT' | 'NON_COMPLIANT' | 'ADVISORY',
    detail: string,
  ): EvaluationResult {
    return {
      plan_id: planId,
      verdict,
      reasoning: [
        {
          clause_id: 'system',
          clause_title: 'System',
          check: 'Query processing',
          result: verdict === 'COMPLIANT' ? 'pass' : verdict === 'NON_COMPLIANT' ? 'fail' : 'advisory',
          detail: detail.length >= 10 ? detail : `${detail} -- governance query processed by GL-1.`,
        },
      ],
      cited_clauses: [],
      evaluated_at: new Date().toISOString(),
      charter_version: this.charter.version,
    };
  }
}

// ============================================================================
// handleGovernanceQuery convenience function
// ============================================================================

/**
 * Stateless convenience function that creates a handler with the default
 * charter and a fresh decision log, handles the query, and returns the response.
 *
 * Each call creates fresh state -- no accumulation between calls.
 *
 * @param query - GovernanceQueryPayload from ICD-03
 * @returns GovernanceResponsePayload conforming to ICD-03
 */
export function handleGovernanceQuery(query: GovernanceQueryPayload): GovernanceResponsePayload {
  const charter = parseCharter(COMMONS_CHARTER_YAML);
  const log = new DecisionLog();
  const handler = new PolicyQueryHandler(charter, log);
  return handler.handle(query);
}
