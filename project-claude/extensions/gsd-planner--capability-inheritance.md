<!-- PROJECT:gsd-skill-creator:capability-inheritance START -->
<capability_inheritance>

## Capability Inheritance in Plans

When ROADMAP.md phase detail sections declare capabilities (e.g., `**Capabilities**: use: skill/beautiful-commits`), the planner agent must propagate these into plan frontmatter.

### How It Works

**Step 1: Read capabilitiesByPhase from roadmap-parser output.**

During the `gather_phase_context` step, after reading ROADMAP.md, check if `parseRoadmap()` output includes `capabilitiesByPhase`. This is a `Record<string, CapabilityRef[]>` mapping phase numbers to their declared capabilities.

```typescript
// Conceptual -- the planner reads ROADMAP.md and the parser provides this
const parsed = parseRoadmap(roadmapContent);
const phaseCapabilities = parsed?.capabilitiesByPhase?.[phaseNumber] ?? [];
```

If the current phase has no entry in `capabilitiesByPhase`, skip capability assignment entirely (no `capabilities` field in plan frontmatter).

**Step 2: Assign capabilities to each plan.**

For each plan being created:
- If the plan needs ONLY A SUBSET of the phase capabilities (e.g., Plan 01 uses skill/X but not skill/Y), include only the relevant capabilities in that plan's frontmatter.
- Group by verb in the frontmatter for readability:

```yaml
capabilities:
  use:
    - skill/beautiful-commits
    - agent/gsd-executor
  create:
    - skill/new-generated-skill
```

**Step 3: Inheritance rule -- plans without explicit capabilities inherit all.**

If you cannot determine which specific capabilities a plan needs (or ALL capabilities apply to all plans), OMIT the `capabilities` field from individual plans. The downstream consumer (Phase 56 skill injection) treats a missing `capabilities` field as "inherit all from parent phase."

This means:
- Plan WITH `capabilities` field = selective override (only listed capabilities apply)
- Plan WITHOUT `capabilities` field = inherits everything from parent phase

### Example: Selective Assignment

Phase declares: `use: skill/beautiful-commits, skill/typescript-patterns, agent/gsd-executor`

```yaml
# Plan 01 -- only needs the code patterns skill
capabilities:
  use:
    - skill/typescript-patterns

# Plan 02 -- needs commits skill and executor agent
capabilities:
  use:
    - skill/beautiful-commits
    - agent/gsd-executor

# Plan 03 -- inherits all (capabilities field omitted)
# Downstream treats this as: use all 3 capabilities from phase
```

### When to Use Selective Assignment

- When plans have clearly distinct concerns (e.g., Plan 01 = tests, Plan 02 = implementation, Plan 03 = docs)
- When a capability is only relevant to one plan (e.g., `create: skill/new-thing` only in the plan that scaffolds it)

### When to Omit (Use Inheritance)

- When all plans in the phase use the same capabilities
- When you are unsure which plan needs which capability
- When the phase has few capabilities (1-2) and splitting adds no value

### Create Verb Scaffolding

When the phase declares `create` verb capabilities, the planner should generate scaffold tasks in the plan:

1. Identify `create` verb refs from the phase capabilities (from capabilitiesByPhase)
2. For each create ref:
   - `create: skill/name` -> generate a task that creates `.claude/skills/name/SKILL.md` with skeleton content
   - `create: agent/name` -> generate a task that creates `.claude/agents/name.md` with skeleton content
3. The scaffold task should instruct the executor to:
   - Create the file with the skeleton template
   - Fill in the TODO markers with real content based on phase context
   - Ensure the file has valid frontmatter (name, description at minimum)
4. Created capabilities will appear in CAPABILITIES.md on next regeneration (automatic — CapabilityDiscovery scans project-local `.claude/`)

**Important:** Scaffold tasks generate SKELETON files. The executor fills in real content. Do not produce complete, functional skills/agents in the template — the plan's tasks provide the intelligence.

</capability_inheritance>
<!-- PROJECT:gsd-skill-creator:capability-inheritance END -->
