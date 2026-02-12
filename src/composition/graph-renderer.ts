/**
 * Mermaid graph renderer for skill relationships.
 *
 * Pure function that generates valid Mermaid graph TD syntax from
 * graph data (skills with inheritance, co-activation clusters).
 * No I/O, no store dependencies -- trivially testable.
 */

export interface GraphSkill {
  name: string;
  extends?: string;
  description: string;
}

export interface GraphCluster {
  id: string;
  skills: string[];
  score: number;   // 0-1 co-activation score
}

export interface GraphData {
  skills: GraphSkill[];
  clusters: GraphCluster[];
}

/**
 * Render a Mermaid graph TD diagram from graph data.
 *
 * - Inheritance chains as parent --> child edges
 * - Standalone skills (no extends, not in any cluster) as isolated nodes
 * - Co-activation clusters as subgraphs with score percentage labels
 *
 * @param data - Skills and clusters to render
 * @returns Mermaid-formatted string
 */
export function renderMermaid(data: GraphData): string {
  const lines: string[] = ['graph TD'];

  if (data.skills.length === 0) {
    lines.push('  %% No skills found');
    return lines.join('\n');
  }

  // Collect skills that appear in clusters for standalone detection
  const clusteredSkills = new Set<string>();
  for (const cluster of data.clusters) {
    for (const skill of cluster.skills) {
      clusteredSkills.add(skill);
    }
  }

  // Inheritance section
  const inheritanceEdges = data.skills.filter(s => s.extends);
  if (inheritanceEdges.length > 0) {
    lines.push('  %% Inheritance chains');
    for (const skill of inheritanceEdges) {
      lines.push(`  ${skill.extends} --> ${skill.name}`);
    }
  }

  // Standalone nodes: no extends AND not in any cluster AND not a parent of anyone
  const parentSkills = new Set(inheritanceEdges.map(s => s.extends!));
  const childSkills = new Set(inheritanceEdges.map(s => s.name));

  for (const skill of data.skills) {
    const isInInheritance = childSkills.has(skill.name) || parentSkills.has(skill.name);
    const isInCluster = clusteredSkills.has(skill.name);

    if (!isInInheritance && !isInCluster) {
      lines.push(`  ${skill.name}`);
    }
  }

  // Cluster subgraphs
  for (const cluster of data.clusters) {
    const pct = (cluster.score * 100).toFixed(0);
    lines.push(`  subgraph ${cluster.id} ["Co-activated (${pct}%)"]`);
    for (const skill of cluster.skills) {
      lines.push(`    ${skill}`);
    }
    lines.push('  end');
  }

  return lines.join('\n');
}
