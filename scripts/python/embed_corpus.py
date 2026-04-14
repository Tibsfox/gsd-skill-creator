#!/usr/bin/env python3
"""Populate pgvector embeddings for all research pages."""

import psycopg2
from sentence_transformers import SentenceTransformer
import time

from db_config import DB_DSN
MODEL = "all-MiniLM-L6-v2"
BATCH = 64

model = SentenceTransformer(MODEL)
conn = psycopg2.connect(DB_DSN)
cur = conn.cursor()

cur.execute("SELECT id, COALESCE(content_text, title, '') as text FROM artemis.research_pages WHERE embedding IS NULL ORDER BY id")
rows = cur.fetchall()
print(f"Embedding {len(rows)} pages...")

start = time.time()
for i in range(0, len(rows), BATCH):
    batch = rows[i:i+BATCH]
    ids = [r[0] for r in batch]
    texts = [r[1][:2000] for r in batch]
    embeddings = model.encode(texts, normalize_embeddings=True)
    for page_id, emb in zip(ids, embeddings):
        cur.execute("UPDATE artemis.research_pages SET embedding = %s::vector WHERE id = %s", (emb.tolist(), page_id))
    conn.commit()
    print(f"  Batch {i//BATCH + 1}/{(len(rows)-1)//BATCH + 1}")

elapsed = time.time() - start
cur.execute("SELECT count(*) FROM artemis.research_pages WHERE embedding IS NOT NULL")
embedded = cur.fetchone()[0]
cur.close()
conn.close()
print(f"Done. {embedded} pages embedded in {elapsed:.1f}s")
