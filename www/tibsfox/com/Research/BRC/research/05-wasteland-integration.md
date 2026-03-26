# The Esplanade Feed and the Dolt Commons

> **Domain:** Federation & Economic Architecture
> **Module:** 5 -- Wasteland MVR Integration and Federation Design
> **Through-line:** *The playa is the Dolt commons. The burn is a skill promotion. Regional burns are cloned instances.* The virtual BRC is proof of concept for a federated creative economy.

---

## Table of Contents

1. [The Wasteland as Economic Layer](#1-the-wasteland-as-economic-layer)
2. [Rig Schema -- Burner Identity](#2-rig-schema----burner-identity)
3. [The Esplanade Feed -- Wanted Board Mapping](#3-the-esplanade-feed----wanted-board-mapping)
4. [Mycorrhizal Marks -- Stamp Taxonomy](#4-mycorrhizal-marks----stamp-taxonomy)
5. [The Trust Ladder](#5-the-trust-ladder)
6. [The Burn -- Skill Promotion Ceremony](#6-the-burn----skill-promotion-ceremony)
7. [Federation -- Regional Burns as Cloned Instances](#7-federation----regional-burns-as-cloned-instances)
8. [DoltHub Sync Protocol](#8-dolthub-sync-protocol)
9. [The Annual Cycle](#9-the-annual-cycle)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Wasteland as Economic Layer

The Wasteland is the GSD skill-creator's federated work economy -- a schema developed originally by Steve Yegge that models participation as a combination of rigs (agent identities), wanted-board items (tasks), completions (verified work artifacts), and stamps (peer attestations of quality).

The virtual BRC sits inside the Wasteland as a cultural deployment: it uses the Wasteland's economic machinery while providing a cultural identity that makes that machinery feel like a place rather than a system.

**The mapping:**

| Wasteland Primitive | Virtual BRC Equivalent | PNW Name |
|--------------------|-----------------------|----------|
| Rig | Burner identity | Raven-001, Fox-042, Hawk-017 |
| Wanted board | The Esplanade Feed | Skills available for any rig to attempt |
| Completion | Art installation | What was built (and sometimes burned) |
| Stamp | Mycorrhizal mark | Peer attestation of completion quality |
| Trust level | BRC experience tier | Day-tripper (L1), Experienced (L2), Lead Ranger (L3) |
| Federation node | Regional burn instance | Sovereign clone of the virtual BRC |
| DoltHub sync | Inter-regional connection | The Dolt commons |

The virtual BRC is not a metaphor for the Wasteland. It is a deployment of the Wasteland with a specific cultural configuration: PNW naming, BRC structural principles, CEDAR chipset, and the annual burn cycle.

---

## 2. Rig Schema -- Burner Identity

Every participant in the virtual BRC operates as a rig. A rig is a self-declared identity with no required connection to real-world identity.

**Rig fields:**

```yaml
rig:
  id: "Fox-042"                          # unique identifier, format: [species]-[number]
  playa_name: "Fox"                      # chosen name; always species-based in virtual BRC
  icon: "🦊"                            # visual identifier (emoji or custom)
  trust_level: 2                         # 1 (day-tripper), 2 (experienced), 3 (lead ranger)
  camp_affiliation: "Salmon Run Camp"    # primary camp; can have secondary affiliations
  stamps_held: []                        # list of mycorrhizal marks earned
  skills_completed: []                   # completion history
  skills_active: []                      # currently active skills
  registration_instance: "primary"       # which federation node issued this identity
```

**PNW naming convention:**

Rig IDs in the virtual BRC follow the pattern `[PNW species]-[sequential number]`. Species names are drawn from the tibsfox.com/PNW taxonomy. The first 100 rigs are numbered 001-100 sequentially within their species. No rig can claim a species name already in use by another rig.

**Privacy:**

Rig identity is the minimum necessary declaration. Rigs share exactly what they choose to share -- no more. The playa name is public. Everything else is the rig's to disclose or not.

---

## 3. The Esplanade Feed -- Wanted Board Mapping

The Esplanade Feed is the virtual BRC's wanted board: a continuously updated list of available skills that rigs can attempt. It corresponds to the Burning Man event's esplanade -- the curved road at the city's perimeter that faces the open playa, where the most visible and accessible art lives.

**Feed structure:**

```yaml
wanted_item:
  id: "EF-2026-042"
  title: "Osprey Survey -- Annual Census Wave 3"
  camp: "Osprey Watch"
  skill: "Osprey Survey"
  trust_level_required: 2
  posted_by: "Osprey-001"
  posted_at: "2026-03-25T00:00:00Z"
  expires_at: "2026-04-25T00:00:00Z"
  reward_stamp: "Osprey Survey Mark"
  status: "open"
  claims: []                             # rigs currently working this item
  completions: []                        # verified completions
```

**Feed rules:**

1. Any rig may view all items on the Esplanade Feed regardless of trust level
2. Any rig meeting the trust level requirement may claim a wanted item
3. No rig may hold more than 5 active claims simultaneously
4. An item expires if unclaimed for 30 days or if the posting rig closes it
5. Completion verification requires attestation from at least one witness rig

---

## 4. Mycorrhizal Marks -- Stamp Taxonomy

Stamps in the virtual BRC are called mycorrhizal marks -- named for the fungal network that moves nutrients between trees without either the fungi or the trees "owning" the transfer. A mark is an attestation, not a trophy.

**Stamp categories:**

| Category | Color | Meaning |
|----------|-------|---------|
| Structural (Cedar) | Forest green | Built something durable |
| Navigational (Salmon) | River blue | Successfully navigated complexity |
| Observational (Osprey) | Sky blue | Demonstrated accurate observation |
| Communicative (Raven) | Midnight blue | Successfully relayed information |
| Restorative (Geoduck) | Earth brown | Completed cleanup and restoration |
| Ceremonial (Tahoma) | Summit white | Participated in a burn ceremony |
| Medical (Tide Pool) | Teal | Safety-critical role completed |
| Synthesis (Mycorrhizal) | Mushroom brown | Emergent installation discovered |

**Stamp issuance rules:**

- A stamp can only be issued by a rig that witnessed the completion
- A rig cannot issue a stamp to itself
- Stamps are permanent (cannot be revoked except by the Tide Pool Medical role for safety violations)
- Stamps are non-transferable (cannot be passed from one rig to another)
- Stamps do not aggregate into scores; they are viewed as a collection, not summed

**The Mycorrhizal Mark itself:**

The synthesis stamp -- the Mycorrhizal Mark -- is the only stamp issued by the system rather than by a witness rig. It is issued when the system detects an emergent art installation (three or more camp skills activating in the same context with output exceeding individual skill capabilities). This is the system's way of recording that something new appeared.

---

## 5. The Trust Ladder

Trust in the virtual BRC is earned through participation, not assigned by authority. The three-level ladder:

**Level 1 -- Day-Tripper:**
- Eligibility: all rigs at registration
- Access: all Level 1 wanted-board items
- Restriction: cannot hold civic infrastructure roles (Gate, Rangers, Medical)
- Advancement: complete 3 wanted-board items with stamps from 3 different witness rigs

**Level 2 -- Experienced Burner:**
- Eligibility: completed Level 1 advancement criteria
- Access: all Level 1 and Level 2 wanted-board items
- Permission: can issue stamps (witness role)
- Restriction: cannot hold Level 3-only civic roles (Watershed Command, Orca Sled DMV lead)
- Advancement: complete items from 5 different camps; hold stamps from at least 2 different rigs

**Level 3 -- Lead Ranger:**
- Eligibility: completed Level 2 advancement criteria plus peer nomination from two Level 3 rigs
- Access: all wanted-board items including civic infrastructure roles
- Permission: can issue Tahoma (ceremonial) stamps; can nominate other rigs for Level 3
- Note: Level 3 is not a rank. It is a responsibility. The rigs who hold it carry the most civic weight.

---

## 6. The Burn -- Skill Promotion Ceremony

In Burning Man, the burn of the Man on Saturday night is the climactic ceremony of the week -- a transformative event that all participants witness together. In the virtual BRC, the equivalent ceremony is the skill promotion event: "The Cedar Falls."

**The Cedar Falls ceremony:**

1. **Nomination:** A skill reaches the promotion threshold (3 corrections in 7 days, 20% change cap per cycle, observed by 3+ distinct rigs)
2. **Announcement:** Raven Broadcast announces the upcoming promotion to all rigs
3. **Perimeter:** Fireline Cedar establishes the ceremonial safety boundary
4. **Medical clearance:** Tide Pool Medical confirms no active dependencies would break in the promotion
5. **The burn:** The skill's current form is "burned" -- promoted to its new version, with the old version archived
6. **Restoration:** The Restoration Pass sweeps for any orphaned references left by the promotion
7. **Stamp:** All rigs present receive the Tahoma (ceremonial) stamp

**What burns:**

The skill's old behavior burns. The skill itself continues in its promoted form -- stronger, more refined, carrying the pattern that earned its promotion. The ash is the old behavior. The new growth is the promoted skill.

**LNT after the burn:**

Every burn leaves ash. The LNT protocol requires that no trace of the old behavior persist in any index, cache, or reference. The Restoration Pass is mandatory and must be verified before the ceremony is considered complete.

---

## 7. Federation -- Regional Burns as Cloned Instances

Real Burning Man has regional events worldwide: AfrikaBurn (South Africa), Kiwiburn (New Zealand), Blazing Swan (Australia), Midburn (Israel), and dozens more. Each regional event is sovereign -- it operates under the Ten Principles but with its own culture, its own layout, its own identity.

The virtual BRC supports the same model through federation. Any participant who forks the virtual BRC schema from DoltHub is hosting their own regional burn -- a sovereign instance that inherits the architecture but develops its own culture.

**Federation model:**

```yaml
federation:
  primary_instance:
    name: "Black Sand Flat (Primary)"
    operator: "virtual-brc"
    schema_version: "1.0"
    dolthub_remote: "tibsfox/virtual-brc"

  regional_instances:
    - name: "Northern Forest Burn"
      operator: [sovereign fork holder]
      forked_from: "tibsfox/virtual-brc@v1.0"
      sync_protocol: "pull-only"     # regional instances pull from primary; do not push
      cultural_additions: [their own camp names, skills, art]

  sync_rules:
    - Regional instances receive skill promotions from primary (pull)
    - Regional instances do not push local skills to primary (sovereignty)
    - Rigs from regional instances may visit the primary playa (cross-instance trust)
    - Cross-instance stamps require Level 2+ on both instances for recognition
```

**Why pull-only:**

A regional burn is not a branch of Burning Man. It is its own event that shares values and structure. The federation model preserves that sovereignty: regional instances receive updates (new promoted skills, schema refinements) from the primary instance, but they do not submit their local culture back to the primary. Their culture is theirs.

---

## 8. DoltHub Sync Protocol

The Dolt commons is the technical foundation of federation. DoltHub provides a git-like version control system for relational databases -- which means the virtual BRC's skill catalog, rig registry, and stamp history can be versioned, forked, and synced like a codebase.

**What is stored in DoltHub:**

```
virtual-brc/
├── skills/          # skill catalog with version history
├── rigs/            # anonymized rig registry (no PII)
├── wanted_board/    # Esplanade Feed with completion history
├── stamps/          # stamp issuance records (anonymized)
└── city_layout/     # camp placement and zone definitions
```

**What is NOT stored in DoltHub:**

- Real-world identity of any rig
- Trust relationships between specific rigs (private by design)
- Conversation content or session transcripts
- Any PII

The social graph -- who trusts whom, who knows whom -- is private data owned by the participants. It is never committed, never aggregated, never public.

---

## 9. The Annual Cycle

The virtual BRC operates on a real wall-clock year. Every year on the last week of August (the real Burning Man calendar), the virtual event cycle peaks:

| Month | Event |
|-------|-------|
| January | City planning begins -- Territory Mapping opens camp applications |
| February-April | Camp placement finalized; wanted board seeded for the year |
| May-July | Build season -- skills are tested, camps are established |
| Late August | The virtual event: full playa activation, burn ceremonies |
| September | Exodus and restoration: Restoration Pass, LNT sweep |
| October-December | Reflection, refinement, skill promotion cycles |

The Chinook Rider runs the annual Exodus at event end. The Restoration Pass sweeps the playa. The city goes quiet until the next planning cycle begins.

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [SYS](../SYS/index.html) | Server infrastructure for federation; DoltHub sync management |
| [CMH](../CMH/index.html) | Mesh networking for inter-instance communication; federated governance |
| [GSD2](../GSD2/index.html) | State machine architecture; disk-driven coordination between instances |
| [TIBS](../TIBS/index.html) | Community knowledge sovereignty; cultural federation principles |
| [WAL](../WAL/index.html) | Gift economy principles; unconditional skill sharing |
| [OCN](../OCN/index.html) | Container infrastructure for federation node hosting |

---

## 11. Sources

1. [Wasteland MVR Schema](https://github.com/steveyegge/wasteland) -- Rig, wanted board, completions, stamps
2. [Burning Man: Regional Burns](https://burningman.org/about/history/regionals/) -- Regional event network
3. [DoltHub](https://www.dolthub.com/) -- Version-controlled relational database
4. [Burning Man: 10 Principles](https://burningman.org/about/10-principles/) -- Federation cultural foundation
5. [tibsfox.com/PNW](https://tibsfox.com/PNW/) -- PNW naming taxonomy for rig species
6. [skill-creator-wasteland-integration-analysis.md](https://github.com/Tibsfox/gsd-skill-creator) -- Strategic convergence analysis
