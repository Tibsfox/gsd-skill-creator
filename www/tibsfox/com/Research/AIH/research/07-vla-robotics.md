# Vision-Language-Action Models: The Moment That Reset Robotics

> **Domain:** AI & Robotics
> **Module:** 7 -- From SayCan to Pi Zero: VLA Architectures for Robot Control
> **Through-line:** *In 2023, Google's RT2 demonstrated that a large language model could be fine-tuned to directly output robot control signals. A robot moved a Coke can to Taylor Swift -- and Taylor Swift was never in the training data. The knowledge came from the internet. The control came from demonstrations. The unification changed everything.*
> **Source:** Welch Labs (YouTube, ~32 minutes)
> **Rosetta Clusters:** AI & Computation (primary), Electronics, Science, Space

---

## Table of Contents

1. [The VLA Architecture](#1-the-vla-architecture)
2. [The SayCan-to-Pi-Zero Evolution](#2-the-saycan-to-pi-zero-evolution)
3. [Pi Zero Architecture](#3-pi-zero-architecture)
4. [Flow Matching: Diffusion for Robot Control](#4-flow-matching)
5. [Why Cross-Domain Generalization Matters](#5-cross-domain-generalization)
6. [The Modularity-Integration Tradeoff](#6-modularity-integration-tradeoff)
7. [Numbers](#7-numbers)
8. [Study Topics](#8-study-topics)
9. [DIY Sessions](#9-diy-sessions)
10. [Cross-Cluster Connections](#10-cross-cluster-connections)
11. [Sources](#11-sources)

---

## 1. The VLA Architecture

A Vision-Language-Action (VLA) model unifies three capabilities in a single architecture:

- **Vision:** Processing camera images to understand the physical scene
- **Language:** Understanding natural language instructions
- **Action:** Outputting joint-level robot control signals

The term was coined by the RT2 team at Google in July 2023, when they demonstrated that a multimodal LLM could be fine-tuned to directly produce robot motor commands.

> "Can large language models, by far the most powerful AI systems we've trained so far, be trained to become robot brains? [RT2 answers] with a shaky but definitive yes."

---

## 2. The SayCan-to-Pi-Zero Evolution

Google's robotics team explored LLM-robot integration through a clear sequence:

### Phase 1: LLM as Planner (2022)

**SayCan** used PaLM 540B (text-only) to decompose tasks into subtasks. A separate neural network translated subtasks into control signals.

**Bottleneck:** The LLM was blind (text-only) and the control layer was limited to a fixed menu of pre-trained actions.

### Phase 2: Multimodal Planner (Early 2023)

**PaLM-E** added vision to the planning layer. Still used RT1 as a separate control layer. Robots could now recover from setbacks.

### Phase 3: Unified VLA Model (July 2023)

**RT2** merged planning and control: PaLM-E and PaLI-X trained to directly output robot control signals using the same 130K+ human demonstration dataset.

**Key result:** Emergent generalization -- the Taylor Swift Coke can demo. The model combined abstract internet knowledge with physical control, demonstrating cross-domain generalization.

**Limitation:** 5-55B parameters, too large to run on-robot. Required TPU cluster offload.

### Phase 4: Optimized VLA (October 2024)

**Pi Zero** (Physical Intelligence, founded by key RT2 researchers): 3.3B parameters, runs on-device using a consumer NVIDIA RTX 4090 at 73ms inference time.

---

## 3. Pi Zero Architecture

### Input Processing

- 3 camera images (1 overhead + 2 wrist) -> 16x16 grid = 256 patches each = 768 total
- SigLIP encoder maps patches to 768 embedding vectors of length 2048
- Text prompt tokenized (e.g., "uncap the pen" = 4 tokens)
- Total: 772 embedding vectors -> Gemma LLM

### Gemma LLM

- 18 transformer blocks, 8 attention heads each
- Embedding vector length: 2048
- Full 772x772 attention pattern matrix per head
- Computes query-key-value representations for cross-modal understanding

### Action Expert

- Same Gemma architecture but narrower (embedding length 1024)
- Inputs: 1 robot state token (14 joint positions) + 50 action tokens (predicted trajectories)
- **Cross-attention via KV cache sharing:** Gemma's keys and values appended to action expert's own -> 823 total queryable keys per head

> The two models "almost think as one while retaining the benefits of modularity."

### Aloha Robot Platform

- Dual-arm: 7 degrees of freedom per arm (waist, shoulder, elbow, forearm rotation, wrist, wrist rotation, gripper)
- 14 total actuator values per timestep
- 3 cameras: 1 overhead, 1 on each wrist

---

## 4. Flow Matching

Pi Zero's action expert uses flow matching (a variant of diffusion) to generate trajectories:

1. Start with completely random 14x50 action matrix
2. Action expert predicts update direction
3. Updates added to current actions
4. Repeat 10 times to produce smooth final trajectories
5. Robot executes a few timesteps, then the entire process repeats with fresh camera images

> "The fact that we can use the same exact flow matching process to generate images and videos and control robots is so interesting. It's such a surprisingly effective abstraction on top of what feel like very different applications of AI."

This is mathematically identical to diffusion-based image generation -- noise iteratively refined into signal.

---

## 5. Why Cross-Domain Generalization Matters

The Taylor Swift Coke can demo is scientifically significant because the robot's control training data contained no references to Taylor Swift. Yet the model:

1. Understood the natural language instruction
2. Identified Taylor Swift in the visual scene (from internet pre-training)
3. Planned and executed a physical manipulation sequence

The model's internal representations form a **shared semantic space** where internet knowledge and physical control knowledge are jointly accessible. Pre-trained weights from internet-scale data provide a "knowledge substrate" that robot control fine-tuning leverages without retraining.

---

## 6. The Modularity-Integration Tradeoff

| Architecture | Communication | Trade-off |
|-------------|---------------|-----------|
| **Fully modular** (SayCan) | Natural language between planner and controller | Simple to debug; limited by text bandwidth |
| **Fully unified** (RT2) | Single model handles everything | Maximum info sharing; enormous model (55B) |
| **Hybrid modular** (Pi Zero) | Dense vector representations (KV cache) | Rich info sharing + efficiency of modularity |

The hybrid approach -- shared architecture with rich inter-model communication -- appears to be the sweet spot.

### The Self-Driving Car Cautionary Parallel

In 1995, Carnegie Mellon's RALPH drove across the US at 98.2% autonomy. This did not mean self-driving was imminent. The systems that eventually worked used very different approaches. Impressive demos may not translate to near-term products.

Yann LeCun (who recently left Meta for world-models venture) stated that VLAs "are doomed" and "basically don't work really well," pointing to world models (JEPA) as an alternative paradigm.

---

## 7. Numbers

| Parameter | Value |
|-----------|-------|
| RT1 training demonstrations | 130,000+ |
| PaLM 540B parameters | 540 billion |
| RT2 model range | 5 to 55 billion parameters |
| Pi Zero parameters | 3.3 billion |
| Pi Zero inference GPU | NVIDIA RTX 4090 |
| Pi Zero inference time | 73 milliseconds |
| Gemma transformer blocks | 18 |
| Attention heads per block | 8 |
| Image patches (3 cameras) | 768 |
| Total LLM input tokens | 772 |
| Gemma embedding length | 2048 |
| Action expert embedding length | 1024 |
| Robot joints controlled | 14 (2 arms x 7 DOF) |
| Action prediction horizon | 50 timesteps |
| Flow matching iterations | 10 |
| Combined key matrix rows | 823 (772 Gemma + 51 action expert) |
| RALPH self-driving autonomy (1995) | 98.2% |

---

## 8. Study Topics

1. **Transformer attention mechanism** -- Q/K/V matrices, dot-product attention, softmax, multi-head
2. **Vision-Language-Action models** -- How VLAs differ from planning+control stacks
3. **Flow matching and diffusion** -- Iterative noise-to-signal refinement for both images and trajectories
4. **Transfer learning and foundation models** -- Internet-scale pre-training enabling robotic generalization
5. **Embedding spaces and soft tokens** -- SigLIP encoding; cross-modal shared representations
6. **KV cache and cross-attention** -- Pi Zero's coupling technique
7. **Imitation learning** -- 130K+ human demonstrations; data bottleneck vs. scaling hypothesis
8. **World models vs. VLAs** -- LeCun's JEPA alternative; the fundamental disagreement
9. **Robot kinematics** -- 7-DOF arms, joint trajectories, 14x50 action matrices
10. **AI demos vs. deployment** -- RALPH 1995 to functional self-driving: the 30-year gap

---

## 9. DIY Sessions

### Session 1: Attention Head Visualization (2-3 hours)

Implement a simplified attention mechanism in Python/NumPy:
- 10 "image patch" embedding vectors (make 2 similar to each other)
- 2 "text" embedding vectors (one similar to the matching patches)
- Compute Q, K, V; visualize attention pattern as heatmap
- Verify text query produces high attention on matching image patches

### Session 2: Flow Matching Trajectory Generation (3-4 hours)

- Define a target trajectory (smooth sine curve for one joint over 50 timesteps)
- Start with pure random noise
- Train a small network to predict updates from noisy toward clean
- Iteratively denoise over 10 steps; visualize at each step

### Session 3: Planning-vs-Control Grid World (4-5 hours)

Build a grid-world robot with separate planner and controller:
- Test SayCan-style (blind planner, fixed menu controller)
- Test unified (planner sees grid state)
- Measure performance difference

---

## 10. Cross-Cluster Connections

### Gastown Architecture Mapping

| Pi Zero Concept | Gastown Equivalent |
|----------------|-------------------|
| Gemma LLM (perception + planning) | Mayor-coordinator (northbridge) |
| Action expert (trajectory generation) | Polecat-worker (ALU execution) |
| KV cache sharing | Beads-state (shared JSON state) |
| Flow matching iterations | Convoy iteration cycles |
| 772 + 51 = 823 combined keys | Combined context from mayor + worker |

### Rosetta Table

| Robotics Concept | Software Equivalent |
|-----------------|---------------------|
| KV cache sharing | Beads-state persistence -- shared context between agents |
| Flow matching (noise -> trajectory) | Convoy iterations: rough work items refined into tested deliverables |
| VLA unification | Agentic primitives pipeline (QUERY + OBSERVE + COMPUTE + COMMIT) |
| Action expert (separate, same architecture) | Subagent dispatch: same Claude model, freshly initialized per task |
| 14x50 trajectory matrix | ROADMAP.md phase matrix: N phases x M milestones |

### College Mappings

| College | Relevance |
|---------|-----------|
| Computer Science | PRIMARY -- transformer architectures, attention, embeddings |
| Mathematics | PRIMARY -- matrix operations, softmax, flow matching |
| Electronics | STRONG -- GPU inference, actuator control, on-device compute |
| Physics | MODERATE -- robot kinematics, 7-DOF manipulation |

---

## 11. Sources

- Welch Labs, "The Moment that Reset Robotics" (YouTube, ~32 minutes)
- Google DeepMind, RT2: "Robotic Transformer 2" (July 2023)
- Physical Intelligence, Pi Zero (October 2024)
- PaLM-E paper (March 6, 2023)
- Nvidia RTX 4090 consumer GPU specifications
- Carnegie Mellon RALPH (1995)

---

*Artemis II Research Division -- VLA Robotics analysis, Session 8. v1.49 PNW Research Series.*
