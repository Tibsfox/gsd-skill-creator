# GSD Command Routing -- Full Reference

Complete command routing tables. The condensed version is in SKILL.md. This file contains the full decision framework for all GSD and skill-creator actions.

## Starting Work

| User Intent | GSD Command | Rationale |
|-------------|-------------|-----------|
| "Build something new from scratch" | `/gsd:new-project` | Full initialization: questioning, research, requirements, roadmap |
| "Add major features to existing project" | `/gsd:new-milestone` | New milestone within existing project structure |
| "Continue where I left off" | `/gsd:progress` | See current state and route to next action |
| "What should I work on?" | `/gsd:progress` | Shows position in roadmap, suggests next step |

## Planning Work

| User Intent | GSD Command | Rationale |
|-------------|-------------|-----------|
| "I want to discuss how phase X should work" | `/gsd:discuss-phase N` | Capture vision before planning |
| "Plan the next phase" | `/gsd:plan-phase N` | Creates detailed, executable plans |
| "I need to research this domain" | `/gsd:research-phase N` | Deep ecosystem investigation |
| "What will Claude do for this phase?" | `/gsd:list-phase-assumptions N` | Preview approach before committing |

## Executing Work

| User Intent | GSD Command | Rationale |
|-------------|-------------|-----------|
| "Build phase X" | `/gsd:execute-phase N` | Runs plans with fresh context, atomic commits |
| "Quick fix / small task" | `/gsd:quick` | Lightweight path for ad-hoc work |
| "Something's broken" | `/gsd:debug` | Systematic debugging with persistent state |

## Validating Work

| User Intent | GSD Command | Rationale |
|-------------|-------------|-----------|
| "Did phase X actually work?" | `/gsd:verify-work N` | User acceptance testing |
| "Is the milestone complete?" | `/gsd:audit-milestone` | Comprehensive completion check |

## Managing Scope

| User Intent | GSD Command | Rationale |
|-------------|-------------|-----------|
| "I need to add a phase" | `/gsd:add-phase` | Append to roadmap |
| "Urgent work mid-milestone" | `/gsd:insert-phase` | Insert without renumbering |
| "Remove a planned phase" | `/gsd:remove-phase` | Clean removal with renumbering |
| "Capture this idea for later" | `/gsd:add-todo` | Park ideas without derailing current work |

## skill-creator Actions

| User Intent | Action | Rationale |
|-------------|--------|-----------|
| "What patterns have you noticed?" | `skill-creator suggest` | Review pending skill suggestions |
| "Create a skill from what we just did" | `skill-creator create` | Capture current workflow as reusable skill |
| "Show me my skills" | `skill-creator status` | Token budget, active skills, pending suggestions |
| "How are my skills performing?" | `skill-creator test` | Run activation simulation against history |
| Natural language workflow request | GSD Orchestrator routing | Classify intent, map to GSD command |
