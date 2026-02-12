/**
 * CLI command for visualizing skill relationships as a Mermaid diagram.
 *
 * Outputs a Mermaid graph showing inheritance chains and co-activation
 * clusters. Paste the output into GitHub markdown, VS Code preview,
 * or Mermaid Live Editor to see the diagram.
 *
 * Usage:
 *   skill-creator graph              Output Mermaid diagram to stdout
 *   skill-creator graph --json       Output as JSON (skills, clusters, mermaid)
 *   skill-creator graph --project    Use project scope
 */

import { SkillStore } from '../../storage/skill-store.js';
import { renderMermaid, GraphData, GraphSkill, GraphCluster } from '../../composition/graph-renderer.js';
import { getExtension } from '../../types/skill.js';
import { parseScope, getSkillsBasePath } from '../../types/scope.js';

const HELP_TEXT = `
Usage: skill-creator graph [options]

Output a Mermaid diagram showing skill relationships.

Options:
  --json           Output as JSON (includes mermaid text and raw data)
  --project, -p    Use project scope
  --help, -h       Show this help message

Examples:
  skill-creator graph              Output Mermaid diagram
  skill-creator graph --json       Machine-readable JSON output
  skill-creator graph --project    Use project-level skills
`;

/**
 * Main entry point for the graph command.
 *
 * @param args - Command-line arguments after 'graph'
 * @returns Exit code (0 for success, 1 for error)
 */
export async function graphCommand(args: string[]): Promise<number> {
  // Handle help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP_TEXT);
    return 0;
  }

  try {
    const jsonMode = args.includes('--json');
    const scope = parseScope(args);
    const skillsDir = getSkillsBasePath(scope);

    // Load skills
    const store = new SkillStore(skillsDir);
    const skillNames = await store.list();

    // Build graph skills from metadata
    const graphSkills: GraphSkill[] = [];
    for (const name of skillNames) {
      const skill = await store.read(name);
      const ext = getExtension(skill.metadata);
      graphSkills.push({
        name,
        extends: ext.extends ?? skill.metadata.extends,
        description: skill.metadata.description,
      });
    }

    // Build co-activation clusters (optional -- gracefully handle missing data)
    const graphClusters: GraphCluster[] = [];
    try {
      const { readFile } = await import('fs/promises');
      const { join } = await import('path');
      const sessionsPath = join('.planning', 'patterns', 'sessions.jsonl');
      const content = await readFile(sessionsPath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      if (lines.length > 0) {
        const { CoActivationTracker } = await import('../../agents/co-activation-tracker.js');
        const { ClusterDetector } = await import('../../agents/cluster-detector.js');

        const sessions = lines.map(line => JSON.parse(line));
        const tracker = new CoActivationTracker();
        const coActivations = tracker.analyze(sessions);
        const detector = new ClusterDetector();
        const clusters = detector.detect(coActivations);

        for (const cluster of clusters) {
          graphClusters.push({
            id: cluster.id,
            skills: cluster.skills,
            score: cluster.coActivationScore,
          });
        }
      }
    } catch {
      // No sessions data or parse error -- proceed with empty clusters
    }

    // Build graph data and render
    const graphData: GraphData = {
      skills: graphSkills,
      clusters: graphClusters,
    };
    const mermaid = renderMermaid(graphData);

    if (jsonMode) {
      console.log(JSON.stringify({
        skills: graphData.skills,
        clusters: graphData.clusters,
        mermaid,
      }, null, 2));
    } else {
      console.log('```mermaid');
      console.log(mermaid);
      console.log('```');
    }

    return 0;
  } catch (err) {
    console.error(`Graph command failed: ${(err as Error).message}`);
    return 1;
  }
}
