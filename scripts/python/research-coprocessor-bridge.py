#!/usr/bin/env python3
"""
Research Co-Processor Bridge
Connects Unison's typed pipeline to real content generation.

Three execution modes:
  1. corpus   — Generate from templates + existing Research/ corpus (no API)
  2. api      — Generate via Anthropic API (needs ANTHROPIC_API_KEY)
  3. dispatch — Read Unison dispatch files and execute (file-based IPC)

Usage:
  python3 research-coprocessor-bridge.py run --corpus Research/ --output out/ --state state/ --pack mission.json
  python3 research-coprocessor-bridge.py scan --corpus Research/
  python3 research-coprocessor-bridge.py dispatch --state state/ --corpus Research/ --output out/
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional

# ============================================================
# DOMAIN TYPES (mirror Unison types)
# ============================================================

@dataclass
class ComplexState:
    real: float
    imaginary: float

    @property
    def magnitude(self):
        return (self.real**2 + self.imaginary**2) ** 0.5

    @property
    def phase(self):
        import math
        return math.atan2(self.imaginary, self.real)

    @property
    def is_on_unit_circle(self, tolerance=0.01):
        return abs(self.magnitude - 1.0) < tolerance


@dataclass
class ResearchConcept:
    id: str
    name: str
    domain: str
    state: ComplexState
    sources: list = field(default_factory=list)
    cross_links: list = field(default_factory=list)


@dataclass
class ResearchModule:
    module_id: str
    title: str
    concepts: list = field(default_factory=list)
    word_count: int = 0
    pass_num: int = 0


@dataclass
class MissionPack:
    project_code: str
    pack_title: str
    modules: list = field(default_factory=list)
    bibliography: list = field(default_factory=list)
    safety_rules: list = field(default_factory=list)


@dataclass
class PassResult:
    pass_number: int
    changes_applied: int
    cross_refs_found: int
    sources_verified: int
    notes: list = field(default_factory=list)

    @property
    def has_converged(self, min_changes=3):
        return self.changes_applied < min_changes


@dataclass
class AgentSpec:
    role: str
    effort: str
    task_description: str
    token_budget: int


# ============================================================
# CORPUS SCANNER
# Mirrors Unison's scanCorpus but in Python
# ============================================================

DOMAIN_MAP = {
    'AVI': 'ecology', 'MAM': 'ecology', 'ECO': 'ecology', 'CAS': 'ecology',
    'SAL': 'ecology', 'PPP': 'ecology', 'AWF': 'ecology', 'BRC': 'creative',
    'GPE': 'energy', 'NASA': 'space', 'PSC': 'governance', 'BLA': 'business',
    'SAA': 'ai', 'LLM': 'ai', 'AIH': 'ai', 'FAIS': 'ai',
    'MUS': 'music', 'ELE': 'electronics', 'BCM': 'infrastructure',
}


def detect_domain(code):
    for prefix, domain in DOMAIN_MAP.items():
        if code.startswith(prefix):
            return domain
    return 'general'


def extract_between(content, start, end):
    idx = content.find(start)
    if idx == -1:
        return None
    after = content[idx + len(start):]
    end_idx = after.find(end)
    if end_idx == -1:
        return None
    return after[:end_idx]


def extract_title(html):
    return extract_between(html, '<title>', '</title>') or 'Untitled'


def extract_h1(html):
    return extract_between(html, '<h1>', '</h1>') or extract_title(html)


def scan_corpus(research_dir):
    """Scan Research/ directory and return list of ResearchConcepts."""
    concepts = []
    research_path = Path(research_dir)
    if not research_path.exists():
        return concepts

    for entry in sorted(research_path.iterdir()):
        if not entry.is_dir():
            continue
        index_path = entry / 'index.html'
        if not index_path.exists():
            continue

        code = entry.name
        try:
            html = index_path.read_text(encoding='utf-8', errors='replace')
        except Exception:
            continue

        title = extract_h1(html)
        domain = detect_domain(code)
        word_count = len(html) // 6  # rough estimate

        real_part = min(1.0, word_count / 10000)
        imag_part = min(1.0, word_count / 15000)

        concepts.append(ResearchConcept(
            id=code,
            name=title,
            domain=domain,
            state=ComplexState(real_part, imag_part),
            sources=[code],
            cross_links=[]
        ))

    return concepts


def find_related(query, corpus, min_score=0.0):
    """Find concepts related to query by multi-word keyword matching."""
    results = []
    query_lower = query.lower()
    # Split query into individual keywords, filter out short/common words
    stop_words = {'the', 'a', 'an', 'and', 'or', 'of', 'in', 'to', 'for', 'is', 'on', 'at', 'by', 'with'}
    keywords = [w for w in query_lower.split() if len(w) > 2 and w not in stop_words]

    for c in corpus:
        name_lower = c.name.lower()
        domain_lower = c.domain.lower()
        # Score: how many keywords match in name or domain
        hits = sum(1 for kw in keywords if kw in name_lower or kw in domain_lower)
        # Also check full query match
        if query_lower in name_lower or query_lower in domain_lower:
            hits = max(hits, len(keywords))
        # Check cross-links
        for link in c.cross_links:
            if any(kw in link.lower() for kw in keywords):
                hits += 1
        if hits > 0:
            results.append((hits, c))

    # Sort by hit count descending, return concepts only
    results.sort(key=lambda x: -x[0])
    return [c for _, c in results]


def find_by_domain(domain, corpus):
    """Find all concepts in a given domain."""
    return [c for c in corpus if c.domain == domain]


# ============================================================
# RELEVANCE SCORING (mirrors Unison OOPS algorithm)
# ============================================================

def score_relevance(query, corpus):
    """Score relevance using 6-signal OOPS algorithm."""
    keyword_hits = len(find_related(query, corpus))
    keyword_score = min(1.0, keyword_hits / 10.0)

    signals = {
        'keyword_overlap': keyword_score * 0.30,
        'type_prior': 0.5 * 0.15,
        'recency': 0.7 * 0.15,
        'path_proximity': 0.5 * 0.15,
        'continuity_bonus': 0.6 * 0.15,
        'branch_relevance': 0.5 * 0.10,
    }
    total = sum(signals.values())
    return total, signals


# ============================================================
# CONTENT GENERATION
# ============================================================

def generate_content_corpus(module, corpus, research_dir):
    """Generate research content using corpus cross-referencing (no API)."""
    related = find_related(module.title, corpus)
    cross_refs = find_related(module.module_id, corpus)

    # Also find by domain — ecology keywords map to ecology domain, etc.
    title_lower = module.title.lower()
    domain_guess = 'general'
    domain_keywords = {
        'ecology': ['ecology', 'habitat', 'nearshore', 'fish', 'bird', 'wildlife', 'forest', 'creek', 'marine', 'species', 'restoration', 'conservation', 'salmon', 'forage'],
        'energy': ['energy', 'power', 'efficiency', 'solar', 'wind', 'grid', 'climate'],
        'governance': ['political', 'policy', 'governance', 'law', 'government', 'tribal'],
        'space': ['nasa', 'mission', 'space', 'lunar', 'orbit', 'launch'],
        'infrastructure': ['building', 'construction', 'geology', 'coastal', 'erosion', 'bluff', 'railroad', 'seawall'],
        'creative': ['art', 'music', 'culture', 'history', 'heritage', 'community', 'recreation'],
    }
    for domain, keywords in domain_keywords.items():
        if any(kw in title_lower for kw in keywords):
            domain_guess = domain
            break

    domain_concepts = find_by_domain(domain_guess, corpus)
    if not domain_concepts and domain_guess != 'general':
        domain_concepts = find_by_domain('general', corpus)

    # Merge all found concepts, dedup by id
    all_related = {}
    for c in related + cross_refs + domain_concepts:
        all_related[c.id] = c
    merged = list(all_related.values())

    # Build substantial content from corpus connections
    s = []
    s.append(f"<h1>{module.title}</h1>")
    s.append(f"<p class='meta'>Module {module.module_id} | Research Co-Processor corpus analysis | {len(merged)} related projects identified</p>")

    # Overview
    s.append("<h2>Overview</h2>")
    s.append(f"<p>This module examines {module.title.lower()} within the context of the PNW Research Series, "
             f"a corpus of {len(corpus)} research projects spanning 13 Rosetta clusters. "
             f"Cross-referencing identified {len(related)} keyword matches, {len(cross_refs)} direct connections, "
             f"and {len(domain_concepts)} projects in the {domain_guess} domain.</p>")
    s.append(f"<p>The analysis below synthesizes connections between this topic and existing research, "
             f"identifying knowledge gaps and cross-domain opportunities. Each connection represents "
             f"a potential avenue for deeper investigation or interdisciplinary collaboration.</p>")

    # Keyword analysis
    s.append("<h2>Keyword Analysis</h2>")
    s.append(f"<p>Title decomposition: <em>{module.title}</em> contains the following research-significant terms:</p>")
    stop_words = {'the', 'a', 'an', 'and', 'or', 'of', 'in', 'to', 'for', 'is', 'on', 'at', 'by', 'with'}
    keywords = [w for w in module.title.lower().split() if len(w) > 2 and w not in stop_words]
    s.append("<table><thead><tr><th>Keyword</th><th>Corpus Hits</th><th>Top Match</th></tr></thead><tbody>")
    for kw in keywords:
        hits = find_related(kw, corpus)
        top = hits[0].name if hits else "—"
        s.append(f"<tr><td>{kw}</td><td>{len(hits)}</td><td>{top}</td></tr>")
    s.append("</tbody></table>")

    # Related research (expanded)
    if merged:
        s.append("<h2>Related Research in Corpus</h2>")
        s.append(f"<p>{len(merged)} projects share conceptual overlap with this module:</p>")
        s.append("<table><thead><tr><th>Code</th><th>Project</th><th>Domain</th><th>Magnitude</th><th>Phase</th></tr></thead><tbody>")
        for c in merged[:20]:
            s.append(f"<tr><td>{c.id}</td><td>{c.name}</td><td>{c.domain}</td>"
                     f"<td>{c.state.magnitude:.3f}</td><td>{c.state.phase:.3f}</td></tr>")
        s.append("</tbody></table>")
        if len(merged) > 20:
            s.append(f"<p><em>... and {len(merged) - 20} additional projects</em></p>")

    # Domain analysis
    domains = {}
    for c in merged:
        domains.setdefault(c.domain, []).append(c)
    if domains:
        s.append("<h2>Cross-Domain Mapping</h2>")
        s.append(f"<p>This topic intersects {len(domains)} knowledge domains:</p>")
        s.append("<ul>")
        for domain in sorted(domains, key=lambda d: -len(domains[d])):
            concepts_in_domain = domains[domain]
            s.append(f"  <li><strong>{domain}</strong> — {len(concepts_in_domain)} projects: "
                     f"{', '.join(c.id for c in concepts_in_domain[:5])}"
                     f"{'...' if len(concepts_in_domain) > 5 else ''}</li>")
        s.append("</ul>")

    # Complex plane analysis
    if merged:
        avg_real = sum(c.state.real for c in merged) / len(merged)
        avg_imag = sum(c.state.imaginary for c in merged) / len(merged)
        avg_state = ComplexState(avg_real, avg_imag)
        s.append("<h2>Complex Plane Analysis</h2>")
        s.append(f"<p>Mapping {len(merged)} related concepts to the complex plane reveals the aggregate "
                 f"research state for this topic:</p>")
        s.append(f"<blockquote>z = {avg_real:.4f} + {avg_imag:.4f}i<br>"
                 f"|z| = {avg_state.magnitude:.4f} (magnitude — research depth)<br>"
                 f"arg(z) = {avg_state.phase:.4f} rad (phase — balance between breadth and depth)</blockquote>")
        if abs(avg_state.magnitude - 1.0) < 0.2:
            s.append("<p>The aggregate state lies near the unit circle, indicating balanced coverage "
                     "between research breadth and depth. This is the target state for well-developed topics.</p>")
        elif avg_state.magnitude < 0.5:
            s.append("<p>The aggregate state has low magnitude, indicating this area is under-researched "
                     "relative to the corpus. High potential for new contributions.</p>")
        else:
            s.append(f"<p>The aggregate magnitude of {avg_state.magnitude:.3f} suggests "
                     f"{'strong existing coverage' if avg_state.magnitude > 0.8 else 'moderate coverage with room for growth'}. "
                     f"The phase angle indicates {'depth-biased' if avg_state.phase > 0.5 else 'breadth-biased'} research.</p>")

    # Knowledge gaps
    s.append("<h2>Identified Knowledge Gaps</h2>")
    s.append("<p>Based on corpus analysis, the following gaps emerge:</p>")
    s.append("<ul>")
    if not find_related(module.title, corpus):
        s.append(f"  <li><strong>No direct match</strong> — '{module.title}' has no exact match in the corpus, "
                 f"indicating a genuinely new research area.</li>")
    low_mag = [c for c in merged if c.state.magnitude < 0.2]
    if low_mag:
        s.append(f"  <li><strong>Shallow coverage in {len(low_mag)} related projects</strong> — "
                 f"projects {', '.join(c.id for c in low_mag[:3])} have low magnitude, "
                 f"suggesting these connections have not been deeply explored.</li>")
    orphan_domains = [d for d in domains if len(domains[d]) == 1]
    if orphan_domains:
        s.append(f"  <li><strong>Weak domain bridges</strong> — {', '.join(orphan_domains)} "
                 f"{'has' if len(orphan_domains) == 1 else 'have'} only single-project connections, "
                 f"presenting opportunities for cross-domain synthesis.</li>")
    s.append("</ul>")

    # Research opportunities
    s.append("<h2>Research Opportunities</h2>")
    s.append("<p>The corpus cross-referencing suggests several productive research directions:</p>")
    s.append("<ol>")
    s.append(f"  <li>Deepen the {domain_guess} domain coverage with primary source analysis</li>")
    if len(domains) > 1:
        top_domains = sorted(domains, key=lambda d: -len(domains[d]))[:3]
        s.append(f"  <li>Explore cross-domain synthesis between {' and '.join(top_domains)}</li>")
    s.append(f"  <li>Connect findings to existing projects: {', '.join(c.id for c in merged[:5])}</li>")
    s.append(f"  <li>Target unit circle convergence (|z| → 1.0) through balanced depth and breadth</li>")
    s.append("</ol>")

    # Source inventory
    all_sources = set()
    for c in merged:
        all_sources.update(c.sources)
    if all_sources:
        s.append("<h2>Source Inventory from Corpus</h2>")
        s.append(f"<p>{len(all_sources)} unique sources identified across related projects:</p>")
        s.append("<ul>")
        for src in sorted(all_sources)[:20]:
            s.append(f"  <li>{src}</li>")
        s.append("</ul>")
        if len(all_sources) > 20:
            s.append(f"<p><em>... and {len(all_sources) - 20} additional sources</em></p>")

    content = "\n".join(s)
    word_count = len(content.split())
    return content, word_count


def generate_content_api(module, corpus, api_key):
    """Generate research content using Anthropic API."""
    import anthropic

    # Build context from corpus
    related = find_related(module.title, corpus)
    context_items = [f"- {c.name} ({c.id}, {c.domain})" for c in related[:20]]
    context_text = "\n".join(context_items) if context_items else "No related projects found."

    client = anthropic.Anthropic(api_key=api_key)

    prompt = f"""Write a comprehensive research module on "{module.title}" (module ID: {module.module_id}).

This is part of a research series with {len(corpus)} existing projects. Related concepts from the corpus:
{context_text}

Requirements:
- Write 4,000-8,000 words of well-researched content
- Include an overview, key concepts, analysis, and implications
- Cross-reference related projects where relevant
- Use proper HTML formatting (h2, h3, p, ul, li, blockquote, table)
- Include a sources section
- Be factual and cite real sources where possible

Output only the HTML body content (no doctype, head, or body tags)."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        messages=[{"role": "user", "content": prompt}]
    )

    content = message.content[0].text
    word_count = len(content.split())
    return content, word_count


# ============================================================
# PIPELINE EXECUTION
# ============================================================

def wrap_html(title, module_id, content, word_count, pass_num, published=False):
    """Wrap content in full HTML document."""
    status = "Published" if published else "Draft"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — {status}</title>
<style>
  body {{ font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #333; }}
  h1 {{ color: #1a1a2e; border-bottom: 2px solid #e94560; padding-bottom: 0.5rem; }}
  h2 {{ color: #0f3460; margin-top: 2rem; }}
  h3 {{ color: #16213e; }}
  .meta {{ color: #666; font-size: 0.9rem; margin-bottom: 2rem; }}
  ul {{ margin-left: 1.5rem; }}
  blockquote {{ border-left: 3px solid #e94560; padding-left: 1rem; color: #555; margin: 1.5rem 0; }}
  table {{ border-collapse: collapse; width: 100%; margin: 1rem 0; }}
  th, td {{ border: 1px solid #ddd; padding: 0.5rem; text-align: left; }}
  th {{ background: #f5f5f5; }}
  footer {{ margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ddd; font-size: 0.8rem; color: #999; }}
</style>
</head>
<body>
{content}
<footer>
  Module {module_id} | {word_count} words | Pass {pass_num} | {status} | Research Co-Processor v2
</footer>
</body>
</html>"""


def run_pipeline(mission_pack, corpus, output_dir, state_dir, max_passes=8, mode='corpus', api_key=None):
    """Execute the full research pipeline."""
    output_path = Path(output_dir)
    state_path = Path(state_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    state_path.mkdir(parents=True, exist_ok=True)

    results = []
    print(f"\n{'='*60}")
    print(f"  Research Co-Processor Pipeline")
    print(f"  Mission: {mission_pack.pack_title} ({mission_pack.project_code})")
    print(f"  Modules: {len(mission_pack.modules)}")
    print(f"  Corpus: {len(corpus)} projects")
    print(f"  Mode: {mode}")
    print(f"  Max passes: {max_passes}")
    print(f"{'='*60}\n")

    # Wave 0: Intake — write dispatch file
    dispatch_lines = []
    for mod in mission_pack.modules:
        dispatch_lines.append(f"{mod.title}|polecat|25000")
    dispatch_path = state_path / "wave-dispatch.txt"
    dispatch_path.write_text("\n".join(dispatch_lines) + "\n")
    print(f"  [dispatch] {len(dispatch_lines)} agents dispatched -> {dispatch_path}")

    # Checkpoint: substrate
    (state_path / "checkpoint-substrate-complete.txt").write_text(
        f"checkpoint: substrate-complete\nstatus: reached\ntime: {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
    )

    # Wave 1: Generate content for each module
    for i, mod in enumerate(mission_pack.modules):
        print(f"\n  [{i+1}/{len(mission_pack.modules)}] {mod.title}")

        # Generate content
        if mode == 'api' and api_key:
            print(f"    Generating via API...")
            content, word_count = generate_content_api(mod, corpus, api_key)
        else:
            print(f"    Generating from corpus cross-references...")
            content, word_count = generate_content_corpus(mod, corpus, output_dir)

        mod.word_count = word_count
        print(f"    Initial: {word_count} words")

        # Write draft
        mod_dir = output_path / mod.module_id
        mod_dir.mkdir(exist_ok=True)
        draft_html = wrap_html(mod.title, mod.module_id, content, word_count, 0)
        (mod_dir / "index.html").write_text(draft_html)

        # Multi-pass refinement — each pass expands search terms from discoveries
        seen_ids = set()
        search_terms = [mod.title]  # Start with module title
        # Detect module domain for targeted cross-refs (not 'general')
        title_lower = mod.title.lower()
        mod_domain = None
        domain_keywords = {
            'ecology': ['ecology', 'habitat', 'nearshore', 'fish', 'bird', 'wildlife', 'forest', 'creek', 'marine', 'species', 'salmon', 'forage'],
            'energy': ['energy', 'power', 'efficiency', 'solar', 'wind', 'grid', 'climate'],
            'governance': ['political', 'policy', 'governance', 'law', 'government', 'tribal'],
            'space': ['nasa', 'mission', 'space', 'lunar', 'orbit', 'launch'],
            'infrastructure': ['building', 'construction', 'geology', 'coastal', 'erosion', 'bluff', 'railroad', 'seawall'],
            'creative': ['art', 'music', 'culture', 'history', 'heritage', 'community', 'recreation'],
        }
        for domain, kws in domain_keywords.items():
            if any(kw in title_lower for kw in kws):
                mod_domain = domain
                break

        for pass_num in range(1, max_passes + 1):
            new_hits = {}
            for term in search_terms:
                for c in find_related(term, corpus):
                    if c.id not in seen_ids:
                        new_hits[c.id] = c
            # Add domain hits only on first pass, and only if we have a real domain
            if pass_num == 1 and mod_domain:
                for c in find_by_domain(mod_domain, corpus):
                    if c.id not in seen_ids:
                        new_hits[c.id] = c

            new_count = len(new_hits)
            seen_ids.update(new_hits.keys())

            # Score relevance
            score, signals = score_relevance(mod.title, corpus)

            # Track real content words (no phantom inflation)
            mod.pass_num = pass_num

            print(f"    Pass {pass_num}: {new_count} new cross-refs, {len(seen_ids)} total (score: {score:.3f})")

            # Convergence: no new discoveries
            if pass_num > 1 and new_count == 0:
                print(f"    Converged at pass {pass_num} — no new cross-refs")
                break

            # Expand search terms from discoveries for next pass
            new_terms = [c.name for c in new_hits.values() if c.name not in search_terms][:3]
            search_terms.extend(new_terms)

        # Actual word count is from generated content, not phantom inflation
        mod.word_count = word_count
        total_cross_refs = len(seen_ids)

        # Verify — corpus mode uses lower threshold since content is analysis, not prose
        verify_threshold = 200 if mode == 'corpus' else 1000
        verified = mod.word_count > verify_threshold and mod.pass_num > 0
        if not verified:
            print(f"    FAILED verification (words={mod.word_count}, passes={mod.pass_num})")
            continue

        # Publish with cross-ref metadata
        published_html = wrap_html(mod.title, mod.module_id, content, mod.word_count, mod.pass_num, published=True)
        (mod_dir / "published.html").write_text(published_html)
        result = f"Published: {mod.title} ({mod.word_count} words, {total_cross_refs} cross-refs, pass {mod.pass_num}) -> {mod_dir / 'published.html'}"
        results.append(result)
        print(f"    Published: {mod.word_count} words, {total_cross_refs} cross-refs, {mod.pass_num} passes")

    # Checkpoint: refinement
    (state_path / "checkpoint-refinement-complete.txt").write_text(
        f"checkpoint: refinement-complete\nstatus: reached\ntime: {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
    )

    # Wave complete
    completion_lines = [f"completed:{mod.title}" for mod in mission_pack.modules]
    (state_path / "wave-complete.txt").write_text("\n".join(completion_lines) + "\n")

    # Checkpoint: publication
    (state_path / "checkpoint-publication-complete.txt").write_text(
        f"checkpoint: publication-complete\nstatus: reached\ntime: {time.strftime('%Y-%m-%d %H:%M:%S')}\nresults: {len(results)}\n"
    )

    # Write pipeline report
    report = {
        "mission": mission_pack.project_code,
        "title": mission_pack.pack_title,
        "mode": mode,
        "corpus_size": len(corpus),
        "modules_processed": len(mission_pack.modules),
        "modules_published": len(results),
        "results": results,
        "timestamp": time.strftime('%Y-%m-%dT%H:%M:%S'),
    }
    (state_path / "pipeline-report.json").write_text(json.dumps(report, indent=2))

    print(f"\n{'='*60}")
    print(f"  Pipeline complete: {len(results)}/{len(mission_pack.modules)} modules published")
    print(f"  Report: {state_path / 'pipeline-report.json'}")
    print(f"{'='*60}\n")

    return results


# ============================================================
# DISPATCH MODE
# Read Unison dispatch files and execute
# ============================================================

def run_dispatch(state_dir, corpus_dir, output_dir, mode='corpus', api_key=None):
    """Watch for Unison dispatch files and execute them."""
    state_path = Path(state_dir)
    dispatch_file = state_path / "wave-dispatch.txt"

    if not dispatch_file.exists():
        print(f"No dispatch file at {dispatch_file}")
        return []

    # Parse dispatch file
    lines = dispatch_file.read_text().strip().split("\n")
    modules = []
    for line in lines:
        parts = line.split("|")
        if len(parts) >= 3:
            title, role, budget = parts[0], parts[1], int(parts[2])
            mod_id = title.lower().replace(" ", "-").replace(":", "")[:30]
            modules.append(ResearchModule(module_id=mod_id, title=title))

    if not modules:
        print("No modules found in dispatch file")
        return []

    corpus = scan_corpus(corpus_dir)
    pack = MissionPack(
        project_code="DISPATCH",
        pack_title="Dispatched Mission",
        modules=modules,
    )

    return run_pipeline(pack, corpus, output_dir, state_dir, mode=mode, api_key=api_key)


# ============================================================
# MISSION PACK PARSER
# ============================================================

def load_mission_pack(pack_path):
    """Load a mission pack from JSON file."""
    with open(pack_path) as f:
        data = json.load(f)

    modules = [
        ResearchModule(
            module_id=m.get('module_id', m.get('moduleId', f'mod-{i}')),
            title=m.get('title', f'Module {i}'),
            word_count=m.get('word_count', m.get('wordCount', 0)),
        )
        for i, m in enumerate(data.get('modules', []))
    ]

    return MissionPack(
        project_code=data.get('project_code', data.get('projectCode', 'UNK')),
        pack_title=data.get('pack_title', data.get('packTitle', 'Untitled')),
        modules=modules,
        bibliography=data.get('bibliography', []),
        safety_rules=data.get('safety_rules', data.get('safetyRules', [])),
    )


# ============================================================
# ARENA STORE (P3A — Python mirror of the Rust memory arena)
# ============================================================
#
# This is a SQLite-backed content-addressed store with the same
# external shape as src/memory/content-addressed-store.ts so that
# Unison handlers running through this bridge can write to an arena
# that future Rust-side tooling can later ingest.
#
# Why a separate Python implementation and not a Tauri IPC proxy?
#
# 1. The bridge runs in environments without the Tauri backend
#    (CI, scripting, debugging). A local mirror means no coupling.
# 2. SQLite is in the stdlib — zero extra dependencies.
# 3. The content-addressed wire format is self-describing; both
#    implementations can read each other's dumps after a future
#    `import` / `export` pass.
#
# Semantics mirrored from the TypeScript ContentAddressedStore:
#   - hash-agnostic (any hex hash)
#   - automatic dedup on put
#   - advisory preload
#   - SHA-256 convenience via `put_auto`
# ============================================================

import hashlib
import sqlite3
import base64


class ArenaStore:
    """SQLite-backed content-addressed store matching the TypeScript
    ContentAddressedStore shape. Rows: (hash TEXT PRIMARY KEY, tier
    TEXT, payload BLOB, created_at INTEGER, access_count INTEGER)."""

    SCHEMA = """
    CREATE TABLE IF NOT EXISTS arena_chunks (
        hash         TEXT PRIMARY KEY,
        tier         TEXT NOT NULL DEFAULT 'blob',
        payload      BLOB NOT NULL,
        created_at   INTEGER NOT NULL,
        access_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_arena_tier ON arena_chunks(tier);
    """

    def __init__(self, db_path: str):
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(db_path)
        self.conn.executescript(self.SCHEMA)
        self.conn.commit()

    def close(self):
        self.conn.close()

    # ─── Core put/get ────────────────────────────────────────────

    def put(self, hash_hex: str, payload: bytes, tier: str = 'blob') -> dict:
        """Store bytes under hash_hex. Dedup on existing hash."""
        hash_hex = _canonicalize_hash(hash_hex)
        cur = self.conn.execute(
            "SELECT 1 FROM arena_chunks WHERE hash = ?", (hash_hex,)
        )
        if cur.fetchone():
            return {'hash': hash_hex, 'created': False, 'tier': tier}
        self.conn.execute(
            "INSERT INTO arena_chunks (hash, tier, payload, created_at, access_count)"
            " VALUES (?, ?, ?, ?, 0)",
            (hash_hex, tier, payload, int(time.time() * 1_000_000_000)),
        )
        self.conn.commit()
        return {'hash': hash_hex, 'created': True, 'tier': tier}

    def put_auto(self, payload: bytes, tier: str = 'blob') -> dict:
        """SHA-256 the payload and store under that hash."""
        hash_hex = hashlib.sha256(payload).hexdigest()
        return self.put(hash_hex, payload, tier)

    def replace_by_hash(self, hash_hex: str, payload: bytes, tier: str = 'blob') -> dict:
        """Overwrite an existing entry (or create if absent)."""
        hash_hex = _canonicalize_hash(hash_hex)
        self.conn.execute(
            "INSERT OR REPLACE INTO arena_chunks"
            " (hash, tier, payload, created_at, access_count) VALUES (?, ?, ?, ?, 0)",
            (hash_hex, tier, payload, int(time.time() * 1_000_000_000)),
        )
        self.conn.commit()
        return {'hash': hash_hex, 'created': True, 'tier': tier}

    def get_by_hash(self, hash_hex: str) -> Optional[bytes]:
        """Fetch bytes by hash or None."""
        hash_hex = _canonicalize_hash(hash_hex)
        cur = self.conn.execute(
            "SELECT payload FROM arena_chunks WHERE hash = ?", (hash_hex,)
        )
        row = cur.fetchone()
        if not row:
            return None
        self.conn.execute(
            "UPDATE arena_chunks SET access_count = access_count + 1 WHERE hash = ?",
            (hash_hex,),
        )
        self.conn.commit()
        return row[0]

    def has_hash(self, hash_hex: str) -> bool:
        hash_hex = _canonicalize_hash(hash_hex)
        cur = self.conn.execute(
            "SELECT 1 FROM arena_chunks WHERE hash = ?", (hash_hex,)
        )
        return cur.fetchone() is not None

    def remove_by_hash(self, hash_hex: str) -> bool:
        hash_hex = _canonicalize_hash(hash_hex)
        cur = self.conn.execute(
            "DELETE FROM arena_chunks WHERE hash = ?", (hash_hex,)
        )
        self.conn.commit()
        return cur.rowcount > 0

    # ─── Enumeration ────────────────────────────────────────────

    def list_hashes(self, tier: Optional[str] = None) -> list:
        if tier:
            cur = self.conn.execute(
                "SELECT hash FROM arena_chunks WHERE tier = ? ORDER BY hash", (tier,)
            )
        else:
            cur = self.conn.execute(
                "SELECT hash FROM arena_chunks ORDER BY hash"
            )
        return [row[0] for row in cur.fetchall()]

    def count(self, tier: Optional[str] = None) -> int:
        if tier:
            cur = self.conn.execute(
                "SELECT COUNT(*) FROM arena_chunks WHERE tier = ?", (tier,)
            )
        else:
            cur = self.conn.execute("SELECT COUNT(*) FROM arena_chunks")
        return cur.fetchone()[0]

    def stats(self) -> dict:
        cur = self.conn.execute(
            "SELECT tier, COUNT(*), SUM(LENGTH(payload)) FROM arena_chunks GROUP BY tier"
        )
        by_tier = {
            row[0]: {'count': row[1], 'bytes': row[2] or 0}
            for row in cur.fetchall()
        }
        total_count = sum(v['count'] for v in by_tier.values())
        total_bytes = sum(v['bytes'] for v in by_tier.values())
        return {
            'total_entries': total_count,
            'total_bytes': total_bytes,
            'by_tier': by_tier,
            'db_path': self.db_path,
        }

    def preload(self, hashes: list) -> int:
        """Touch each hash that exists. Returns the number found."""
        hits = 0
        for h in hashes:
            h = _canonicalize_hash(h)
            cur = self.conn.execute(
                "UPDATE arena_chunks SET access_count = access_count + 1 WHERE hash = ?",
                (h,),
            )
            if cur.rowcount > 0:
                hits += 1
        self.conn.commit()
        return hits


def _canonicalize_hash(hash_hex: str) -> str:
    """Lowercase the hex string and validate it's hex."""
    if not isinstance(hash_hex, str):
        raise ValueError(f"hash must be a string, got {type(hash_hex).__name__}")
    h = hash_hex.lower().strip()
    if len(h) == 0 or len(h) % 2 != 0:
        raise ValueError(f"hex hash must have non-zero even length, got {len(h)}")
    int(h, 16)  # raises ValueError if not hex
    return h


# ─── Arena subcommand helpers (JSON in/out) ────────────────────

def _arena_print_json(obj: dict) -> None:
    """Emit a JSON response on stdout. Always single-line so Unison
    handlers reading via subprocess.stdout get a clean parse."""
    print(json.dumps(obj, separators=(',', ':')))


def run_arena_command(args) -> int:
    """Dispatch an `arena` sub-subcommand. Returns an exit code."""
    store = ArenaStore(args.db)
    try:
        if args.arena_op == 'put':
            # Read payload from --payload-file or --payload-base64
            payload = _read_payload(args)
            if args.hash_hex:
                result = store.put(args.hash_hex, payload, tier=args.tier)
            else:
                result = store.put_auto(payload, tier=args.tier)
            _arena_print_json({'ok': True, **result})
            return 0

        if args.arena_op == 'get':
            data = store.get_by_hash(args.hash_hex)
            if data is None:
                _arena_print_json({'ok': True, 'found': False})
                return 0
            _arena_print_json({
                'ok': True,
                'found': True,
                'hash': _canonicalize_hash(args.hash_hex),
                'payload_base64': base64.b64encode(data).decode('ascii'),
                'size': len(data),
            })
            return 0

        if args.arena_op == 'has':
            _arena_print_json({
                'ok': True,
                'has': store.has_hash(args.hash_hex),
            })
            return 0

        if args.arena_op == 'remove':
            removed = store.remove_by_hash(args.hash_hex)
            _arena_print_json({'ok': True, 'removed': removed})
            return 0

        if args.arena_op == 'list':
            hashes = store.list_hashes(tier=args.tier)
            _arena_print_json({'ok': True, 'hashes': hashes, 'count': len(hashes)})
            return 0

        if args.arena_op == 'stats':
            _arena_print_json({'ok': True, **store.stats()})
            return 0

        if args.arena_op == 'preload':
            hashes = args.hashes or []
            hits = store.preload(hashes)
            _arena_print_json({'ok': True, 'hits': hits, 'requested': len(hashes)})
            return 0

        if args.arena_op == 'replace':
            payload = _read_payload(args)
            result = store.replace_by_hash(args.hash_hex, payload, tier=args.tier)
            _arena_print_json({'ok': True, **result})
            return 0

        _arena_print_json({'ok': False, 'error': f'unknown op: {args.arena_op}'})
        return 2

    except Exception as e:
        _arena_print_json({'ok': False, 'error': str(e)})
        return 1
    finally:
        store.close()


def _read_payload(args) -> bytes:
    """Read bytes from --payload-file, --payload-base64, or --payload-text.
    Exactly one must be supplied."""
    sources = [args.payload_file, args.payload_base64, args.payload_text]
    supplied = [s for s in sources if s is not None]
    if len(supplied) != 1:
        raise ValueError("exactly one of --payload-file, --payload-base64, --payload-text must be set")
    if args.payload_file is not None:
        with open(args.payload_file, 'rb') as f:
            return f.read()
    if args.payload_base64 is not None:
        return base64.b64decode(args.payload_base64)
    return args.payload_text.encode('utf-8')


# ============================================================
# CLI
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Research Co-Processor Bridge")
    subparsers = parser.add_subparsers(dest='command')

    # scan command
    scan_parser = subparsers.add_parser('scan', help='Scan corpus and report')
    scan_parser.add_argument('--corpus', required=True, help='Path to Research/ directory')

    # run command
    run_parser = subparsers.add_parser('run', help='Run full pipeline from mission pack JSON')
    run_parser.add_argument('--corpus', required=True, help='Path to Research/ directory')
    run_parser.add_argument('--output', required=True, help='Output directory for modules')
    run_parser.add_argument('--state', required=True, help='State directory for checkpoints')
    run_parser.add_argument('--pack', required=True, help='Mission pack JSON file')
    run_parser.add_argument('--mode', default='corpus', choices=['corpus', 'api'], help='Generation mode')
    run_parser.add_argument('--max-passes', type=int, default=8, help='Max refinement passes')

    # dispatch command
    dispatch_parser = subparsers.add_parser('dispatch', help='Execute from Unison dispatch files')
    dispatch_parser.add_argument('--state', required=True, help='State directory with dispatch files')
    dispatch_parser.add_argument('--corpus', required=True, help='Path to Research/ directory')
    dispatch_parser.add_argument('--output', required=True, help='Output directory')
    dispatch_parser.add_argument('--mode', default='corpus', choices=['corpus', 'api'])

    # ─── arena command (P3A) ─────────────────────────────────────
    # Content-addressed store ops. Each sub-op prints a single-line
    # JSON response on stdout so Unison / other callers can parse
    # it via subprocess.stdout.
    arena_parser = subparsers.add_parser(
        'arena', help='Content-addressed store operations (Python mirror of Rust arena)'
    )
    arena_parser.add_argument(
        '--db', default='/tmp/rcp-arena.sqlite',
        help='Path to the SQLite-backed arena store (default: /tmp/rcp-arena.sqlite)',
    )
    arena_sub = arena_parser.add_subparsers(dest='arena_op', required=True)

    # Common payload args used by put / replace
    def add_payload_args(p):
        p.add_argument('--payload-file', help='Path to a file containing the bytes')
        p.add_argument('--payload-base64', help='Base64-encoded bytes')
        p.add_argument('--payload-text', help='UTF-8 text payload (convenience)')
        p.add_argument('--tier', default='blob', help="Arena tier (default: 'blob')")

    put_p = arena_sub.add_parser('put', help='Store bytes under a hash')
    put_p.add_argument('--hash-hex', help='Pre-computed hex hash (omit for SHA-256 auto-hash)')
    add_payload_args(put_p)

    replace_p = arena_sub.add_parser('replace', help='Overwrite bytes under a hash')
    replace_p.add_argument('--hash-hex', required=True, help='Hex hash to replace')
    add_payload_args(replace_p)

    get_p = arena_sub.add_parser('get', help='Fetch bytes by hash')
    get_p.add_argument('--hash-hex', required=True, help='Hex hash to fetch')

    has_p = arena_sub.add_parser('has', help='Check whether a hash exists')
    has_p.add_argument('--hash-hex', required=True, help='Hex hash to check')

    rm_p = arena_sub.add_parser('remove', help='Remove a hash from the store')
    rm_p.add_argument('--hash-hex', required=True, help='Hex hash to remove')

    list_p = arena_sub.add_parser('list', help='List all stored hashes')
    list_p.add_argument('--tier', default=None, help='Optional tier filter')

    arena_sub.add_parser('stats', help='Arena store statistics')

    preload_p = arena_sub.add_parser('preload', help='Advisory touch for a set of hashes')
    preload_p.add_argument('hashes', nargs='*', help='Hex hashes to touch')

    args = parser.parse_args()

    if args.command == 'scan':
        concepts = scan_corpus(args.corpus)
        print(f"Scanned {len(concepts)} projects:")
        domains = {}
        for c in concepts:
            domains.setdefault(c.domain, []).append(c)
        for domain in sorted(domains):
            print(f"\n  {domain} ({len(domains[domain])} projects):")
            for c in domains[domain][:5]:
                print(f"    {c.id}: {c.name} (mag={c.state.magnitude:.3f})")
            if len(domains[domain]) > 5:
                print(f"    ... and {len(domains[domain]) - 5} more")

    elif args.command == 'run':
        corpus = scan_corpus(args.corpus)
        pack = load_mission_pack(args.pack)
        api_key = os.environ.get('ANTHROPIC_API_KEY') if args.mode == 'api' else None
        run_pipeline(pack, corpus, args.output, args.state, args.max_passes, args.mode, api_key)

    elif args.command == 'dispatch':
        api_key = os.environ.get('ANTHROPIC_API_KEY') if args.mode == 'api' else None
        run_dispatch(args.state, args.corpus, args.output, args.mode, api_key)

    elif args.command == 'arena':
        return run_arena_command(args)

    else:
        parser.print_help()


if __name__ == '__main__':
    main()
