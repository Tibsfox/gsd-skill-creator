// === memory-retrieval domain prompts ===
//
// Boundaries:
//   IN  — long-context modeling, RAG architectures, knowledge graphs,
//         embedding strategies, context compression, attention modifications
//         targeting long sequences, memory-augmented transformers.
//   OUT — vector database engineering with no modeling contribution; pure
//         systems papers about indexing without a learning component.

export const MEMORY_RETRIEVAL_ANCHOR = `
Long-context modeling, retrieval, and memory: long-context language models
(million-token contexts), retrieval-augmented generation (RAG) architectures,
knowledge graphs for retrieval, embedding strategies, context compression,
attention modifications targeting long sequences, memory-augmented
transformers, sparse and hierarchical attention for long inputs. Excludes
vector database engineering without a modeling contribution.
`.trim();

export const MEMORY_RETRIEVAL_SCORING_RUBRIC = `
Score 0.9-1.0: Core long-context or retrieval modeling contribution.
Score 0.7-0.8: Substantial RAG/memory/long-context component.
Score 0.4-0.6: Tangential retrieval or memory use.
Score 0.1-0.3: Mentions retrieval as part of pipeline without contribution.
Score 0.0: No long-context or memory relevance.
`.trim();

export const MEMORY_RETRIEVAL_DOMAIN_BLOCK = `
Domain: memory-retrieval
Definition: ${MEMORY_RETRIEVAL_ANCHOR}
Rubric:
${MEMORY_RETRIEVAL_SCORING_RUBRIC}
`.trim();
