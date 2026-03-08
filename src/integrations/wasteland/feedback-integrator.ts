/**
 * Feedback Integrator — Layer 3, Wave 4
 *
 * Closes the learning loop: tracks recommendation outcomes,
 * uses Thompson Sampling and SPRT for evaluation, applies
 * confidence decay, performs meta-learning across types.
 */

import type {
  FeedbackRecord,
  MetricSnapshot,
  EvaluationEntry,
  OutcomeCategory,
  SPRTResult,
  ABTestResult,
  MetaLearningRecord,
  MetaLearningInsights,
  PatternFeedbackSignal,
  ConfidenceDecayConfig,
} from './types.js';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DECAY_CONFIG: ConfidenceDecayConfig = {
  decayStartDays: 30,
  decayRatePerWeek: 0.1,
  minimumConfidence: 0.1,
};

const MIN_SAMPLES = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

// ============================================================================
// Tracking Lifecycle
// ============================================================================

/**
 * Start tracking a new recommendation.
 */
export function startTracking(
  recommendationId: string,
  type: FeedbackRecord['recommendationType'],
  initialConfidence: number,
  baseline: MetricSnapshot,
): FeedbackRecord {
  return {
    recommendationId,
    recommendationType: type,
    confidence: initialConfidence,
    initialConfidence,
    appliedAt: new Date().toISOString(),
    baselineMetric: baseline,
    currentMetric: { ...baseline },
    sampleCount: 0,
    minSamplesRequired: MIN_SAMPLES,
    status: 'evaluating',
    lastUpdated: new Date().toISOString(),
    evaluationHistory: [],
  };
}

/**
 * Update metrics with new observation data.
 * Triggers evaluation when minimum sample threshold is reached.
 */
export function updateMetrics(
  record: FeedbackRecord,
  newMetric: MetricSnapshot,
): FeedbackRecord {
  const updated = { ...record };
  updated.sampleCount++;
  updated.currentMetric = newMetric;
  updated.lastUpdated = new Date().toISOString();

  // Build evaluation entry
  const entry: EvaluationEntry = {
    timestamp: updated.lastUpdated,
    sampleCount: updated.sampleCount,
    currentMetric: newMetric,
    confidenceAdjustment: 0,
    notes: '',
  };

  // Try SPRT early detection
  const sprt = evaluateSPRT(updated);
  entry.sprtResult = sprt;

  if (sprt.decision === 'accept-improvement') {
    updated.status = 'validated';
    updated.outcome = categorizeOutcome(record.baselineMetric, newMetric);
    updated.confidence = Math.min(1, record.confidence * 1.1);
    entry.confidenceAdjustment = 0.1;
    entry.notes = `SPRT accepted improvement (effect size: ${sprt.effectSize.toFixed(3)})`;
  } else if (sprt.decision === 'accept-no-improvement') {
    updated.status = 'rejected';
    updated.outcome = categorizeOutcome(record.baselineMetric, newMetric);
    updated.confidence = Math.max(0.1, record.confidence * 0.8);
    entry.confidenceAdjustment = -0.2;
    entry.notes = 'SPRT accepted no improvement';
  } else if (updated.sampleCount >= MIN_SAMPLES) {
    // Enough samples for full evaluation
    updated.outcome = categorizeOutcome(record.baselineMetric, newMetric);
    if (updated.outcome === 'strong-success' || updated.outcome === 'weak-success') {
      updated.status = 'validated';
      updated.confidence = Math.min(1, record.confidence * 1.05);
      entry.confidenceAdjustment = 0.05;
    } else if (updated.outcome === 'strong-failure' || updated.outcome === 'weak-failure') {
      updated.status = 'rejected';
      updated.confidence = Math.max(0.1, record.confidence * 0.85);
      entry.confidenceAdjustment = -0.15;
    } else {
      updated.status = 'inconclusive';
      entry.notes = 'Neutral outcome after minimum samples';
    }
    entry.notes = entry.notes || `Outcome: ${updated.outcome} (${updated.sampleCount} samples)`;
  } else {
    entry.notes = `Below minimum sample threshold (${updated.sampleCount}/${MIN_SAMPLES})`;
  }

  updated.evaluationHistory = [...record.evaluationHistory, entry];
  return updated;
}

// ============================================================================
// SPRT (Sequential Probability Ratio Test)
// ============================================================================

/**
 * Evaluate using SPRT for early strong-effect detection.
 *
 * Tests the improvement hypothesis (>5% improvement) against
 * the null hypothesis (no improvement).
 * Alpha = 0.05, Beta = 0.10
 */
export function evaluateSPRT(record: FeedbackRecord): SPRTResult {
  const alpha = 0.05;
  const beta = 0.10;
  const upperBound = Math.log((1 - beta) / alpha);
  const lowerBound = Math.log(beta / (1 - alpha));

  const baseRate = record.baselineMetric.successRate;
  const currentRate = record.currentMetric.successRate;
  const n = record.sampleCount;

  if (n === 0 || baseRate === 0) {
    return {
      logLikelihoodRatio: 0,
      upperBound,
      lowerBound,
      decision: 'continue-sampling',
      samplesUsed: n,
      effectSize: 0,
    };
  }

  // Effect size (Cohen's h for proportions)
  const effectSize = currentRate - baseRate;

  // Log-likelihood ratio for binomial test
  // H1: success rate = currentRate, H0: success rate = baseRate
  const successCount = Math.round(currentRate * n);
  const failCount = n - successCount;

  let llr = 0;
  if (n > 0 && baseRate > 0) {
    const safeCurrentRate = Math.min(Math.max(currentRate, 1e-10), 1 - 1e-10);
    const safeBaseRate = Math.min(Math.max(baseRate, 1e-10), 1 - 1e-10);
    llr = successCount * Math.log(safeCurrentRate / safeBaseRate) +
          failCount * Math.log((1 - safeCurrentRate) / (1 - safeBaseRate));
  }

  let decision: SPRTResult['decision'] = 'continue-sampling';
  if (llr >= upperBound) {
    decision = 'accept-improvement';
  } else if (llr <= lowerBound) {
    decision = 'accept-no-improvement';
  }

  return {
    logLikelihoodRatio: llr,
    upperBound,
    lowerBound,
    decision,
    samplesUsed: n,
    effectSize,
  };
}

// ============================================================================
// A/B Test Evaluation (Welch's t-test)
// ============================================================================

/**
 * Evaluate an A/B test using Welch's t-test.
 * Handles unequal variance between control and treatment groups.
 */
export function evaluateABTest(
  control: MetricSnapshot[],
  treatment: MetricSnapshot[],
): ABTestResult {
  const n1 = control.length;
  const n2 = treatment.length;

  if (n1 < 2 || n2 < 2) {
    return {
      controlGroup: control[0] ?? createEmptyMetric(),
      treatmentGroup: treatment[0] ?? createEmptyMetric(),
      tStatistic: 0,
      pValue: 1,
      degreesOfFreedom: 0,
      significant: false,
      improvementPercent: 0,
      confidenceInterval: { lower: 0, upper: 0 },
    };
  }

  // Compute means and variances
  const controlRates = control.map(m => m.successRate);
  const treatmentRates = treatment.map(m => m.successRate);

  const mean1 = controlRates.reduce((a, b) => a + b, 0) / n1;
  const mean2 = treatmentRates.reduce((a, b) => a + b, 0) / n2;

  const var1 = controlRates.reduce((a, b) => a + (b - mean1) ** 2, 0) / (n1 - 1);
  const var2 = treatmentRates.reduce((a, b) => a + (b - mean2) ** 2, 0) / (n2 - 1);

  // Welch's t-statistic
  const se = Math.sqrt(var1 / n1 + var2 / n2);
  const tStatistic = se > 0 ? (mean2 - mean1) / se : 0;

  // Welch-Satterthwaite degrees of freedom
  const num = (var1 / n1 + var2 / n2) ** 2;
  const denom = (var1 / n1) ** 2 / (n1 - 1) + (var2 / n2) ** 2 / (n2 - 1);
  const degreesOfFreedom = denom > 0 ? num / denom : 0;

  // Approximate p-value using normal approximation for large df
  const pValue = degreesOfFreedom > 0 ? approximatePValue(Math.abs(tStatistic), degreesOfFreedom) : 1;

  // Improvement
  const improvementPercent = mean1 > 0 ? ((mean2 - mean1) / mean1) * 100 : 0;

  // 95% confidence interval
  const tCritical = 1.96; // Approximation for large df
  const ciHalfWidth = tCritical * se;

  return {
    controlGroup: aggregateMetrics(control),
    treatmentGroup: aggregateMetrics(treatment),
    tStatistic,
    pValue,
    degreesOfFreedom,
    significant: pValue < 0.05,
    improvementPercent,
    confidenceInterval: {
      lower: (mean2 - mean1) - ciHalfWidth,
      upper: (mean2 - mean1) + ciHalfWidth,
    },
  };
}

/**
 * Approximate p-value for a two-tailed t-test.
 * Uses a rough approximation suitable for initial implementation.
 */
function approximatePValue(absT: number, df: number): number {
  // For df > 30, t-distribution approximates normal
  // This is a simplified approximation
  if (df <= 0) return 1;

  // For small degrees of freedom, the t-distribution has heavier tails than
  // normal, so a pure normal approximation over-reports significance.
  // Apply a Cornish-Fisher correction factor to inflate the critical value.
  if (df < 30) {
    const correction = 1 + (1 / (4 * df));
    absT = absT / correction;
  }

  // Using a standard normal approximation for large df
  const z = absT;

  // Abramowitz and Stegun approximation for standard normal CDF
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const t = 1 / (1 + p * z);
  const poly = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
  const oneTail = poly * Math.exp(-z * z / 2);

  return 2 * oneTail; // Two-tailed
}

function createEmptyMetric(): MetricSnapshot {
  return { successRate: 0, avgLatencyMs: 0, failureCount: 0, throughput: 0, timestamp: '', sampleSize: 0 };
}

function aggregateMetrics(metrics: MetricSnapshot[]): MetricSnapshot {
  if (metrics.length === 0) return createEmptyMetric();
  const n = metrics.length;
  return {
    successRate: metrics.reduce((a, m) => a + m.successRate, 0) / n,
    avgLatencyMs: metrics.reduce((a, m) => a + m.avgLatencyMs, 0) / n,
    failureCount: metrics.reduce((a, m) => a + m.failureCount, 0),
    throughput: metrics.reduce((a, m) => a + m.throughput, 0),
    timestamp: metrics[n - 1].timestamp,
    sampleSize: n,
  };
}

// ============================================================================
// Outcome Categorization
// ============================================================================

/**
 * Categorize the outcome of a recommendation.
 * Based on improvement in the primary metric (success rate).
 */
export function categorizeOutcome(
  baseline: MetricSnapshot,
  current: MetricSnapshot,
): OutcomeCategory {
  if (baseline.successRate === 0) {
    return current.successRate > 0 ? 'strong-success' : 'neutral';
  }

  const improvementPercent = ((current.successRate - baseline.successRate) / baseline.successRate) * 100;

  if (improvementPercent >= 20) return 'strong-success';
  if (improvementPercent >= 5) return 'weak-success';
  if (improvementPercent > -5) return 'neutral';
  if (improvementPercent > -20) return 'weak-failure';
  return 'strong-failure';
}

// ============================================================================
// Confidence Decay
// ============================================================================

/**
 * Apply confidence decay to records past their validation window.
 */
export function applyConfidenceDecay(
  records: FeedbackRecord[],
  config: ConfidenceDecayConfig = DEFAULT_DECAY_CONFIG,
  now: string = new Date().toISOString(),
): FeedbackRecord[] {
  const nowMs = new Date(now).getTime();

  return records.map(record => {
    if (record.status !== 'evaluating') return record;

    const lastMs = new Date(record.lastUpdated).getTime();
    const daysSinceUpdate = (nowMs - lastMs) / MS_PER_DAY;

    if (daysSinceUpdate < config.decayStartDays) return record;

    const weeksOfDecay = (daysSinceUpdate - config.decayStartDays) / 7;
    const decayFactor = Math.pow(1 - config.decayRatePerWeek, weeksOfDecay);
    const newConfidence = record.initialConfidence * decayFactor;

    const updated = { ...record };
    updated.confidence = Math.max(config.minimumConfidence, newConfidence);
    updated.lastUpdated = now;

    if (updated.confidence <= config.minimumConfidence) {
      updated.status = 'expired';
    }

    return updated;
  });
}

// ============================================================================
// Meta-Learning
// ============================================================================

/**
 * Update meta-learning record from a completed evaluation.
 */
export function updateMetaLearning(
  record: FeedbackRecord,
  existing?: MetaLearningRecord,
): MetaLearningRecord {
  const meta: MetaLearningRecord = existing ?? {
    recommendationType: record.recommendationType,
    totalApplied: 0,
    strongSuccessCount: 0,
    weakSuccessCount: 0,
    neutralCount: 0,
    weakFailureCount: 0,
    strongFailureCount: 0,
    overallSuccessRate: 0,
    avgTimeToValidateMs: 0,
    lastUpdated: new Date().toISOString(),
  };

  meta.totalApplied++;

  if (record.outcome) {
    switch (record.outcome) {
      case 'strong-success': meta.strongSuccessCount++; break;
      case 'weak-success': meta.weakSuccessCount++; break;
      case 'neutral': meta.neutralCount++; break;
      case 'weak-failure': meta.weakFailureCount++; break;
      case 'strong-failure': meta.strongFailureCount++; break;
    }
  }

  const successes = meta.strongSuccessCount + meta.weakSuccessCount;
  meta.overallSuccessRate = meta.totalApplied > 0 ? successes / meta.totalApplied : 0;

  // Time to validate
  if (record.status === 'validated' || record.status === 'rejected') {
    const appliedMs = new Date(record.appliedAt).getTime();
    const resolvedMs = new Date(record.lastUpdated).getTime();
    const duration = resolvedMs - appliedMs;
    meta.avgTimeToValidateMs = (meta.avgTimeToValidateMs * (meta.totalApplied - 1) + duration) / meta.totalApplied;
  }

  meta.lastUpdated = new Date().toISOString();
  return meta;
}

/**
 * Get aggregated meta-learning insights.
 */
export function getMetaLearningInsights(
  records: MetaLearningRecord[],
  feedbackRecords: FeedbackRecord[],
): MetaLearningInsights {
  const typeSuccessRates: Record<string, number> = {};
  const avgTimeToValidate: Record<string, number> = {};
  let mostImpactfulType = 'none';
  let leastReliableType = 'none';
  let bestRate = -1;
  let worstRate = 2;

  for (const meta of records) {
    typeSuccessRates[meta.recommendationType] = meta.overallSuccessRate;
    avgTimeToValidate[meta.recommendationType] = meta.avgTimeToValidateMs;

    if (meta.overallSuccessRate > bestRate) {
      bestRate = meta.overallSuccessRate;
      mostImpactfulType = meta.recommendationType;
    }
    if (meta.overallSuccessRate < worstRate && meta.totalApplied > 0) {
      worstRate = meta.overallSuccessRate;
      leastReliableType = meta.recommendationType;
    }
  }

  const pendingEvaluationCount = feedbackRecords.filter(r => r.status === 'evaluating').length;
  const expiredCount = feedbackRecords.filter(r => r.status === 'expired').length;

  const recommendations: string[] = [];
  if (worstRate < 0.5 && leastReliableType !== 'none') {
    recommendations.push(`Increase confidence threshold for ${leastReliableType} recommendations`);
  }
  if (pendingEvaluationCount > 10) {
    recommendations.push(`${pendingEvaluationCount} recommendations pending evaluation -- consider increasing traffic`);
  }

  return {
    typeSuccessRates,
    avgTimeToValidate,
    mostImpactfulType,
    leastReliableType,
    pendingEvaluationCount,
    expiredCount,
    recommendations,
  };
}

// ============================================================================
// Pattern Feedback
// ============================================================================

/**
 * Generate pattern feedback signals from validated/rejected records.
 */
export function feedbackToPatternEngine(records: FeedbackRecord[]): PatternFeedbackSignal[] {
  return records
    .filter(r => r.status === 'validated' || r.status === 'rejected')
    .map(record => {
      const isSuccess = record.outcome === 'strong-success' || record.outcome === 'weak-success';
      const magnitude = record.outcome === 'strong-success' || record.outcome === 'strong-failure'
        ? 0.2
        : 0.1;

      return {
        recommendationType: record.recommendationType,
        signalType: isSuccess ? 'boost' as const : 'dampen' as const,
        magnitude,
        reason: `Recommendation ${record.recommendationId} ${record.status}: ${record.outcome}`,
        affectedPatterns: [record.recommendationId],
        suggestedConfidenceAdjustment: isSuccess ? magnitude : -magnitude,
      };
    });
}
