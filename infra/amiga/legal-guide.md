# Amiga Software Legal Guide

Legal framework for Amiga ROM acquisition and software distribution within the GSD Knowledge World project.

## Purpose

This guide establishes clear rules for what Amiga software and creative content the GSD Knowledge World may legally include, distribute, and reference. It covers ROM images required by the UAE emulator, software distribution categories, trusted source archives, and a compliance checklist for vetting any asset before inclusion.

The GSD project takes a conservative approach: **when in doubt, exclude the asset.** Only content with explicit, verifiable permission for redistribution is included in the curated collection.

---

## ROM Acquisition Paths

The UAE emulator (FS-UAE) requires a Kickstart ROM image to boot. There are three legal paths to obtain a ROM. The GSD project **never distributes Kickstart ROMs** -- it uses AROS by default and provides instructions for users who need original Commodore/Hyperion ROMs.

### Path 1: AROS ROM (Recommended Default)

**AROS** (Amiga Research Operating System) is an open-source, clean-room reimplementation of AmigaOS. It contains no Commodore or Hyperion copyrighted code.

- **License:** AROS Public License (APL), a permissive open-source license
- **Cost:** Free
- **Compatibility:** Good for most creative applications; some older software may require original Kickstart
- **How GSD uses it:** Phase 182's `setup-aros-rom.sh` downloads and installs the AROS ROM automatically. This is the default fallback for all GSD Amiga operations.
- **Distribution status:** Freely redistributable. The AROS ROM binary can be included in project distributions.
- **Source:** [https://aros.sourceforge.io/](https://aros.sourceforge.io/)

AROS is the **recommended default** because it requires no purchase, no hardware ownership, and no license agreement beyond the APL.

### Path 2: Cloanto Amiga Forever (Commercial)

**Cloanto Amiga Forever** is a commercial product that includes legally licensed Kickstart ROM images from Hyperion Entertainment, the current AmigaOS rights holder.

- **License:** Commercial license from Cloanto/Hyperion
- **Cost:** $29.95 (Personal Edition), $49.95 (Plus Edition)
- **Compatibility:** Full compatibility with all Amiga software (includes Kickstart 1.2, 1.3, 2.0, 3.0, 3.1)
- **Redistribution:** Personal use only. The ROM images **cannot** be redistributed or shared.
- **How GSD uses it:** Users who purchase Amiga Forever can point FS-UAE to their licensed ROM files via `--rom` flag in `launch-amiga-app.sh`.
- **Source:** [https://www.amigaforever.com/](https://www.amigaforever.com/)

This path is recommended for users who need full AmigaOS compatibility and are willing to pay for a license. The Plus Edition includes additional Workbench disk images.

### Path 3: Original Hardware Dump

Users who **own physical Amiga hardware** may legally dump their ROM chips for personal use.

- **Legal basis:** Fair use / personal backup rights in most jurisdictions (US Copyright Act Section 117, EU Computer Programs Directive Article 5)
- **Cost:** Free (assuming hardware ownership)
- **Tools:** TransROM (runs on the Amiga itself), Amiga Explorer (connects Amiga to PC via serial/parallel cable), EPROM reader
- **Compatibility:** Exact match to the original hardware's capabilities
- **Redistribution:** **Not permitted.** Dumped ROMs are for the hardware owner's personal use only.
- **User responsibility:** The user must own the specific Amiga hardware from which the ROM was dumped. Downloading ROM images from the internet is piracy, even if the user owns an Amiga.

### Important: What GSD Never Does

- GSD **never** distributes Kickstart ROM images
- GSD **never** downloads Kickstart ROMs from unauthorized sources
- GSD **never** includes ROM images in version control or distribution archives
- GSD uses AROS by default and documents the two alternatives for users who need them

---

## Software Distribution Categories

Amiga software falls into six categories. Each has distinct legal implications for redistribution.

### Freeware

**Distributable: YES**

Software explicitly released as freeware by the author. The author retains copyright but grants permission for free redistribution.

- **Requirements:** Credit the author, preserve the original readme/documentation, do not modify the binary
- **How to verify:** Original readme or FILE_ID.DIZ states "freely distributable," "freeware," or equivalent
- **Examples:** OctaMED SoundStudio (later versions released as freeware), many Aminet utilities, numerous IFF artwork and MOD music files
- **Common sources:** Aminet (aminet.net) -- each upload has an explicit readme with distribution terms

### Public Domain

**Distributable: YES**

Software where the author has explicitly waived all copyright claims. No restrictions on use, modification, or redistribution.

- **Requirements:** None, though crediting the author is courteous
- **How to verify:** Readme or FILE_ID.DIZ states "public domain" or "PD"
- **Examples:** Many small utilities on Aminet, early tracker music compositions
- **Note:** "Public domain" has a specific legal meaning. Software is only PD if the author explicitly declares it so. Absence of a license does not make software public domain.

### Scene Productions (scene.org)

**Distributable: Usually YES**

Demos, intros, music disks, and other productions from the Amiga demoscene. The demoscene culture strongly encourages sharing of productions.

- **Requirements:** Credit the group/author, do not modify the production, include the original FILE_ID.DIZ or info file
- **How to verify:** Check the production's page on pouet.net for distribution status. Most scene.org-hosted productions are freely distributable.
- **Examples:** Demos by Sanity, Kefrens, Spaceballs, Melon Dezign, Andromeda, Phenomena
- **Edge cases:** Some productions include commercial music samples. If a demo's info file mentions licensed music, verify the music rights separately.
- **Common sources:** scene.org (the primary demoscene archive), Amiga Demoscene Archive (ADA)

### Shareware

**Distributable: EVALUATE CASE-BY-CASE**

Software distributed freely with the expectation that users who continue using it will pay a registration fee.

- **Requirements:** Must include original registration information and any shareware notice. Do not distribute registration codes or cracks.
- **How to verify:** Readme states "shareware" and includes registration details
- **What GSD does:** Only includes shareware where the original author has **explicitly released it as freeware** in a later version or announcement (shareware-turned-freeware). The `license` field in the curated collection uses `shareware_free` for these cases.
- **Note:** Distributing unregistered shareware is generally acceptable under the author's original terms. However, GSD prefers to avoid ambiguity and only includes items with clear freeware/PD status.

### Abandonware (NOT Distributable)

**Distributable: NO**

Software whose original publisher/developer no longer exists or no longer sells or supports the product. Despite common misconceptions, **abandonware is not a legal category**.

- **Legal reality:** Copyright does not expire because a company goes out of business. Copyright persists for the life of the author plus 70 years (in most jurisdictions), or 95 years from publication for corporate works.
- **Examples:** Deluxe Paint (rights held by Electronic Arts), Imagine 3D, Lightwave 3D (original Amiga version)
- **What GSD does:** Explicitly **excludes** all abandonware. Even though enforcement is unlikely, inclusion creates legal risk and contradicts the project's conservative approach.
- **Common misconception:** "Nobody sells it anymore, so it must be free." This is false. The rights holder can enforce copyright at any time.

### Commercial Software (NOT Distributable)

**Distributable: NO**

Software actively sold by a current rights holder.

- **Examples:** AmigaOS (Hyperion Entertainment), WHDLoad (individual license, free for personal use but binary cannot be redistributed without permission), any software currently available for purchase
- **What GSD does:** Provides setup scripts and instructions for users to legally acquire commercial software themselves. For example, `setup-whdload.sh` creates the HDF structure but the user must download WHDLoad from whdload.de.
- **Note:** Even "free for personal use" software (like WHDLoad) may not be freely redistributable. Always check the specific license terms.

---

## Curated Collection Licensing

The curated collection (`infra/amiga/curated-collection.yaml`) uses these license values:

| License Value | Meaning | Distribution |
|---------------|---------|--------------|
| `public_domain` | Author waived all rights | Unrestricted |
| `freeware` | Author permits free distribution | Credit required |
| `scene_production` | Demoscene work on scene.org | Credit group/author |
| `shareware_free` | Shareware later released free | Include original notice |

The following values are **never used** in the curated collection (items with these licenses are excluded):

| Excluded Value | Why |
|----------------|-----|
| `abandonware` | Not a legal category; copyright still exists |
| `commercial` | Active copyright holder selling the software |
| `shareware` | Ambiguous redistribution terms unless explicitly freed |
| `unknown` | Cannot verify distribution rights |

---

## Source Archives

The curated collection draws exclusively from these trusted archives. Each has established conventions for distribution permissions.

### Aminet

**URL:** [https://aminet.net/](https://aminet.net/)

The largest and oldest Amiga software archive, operating since 1992. Contains over 100,000 files organized by category.

- **Distribution terms:** Each upload has an associated readme (displayed on the file's page) that states distribution terms. Aminet requires uploaders to specify permissions.
- **How to verify:** Read the file's Aminet page. Look for explicit "freely distributable," "freeware," or "public domain" statements in the readme text.
- **Inclusion criteria for GSD:** Only include files whose Aminet readme explicitly states freeware or public domain status. If the readme is ambiguous or missing distribution terms, exclude the file.
- **Categories used:** `pix/` (artwork), `mus/` (music), `misc/` (miscellaneous), `util/` (utilities)

### Scene.org / ADA (Amiga Demoscene Archive)

**URL:** [https://scene.org/](https://scene.org/) and [https://ada.untergrund.net/](https://ada.untergrund.net/)

The primary archive for demoscene productions worldwide, including a vast Amiga section.

- **Distribution terms:** Scene.org hosts productions with the understanding that the demoscene culture encourages free distribution. Most productions are freely distributable.
- **How to verify:** Check the production's page on pouet.net (the demoscene database). Look for the "download" links pointing to scene.org. Productions with explicit "do not distribute" notices should be excluded.
- **Inclusion criteria for GSD:** Include productions hosted on scene.org whose pouet.net entry does not contain distribution restrictions. Cross-reference with the group's known distribution policies.

### The Mod Archive

**URL:** [https://modarchive.org/](https://modarchive.org/)

A large archive of tracker music files (MOD, S3M, XM, IT formats) with explicit licensing metadata.

- **Distribution terms:** Each module has a license tag in the archive's database. Tags include "Public Domain," "Free," "Attribution," and others.
- **How to verify:** Check the module's page on modarchive.org. The license field is displayed prominently.
- **Inclusion criteria for GSD:** Only include modules tagged as "Public Domain" or explicitly free-licensed. Modules with "Unknown" or no license tag are excluded.

### Amiga Music Preservation (AMP)

**URL:** [https://amp.dascene.net/](https://amp.dascene.net/)

A database of Amiga music with composer information, module metadata, and historical context.

- **Distribution terms:** AMP is primarily a metadata database. It links to downloads hosted on other archives (Mod Archive, Aminet, artist websites).
- **How to verify:** Use AMP for metadata (composer, year, module format) but obtain the actual file from Mod Archive or Aminet, then verify distribution terms at the download source.
- **Inclusion criteria for GSD:** Use AMP for research and cross-referencing. Actual downloads and license verification must come from the hosting archive.

---

## Per-Category Distribution Rules

Quick reference for operators evaluating content for inclusion:

### IFF/ILBM Artwork

| Source | Typical License | Action |
|--------|----------------|--------|
| Aminet `pix/` | Freeware or PD | Include if readme confirms |
| Demoscene production screenshots | Scene production | Include with demo credit |
| Art packs with explicit release | Freeware | Include with artist credit |
| Scanned magazine cover art | Commercial | **Exclude** |
| Game graphics rips | Commercial | **Exclude** |

### MOD/MED Tracker Music

| Source | Typical License | Action |
|--------|----------------|--------|
| Mod Archive (free-tagged) | PD or Free | Include with composer credit |
| Aminet `mus/` | Freeware or PD | Include if readme confirms |
| Demoscene production soundtracks | Scene production | Include with group/artist credit |
| Game soundtrack rips | Commercial | **Exclude** |
| Modules with sampled commercial music | Derivative | **Exclude** |

### Demos and Intros

| Source | Typical License | Action |
|--------|----------------|--------|
| scene.org archive | Scene production | Include with group credit |
| pouet.net linked downloads | Scene production | Include if freely hosted |
| Cracked game intros | Derivative/Illegal | **Exclude** |
| Commercial demo disks | Commercial | **Exclude** |

---

## Compliance Checklist

Before adding any asset to the curated collection, verify all of the following:

### Source Verification

- [ ] Source URL points to a legitimate archive (aminet.net, scene.org, modarchive.org, amp.dascene.net)
- [ ] The archive page for the file is publicly accessible
- [ ] The file can be downloaded without circumventing access controls

### License Verification

- [ ] Original readme, FILE_ID.DIZ, or archive metadata confirms distribution rights
- [ ] License is one of: public domain, freeware, scene production, or shareware-later-freed
- [ ] No commercial software is included
- [ ] No copyrighted ROM images are included or referenced as downloads
- [ ] No assets ripped from commercial games, applications, or publications

### Attribution

- [ ] Author or group is credited in the catalog entry
- [ ] Year of creation is documented (if known)
- [ ] Original archive URL is recorded as `source_url`
- [ ] Scene productions have pouet.net cross-reference when available

### Content Integrity

- [ ] File is in its original form (not modified, cracked, or repacked)
- [ ] Shareware items include original registration information
- [ ] Any readme or documentation files are preserved
- [ ] File format matches the catalog entry (IFF for artwork, MOD/MED for music)

### Exclusion Triggers

If **any** of these apply, the asset must be **excluded**:

- [ ] No explicit distribution terms found
- [ ] License status is "unknown" or ambiguous
- [ ] Asset is from a commercial product (game, application, publication)
- [ ] Asset contains sampled copyrighted material (commercial music, movie audio)
- [ ] Rights holder has issued takedown or cease-and-desist notices
- [ ] File requires a cracker or loader to run (indicates commercial origin)

---

## Dispute Resolution

If the legal status of an included asset is later questioned:

1. **Immediately remove** the asset from the curated collection
2. **Document** the concern in the collection's changelog
3. **Research** the actual rights status using original sources
4. **Only re-include** if clear, verifiable permission is established
5. **Update** the legal guide if the situation reveals a gap in the rules

The project errs on the side of removal. A smaller, legally clean collection is better than a larger collection with questionable items.

---

## References

- **AROS Public License:** [https://aros.sourceforge.io/license.html](https://aros.sourceforge.io/license.html)
- **Amiga Forever:** [https://www.amigaforever.com/](https://www.amigaforever.com/)
- **Aminet:** [https://aminet.net/](https://aminet.net/)
- **Scene.org:** [https://scene.org/](https://scene.org/)
- **The Mod Archive:** [https://modarchive.org/](https://modarchive.org/)
- **AMP (Amiga Music Preservation):** [https://amp.dascene.net/](https://amp.dascene.net/)
- **Pouet.net (Demoscene Database):** [https://www.pouet.net/](https://www.pouet.net/)
- **US Copyright Act, Section 117:** Backup copies of computer programs
- **EU Computer Programs Directive, Article 5:** Lawful use exceptions

---

*Document: infra/amiga/legal-guide.md*
*Project: GSD Knowledge World -- Amiga Creative Heritage*
*Last updated: 2026-02-18*
