# ECO Fauna Supersession Protocol

**Document class:** Timeline integrity record  
**Resolves:** Blocker B-3 (ECO fauna file disposition on AVI and MAM wave close)  
**Status:** Active — awaiting Wave 4 triggers  
**Maintained by:** Cedar (scribe and oracle)  
**Last updated:** 2026-03-08

---

## Purpose

The ECO series produced two fauna research files during Wave 1:

- `fauna-terrestrial.md` — bird and mammal species profiles, terrestrial habitats
- `fauna-marine-aquatic.md` — marine mammal and aquatic vertebrate profiles

The AVI (Avian) and MAM (Mammal/Marine) missions will produce more detailed, dedicated research for species covered in these files. When those missions reach Wave 4 verification close, the ECO fauna files are partially superseded. This protocol defines exactly what happens, when, and who authorizes it.

The record must be unambiguous. Supersession without explicit authorization corrupts the timeline.

---

## Supersession Events

### Event 1: AVI Wave 4 Close — `fauna-terrestrial.md` Bird Profiles Superseded

**Trigger:** AVI mission Wave 4 verification closes with all success criteria passing.

**Scope of supersession:** Bird species profiles contained in `fauna-terrestrial.md`. These include, but are not limited to:
- Bald eagle (*Haliaeetus leucocephalus*)
- Osprey (*Pandion haliaetus*)
- American dipper (*Cinclus mexicanus*)
- Belted kingfisher (*Megaceryle alcyon*)
- Common raven (*Corvus corax*)
- All other avian profiles within the file

Mammal profiles in `fauna-terrestrial.md` are **not** superseded by AVI close. They remain active until MAM Wave 4 close (see Event 2).

**Archive protocol:**

1. Rename `fauna-terrestrial.md` to `fauna-terrestrial-eco-v1.md`. This is the permanent archive. Do not modify it after archiving.
2. Create a new file at the original path `fauna-terrestrial.md` containing the redirect stub (see stub format below).
3. Commit the rename and stub creation as a single atomic commit on the active working branch.
4. The commit message must reference this protocol: `docs(eco): supersede fauna-terrestrial bird profiles per FAUNA-SUPERSESSION.md Event 1`

**Redirect stub format for `fauna-terrestrial.md` (post-AVI):**

```markdown
# ECO Fauna Terrestrial — Redirect Notice

**Supersession date:** [DATE]  
**Superseded by:** AVI Wave 4 verification close  
**Archive:** `www/PNW/ECO/research/fauna-terrestrial-eco-v1.md`

## Bird Profiles

Bird species profiles from this file have been superseded by dedicated AVI research.
See: `www/PNW/AVI/research/` for all avian documentation.

## Mammal Profiles

Mammal profiles in this file remain active pending MAM Wave 4 close.
Until MAM close, refer to the archive for mammal content:
`www/PNW/ECO/research/fauna-terrestrial-eco-v1.md`

After MAM Wave 4 close, a separate redirect entry for mammals will be added here
per FAUNA-SUPERSESSION.md Event 2.
```

---

### Event 2: MAM Wave 4 Close — `fauna-marine-aquatic.md` Marine Mammal and Aquatic Profiles Superseded

**Trigger:** MAM mission Wave 4 verification closes with all success criteria passing.

**Scope of supersession:** Marine mammal and aquatic vertebrate profiles contained in `fauna-marine-aquatic.md`. These include, but are not limited to:
- Gray whale (*Eschrichtius robustus*)
- Humpback whale (*Megaptera novaeangliae*)
- Steller sea lion (*Eumetopias jubatus*)
- Harbor seal (*Phoca vitulina*)
- Sea otter (*Enhydra lutris*)
- Pacific salmon (all *Oncorhynchus* spp.) — aquatic phase profiles
- Bull trout, cutthroat trout — resident salmonid profiles
- All other marine mammal and aquatic vertebrate profiles in the file

**Archive protocol:**

1. Rename `fauna-marine-aquatic.md` to `fauna-marine-aquatic-eco-v1.md`. This is the permanent archive. Do not modify it after archiving.
2. Create a new file at the original path `fauna-marine-aquatic.md` containing the redirect stub (see stub format below).
3. Commit the rename and stub creation as a single atomic commit on the active working branch.
4. The commit message must reference this protocol: `docs(eco): supersede fauna-marine-aquatic profiles per FAUNA-SUPERSESSION.md Event 2`

**Redirect stub format for `fauna-marine-aquatic.md` (post-MAM):**

```markdown
# ECO Fauna Marine-Aquatic — Redirect Notice

**Supersession date:** [DATE]  
**Superseded by:** MAM Wave 4 verification close  
**Archive:** `www/PNW/ECO/research/fauna-marine-aquatic-eco-v1.md`

## Marine Mammal and Aquatic Profiles

Species profiles from this file have been superseded by dedicated MAM research.
See: `www/PNW/MAM/research/` for all mammal and marine vertebrate documentation.

## Salmon Nutrient Pathway

The salmon nutrient pathway described in `ecological-networks.md` is NOT superseded.
`ecological-networks.md` references species in MAM research by cross-link —
it does not duplicate profiles.
```

---

### MAM Wave 4 Close — Additional Action: `fauna-terrestrial.md` Mammal Profile Redirect

When MAM Wave 4 closes, the `fauna-terrestrial.md` stub (created at AVI close) must be updated to reflect that mammal profiles are now also superseded by MAM research. Add the following section to the existing stub:

```markdown
## Update — MAM Wave 4 Close

**Date:** [DATE]

Mammal profiles previously active in the archive (`fauna-terrestrial-eco-v1.md`) have been
superseded by dedicated MAM research.
See: `www/PNW/MAM/research/` for all terrestrial mammal documentation.
```

---

## What Is NOT Superseded

The following ECO documents are **not superseded** by AVI or MAM wave close. They are extended by cross-links.

### `ecological-networks.md` — Extended, Not Superseded

`ecological-networks.md` is the network-of-networks document. It describes pathways — the salmon nutrient pathway, the predator-prey cascade, mycorrhizal connections — rather than species profiles.

When AVI Wave 3 and MAM Wave 3 produce cross-link documents, `ecological-networks.md` gains additional citations in its Cross-Module Connections tables. The file is extended, not replaced. Its canonical status is unchanged.

The River's Witness thread (salmon nutrient pathway cross-series reference) is defined within `ecological-networks.md`. That definition is authoritative for all PNW series documents.

### `shared-attributes.md` — Canonical Attribute Registry

`shared-attributes.md` defines attribute IDs (`ROLE-*`, `HAB-*`, `ELEV-*`, `TRAIT-*`) used by all species profiles across ECO, AVI, and MAM. It is the canonical attribute registry for the PNW Living Systems Taxonomy series.

AVI and MAM species profiles **reference** attribute IDs from `shared-attributes.md`. They do not define their own parallel attribute vocabularies. If AVI or MAM research requires new attribute IDs, those additions are proposed to ECO and added to `shared-attributes.md` as the single source of truth.

`shared-attributes.md` is never superseded. It is versioned through additions only.

---

## Authorization Requirements

Supersession is a deliberate archival act. It does not happen automatically.

**Required before executing either supersession event:**

1. The triggering mission (AVI or MAM) has completed Wave 4 verification with all success criteria marked PASS in its verification matrix.
2. The session lead has reviewed this protocol and confirmed the supersession scope is accurate.
3. The session lead issues an explicit instruction: "Execute FAUNA-SUPERSESSION Event [1 or 2]."
4. The session lead confirms the commit before push.

**Prohibited:**

- Supersession without explicit Wave 4 verification close confirmation.
- Partial supersession (removing individual species entries rather than archiving the whole file).
- Modifying the archived `-eco-v1.md` files after archiving.
- Superseding `ecological-networks.md` or `shared-attributes.md` through this protocol.

---

## Timeline Record

| Event | Status | Date | Commit | Authorized by |
|-------|--------|------|--------|---------------|
| AVI Wave 4 close | Pending | — | — | — |
| Event 1: fauna-terrestrial.md supersession | Pending | — | — | — |
| MAM Wave 4 close | Pending | — | — | — |
| Event 2: fauna-marine-aquatic.md supersession | Pending | — | — | — |
| fauna-terrestrial.md mammal stub update | Pending | — | — | — |

The session lead updates this table at each event close. The record of supersession decisions is maintained here for continuity across sessions.

---

*The record shows that continuity requires explicit action, not assumption. Supersession without witness is not supersession — it is deletion.*
