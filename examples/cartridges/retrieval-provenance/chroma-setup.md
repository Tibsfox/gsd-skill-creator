# Chroma Setup Recipe (Local-Dev Alternative)

Cartridge: `retrieval-provenance`
Companion doc: `t5-retrieval-provenance/02-chroma-vs-pgvector.md`

This recipe is for the local-dev / notebook-prototyping path. **The primary substrate for SCRIBE is pgvector** (see `pgvector-setup.md` and doc 02 §8 for the decision rubric). Use Chroma when zero-config matters more than the relational substrate.

## 1. Install Chroma

```bash
pip install chromadb        # >= 1.0
# or for Node:
npm install chromadb        # JS client; requires server-mode
```

For the **embedded mode** (zero ops, single process) you need Python.
For **server mode** (sharable across processes / languages) run Chroma as a service.

## 2. Embedded mode (Python)

```python
import chromadb

client = chromadb.PersistentClient(path="./.chroma-scribe")

collection = client.get_or_create_collection(
    name="prov_nodes",
    metadata={"hnsw:space": "cosine"},
)

# Upsert provenance records
collection.upsert(
    ids=["commit:e3ad12b25"],
    documents=["feat(graph): TRS cross-pack edge loader for M1 Memory Arena"],
    metadatas=[{
        "node_type": "Entity",
        "sub_type": "commit",
        "identifier": "IC-613-1.3",
        "authored_at": "2026-05-08T00:00:00Z"
    }],
)

# Query
results = collection.query(
    query_texts=["how do we capture decision metadata?"],
    n_results=5,
    where={"sub_type": "commit"},
)
print(results["ids"], results["distances"])
```

## 3. Server mode

```bash
chroma run --host 0.0.0.0 --port 8000 --path ./.chroma-scribe
```

Then from any client:

```python
import chromadb
client = chromadb.HttpClient(host="localhost", port=8000)
```

```typescript
import { ChromaClient } from "chromadb";
const client = new ChromaClient({ path: "http://localhost:8000" });
```

## 4. Modeling the prov graph in Chroma

Chroma is collection-oriented. The natural modeling for SCRIBE:

| Collection | Records | Metadata keys |
|---|---|---|
| `prov_nodes` | one per node | `node_type`, `sub_type`, `identifier`, dates |
| `prov_edges` | one per edge | `relation`, `src_id`, `dst_id` |

Cross-edge traversal (recursive walks) is **not** a Chroma primitive. Implement it in application code:

```python
def upstream(node_id, max_depth=10):
    visited = set([node_id])
    frontier = [node_id]
    for depth in range(max_depth):
        if not frontier: break
        next_frontier = []
        edges = collection_edges.get(where={"dst_id": {"$in": frontier}})
        for meta in edges["metadatas"]:
            if meta["src_id"] not in visited:
                visited.add(meta["src_id"])
                next_frontier.append(meta["src_id"])
        frontier = next_frontier
    return visited
```

For graph-shaped queries this is meaningfully more code than a Postgres recursive CTE. Doc 04 §7 covers when the relational shape wins.

## 5. Embedding-function choice

Chroma collections own their embedding function:

```python
from chromadb.utils import embedding_functions

ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="BAAI/bge-large-en-v1.5"
)
collection = client.get_or_create_collection(
    name="prov_nodes",
    embedding_function=ef,
)
```

Default is `all-MiniLM-L6-v2` (384-dim). Switch deliberately — changing the embedding function on an existing collection requires re-embedding all documents.

## 6. When to graduate from Chroma → pgvector

Promote when any of:

- You need joins to authoritative tables (commit metadata, file content, test outputs)
- You need transactional consistency between provenance writes and other writes
- You need PITR / replication / RLS / RBAC
- The corpus exceeds 1M records or 10 GB on disk
- You need graph-traversal queries (recursive CTEs)

The migration is mechanical: `collection.get(include=["embeddings", "documents", "metadatas"])` → SQL inserts into `prov_node` per the cartridge schema.
