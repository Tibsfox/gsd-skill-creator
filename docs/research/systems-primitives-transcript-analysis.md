# Systems Primitives: Transcript Analysis
**6 Lectures — Distributed Consensus, Cryptography, Zero-Knowledge Proofs, Compiler Infrastructure**
*Analyzed 2026-04-04 — Artemis II Mission*

---

## Overview

These six lectures form the theoretical substrate beneath everything built in this codebase. The Rosetta connections are not incidental — each lecture directly maps to infrastructure decisions already made:

| Lecture | Core Insight | Our Artifact |
|---------|-------------|--------------|
| Raft | Leader-based deterministic merge queue | Gastown refinery-merge |
| Paxos | Two-phase quorum, competing proposers | Gastown correctness baseline |
| BFT | 3m+1 bound, oral messages | trust-relationship.ts |
| ECC | Group operations mod prime, key-size efficiency | MCPS/AIP Ed25519 harness |
| ZK Proofs (IOP) | IOP→SNARK compiler, post-quantum transparency | GUPP propulsion model |
| LLVM Optimizer | Middle-end pipeline, canonical IR, pass composition | src-tauri / TypeScript pipeline |

---

## 1. Raft Consensus Algorithm
**Speaker:** John Ousterhout (Stanford) — "Designing for Understandability: The Raft Consensus Algorithm"

### Key Claims

1. **Understandability is a first-class design criterion.** Algorithms must be evaluable not just on correctness and efficiency but on how easily they can be grasped, explained, and safely implemented. Academia typically rewards complexity, not clarity.
2. **Paxos is so hard to understand that it prevented real adoption.** After 25+ years, virtually no one had successfully implemented Paxos from scratch — Ousterhout himself couldn't understand it until after he designed Raft.
3. **Raft decomposes consensus into three separable sub-problems:** leader election, normal log replication, and safety under leader crashes. This asymmetric decomposition (one dictatorial leader + followers) is the fundamental simplification.
4. **Randomized timeouts solve leader election more simply than ranked priority.** Proposal number ranking (Paxos-style) led to complex edge cases. A random timeout in the range 150–300ms produces a leader almost always within one cycle.
5. **Terms are Raft's mechanism for detecting stale information.** Each term starts with an election. Servers instantly step down to follower if they see a higher term, creating a monotonically advancing global epoch without a shared clock.
6. **Safety is guaranteed by two invariants:** (a) only one leader per term via majority voting, (b) only machines with up-to-date logs can be elected (log completeness check on votes).
7. **Students scored ~25% higher on Raft tests vs. Paxos tests** in a controlled user study; linear regression shows expected score is 2x higher on Raft if you factor out prior Paxos experience. Learning Paxos first made students worse at understanding both algorithms.

### Technical Details

**Server States:** Three states only — `Leader`, `Follower`, `Candidate`.

**Two RPCs only:**
- `RequestVote` — sent by candidates to gather votes
- `AppendEntries` — sent by leader to replicate log entries; also serves as heartbeat (empty entries)

**Term mechanism:** Logical clock. Each server tracks `currentTerm`. Any server seeing a higher term elsewhere instantly reverts to Follower. RPCs with stale terms are rejected outright.

**Leader Election Protocol:**
1. Follower timeout fires (random 150–300ms interval)
2. Increment `currentTerm`, vote for self, broadcast `RequestVote`
3. Outcome: (a) majority votes → become Leader, (b) heartbeat from other Leader → become Follower, (c) split vote → timeout and retry with next term

**Log Replication (Normal Operation):**
1. Client sends command to Leader
2. Leader appends to own log (dotted = uncommitted)
3. Leader sends `AppendEntries` to all Followers
4. Once majority acknowledge → entry committed (solid)
5. Leader executes in state machine, returns result to client
6. Leader notifies Followers to execute on next heartbeat

**Safety — Leader Completeness:**
- Vote request includes `(lastLogTerm, lastLogIndex)`
- Voter rejects if own log is more complete (higher lastLogTerm, or same term + longer log)
- Guarantees elected leader always holds all committed entries

**Log Consistency Fix:**
- Leader maintains `nextIndex[]` per follower
- On conflict: backs up `nextIndex`, retransmits from divergence point
- Followers always overwrite their log with the leader's

**Cluster Operations:**
- Works as long as majority alive
- 5-node cluster tolerates 2 failures
- Pipelines allowed: batch from clients while replicating others

### Numbers

- Timeout range: **150–300 ms** (elections almost always complete in one cycle)
- Raft user study: **25% better** on average; **2x better** controlling for prior Paxos experience
- Pre-publication implementations: **25+**; now **~100** on Raft homepage
- Mechanically verified: **50,000 lines** of code at University of Washington
- Cluster majority: **⌊N/2⌋ + 1** nodes must be alive

### Key Quotes

> "Algorithms need to be understandable because typically it's hard to get benefit from an algorithm unless it's actually implemented. And the process of implementing an algorithm always changes it."

> "It was finally — I had to basically build a new consensus algorithm to figure out how Paxos worked. … Learning Paxos, trying to learn Paxos, gets you so confused you can't understand any consensus algorithm."

---

## 2. Paxos Lecture
**Speaker:** John Ousterhout (Stanford) — "Paxos Lecture (Raft user study)"

### Key Claims

1. **Paxos was invented by Leslie Lamport in the late 1980s and is the de facto standard for consensus** — taught universally, used as the basis for nearly all production consensus implementations.
2. **The fundamental goal is a replicated log:** all servers receive the same commands in the same order, enabling deterministic replicated state machines that survive individual server failures.
3. **Basic Paxos solves only single-value consensus** — agreeing once on one value for the lifetime of the system. Building a replicated log requires Multi-Paxos, which is much less rigorously specified.
4. **The two-phase protocol (Prepare + Accept) is necessary** to prevent two simultaneous proposers from choosing conflicting values. Proposal numbers create a strict ordering that allows newer proposals to cut off older ones.
5. **Basic Paxos is safe but not live.** Competing proposers can indefinitely stymie each other by successively cutting off each other's Accept phases. A leader (or randomized backoff) is required for liveness.
6. **Multi-Paxos is underspecified in the literature.** Many implementation choices are left open, no two descriptions agree, and no implementation fully matches any published description.
7. **Proposal numbers must be durable:** stored on disk/flash to survive crashes, preventing accidental reuse of a proposal number after restart.

### Technical Details

**Basic Paxos Roles:**
- `Proposer` — drives the protocol, chooses values
- `Acceptor` — votes on proposals, stores stable state
- `Learner` — reads chosen values (often same nodes)

**Proposal Number Generation:**
- Format: `(roundNumber << serverIDBits) | serverID`
- `maxRound` variable: largest round seen, saved durably
- To generate new number: `maxRound++`, concatenate with server ID
- Guarantees globally unique, monotonically increasing numbers

**Phase 1 — Prepare:**
1. Proposer chooses proposal number `n`, sends `Prepare(n)` to all acceptors
2. Each acceptor: if `n > minProposal`, update `minProposal = n`, return `(acceptedProposal, acceptedValue)` if any
3. Proposer waits for majority responses
4. If any acceptor returned an accepted value: proposer adopts value with highest accepted proposal number
5. Else: proposer uses its own intended value

**Phase 2 — Accept:**
1. Proposer sends `Accept(n, value)` to all acceptors
2. Each acceptor: if `n >= minProposal`, accept — store `(acceptedProposal=n, acceptedValue=value)`; return `minProposal`
3. If returned `minProposal > n`: rejected — proposer must restart
4. If majority accept: value is chosen

**Stable State per Acceptor (must survive crashes):**
- `minProposal` — never accept below this
- `acceptedProposal` — proposal number last accepted
- `acceptedValue` — value of that proposal

**Three Cases for Competing Proposers:**
- Case 1: Earlier proposal already chosen → later proposer picks it up from prepare, uses same value — safe
- Case 2: Earlier proposal partially accepted → later proposer sees it, adopts it — safe
- Case 3: No prior acceptance visible → later proposer uses own value, cuts off earlier proposer — safe

**Multi-Paxos Optimizations:**
- Elect a single leader; only one proposer active → eliminates most prepare conflicts
- Leader can skip Phase 1 for all subsequent log entries after first successful round
- One round trip per client request in steady state
- Full replication: mechanisms to ensure all servers eventually get all entries

### Numbers

- Basic Paxos: **2 round-trip** RPCs minimum per value (Prepare + Accept)
- Multi-Paxos optimized: **1 round-trip** per entry (leader skips Prepare after establishing leadership)
- Acceptable message losses: algorithm survives arbitrary message loss as long as majority respond

### Key Quotes

> "Paxos has become perhaps the single most important algorithm in all of distributed systems."

> "Basic Paxos is not necessarily live — we can end up in a situation where a collection of proposers stymy each other and no value ever gets chosen."

---

## 3. Byzantine Fault Tolerance
**Speaker:** Unknown (Stanford-style lecture series) — "Byzantine Fault Tolerance"

### Key Claims

1. **Byzantine failures are everything that isn't fail-stop:** a node that sends conflicting messages to different peers rather than simply crashing. Sources range from hardware memory errors to malicious adversaries.
2. **The Two Generals Problem proves no perfect solution exists when the network itself is the adversary.** No finite message exchange can guarantee consensus if messages may be dropped — the last undelivered message always leaves one party uncommitted.
3. **The Byzantine Generals Problem (Lamport, Shostak, Pease, 1982) is the canonical formalization:** N generals must agree on an order; up to M are traitors who send conflicting messages.
4. **The fundamental impossibility result (the Lemma):** No solution exists if M/N ≥ 1/3. If one-third or more of nodes are traitors, consensus cannot be achieved.
5. **The Oral Messages (OM) algorithm tolerates up to M traitors** among 3M+1 or more generals using recursive message relay — but at exponential message cost.
6. **Message complexity makes BFT expensive in practice:** OM(0) = N messages; OM(1) = N² messages; OM(2) = N³; OM(M) = N^(M+1). Two traitors require at least 7 generals.
7. **Practical advice:** use someone else's solution, minimize N and M, use cryptography (signed messages reduce message complexity dramatically).

### Technical Details

**Failure Taxonomy:**
- `Fail-stop`: node stops responding — recoverable via restart or failover
- `Byzantine`: node sends conflicting messages — adversarial or corrupt behavior

**The Two Generals Problem:**
- Formal impossibility: for any finite message sequence, the last undelivered message leaves asymmetric commitment. No protocol solves it under unreliable channels.
- Practical workaround: statistical approach (send 100 couriers; if any one arrives, proceed) — works for probabilistic, non-adversarial packet loss.

**The Byzantine Generals Problem:**
- N generals, M traitors (M < N/3)
- Each general communicates their vote to all others
- Loyal generals must all agree on the majority value, regardless of traitor behavior
- Traitor's job: cause loyal generals to disagree (send different messages to different peers)

**Impossibility Proof Sketch:**
- Assume a solution S exists for N generals, M > N/3 traitors
- Show S can be used to solve the 3-general 1-traitor case (which is known impossible):
  - Each of 3 generals simulates 4 sub-generals, runs S on 12 total
  - Loyal simulations converge; traitor simulations can be ignored (M=4 < 12/3)
  - 3-generals read simulation results → contradiction
- Therefore no such S exists

**Oral Messages Algorithm — OM(M):**
- Base case OM(0): commander sends order; lieutenants follow it
- Recursive case OM(M > 0):
  1. Commander sends order to all lieutenants
  2. Each lieutenant relays to all others using OM(M-1)
  3. Each lieutenant takes majority value of received vector
- Works because: if commander is traitor, majority of 3M+1 - 1 = 3M loyal generals' relays dominate; if a lieutenant is traitor, its relays are a minority

**Adversarial Model Dimensions:**
- Network: fully connected vs. relay-dependent
- Adversary: static (pre-planned) vs. adaptive (reactive)
- Channel: bounded vs. unbounded latency
- Crypto: available vs. not available
- Compute: polynomial-time adversary assumed for crypto arguments

**With Cryptography (Signed Messages):**
- Signatures prevent traitors from forging orders
- Message complexity reduces from exponential to polynomial
- Enables practical BFT protocols (PBFT, Tendermint, HotStuff)

**Real-World Applications:**
- Bitcoin and blockchain: untrusted node set requires BFT-class consensus
- Boeing 777/787 fly-by-wire: flight control system uses BFT for hardware failure safety

### Numbers

- **3M+1** minimum nodes to tolerate M traitors (the fundamental bound)
- **7 generals** minimum to tolerate 2 traitors
- Message complexity: **N, N², N³, N^(M+1)** for OM(0), OM(1), OM(2), OM(M)
- Byzantine Generals Problem paper: published **1982** by Lamport, Shostak, Pease

### Key Quotes

> "There is no solution to the Byzantine Generals Problem if you have three generals and you assume there's one traitor."

> "If one-third of your generals are traitors — or more than a third — you're out of luck. There's no solution to this problem."

---

## 4. Cryptography Primer: Primes, Elliptic Curves, and Lattices
**Speaker:** Josh (Microsoft Research) — Session 4 of 6 in a cryptography lecture series

### Key Claims

1. **Large prime generation is practical using probabilistic primality testing via Fermat's Little Theorem:** x^P ≡ x (mod P) for prime P — virtually never produces false positives for large random numbers.
2. **Elliptic curves are not ellipses.** They are smooth algebraic curves y² = x³ + ax + b (Weierstrass form). The group operation is defined geometrically: draw a line through two points, take the third intersection, reflect over x-axis.
3. **Elliptic curve discrete log has no known sub-exponential algorithm**, unlike integer discrete log (index calculus attack). This means much smaller keys achieve equivalent security.
4. **256-bit ECC ≈ 2048-bit RSA/DH in security level.** Key size advantage is 8:1, critical for constrained devices.
5. **RSA over elliptic groups does not work** — the secret factorization trick doesn't translate. DSA (signatures) and Diffie-Hellman (key exchange) do work over elliptic groups.
6. **Lattice-based cryptography derives hardness from the Closest Vector Problem (CVP):** given a point in high-dimensional space and a skewed lattice basis, finding the nearest lattice point is hard. Private key = clean basis; public key = obfuscated basis.
7. **Special curves for ECC must be chosen carefully.** Many proposed fast special curves were later broken. The NIST curves are the current standard despite some trust concerns — don't roll your own.

### Technical Details

**Prime Number Theorem:** For N-bit integers, approximately 1-in-(N·ln2) are prime. For 1000-bit primes: ~1-in-700. Simple loop: pick random N-bit number, test, retry.

**Sieve optimization:** Pre-compute first 1000 primes; trial-divide candidates quickly. Skips ~70% of even numbers immediately. Warning: introduces slight distribution skew; use pure random test for highest-quality primes.

**Fermat Primality Test:**
- If P is prime: x^P ≡ x (mod P) for all x (Fermat's Little Theorem)
- Contrapositive: if x^P ≢ x (mod P), P is definitely composite
- False positives (Carmichael numbers) are astronomically rare in practice
- Run multiple times for confidence; industry runs it millions of times without a false positive

**Elliptic Curve Group — Formal Definition:**
- Curve: y² = x³ + ax + b over field (integers mod prime p > 3)
- Constraint: 4a³ + 27b² ≠ 0 (no cusps or self-intersections)
- Point addition P + Q: draw line through P, Q; third intersection R'; result = -R' (reflect over x-axis)
- Point doubling P + P: use tangent line at P; third intersection, reflect
- Identity element O (point at infinity): handles vertical lines P + (-P) = O
- Group order: number of points on curve mod p

**Group Operation Equations (key case — two distinct points P=(x1,y1), Q=(x2,y2)):**
- λ = (y2-y1)/(x2-x1) mod p
- x3 = λ² - x1 - x2 mod p
- y3 = λ(x1-x3) - y1 mod p

**ECDH Key Exchange (direct analog to integer DH):**
- Public parameters: curve E_p(a,b), generator point G of large prime order
- Alice: private key a, public key A = a·G
- Bob: private key b, public key B = b·G
- Shared secret: K = a·B = b·A = ab·G
- Attacker sees G, A, B — must solve ECDLP to recover a or b

**Why ECDLP is harder than integer DLP:**
- Integer DLP: index calculus (sub-exponential, ~O(exp(√(n·ln n)))) works
- ECDLP: no notion of "small" points; best known attacks are fully exponential O(√p)
- Security-equivalent key sizes: ECC-160 ≈ RSA-1024; ECC-256 ≈ RSA-2048

**Lattice Cryptography:**
- Lattice L(B): all integer linear combinations of basis vectors B = {v1, ..., vn}
- Same lattice has many bases — some easy (orthogonal), some hard (skewed, elongated)
- **Closest Vector Problem (CVP):** given arbitrary point w and basis B, find closest lattice point
- Easy with clean basis, hard with obfuscated basis
- Key generation: sample clean basis B_secret, transform to obfuscated B_public
- Encrypt: add small error to lattice point (LWE — Learning With Errors)
- Decrypt: clean basis finds nearest lattice point, recovers message
- Post-quantum secure: no quantum algorithm known to efficiently solve CVP

**Common Curves:**
- NIST P-256 (secp256r1) — most deployed, some trust concerns about parameter genesis
- Curve25519 / Ed25519 — preferred for new systems, cleaner design
- secp256k1 — Bitcoin's curve (not in NIST set)

### Numbers

- **1-in-700** attempts to find a 1000-bit prime
- **~2^900** thousand-bit primes exist (more than atoms in the universe ~2^250)
- **160-bit ECC** ≈ **1024-bit RSA** (now considered insufficient)
- **256-bit ECC** ≈ **2048-bit RSA** (current standard)
- 8:1 key size ratio advantage for ECC over RSA at equivalent security
- Sieve optimization (skipping evens): **~30% faster** prime generation (empirically observed at Microsoft)
- Quantum threat: Shor's algorithm solves ECDLP and integer factorization in polynomial time

### Key Quotes

> "There is no similar sub-exponential algorithm known for discrete logs in elliptic groups — therefore we can get away with smaller primes and still feel secure at least against best currently known attacks."

> "With lattices — you generate a key by picking a nice clean basis... you then transform your basis [to publish]. The public key is hard to use for finding nearest points; the secret key is easy."

---

## 5. IOP-Based Zero-Knowledge Proofs
**Speaker:** Alessandro Chiesa (UC Berkeley / Zcash Foundation) — "IOP-based Zero-Knowledge Proofs"

### Key Claims

1. **zkSNARKs are the right primitive for privacy-preserving and scalable peer-to-peer systems.** They are not going away — they are increasingly indispensable for blockchain and privacy infrastructure.
2. **Most deployed zkSNARKs rely on discrete log / pairing assumptions** — which are quantum-insecure. A quantum adversary running Shor's algorithm breaks them.
3. **The IOP (Interactive Oracle Proof) framework enables post-quantum SNARKs from symmetric-key cryptography alone** — specifically from cryptographic hash functions modeled as random oracles (SHA-3, BLAKE3, etc.).
4. **The Micali construction (1990s) is the original PCP-based SNARK**, but PCPs are "galactic" — asymptotically efficient but concretely expensive (provers take days on small computations).
5. **IOPs strictly generalize PCPs:** the verifier and prover interact over multiple rounds, each round contributing a new oracle (PCP). This larger design space enables constructions unreachable by PCPs alone.
6. **IOP-based SNARKs inherit all the nice properties:** post-quantum plausibility, transparent setup (no trusted trapdoor — just agree on a hash function), black-box use of lightweight crypto, public verifiability.
7. **Three years of IOP research produced dramatic asymptotic improvements:** zero-knowledge PCPs of quadratic size are achievable; linear-length IOPs with constant query complexity are achievable in 3 rounds — both are impossible for classical PCPs.

### Technical Details

**SNARK Formal Setup:**
- Public: function f, claimed output y, time bound T
- Private: witness x (prover's secret input)
- Prover's claim: f(x) = y in at most T steps
- SNARK properties:
  - **Succinctness:** proof size exponentially smaller than computation size; verification polynomial only in description of computation state, not computation size
  - **Knowledge soundness:** prover must "know" x — not just claim existence
  - **Zero-knowledge:** proof reveals nothing about x beyond the claim
  - **Public verifiability:** anyone can check published proof (critical for blockchains)

**PCP (Probabilistically Checkable Proof) Model:**
- Prover writes a very long proof string
- Verifier makes random local queries (a small constant number of positions)
- Verifier accepts/rejects based on queried values
- Key: proof is written before queries are chosen (temporal commitment)
- PCPs are "galactic" — provers take enormous time/space in practice

**Micali Construction (PCP → SNARK):**
1. Prover mentally computes the PCP oracle (a very long proof string)
2. Commits to it via a Merkle tree → sends root hash
3. Uses root hash + random oracle to derive verifier's query positions (Fiat-Shamir)
4. Sends: (root, query answers, Merkle authentication paths)
5. Verifier: checks authentication paths against root, recomputes queries from root, checks answers
- Crypto overhead: O(L) hash operations to build Merkle tree — negligible vs. PCP prover cost
- Proof size: O(Q · (log|Σ| + log(L) · |digest|)) where Q = queries, L = proof length, Σ = alphabet

**IOP (Interactive Oracle Proof) Model:**
- Generalization: multiple rounds, each round has a verifier challenge + prover oracle response (another PCP)
- Special case: PCP = IOP with 0 challenges and 1 oracle
- Verifier sends round challenges → prover responds with oracles → verifier does random local checks on all oracles at the end

**IOP → SNARK Compiler:**
1. Prover computes first oracle (PCP), commits via Merkle tree → root1
2. Hash chain: challenge = H(root1, session_id) → verifier's challenge
3. Prover computes next oracle, commits → root2; chain: H(root1 ‖ root2) → next challenge
4. Continue for all rounds
5. Final proof: all roots + requested query answers + authentication paths (all authenticated under the hash chain)
- Verifier: checks auth paths, recomputes hash chain to verify query derivation, checks answers

**Key Complexity Results (IOP vs. PCP):**
- **Zero-knowledge + quasi-linear size:** Impossible for classical PCPs (best ZK-PCP has quadratic size, best quasi-linear PCP has no ZK). IOPs achieve both with 2 rounds.
- **Linear length + constant query complexity:** Impossible for classical PCPs. IOPs achieve this in 3 rounds.
- IOP frontier techniques: interactive proof composition, univariate sumcheck, algebraic linking, out-of-domain sampling

**Quantum Resistance Argument:**
- Quantum algorithms excel at algebraic/cyclic structure (Shor for discrete log, factoring)
- Hash functions are "bit-twiddling" — no useful algebraic structure for quantum algorithms to exploit
- IOPs from hash functions = plausible post-quantum security (no proof, but no effective quantum attacks known)
- Contrast: pairing-based SNARKs (Groth16, PLONK) rely on elliptic curve pairings → quantum-vulnerable

**Transparency (No Trusted Setup):**
- Classical SNARKs require a trusted ceremony to generate CRS (Common Reference String) — leaking the trapdoor breaks soundness
- IOP-based SNARKs: system parameters = agreement on hash function + initialization vector. All public coin. No trapdoor to protect.

**Notable Constructions using IOP framework:**
- STARKs (Transparent ARguments of Knowledge) — no trusted setup, post-quantum plausible
- FRI (Fast Reed-Solomon IOP of Proximity) — efficient low-degree testing
- Aurora, Fractal, Ligero — various efficiency-security tradeoffs

### Numbers

- SNARK argument size: **exponentially smaller** than computation size; verification time polynomial in **description of state** only
- China national quantum program: **~$10 billion**; EU quantum flagship: **~€1 billion**
- NIST PQC standardization process: call opened **~April 2018** (already considered "late")
- IOP quadratic gap: ZK-PCPs have **quadratic** proof size; IOP achieves ZK + **quasi-linear** in 2 rounds
- IOP 3-round gap: IOPs achieve **linear proof length + constant query complexity**; impossible for PCPs

### Key Quotes

> "A single reliable PC can monitor the operation of a herd of supercomputers working with possibly extremely powerful but unreliable software and test hardware." — Foundational PCP vision (1990s), exactly the zkSNARK use case today.

> "All the discrete log-based constructions are insecure against quantum adversaries. If we're trying to build long-term infrastructure, it gets hairy — so you should really ask ourselves what our options are."

---

## 6. A Whirlwind Tour of the LLVM Optimizer
**Speaker:** Red Hat LLVM Team (EuroLLVM 2023) — "A Whirlwind Tour of the LLVM Optimizer"

### Key Claims

1. **The LLVM middle end is target-independent IR transformation.** Front ends (Clang for C/C++, rustc for Rust, Swift, Julia) lower to LLVM IR; the middle end optimizes IR; the back end generates machine code. The middle end's job is the same regardless of source language or target architecture.
2. **The optimizer is a pipeline of passes, not a monolithic system.** Passes are composable, ordered, and specialized. The same transform is sometimes implemented in multiple passes to access different analyses.
3. **Canonicalization is the first principle of the middle end.** InstCombine and LICM produce a single canonical IR form — target-independent, analysis-friendly — so downstream passes see consistent input regardless of source.
4. **mem2reg / SROA is the most important single pass.** Front ends produce stack allocations for every local variable; SROA converts these to SSA values, making all subsequent analysis tractable.
5. **Function inlining is the central optimization for interprocedural analysis.** The CGSCC (Call Graph Strongly Connected Components) pipeline processes call graphs bottom-up, simplifying callees before inlining them into callers.
6. **Rust-specific optimizations are first-class in LLVM.** The speaker's team works on Rust integration including NRVO (Named Return Value Optimization) which Rust requires the optimizer to perform (unlike C++ which does it at the language level).
7. **Godbolt's LLVM pipeline view is the most practical debugging tool** — shows per-pass IR diffs, revealing exactly which pass is responsible for any transformation.

### Technical Details

**Compiler Three-Part Structure:**
- **Front End:** language-specific parsing, type checking, AST → LLVM IR (Clang, rustc, swiftc, etc.)
- **Middle End:** target-independent optimization passes on LLVM IR
- **Back End:** target-specific code generation (x86, ARM64, RISC-V, etc.)

**Key Middle-End Passes (in approximate pipeline order):**

**1. SROA (Scalar Replacement of Aggregates) / mem2reg:**
- Front ends emit `alloca` + `store` + `load` for all locals
- SROA: splits aggregate allocations into scalar parts if non-overlapping accesses
- Then mem2reg: converts stack loads/stores to SSA values (phi nodes)
- Result: much smaller, analysis-friendly IR
- Must run first — all subsequent analyses depend on SSA form

**2. SimplifyCFG (Control Flow Simplification):**
- "Kitchen sink" pass for all control-flow transforms
- Examples: hoist common code from if/else branches, convert conditional branches to `select` instructions (speculation), convert switch statements to lookup tables
- Target-dependent: uses TTI (Target Transform Info) for cost modeling of speculation
- Runs multiple times at different pipeline positions with different option flags

**3. InstCombine (Instruction Combining / Peephole):**
- "Dumping ground" for all transforms that don't change control flow
- Canonical form producer — must not be target-dependent; back end undoes bad canonicalizations
- Internal hierarchy:
  - **ConstantFolding:** constant operands → constant result (1+1=2)
  - **InstructionSimplify:** fold without creating new instructions (x+0=x, x-x=0)
  - **InstCombine:** creates or modifies instructions (mul×4 → shl 2)
- Runs many times; resolves pass-ordering issues by covering transforms cheaply
- AggressiveInstCombine: same purpose, runs once, for more expensive transforms

**4. LICM (Loop Invariant Code Motion):**
- Hoisting: moves invariant code to loop pre-header
- Sinking: moves loop-produced values only used after the loop to loop exit
- Scalar Promotion: load in pre-header, work on SSA value, store in exit
- Canonicalization pass — no cost modeling, no profiling dependency
- "Undo" passes: LoopSink (uses profiling to re-sink into cold blocks), MachineSync (target-specific)

**5. GVN (Global Value Numbering) / EarlyCSE:**
- Common Sub-Expression Elimination: replace duplicate computations with single result
- EarlyCSE: simple local pass using hash-based detection
- GVN: full non-local and partially redundant elimination using value numbering; also eliminates redundant loads via MemorySSA
- Partially redundant case: insert missing load in one branch to eliminate load after join point

**6. Loop Transforms:**
- Induction Variable Simplification: uses ScalarEvolution analysis to track loop-evolving values; derives Gaussian summation formula for simple accumulator loops
- Loop Unrolling variants:
  - Full: known iteration count, small → straight-line code
  - Peeling: strip first N iterations (handles first-iteration constants)
  - Partial: large known count → unroll factor < count, retain back-edge
  - Runtime: unknown count → versioned unrolled + remainder scalar loop
- Runs with different config in simplification phase (only full + peeling) vs. optimization phase (partial + runtime)

**7. Vectorization:**
- Loop Vectorizer: uses VPlan to model vectorization cost without IR changes; inserts runtime memory alias checks; loop versioning for pointer aliasing
- SLP Vectorizer: vectorizes straight-line code (e.g., after full unroll); weaker — cannot insert runtime checks
- Cost-model driven: different targets have wildly different vector instruction costs

**8. Interprocedural Optimizations:**
- IPSCCP (Interprocedural Sparse Conditional Constant Propagation): propagates constants and value ranges across functions; runs very early (before information loss from CFG simplification)
- Function attribute inference: `nothrow`, `readonly`, `nonnull`, etc.
- Attributor: next-generation attribute inference, much more thorough — currently disabled by default (too slow)
- Function specialization: clones functions called with constant arguments

**CGSCC Inlining Pipeline:**
- Process call graph SCCs (cycles) bottom-up
- For each SCC: simplify → inline → simplify result → inline into callers
- Key: inline into already-simplified callees for accurate cost modeling
- If call graph has cycles (mutual recursion): pick any order within SCC, then continue bottom-up

**Rust-specific:**
- NRVO (Named Return Value Optimization): C++ does at language level; Rust requires optimizer
- MemCpyOpt performs it: detects function writing to temp + copy to final destination → rewrites to write directly to destination
- Rust integration is active work on the Red Hat team

**Correlated Value Propagation:**
- Uses LazyValueInfo to prove ranges (e.g., 0 ≤ x ≤ 10)
- Folds comparisons, converts signed division to unsigned, eliminates bounds checks
- Critical for safe languages with runtime bounds checking (Rust, Java)

**Pass Management:**
- `opt --passes=default<O3>` runs the full pipeline
- `--print-pipeline-passes` dumps pass list (hundreds of entries)
- Godbolt: native UI showing per-pass IR diffs — most valuable debugging tool
- `PassPipelines.cpp` source file: canonical pass ordering with comments

### Numbers

- LLVM front ends: Clang (C/C++), rustc, Swift, Julia, and **many others** using shared middle/back end
- Back end targets: x86, ARM64, RISC-V, and others
- speculation cost: division ~**80 cycles**; addition ~**1 cycle** — SimplifyCFG must not speculate division naively
- Gaussian summation: IV simplification derives **n(n+1)/2** from accumulator loops automatically
- Loop unrolling threshold: partial unrolling never exceeds instruction cache budget (e.g., don't unroll 400× if it blows i-cache)

### Key Quotes

> "This here is the single most important part of this presentation: if you take away anything, take away the split [Godbolt's pipeline view]. For each pass the change shows you an IR diff before that pass and after — the most valuable tool if you want to find out which pass is responsible for doing some kind of transform."

> "InstCombine is basically the dumping ground for all the transforms that don't change control flow. It's a canonicalization pass — it's not allowed to be target-dependent. If a specific target doesn't like that canonical form, in the back end we implement the reverse transform."

---

## Cross-Cutting Analysis

### College Mappings

| College Department | Lectures | Connection |
|-------------------|----------|------------|
| **Mathematics** | ECC, ZKP | Group theory, number theory, algebraic geometry (elliptic curves), complexity theory (PCP, IOP), information theory |
| **Computer Science / AI & Computation** | Raft, Paxos, BFT, LLVM | Distributed systems, fault tolerance, compiler theory, formal verification |
| **Infrastructure / Engineering** | Raft, Paxos, LLVM | Replication protocols, production system design, compilation toolchain |
| **Broadcasting / Communications** | ZKP, BFT | Privacy-preserving proofs, message authentication, adversarial channels |

### Rosetta Cluster Assignments

| Cluster | Lectures |
|---------|----------|
| **AI & Computation** | All 6 — these are systems primitives |
| **Infrastructure** | Raft, Paxos, LLVM |
| **Science** | ECC, ZKP, BFT |
| **Mathematics** | ECC, ZKP |

---

## Rosetta Connections — Deep Cuts

### Raft / Paxos → Gastown Refinery-Merge

Gastown's merge queue is Raft at the application layer:
- One active merge process at a time = Raft leader
- Sequential deterministic commits = replicated log
- Merge queue timeout → new merge process = leader election
- The key insight from both lectures: the **leader-based model is 10× simpler** than symmetric quorum. Gastown was right to use it.
- Paxos danger avoided: competing proposers (concurrent merges) could cause livelock. The refinery model prevents this by design.

### BFT → trust-relationship.ts

The BFT lemma maps directly onto trust decisions:
- Agents can exhibit Byzantine behavior (return wrong results, lie about capabilities, send conflicting signals)
- The 3m+1 bound: trust-relationship.ts should assume some fraction of agents are adversarial by design
- Practical lesson from the lecture: don't solve BFT in full generality. Minimize N, minimize M, use cryptographic attestation (signed messages) to reduce message complexity from exponential to polynomial.
- The oral messages algorithm's recursive structure mirrors how trust should propagate: a trusted agent's claim about another agent should carry less weight as the chain lengthens.

### ECC → MCPS/AIP Agent Identity

The lecture confirms the key choices made in the harness research:
- **Ed25519** (Curve25519 / Edwards form) and **ECDSA P-256** are the right curves — well-vetted, not NIST-curve-controversy-affected for Ed25519
- 256-bit ECC = 2048-bit RSA security — right sizing for agent identity
- The group operation mod prime structure is why Ed25519 key generation is so fast: repeated squaring in an elliptic group, ~256 point doublings + additions
- Warning from lecture: never generate your own curves. Use the well-vetted ones. This applies to any custom agent identity scheme.

### ZKP → GUPP Propulsion

The GUPP model ("prove you did the work without revealing how") is a zkSNARK in spirit:
- Prover = agent completing a task
- Witness = agent's internal process / private data
- Statement = "I produced output y from public input x"
- Verifier = GUPP verifier checking the claim without access to internals
- The IOP framework suggests the architecture: **modular** (information-theoretic component + cryptographic compiler), **transparent** (no trusted setup needed — just agree on hash), **post-quantum capable**
- Concrete direction: use STARKs or Aurora-style IOPs rather than Groth16/PLONK for GUPP if long-term infrastructure is the goal

### LLVM → TypeScript Pipeline / src-tauri

The LLVM lecture reveals the philosophy behind our own pass architecture:
- **Canonical forms first** (SROA → SSA) parallels: always normalize input before optimization
- **Interprocedural first** (IPSCCP runs before CFG simplification to preserve information) parallels: run cross-module analysis before intra-module transforms
- **The kitchen sink problem** (InstCombine): consolidating many small transforms in one pass for pass-ordering reasons is a real pattern. Our TypeScript build pipeline likely has equivalent anti-patterns.
- **Rust-specific NRVO**: the LLVM team explicitly works on optimizations Rust needs that C++ gets for free. Similarly, TypeScript → JS lowering loses information that the optimizer could use if it ran earlier.
- The CGSCC bottom-up inlining pipeline = our skill/agent dependency graph: simplify leaf agents before composing them into teams.

---

## Study Guide Topics

### Foundational Concepts to Master

1. **Consensus problem definition:** What is safety? What is liveness? Why are both necessary?
2. **State machine replication:** How does a replicated log guarantee identical state machine execution?
3. **FLP Impossibility:** Why can't you achieve consensus in an asynchronous system with even one failure? (Referenced by Ousterhout: "you have to use time.")
4. **Quorum intersection:** Why does majority quorum guarantee any two quorums share at least one member?
5. **Byzantine vs. Crash-stop failures:** What changes about algorithm design? What is the complexity cost?
6. **Group theory basics:** Identity, inverse, associativity, closure — and why these are necessary for Diffie-Hellman.
7. **Discrete Logarithm Problem:** Why is g^x easy to compute but x = log_g(y) hard to invert?
8. **Elliptic curve point addition:** The geometric construction, the algebraic equations, the point at infinity.
9. **PCP theorem:** What is a probabilistically checkable proof? What does "random local check" mean?
10. **Fiat-Shamir transform:** How do you convert an interactive proof to a non-interactive one?
11. **SSA (Static Single Assignment) form:** Why is it necessary for most LLVM analyses?
12. **Pass ordering in compilers:** Why does order matter? What is a canonicalization pass?

---

## DIY Try Sessions

### 1. Raft in a Browser
**Tool:** https://raft.github.io (RaftScope visualization)
- Run a 5-node cluster, watch leader election
- Kill the leader mid-replication; watch log consistency repair
- Try splitting the cluster; observe that only majority side makes progress
**Build it:** Implement a minimal Raft in TypeScript using message-passing (no network needed, just in-process queues). Target: leader election + log replication, ~500 lines.

### 2. Paxos by Hand
- Draw a 5-server diagram. Simulate two simultaneous proposers trying to choose different values.
- Trace through the prepare/accept phases for each. Show they converge on the same value.
- Then simulate the livelock case. Add randomized backoff. Show convergence.

### 3. Byzantine Generals Simulation
- Implement OM(1) in Python: 4 generals, 1 traitor. Show that the majority vote produces consensus.
- Try OM(1) with 3 generals (should fail — see the impossibility). Verify the algorithm breaks.
- Count the messages. For N=4, M=1: N² = 16 messages. Verify empirically.

### 4. Elliptic Curve Group Arithmetic
**Install:** `pip install pyca/cryptography` or use SageMath
```python
# In SageMath:
p = 2^255 - 19  # Curve25519 prime
E = EllipticCurve(GF(p), [0, 486662, 0, 1, 0])  # Montgomery form
G = E.lift_x(9)  # Generator point
print(2 * G)  # Point doubling
print(G.order())  # Should be a large prime * small cofactor
```
- Generate a key pair: random private key a, public key A = a*G
- Perform ECDH: two parties exchange public keys, compute shared secret
- Verify: a*(b*G) == b*(a*G)

### 5. Merkle Tree + Fiat-Shamir (Mini-SNARK)
```python
import hashlib, json

def merkle_root(leaves):
    if len(leaves) == 1: return leaves[0]
    next_level = [hashlib.sha256(leaves[i].encode() + leaves[i+1].encode()).hexdigest()
                  for i in range(0, len(leaves), 2)]
    return merkle_root(next_level)

# Simulate the Micali construction:
# 1. Prover "writes" a proof (just a list of values)
proof = ["a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7"]
root = merkle_root(proof)

# 2. Fiat-Shamir: derive query index from root
query_index = int(hashlib.sha256(root.encode()).hexdigest(), 16) % len(proof)

# 3. Prover opens that leaf + authentication path
print(f"Query index: {query_index}, Answer: {proof[query_index]}, Root: {root}")
# In a real system: include the full auth path so verifier can re-derive root
```

### 6. LLVM IR Inspection (src-tauri context)
```bash
# Compile a Rust file to LLVM IR (see what rustc emits)
rustc --emit=llvm-ir -O src-tauri/src/main.rs -o /tmp/output.ll

# Inspect a specific function
grep -A 20 "define.*fn_name" /tmp/output.ll

# Run LLVM opt passes manually and observe changes
opt -passes="sroa,instcombine,simplifycfg" /tmp/output.ll -o /tmp/optimized.bc
llvm-dis /tmp/optimized.bc | less
```
- Find a loop in the Rust backend. Inspect the LLVM IR before and after `loop-vectorize`.
- Use Godbolt: paste a Rust function, select LLVM IR output, enable optimization pipeline view.

### 7. ZKP Verification Intuition
- Read the STARK tutorial at https://starkware.co/stark-101/
- The STARKs-over-field polynomial commitment scheme is the IOP → SNARK compiler described in this lecture, made concrete.
- Challenge: trace through one round of the FRI protocol (Fast Reed-Solomon IOP of Proximity). It is exactly the Micali construction applied to low-degree testing.

---

*This analysis is part of the Artemis II mission research corpus.*
*Files analyzed: artifacts/yt-{raft,paxos,bft,ecc,zkp,llvm}-*.en.vtt*

---

## Addendum: College cross-link (April 2026)

This addendum was added in April 2026 as part of a catalog-wide
enrichment pass. The body above is a deep transcript-analysis
synthesis of systems-primitives material (Raft, Paxos, BFT, ECC,
ZKP, LLVM) and its value is the synthesis itself. The enrichment
here is limited to the standardized college cross-link section.

## Related College Departments

This research cross-links to the following college departments in
`.college/departments/`:

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) — Consensus protocols, error-correcting codes, zero-knowledge proof systems, and LLVM IR are all squarely applied programming topics in the Algorithms & Efficiency and Computing & Society wings.
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md) — The mathematical foundations (finite fields for ECC, polynomial commitments and Reed-Solomon for STARK/FRI, group theory for SNARK pairings) are mathematics-department territory.
- [**logic**](../../../.college/departments/logic/DEPARTMENT.md) — Byzantine fault tolerance, consensus safety/liveness proofs, and the formal semantics of proof systems are logic-department topics.
- [**technology**](../../../.college/departments/technology/DEPARTMENT.md) — Compiler infrastructure (LLVM IR, optimization pipelines) and distributed systems engineering are technology-department material.

---

*Addendum (college cross-link) added during the Session 018 catalog enrichment pass.*

## Study Guide — Systems Primitives

## DIY — List 8 primitives

Think about what you'd call the irreducible operations
in your domain. Write them down.

## TRY — Compose primitives into a task

Pick any task you do daily. Express it purely in
terms of those 8 primitives. Note what's missing.
