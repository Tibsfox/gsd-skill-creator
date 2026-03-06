# Gastown Orchestration Chipset -- Glossary

Translation table mapping Gastown multi-agent orchestration terminology to GSD chipset architecture equivalents and their hardware analogies.

## Agent Roles

| Gastown Term | Chipset Equivalent | GSD Equivalent | Description |
|---|---|---|---|
| Mayor | Northbridge / Memory Controller Hub | GSD Orchestrator | Top-level coordinator. Routes work between rigs, manages global state, owns convoys. |
| Deacon | System Management Bus (SMBus) | Heartbeat / Health Monitor | Low-bandwidth supervisory daemon. Sends periodic "Do Your Job" signals to detect stalled agents. |
| Boot | BIOS/UEFI POST | Initialization Pipeline | Power-on self-test. Detects agent roles, validates environment, handles startup sequencing. |
| Witness | Performance Monitoring Unit (PMU) | Observability Agent | Passive observer. Monitors polecat health, detects stalls, reports metrics. Does not execute work. |
| Refinery | DMA Controller | Verify/Merge Pipeline | Sequential merge queue processor. Moves completed work (branches) to main without Mayor intervention. |
| Polecat | Arithmetic Logic Unit (ALU) | Execute-Phase Subagent | Ephemeral worker. Receives a single work item via hook, executes it, calls done, terminates. |
| Crew | General Purpose Register | Persistent Context Agent | Long-lived worker with a permanent workspace. Survives across operations unlike polecats. |

## Work Items and Dispatch

| Gastown Term | Chipset Equivalent | GSD Equivalent | Description |
|---|---|---|---|
| Bead | Instruction / Data Word | Work Item | The atomic unit of work. Has a lifecycle: open, hooked, in_progress, done, merged. |
| Hook | Interrupt Request (IRQ) Line | Work Assignment | Binds a bead to an agent. When work appears on a hook, the agent must act (GUPP). |
| Sling | Instruction Dispatch Unit | Work Router | Routes beads to available polecats through hooks. Supports single, batch, and formula modes. |
| Convoy | SIMD Batch | Work Group | Groups related beads for aggregate progress tracking. Created by the Mayor. |
| Formula | Microcode ROM Sequence | Workflow Template | TOML-defined multi-step workflow. Pre-compiled instruction sequence executed as one operation. |
| Done | Pipeline Retirement Stage | Completion Pipeline | Work termination: push branch, create merge request, destroy worktree, free agent. |
| Rig | PCIe Slot + Daughter Card | Project Workspace | Self-contained project container. Each rig has its own agents, git repo, and state directory. |

## Communication Channels

| Gastown Term | Chipset Equivalent | GSD Equivalent | Description |
|---|---|---|---|
| Mail | PCI Express (PCIe) | Filesystem Message Bus | Async durable messaging. Persisted to `state/mail/{recipient}/{timestamp}-{sender}.json`. |
| Nudge | System Management Interrupt (SMI) | Direct Agent Notification | Sync immediate ping. Lightweight, non-durable signal for GUPP enforcement and heartbeats. |
| Hook (as channel) | Memory-Mapped I/O (MMIO) | Skill Activation Trigger | Pull-based state register. Agents poll their hook file to discover new assignments. |
| Handoff | Bus Reset + DMA Transfer | Context Cycling | Full ownership transfer. Used when moving work between agents or sessions. |
| Seance | Debug Port (JTAG) | Historical Session Mining | Query a previous session's decisions and context. Diagnostic, not operational. |

## Concepts and Principles

| Gastown Term | Chipset Equivalent | GSD Equivalent | Description |
|---|---|---|---|
| GUPP | Non-Maskable Interrupt (NMI) Controller | Proactive Execution Enforcement | Gas Town Universal Propulsion Principle. "Physics over politeness" -- agents must act on hooked work immediately, overriding default assistant wait-for-input behavior. |
| "Physics over politeness" | Interrupt latency requirement | Autonomous execution mode | Design principle: AI agents should execute assigned work without waiting for permission, like hardware responding to interrupts. |
| Bead status lifecycle | Instruction pipeline stages | Work item state machine | `open` -> `hooked` -> `in_progress` -> `done` -> `merged`. Each transition is a pipeline stage advancement. |
| Hook status lifecycle | IRQ line states | Assignment state machine | `empty` -> `pending` -> `active` -> `completed`. Tracks whether an agent has work and its progress. |
| Token budget weight | Power budget allocation | Context window partition | Fractional allocation of the chipset's token budget (default 10k). All weights must sum to 1.0 or less. |
| Evaluation gate | Power-On Self-Test (POST) check | Pre-deploy quality gate | Validation check that must pass before agents begin work. Actions: block, warn, or log. |
| Runtime HAL | Hardware Abstraction Layer | Cross-platform adapter | Abstraction over AI runtimes (Claude Code, Codex, Gemini). Each runtime exposes different capabilities. |

## State Directory Mapping

| Gastown Location | Chipset Location | Contents |
|---|---|---|
| `.beads/` (in git) | `state/work/` | Work item JSON files |
| Agent identity beads | `state/agents/` | Agent identity JSON files |
| Hook state in beads | `state/hooks/` | GUPP hook state per agent |
| Mail messages | `state/mail/` | Async durable messages |
| Nudge signals | `state/nudge/` | Sync immediate pings |
| Merge queue | `state/merge-queue/` | Refinery merge request files |
| Convoy tracking | `state/convoys/` | Batch progress JSON files |

## Chipset Architecture Mapping Summary

```
Gastown               Chipset             Function
--------              --------            --------
Mayor          -->    Northbridge         Coordination, routing
Witness        -->    PMU                 Monitoring, metrics
Refinery       -->    DMA Controller      Data movement (merge)
Polecat        -->    ALU                 Computation (execution)
Crew           -->    GPR                 Persistent state
Bead           -->    Instruction         Work unit
Hook           -->    IRQ Line            Assignment trigger
Sling          -->    Dispatch Unit       Work routing
GUPP           -->    NMI Controller      Forced execution
Mail           -->    PCIe                Async durable bus
Nudge          -->    SMI                 Sync immediate bus
Formula        -->    Microcode           Workflow template
Rig            -->    PCIe Slot           Project container
```
