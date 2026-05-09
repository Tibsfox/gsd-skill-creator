# PROV-O JSON-LD Templates

Mustache-style templates for emitting PROV-O / JSON-LD records from
the SCRIBE provenance graph. Source-of-truth doc:
`.planning/missions/v1-49-621-scribe/t5-retrieval-provenance/05-provenance-schemas.md`

## Templates

| Template | Emits |
|---|---|
| `commit.jsonld` | A `prov:Entity` + `schema:SoftwareSourceCode` for a git commit |
| `session.jsonld` | A `prov:Activity` for a Claude Code session |
| `decision.jsonld` | A `prov:Entity` + `prov:Plan` for an explicit decision event |
| `file.jsonld` | A `prov:Entity` + `schema:DigitalDocument` for a tracked file |

## Rendering

The cartridge ships a minimal renderer at `extractor/render-prov-o.mjs` that
takes a row from `prov_node` and the matching template, expands the placeholders,
and emits canonical JSON-LD. The renderer is intentionally trivial — Mustache
substitution + JSON validation. Use any JSON-LD library to expand / compact /
frame the resulting documents.

## The complete bundle

A complete provenance bundle for a single commit looks like:

```json
{
  "@context": "https://www.w3.org/ns/prov.jsonld",
  "@type": "prov:Bundle",
  "@id": "scribe:bundle/commit/<sha>",
  "@graph": [
    /* commit Entity (commit.jsonld) */,
    /* session Activity (session.jsonld) */,
    /* operator Agent */,
    /* claude Agent */,
    /* one or more decision Entities (decision.jsonld) */,
    /* one or more rejected-alternative Entities */,
    /* used file Entities (file.jsonld) */
  ]
}
```

Bundles are the unit of import/export. A consumer can `prov:wasInfluencedBy`
an entire bundle without unpacking it.

## Validation

Validate against the W3C PROV-O ontology with any RDF tool:

```bash
# Using rdflib + pyld:
python -c "
from pyld import jsonld
import json
with open('out.jsonld') as f:
    expanded = jsonld.expand(json.load(f))
    print(json.dumps(expanded, indent=2))
"
```

For round-trip validation (JSON-LD → RDF triples → re-serialize → diff)
see https://www.w3.org/TR/json-ld11/ §11 (Algorithms).
