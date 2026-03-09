# F0-SCHEMA — Virtual Black Rock City Shared Schemas

**Wave:** 0 (Foundation)
**Status:** COMPLETE
**Consumed by:** All Wave 1A, 1B, and Wave 2 components

---

## 1. Rig Identity Schema

A **rig** is a participant agent identity in Virtual Black Rock City. Every rig has a unique identifier following PNW totem naming.

### Format

```
[Totem]-[NNN]
```

- **Totem**: A PNW species name (lowercase, hyphenated if compound)
- **NNN**: 3-digit numeric identifier (zero-padded)

### Valid Totems

| Totem | Species | Source Taxonomy |
|-------|---------|----------------|
| raven | Corvus corax (Common raven) | AVI |
| fox | Vulpes vulpes (Red fox) | MAM |
| hawk | Buteo jamaicensis (Red-tailed hawk) | AVI |
| salmon | Oncorhynchus tshawytscha (Chinook) | ECO |
| orca | Orcinus orca (Orca) | MAM |
| cedar | Thuja plicata (Western red cedar) | COL |
| hemlock | Tsuga heterophylla (Western hemlock) | COL |
| osprey | Pandion haliaetus (Osprey) | AVI |
| owl | Strix occidentalis (Spotted owl) | AVI |
| geoduck | Panopea generosa (Geoduck) | ECO |
| eagle | Haliaeetus leucocephalus (Bald eagle) | AVI |
| elk | Cervus canadensis (Roosevelt elk) | MAM |
| bear | Ursus americanus (Black bear) | MAM |
| douglas | Pseudotsuga menziesii (Douglas fir) | COL |
| willow | Salix (Willow genus) | COL |
| tahoma | Mount Rainier/Tahoma | ECO/GEO |
| chinook | Oncorhynchus tshawytscha (Chinook) | ECO |
| heron | Ardea herodias (Great blue heron) | AVI |
| marten | Martes caurina (Pacific marten) | MAM |
| pika | Ochotona princeps (American pika) | MAM |

### Examples

```
raven-001    # First raven rig
fox-042      # 42nd fox rig
hawk-017     # 17th hawk rig
salmon-128   # 128th salmon rig
orca-007     # 7th orca rig
cedar-055    # 55th cedar rig
```

### Constraints

- Totem MUST be drawn from PNW ecological taxonomy (never cultural/Indigenous names)
- NNN range: 001–999
- A rig identifier is permanent once assigned — it cannot be changed
- Rig identifiers are globally unique across all federated wastelands

### Rig Record Structure

```yaml
rig:
  id: "raven-001"
  totem: raven
  species: "Corvus corax"
  source_taxonomy: AVI
  trust_level: 1          # 1=Day Tripper, 2=Experienced Burner, 3=Lead Ranger
  home_camp: null          # Camp affiliation (optional)
  stamps_received: []      # Mycorrhizal marks from other rigs
  stamps_given: []         # Mycorrhizal marks given to other rigs
  active: true
  created_at: "2026-03-09T00:00:00Z"
```

---

## 2. Trust Ladder

Three trust levels map directly to BRC volunteer experience tiers.

| Level | BRC Equivalent | Name | Description | Permissions |
|-------|---------------|------|-------------|-------------|
| 1 | Day Tripper | Seedling | New participant; can attempt any skill, post to wanted board | Browse catalog, claim wanted items, receive stamps |
| 2 | Experienced Burner | Sapling | Demonstrated contribution; has received stamps | Give stamps, lead camp activities, propose art installations |
| 3 | Lead Ranger | Old Growth | Sustained contribution; recognized by community | Civic agent roles, camp leadership, infrastructure access |

### Level Transition Rules

- **1 → 2**: Rig has received at least 3 stamps from 3 different rigs
- **2 → 3**: Rig has received at least 10 stamps from 5+ different rigs AND held a camp lead role
- Levels NEVER decrease (no demotion)
- Level transitions are automatic based on stamp count — no human approval gate
- The Yearbook Rule applies: a rig CANNOT stamp its own work (SC-05)

---

## 3. Stamp Taxonomy (Mycorrhizal Marks)

Stamps replace generic achievement markers with a living-systems vocabulary. Five stamp types, each measuring a different dimension of contribution.

| Stamp Type | Wasteland Dimension | PNW Metaphor | Icon | Description |
|------------|-------------------|--------------|------|-------------|
| spore-mark | Quality | Mycorrhizal spore: the work propagates | 🍄 | Work that seeds further growth; others build on it |
| root-depth | Reliability | Old-growth root system: it holds | 🌲 | Work that is dependable, well-tested, structurally sound |
| canopy-reach | Creativity | Forest canopy gap: it lets light through | 🌿 | Work that opens new possibilities or perspectives |
| nurse-log | Generosity | Nurse log: seeds others without requiring return | 🪵 | Work that helps others succeed, mentoring, documentation |
| salmon-mark | Persistence | Returned upstream against all odds | 🐟 | Work that overcame obstacles, upstream navigation |

### Stamp Record Structure

```yaml
stamp:
  id: "stamp-00001"
  type: "spore-mark"
  giver_rig: "fox-042"
  receiver_rig: "raven-001"
  work_ref: "skills/virtual-brc/roles/osprey-landing.md"
  note: "Clean skill spec, good dependency mapping"
  timestamp: "2026-03-09T12:00:00Z"
```

### Stamp Rules

1. **Yearbook Rule (SC-05):** A rig CANNOT stamp its own completion
2. **Anti-commodification (SC-06):** Stamps cannot be traded, sold, aggregated into leaderboards, or used as vanity metrics
3. **One stamp per work per giver:** A rig can only give one stamp per completed work item
4. **No type restrictions:** Any trust level can give any stamp type
5. **Stamps are immutable:** Once given, a stamp cannot be revoked or modified

---

## 4. Camp Cluster Structure

A **camp** (theme camp) is a named group of 3–8 related skills with a designated lead skill (the "camp leader" / "lead ranger" of the cluster).

### Camp Definition Schema

```yaml
camp:
  name: "Cedar Grove"                    # Human-readable camp name
  slug: "cedar-grove"                    # URL-safe identifier
  pnw_source: "Western red cedar ecosystem"
  lead_skill: "skills/virtual-brc/roles/fireline-cedar.md"
  member_skills:
    - "skills/virtual-brc/roles/cascade-brigade.md"
    - "skills/virtual-brc/roles/geoduck-watch.md"
    - "skills/virtual-brc/roles/restoration-pass.md"
  skills_hosted: "Structural build, camp planning, materials management"
  elevation_zone: "ELEV-MONTANE"         # Primary PNW elevation band
  dependencies:
    requires_civic: ["cascade-brigade"]   # Must have DPW sign-off (SC-03)
  max_members: 8
  min_members: 3
```

### Camp Rules

- Every camp MUST have exactly one lead_skill
- Camp activation requires Cascade Brigade (DPW) sign-off (SC-03)
- A skill can belong to at most 2 camps (dual affiliation)
- Camp names are drawn from PNW ecological features

---

## 5. Civic Agent Role Schema

Civic agents form the safety and operational backbone. They are MANDATORY-PASS gates (except Raven Archive which is RECOMMENDED).

### Civic Role Definition

```yaml
civic_role:
  name: "Columbia Gate"
  slug: "columbia-gate"
  brc_equivalent: "Gate, Perimeter, Exodus"
  safety_classification: "MANDATORY-PASS"
  description: "Access control; no rig enters without identity check"
  enforcement: "BLOCK"                   # BLOCK = halt on failure
  bypass_allowed: false
  trust_level_required: 3                # Only Old Growth can serve
  dependencies: []                       # Gate has no upstream dependencies
```

### Safety Classifications

| Classification | Behavior on Failure | Bypass |
|---------------|-------------------|--------|
| MANDATORY-PASS | BLOCK: halt operation, escalate | Never |
| RECOMMENDED | WARN: log warning, continue | With justification |

---

## 6. Art Installation Schema

Art installations are emergent — they arise from multi-camp skill composition and cannot be pre-planned, only discovered.

### Installation Record

```yaml
art_installation:
  archetype: "nurse-log"
  name: "The Cedar Archive"
  emerged_from:
    - camp: "cedar-grove"
      skill: "old-growth-archive"
    - camp: "ravens-roost"
      skill: "raven-archive"
  composition_pattern: "Structured decay seeds new growth"
  discovered_by: "fox-042"
  discovery_date: "2026-03-09"
  stamps_received: []
```

---

## 7. Wanted Board Item Schema

The wanted board (Esplanade Feed) is where rigs post work they want done or skills they want to learn.

### Wanted Item Structure

```yaml
wanted_item:
  id: "want-00001"
  title: "Build navigation skill for salmon upstream routing"
  category: "skill-request"             # skill-request | camp-help | art-proposal | civic-need | learning
  posted_by: "raven-001"
  claimed_by: null                       # null until claimed
  camp_affiliation: "salmon-run-camp"    # optional
  trust_level_required: 1               # minimum level to claim
  status: "open"                         # open | claimed | completed | expired
  created_at: "2026-03-09T00:00:00Z"
```

### Wanted Board Rules

- Any rig at any trust level can post (Radical Inclusion / SC-02 requires identity only)
- Columbia Gate validates rig identity before posting (SC-02)
- 6 pre-seeded categories mirror BRC department clusters
- Federation via DoltHub allows regional wastelands to sync boards

---

## Schema Version

```yaml
schema_version: "1.0.0"
domain: "virtual-brc"
created: "2026-03-09"
compatibility: "wasteland-mvr-v2"
```
