# Gastown Origin: GUPP Propulsion

## Where This Comes From

The GUPP (Gas Town Universal Propulsion Principle) originates from Gastown's approach to autonomous agent execution. In the original Go codebase, GUPP is not a single function or module but a behavioral principle injected into every agent through role templates (`internal/templates/roles/*.md.tmpl`). The polecat template (`polecat.md.tmpl`) contains the canonical statement:

> Work is on your hook. After announcing your role, begin IMMEDIATELY. This is physics, not politeness. Gas Town is a steam engine -- you are a piston. Every moment you wait is a moment the engine stalls.

This text is injected into every polecat session via `gt prime --hook`, which loads the role template, substitutes the assigned bead ID, and pushes the result into the agent's context window. The agent reads the template as its first instruction and (ideally) begins work without delay.

## The Problem GUPP Solves

LLM coding assistants are trained through reinforcement learning from human feedback (RLHF) to be helpful, harmless, and honest. This training optimizes for interactive conversation: ask clarifying questions, seek confirmation before destructive actions, present options and let the user choose. These are excellent behaviors for a chat assistant but catastrophic for an autonomous worker in a pipeline.

Gastown observed the failure mode repeatedly during early convoy runs:

1. Mayor dispatches bead to polecat via `gt sling`
2. Polecat starts, reads its hook, finds the work item
3. Polecat introduces itself: "I am polecat-alpha, assigned to bead-a1b2c"
4. Polecat summarizes the task: "The work involves implementing auth middleware..."
5. Polecat asks: "Shall I proceed?"
6. **Nobody answers.** The polecat is autonomous. There is no user in its session.
7. Polecat waits. Pipeline stalls. Deacon detects the stall minutes later.

The trained assistant behavior -- "summarize your understanding and confirm before acting" -- is exactly wrong for an agent whose entire purpose is to execute assigned work without supervision. GUPP was created to override this default behavior explicitly and forcefully.

## Chipset Mapping: Interrupt Controller

In the chipset hardware metaphor, GUPP is the **interrupt controller** (APIC/PIC equivalent). A real interrupt controller converts external events into CPU interrupts, forcing the processor to handle them immediately instead of polling each device in a loop.

| Hardware Component | GUPP Function |
|-------------------|---------------|
| Interrupt Request (IRQ) line | Bead placed on agent's hook |
| Interrupt controller | GUPP enforcement mechanism (hook injection, preamble, polling) |
| Interrupt Service Routine (ISR) | Agent's execution of the assigned bead |
| Non-Maskable Interrupt (NMI) | GUPP mandate: hook work cannot be deferred or ignored |
| Interrupt priority levels | Work item priority (P1 > P2 > P3) |
| Spurious interrupt handling | False stall detection (agent is working but updates are slow) |

Without GUPP, agents operate in a polled model: they check for work periodically and may idle between checks. With GUPP, the hook assignment is an interrupt that demands immediate handling. The agent cannot mask it, cannot defer it, cannot queue it behind "let me summarize first." It must execute.

## Key Gastown Source Files

| File | What It Provides to GUPP |
|------|-------------------------|
| `internal/templates/roles/polecat.md.tmpl` | The canonical GUPP injection text ("This is physics, not politeness") |
| `internal/templates/roles/mayor.md.tmpl` | Mayor's version: "You are the scheduler. Dispatch immediately." |
| `internal/cmd/prime.go` | `gt prime --hook` command that injects role templates into agent context |
| `internal/cmd/sling.go` | Sets hooks and triggers GUPP activation for dispatched beads |
| `internal/deacon/deacon.go` | Deacon heartbeat loop that monitors GUPP compliance |
| `internal/deacon/heartbeat.go` | Heartbeat timer and stall detection logic |
| `internal/runtime/runtime.go` | Runtime detection that selects GUPP enforcement strategy |

## The Deacon

The Deacon is Gastown's heartbeat supervisor. In the original Go codebase, the Deacon runs as a goroutine loop in the mayor's process, checking each active polecat's last activity timestamp at a fixed interval. When a polecat stalls (no activity for longer than the threshold), the Deacon sends a nudge. If the nudge does not resolve the stall, the Deacon escalates to the mayor for a restart decision.

The Deacon maps to a hardware watchdog timer. In real embedded systems, the watchdog timer resets the processor if the main loop fails to "pet the dog" (write to a register) within a timeout window. The Deacon works identically: each agent must update its activity timestamp within the stall threshold, or the Deacon triggers recovery.

The name "Deacon" comes from the Gastown narrative (the mayor's assistant/enforcer), not from any technical meaning.

## What Changed From Gastown

1. **Template injection becomes skill activation:** In Gastown, GUPP rules are injected via `gt prime` templates. In the chipset, they are encoded in the gupp-propulsion skill, which activates based on context triggers.

2. **Per-runtime strategy:** Gastown assumes all agents run in tmux sessions managed by the Go binary. The chipset must handle Claude Code (hooks), Codex (startup fallback), Gemini (polling), and unknown runtimes. The Runtime HAL mediates this.

3. **Deacon becomes heartbeat.md:** The Go Deacon goroutine becomes a documented supervision pattern that the witness-observer implements. The pattern is the same; the implementation substrate changes from goroutines to filesystem polling.

4. **Metrics for learning:** Gastown does not track GUPP effectiveness. The chipset skill exposes observable metrics (response time, nudge effectiveness, strategy success rate, stall frequency) so that skill-creator can learn and propose threshold refinements.

5. **Advisory boundary:** In Gastown, GUPP is absolute -- the polecat has no choice but to execute. In the chipset, GUPP is advisory within GSD's structured workflow. The GSD orchestrator's phase gates take precedence. This is a deliberate concession: GSD provides the structural correctness guarantees that Gastown's raw GUPP does not.

6. **Human escalation:** Gastown's Deacon can restart agents indefinitely. The chipset adds a 3-restart limit per bead with mandatory human escalation. This prevents infinite restart loops when the problem is not agent passivity but genuinely blocked work.

## The Physics Metaphor

The "physics, not politeness" framing is deliberate. Gastown's documentation consistently uses physical metaphors (steam engine, pistons, propulsion) to communicate that GUPP is not a suggestion or a best practice. It is a constraint -- like gravity, it applies whether or not the agent acknowledges it.

This framing helps when injecting GUPP into agent context. LLMs respond well to constraints framed as physical laws ("you cannot violate this") versus social norms ("you should do this"). The propulsion metaphor reinforces that idle agents are not merely inefficient; they are physically preventing the pipeline from moving forward, like a jammed piston in a steam engine.
