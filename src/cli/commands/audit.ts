import pc from 'picocolors';
import { SkillStore } from '../../storage/skill-store.js';
import { VersionManager } from '../../learning/version-manager.js';
import { DriftTracker } from '../../learning/drift-tracker.js';
import { ContradictionDetector } from '../../learning/contradiction-detector.js';
import { FeedbackStore } from '../../learning/feedback-store.js';
import { getExtension } from '../../types/skill.js';

/**
 * Audit CLI command - displays skill evolution history with diffs and drift.
 * Implements LRN-04: audit trail showing how skills have evolved.
 */
export async function auditCommand(
  skillName: string | undefined,
  options: { skillsDir?: string }
): Promise<number> {
  if (!skillName) {
    console.log('Usage: skill-creator audit <skill-name>');
    console.log('');
    console.log('Show skill evolution: drift, contradictions, version diffs');
    return 1;
  }

  const skillsDir = options.skillsDir ?? '.claude/skills';
  const skillStore = new SkillStore(skillsDir);
  const versionManager = new VersionManager(skillsDir);
  const feedbackStore = new FeedbackStore('.planning/patterns');
  const driftTracker = new DriftTracker(versionManager, skillStore);
  const contradictionDetector = new ContradictionDetector(feedbackStore);

  // Try to read skill
  let skill;
  try {
    skill = await skillStore.read(skillName);
  } catch {
    console.log(pc.red(`Error: Skill "${skillName}" not found.`));
    return 1;
  }

  const ext = getExtension(skill.metadata);

  // Section 1: Current State
  console.log('');
  console.log(pc.bold(`Audit: ${skillName}`));
  console.log('─'.repeat(50));
  console.log(`  Version:     ${ext.version ?? 1}`);
  console.log(`  Description: ${skill.metadata.description ?? 'none'}`);
  if (ext.learning?.lastRefined) {
    console.log(`  Last refined: ${new Date(ext.learning.lastRefined).toLocaleDateString()}`);
  }
  console.log('');

  // Section 2: Version History
  console.log(pc.bold('Version History'));
  console.log('─'.repeat(50));

  try {
    const history = await versionManager.getHistory(skillName);

    if (history.length === 0) {
      console.log('  No git history available.');
    } else {
      for (const version of history) {
        const date = version.date.toLocaleDateString();
        const versionLabel = version.version ? ` (v${version.version})` : '';
        console.log(`  ${version.shortHash}  ${date}${versionLabel}`);
        console.log(`    ${pc.dim(version.message)}`);
      }

      // Show diffs between consecutive versions
      if (history.length >= 2) {
        console.log('');
        console.log(pc.dim('  Diff between first and latest:'));
        try {
          const diff = await versionManager.compareVersions(
            skillName,
            history[history.length - 1].hash,
            history[0].hash
          );
          if (diff.trim()) {
            const lines = diff.split('\n').slice(0, 20);
            for (const line of lines) {
              if (line.startsWith('+') && !line.startsWith('+++')) {
                console.log(`    ${pc.green(line)}`);
              } else if (line.startsWith('-') && !line.startsWith('---')) {
                console.log(`    ${pc.red(line)}`);
              } else {
                console.log(`    ${pc.dim(line)}`);
              }
            }
            if (diff.split('\n').length > 20) {
              console.log(`    ${pc.dim('... (truncated)')}`);
            }
          }
        } catch {
          // Diff may fail if files are not tracked
        }
      }
    }
  } catch {
    console.log('  Unable to retrieve version history.');
  }
  console.log('');

  // Section 3: Cumulative Drift
  console.log(pc.bold('Cumulative Drift'));
  console.log('─'.repeat(50));

  try {
    const driftResult = await driftTracker.computeDrift(skillName);
    console.log(`  Cumulative drift from original: ${driftResult.cumulativeDriftPercent}%`);

    if (driftResult.cumulativeDriftPercent >= 60) {
      console.log(pc.red('  WARNING: Drift exceeds 60% threshold. Automatic refinements are blocked.'));
    } else if (driftResult.cumulativeDriftPercent >= 40) {
      console.log(pc.yellow('  Note: Drift approaching 60% threshold.'));
    }
  } catch {
    console.log('  Unable to compute drift (no version history).');
  }
  console.log('');

  // Section 4: Contradiction Analysis
  console.log(pc.bold('Contradiction Analysis'));
  console.log('─'.repeat(50));

  try {
    const contradictionResult = await contradictionDetector.detect(skillName);

    if (contradictionResult.contradictions.length === 0) {
      console.log('  No contradictions detected in feedback.');
    } else {
      console.log(`  ${contradictionResult.summary}`);
      console.log('');

      for (const contradiction of contradictionResult.contradictions) {
        const icon = contradiction.severity === 'conflict' ? pc.red('CONFLICT') : pc.yellow('WARNING');
        console.log(`  [${icon}] ${contradiction.description}`);
      }

      if (contradictionResult.hasConflicts) {
        console.log('');
        console.log(pc.red('  Contradictory feedback detected. Review corrections before refining.'));
      }
    }
  } catch {
    console.log('  Unable to analyze contradictions.');
  }
  console.log('');

  return 0;
}
