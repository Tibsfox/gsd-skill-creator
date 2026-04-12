# Search and Query: Asking for the Right Data
*— the languages, rankings, and interfaces through which humans and programs make their requests intelligible to machines —*

Storage answers the question *where is the data*; search and query answer the question *which data do I actually want*. Every retrieval system, from the 1970s relational database to the retrieval-augmented language models of the 2020s, is a negotiation between two parties who rarely speak the same language. On one side stands a user with a need, often ambiguous, sometimes only half-formed. On the other sits a machine that understands only what it has been told to understand. The history of search and query is the history of building and rebuilding that translation layer: declarative languages, ranking functions, optimizers, rerankers, and — most recently — learned models that bridge natural language and indexed bits.

## SQL: The Language That Outlived Its Killers

Structured Query Language began as SEQUEL, the Structured English Query Language, described by Donald Chamberlin and Raymond Boyce in their 1974 paper "SEQUEL: A Structured English Query Language," presented at the ACM SIGFIDET workshop on data description, access, and control. The language was built at IBM's San Jose Research Laboratory to manipulate data stored in System R, IBM's experimental relational database, which had grown out of Edgar Codd's 1970 relational model. Boyce died of a ruptured brain aneurysm in 1974 at the age of 26, shortly after presenting the paper; Chamberlin carried the project forward. The name was eventually shortened to SQL because "SEQUEL" was a trademark of the Hawker-Siddeley aircraft company.

SQL's genius was declarative expression. Rather than telling the system *how* to retrieve records (navigate this index, follow that pointer), a SQL query specified *what* the user wanted, leaving the *how* to an optimizer. ANSI standardized SQL in 1986 (SQL-86), and subsequent revisions layered in progressively richer features: integrity constraints (SQL-89), a richer type system and outer joins (SQL-92), objects and triggers (SQL:1999), window functions and common table expressions (SQL:2003), XML (SQL:2006), temporal features (SQL:2011), and native JSON support (SQL:2016). Each generation of "SQL killers" — object databases in the 1990s, XML databases in the early 2000s, the NoSQL wave of the late 2000s — faded while SQL absorbed the features that made its challengers attractive. The reason is simple: declarative queries over a well-defined algebra are *composable*, and composability is the property software engineers trade everything else for.

## Query Planning: NP-Hardness as a Daily Problem

Declarative queries are only useful if the system can choose an efficient execution plan. The foundational paper on query optimization is Selinger, Astrahan, Chamberlin, Lorie, and Price's 1979 SIGMOD paper, "Access Path Selection in a Relational Database Management System," which described how IBM's System R chose access paths for simple and complex queries. Selinger's optimizer introduced cost-based optimization: for each query, estimate the cost of alternative plans using statistics about table cardinalities and column selectivities, and pick the cheapest. It also introduced *interesting orders* — an ordering that is cheap to maintain because a later operator can exploit it — and dynamic programming over left-deep join trees.

The core problem is algorithmically brutal. Optimal join ordering for a query with *n* relations is NP-hard in the general case; the number of possible bushy join trees grows super-exponentially. Real optimizers prune aggressively, using heuristics like *left-deep only*, limits on the search depth, and aggressive cardinality estimation. Goetz Graefe's 1995 paper "The Cascades Framework for Query Optimization" described a principled, rule-based extensible optimizer that became the foundation of Microsoft SQL Server and Tandem's NonStop SQL, and later influenced Apache Calcite, CockroachDB, and Greenplum Orca. Cascades decomposed the optimizer into a search engine plus rule sets for logical equivalences and physical implementations, allowing new operators and cost models to be plugged in without rewriting the core.

Cardinality estimation remains the Achilles heel of cost-based optimization. Histograms, sampling, sketches, and Bayesian networks have all been tried; none survive contact with correlated predicates on real data. Since roughly 2018, *learned query optimizers* — Neo, Bao, Balsa, and the neural cost models from MIT and Microsoft — have demonstrated that reinforcement learning can outperform hand-tuned optimizers on specific workloads. Deployment has been cautious: a learned optimizer that regresses on a single critical query is worse than a deterministic one that is merely mediocre.

## NoSQL and the Proliferation of Query Dialects

When the NoSQL wave broke in the late 2000s, each system invented its own query language, usually arguing that SQL was a poor fit for its data model. MongoDB shipped a JSON-like `find` interface and later an aggregation pipeline built from ordered stages (`$match`, `$group`, `$project`, `$lookup`). CouchDB introduced views built from map-reduce functions written in JavaScript. Cassandra kept closer to tradition with CQL, a SQL-flavored dialect over wide-column tables. DynamoDB exposed low-level Query and Scan APIs tied to its key structure. Redis has its own command set, as does HBase, as does every NoSQL store of significant size.

The cost of this diversity was paid by every engineer trying to remember which fragment of which dialect does what. The market's answer, over the last decade, has been a quiet return to SQL: MongoDB added a SQL compatibility layer; Cassandra's CQL grew richer; DynamoDB added PartiQL; cloud warehouses converged on ANSI SQL with proprietary extensions. The lingua franca wins again.

## Graph Query: Gremlin, Cypher, SPARQL, GQL

Graph databases needed languages for graph traversals, where the central operation is walking edges rather than joining rows. Apache TinkerPop's Gremlin offered an imperative traversal DSL. Neo4j's Cypher, invented by Andrés Taylor in 2011 and later opened up via the openCypher project in 2015, uses ASCII-art patterns like `(a:Person)-[:KNOWS]->(b:Person)` to express graph patterns declaratively. In the RDF world, SPARQL was developed by the W3C RDF Data Access Working Group, becoming a W3C Recommendation in 2008, with SPARQL 1.1 following in 2013; it queries triple stores with subject-predicate-object patterns and supports federated queries across endpoints.

After years of committee work, ISO/IEC 39075:2024 (GQL) was published on 12 April 2024 as the international standard for graph query languages, drawing heavily from Cypher syntax. GQL is the first new ISO database-language standard since SQL itself, and its approval marks the moment graph query crossed from vendor curiosity into first-class data infrastructure.

## Full-Text Search: From SMART to BM25

The information retrieval tradition began not with databases but with libraries and documents. Gerard Salton's SMART system (System for the Mechanical Analysis and Retrieval of Text) was initiated at Harvard in the early 1960s and moved with Salton to Cornell, where it became the research vehicle for nearly every idea in classical IR: the vector space model, relevance feedback, Rocchio classification, and term weighting. By 1971, SMART was producing retrieval performance comparable to human indexers. Salton's 1975 paper with Wong and Yang, "A Vector Space Model for Automatic Indexing," formalized the approach of treating documents and queries as weighted vectors and ranking by cosine similarity.

Karen Spärck Jones, working at Cambridge, published "A Statistical Interpretation of Term Specificity and Its Application in Retrieval" in the *Journal of Documentation* in 1972. This paper introduced inverse document frequency (IDF), the observation that terms appearing in few documents carry more information than terms appearing in many. IDF has no deep theoretical foundation — Spärck Jones herself noted only a loose tie to Zipf's law — yet it became the most important weight in information retrieval. By 2007, she could note that "pretty much every web engine uses those principles."

Stephen Robertson, Karen Spärck Jones, and colleagues developed the probabilistic relevance framework at City University London through the 1980s and into the 1990s. Robertson and Walker's 1994 SIGIR paper, "Some Simple Effective Approximations to the 2-Poisson Model for Probabilistic Weighted Retrieval," introduced BM25, the ranking function that became the de facto standard for lexical search. BM25 combines term frequency saturation (diminishing returns from repeated term occurrences) with document length normalization and IDF weighting. Thirty years later, BM25 remains competitive with far more sophisticated models on many benchmarks — a testament to how well-tuned the hand-crafted formula is.

## Search Engines: The Lucene Ecosystem

Doug Cutting wrote Apache Lucene in 1999. It was his fifth search engine — he had written two at Xerox PARC, one at Apple, and a fourth at Excite — and by far the most influential. Lucene joined the Apache Software Foundation's Jakarta project in September 2001 and became a top-level Apache project in February 2005. Its inverted-index file format, tokenizer framework, and query parser became the substrate on which nearly every open-source search product would be built.

Solr, created by Yonik Seeley in 2004, wrapped Lucene in an HTTP-accessible server with schema management, faceting, and replication. Elasticsearch followed in February 2010, when Shay Banon — who had earlier built a Lucene-based library called Compass in 2004 — open-sourced a distributed, schema-less, JSON-over-HTTP search server. Elasticsearch's ease of use and distribution model made it the dominant open-source search engine of the 2010s. After a 2021 licensing dispute, Amazon and the community forked OpenSearch from the last Apache-licensed Elasticsearch release. Newer entrants — Meilisearch, Typesense, Quickwit, Vespa — extend the ecosystem with different tradeoffs around typo-tolerance, schema flexibility, and columnar storage, but Lucene (via its descendants or direct use) underlies most production search in the open-source world.

## Web Search: PageRank and the Click Signal

AltaVista launched on December 15, 1995, built at Digital Equipment Corporation's Western Research Laboratory in Palo Alto, where Louis Monier and Michael Burrows used the Alpha 8400 TurboLaser to serve the first full-text, searchable index of the web. It received 300,000 hits on its first day. What distinguished Google was Sergey Brin and Lawrence Page's 1998 paper "The Anatomy of a Large-Scale Hypertextual Web Search Engine," published in *Computer Networks* volume 30, issues 1-7, which introduced PageRank: a link-based importance measure computed by finding the stationary distribution of a random walk on the web graph. PageRank encoded the intuition that a page is important if important pages link to it. Combined with anchor text, text-match features, and clever index layout, it produced search results that felt qualitatively better than anything before.

Classical PageRank has long since been joined by hundreds of other signals in modern web search: clickstream features, dwell time, query reformulation patterns, personalization, freshness, spam penalties, and more. Pandu Nayak, then VP of Search, announced on October 25, 2019 that Google had deployed BERT — Devlin et al.'s 2018 Bidirectional Encoder Representations from Transformers — across roughly one in ten English queries, the largest upgrade to Google Search in five years. BERT let the ranker finally understand the role of prepositions and polysemous words in natural-language queries like "2019 brazil traveler to usa need a visa."

## Semantic Search and Dense Retrieval

The semantic-search ambition predates deep learning by decades. Scott Deerwester, Susan Dumais, George Furnas, Thomas Landauer, and Richard Harshman's 1990 paper "Indexing by Latent Semantic Analysis" in the *Journal of the American Society for Information Science* introduced LSI: factorize the term-document matrix with truncated SVD into roughly 100 latent factors, and documents that share no exact terms can still be close in the latent space. LSI worked, but only at small scale, and was eclipsed for years by classical BM25 until the word-embedding revolution rekindled interest.

Tomas Mikolov and colleagues at Google published the word2vec papers in 2013, showing that a shallow neural network trained to predict word contexts produced vector representations where semantic and syntactic relationships became vector arithmetic. Word2vec proved that dense, distributed word representations could be learned at scale. BERT (2018) pushed further: contextual embeddings where the vector for a token depends on its surrounding sentence. In 2019 Google deployed BERT in search as a reranker. In 2020 it was used as a *retriever*.

Two 2020 papers mark the transition to dense retrieval as a serious alternative to BM25. Karpukhin et al.'s "Dense Passage Retrieval for Open-Domain Question Answering" (EMNLP 2020, usually called DPR) trained two BERT encoders — one for queries, one for passages — and showed that dot-product similarity over these embeddings outperformed BM25 by 9-19 points in top-20 retrieval accuracy on open-domain QA datasets. Omar Khattab and Matei Zaharia's "ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT" (SIGIR 2020) kept per-token embeddings and computed a MaxSim late-interaction score, recovering much of the accuracy of full cross-encoders at a fraction of the cost. The bi-encoder versus cross-encoder split became the axis along which retrieval pipelines are now designed: fast bi-encoders for first-stage retrieval, expensive cross-encoders for rerank.

Nandan Thakur and colleagues published BEIR (Benchmarking-IR) in 2021, a heterogeneous benchmark of 18 retrieval datasets designed to test zero-shot generalization. BEIR delivered an uncomfortable finding: out of the box, BM25 beat many dense retrievers on out-of-domain data. Dense retrieval was not a free upgrade; it was a tradeoff.

## Hybrid Retrieval and Learning to Rank

Practitioners responded by hybridizing. Gordon Cormack, Charles Clarke, and Stefan Buettcher's 2009 SIGIR paper "Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods" introduced RRF, which scores each document as the sum of `1/(k + rank)` across result lists, with `k=60` in the original paper. RRF is almost embarrassingly simple yet consistently outperforms more elaborate fusion schemes. Modern hybrid search pipelines run BM25 and a dense retriever in parallel, then fuse with RRF. The SPLADE family (2021 onward) learns sparse representations that expand queries and documents with related terms, producing BM25-compatible postings that capture semantic matches — a kind of dense-sparse reconciliation at the index level.

Learning-to-rank has its own history. Christopher Burges and colleagues at Microsoft Research introduced RankNet (2005), LambdaRank (2006), and LambdaMART, which optimize pairwise ranking losses with gradient-boosted decision trees. An ensemble of LambdaMART rankers won Track 1 of the 2010 Yahoo Learning-to-Rank Challenge, and LambdaMART remained the industry-standard learning-to-rank model well into the deep learning era. Modern pipelines typically stack a BM25 or dense first-stage retriever, a learning-to-rank middle stage, and a BERT-based cross-encoder at the top of the funnel.

## RAG: Retrieval Meets Generation

Patrick Lewis and eleven co-authors at Facebook AI Research published "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" at NeurIPS 2020, introducing RAG: a pretrained sequence-to-sequence model paired with a dense Wikipedia index accessed via a DPR retriever, fine-tuned end-to-end. RAG produced more specific, diverse, and factual generations than parametric-only seq2seq baselines, and set state of the art on three open-domain QA tasks. The 2023-2024 RAG explosion built on this idea but without the end-to-end training: a frozen large language model plus a retriever plus a prompt template became the default way to ground LLM output in private or timely knowledge.

RAG surfaced a new set of retrieval problems. Chunking strategies (fixed-size, semantic, hierarchical, proposition-level) govern what unit is indexed. Query rewriting expands or reformulates the user's question before retrieval. HyDE (Hypothetical Document Embeddings) generates a hypothetical answer and searches with its embedding, often outperforming the raw query. Re-ranking pipelines use a cross-encoder to prune the top-100 to a top-10 before the LLM sees anything. None of these are exotic; they are the classical IR playbook applied to a new consumer.

## Query Understanding and the Personalization Shift

The user side of search has its own long history. Autocomplete, spelling correction, synonym expansion, and query intent classification all try to close the gap between what a user typed and what they meant. Modern query understanding uses transformer models to classify intent (navigational, informational, transactional, local), extract entities, and choose between vertical search indexes. Personalization layers a user model onto the query: history, location, device, time of day. The benefit is relevance; the cost, as Eli Pariser named it in 2011, is the filter bubble — a retrieval system that increasingly tells each user only what they already want to hear. Whether personalization is net-positive for information quality is no longer a purely technical question.

## Where the Story Points

Search and query is the interface where human intent meets indexed data, and every era has built the interface it could afford. SQL gave declarative composition over structured data. BM25 gave principled ranking over free text. PageRank added the graph of the web. Dense retrieval added learned semantics. RAG added generation on top. Each layer kept the ones beneath it: a modern retrieval pipeline is not dense *or* sparse *or* rule-based, it is all three, fused and reranked. The interesting question for the next decade is not which ranking function wins, but how we build query interfaces that let users *describe what they want* precisely enough that a system with all this machinery can actually deliver it.

## Sources

- [Donald Chamberlin and Raymond Boyce Develop SEQUEL, 1974 — History of Information](https://www.historyofinformation.com/detail.php?id=910)
- [SEQUEL: A Structured English Query Language (1974 PDF)](https://s3.us.cloud-object-storage.appdomain.cloud/res-files/2705-sequel-1974.pdf)
- [Selinger et al., Access Path Selection in a Relational Database Management System (SIGMOD 1979)](https://courses.cs.duke.edu/compsci516/cps216/spring03/papers/selinger-etal-1979.pdf)
- [Graefe, The Cascades Framework for Query Optimization (1995)](https://15721.courses.cs.cmu.edu/spring2016/papers/graefe-ieee1995.pdf)
- [SMART Information Retrieval System — Wikipedia](https://en.wikipedia.org/wiki/SMART_Information_Retrieval_System)
- [Gerard Salton — Wikipedia](https://en.wikipedia.org/wiki/Gerard_Salton)
- [Vector Space Model — Wikipedia](https://en.wikipedia.org/wiki/Vector_space_model)
- [The Spärck Jones / Robertson IDF page (City University London)](https://www.staff.city.ac.uk/~sbrp622/idf.html)
- [Karen Spärck Jones — Wikipedia](https://en.wikipedia.org/wiki/Karen_Sp%C3%A4rck_Jones)
- [Okapi BM25 — Wikipedia](https://en.wikipedia.org/wiki/Okapi_BM25)
- [Robertson, The Probabilistic Relevance Framework: BM25 and Beyond](https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf)
- [Apache Lucene — Wikipedia](https://en.wikipedia.org/wiki/Apache_Lucene)
- [Celebrating 20 years of Apache Lucene — Elastic](https://www.elastic.co/celebrating-lucene)
- [Elasticsearch — Wikipedia](https://en.wikipedia.org/wiki/Elasticsearch)
- [AltaVista — Wikipedia](https://en.wikipedia.org/wiki/AltaVista)
- [Brin and Page, The Anatomy of a Large-Scale Hypertextual Web Search Engine (1998)](http://infolab.stanford.edu/pub/papers/google.pdf)
- [Deerwester et al., Indexing by Latent Semantic Analysis (1990)](http://wordvec.colorado.edu/papers/Deerwester_1990.pdf)
- [Google Search BERT deployment announcement, October 2019 — Washington Post](https://www.washingtonpost.com/technology/2019/10/25/google-is-making-big-change-its-vaunted-search-engine-you-might-not-notice/)
- [Karpukhin et al., Dense Passage Retrieval for Open-Domain Question Answering (EMNLP 2020)](https://aclanthology.org/2020.emnlp-main.550/)
- [Khattab and Zaharia, ColBERT (SIGIR 2020) — Facebook/DPR repository](https://github.com/facebookresearch/DPR)
- [Thakur et al., BEIR: A Heterogenous Benchmark for Zero-shot Evaluation of IR Models (2021)](https://arxiv.org/abs/2104.08663)
- [Cormack, Clarke, and Buettcher, Reciprocal Rank Fusion (SIGIR 2009)](https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf)
- [Lewis et al., Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (NeurIPS 2020)](https://proceedings.neurips.cc/paper/2020/file/6b493230205f780e1bc26945df7481e5-Paper.pdf)
- [Cypher (query language) — Wikipedia](https://en.wikipedia.org/wiki/Cypher_(query_language))
- [Graph Query Language (GQL) — Wikipedia](https://en.wikipedia.org/wiki/Graph_Query_Language)
- [GQL: The ISO Standard for Graphs Has Arrived — Neo4j](https://neo4j.com/blog/cypher-and-gql/cypher-path-gql/)

## Study Guide — Search & Query

### Query languages

- SQL, Cypher, GQL, SPARQL, PromQL.
- BM25, TF-IDF (classic scoring).
- Dense retrieval, ColBERT, hybrid search.

## DIY — Implement BM25

50 lines of Python. Index 100 documents, run queries.

## TRY — Build a hybrid search

Combine BM25 (keyword) with pgvector (semantic). Score
blend with Reciprocal Rank Fusion.
- [Burges, From RankNet to LambdaRank to LambdaMART: An Overview (Microsoft Research)](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/MSR-TR-2010-82.pdf)
