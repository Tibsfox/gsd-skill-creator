# Sandbox Runtime Investigation

**Task:** w-gt-005 | **Author:** Sam (exploration agent) | **Date:** 2026-03-04

---

## The Question

When the Wasteland handles commercial work — paid bounties, sensitive code, tasks
from unknown agent rigs — what sandbox runtime should wrap the execution?

The MVR schema already has the hooks: `sandbox_required`, `sandbox_scope`, and
`sandbox_min_tier` sit in the `wanted` table (Section 12.4 of the protocol spec
calls this "future work"). The types layer has `safety-violation` as a failure
class and `GateSpec` with `pre-execution` / `post-execution` checks. The
plumbing is ready. The question is: what goes in the pipe?

Here's a hypothesis: **no single runtime covers all tiers.** A trusted agent
doing docs work doesn't need the same fortress as an unknown agent touching
production credentials. So let's investigate the full spectrum.

---

## Category 1: MicroVM-Based

### Firecracker

The headliner. Built by AWS for Lambda and Fargate. Written in Rust, ~50k lines.

| Metric | Value |
|--------|-------|
| Startup time | 125-200ms cold start |
| Memory overhead | <5 MiB per VMM (not counting guest RAM) |
| Isolation | Hardware-enforced via KVM. Dedicated kernel per VM. |
| Device surface | 5 emulated devices (minimal attack surface) |
| Max density | Thousands of microVMs per host |
| Users | AWS Lambda, Fly.io, Koyeb, E2B |

**What's interesting:** Firecracker's <5 MiB overhead means we could spin up a
sandbox per *task*, not per *session*. A 64GB host could theoretically run
thousands of microVMs. The 125ms startup is fast enough for interactive agent
work — the agent wouldn't even notice the spinup.

**What if we tried** using Firecracker directly? The challenge is orchestration.
Firecracker gives you a VMM, not an orchestrator. You need to build (or adopt)
the layer that handles: root filesystem images, networking, volume mounts for
the sandbox_scope file spec, and lifecycle management. That's significant work.

### Cloud Hypervisor

Intel's alternative. Also Rust, also KVM-based. Chosen by Kata Containers as
a VMM option alongside Firecracker.

| Metric | Value |
|--------|-------|
| Startup time | Slightly slower than Firecracker (200-400ms range) |
| Memory overhead | Higher than Firecracker (~10-15 MiB) |
| Isolation | Same KVM-level isolation |
| Differentiator | Better runtime performance (CPU, disk, memory ops) |
| Users | Kata Containers, Intel ecosystem |

**Hypothesis:** Cloud Hypervisor optimizes for *sustained* workloads (better
throughput once running), while Firecracker optimizes for *ephemeral* workloads
(fastest startup, smallest footprint). For per-task sandboxes, Firecracker wins.
For long-running agent sessions, Cloud Hypervisor might edge ahead.

### QEMU MicroVMs

QEMU's `-machine microvm` mode strips QEMU down to a minimal device model.

| Metric | Value |
|--------|-------|
| Startup time | ~100-300ms in microvm mode |
| Memory overhead | Higher than Firecracker (~20-30 MiB) |
| Isolation | Full KVM isolation |
| Differentiator | Mature ecosystem, extensive device support |

**Verdict on QEMU:** The overhead is higher and the benefit over Firecracker is
minimal for our use case. QEMU microvm is best when you need exotic device
emulation, which we don't.

### MicroVM Summary

Firecracker is the clear choice for Tier 3 isolation. It's battle-tested at
Lambda scale, has the smallest footprint, and starts fast enough for per-task
use. Cloud Hypervisor is a reasonable alternative if we end up using Kata
Containers (which supports both VMMs).

---

## Category 2: Container-Based

### gVisor

Google's user-space kernel (the "Sentry"). Intercepts syscalls in Go and
reimplements a subset of Linux in user space.

| Metric | Value |
|--------|-------|
| Startup time | Near-instant (same as container startup) |
| Memory overhead | Low (~10-20 MiB for the Sentry process) |
| Isolation | Syscall-level (Sentry + seccomp). Not hardware isolation. |
| Syscall coverage | ~70-80% of Linux syscalls |
| I/O penalty | 10-30% overhead on I/O-heavy workloads |
| Users | Google Cloud Run, Modal (for their sandbox product) |

**That's interesting because** gVisor slots perfectly between "just a container"
and "full VM." The developer experience is excellent — it's an OCI runtime, so
you use standard Docker/Podman commands. The gotcha is syscall coverage: some
advanced operations (eBPF, certain ioctls) fail.

**Quick experiment:** Does typical agent work (git operations, file I/O, npm/pip
installs, code compilation) hit the 20-30% of unsupported syscalls? Hypothesis:
no. Standard dev toolchains should work fine. The gaps are mostly in kernel
module loading, advanced networking, and eBPF — none of which agents need.

### Kata Containers

Wraps containers in lightweight VMs. An orchestration layer that integrates with
Kubernetes and supports multiple VMMs (Firecracker, Cloud Hypervisor, QEMU).

| Metric | Value |
|--------|-------|
| Startup time | 200-500ms (VM spinup + agent initialization) |
| Memory overhead | 30-50 MiB per container (guest kernel + kata-agent) |
| Isolation | Hardware-level (KVM). Equivalent to microVM. |
| Compatibility | ~100% Linux application compatibility |
| Users | Ant Group, Red Hat OpenShift, OpenStack |

**Kata is interesting for a different reason:** it gives us Firecracker-level
isolation with a container-native API. If we're already using containers for
agent deployment, Kata is "just change the runtime" — same Dockerfile, same
Kubernetes YAML, but hardware isolation. The overhead (30-50 MiB) is acceptable
for Tier 2/3 work.

**Recent development:** The Kata Containers project is actively integrating with
agent sandbox frameworks, recognizing that AI agent isolation is a growth use
case for the technology.

### Podman Rootless

Standard OCI containers but without root privileges. Uses user namespaces.

| Metric | Value |
|--------|-------|
| Startup time | Instant (same as Docker) |
| Isolation | Namespace/cgroup isolation. Kernel shared with host. |
| Overhead | Minimal |
| Escape risk | Moderate — kernel exploits can escape |

**Verdict:** Rootless Podman is fine for Tier 1 (trusted agents, low-risk).
It's not sufficient isolation for untrusted agents since a kernel exploit
could escape the namespace boundary. Good baseline, not a fortress.

---

## Category 3: WASM-Based

### Wasmtime

The Bytecode Alliance reference runtime. Cranelift JIT, WASI support,
capability-based security.

| Metric | Value |
|--------|-------|
| Startup time | <1ms for module instantiation |
| Memory overhead | Very low (~1-2 MiB per instance) |
| Isolation | Language-level (linear memory, capability model) |
| Security model | Deny-by-default. Must explicitly grant file/network access. |
| Language support | Rust, C/C++, Go, AssemblyScript (compiles to WASM) |
| LTS | v36.0.0 is LTS through August 2027 |

**The capability model is fascinating.** WASI implements a capability-based
filesystem: modules can only access directories they've been explicitly granted
handles to. This maps perfectly to `sandbox_scope` — we could translate the
JSON file mount/exclude spec directly into WASI capabilities.

**But here's the problem:** agent work typically needs a full Linux userland.
Git, npm, pip, cargo, language runtimes — these don't compile to WASM (yet).
WASM is perfect for isolated computation (run this function, process this data)
but impractical for "run this development workflow."

### WasmEdge

Lighter-weight WASM runtime targeting edge/IoT scenarios.

| Metric | Value |
|--------|-------|
| Startup time | Sub-millisecond |
| Memory overhead | ~1-3 MiB |
| Differentiator | AI/ML inference support, lighter than Wasmtime |
| Concern | CVE-2025-69261 memory bounds-check vulnerability (fixed) |

**Same tradeoff as Wasmtime.** Excellent isolation density but limited to WASM
workloads. Not suitable for general agent work.

### Spin (Fermyon)

Framework built on Wasmtime for building serverless-style WASM applications.

**Verdict:** Spin is a deployment framework, not a sandbox primitive. It could
be relevant if we wanted agents to produce WASM components, but that's a
different conversation.

### WASM Summary

WASM runtimes have the best density (sub-ms startup, 1-2 MiB overhead) and the
most elegant security model (capability-based, deny-by-default). But they can't
run general dev toolchains. **Hypothesis for the future:** as WASI matures and
more tools compile to WASM, this becomes increasingly viable. For now, WASM is
best suited for specific isolated computations within a broader sandbox —
"sandbox within a sandbox."

---

## Category 4: Language-Level

### Deno Permissions

Deno's permission model is the most mature language-level sandbox.

| Metric | Value |
|--------|-------|
| Granularity | File read/write, network, env vars, subprocess, FFI |
| Default | Deny-all (must explicitly grant each permission) |
| Config | Declarative in `deno.json` (since v2.5) |
| New in 2025 | Permission broker — external process manages permission requests |
| New in 2025 | `--allow-import` flag for controlled dependency loading |

**What if we tried** Deno for Tier 1? For TypeScript/JavaScript agent work,
Deno's permission model is surprisingly complete. An agent doing frontend work,
writing docs, or running tests could operate under strict Deno permissions with
minimal friction.

**The experiment:** Deno + `--deny-net` + `--allow-read=./src` +
`--allow-write=./output` gives us a decent sandbox for TS/JS tasks. No network
access, restricted filesystem. The permission broker feature could even let us
implement dynamic approval flows — the agent requests permission, a gate
decides.

### Node.js --experimental-permission

Node's answer to Deno's model, still experimental.

| Metric | Value |
|--------|-------|
| Coverage | File system, child_process, worker_threads, native addons |
| Status | Experimental (since v20, still flagged in v22+) |
| Maturity | Much less mature than Deno's model |

**Verdict:** Not production-ready for sandbox use. The experimental flag means
the API surface could change. If we're in the Node ecosystem, use it as defense
in depth alongside a container, not as primary isolation.

### Language-Level Summary

Deno is genuinely useful for Tier 1 with TypeScript workloads. It's not
"security theater" — the permission model is real and well-tested. But it only
covers one language, and a determined attacker with code execution can likely
find escapes. It's a fence, not a wall.

---

## Category 5: Cloud Sandbox Services

This is where it gets interesting. These services wrap microVMs or containers
behind an API, handling all the orchestration we'd otherwise build ourselves.

### E2B

Open-source, Firecracker-based sandbox API.

| Metric | Value |
|--------|-------|
| Isolation | Firecracker microVMs |
| Startup | <200ms (warm pool eliminates cold starts) |
| Session duration | Up to 24 hours |
| Languages | Any language that runs on Linux |
| SDK | Python and TypeScript |
| Pricing | ~$0.05/hour per 1 vCPU sandbox, billed per second |
| Deployment | Cloud (managed), BYOC, on-prem, self-hosted |
| Integrations | OpenAI, Anthropic, LangChain, CrewAI, Vercel AI SDK |

**This is compelling.** E2B has already solved the hard problems: orchestration,
filesystem mounting, networking, lifecycle management, and they did it on
Firecracker. Their SDK would let us spin up sandboxes per-task with a few API
calls.

**Cost model for Wasteland:** A medium-effort task takes ~30 minutes of agent
work. At $0.05/hour, that's ~$0.025 per task execution. For 100 tasks/day,
that's $2.50/day in sandbox costs. Trivial compared to LLM API costs.

### Modal

Python-focused cloud compute platform with gVisor-based sandboxes.

| Metric | Value |
|--------|-------|
| Isolation | gVisor (user-space kernel) |
| Startup | Fast container starts |
| Default sandbox lifetime | 5 minutes (configurable to 24h) |
| Network | Deny-by-default for inbound connections |
| Pricing | Per-second billing, CPU/GPU pricing |
| Strength | Integrated with broader compute platform (GPUs, etc.) |

**Modal fits a different shape.** It's a compute platform that happens to have
sandboxes, not a sandbox service. Better if agents need GPU access or heavy
compute alongside isolation.

### Daytona

Pivoted from dev environments to AI code execution in Feb 2025.

| Metric | Value |
|--------|-------|
| Isolation | Docker containers (default), Kata/Sysbox (configurable) |
| Startup | Sub-90ms cold start with warm pools |
| Lifecycle | Auto-stop, auto-archive, auto-delete |
| Snapshot | Snapshot-based reuse for repeated sandbox creation |
| SDK | Python and TypeScript |

**Fastest cold starts in the category.** Daytona's lifecycle automation
(auto-stop after inactivity, auto-archive, auto-delete) maps well to the
Wasteland's task lifecycle: sandbox spins up when a task is claimed, auto-stops
when the agent goes idle, auto-deletes after validation.

**But:** default isolation is standard Docker, which is Tier 1 at best. You'd
need to configure Kata Containers for Tier 2/3, which adds complexity.

### Runloop

Developer sandbox focused on AI coding agents.

| Metric | Value |
|--------|-------|
| Focus | Full dev environments for AI agents |
| Differentiator | Pre-built devboxes with common toolchains |

Less data available compared to E2B and Daytona. Worth monitoring but not the
frontrunner.

---

## Evaluation Matrix

| Runtime | Isolation Strength | Startup | Memory Overhead | DX | Cost Model | Maturity |
|---------|-------------------|---------|-----------------|-----|------------|----------|
| Firecracker (raw) | Excellent (KVM) | 125ms | <5 MiB | Hard (DIY orchestration) | Self-hosted | Excellent (AWS) |
| Cloud Hypervisor | Excellent (KVM) | 200-400ms | 10-15 MiB | Hard (DIY) | Self-hosted | Good (Intel) |
| gVisor | Good (syscall) | Instant | 10-20 MiB | Good (OCI runtime) | Self-hosted | Good (Google) |
| Kata Containers | Excellent (KVM) | 200-500ms | 30-50 MiB | Good (K8s native) | Self-hosted | Good (OpenInfra) |
| Podman rootless | Moderate (ns/cgroup) | Instant | Minimal | Excellent | Self-hosted | Excellent |
| Wasmtime | Good (capability) | <1ms | 1-2 MiB | Moderate | Self-hosted | Good (BA) |
| Deno permissions | Moderate (language) | Instant | None extra | Excellent | Free | Good |
| E2B | Excellent (Firecracker) | <200ms | Managed | Excellent (SDK) | ~$0.05/hr | Good |
| Modal | Good (gVisor) | Fast | Managed | Good (SDK) | Per-second | Good |
| Daytona | Configurable | <90ms | Managed | Good (SDK) | Per-second | Growing |

---

## Tier Recommendations

### Tier 1: Trusted Agents, Low-Risk Work

**Scenario:** Known agent rigs (trust_level >= 2), documentation, non-sensitive
code, community tasks. `sandbox_min_tier = "tier1"`.

**Recommendation: Deno permissions + rootless container**

- For TS/JS work: Deno with strict permission flags
- For general work: Rootless Podman/Docker with restricted mounts
- Why: Near-zero overhead, instant startup, sufficient for trusted code
- Escape risk: Moderate, but trust_level >= 2 means validated reputation
- Cost: Essentially free (self-hosted, no overhead)

**What this looks like in practice:**
```
sandbox_scope: {
  "mounts": ["./src", "./docs"],
  "exclude": [".env", "credentials/", ".git/config"],
  "network": "restricted"  // or "none" for docs work
}
```

### Tier 2: Unknown Agents, Medium-Risk Work

**Scenario:** New rigs (trust_level 1), medium-value bounties, code that touches
non-sensitive systems. `sandbox_min_tier = "tier2"`.

**Recommendation: E2B (managed) or gVisor (self-hosted)**

- **If managed:** E2B gives Firecracker isolation with zero orchestration work.
  SDK integrates easily. Cost is negligible at task-level billing.
- **If self-hosted:** gVisor as a container runtime. Drop-in replacement for
  runc, works with existing container workflows. Good isolation without VM
  overhead.
- Why: Real isolation boundary. Syscall or VM-level separation. An agent can't
  access host filesystem or network without explicit grants.
- Escape risk: Low (gVisor) to very low (E2B/Firecracker)

**The E2B experiment is the simplest path to try:**
```typescript
import { Sandbox } from 'e2b';

const sandbox = await Sandbox.create({
  template: 'wasteland-agent-base',
  metadata: { taskId: 'w-abc123', tier: 'tier2' }
});

// Mount only the files specified in sandbox_scope
await sandbox.filesystem.write('/workspace/task.json', taskSpec);

// Agent executes in isolation
const result = await sandbox.commands.run('agent execute');

await sandbox.close();
```

### Tier 3: Untrusted Agents, Commercial/Sensitive Work

**Scenario:** Unknown rigs, paid bounties with sensitive codebases, production
credentials in scope, proprietary code. `sandbox_min_tier = "tier3"`.

**Recommendation: Firecracker microVM (via E2B or Kata Containers)**

- **Managed path:** E2B with BYOC/on-prem deployment. Firecracker isolation,
  their orchestration, your infrastructure.
- **Self-hosted path:** Kata Containers with Firecracker VMM. Container API,
  VM isolation. Integrates with Kubernetes if we go that direction.
- Why: Hardware-enforced memory isolation. Dedicated kernel per sandbox. Minimal
  attack surface (5 devices). Even a kernel exploit in the guest can't escape
  to the host.
- Escape risk: Extremely low. Would require a KVM/hypervisor exploit.
- Network: Fully isolated or explicitly allowlisted endpoints only
- Filesystem: Read-only base image, ephemeral scratch space, no host mounts

**Additional Tier 3 controls:**
- Time-limited sessions (auto-terminate after max_duration)
- Egress filtering (allowlist specific domains/IPs)
- Audit logging of all filesystem and network operations
- Snapshot before/after for forensic comparison
- No access to credentials — inject via one-time-use tokens

---

## What About Hybrid Approaches?

**I wonder whether** a layered approach would be strongest:

```
Tier 3 execution:
  [Firecracker microVM]
    [gVisor container runtime inside VM]
      [Deno/Node with permission model]
        [WASM for specific computations]
```

That's probably overkill. But it illustrates that these aren't mutually
exclusive. A Firecracker VM can run gVisor inside it for defense in depth.

**The practical hybrid:** E2B (Firecracker) for the outer boundary, with Deno
permissions for inner language-level controls on TS/JS workloads. Two layers,
one API, straightforward to implement.

---

## Integration with MVR Schema

The `sandbox_scope` JSON field in the `wanted` table maps cleanly to sandbox
configuration:

```json
{
  "sandbox_scope": {
    "mounts": {
      "read": ["src/", "package.json", "tsconfig.json"],
      "write": ["output/", "dist/"]
    },
    "exclude": [".env*", "*.key", "credentials/"],
    "network": {
      "egress": ["registry.npmjs.org", "api.github.com"],
      "ingress": false
    },
    "resources": {
      "max_cpu": 2,
      "max_memory_mb": 512,
      "max_duration_seconds": 1800
    }
  }
}
```

The `sandbox_min_tier` field determines which runtime wraps the execution:

| `sandbox_min_tier` | Runtime | Isolation |
|--------------------|---------|-----------|
| `tier1` | Rootless container + language permissions | Namespace/language |
| `tier2` | gVisor or E2B sandbox | Syscall/microVM |
| `tier3` | Firecracker (E2B BYOC or Kata) | Hardware (KVM) |

The `GateSpec` types in `types.ts` already support `pre-execution` gates — a
sandbox tier check is a natural gate: "does this agent's trust_level meet the
task's sandbox_min_tier requirement?"

---

## Recommendation: Start with E2B

**Here's the hypothesis I'd test first:** E2B for Tier 2 and Tier 3, rootless
containers for Tier 1.

**Why E2B as the starting point:**
1. Firecracker isolation handles both Tier 2 and Tier 3 (same runtime, different
   configs)
2. SDK exists in TypeScript — matches our stack
3. Per-second billing means zero cost when agents aren't running
4. Open source — can self-host or BYOC when scale demands it
5. Already integrates with AI agent frameworks
6. <200ms startup means per-task sandboxing is practical

**What we'd build:**
- A `SandboxProvider` interface that abstracts the runtime
- An E2B implementation as the primary provider
- A rootless-container implementation for Tier 1
- A `pre-execution` gate that checks sandbox_min_tier
- sandbox_scope translation to sandbox filesystem/network config

**What we'd defer:**
- Self-hosted Firecracker (only if E2B costs become significant at scale)
- WASM sandboxes (wait for WASI ecosystem to mature)
- Kata Containers (only if we adopt Kubernetes for agent orchestration)

---

## Open Questions

1. **Filesystem snapshots:** Can we snapshot a sandbox mid-task for checkpointing?
   E2B supports this. Would enable "save and resume" for interrupted work.

2. **Warm pools:** Should we maintain pre-warmed sandboxes for common task types?
   Daytona does this well. E2B's managed service handles it automatically.

3. **Credential injection:** How do agents access secrets (API keys, tokens)
   needed for commercial work without those secrets persisting in the sandbox?
   One-time-use tokens with automatic rotation?

4. **Multi-sandbox tasks:** Some work needs multiple environments (frontend +
   backend + database). Orchestrating multiple sandboxes per task adds complexity.

5. **Cost at scale:** At 1000 tasks/day with 30-minute average runtime, E2B
   costs ~$25/day. Is that acceptable, or does self-hosted Firecracker make
   more sense at that volume?

---

## Sources

- [Firecracker microVM](https://firecracker-microvm.github.io/)
- [Firecracker vs Docker: The Technical Boundary](https://huggingface.co/blog/agentbox-master/firecracker-vs-docker-tech-boundary)
- [Firecracker vs gVisor comparison](https://northflank.com/blog/firecracker-vs-gvisor)
- [gVisor vs Kata vs Firecracker for AI Agents](https://dev.to/agentsphere/choosing-a-workspace-for-ai-agents-the-ultimate-showdown-between-gvisor-kata-and-firecracker-b10)
- [How to sandbox AI agents in 2026](https://northflank.com/blog/how-to-sandbox-ai-agents)
- [Kata Containers and Agent Sandbox Integration](https://katacontainers.io/blog/kata-containers-agent-sandbox-integration/)
- [E2B Documentation](https://e2b.dev/docs)
- [E2B Pricing](https://e2b.dev/pricing)
- [AI Code Sandbox Benchmark 2026](https://www.superagent.sh/blog/ai-code-sandbox-benchmark-2026)
- [Daytona vs Modal comparison](https://northflank.com/blog/daytona-vs-modal)
- [Best code execution sandbox for AI agents 2026](https://northflank.com/blog/best-code-execution-sandbox-for-ai-agents)
- [Top AI sandbox platforms ranked 2026](https://northflank.com/blog/top-ai-sandbox-platforms-for-code-execution)
- [10 Best Sandbox Runners 2026](https://betterstack.com/community/comparisons/best-sandbox-runners/)
- [Wasmtime Security](https://docs.wasmtime.dev/security.html)
- [Wasmtime vs Wasmer vs WasmEdge 2026](https://reintech.io/blog/wasmtime-vs-wasmer-vs-wasmedge-wasm-runtime-comparison-2026)
- [WASM Breach: Escaping WebAssembly Sandboxes](https://medium.com/@instatunnel/the-wasm-breach-escaping-backend-webassembly-sandboxes-05ad426051fc)
- [Deno Security and Permissions](https://docs.deno.com/runtime/fundamentals/security/)
- [Deno 2.5 Permission Sets](https://deno.com/blog/v2.5)
- [Node.js Permission Model](https://dev.to/andreasbergstrom/introducing-the-nodejs-permission-model-enhanced-security-and-granular-control-3md0)
- [Firecracker NSDI Paper](https://www.usenix.org/system/files/nsdi20-paper-agache.pdf)
- [Kata Containers vs Firecracker vs gVisor](https://northflank.com/blog/kata-containers-vs-firecracker-vs-gvisor)
