# Historical Foundations (1943-2017)

## Overview

The history of artificial intelligence is not a straight line upward. It is a series of breakthroughs, winters, and rediscoveries -- each era building on insights that the previous era generated but could not yet exploit. This module traces the arc from McCulloch-Pitts to deep learning.

## The Neural Foundation (1943-1956)

### McCulloch-Pitts Neurons (1943)

Warren McCulloch and Walter Pitts published "A Logical Calculus of the Ideas Immanent in Nervous Activity" -- the first mathematical model of a neuron. Key properties:

- Binary threshold units: fire (1) or don't (0)
- Weighted inputs with summation
- Proved that networks of such units can compute any Boolean function
- Established the connection between neural computation and formal logic

### Hebb's Learning Rule (1949)

Donald Hebb proposed that synaptic connections strengthen when neurons fire together: "Cells that fire together, wire together." This is the conceptual ancestor of all gradient-based learning.

### The Perceptron (1958)

Frank Rosenblatt built the Mark I Perceptron at the Cornell Aeronautical Laboratory -- the first machine that could learn from data. A single-layer network that adjusts weights via the perceptron learning rule. It could learn to classify linearly separable patterns.

### The Dartmouth Conference (1956)

John McCarthy, Marvin Minsky, Nathaniel Rochester, and Claude Shannon organized the Dartmouth Summer Research Project on Artificial Intelligence -- the founding event that gave the field its name. The proposal's opening claim: "every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it."

## The Symbolic Era and First Winter (1956-1986)

### Symbolic AI's Promise

The 1960s were dominated by symbolic AI -- programs that manipulated symbols and rules rather than learning from data:

- **ELIZA (1966)**: Joseph Weizenbaum's conversational program using pattern matching
- **SHRDLU (1970)**: Terry Winograd's natural language system for a blocks world
- **Expert systems**: Rule-based systems that captured human expertise (MYCIN for medical diagnosis, DENDRAL for chemistry)

### Minsky's Perceptron Critique (1969)

Marvin Minsky and Seymour Papert published *Perceptrons*, proving that single-layer perceptrons cannot learn the XOR function -- a non-linearly-separable problem. The book's impact was devastating: neural network research funding collapsed. The proof was mathematically correct but its implied conclusion -- that multi-layer networks were equally limited -- was wrong.

### AI Winter I (1974-1980)

The DARPA-funded Speech Understanding Research program failed to meet its goals. The Lighthill Report (1973) in the UK concluded that AI had failed to deliver on its promises. Funding dried up. The field contracted.

### Expert Systems Boom and Bust (1980-1987)

Expert systems briefly revived commercial interest. R1/XCON at DEC saved $40 million annually. Japan launched the Fifth Generation Computer project. But expert systems were brittle, expensive to maintain, and could not learn from data. The Japanese project failed. Expert system companies collapsed. AI Winter II began.

## The Neural Renaissance (1986-2012)

### Backpropagation Returns (1986)

Rumelhart, Hinton, and Williams published "Learning representations by back-propagating errors" in *Nature*. Backpropagation -- the algorithm for computing gradients through multi-layer networks -- had been discovered independently by several researchers (Werbos 1974, Linnainmaa 1970), but this paper demonstrated its practical power for learning internal representations. The multi-layer networks that Minsky had implicitly dismissed could now be trained.

### Key Milestones (1986-2012)

| Year | Milestone | Significance |
|------|-----------|-------------|
| 1986 | Backpropagation in Nature | Multi-layer networks become trainable |
| 1989 | Universal Approximation Theorem | Proves one-hidden-layer networks can approximate any function |
| 1989 | LeNet-1 (Yann LeCun) | First CNN trained with backprop for digit recognition |
| 1995 | Support Vector Machines | Vapnik's kernel methods offer strong theoretical guarantees |
| 1997 | LSTM (Hochreiter & Schmidhuber) | Solves vanishing gradient for sequence modeling |
| 1997 | Deep Blue beats Kasparov | Brute-force search, not learning -- but public milestone |
| 2006 | Deep Belief Networks (Hinton) | Layer-wise pretraining enables deeper networks |
| 2011 | Watson wins Jeopardy! | NLP + search + reasoning on unstructured text |

### The Long Wait

Despite these advances, neural networks remained a niche approach through the 1990s and 2000s. SVMs and random forests dominated machine learning competitions. The key missing ingredients were:

- **Compute**: GPUs had not yet been repurposed for neural network training
- **Data**: Large labeled datasets like ImageNet (2009, 14 million images) did not yet exist
- **Techniques**: Dropout (2012), batch normalization (2015), and residual connections (2015) had not been invented

## The Deep Learning Revolution (2012-2017)

### AlexNet (2012)

Alex Krizhevsky, Ilya Sutskever, and Geoffrey Hinton entered a deep convolutional neural network in the ImageNet Large Scale Visual Recognition Challenge (ILSVRC). AlexNet achieved a top-5 error rate of 15.3% -- nearly half the 26.2% error of the second-place entry. The world blinked.

Key innovations:
- **GPU training**: Two NVIDIA GTX 580 GPUs (3GB VRAM each)
- **ReLU activation**: Faster training than sigmoid/tanh
- **Dropout regularization**: Prevents overfitting in large networks
- **Data augmentation**: Translation, reflection, and PCA color augmentation

### The ImageNet Cascade

AlexNet triggered an avalanche of deeper, better architectures:

| Year | Architecture | Depth | Top-5 Error | Key Innovation |
|------|-------------|-------|-------------|----------------|
| 2012 | AlexNet | 8 | 15.3% | GPU training |
| 2014 | VGGNet | 19 | 7.3% | Uniform 3x3 convolutions |
| 2014 | GoogLeNet | 22 | 6.7% | Inception modules |
| 2015 | ResNet | 152 | 3.6% | Residual connections |
| 2016 | DenseNet | 264 | -- | Dense connections |

ResNet's residual connections -- skip connections that allow gradients to flow through identity mappings -- solved the degradation problem that had limited network depth. A 152-layer ResNet outperformed a human baseline (5.1% error).

### Beyond Vision

Deep learning rapidly expanded beyond image classification:

- **Machine translation**: Sequence-to-sequence models with attention (Bahdanau 2014)
- **Speech recognition**: Deep neural networks replaced GMM-HMM systems (Hinton et al. 2012)
- **Game playing**: AlphaGo defeated Lee Sedol at Go (March 2016) -- a decade ahead of expert predictions
- **Generative models**: Generative Adversarial Networks (Goodfellow 2014); Variational Autoencoders (Kingma 2014)

## The Stage Is Set (2017)

By 2017, the ingredients for the next revolution were all in place:

- **Attention mechanisms**: Bahdanau attention (2014) showed that models could learn to focus on relevant parts of the input
- **GPU compute**: NVIDIA V100 with Tensor Cores (2017) delivered 125 TFLOPS
- **Large datasets**: Common Crawl, Wikipedia, BookCorpus provided billions of tokens
- **Optimization**: Adam optimizer (2014), learning rate scheduling, gradient clipping

On June 12, 2017, Vaswani et al. submitted "Attention Is All You Need" to NeurIPS. The Transformer architecture replaced recurrence with self-attention. Everything that followed -- GPT, BERT, Claude, Gemini, the entire modern AI landscape -- descends from this paper.

> **Related:** See [02-transformer-era](02-transformer-era.md) for what happened after the Transformer arrived, and [06-college-integration](06-college-integration.md) for how these historical eras map to the eight-layer mathematical progression.

## Summary

The history of AI is a 74-year arc from McCulloch-Pitts to the Transformer, punctuated by two winters caused by overpromising on architectures with genuine but limited scope. The field's chronic pattern -- hype, winter, rediscovery -- repeats because each era's practitioners did not understand the mathematical structure of what they were building. AlexNet in 2012 broke the pattern not through a new idea but through the convergence of three existing ones: GPUs, data, and deep networks. The Transformer in 2017 completed the foundation.
