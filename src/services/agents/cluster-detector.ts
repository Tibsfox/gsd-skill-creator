import { SkillCoActivation } from './co-activation-tracker.js';

export interface ClusterConfig {
  minClusterSize: number;       // Minimum skills in cluster (default 2)
  maxClusterSize: number;       // Maximum skills in cluster (default 5)
  minCoActivations: number;     // Edge threshold (default 5)
  stabilityDays: number;        // Pattern must persist this long (default 7)
}

export const DEFAULT_CLUSTER_CONFIG: ClusterConfig = {
  minClusterSize: 2,
  maxClusterSize: 5,
  minCoActivations: 5,
  stabilityDays: 7,
};

export interface SkillCluster {
  id: string;                   // Unique cluster ID
  skills: string[];             // Skills in the cluster
  coActivationScore: number;    // Average co-activation strength (0-1)
  stabilityDays: number;        // How long pattern has been consistent
  suggestedName: string;        // Auto-generated agent name
  suggestedDescription: string; // Auto-generated description
}

export class ClusterDetector {
  private config: ClusterConfig;

  constructor(config?: Partial<ClusterConfig>) {
    this.config = { ...DEFAULT_CLUSTER_CONFIG, ...config };
  }

  /**
   * Detect skill clusters from co-activation data
   * Uses connected components with edge threshold filtering
   */
  detect(coActivations: SkillCoActivation[]): SkillCluster[] {
    // Filter by minimum co-activations
    const significant = coActivations.filter(
      ca => ca.coActivationCount >= this.config.minCoActivations
    );

    // Build adjacency graph
    const graph = new Map<string, Set<string>>();
    const edgeWeights = new Map<string, number>();

    for (const ca of significant) {
      const [a, b] = ca.skillPair;

      if (!graph.has(a)) graph.set(a, new Set());
      if (!graph.has(b)) graph.set(b, new Set());

      graph.get(a)!.add(b);
      graph.get(b)!.add(a);
      edgeWeights.set(`${a}:${b}`, ca.coActivationCount);
    }

    // Find connected components using BFS
    const visited = new Set<string>();
    const clusters: SkillCluster[] = [];

    for (const skill of graph.keys()) {
      if (visited.has(skill)) continue;

      const component: string[] = [];
      const queue = [skill];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        visited.add(current);
        component.push(current);

        for (const neighbor of graph.get(current) || []) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      // Filter by size constraints
      if (component.length >= this.config.minClusterSize &&
          component.length <= this.config.maxClusterSize) {
        clusters.push(this.createCluster(component, significant));
      }
    }

    return clusters.sort((a, b) => b.coActivationScore - a.coActivationScore);
  }

  private createCluster(skills: string[], coActivations: SkillCoActivation[]): SkillCluster {
    // Calculate average co-activation score
    const relevantEdges = coActivations.filter(ca =>
      skills.includes(ca.skillPair[0]) && skills.includes(ca.skillPair[1])
    );

    const avgCount = relevantEdges.length > 0
      ? relevantEdges.reduce((sum, ca) => sum + ca.coActivationCount, 0) / relevantEdges.length
      : 0;

    // Calculate stability (days since first seen)
    const firstSeen = relevantEdges.length > 0
      ? Math.min(...relevantEdges.map(ca => ca.firstSeen))
      : Date.now();
    const stabilityDays = Math.floor((Date.now() - firstSeen) / (24 * 60 * 60 * 1000));

    // Generate name from skills
    const sortedSkills = [...skills].sort();
    const suggestedName = this.generateAgentName(sortedSkills);
    const suggestedDescription = this.generateDescription(sortedSkills);

    return {
      id: `cluster-${sortedSkills.join('-').slice(0, 30)}`,
      skills: sortedSkills,
      coActivationScore: Math.min(1, avgCount / 10),  // Normalize to 0-1
      stabilityDays,
      suggestedName,
      suggestedDescription,
    };
  }

  private generateAgentName(skills: string[]): string {
    // Use common prefix or first skill as base
    const commonPrefix = this.findCommonPrefix(skills);
    if (commonPrefix.length > 3) {
      return `${commonPrefix}-agent`;
    }
    return `${skills[0]}-combo-agent`;
  }

  private generateDescription(skills: string[]): string {
    return `Combines expertise from: ${skills.join(', ')}. Auto-generated from skill cluster.`;
  }

  private findCommonPrefix(strings: string[]): string {
    if (strings.length === 0) return '';
    let prefix = strings[0];
    for (const s of strings.slice(1)) {
      while (!s.startsWith(prefix) && prefix.length > 0) {
        prefix = prefix.slice(0, -1);
      }
    }
    return prefix.replace(/-$/, '');  // Remove trailing hyphen
  }
}
