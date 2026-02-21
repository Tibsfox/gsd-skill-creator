---
name: content-curation
description: "Manages legally distributable Amiga content collections with license classification, source verification, and machine-readable YAML catalogs. Use when curating Amiga content, checking legal status, or managing asset collections."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "curate.*content"
          - "legal.*(check|guide|status)"
          - "amiga.*(legal|license|collection)"
          - "content.*catalog"
        files:
          - "infra/amiga/curated-collection.yaml"
          - "infra/amiga/legal-guide.md"
        contexts:
          - "content curation"
          - "legal compliance"
        threshold: 0.7
      token_budget: "1%"
      version: 1
      enabled: true
      plan_origin: "04-amiga-emulation"
      phase_origin: "185"
---

# Content Curation

## Purpose

Manages legally distributable Amiga content collections with conservative license classification and source verification. Maintains a machine-readable YAML catalog of curated content with explicit license status, trusted source attribution, and legal guidance documentation. Ensures all content in the Knowledge World project is legally distributable.

## Capabilities

- Conservative legal approach: exclude when in doubt, only include explicitly permitted content
- Four allowed license values: public_domain, freeware, scene_production, shareware_free
- Five trusted source archives: Aminet, Scene.org, ADA, Mod Archive, AMP (metadata only)
- Machine-readable curated-collection.yaml with per-entry license classification
- Legal guide documentation for Amiga content redistribution
- AROS ROM recommended as default; GSD never distributes Kickstart ROMs
- Content categorization: pixel art, demo scene, tracker music, tools, games

## Key Scripts

| Script | Purpose |
|--------|---------|
| (documentation/YAML-only skill) | No executable scripts -- YAML catalogs and legal documentation |

## Dependencies

- Knowledge of Amiga software licensing landscape
- Access to trusted source archives for verification
- curated-collection.yaml follows strict schema with required license field

## Usage Examples

**Check legal status of content:**
```
Review infra/amiga/legal-guide.md for redistribution rules
per license category (public_domain, freeware, etc.)
```

**Add content to collection:**
```
Add entry to infra/amiga/curated-collection.yaml with:
- name, author, year, category, source (trusted archive)
- license: one of public_domain|freeware|scene_production|shareware_free
- source_url: link to trusted archive page
```

**Validate collection legality:**
```
Verify all entries in curated-collection.yaml have
valid license values from the allowed set
```

## Test Cases

### Test 1: Collection completeness
- **Input:** Read curated-collection.yaml
- **Expected:** Contains 50+ entries with valid license values
- **Verify:** `grep -c 'license:' infra/amiga/curated-collection.yaml` returns >= 50

### Test 2: License value validation
- **Input:** Check all license values in curated-collection.yaml
- **Expected:** All values are one of: public_domain, freeware, scene_production, shareware_free
- **Verify:** `grep 'license:' infra/amiga/curated-collection.yaml | grep -v 'public_domain\|freeware\|scene_production\|shareware_free' | wc -l` returns 0

### Test 3: Trusted sources only
- **Input:** Check all source fields in curated-collection.yaml
- **Expected:** All entries reference one of the 5 trusted archives
- **Verify:** All source_url values point to aminet.net, scene.org, ada.untergrund.net, modarchive.org, or amp.dascene.net

## Token Budget Rationale

1% budget is appropriate for a documentation/YAML-only skill with no executable scripts. The content is primarily catalog data and legal guidance that provides context for content selection decisions but does not require complex script understanding.
