import type {
  ClassifiedEvent,
  AffectedComponent,
  ImpactManifest,
  ImpactType,
  ComponentStatus,
} from './types';

/** Injectable dependency: read directory entries */
export type ReadDirFn = (dir: string) => Promise<string[]>;

/** Injectable dependency: read file contents */
export type ReadFileFn = (path: string) => Promise<string>;

/** Injectable dependencies for tracer operations */
export interface TracerDeps {
  readDir: ReadDirFn;
  readFile: ReadFileFn;
}

/**
 * Trace the full impact of a classified upstream change.
 * Builds a dependency graph, finds direct and transitive impacts,
 * and returns a complete manifest.
 */
export async function traceImpact(
  event: ClassifiedEvent,
  deps: TracerDeps,
  skillsDir = '.claude/skills',
  agentsDir = '.claude/agents',
): Promise<ImpactManifest> {
  const graph = await buildDependencyGraph(skillsDir, agentsDir, deps);
  const componentPaths = [...graph.keys()];

  const directImpacts = await findDirectImpacts(event, componentPaths, deps.readFile);
  const transitiveImpacts = findTransitiveImpacts(directImpacts, graph);

  const allComponents = [...directImpacts, ...transitiveImpacts];

  return {
    change_id: event.id,
    classification: event,
    affected_components: allComponents,
    total_blast_radius: calculateBlastRadius(allComponents),
  };
}

/**
 * Find components directly impacted by a change.
 * A component is directly impacted if its content references any
 * of the change's domains or keywords from the diff summary.
 */
export async function findDirectImpacts(
  event: ClassifiedEvent,
  components: string[],
  readFile: ReadFileFn,
): Promise<AffectedComponent[]> {
  const keywords = extractKeywords(event);
  const impacts: AffectedComponent[] = [];

  for (const componentPath of components) {
    const content = await readFile(componentPath);
    const contentLower = content.toLowerCase();

    const matches = keywords.some((kw) => contentLower.includes(kw.toLowerCase()));
    if (matches) {
      impacts.push({
        component: componentPath,
        impact: 'direct' as ImpactType,
        status: 'active' as ComponentStatus,
        blast_radius: `Directly uses ${event.domains.join(', ')}`,
        action: `Review and update for: ${event.summary}`,
        patchable: event.auto_patchable,
      });
    }
  }

  return impacts;
}

/**
 * Find components transitively impacted through the dependency graph.
 * Walks the graph from directly impacted components outward,
 * tracking visited nodes to handle circular dependencies.
 */
export function findTransitiveImpacts(
  directImpacts: AffectedComponent[],
  graph: Map<string, string[]>,
): AffectedComponent[] {
  const directSet = new Set(directImpacts.map((d) => d.component));
  const visited = new Set<string>(directSet);
  const transitive: AffectedComponent[] = [];

  // Find all nodes that depend on directly impacted components (reverse walk)
  const reverseDeps = buildReverseGraph(graph);

  const queue = [...directSet];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const dependents = reverseDeps.get(current) ?? [];

    for (const dep of dependents) {
      if (!visited.has(dep)) {
        visited.add(dep);
        queue.push(dep);
        transitive.push({
          component: dep,
          impact: 'transitive' as ImpactType,
          status: 'active' as ComponentStatus,
          blast_radius: `Depends on impacted component ${current}`,
          action: 'Verify compatibility after upstream update',
          patchable: false,
        });
      }
    }
  }

  return transitive;
}

/**
 * Build a dependency graph by scanning skill and agent directories.
 * Returns a map of component path -> paths it depends on.
 */
export async function buildDependencyGraph(
  skillsDir: string,
  agentsDir: string,
  deps: TracerDeps,
): Promise<Map<string, string[]>> {
  const graph = new Map<string, string[]>();

  // Scan skills directory
  try {
    const skillEntries = await deps.readDir(skillsDir);
    for (const entry of skillEntries) {
      const skillPath = `skills/${entry}/SKILL.md`;
      const fullPath = `${skillsDir}/${entry}/SKILL.md`;
      try {
        const content = await deps.readFile(fullPath);
        const dependencies = extractDependencies(content);
        graph.set(skillPath, dependencies);
      } catch {
        graph.set(skillPath, []);
      }
    }
  } catch {
    // Skills directory doesn't exist, skip
  }

  // Scan agents directory
  try {
    const agentEntries = await deps.readDir(agentsDir);
    for (const entry of agentEntries) {
      const agentPath = `agents/${entry}`;
      const fullPath = `${agentsDir}/${entry}`;
      try {
        const content = await deps.readFile(fullPath);
        const dependencies = extractDependencies(content);
        graph.set(agentPath, dependencies);
      } catch {
        graph.set(agentPath, []);
      }
    }
  } catch {
    // Agents directory doesn't exist, skip
  }

  return graph;
}

/**
 * Calculate the blast radius as the total count of affected components.
 */
export function calculateBlastRadius(components: AffectedComponent[]): number {
  return components.length;
}

// --- Internal helpers ---

/** Build a reverse dependency graph (dependents map) */
function buildReverseGraph(graph: Map<string, string[]>): Map<string, string[]> {
  const reverse = new Map<string, string[]>();

  for (const [node, deps] of graph) {
    for (const dep of deps) {
      const existing = reverse.get(dep) ?? [];
      existing.push(node);
      reverse.set(dep, existing);
    }
  }

  return reverse;
}

/** Extract search keywords from a classified event */
function extractKeywords(event: ClassifiedEvent): string[] {
  // Use domains as the primary matching criteria.
  // Domains are curated, specific terms that reliably indicate relevance.
  // Diff summary words are too noisy for content matching.
  return [...new Set(event.domains)];
}

/** Extract dependency references from file content */
function extractDependencies(content: string): string[] {
  const deps: string[] = [];

  // Match references like skills/name/SKILL.md or agents/name.md
  const skillPattern = /skills\/[\w-]+\/SKILL\.md/g;
  const agentPattern = /agents\/[\w-]+\.md/g;

  const skillMatches = content.match(skillPattern) ?? [];
  const agentMatches = content.match(agentPattern) ?? [];

  deps.push(...skillMatches, ...agentMatches);

  return [...new Set(deps)];
}
