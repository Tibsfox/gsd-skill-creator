export function printHelp(): void {
  console.log(`
skill-creator - Manage Claude Code skills

Usage:
  skill-creator <command> [options]

Commands:
  create, c         Create a new skill through guided workflow
  list, ls          List all available skills with metadata
  search, s         Search skills by keyword (--all for cross-directory)
  delete, del, rm   Delete a skill
  resolve, res      Show which version of a skill is active
  validate, v       Validate skill structure and metadata
  detect-conflicts, dc  Detect semantic conflicts between skills
  score-activation, sa  Score skill activation likelihood
  tractability, tract   Classify skill tractability (single skill or repo audit)
  model-affinity, aff   Evaluate per-skill model affinity (single or audit)
  representation-audit, rep-audit  Audit representation coverage (collapse detector)
  output-structure, os  Inspect/migrate skill output_structure frontmatter
  migrate, mg       Migrate legacy flat-file skills to subdirectory format
  migrate-agent, ma Migrate agents with legacy tools format
  migrate-plane, mp Migrate skills to the substrate-plane layout
  sync-reserved     Show/update reserved skill names list
  test, t           Manage skill test cases
  test-triggering   Test skill activation via subagent + naive prompt
  skill             Skill-namespaced subcommands (test-triggering)
  simulate, sim     Predict which skill would activate for a prompt
  predict-next, pn  Predict next-likely skill activation + record calibration event
  activations, act  Show skill activation history and reports
  cadence, cad      Cadence calibration loop for skill maintenance
  budget, bg        Show character budget usage across all skills
  budget-estimate, be  Show token budget estimates per agent profile
  capabilities, cap  Generate or show capability manifest (CAPABILITIES.md)
  compress-research, cr  Compress research files to distilled skill files
  generate-collector, gc  Generate a read-only collector agent
  advise-parallelization, ap  Analyze plan dependencies for parallel execution
  invoke, i         Manually invoke a skill by name
  status, st        Show active skills and token budget
  suggest, sg       Analyze patterns and review skill suggestions
  suggestions, sgs  List/manage skill suggestions
  feedback, fb      View feedback for skills
  teach             Append a structured teaching entry (symbiosis)
  co-evolution, coevo  Run symbiosis co-evolution pass + report
  quintessence, quint  Show symbiosis quintessence narrative report
  refine, rf        Generate and apply skill refinements
  history, hist     View skill version history
  audit, au         Show skill evolution: drift, contradictions, version diffs
  critique, crit    Adversarial critique loop (spec-compliance, code-quality, link-check)
  rollback, rb      Rollback skill to previous version
  agents, ag        Manage agent suggestions from skill clusters
  team, tm          Manage agent teams (create, list, validate, spawn, status)
  dacp, dp          Manage DACP handoff protocol (status, set-level, history, analyze, export, drift-check)
  git               Deterministic git workflow (install, status, sync, work, gate merge|pr, worktree list)
  skill-inventory, inv  Report skill lifecycle state (status counts, stale skills, deprecated)
  learn             Ingest a source (path/URL) into the skill-knowledge pipeline (--depth, --domain, --yes)
  arxiv, scan-arxiv Fetch + rank arxiv papers for sc:learn (local rank by default; --rank for LLM fine-rank)
  koopman-check, kc Advisory koopman-memory invariant check (identity retention, zero-input retention, Lipschitz bound)
  coherent-check, cc Advisory coherent-functors coherence check (naturality, identity, composition, direct-sum)
  hourglass-check, hc Advisory hourglass-persistence audit (holes, contraction-index, waists)
  bounded-learning, bl Bounded-learning calibration loop (skill-creator threshold recommendations)
  sensoria          Inspect skill net-shift response curve across a ligand sweep
  reload-embeddings, re  Reload embedding model (retry after fallback)
  calibrate, cal    Optimize activation threshold from calibration data
  benchmark, bench  Measure simulator accuracy vs real activation
  eval              Run skill evaluations (multi-model benchmarks, view results)
  ab, ab-test       Skill A/B harness (variant comparison, status, list)
  discover, disc    Discover skill candidates from session history
  amiga, am         Mine skill candidates via the AMIGA meta-mission detector (--corpus, --emit)
  pic2html          Convert an image into HTML table art (--size, --grayscale, --levels)
  quality, q        Show per-skill health scores (precision, success rate, efficiency)
  graph, gr         Output Mermaid diagram of skill relationships
  impact, imp       Analyze inheritance impact of modifying a skill
  export, ex        Export skill for other platforms (--portable, --platform)
  publish, pub      Package a skill as .tar.gz for distribution
  install, inst     Install a skill from local file or remote URL
  gsd-init, gi      Install GSD skill-creator integration into a project
  mcp-server        Start MCP server for skill browsing/installation
  gateway, gw       Start the MCP HTTP gateway (memory.* tools + chipset/agent/workflow/session)
  ingest-conversations, ingest-convos  Ingest Claude Code transcripts into private conversation memory (--pg for semantic)
  coprocessor, cp   Coprocessor MCP tools (list-tools, capabilities, vram, call)
  session, sess     Manage session continuity (save, restore, handoff)
  purge, pg         Compact and clean observation JSONL files
  orchestrator, orch  GSD orchestrator (discover, state, classify, lifecycle)
  workflow, wf      Manage skill workflows (create, run, list, status)
  role, rl          Manage skill roles (create, list)
  bundle, bd        Manage work bundles (create, list, activate, deactivate, status)
  cartridge         Manage skill cartridges (load, validate, scaffold, eval, dedup, fork)
  chip              Manage chips (status, health, list, capabilities)
  keystore          Manage encrypted credential keystore (migrate, set, status)
  integration, int  Manage skill-creator integration config (validate, show, migrate)
  config, cfg       Manage GSD configuration (validate)
  event, ev         Manage skill events (list, emit, consume, suggest, expire)
  dashboard, db     Generate GSD Planning Docs Dashboard from .planning/
  plane-status, ps  Show complex-plane health metrics (versine, exsecant, chord)
  terminal, term    Manage Wetty terminal server (start, stop, status, restart)
  project, proj     Manage GSD projects (init, list, status)
  pack              Browse educational packs (list, info)
  contrib           Manage contrib zone (upstream, downstream, publishing)
  www               Manage www zone (status)
  drift             Drift-telemetry audit + governance (subcommand: audit)
  help, -h          Show this help message
  --version, -V     Show version information

Scope Options:
  Skills can exist at two scopes:
    - User-level:    ~/.claude/skills/    (default, shared across projects)
    - Project-level: .claude/skills/      (project-specific)

  Project-level skills take precedence over user-level skills with the
  same name. This allows project-specific customization.

  --project, -p     Target project-level scope
                    Without this flag, operations default to user-level
                    Applies to: create, delete, validate, migrate, budget

  --scope=<value>   Filter list output by scope
                    Values: user, project, all (default: all)
                    Only applies to 'list' command

  Examples:
    skill-creator create              # Create at ~/.claude/skills/
    skill-creator create --project    # Create at .claude/skills/
    skill-creator list --scope=user   # Show only user-level skills
    skill-creator delete my-skill -p  # Delete project-level version
    skill-creator resolve my-skill    # Show which version is active

Team Management:
  The 'team' command manages agent teams -- multi-agent configurations
  for coordinated work. Teams use pattern templates (leader-worker,
  pipeline, swarm) and validate member resolution, tool overlap,
  and role coherence.

  Run 'team create' for an interactive wizard, or use flags for
  scripted team creation. Run 'team validate --all' to check all
  teams at once.

Pattern Detection:
  The suggest command analyzes your Claude Code usage patterns and
  proposes skills when it detects recurring workflows (3+ occurrences).

  Run 'suggest' periodically to discover automation opportunities.

Activation Scoring:
  The score-activation command predicts how reliably a skill will
  auto-activate based on its description quality. Scores range from
  0-100 with labels: Reliable (90+), Likely (70-89), Uncertain (50-69),
  Unlikely (<50).

  Run 'score-activation my-skill' for detailed factor breakdown and
  suggestions for improvement. Run '--all' to see scores for all skills.

Learning Loop:
  Skills can be refined based on user corrections. After 3+ corrections
  are recorded, run 'refine' to generate bounded refinement suggestions.

  Refinements are bounded:
    - Requires 3+ corrections before suggesting changes
    - Maximum 20% content change per refinement
    - 7-day cooldown between refinements
    - User confirmation always required

  Use 'rollback' to revert any skill to a previous version if a
  refinement degrades performance.

Agent Composition:
  The 'agents' command analyzes skill co-activation patterns and
  suggests creating composite agents when skills frequently activate
  together.

  Run 'agents suggest' to detect stable clusters and create agents
  that combine related skills into a single invocation.

  Generated agents follow the official Claude Code agent format:
    - name: lowercase letters, numbers, and hyphens
    - description: when Claude should delegate to this agent
    - tools: comma-separated string (e.g., "Read, Write, Bash")
    - model: optional model alias (sonnet, opus, haiku, inherit)

  Run 'agents validate' to check all agents for format issues.
  Run 'agents adoption' to scan dispatch sites — which agents are living
  vs dormant (the agent-tier sibling of the src/ adoption scan).
  Run 'migrate-agent' to fix agents with legacy format.

  Note: User-level agents (~/.claude/agents/) have a known discovery
  bug (GitHub #11205). Consider using project-level agents instead.
  Workarounds: use project-level agents, the /agents UI command, or
  pass agents via --agents CLI flag when starting Claude Code.

Workflow Management:
  The 'workflow' command manages skill workflows -- multi-step
  execution pipelines that compose skills into repeatable processes.
  Workflows are defined as .workflow.yaml files in .claude/workflows/.

  Run 'workflow create' for an interactive wizard, or use --name and
  --steps flags for scripted creation. Run 'workflow run <name>' to
  execute a workflow, and 'workflow status <name>' to check progress.
  Interrupted runs can be resumed with 'workflow run <name> --resume'.

Role Management:
  The 'role' command manages agent roles -- behavioral constraint templates
  that define skills, constraints, tools, and model for agent personas.
  Roles are defined as .role.yaml files in .claude/roles/.

  Roles can extend other roles via the extends: field, inheriting
  constraints additively and tools/model with child-wins semantics.

  Run 'role create' for an interactive wizard, or use --name flag
  for scripted creation. Run 'role list' to see all defined roles.

Bundle Management:
  The 'bundle' command manages work bundles -- groups of skills for
  specific project phases. Bundles are defined as .bundle.yaml files
  in .claude/bundles/.

  Activating a bundle gives required skills priority 10 in token
  budget allocation, while optional skills get priority 1.

  Run 'bundle create' for an interactive wizard, or use --name and
  --skills flags for scripted creation. Run 'bundle activate --name=X'
  to set active bundle. Run 'bundle status' to see current state.

Event Management:
  The 'event' command manages inter-skill communication events.
  Skills declare emits/listens in their frontmatter extension fields.
  Events are logged to .planning/patterns/events.jsonl.
  Use 'event emit' to fire events and 'event suggest' to discover
  potential event connections from co-activation patterns.

Pattern Discovery:
  The 'discover' command scans your Claude Code session history for
  recurring tool sequences and bash command patterns. It ranks
  candidates by frequency, cross-project usage, and recency, then
  lets you interactively select which patterns to generate as skills.

  Options:
    --exclude=<projects>  Skip comma-separated project slugs
    --rescan              Force full rescan (ignore watermarks)

  Run 'discover' periodically as your session history grows.

Test Management:
  The 'test' command manages test cases for skill activation testing.
  Test cases define expected behavior: should the skill activate for
  a given prompt?

  Subcommands:
    test add <skill>       Add a test case (interactive or flags)
    test list <skill>      List test cases for a skill
    test edit <skill> <id> Edit an existing test case
    test delete <skill> <id> Delete a test case

  Examples:
    skill-creator test add my-skill
    skill-creator test add my-skill --prompt="commit my changes" --expected=positive
    skill-creator test list my-skill
    skill-creator test list my-skill --expected=negative
    skill-creator test delete my-skill abc123 --force

Activation Simulation:
  The 'simulate' command predicts which skill would activate for a given
  prompt using semantic similarity. Use it to validate skill descriptions
  and identify potential conflicts.

  Options:
    --scope             Scope: user (default) or project
    --verbose, -v       Show all predictions and trace details
    --batch <file>      Test multiple prompts from file (one per line)
    --threshold <n>     Activation threshold (default: 0.75)
    --json              Output results as JSON

  Examples:
    skill-creator simulate "commit my changes"
    skill-creator sim "deploy to production" --verbose
    skill-creator simulate --batch prompts.txt --json
    skill-creator simulate "test" --scope project --threshold 0.8

Budget Management:
  Claude Code limits skill content to ~15,000 characters per skill and
  ~15,500 characters total. Run 'budget' to see current usage and identify
  large skills that may need optimization.

  Skills exceeding the budget may be silently hidden by Claude Code.

Examples:
  skill-creator create              # Create user-level skill (default)
  skill-creator create --project    # Create project-level skill
  skill-creator delete my-skill     # Delete from user scope
  skill-creator delete my-skill -p  # Delete from project scope
  skill-creator resolve my-skill    # Show which version is active
  skill-creator list                # Show all skills (both scopes)
  skill-creator list --scope=user   # Show only user-level skills
  skill-creator search              # Interactive search
  skill-creator search --all        # Search user, project, and plugin directories
  skill-creator search --all --dirs=/path/to/plugins  # Include custom plugin directory
  skill-creator validate my-skill   # Validate a specific skill
  skill-creator validate --all      # Validate all skills
  skill-creator migrate             # Migrate all legacy skills interactively
  skill-creator migrate my-skill    # Migrate a specific skill
  skill-creator invoke my-skill     # Load a specific skill
  skill-creator status              # Show active skills
  skill-creator suggest             # Analyze patterns, review suggestions
  skill-creator feedback my-skill   # View feedback for a skill
  skill-creator refine my-skill     # Apply refinements
  skill-creator history my-skill    # View version history
  skill-creator rollback my-skill   # Rollback to previous version
  skill-creator agents suggest      # Analyze co-activations, suggest agents
  skill-creator agents list         # List agents with validation status
  skill-creator agents validate     # Check all agents for format issues
  skill-creator agents adoption     # Scan dispatch sites: living vs dormant
  skill-creator budget              # Show budget usage for user scope
  skill-creator budget --project    # Show budget usage for project scope
  skill-creator detect-conflicts    # Scan all skills for conflicts
  skill-creator dc my-skill         # Check one skill against others
  skill-creator dc --threshold=0.90 # Use stricter threshold
  skill-creator dc --json           # JSON output for CI/scripting
  skill-creator score-activation my-skill  # Score single skill
  skill-creator sa --all                   # Score all skills
  skill-creator sa --all --verbose         # With factor breakdown
  skill-creator migrate-agent       # Check all agents for legacy format
  skill-creator migrate-agent my-agent  # Migrate specific agent
  skill-creator ma --dry-run        # Preview changes without writing
  skill-creator team create         # Interactive team creation wizard
  skill-creator tm c --pattern=leader-worker --name=my-team
  skill-creator team list           # List all teams
  skill-creator team validate --all # Validate all teams
  skill-creator team spawn my-team  # Check spawn readiness
  skill-creator tm s my-team        # Show team details
  skill-creator discover              # Scan sessions for patterns
  skill-creator disc --rescan         # Force full rescan
  skill-creator discover --exclude=temp  # Skip specific projects
  skill-creator export --portable my-skill    # Portable agentskills.io output
  skill-creator export --platform cursor my-skill  # Cursor-specific variant
  skill-creator workflow create       # Interactive workflow creation
  skill-creator wf c --name=deploy --steps='[{"id":"lint","skill":"linter"}]'
  skill-creator workflow run deploy   # Run a workflow
  skill-creator wf r deploy --resume  # Resume interrupted run
  skill-creator workflow list         # List all workflows
  skill-creator workflow status deploy # Show run progress
  skill-creator role create            # Interactive role creation
  skill-creator rl c --name=reviewer --constraints="Read only,Never delete"
  skill-creator role list              # List all roles
  skill-creator rl l --pretty          # Human-readable list
  skill-creator bundle create          # Interactive bundle creation
  skill-creator bd c --name=frontend --skills=ts,react
  skill-creator bundle list            # List all bundles
  skill-creator bundle activate --name=frontend  # Activate bundle
  skill-creator bundle deactivate      # Deactivate bundle
  skill-creator bundle status          # Show active bundle
  skill-creator compress-research .planning/phases/58-research-compression/58-RESEARCH.md
  skill-creator cr path/to/research.md --dry-run
  skill-creator cr path/to/research.md --project

Skill Storage:
  User-level skills: ~/.claude/skills/ (shared across projects)
  Project-level skills: .claude/skills/ (project-specific, takes precedence)

  Skills are git-tracked by default. Each skill is a SKILL.md file
  with YAML frontmatter inside a named subdirectory.

Pattern Storage:
  Session observations are stored in .planning/patterns/sessions.jsonl.
  Suggestions are stored in .planning/patterns/suggestions.json.
  Feedback is stored in .planning/patterns/feedback.jsonl.
`);
}
