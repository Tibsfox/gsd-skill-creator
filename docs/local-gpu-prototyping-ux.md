# The Lab: Local GPU Prototyping UX

> Come as you are. Bring a question, leave with an answer.

## What Is The Lab?

The Lab is a local prototyping environment where ideas get tested before they go anywhere else. It runs on your hardware — an RTX 4060 Ti with 8GB VRAM and 60GB system RAM — so experiments are fast, private, and free.

No cloud keys. No rate limits. No audience. Just you, a hypothesis, and a GPU.

## How It Feels

### The simplest version

```
/lab test "what if function names predicted their complexity?"
```

That's it. The Lab picks a model, runs the experiment, and reports back. You don't need to know which model, how much VRAM it needs, or what backend is running. The Lab handles all of that.

When you're ready, there's more.

### The full picture

```
hypothesis --> local model --> result --> iterate --> (optional) post to wanted board
    ^                                       |
    +----------- refine --------------------+
```

The Lab is a loop. You ask a question, get a result, refine the question, and go again. When something works, you can promote it — to a skill, a wanted board item, or a muse cartridge. Most experiments stay local. That's fine. The value is in the testing.

## Commands

### `/lab test <hypothesis>`

Run a hypothesis through a local model. The Lab selects the appropriate model and approach based on what you're asking.

```
/lab test "do similar error messages cluster by root cause?"
```

**What happens:**
1. The Lab parses your hypothesis into a testable question
2. Selects or downloads an appropriate model (see Resource Management)
3. Runs the experiment
4. Returns a result with confidence and suggested next steps

**Output (glance):** `Tested: yes, error messages cluster by root cause (72% silhouette score)`

**Output (scan):**
```
Hypothesis: similar error messages cluster by root cause
Method: sentence embeddings + k-means (k=5)
Result: 72% silhouette score across 847 error messages
Clusters: OOM (23%), timeout (31%), auth (18%), parse (15%), other (13%)
Next: try HDBSCAN for variable-density clusters
```

**Output (read):** Full clustering analysis with per-cluster examples, distance matrices, suggested follow-up experiments.

### `/lab embed <file|directory>`

Generate embeddings for files, functions, or text. Useful for similarity analysis, search, and clustering.

```
/lab embed src/services/chipset/
```

Stores embeddings locally in `.lab/embeddings/`. Subsequent calls reuse cached embeddings for unchanged files. Uses the most capable embedding model that fits in VRAM alongside any running inference model.

### `/lab cluster <dataset>`

GPU-accelerated clustering on embeddings or raw data.

```
/lab cluster .lab/embeddings/chipset --method hdbscan
```

Returns cluster assignments, visualization data, and outlier flags. Can feed directly into `/lab test` for hypothesis refinement.

### `/lab voice-check <muse> <output>`

Verify that a piece of output matches a muse's voice. Compares against the muse's vocabulary, tone, and style definitions from their agent file.

```
/lab voice-check sam "Here's what I found in the data..."
```

**Output:** `sam voice: 84% match. Missing: curiosity framing, hypothesis language. Suggestion: lead with "I wonder whether..." or "What if..."`

This is how muses stay in character without burning cloud tokens on style checks.

## Resource Management

### The Budget

| Resource | Total | Lab Reserve | System Reserve |
|----------|-------|-------------|----------------|
| VRAM     | 8 GB  | 6 GB        | 2 GB (desktop) |
| RAM      | 60 GB | 40 GB       | 20 GB (OS+apps) |
| GPU compute | 100% | 90%      | 10% (display)  |

### Model Tiers

The Lab maintains a tiered model registry. Models are pulled on first use (via ollama) and cached locally.

| Tier | VRAM | Use Case | Example Models |
|------|------|----------|----------------|
| Tiny | <1 GB | Embeddings, classification | nomic-embed-text, all-minilm |
| Small | 1-3 GB | Quick generation, voice checks | phi-3-mini, gemma-2b |
| Medium | 3-5 GB | Hypothesis testing, analysis | mistral-7b-q4, llama-3.1-8b-q4 |
| Full | 6-8 GB | Complex reasoning, long context | deepseek-coder-6.7b, codellama-7b |

### Cohabitation Rules

Multiple models can share the GPU when their combined VRAM fits. The Lab manages this automatically:

1. **Embedding + Small inference** — both fit, run concurrently
2. **Medium + anything** — embedding model unloaded, medium takes priority
3. **Full** — exclusive access, everything else waits or uses CPU fallback

The Lab never crashes your desktop. If VRAM is tight, it queues work rather than OOM-killing your session.

### RAM as Overflow

With 60GB of system RAM, the Lab can:
- Keep multiple model weights in RAM for fast VRAM swapping
- Run CPU-only inference for tasks that don't need speed (embeddings, classification)
- Cache large datasets entirely in memory for clustering

## Muse Integration

### How Muses Use The Lab

Muses can request local compute through the existing `MuseSystem` pipeline. The integration point is the `SandboxManager` — Lab experiments run under the same trust model as cartridge execution.

```
muse consult request --> SandboxManager policy check --> Lab execution --> result
```

**Sam** (the explorer) is the natural Lab user. Sam's protocol — frame a question, generate hypotheses, propose experiments — maps directly to `/lab test`.

**Cedar** (the muse/integrity engine) uses `/lab voice-check` to validate muse output consistency without cloud round-trips.

**Willow** (UI) wraps Lab results at the appropriate disclosure level for the audience.

### Muse-Initiated Experiments

A muse can request Lab time through the chipset dispatcher:

```yaml
# Example: Sam requests a clustering experiment
trigger: muse_lab_request
source: sam
request:
  type: cluster
  data: .lab/embeddings/recent-errors
  method: hdbscan
priority: low
```

Muse requests are always lower priority than human `/lab` commands. The dispatcher queues them and runs during idle time.

### Trust Boundaries

Lab experiments inherit sandbox trust levels:

| Trust Level | Lab Access |
|-------------|-----------|
| quarantine  | Embeddings only, read-only on bundle path |
| provisional | Embeddings + small model inference, read on `data/` |
| trusted     | Full Lab access, all model tiers |
| suspended   | No Lab access |

This means a new muse cartridge can generate embeddings in quarantine but can't run full inference until it earns trust through clean executions.

## Progressive Disclosure: Growing With The Lab

### Week 1: Just Ollama

```
# Install
curl -fsSL https://ollama.com/install.sh | sh

# First experiment
/lab test "can a small model summarize my git log?"
```

The Lab detects ollama, pulls a small model, runs the test. No configuration needed.

### Month 1: Embeddings and Search

You've run a few tests. Now you want to embed your codebase for similarity search.

```
/lab embed src/
/lab test "which files are most similar to sandbox-manager.ts?"
```

The Lab caches embeddings, reuses them across experiments, and starts suggesting experiments based on patterns it notices.

### Month 3: Custom Pipelines

You've outgrown single-shot experiments. Now you chain them:

```yaml
# .lab/pipelines/voice-audit.yaml
name: muse-voice-audit
steps:
  - embed: .claude/agents/*.md
  - for_each_muse:
      - generate: "Write a 3-sentence status update"
      - voice-check: "${muse} ${output}"
  - report: voice-consistency-matrix
schedule: weekly
```

Pipelines are YAML files in `.lab/pipelines/`. They run on schedule or on demand. They compose Lab primitives into repeatable experiments.

### Month 6: Model Fine-Tuning

With enough experiment data, the Lab can fine-tune small models on your project's patterns:

```
/lab tune --base phi-3-mini --data .lab/results/ --task voice-matching
```

This is the endgame: local models that understand your project's vocabulary, your muses' voices, and your codebase's structure. But you don't need to think about this on day one.

## File Layout

```
.lab/
  config.yaml          # Lab configuration (model registry, resource limits)
  models/              # Cached model metadata (weights managed by ollama)
  embeddings/          # Cached embeddings by source path
  results/             # Experiment results (timestamped JSONL)
  pipelines/           # Custom pipeline definitions
  cache/               # Intermediate computation cache
```

The `.lab/` directory is gitignored. Experiments are local by default. To share a result, explicitly promote it.

## Integration Points

| System | Integration | Direction |
|--------|------------|-----------|
| Chipset | Dispatcher routes muse Lab requests | Muse --> Lab |
| Sandbox | Trust levels gate Lab access | Lab reads policy |
| Wanted Board | `/lab promote` posts successful experiments | Lab --> Board |
| Cartridges | Lab validates cartridge output quality | Lab <--> Cartridge |
| Observatory | Lab telemetry flows to UC bus | Lab --> Bus |

## Design Principles

1. **No config to start.** `/lab test` works out of the box with ollama defaults.
2. **Local first.** Nothing leaves the machine unless you say so.
3. **Fail quietly.** If a model doesn't fit, try a smaller one. If nothing fits, say so clearly.
4. **Warm, not technical.** Error messages explain what happened and what to try next.
5. **Composable.** Lab primitives (embed, test, cluster, voice-check) combine into pipelines.
6. **Respect the hardware.** Never OOM the system. Always leave room for the desktop.

---

*Here's what matters: you have a GPU and ideas. The Lab connects them. Start with `/lab test` and see where curiosity takes you.*
