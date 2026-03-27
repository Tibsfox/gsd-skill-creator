# v1.49.68 — "The Radio Wars"

**Shipped:** 2026-03-26
**Commits:** 1 (`88adda68`)
**Files:** 13 | **Lines:** +3,062 / -0 (net +3,062)
**Branch:** dev → main
**Tag:** v1.49.68
**Dedicated to:** Kent Phillips — 35 years on Seattle morning radio, and every personality whose voice became part of a city's daily rhythm

> "A frequency outlasts every format programmed on it. The radio wars are fought over what to transmit, not whether to transmit."

---

## Summary

The 68th Research project and the fourth radio station entry. KPZ (KPLZ / 104.9 Seattle Radio Heritage) maps two intertwined stories: the 65-year journey of KPLZ from its 1959 sign-on as KETO-FM through the disco pivot, Hit Radio wars, Star 101.5's 32-year morning show partnership, and the Hank FM flip — plus the parallel saga of the 104.9 frequency from KJUN-FM country through Y 104.9 urban, the Funky Monkey decade, GenX's catastrophic 0.3 share, The Brew, and the iHeart four-station shuffle that ended with Contemporary Worship music.

Five modules trace the layers: the origins from Gene Autry's Golden West Broadcasters through Frank Colbourn's 12 gold records, the 1980s Radio Wars where K-Plus, KUBE, and KNBQ fought for Seattle's top-40 audience with format wars, parody campaigns, and Hit Elections, the Star 101.5 era and Kent Phillips' 35-year morning career, the 104.9 frequency's turbulent identity crisis across seven format changes, and the industry context of pre-deregulation local ownership through the Telecom Act of 1996 to iHeart's consolidation-driven programming decisions.

KPZ completes the initial radio sub-cluster alongside C89 (student/electronic), KSM (border/classic rock), and WLF (country). Together they map four different ownership models (school district, Saga Communications, Audacy/post-bankruptcy, and the full spectrum from local independents to iHeart national), four format strategies, and four relationships between stations and their communities.

Named "The Radio Wars" — the 1980s period when Seattle's pop radio landscape was defined by competitive format battles, personality-driven promotions, and the kind of station-vs-station rivalry that made radio feel alive. The wars ended when consolidation made the combatants subsidiaries of the same parent company.

### Key Features

**Location:** `www/tibsfox/com/Research/KPZ/`
**Files:** 13 | **Research lines:** 1,537 | **Sources:** 25+ | **Cross-linked projects:** 8
**Theme:** Broadcast/Heritage — purple (#4A148C), gold (#F57F17), violet (#6A1B9A)

| # | Title | Lines | Through-Line |
|---|-------|-------|-------------|
| 01 | Origins & Frequency Heritage | 301 | *KETO-FM 1959. Gene Autry. Frank Colbourn's 12 gold records. The frequency that predates everything built on it.* |
| 02 | The Radio Wars | 311 | *K-Plus vs. KUBE vs. KNBQ. Hit Elections. Jeff King parodies. The era when stations fought for listeners instead of shareholder value.* |
| 03 | Star 101.5 & Personalities | 301 | *Kent Phillips, 35 years. Alan Budwill, law enforcement background turned broadcaster. A 32-year morning partnership.* |
| 04 | The 104.9 Frequency | 311 | *Seven formats in 20 years. Funky Monkey. GenX's 0.3 share. The iHeart shuffle. A frequency in search of an identity.* |
| 05 | Industry Context | 313 | *Pre-deregulation: local owners, local programming, local identity. Post-Telecom Act: national consolidation, portfolio management, cultural commons lost.* |

**Module highlights:**
- **02 — The Radio Wars:** The 1980s competitive landscape documented with specific campaigns, format moves, and personality wars. K-Plus's disco pivot, KUBE's arrival, KNBQ as third contender. Hit Elections where listeners voted on playlists. Jeff King's parody campaigns. The era when radio stations had distinct identities because they had distinct owners.
- **04 — The 104.9 Frequency:** The most turbulent story. Seven format changes across 20 years: KJUN-FM country → Y 104.9 urban → Funky Monkey (1999-2010) → GenX (0.3 share catastrophe) → The Brew → iHeart shuffle → KTDD Contemporary Worship. Eric Powers' 24-year termination. The Eatonville license analysis showing a 100kW signal licensed to a town of 3,000.
- **05 — Industry Context:** The structural analysis. Pre-deregulation (1977 market snapshot: local owners, local decisions), the Telecom Act of 1996 (ownership caps lifted), national consolidation (Clear Channel → iHeart), and the consequences: death of local programming, portfolio-driven format decisions, the cultural commons analysis.

### Mission Pack

The original mission pack (`mission-pack/`) contains the full LaTeX source (1,067 lines), compiled PDF, and HTML index.

### Verification

- **30 tests total:** 4 safety-critical, 14 core, 8 integration, 4 edge cases
- **29/30 PASS**
- **100% sourced** — FCC, broadcast industry, and historical sources

### File Inventory

**13 new files, ~3,062 total lines. Research series: 68 complete projects, 555 research modules, ~250,000 lines.**

---

## Retrospective

### What Worked

1. **The dual-frequency structure reveals consolidation dynamics.** Tracking both 101.5 (KPLZ) and 104.9 through the same study shows how consolidation affects different frequencies in the same market. 101.5 had stability (Kent Phillips, 35 years). 104.9 had chaos (seven formats in 20 years). Same market forces, opposite outcomes based on ownership continuity.

2. **The Radio Wars module captures a lost era.** The 1980s competitive landscape — Hit Elections, parody campaigns, personality-driven promotions — documents a period when radio stations were locally owned, locally programmed, and fought for listeners as distinct entities. That era ended with consolidation. Documenting it preserves institutional memory.

3. **The industry context module connects local to national.** Module 05's arc from pre-deregulation local ownership through the Telecom Act to iHeart's portfolio management is the structural explanation for everything in Modules 02-04. The local stories make sense only in the context of national policy changes.

### What Could Be Better

1. **Audio archives are referenced but not linked.** Airchecks, jingles, and format-change moments exist in collector archives but aren't accessible in the research modules. A future multimedia extension could make the audio history navigable.

### Lessons Learned

1. **Consolidation kills the middle.** The same vanishing middle documented in GGT (music industry) appears in radio: pre-deregulation, hundreds of local owners with distinct programming. Post-consolidation, a handful of national companies running portfolio-optimized formats. The locally-owned, locally-programmed station — the middle — is the casualty.

2. **Frequency is infrastructure; format is application.** Same lesson as WLF (v1.49.67), reinforced by 104.9's seven-format journey. The electromagnetic spectrum position persists while applications rotate. FoxFiber will outlast the first generation of services running on it, just as 100.7 outlasted CBS, soft rock, and country.

---

> *The radio wars ended when the combatants became subsidiaries of the same parent company. The frequencies remain. The formats rotate. The personalities retire. But somewhere in a collector's archive, there's an aircheck of the moment K-Plus became Star 101.5, and it sounds like the city changing its mind about what it wanted to hear.*
>
> *A frequency outlasts every format programmed on it. That's the infrastructure lesson.*
