/**
 * CLI command for triggering DACP retrospective analysis on demand.
 *
 * Invokes the retrospective analyzer and displays results including
 * patterns found, drift scores, and fidelity recommendations.
 *
 * Three-tier output: text (styled), quiet (summary), JSON.
 *
 * @module cli/commands/dacp-analyze
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';

// ============================================================================
// Help
// ============================================================================

function showDacpAnalyzeHelp(): void {
  console.log(`
skill-creator dacp analyze - Trigger retrospective analysis

Usage:
  skill-creator dacp analyze [options]
  skill-creator dp a [options]

Runs the retrospective analyzer on handoff history data and
displays pattern analysis, drift scores, and fidelity recommendations.

Options:
  --milestone=<name>  Filter analysis to a specific milestone
  --quiet, -q         Machine-readable summary output
  --json              JSON output
  --help, -h          Show this help

Examples:
  skill-creator dacp analyze
  skill-creator dacp analyze --milestone v1.49
  skill-creator dp a --json
`);
}

// ============================================================================
// Types
// ============================================================================

interface PatternAnalysisResult {
  patterns_created: number;
  patterns_updated: number;
  promotions_recommended: Array<{
    type: string;
    current_fidelity: number;
    recommended_fidelity: number;
    avg_drift_score: number;
  }>;
  demotions_recommended: Array<{
    type: string;
    current_fidelity: number;
    recommended_fidelity: number;
    avg_drift_score: number;
  }>;
  summary: {
    total_handoffs_analyzed: number;
    avg_drift_score: number;
    highest_drift_pattern: string;
    lowest_drift_pattern: string;
  };
}

// ============================================================================
// Command Entry Point
// ============================================================================

/**
 * Trigger DACP retrospective analysis.
 *
 * @param args - Command-line arguments (after 'dacp analyze')
 * @returns Exit code (0 success, 1 error)
 */
export async function dacpAnalyzeCommand(args: string[]): Promise<number> {
  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showDacpAnalyzeHelp();
    return 0;
  }

  // Parse output mode flags
  const quiet = args.includes('--quiet') || args.includes('-q');
  const json = args.includes('--json');

  // Parse --milestone flag
  let milestone: string | undefined;
  const milestoneIdx = args.indexOf('--milestone');
  if (milestoneIdx !== -1 && args[milestoneIdx + 1]) {
    milestone = args[milestoneIdx + 1];
  }
  const milestoneEqualsArg = args.find((a) => a.startsWith('--milestone='));
  if (milestoneEqualsArg) {
    milestone = milestoneEqualsArg.split('=')[1];
  }

  try {
    // Dynamic import of retrospective module
    const { analyzePatterns, readDriftHistory } = await import(
      '../../dacp/retrospective/index.js'
    );

    // Read drift history
    const driftRecords = await readDriftHistory(milestone);

    if (!driftRecords || driftRecords.length === 0) {
      if (json) {
        console.log(JSON.stringify({ message: 'No handoff data to analyze' }));
      } else if (!quiet) {
        p.log.info('No handoff data to analyze.');
      }
      return 0;
    }

    // Convert drift records to HandoffOutcomeWithType format for analyzer
    const outcomes = driftRecords.map(
      (record: any) => ({
        bundle_id: record.bundle_id ?? '',
        fidelity_level: record.fidelity_level ?? 0,
        intent_alignment: record.intent_alignment ?? 1.0,
        rework_required: record.rework_required ?? false,
        tokens_spent_interpreting: record.tokens_spent_interpreting ?? 0,
        code_modifications: record.code_modifications ?? 0,
        verification_pass: record.verification_pass ?? true,
        timestamp: record.timestamp ?? new Date().toISOString(),
        handoff_type: record.handoff_type ?? record.pattern ?? 'unknown',
      }),
    );

    // Run analysis
    const result: PatternAnalysisResult = analyzePatterns(outcomes, []);

    // JSON output
    if (json) {
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }

    // Quiet output
    if (quiet) {
      console.log(
        `${result.summary.total_handoffs_analyzed},${result.summary.avg_drift_score.toFixed(2)},${result.patterns_created},${result.patterns_updated},${result.promotions_recommended.length},${result.demotions_recommended.length}`,
      );
      return 0;
    }

    // Text output
    p.log.message(pc.bold('DACP Retrospective Analysis'));
    p.log.message(pc.dim('\u2500'.repeat(30)));
    p.log.message('');

    p.log.message(
      `Handoffs analyzed: ${pc.cyan(String(result.summary.total_handoffs_analyzed))}`,
    );
    p.log.message(
      `Average drift score: ${pc.cyan(result.summary.avg_drift_score.toFixed(2))}`,
    );
    p.log.message(
      `Patterns created: ${pc.cyan(String(result.patterns_created))} | updated: ${pc.cyan(String(result.patterns_updated))}`,
    );
    p.log.message('');

    if (result.summary.highest_drift_pattern) {
      p.log.message(
        `Highest drift: ${pc.red(result.summary.highest_drift_pattern)}`,
      );
    }
    if (result.summary.lowest_drift_pattern) {
      p.log.message(
        `Lowest drift: ${pc.green(result.summary.lowest_drift_pattern)}`,
      );
    }

    // Show recommendations
    if (result.promotions_recommended.length > 0) {
      p.log.message('');
      p.log.message(pc.bold('Promotion Recommendations:'));
      for (const promo of result.promotions_recommended) {
        p.log.message(
          `  \u2191 ${promo.type}: Level ${promo.current_fidelity} \u2192 Level ${promo.recommended_fidelity} (avg drift: ${promo.avg_drift_score.toFixed(2)})`,
        );
      }
    }

    if (result.demotions_recommended.length > 0) {
      p.log.message('');
      p.log.message(pc.bold('Demotion Recommendations:'));
      for (const demo of result.demotions_recommended) {
        p.log.message(
          `  \u2193 ${demo.type}: Level ${demo.current_fidelity} \u2192 Level ${demo.recommended_fidelity} (avg drift: ${demo.avg_drift_score.toFixed(2)})`,
        );
      }
    }

    return 0;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (json) {
      console.log(JSON.stringify({ error: message }));
    } else if (!quiet) {
      p.log.error(`Analysis failed: ${message}`);
    }
    return 1;
  }
}
