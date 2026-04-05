# M9: ML Drug Discovery — The Broad Institute Symposium

## When the Lab Becomes an Algorithm

The Broad Institute's Machine Learning in Drug Discovery Symposium (2025) represents a watershed: not AI as a tool for drug discovery, but AI as the discovery process itself. Tom Miller's keynote framing is explicit — "developing AI-based scientists that can now use those tools flexibly." The tools are foundation models spanning molecules, proteins, cells, and patients. The scientist is an LLM-based orchestrator. The lab is computational.

This is the clearest evidence yet that drug discovery — a multi-hundred-billion-dollar professional practice employing hundreds of thousands of chemists, biologists, and clinicians — is undergoing a paradigm shift analogous to what CAD did to mechanical engineering or electronic trading did to finance.

---

## The Keynote: Tom Miller and IM Therapeutics

### AI-Driven Drug Discovery as a Clinical Reality

Tom Miller (co-founder and CEO of IM Therapeutics; former professor at the California Institute of Technology for over 10 years) presented the keynote. IM Therapeutics is described as "a clinical-stage biotechnology company disrupting the therapeutics landscape with a unique artificial intelligence-driven drug discovery pipeline."

The key distinction: this is not academic research. IM Therapeutics has drugs in clinical trials that were discovered by AI. The company's pipeline spans from molecular design through preclinical validation to human trials. The AI system is not an assistant to human chemists — it is the primary discovery engine.

### The Two-Layer Architecture

Miller describes two requirements for AI-driven drug discovery:

1. **Tools:** Foundation models across biological scales, knowledge bases, datasets. "The analogy for 'we need a lab' means that we need tools — tools for AI are different types of foundation models and other types of tools or data sets and knowledge bases."

2. **Scientists:** "Large language models that can orchestrate and work with those tools." The LLM serves as the reasoning layer that selects which foundation model to query, interprets results, designs follow-up experiments, and proposes hypotheses.

### Four Biological Scales

The Broad group's foundation models span four levels:

| Scale | Focus | Architecture Class |
|-------|-------|-------------------|
| **Molecular** | Small molecule properties, drug-likeness, binding affinity | Graph neural networks, molecular transformers |
| **Protein** | Structure prediction, function annotation, binding site identification | ESM-class sequence models, structure predictors (AlphaFold descendants) |
| **Cellular** | Phenotypic responses to perturbation, gene expression profiles | Vision transformers (microscopy), sequence models (transcriptomics) |
| **Patient** | Clinical outcomes, treatment response, adverse events | Multimodal clinical record models |

The orchestration layer connects across scales: a question about a drug candidate requires molecular-level property prediction, protein-level target interaction modeling, cell-level efficacy estimation, and patient-level safety and outcomes prediction. No single model covers this — the LLM agent routes queries to the appropriate specialist model.

---

## Marinka Zitnik: Knowledge Graphs for Drug Repurposing

### Reasoning Over Biomedical Knowledge

Marinka Zitnik (Harvard, formerly Stanford) builds heterogeneous knowledge graphs that connect drugs, protein targets, diseases, biological pathways, side effects, and literature evidence. The graphs enable:

- **Drug repurposing:** Identifying existing approved drugs that may treat diseases they weren't designed for, by traversing graph connections
- **Side effect prediction:** Modeling polypharmacy (multiple drug interactions) through graph-level reasoning
- **Target identification:** Finding new protein targets for known diseases by identifying pathway connections

**Technical approach:** Graph neural networks that learn node and edge representations from the heterogeneous graph, combined with LLM agents that traverse the graph to answer complex multi-hop questions. The knowledge graph serves as a structured external memory for the AI scientist.

### Key Insight: Compositional Reasoning

Drug discovery requires compositional reasoning — understanding that drug A inhibits protein B, which regulates pathway C, which is dysregulated in disease D. This is fundamentally a graph traversal problem. Zitnik's work shows that GNN + LLM architectures can perform this reasoning at scales (millions of nodes, tens of millions of edges) that exceed human cognitive capacity.

---

## Francesca Grisoni: Generative Chemistry

### Molecular Design as a Design Problem

Francesca Grisoni approaches drug discovery as a generative design problem: given a target property profile (binding affinity, solubility, toxicity, metabolic stability), generate novel molecular structures that satisfy the profile. This inverts the traditional approach of screening existing compound libraries.

**Generative architectures:**
- **Variational Autoencoders (VAEs):** Encode molecules into a continuous latent space, then decode from the latent space conditioned on desired properties. The latent space enables interpolation between known active molecules.
- **Diffusion models:** Generate 3D molecular coordinates directly, conditioned on target binding site geometry. This incorporates spatial reasoning that SMILES-based approaches miss.
- **Transformer-based generators:** Autoregressive generation of SMILES strings with property-conditioned sampling. Leverages the enormous success of transformer architectures in language modeling.

**Key shift:** Drug design is no longer a search problem (enumerate and screen) — it is a generation problem (specify and synthesize). This changes the economics: instead of screening millions of compounds to find a few hits, generate a focused library of high-probability candidates.

### Chemical Validity and Synthesizability

A critical challenge: generated molecules must be synthesizable. Grisoni's work incorporates synthetic accessibility scores and retrosynthetic analysis into the generative process — the model learns not just to generate molecules with desired properties, but molecules that can actually be made in a chemistry lab.

---

## Ava Amini: Foundation Models at the Molecular Scale

Ava Amini's talk focused on the molecular-level foundation models that serve as one of the four "tools" in Miller's framework. Key themes:

- **Molecular representation learning:** How to encode molecules (SMILES strings, molecular graphs, 3D coordinates) in ways that foundation models can reason about
- **Transfer learning in chemistry:** Pre-training on large unlabeled molecular datasets (ChEMBL, PubChem) enables few-shot learning for specific drug discovery tasks
- **Uncertainty quantification:** Drug discovery decisions require not just predictions but confidence intervals — a model that predicts high binding affinity with low confidence is less useful than one that predicts moderate affinity with high confidence

---

## Technical Architecture

### The AI Scientist Stack

```
                    ┌─────────────────────┐
                    │   LLM Orchestrator   │  ← Hypothesis generation, experiment design,
                    │   (AI Scientist)     │     result interpretation, multi-step reasoning
                    └──────────┬──────────┘
                               │
        ┌──────────┬──────────┼──────────┬──────────┐
        │          │          │          │          │
   ┌────┴────┐ ┌───┴────┐ ┌───┴────┐ ┌───┴────┐ ┌──┴───┐
   │Molecular│ │Protein │ │ Cell   │ │Patient │ │Knowledge│
   │ Model   │ │ Model  │ │ Model  │ │ Model  │ │ Graph  │
   └─────────┘ └────────┘ └────────┘ └────────┘ └────────┘
        ↑          ↑          ↑          ↑          ↑
   ChEMBL/     UniProt/   Cell         EHR/      Literature/
   PubChem     PDB        Painting     Claims    DrugBank
```

### Generative Drug Design Pipeline

```
Target Profile → Property Conditioning → Molecular Generation → Filtering → Synthesis → Assay
  (Binding,       (Latent space         (VAE/Diffusion/       (ADMET,     (Wet lab    (Biological
   ADMET,          conditioning,         Transformer)          synthetic   validation)  validation)
   selectivity)    classifier guidance)                        access.)
```

### Key Metrics

| Metric | Value | Source |
|--------|-------|--------|
| IM Therapeutics stage | Clinical-stage | Miller keynote |
| Foundation model biological scales | 4 (molecular, protein, cell, patient) | Miller keynote |
| Knowledge graph scale | Millions of nodes, tens of millions of edges | Zitnik |
| Generative chemistry approaches | VAE, diffusion, transformer | Grisoni |
| Drug discovery economics shift | Screen millions → generate focused library | Grisoni |

---

## Key Quotes

> "The analogy for 'we need a lab' means that we need tools — and so tools for AI are different types of foundation models and other types of tools or data sets and knowledge bases." — Tom Miller

> "Large language models that can orchestrate and work with those tools... developing scientists that are AI-based scientists that now can use those tools flexibly." — Tom Miller

> "IM Therapeutics, a clinical-stage biotechnology company that is disrupting the therapeutics landscape with a unique artificial intelligence-driven drug discovery pipeline." — Introduction

---

## Cross-References

| Topic | Related QBS Modules | Related Projects |
|-------|-------------------|-----------------|
| AI scientist architecture | M7 (Synthesis) | LLM, AIH, GSD2 |
| Protein foundation models | M2 (Diamond Qubits — protein sensors) | PCS, BPS |
| Generative molecular design | M5 (Synthetic Cells) | ECO, BPS |
| Knowledge graphs | M3 (Precision Medicine) | CDS, LLM |
| Drug repurposing | M3 (Aging immune system) | BPS, ECO |
| Directed evolution comparison | Prior analysis (Spangler/JHU) | PCS |

## College Department Mappings

| Department | Connection |
|-----------|-----------|
| **Mind-Body** | Drug discovery for neurological diseases; AI scientist as cognitive model; the tension between computational design and biological complexity |
| **Mathematics** | Graph neural networks (spectral graph theory); variational inference (VAEs); diffusion processes (score-based generative models); optimization landscape navigation |
| **Culinary Arts** | Generative chemistry = recipe design (specify desired flavors → generate ingredient combinations); retrosynthetic analysis = working backward from desired dish to available ingredients; foundation models as cookbook knowledge |

## Study Topics

1. How does the LLM orchestrator decide which foundation model to query for a given question?
2. What is the false positive rate for knowledge-graph-based drug repurposing, and how does it compare to traditional high-throughput screening?
3. How do diffusion models for 3D molecular generation handle chirality and stereochemistry?
4. What training data scale is required for each biological-scale foundation model?
5. How does IM Therapeutics validate AI-discovered drug candidates before clinical trials?
6. What is the role of retrosynthetic analysis in constraining generative chemistry outputs?

## TRL Assessment

| Technology | TRL | Rationale |
|-----------|-----|-----------|
| AI-driven drug discovery (end-to-end) | 7 | IM Therapeutics in clinical trials |
| Molecular foundation models | 5-6 | Validated on benchmark datasets, used in industry pipelines |
| Protein structure prediction (AlphaFold-class) | 7 | Widely deployed in research and industry |
| Knowledge graph drug repurposing | 4-5 | Retrospective validation, limited prospective evidence |
| Generative chemistry (VAE/diffusion) | 4-5 | Validated in silico, early wet-lab confirmation |
| LLM-based AI scientist orchestration | 3-4 | Research prototypes, not yet autonomous in practice |
