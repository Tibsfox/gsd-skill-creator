# Immediacy — Cache-Optimized Activation

**Principle:** Immediate experience is, in many ways, the most important touchstone of value in our culture. We seek to overcome barriers that stand between us and a recognition of our inner selves, the reality of those around us, participation in society, and contact with a natural world exceeding human powers. No idea can substitute for this experience.
**GSD Guideline:** Cache-Optimized Activation
**Domain:** virtual-brc/principles
**Safety Classification:** RECOMMENDED

## Pattern

When a Roosevelt elk steps into a meadow at dawn, the grass does not make it wait.
There is no loading screen between the elk's arrival and the meadow's availability.
The dew is already there. The nutrients are already in the soil. The photosynthetic
machinery is already running. Nature operates at the speed of presence — and so
must the virtual playa.

Immediacy in the GSD skill system translates to Cache-Optimized Activation: zero-lag
skill lookup with a 5-minute cache TTL and no bureaucratic wait states between a
rig's intent and a skill's activation. When a rig requests a skill, the system
resolves it from the hot cache in constant time. If the cache has expired, the
system refreshes from the registry and serves the result in the same request cycle
— there is no "please wait while we prepare your experience" interstitial.

The 5-minute TTL is a deliberate design choice. It is short enough that skill
updates propagate quickly across the playa (a deprecated skill disappears within
5 minutes, supporting LNT), but long enough that repeated lookups during a single
execution session never hit the registry twice. The cache is not an optimization
bolt-on — it is the primary access path. The registry is the source of truth; the
cache is the source of speed. Both are architectural first-class citizens.

Bureaucratic wait states are the antithesis of immediacy. Any system pathway that
requires a rig to wait for approval, queue for resources, or poll for readiness
before executing a skill is a violation of this principle. The only acceptable
delays are physical: network latency, cache refresh, and safety validation. Human
approval loops, manual review queues, and "pending" states are forbidden in the
hot path.

## Testable Behaviors

1. Skill lookup from hot cache completes in constant time (O(1)) with no registry round-trip.
2. Cache TTL is exactly 5 minutes; entries older than 5 minutes are refreshed on next access.
3. A cache miss triggers a synchronous registry fetch that completes within the same request cycle — no async callback or polling required.
4. No skill activation pathway includes a human approval step, manual review queue, or "pending" state in the hot path.
5. Cache refresh after TTL expiry does not block concurrent skill lookups — stale-while-revalidate semantics apply.

## Dependencies

- `participation` — Execution-first model requires immediate activation to be meaningful
- `leaving-no-trace` — 5-minute TTL ensures deprecated skills vanish from cache promptly
- `radical-inclusion` — Immediate access for all rigs means no rig waits longer than any other

## PNW Metaphor

Like the morning fog that delivers moisture to every surface simultaneously — no
tree waits in line, no fern submits a request — the cache layer saturates the
playa with skill availability at the speed of presence. The elk does not queue
for the meadow. The rig does not queue for the skill.
