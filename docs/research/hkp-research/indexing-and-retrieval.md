# Indexing and Retrieval: The Data Structures of Fast Lookup

*— how seventy years of combinatorial ingenuity turned linear scans into logarithmic, constant-time, and sub-linear miracles —*

## 1. The Fundamental Trade-Off

A database without an index is a filing cabinet without dividers: correct, but catastrophically slow. Given a table of *n* rows, the naive answer to *"where is the row with key k?"* is to read every row until you find it — an O(*n*) linear scan. For *n* = 10, this is trivial. For *n* = 10⁹, at 100 ns per comparison, it is 100 seconds. Databases, search engines, filesystems, and operating systems have therefore spent the last seven decades inventing auxiliary data structures — *indexes* — whose sole purpose is to convert O(*n*) search into something better, usually O(log *n*), sometimes O(1) amortized, and in the probabilistic case sub-linear with tunable error.

The trade-off is never free. Every index is a second copy of (part of) the data, sorted or hashed or bucketed in some way that makes lookup fast and insertion (slightly) slow. Donald Knuth's *The Art of Computer Programming*, volume 3 (1973), codified the central identity: you can optimize for *query time*, *update time*, or *space*, but you cannot minimize all three simultaneously. Pick two.

Formally, for a comparison-based search over a set of size *n*, the information-theoretic lower bound is ⌈log₂(*n* + 1)⌉ comparisons — the height of a balanced binary decision tree. For *n* = 10⁹ that is 30 comparisons, not 10⁹. The entire field of indexing is an elaborate engineering effort to approach that lower bound under real-world constraints: disk pages, cache lines, concurrent writers, partial failures, and hostile query patterns.

## 2. Hash Indexes: O(1) at a Price

Hashing is the oldest computer-science technique for associative lookup. The term itself was coined by Hans Peter Luhn at IBM in an internal memorandum dated 1 January 1953, describing a method to map arbitrary keys to small integer addresses. The core operation is a function *h*: *K* → [0, *m*), used to index directly into a table of *m* slots.

When two keys collide — *h*(*k*₁) = *h*(*k*₂) — you need a conflict-resolution strategy. Chaining, described by Arnold Dumey in 1956, stores a linked list at each slot. Open addressing, also from the 1950s, probes subsequent slots until an empty one is found. Linear probing is the simplest (probe slot *i* + 1, *i* + 2, ...) but suffers from *primary clustering*. Knuth's 1963 analysis of linear probing — the first major application of analytic combinatorics to algorithm analysis — showed that expected probe count grows as ½(1 + 1/(1 − α)²) where α is load factor, hinting at why real hash tables cap α around 0.75.

Pagh and Rodler's **cuckoo hashing** (2001) guarantees worst-case O(1) lookup by using two hash functions and two tables, kicking incumbents out of their nests during insertion. Celis, Larson, and Munro's **Robin Hood hashing** (1985) minimizes variance in probe length by having rich (low-probe-count) keys give way to poor ones. Both are used in modern in-memory data stores.

**Consistent hashing**, invented by David Karger, Eric Lehman, Tom Leighton, Rina Panigrahy, Matthew Levine, and Daniel Lewin at MIT in 1997 (STOC paper *"Consistent Hashing and Random Trees"*), solved a problem hash tables never faced: what happens when *m* itself changes? Traditional hashing remaps nearly every key when the table grows; consistent hashing remaps only *K*/*m* keys on average, making it the default technique for distributed caches (Akamai's original deployment, later Memcached, Cassandra, DynamoDB). Thaler and Ravishankar's **rendezvous hashing** (1996, also called highest random weight) is an elegant alternative that picks the node *n* maximizing *h*(*k*, *n*) and achieves the same rebalance property without a ring abstraction.

The price of hash indexes: they support only equality lookup. Range queries (`WHERE age BETWEEN 30 AND 40`) must fall back to a linear scan. This single limitation is why the database industry, despite hashing's O(1) appeal, standardized on trees.

## 3. B-Trees: The Database Industry's Workhorse

In July 1972 Rudolf Bayer and Edward McCreight, both at Boeing Scientific Research Laboratories in Seattle, published *"Organization and Maintenance of Large Ordered Indexes"* in *Acta Informatica*. The B-tree — the *B* officially stands for nothing, though Bayer later joked it might mean Boeing, balanced, or Bayer — was designed for one specific hardware reality: disks have *pages*, and reading a page costs the same whether you extract one byte or four kilobytes.

A B-tree of order *m* is a balanced search tree in which every node holds up to *m* − 1 keys and has up to *m* children, with the invariant that all leaves lie at the same depth. For a page size of 4 KB and keys of 16 bytes, *m* ≈ 200, so a tree with three levels addresses 200³ ≈ 8 million keys, and four levels reaches 1.6 billion — in four disk seeks. That is the magic. The height *h* satisfies

$$h \leq \log_{\lceil m/2 \rceil} \left(\frac{n+1}{2}\right) + 1$$

which for realistic *m* is essentially four or five regardless of how fat your database grows.

**B+ trees** — a variant in which internal nodes store only routing keys and all values live in a linked list of leaves — dominate every serious relational database: Oracle, PostgreSQL, MySQL/InnoDB, SQL Server, Db2, SQLite. The linked leaves make range scans cheap: find the starting key in O(log *n*), then walk the leaf list. **B\* trees**, Knuth's 1973 refinement, keep nodes at least ⅔ full by redistributing into siblings before splitting. **Prefix B-trees** (Bayer and Unterauer, 1977) compress common key prefixes in internal nodes, a technique used by InnoDB and WiredTiger today.

The B-tree is why `CREATE INDEX` is the single most common performance fix in SQL.

## 4. LSM Trees: Writes First

For workloads where writes vastly outnumber reads — log ingestion, time-series, IoT telemetry, the write path of every NoSQL store — B-trees are the wrong shape. In-place updates to leaf pages cause random-write IO, which on HDDs is two orders of magnitude slower than sequential write, and on SSDs accelerates wear.

The **Log-Structured Merge-Tree** (LSM tree), introduced by Patrick O'Neil, Edward Cheng, Dieter Gawlick, and Elizabeth O'Neil in the 1996 *Acta Informatica* paper *"The Log-Structured Merge-Tree (LSM-tree),"* flips the priorities. Writes land in an in-memory sorted structure (a memtable, typically a skip list or red-black tree), which periodically flushes to an immutable sorted run on disk — an SSTable, in Google's vocabulary. Background compaction merges runs to bound read amplification.

Two compaction strategies dominate. **Leveled compaction** (LevelDB, RocksDB default) organizes SSTables into levels *L₀, L₁, L₂, …* where each level is *k*× larger than the previous. Within a level, key ranges don't overlap, so a point lookup checks at most one file per level. Write amplification is roughly *k* × number of levels. **Tiered compaction** (Cassandra's SizeTieredCompactionStrategy) lets multiple overlapping runs coexist per level, trading higher read amplification for much lower write amplification.

**Bloom filters** (see §10) riding on each SSTable cut read amplification: before opening a file, check its Bloom filter and skip the file if the key is definitely absent. Google's LevelDB (2011) by Jeff Dean and Sanjay Ghemawat formalized the modern LSM interface; Facebook's **RocksDB** forked LevelDB in 2012 and is now the storage engine behind MyRocks, TiKV, CockroachDB, YugabyteDB, Kafka Streams state stores, and countless embedded systems.

## 5. Skip Lists: Probabilistic Balance

In 1990 William Pugh of the University of Maryland published *"Skip Lists: A Probabilistic Alternative to Balanced Trees"* in *Communications of the ACM*. The idea is simple: a sorted linked list is O(*n*) to search, but if you add a second layer where every second node is linked, search becomes O(*n*/2) per layer across two layers, or O(log *n*) with *log n* layers. Pugh chose levels randomly — each node promoted to level *i* + 1 with probability *p* (usually ½) — giving expected O(log *n*) search and insertion with no rebalancing rotations at all. The randomization provides balance with probability 1 − *n*⁻ᶜ for tunable *c*.

Skip lists are beloved by systems programmers because they are dramatically simpler to implement and make concurrent than red-black or AVL trees. Redis uses skip lists as the internal structure for sorted sets (`ZADD`, `ZRANGE`). LevelDB and RocksDB use them as the memtable. Apache Lucene uses skip lists inside posting lists to accelerate term intersection.

## 6. Tries and Radix Trees: The Shape of Strings

For string keys, prefix-structured trees — tries — beat hashing and B-trees on two axes: they enable prefix queries (autocomplete, routing tables) and they can share storage between keys with common prefixes. The name *trie* comes from *re**trie**val* (Edward Fredkin, 1960).

Donald Morrison's 1968 paper *"PATRICIA — Practical Algorithm To Retrieve Information Coded In Alphanumeric"* introduced the path-compressed binary trie: nodes with a single child are merged into their parent, labeled with the bit position at which branching occurs. PATRICIA tries underlie early routing tables (BSD's `radix.c`) and IP longest-prefix-match logic.

Modern in-memory databases have rediscovered tries through the **Adaptive Radix Tree** (ART) of Viktor Leis, Alfons Kemper, and Thomas Neumann (ICDE 2013, *"The Adaptive Radix Tree: ARTful Indexing for Main-Memory Databases"*). ART uses four node layouts (Node4, Node16, Node48, Node256) that adapt to local fanout, matching or beating a B+ tree on point lookups while supporting range scans and prefix queries. HyPer, DuckDB, and TimescaleDB use ART or close variants.

## 7. Inverted Indexes: The Foundation of Search

Full-text search is not equality lookup — it is set intersection over millions of document identifiers. The **inverted index**, traceable to concordances of biblical texts compiled by Cardinal Hugo de Saint-Cher in the 13th century and formalized for computers by Hans Peter Luhn again in the late 1950s, maps each term to a *posting list*: the sorted list of document IDs that contain the term.

A query `cat AND dog` becomes an intersection of two posting lists — a merge walk that is O(|cat| + |dog|). For common terms posting lists can contain hundreds of millions of IDs, so compression is essential. **Variable-byte encoding**, **gamma coding**, Frame-of-Reference, and **PForDelta** (Zukowski et al., 2006) exploit the small gaps between sorted document IDs. **Roaring bitmaps** (Lemire et al., 2016) represent posting sets as hybrid of bitmaps and sorted arrays, chosen per 16-bit chunk, and have largely supplanted plain compressed integers in modern search engines and OLAP systems (Apache Lucene 5+, Elasticsearch, Druid, ClickHouse).

Apache **Lucene**, begun by Doug Cutting in 1999, crystallized the segment-based architecture: writes append to small immutable segments that are periodically merged (compacted), identical in philosophy to an LSM tree. Lucene segments pair a term dictionary (a finite-state transducer since Lucene 4, courtesy Robert Muir and Michael McCandless) with per-term posting lists plus doc-values columns for sort/aggregate. Every Elasticsearch, OpenSearch, and Solr cluster on earth is a herd of Lucene segments.

## 8. Spatial Indexes: Indexing Geometry

Points in *d*-dimensional space need different structures. The **quadtree**, introduced by Raphael Finkel and Jon Bentley in 1974 (*"Quad Trees: A Data Structure for Retrieval on Composite Keys"*), recursively subdivides 2-D space into four quadrants until each contains at most *k* points. The **k-d tree**, introduced by Jon Bentley alone in 1975 (*"Multidimensional Binary Search Trees Used for Associative Searching"*, CACM), generalizes binary search trees by cycling through dimensions at each level — splitting on *x*, then *y*, then *z*, then *x* again.

For extended objects (rectangles, polygons), Antonin Guttman's **R-tree** (SIGMOD 1984, *"R-Trees: A Dynamic Index Structure for Spatial Searching"*) groups nearby objects into minimum bounding rectangles at each internal node, with overlap allowed. Norbert Beckmann et al.'s **R\*-tree** (1990) improves insertion heuristics to reduce overlap, dead space, and perimeter, and is the structure behind PostGIS, Oracle Spatial, SQLite R*Tree, and most GIS systems.

An orthogonal technique is the **space-filling curve**: map *d*-dimensional space to 1-D so you can use a regular B-tree. **Z-order** (Morton, 1966) interleaves bits of coordinates; **Hilbert curves** (Hilbert, 1891) preserve locality better. Google Bigtable uses row-key interleaving; BigQuery's clustering uses Hilbert-ordered storage. PostgreSQL's **GiST** (Generalized Search Tree, Hellerstein, Naughton, and Pfeffer, VLDB 1995) provides a single template that can be specialized to R-trees, range trees, or any "hierarchical decomposition" index, which is how Postgres ships dozens of index types (trigram, full-text, pg_trgm, ltree) behind one interface.

## 9. Vector / Approximate Nearest Neighbor Indexes

The explosion of machine-learning embeddings — sentence transformers, CLIP, image encoders, recommendation embeddings — makes *nearest neighbor in high dimensions* the defining query of the 2020s. In *d* = 768 dimensions, k-d trees collapse: the curse of dimensionality makes them only marginally better than linear scan.

**Locality Sensitive Hashing** (LSH), introduced by Piotr Indyk and Rajeev Motwani (STOC 1998, *"Approximate Nearest Neighbors: Towards Removing the Curse of Dimensionality"*), hashes points so that nearby points collide with high probability. It provides provable sub-linear query time at the cost of approximation, and is the foundation of the entire field.

**Inverted File Index (IVF)**, used in Facebook AI Research's **FAISS** library (Johnson, Douze, Jégou, 2017), clusters the dataset with *k*-means into *N*ᵢ Voronoi cells and only scans the *N*ₚ nearest cells at query time. **Product quantization** (Hervé Jégou, Matthijs Douze, Cordelia Schmid, TPAMI 2011, *"Product Quantization for Nearest Neighbor Search"*) splits each vector into sub-vectors and quantizes each independently, compressing a 768-dimensional float32 vector from 3 KB to ~64 bytes with small recall loss.

**HNSW** — Hierarchical Navigable Small World — by Yury Malkov and Dmitry Yashunin (2016, TPAMI 2018, *"Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs"*) builds a multilayer proximity graph where upper layers are sparse highways and lower layers are dense local connections. A greedy walk from the top delivers state-of-the-art recall-latency trade-offs and is currently the default index in pgvector, Pinecone, Milvus, Weaviate, Qdrant, Elasticsearch dense_vector, Redis-Search, and Lucene 9+.

Microsoft Research's **DiskANN** (Subramanya et al., NeurIPS 2019, *"DiskANN: Fast Accurate Billion-point Nearest Neighbor Search on a Single Node"*) pushes HNSW-like graphs to disk, enabling billion-point nearest neighbor on commodity SSDs. Google's **ScaNN** (Guo, Sun, Lindgren, Geng, Simcha, Chern, Kumar, ICML 2020, *"Accelerating Large-Scale Inference with Anisotropic Vector Quantization"*) combines anisotropic quantization with a learned pruning strategy and powers large parts of Google search and YouTube recommendations.

## 10. Bloom Filters and Probabilistic Structures

When *space* is the constraint and *false positives are survivable*, probabilistic structures buy enormous economy. The **Bloom filter**, published by Burton Howard Bloom in 1970 (*"Space/time trade-offs in hash coding with allowable errors"*, CACM), represents a set using *m* bits and *k* hash functions. Insertion sets *k* bits; membership tests all *k* bits and returns *definitely not in set* or *probably in set*. The false positive rate for *n* elements is

$$f \approx \left(1 - e^{-kn/m}\right)^{k}$$

minimized when *k* = (*m*/*n*) ln 2, giving roughly 10 bits per element for a 1% false positive rate — irrespective of element size. Every LSM tree (RocksDB, Cassandra, HBase) rides Bloom filters on SSTables. Chrome's malware list is a Bloom filter. Bitcoin SPV clients use them to query full nodes without revealing which addresses they own.

Extensions: **counting Bloom filters** (Fan et al., 2000) support deletion using counters instead of bits; **cuckoo filters** (Fan et al., 2014) pack fingerprints into cuckoo hash tables with lower false-positive rates at the same space. **HyperLogLog** (Philippe Flajolet, Éric Fusy, Olivier Gandouet, Frédéric Meunier, 2007, *"HyperLogLog: the analysis of a near-optimal cardinality estimation algorithm"*) estimates the number of distinct elements in a stream using O(log log *n*) space — 1.5 KB suffices for billion-scale cardinality at 2% error, the backbone of Google BigQuery's `APPROX_COUNT_DISTINCT`, Redis `PFCOUNT`, and Druid. The **Count-Min sketch** (Graham Cormode and S. Muthukrishnan, 2005, *"An Improved Data Stream Summary: The Count-Min Sketch and its Applications"*) estimates event frequencies in sub-linear space, used in network monitoring and Apache Spark streaming.

## 11. Covering Indexes and the Hidden Tax

A **covering index** (or *index-only scan*) stores the columns a query needs directly inside the index, so the engine never has to visit the base table. PostgreSQL's `INCLUDE` clause and SQL Server's `CREATE INDEX ... INCLUDE` were added specifically for this pattern; InnoDB's clustered primary key is a covering index by construction because leaves contain the full row. A query like `SELECT email FROM users WHERE name = ?` resolves entirely within the `(name) INCLUDE (email)` index — one logical IO instead of two.

Composite indexes extend the same idea across multiple columns: an index on `(customer_id, order_date)` answers range queries like `WHERE customer_id = 42 AND order_date > '2025-01-01'` using the leading-column, ordered-range property. The critical rule — the *leftmost prefix principle* — is that a composite index only helps queries that constrain a prefix of its columns.

Every index has a cost, and that cost is paid on write. Inserting one row into a table with eight indexes is nine insertions, not one. Updating an indexed column is a delete plus an insert in the index tree. Deleting a row is a fan-out of tombstone operations. This is the *hidden tax*: an index is a promise made at write time and redeemed at query time. A rule of thumb learned by every DBA: measure your read/write ratio before adding the fourth index, and measure it again before adding the fifth. Indexes you don't need are not free — they are a silent drag on every INSERT, UPDATE, and DELETE for the life of the table.

## 12. Conclusion: The Library Behind the Query

From Luhn's 1953 hashing memo to Malkov's 2016 HNSW graph, indexing is the accumulation of tricks that let computers ignore most of their data most of the time. A modern database engine contains, in a single binary, B+ trees for primary keys, hash indexes for joins, LSM trees for write-heavy columnstores, inverted indexes for full-text, R-trees for geometry, HNSW graphs for embeddings, and Bloom filters bolted onto all of them. Each structure embodies a different answer to the same question — *what can I precompute about my data so that tomorrow's query runs in microseconds instead of minutes?* — and each answer is a negotiation between read time, write time, space, and accuracy. The art of retrieval is the art of picking the right negotiation for the workload you actually have, not the one you wish you had.
