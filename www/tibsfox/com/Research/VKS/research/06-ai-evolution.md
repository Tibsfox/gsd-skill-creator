# AI Evolution Engine -- Shader Mutation, Fitness Selection & Upstream Intelligence

## Overview

The AI Evolution Engine is the capstone module of the Vulkan Screensaver Engine. It integrates Claude API for shader mutation and selection, a fitness function library for aesthetic evaluation, and a population manager that evolves visual programs over time. The result: screens that are not blank when the human is away -- they are dreaming, and the dreams get better.

## Architecture

The evolution engine operates on a population of **visual programs** -- parameterized shader configurations that produce distinct visual outputs. Each individual in the population is defined by:

- A shader template (from the NeHe, Sascha Willems, or CUDA library)
- A parameter vector (floats controlling color, speed, scale, complexity)
- A fitness score (aesthetic quality, novelty, complexity balance)
- A lineage record (parent IDs, generation number, mutation history)

## Population Manager

The population manager maintains a pool of N individuals (default N=20) and runs evolutionary cycles:

### Lifecycle

```
1. INITIALIZE: Seed population with random parameters on known-good templates
2. RENDER: Each individual renders one frame to an offscreen framebuffer
3. EVALUATE: Fitness function scores each render
4. SELECT: Tournament selection picks parents
5. REPRODUCE: Crossover + mutation create offspring
6. REPLACE: Lowest-fitness individuals replaced by offspring
7. DISPLAY: Highest-fitness individual shown on screen
8. GOTO 2 (every N seconds, configurable)
```

### Generation Timing

- **Evaluation interval:** Every 30 seconds (configurable)
- **Generation size:** 20 individuals
- **Offspring per generation:** 4-6
- **Replacement strategy:** Steady-state (replace worst, not whole generation)
- **Archive:** Best-of-generation saved to disk for restart continuity

## Fitness Functions

The fitness library evaluates visual quality without human input. Three fitness dimensions are combined:

### Aesthetic Fitness

Measures visual appeal using image statistics:

- **Color harmony:** Hue distribution analysis -- penalize uniform hue, reward complementary/triadic schemes
- **Spatial frequency:** FFT of rendered image -- reward mid-frequency content (interesting structure), penalize pure noise (high freq) or empty (low freq)
- **Contrast ratio:** Luminance histogram analysis -- reward images with clear foreground/background separation
- **Edge density:** Canny edge detection -- reward moderate edge density (structured without cluttered)

### Complexity Fitness

Measures computational and visual complexity:

- **Kolmogorov approximation:** LZMA compression ratio of rendered image -- higher compression = simpler image
- **Fractal dimension:** Box-counting dimension of edge map -- reward 1.3-1.7 range (natural complexity)
- **Symmetry detection:** Autocorrelation analysis for approximate symmetry

### Novelty Fitness

Measures how different an individual is from the archive:

- **Archive distance:** L2 distance in feature space from the K nearest archived images
- **Population diversity:** Average pairwise distance within current population
- **Reward uniqueness:** Individuals far from the archive receive novelty bonus

### Combined Fitness

```
fitness = w_aesthetic * aesthetic +
          w_complexity * complexity +
          w_novelty * novelty
```

Default weights: aesthetic=0.5, complexity=0.3, novelty=0.2

## Claude API Integration

The engine optionally calls the Claude API for high-level creative guidance:

### Mutation Suggestions

Every K generations (default K=10), the engine sends the top-3 and bottom-3 rendered images to Claude with the prompt:

*"These are the best and worst outputs from a generative screensaver. Suggest parameter adjustments to explore more interesting visual territory."*

Claude's response is parsed for parameter adjustment suggestions, which are applied as directed mutations in the next generation.

### Template Selection

When the population stagnates (fitness plateau for 5+ generations), Claude is asked:

*"The current template family has converged. Given these visual characteristics, which shader template should the population explore next?"*

This prevents the system from getting stuck in a local optimum.

## Upstream Intelligence Contribution

The evolution engine feeds discoveries back to skill-creator:

- **Novel patterns:** When a population member exceeds a fitness threshold not seen before, its parameter vector and template are logged as a "discovered pattern"
- **Template effectiveness:** Statistics on which templates produce the highest-fitness individuals inform the upstream intelligence feed
- **Technique combinations:** When crossover between templates from different families produces high-fitness offspring, the combination is flagged as a "synergy"

## Safety Boundaries

> **SAFETY: The AI Evolution Engine has strict boundaries:**
- Claude API calls are rate-limited (max 1 per 5 minutes)
- No arbitrary code execution -- Claude suggests *parameters*, not *code*
- All shader templates are pre-compiled SPIR-V; evolution only adjusts numeric parameters
- Token budget hard cap prevents runaway API costs
- Local-only operation mode available (disable Claude, use only statistical fitness)

## Cross-References

> **Related:** [CUDA Generative Math](05-cuda-generative.md) for the evolutionary substrates, [XScreenSaver Catalog](01-xscreensaver-catalog.md) for the upstream intelligence schema, [Vulkan Engine Architecture](02-vulkan-engine.md) for the plugin system.
