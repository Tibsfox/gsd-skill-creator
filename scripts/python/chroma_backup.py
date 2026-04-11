#!/usr/bin/env python3
"""ChromaDB backup for pgvector data.

Syncs research_pages embeddings and concepts to a local ChromaDB instance
as a redundant backup. ChromaDB provides offline access and portability.

Usage:
  python3 chroma_backup.py              # Full sync from pgvector
  python3 chroma_backup.py --stats      # Show ChromaDB collection stats
  python3 chroma_backup.py --search "query"  # Test search against backup
"""

import os
import sys
import argparse

try:
    import chromadb
except ImportError:
    print("ChromaDB not installed. Run: pip install chromadb")
    sys.exit(1)

import psycopg2
from db_config import DB_DSN

CHROMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.chroma')
PAGES_COLLECTION = 'research_pages'
CONCEPTS_COLLECTION = 'concepts'


def get_chroma_client():
    """Get persistent ChromaDB client."""
    return chromadb.PersistentClient(path=CHROMA_PATH)


def sync_to_chroma(cur=None):
    """Sync pgvector data to ChromaDB backup."""
    own_conn = False
    if cur is None:
        conn = psycopg2.connect(DB_DSN)
        cur = conn.cursor()
        own_conn = True

    client = get_chroma_client()

    # Sync research_pages
    pages_col = client.get_or_create_collection(
        name=PAGES_COLLECTION,
        metadata={"hnsw:space": "cosine"}
    )

    cur.execute("""
        SELECT id, path, title, category, content_text, embedding::text
        FROM artemis.research_pages
        WHERE embedding IS NOT NULL
    """)
    rows = cur.fetchall()

    # Get existing IDs in ChromaDB
    existing = set()
    try:
        result = pages_col.get()
        existing = set(result['ids'])
    except Exception:
        pass

    new_ids = []
    new_embeddings = []
    new_documents = []
    new_metadatas = []

    for pid, path, title, category, content, embedding_str in rows:
        str_id = str(pid)
        if str_id not in existing:
            new_ids.append(str_id)
            # Parse pgvector string "[0.1,0.2,...]" to list of floats
            emb = [float(x) for x in embedding_str.strip('[]').split(',')]
            new_embeddings.append(emb)
            new_documents.append((content or title or '')[:1000])
            new_metadatas.append({
                'path': path or '',
                'title': title or '',
                'category': category or '',
            })

    if new_ids:
        # Batch add in chunks of 100
        for i in range(0, len(new_ids), 100):
            batch_end = min(i + 100, len(new_ids))
            pages_col.add(
                ids=new_ids[i:batch_end],
                embeddings=new_embeddings[i:batch_end],
                documents=new_documents[i:batch_end],
                metadatas=new_metadatas[i:batch_end],
            )
        print(f"  ChromaDB: {len(new_ids)} pages synced ({pages_col.count()} total)")
    else:
        print(f"  ChromaDB: pages up to date ({pages_col.count()} total)")

    # Sync concepts
    concepts_col = client.get_or_create_collection(
        name=CONCEPTS_COLLECTION,
        metadata={"hnsw:space": "cosine"}
    )

    cur.execute("""
        SELECT id, name, category, embedding::text
        FROM artemis.concepts
        WHERE embedding IS NOT NULL
    """)
    concept_rows = cur.fetchall()

    existing_concepts = set()
    try:
        result = concepts_col.get()
        existing_concepts = set(result['ids'])
    except Exception:
        pass

    new_cids = []
    new_cembs = []
    new_cdocs = []
    new_cmetas = []

    for cid, name, category, embedding_str in concept_rows:
        str_id = str(cid)
        if str_id not in existing_concepts:
            new_cids.append(str_id)
            emb = [float(x) for x in embedding_str.strip('[]').split(',')]
            new_cembs.append(emb)
            new_cdocs.append(f"{name} ({category or 'general'})")
            new_cmetas.append({'name': name, 'category': category or ''})

    if new_cids:
        concepts_col.add(
            ids=new_cids,
            embeddings=new_cembs,
            documents=new_cdocs,
            metadatas=new_cmetas,
        )
        print(f"  ChromaDB: {len(new_cids)} concepts synced ({concepts_col.count()} total)")
    else:
        print(f"  ChromaDB: concepts up to date ({concepts_col.count()} total)")

    if own_conn:
        conn.close()


def show_stats():
    """Show ChromaDB collection stats."""
    client = get_chroma_client()
    for name in [PAGES_COLLECTION, CONCEPTS_COLLECTION]:
        try:
            col = client.get_collection(name)
            print(f"  {name}: {col.count()} items")
        except Exception:
            print(f"  {name}: not found")


def search_backup(query, limit=5):
    """Search ChromaDB backup directly."""
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer('all-MiniLM-L6-v2')
    query_emb = model.encode([query], normalize_embeddings=True)[0]

    client = get_chroma_client()
    col = client.get_collection(PAGES_COLLECTION)

    results = col.query(
        query_embeddings=[query_emb.tolist()],
        n_results=limit,
    )

    print(f"\nChromaDB search: '{query}'")
    for i, (doc_id, distance, metadata) in enumerate(
        zip(results['ids'][0], results['distances'][0], results['metadatas'][0]), 1
    ):
        title = metadata.get('title', '?')[:50]
        path = metadata.get('path', '')
        print(f"  {i}. [{1-distance:.4f}] {title}")
        print(f"     {path}")


def main():
    parser = argparse.ArgumentParser(description="ChromaDB backup for pgvector")
    parser.add_argument("--stats", action="store_true", help="Show collection stats")
    parser.add_argument("--search", type=str, help="Search the backup")
    args = parser.parse_args()

    if args.stats:
        show_stats()
    elif args.search:
        search_backup(args.search)
    else:
        sync_to_chroma()


if __name__ == "__main__":
    main()
