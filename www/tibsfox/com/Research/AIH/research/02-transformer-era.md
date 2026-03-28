# The Transformer Era (2017-2023)

## Overview

The Transformer architecture replaced recurrence with self-attention and triggered the most rapid capability expansion in AI history. This module documents the scaling laws, emergent capabilities, and the path from "Attention Is All You Need" to ChatGPT.

## Attention Is All You Need (2017)

### The Architecture

Vaswani et al.'s Transformer introduced self-attention as the sole mechanism for processing sequences:

- **Self-attention**: Each token attends to every other token in the sequence, learning relevance weights
- **Multi-head attention**: Multiple parallel attention computations capture different relationship types
- **Positional encoding**: Sinusoidal functions encode sequence position (no recurrence needed)
- **Feed-forward networks**: Two-layer MLPs applied independently to each position
- **Residual connections + layer normalization**: Enable gradient flow through deep stacks

### Why It Worked

The Transformer's key advantage over RNNs and LSTMs was parallelizability. Recurrent networks process tokens sequentially -- each token depends on the hidden state from the previous token. Self-attention processes all tokens simultaneously, enabling massive GPU parallelism during training.

| Property | RNN/LSTM | Transformer |
|----------|----------|-------------|
| Sequential dependency | Yes | No |
| Training parallelism | Limited | Full |
| Long-range dependencies | Difficult (vanishing gradients) | Native (attention spans full context) |
| Memory per token | O(1) | O(n) -- quadratic attention cost |
| Compute scaling | Linear in sequence length | Quadratic in sequence length |

## The Scaling Era (2018-2022)

### GPT-1 (June 2018)

OpenAI demonstrated that unsupervised pretraining on a large text corpus, followed by supervised fine-tuning, produced strong performance across diverse NLP tasks. 117 million parameters. The key insight: language modeling as a pretext task generates useful representations.

### BERT (October 2018)

Google's Bidirectional Encoder Representations from Transformers introduced masked language modeling -- predicting randomly masked tokens using both left and right context. 340 million parameters. BERT dominated NLP benchmarks for two years.

### GPT-2 (February 2019)

1.5 billion parameters. OpenAI initially withheld the full model due to concerns about misuse. GPT-2 demonstrated that scale alone could produce surprisingly coherent text generation. The beginning of the "scaling hypothesis."

### GPT-3 and Few-Shot Learning (June 2020)

175 billion parameters, trained on 300 billion tokens. GPT-3's breakthrough was **in-context learning**: the model could perform new tasks from a few examples provided in the prompt, without any weight updates. This was not anticipated by the training procedure -- it emerged from scale.

| Capability | GPT-2 (1.5B) | GPT-3 (175B) | Emergence |
|-----------|-------------|-------------|-----------|
| Text generation | Good | Excellent | Improved |
| Few-shot classification | Poor | Strong | Emergent |
| Arithmetic | Absent | Partial | Emergent |
| Code generation | Absent | Partial | Emergent |
| Translation | Poor | Good | Emergent |

### Scaling Laws

Two landmark papers quantified the relationship between compute, data, model size, and performance:

**Kaplan et al. (2020)**: "Scaling Laws for Neural Language Models"
- Performance improves as a power law of model size, dataset size, and compute
- Optimal allocation: increase model size and data proportionally
- Diminishing returns are smooth -- no cliff or saturation observed

**Hoffmann et al. (2022)**: "Chinchilla" (Training Compute-Optimal Large Language Models)
- Prior models were undertrained relative to their size
- Chinchilla (70B parameters, 1.4T tokens) outperformed Gopher (280B parameters, 300B tokens)
- Optimal ratio: ~20 tokens per parameter

## Instruction Following and Alignment (2022)

### InstructGPT (March 2022)

OpenAI's InstructGPT demonstrated that Reinforcement Learning from Human Feedback (RLHF) could align language models with human intent. The three-step process:

1. **Supervised fine-tuning**: Train on human-written demonstrations
2. **Reward model training**: Human raters rank model outputs; train a reward model on these rankings
3. **PPO optimization**: Fine-tune the language model to maximize the reward model's score

InstructGPT (1.3B parameters with RLHF) was preferred by human raters over the base GPT-3 (175B parameters) -- alignment was worth more than 100x scale.

### ChatGPT (November 2022)

ChatGPT applied the InstructGPT methodology to GPT-3.5 and launched as a free chatbot. It crossed 100 million users in two months -- the fastest adoption of any consumer technology in history. The world changed.

## The Open-Weight Movement (2023)

### LLaMA (February 2023)

Meta released LLaMA (Large Language Model Meta AI) -- a family of models from 7B to 65B parameters. Though initially leaked rather than officially open-sourced, LLaMA catalyzed the open-weight movement:

- **LLaMA 7B** matched GPT-3 (175B) on many benchmarks
- Efficient training: 1T tokens on 2,048 A100 GPUs over 21 days
- Spawned an ecosystem of fine-tuned variants (Alpaca, Vicuna, WizardLM)

### The Open-Weight Ecosystem

| Model Family | Organization | Parameters | License | Key Contribution |
|-------------|-------------|------------|---------|-----------------|
| LLaMA 2 | Meta | 7-70B | Meta License | First large open-weight chat model |
| Mistral | Mistral AI | 7B | Apache 2.0 | Best 7B model (late 2023) |
| Qwen | Alibaba | 7-72B | Apache 2.0 | Multilingual; strong coding |
| Gemma | Google | 2-7B | Google License | Efficient small models |
| Phi | Microsoft | 1.3-3.8B | MIT | Research on small model capabilities |

## Diffusion Models and Multimodality

### DALL-E and Stable Diffusion

The Transformer's impact extended beyond language:

- **DALL-E (January 2021)**: OpenAI's text-to-image model using a discrete VAE + Transformer
- **DALL-E 2 (April 2022)**: CLIP-guided diffusion for higher quality generation
- **Stable Diffusion (August 2022)**: Stability AI's open-weight diffusion model -- democratized image generation
- **Midjourney**: Commercial image generation service that dominated aesthetic quality benchmarks

### The Diffusion Process

Diffusion models learn to reverse a noise-addition process:

1. **Forward process**: Gradually add Gaussian noise to an image until it becomes pure noise
2. **Reverse process**: Train a neural network to predict and remove the noise at each step
3. **Generation**: Start from pure noise and iteratively denoise to produce an image

The latent diffusion approach (Stable Diffusion) operates in a compressed latent space rather than pixel space, making generation 10-100x more efficient.

## Emergent Capabilities

### What Emergence Means

Capabilities that appear discontinuously as models scale -- absent at smaller sizes, present at larger sizes, without being explicitly trained:

- **Chain-of-thought reasoning**: Models can solve multi-step problems by generating intermediate reasoning steps
- **Code generation**: Models produce syntactically correct, functionally useful code
- **Multilingual transfer**: Training primarily on English produces capability in other languages
- **Theory of mind**: Limited ability to model other agents' beliefs and knowledge states

### The Emergence Debate

Whether these capabilities are truly "emergent" (discontinuous phase transitions) or "mirage" (smooth improvements that appear discontinuous due to evaluation metric thresholds) remains actively debated. Wei et al. (2022) documented over 100 emergent capabilities; Schaeffer et al. (2023) argued many are metric artifacts.

> **Related:** See [03-frontier-models](03-frontier-models.md) for what happened after the Transformer era matured, and [01-historical-foundations](01-historical-foundations.md) for the foundations that made this era possible.

## Summary

The Transformer era (2017-2023) produced the most rapid capability expansion in AI history: from 117M parameters (GPT-1) to 175B (GPT-3), from text completion to instruction following, from language-only to multimodal generation. The scaling laws revealed that intelligence is a function of carefully structured information, and that function has a predictable shape. ChatGPT's 100 million users in two months demonstrated that the technology was ready for the world. The open-weight movement ensured it would not be controlled by any single organization.
