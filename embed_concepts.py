#!/usr/bin/env python3
"""Generate embeddings for extracted concepts.

For each concept in artemis.concepts, builds a rich description string
from the concept name, category, canonical page title, and top referencing
page titles, then embeds it with all-MiniLM-L6-v2 (384-dim).

Prerequisites:
  python3 extract_concepts.py  # Must run first to populate concepts

Usage:
  python3 embed_concepts.py              # Embed all concepts
  python3 embed_concepts.py --force      # Re-embed all (even if already embedded)
  python3 embed_concepts.py --stats      # Show embedding coverage stats
"""

import sys
import time
import argparse

import psycopg2
from sentence_transformers import SentenceTransformer

DB_DSN = "host=localhost dbname=tibsfox user=postgres password=foxyuw5,&%cM#(C3"
MODEL = "all-MiniLM-L6-v2"
BATCH = 64


def ensure_embedding_column(cur):
    """Add embedding column to concepts table if it doesn't exist."""
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'artemis' AND table_name = 'concepts'
          AND column_name = 'embedding'
    """)
    if not cur.fetchone():
        cur.execute("ALTER TABLE artemis.concepts ADD COLUMN embedding vector(384)")
        print("Added embedding column to artemis.concepts")
    else:
        print("Embedding column already exists on artemis.concepts")


def build_concept_descriptions(cur, force=False):
    """Build rich description strings for each concept.

    Description format:
      {name} ({category}). Canonical: {canonical_page_title}.
      Referenced by: {top_3_page_titles}

    Returns: list of (concept_id, description_text)
    """
    where_clause = "" if force else "WHERE c.embedding IS NULL"
    cur.execute(f"""
        SELECT c.id, c.name, c.category, c.canonical_page_id
        FROM artemis.concepts c
        {where_clause}
        ORDER BY c.id
    """)
    concepts = cur.fetchall()

    if not concepts:
        print("No concepts to embed.")
        return []

    print(f"Building descriptions for {len(concepts)} concepts...")

    descriptions = []
    for cid, name, category, canonical_page_id in concepts:
        parts = [name]

        # Add category context
        if category:
            parts.append(f"({category})")

        # Add canonical page title
        if canonical_page_id:
            cur.execute(
                "SELECT title FROM artemis.research_pages WHERE id = %s",
                (canonical_page_id,)
            )
            row = cur.fetchone()
            if row and row[0]:
                # Decode HTML entities
                title = row[0].replace('&mdash;', '—').replace('&amp;', '&')
                title = title.replace('&ndash;', '–').replace('&middot;', '·')
                parts.append(f"Canonical page: {title}")

        # Add top 3 referencing page titles (by page count, excluding canonical)
        cur.execute("""
            SELECT DISTINCT rp.title
            FROM artemis.concept_refs cr
            JOIN artemis.research_pages rp ON rp.id = cr.page_id
            WHERE cr.concept_id = %s
              AND cr.page_id != COALESCE(%s, -1)
              AND rp.title IS NOT NULL
            ORDER BY rp.title
            LIMIT 3
        """, (cid, canonical_page_id))
        ref_titles = [row[0] for row in cur.fetchall()]
        if ref_titles:
            cleaned = []
            for t in ref_titles:
                t = t.replace('&mdash;', '—').replace('&amp;', '&')
                t = t.replace('&ndash;', '–').replace('&middot;', '·')
                cleaned.append(t)
            parts.append("Referenced by: " + "; ".join(cleaned))

        description = ". ".join(parts)
        descriptions.append((cid, description))

    return descriptions


def embed_concepts(descriptions, cur, model):
    """Embed concept descriptions and store in DB."""
    if not descriptions:
        return 0

    print(f"Embedding {len(descriptions)} concept descriptions...")
    count = 0
    t0 = time.time()

    for i in range(0, len(descriptions), BATCH):
        batch = descriptions[i:i + BATCH]
        ids = [d[0] for d in batch]
        texts = [d[1][:2000] for d in batch]  # Cap at model's sweet spot

        embeddings = model.encode(texts, normalize_embeddings=True)

        for cid, emb in zip(ids, embeddings):
            cur.execute(
                "UPDATE artemis.concepts SET embedding = %s::vector WHERE id = %s",
                (emb.tolist(), cid)
            )
        count += len(batch)

        batch_num = i // BATCH + 1
        total_batches = (len(descriptions) - 1) // BATCH + 1
        print(f"  Batch {batch_num}/{total_batches} ({count} embedded)")

    elapsed = time.time() - t0
    print(f"Embedded {count} concepts in {elapsed:.1f}s")
    return count


def print_stats(cur):
    """Show embedding coverage statistics."""
    cur.execute("SELECT count(*) FROM artemis.concepts")
    total = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM artemis.concepts WHERE embedding IS NOT NULL")
    embedded = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM artemis.concepts WHERE embedding IS NULL")
    missing = cur.fetchone()[0]

    print(f"\n{'='*60}")
    print(f"Concept Embedding Statistics")
    print(f"{'='*60}")
    print(f"  Total concepts:    {total}")
    print(f"  Embedded:          {embedded}")
    print(f"  Missing embedding: {missing}")
    if total > 0:
        print(f"  Coverage:          {embedded/total*100:.1f}%")

    # Sample embedded concept descriptions
    if embedded > 0:
        cur.execute("""
            SELECT c.name, c.category,
                   1 - (c.embedding <=> (
                       SELECT embedding FROM artemis.concepts
                       WHERE name = 'Artemis II' AND embedding IS NOT NULL
                       LIMIT 1
                   )) as sim_to_artemis
            FROM artemis.concepts c
            WHERE c.embedding IS NOT NULL
            ORDER BY sim_to_artemis DESC NULLS LAST
            LIMIT 10
        """)
        rows = cur.fetchall()
        if rows and rows[0][2] is not None:
            print(f"\n  Top 10 concepts similar to 'Artemis II':")
            for name, cat, sim in rows:
                print(f"    {sim:.4f}  [{cat or '?':13s}]  {name}")


def main():
    parser = argparse.ArgumentParser(description="Embed concepts with all-MiniLM-L6-v2")
    parser.add_argument("--force", action="store_true", help="Re-embed all concepts")
    parser.add_argument("--stats", action="store_true", help="Show stats only")
    args = parser.parse_args()

    conn = psycopg2.connect(DB_DSN)
    conn.autocommit = False
    cur = conn.cursor()

    if args.stats:
        print_stats(cur)
        conn.close()
        return

    t0 = time.time()

    # Ensure column exists
    ensure_embedding_column(cur)
    conn.commit()

    # Build descriptions
    descriptions = build_concept_descriptions(cur, force=args.force)

    if not descriptions:
        print("Nothing to embed. Run extract_concepts.py first, or use --force.")
        print_stats(cur)
        conn.close()
        return

    # Load model and embed
    print(f"Loading model: {MODEL}")
    model = SentenceTransformer(MODEL)
    count = embed_concepts(descriptions, cur, model)
    conn.commit()

    elapsed = time.time() - t0
    print(f"\nDone in {elapsed:.1f}s")

    # Show stats
    print_stats(cur)

    conn.close()


if __name__ == "__main__":
    main()
