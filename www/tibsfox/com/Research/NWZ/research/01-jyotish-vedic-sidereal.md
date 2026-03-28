# Jyotish and the Vedic Sidereal Zodiac

> **Domain:** Comparative Astronomical Cosmology
> **Module:** 1 -- The Science of Light: India's Stellar Framework
> **Through-line:** *The Western zodiac drifts with the seasons. The Vedic zodiac holds to the stars. The same twelve sign names, pinned to different anchors, produce charts that disagree by an entire sign -- and both insist they are correct. The difference is not opinion. It is a 26,000-year wobble in the Earth's axis, measured to the arcminute.*

---

## Table of Contents

1. [Foundational Architecture](#1-foundational-architecture)
2. [The Ayanamsa: Where Two Zodiacs Diverge](#2-the-ayanamsa-where-two-zodiacs-diverge)
3. [The Twelve Rashis](#3-the-twelve-rashis)
4. [The Nakshatra System: 27 Lunar Mansions](#4-the-nakshatra-system-27-lunar-mansions)
5. [Complete Nakshatra Catalogue](#5-complete-nakshatra-catalogue)
6. [The Pada Subdivision and the 108-Unit Cosmology](#6-the-pada-subdivision-and-the-108-unit-cosmology)
7. [The Dasha System: Timing by Lunar Mansion](#7-the-dasha-system-timing-by-lunar-mansion)
8. [Moon-Centered Cosmology](#8-moon-centered-cosmology)
9. [Jyotish as Living Practice](#9-jyotish-as-living-practice)
10. [Mathematical Precision and Computational Tools](#10-mathematical-precision-and-computational-tools)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Foundational Architecture

Jyotish (Sanskrit: *jyotis* = light; the "science of light") is the Hindu astronomical and astrological system rooted in the Vedas, with its earliest textual formulation in the *Vedanga Jyotisha*, dated to the final centuries BCE [1]. It is one of the six Vedangas (limbs of the Vedas) and has been practiced continuously for over two millennia across South Asia and its diaspora.

Jyotish operates on two interlocking frameworks that together produce a system of remarkable mathematical depth:

- **The twelve rashis (signs):** Equivalent in name to the Western zodiac signs (Mesha/Aries through Meena/Pisces) but defined sidereal -- anchored to fixed stars rather than to the vernal equinox point
- **The twenty-seven nakshatras (lunar mansions):** A finer-grained division of the ecliptic into 27 equal arcs of 13 degrees 20 minutes each, predating Hellenistic influence on India by centuries [2]

The critical distinction from Western tropical astrology is the reference frame. Western tropical astrology defines 0 degrees Aries as the vernal equinox point -- the position of the Sun at the March equinox. This point drifts backward through the fixed star background at approximately 50.3 arcseconds per year due to the precession of the equinoxes, completing a full circuit in approximately 25,772 years [3]. Jyotish anchors instead to the fixed star Spica (Chitra in Sanskrit), placing it at 0 degrees Libra. The sky stays fixed; the equinox drifts away.

```
JYOTISH REFERENCE FRAME
================================================================

  WESTERN TROPICAL                    JYOTISH SIDEREAL
  ─────────────────                   ─────────────────
  Anchor: Vernal equinox              Anchor: Spica (Chitra) at 0° Libra
  0° Aries = March equinox point      0° Aries = opposite Spica
  Stars drift relative to signs       Signs drift relative to equinox
  Sun-sign astrology dominant          Moon-sign (Chandra Rashi) primary
  12 divisions only                    12 rashis + 27 nakshatras + 108 padas

  Current offset: ~24°12' (mid-2020s)
  Last coincidence: ~285 CE
  Full cycle: ~25,772 years
```

This means that as of the mid-2020s, every planetary position in a Jyotish chart appears approximately 24 degrees earlier than its Western tropical equivalent. A person born with the Sun at 5 degrees Aries in Western astrology has the Sun at approximately 11 degrees Pisces in Jyotish -- a completely different sign [4].

> **Related:** [EAZ](page.html?doc=05-comparative-boundary-analysis) Western tropical reference, [ATC](../ATC/index.html) Aries-Taurus cusp analysis, [SGM](../SGM/index.html) angular measurement frameworks

---

## 2. The Ayanamsa: Where Two Zodiacs Diverge

The *ayanamsa* (Sanskrit: *ayana* = movement; *amsha* = portion) is the angular difference between the tropical and sidereal zodiacs at any given moment. It is the single number that converts between the two systems, and its precise value is the subject of ongoing scholarly and practical debate within the Jyotish community [5].

### The Precession Formula

The Earth's rotational axis traces a cone in space with a half-angle of approximately 23.4 degrees, completing one full precession cycle in approximately 25,772 years. This causes the vernal equinox point to drift backward through the ecliptic at approximately 50.3 arcseconds per year [3].

```
PRECESSION MECHANICS
================================================================

  Earth's axis precesses like a gyroscope:
    Half-angle of cone: ~23.4°
    Period: ~25,772 years
    Rate: ~50.3 arcseconds/year = ~1° per 71.6 years

  Conversion formula:
    Sidereal position = Tropical position - Ayanamsa

  Lahiri ayanamsa values (approximate):
    285 CE:    0° 00'  (coincidence date)
    1000 CE:  10° 33'
    1500 CE:  17° 33'
    1900 CE:  22° 28'
    1950 CE:  23° 09'  (Lahiri reference epoch)
    2000 CE:  23° 51'
    2025 CE:  24° 12'
    2050 CE:  24° 33'
```

### Competing Ayanamsa Standards

Multiple ayanamsa values are in use, each anchored to a different star or historical coincidence date. The differences between them are small (typically under 2 degrees) but astrologically significant because they can shift planetary positions across sign boundaries [6].

| Ayanamsa | Anchor Star | Coincidence Date | Mid-2020s Value | Notes |
|---|---|---|---|---|
| Lahiri (Chitrapaksha) | Spica (Chitra) at 0° Libra | ~285 CE | ~24°12' | Official Indian government standard (1956); most widely used in Jyotish [7] |
| KP (Krishnamurti) | Very close to Lahiri | ~291 CE | ~24°08' | Used in Krishnamurti Paddhati predictive system |
| Raman (B.V. Raman) | Slightly different from Lahiri | ~397 CE | ~22°30' | Used by B.V. Raman school; smaller ayanamsa |
| Fagan-Bradley | Aldebaran/Antares at 15° Taurus/Scorpio | ~221 CE | ~24°44' | Western sidereal tradition only; not used in Jyotish [8] |
| Suryasiddhanta | Revati (Zeta Piscium) at 29°50' Pisces | Variable | ~23°54' | Ancient text-based; less common in practice |

The Lahiri ayanamsa was officially adopted by the Government of India in 1956 for calculation of the Indian national calendar and panchang (almanac) dates [7]. Its adoption resolved a practical problem: without an agreed-upon ayanamsa, Hindu festival dates calculated by different practitioners would fall on different calendar days.

> **SAFETY NOTE:** The ayanamsa is not a matter of belief or preference in the mathematical sense -- it is a measurable astronomical quantity. The choice between ayanamsa standards reflects different decisions about which anchor star best defines the sidereal reference frame. All yield internally consistent charts; they simply place the origin of the coordinate system at slightly different points in the sky.

---

## 3. The Twelve Rashis

The twelve rashis carry the same names and symbolic associations as the Western zodiac signs, reflecting a shared origin in Hellenistic astronomy that reached India via Greco-Bactrian contact in the centuries around the Common Era [9]. However, because they are sidereal rather than tropical, they occupy different positions in the actual sky:

| Rashi | Western Name | Sidereal Range | Ruling Planet | Element |
|---|---|---|---|---|
| Mesha | Aries | 0°-30° sidereal | Mars (Mangala) | Fire |
| Vrishabha | Taurus | 30°-60° | Venus (Shukra) | Earth |
| Mithuna | Gemini | 60°-90° | Mercury (Budha) | Air |
| Karka | Cancer | 90°-120° | Moon (Chandra) | Water |
| Simha | Leo | 120°-150° | Sun (Surya) | Fire |
| Kanya | Virgo | 150°-180° | Mercury (Budha) | Earth |
| Tula | Libra | 180°-210° | Venus (Shukra) | Air |
| Vrischika | Scorpio | 210°-240° | Mars (Mangala) | Water |
| Dhanu | Sagittarius | 240°-270° | Jupiter (Guru) | Fire |
| Makara | Capricorn | 270°-300° | Saturn (Shani) | Earth |
| Kumbha | Aquarius | 300°-330° | Saturn (Shani) | Air |
| Meena | Pisces | 330°-360° | Jupiter (Guru) | Water |

The rashi system is structurally identical to the Western twelve-sign framework: twelve equal 30-degree arcs covering the full 360-degree ecliptic. The difference is entirely in the anchor point. Western tropical: the equinox slides along the star background. Jyotish sidereal: the stars stay fixed and the equinox recedes [10].

---

## 4. The Nakshatra System: 27 Lunar Mansions

The nakshatra system predates Hellenistic influence on India by centuries and represents a fundamentally different approach to dividing the sky. Where the rashi system tracks the Sun's annual journey through twelve arcs, the nakshatra system tracks the Moon's monthly journey through twenty-seven arcs [2].

The mathematical foundation is elegant:

```
NAKSHATRA GEOMETRY
================================================================

  Full ecliptic:     360°
  Number of arcs:     27
  Arc width:          360° / 27 = 13°20' per nakshatra
  Padas per arc:       4
  Pada width:         13°20' / 4 = 3°20' per pada
  Total padas:        27 x 4 = 108

  Lunar sidereal month: ~27.32 days
  Moon's daily motion:  ~13°10' per day
  Moon spends:          ~1 day per nakshatra (approximate)
```

The correspondence between the 27 nakshatras and the approximate 27.32-day sidereal lunar month is not coincidence -- the system was designed to track the Moon's position night by night. The Moon spends approximately one day in each nakshatra, providing a natural daily almanac [11].

The starting point of the nakshatra cycle is the point diametrically opposite Spica (Chitra) -- placing the first nakshatra, Ashwini, at the beginning of sidereal Aries. This connection between the nakshatra system and the Lahiri ayanamsa anchor is architecturally significant: nakshatra 14 (Chitra) contains Spica, and the entire coordinate system radiates outward from that stellar anchor [12].

---

## 5. Complete Nakshatra Catalogue

| # | Nakshatra | Anchor Star(s) | Range (Sidereal) | Symbol | Shakti (Power) | Deity |
|---|---|---|---|---|---|---|
| 1 | Ashwini | Beta Arietis (Sheratan) | 0°00'-13°20' Aries | Horse head | Power to heal quickly | Ashwini Kumaras |
| 2 | Bharani | 35 Arietis (Bharani) | 13°20'-26°40' Aries | Yoni (womb) | Power of purification | Yama |
| 3 | Krittika | Pleiades (Alcyone) | 26°40' Aries-10°00' Taurus | Razor/flame | Power to burn/purify | Agni |
| 4 | Rohini | Aldebaran (Alpha Tauri) | 10°00'-23°20' Taurus | Ox cart | Power of growth | Brahma |
| 5 | Mrigashira | Lambda Orionis (Meissa) | 23°20' Taurus-6°40' Gemini | Deer head | Power of seeking | Soma |
| 6 | Ardra | Betelgeuse (Alpha Orionis) | 6°40'-20°00' Gemini | Teardrop | Power of effort | Rudra |
| 7 | Punarvasu | Pollux (Beta Geminorum) | 20°00' Gemini-3°20' Cancer | Quiver of arrows | Power of renewal | Aditi |
| 8 | Pushya | Delta Cancri | 3°20'-16°40' Cancer | Cow udder | Power of nourishment | Brihaspati |
| 9 | Ashlesha | Epsilon Hydrae | 16°40'-30°00' Cancer | Coiled serpent | Power of poison/medicine | Nagas |
| 10 | Magha | Regulus (Alpha Leonis) | 0°00'-13°20' Leo | Throne room | Power of authority | Pitris (ancestors) |
| 11 | Purva Phalguni | Delta Leonis (Zosma) | 13°20'-26°40' Leo | Front legs of bed | Power of creative procreation | Bhaga |
| 12 | Uttara Phalguni | Beta Leonis (Denebola) | 26°40' Leo-10°00' Virgo | Back legs of bed | Power of accumulation | Aryaman |
| 13 | Hasta | Delta Corvi | 10°00'-23°20' Virgo | Open hand | Power of manifestation | Savitar |
| 14 | Chitra | Spica (Alpha Virginis) | 23°20' Virgo-6°40' Libra | Bright jewel | Power of accumulation of merit | Tvashtar |
| 15 | Swati | Arcturus (Alpha Bootis) | 6°40'-20°00' Libra | Young plant | Power of dispersal | Vayu |
| 16 | Vishakha | Alpha Librae (Zubenelgenubi) | 20°00' Libra-3°20' Scorpio | Triumphal arch | Power of purpose | Indragni |
| 17 | Anuradha | Delta Scorpii (Dschubba) | 3°20'-16°40' Scorpio | Lotus | Power of devotion | Mitra |
| 18 | Jyeshtha | Antares (Alpha Scorpii) | 16°40'-30°00' Scorpio | Earring/talisman | Power of conquest | Indra |
| 19 | Mula | Lambda Scorpii (Shaula) | 0°00'-13°20' Sagittarius | Bundle of roots | Power to destroy | Nirriti |
| 20 | Purva Ashadha | Delta Sagittarii (Kaus Media) | 13°20'-26°40' Sagittarius | Elephant tusk | Power of invigoration | Apas (water) |
| 21 | Uttara Ashadha | Sigma Sagittarii (Nunki) | 26°40' Sagittarius-10°00' Capricorn | Small bed | Power of unchallengeable victory | Vishvadevas |
| 22 | Shravana | Altair (Alpha Aquilae) | 10°00'-23°20' Capricorn | Ear/three footprints | Power of connection | Vishnu |
| 23 | Dhanishtha | Beta Delphini (Rotanev) | 23°20' Capricorn-6°40' Aquarius | Drum | Power of wealth/music | Vasus |
| 24 | Shatabhisha | Lambda Aquarii | 6°40'-20°00' Aquarius | Circle of 100 stars | Power of healing | Varuna |
| 25 | Purva Bhadrapada | Alpha Pegasi (Markab) | 20°00' Aquarius-3°20' Pisces | Front of funeral cot | Power of elevation | Aja Ekapada |
| 26 | Uttara Bhadrapada | Gamma Pegasi (Algenib) | 3°20'-16°40' Pisces | Back of funeral cot | Power of anchoring | Ahir Budhnya |
| 27 | Revati | Zeta Piscium | 16°40'-30°00' Pisces | Fish/drum | Power of nourishment for journey | Pushan |

Each nakshatra carries a rich symbolic vocabulary: a presiding deity, a shakti (power or function), a symbol, an animal pairing, and a guna (quality: sattva, rajas, or tamas). The system is not merely a coordinate grid -- it is a complete symbolic language for describing the Moon's character at any point in its monthly circuit [13].

> **Related:** [TIBS](../TIBS/index.html) Animal symbolism in astronomical traditions, [SGM](../SGM/index.html) 27-fold symmetry and sacred geometry

---

## 6. The Pada Subdivision and the 108-Unit Cosmology

Each of the 27 nakshatras is subdivided into four *padas* ("steps" or "quarters") of 3 degrees 20 minutes each. The total count of 108 padas (27 x 4) connects the astronomical system to a number of deep significance in Hindu cosmology [14]:

- **108 beads** on a japa mala (prayer rosary), representing all aspects of Vishnu
- **108 Upanishads** in the Muktika canon
- The Sun's diameter is approximately **108 times** Earth's diameter
- The average distance from Earth to the Sun is approximately **108 solar diameters**
- The average distance from Earth to the Moon is approximately **108 lunar diameters**

Whether these astronomical coincidences were known to the original nakshatra designers is debated, but the 108-fold structure creates a mathematical resonance between lunar orbital geometry and Hindu sacred number theory that practitioners consider foundational [15].

```
PADA-NAVAMSA MAPPING
================================================================

  Each pada of 3°20' maps to one of the 12 rashis in sequence:
    Pada 1 of Ashwini  → Aries (navamsa)
    Pada 2 of Ashwini  → Taurus
    Pada 3 of Ashwini  → Gemini
    Pada 4 of Ashwini  → Cancer
    Pada 1 of Bharani  → Leo
    ...continuing through all 108 padas...

  This creates the navamsa chart (D-9):
    108 padas / 9 per sign = 12 navamsa signs
    The navamsa is considered the "soul chart" in Jyotish
    and is the most important divisional chart
```

The pada system feeds directly into the *navamsa* (ninth-division) chart, considered by many Jyotish practitioners to be second in importance only to the birth chart itself. Each pada of 3 degrees 20 minutes corresponds to one navamsa division, creating a 1:1 mapping between the lunar mansion system and the divisional chart system [16].

---

## 7. The Dasha System: Timing by Lunar Mansion

The Vimshottari Dasha is Jyotish's most distinctive predictive tool and has no equivalent in Western astrology. It assigns a sequence of planetary periods (dashas) to a person's life, with the starting point determined by the Moon's nakshatra at the moment of birth [17].

| Nakshatra Group | Ruling Planet | Dasha Period (Years) |
|---|---|---|
| Ashwini, Magha, Mula | Ketu (South Node) | 7 |
| Bharani, Purva Phalguni, Purva Ashadha | Venus (Shukra) | 20 |
| Krittika, Uttara Phalguni, Uttara Ashadha | Sun (Surya) | 6 |
| Rohini, Hasta, Shravana | Moon (Chandra) | 10 |
| Mrigashira, Chitra, Dhanishtha | Mars (Mangala) | 7 |
| Ardra, Swati, Shatabhisha | Rahu (North Node) | 18 |
| Punarvasu, Vishakha, Purva Bhadrapada | Jupiter (Guru) | 16 |
| Pushya, Anuradha, Uttara Bhadrapada | Saturn (Shani) | 19 |
| Ashlesha, Jyeshtha, Revati | Mercury (Budha) | 17 |

The total of all nine dasha periods is 120 years -- the theoretical maximum human lifespan in the Vedic framework. A person born in the first quarter of Ashwini nakshatra begins life in a Ketu dasha with 7 years remaining; their dasha sequence proceeds through Venus (20), Sun (6), Moon (10), Mars (7), Rahu (18), Jupiter (16), Saturn (19), and Mercury (17) [17].

The critical feature is that the dasha system creates a time-map anchored to the Moon's sidereal position at birth. It is not cyclical in the Western progressed-chart sense -- it is a linear sequence that unfolds across the lifespan, with each planetary period carrying the characteristics of its ruling planet. Dashas are further subdivided into bhuktis (sub-periods) and antardashas (sub-sub-periods), creating a three-level timing hierarchy [18].

---

## 8. Moon-Centered Cosmology

In Jyotish, the Moon sign (Chandra Rashi) is primary -- not the Sun sign. When a Jyotish practitioner asks "What is your rashi?", they mean your Moon sign. This reflects a fundamentally different cosmological emphasis from Western astrology's solar identity framework [19].

The reasons are both astronomical and cultural:

- The Moon moves approximately 13 degrees 10 minutes per day, spending roughly one day per nakshatra -- providing a daily almanac
- The Sun moves approximately 1 degree per day, changing sign only monthly -- too coarse for daily guidance
- Hindu festival dates, auspicious timings (muhurta), and religious ceremonies are calculated from the Moon's nakshatra position, not the Sun's sign [20]
- The dasha system derives entirely from the Moon's nakshatra at birth

This Moon-centered architecture means that two people born on the same day but hours apart may have different nakshatras and therefore different dasha sequences -- a level of temporal sensitivity that the solar-sign system cannot achieve.

---

## 9. Jyotish as Living Practice

Jyotish is not a historical tradition studied from texts -- it is a living, hereditary practice transmitted through guru-disciple (*guru-shishya parampara*) lineages across South Asian communities worldwide. The Lahiri ayanamsa is officially recognized by the Government of India (1956) and used in Hindu Panchang calculations that determine festival dates, auspicious timings, and religious ceremonies for hundreds of millions of people [7].

Contemporary practice includes:

- **Natal chart consultation** (Janma Kundali) at birth, marriage, and major life events
- **Muhurta** (electional astrology) for choosing auspicious times for ceremonies, business ventures, and travel
- **Prashna** (horary astrology) for answering specific questions
- **Panchang** production -- published annual almanacs with daily nakshatra, tithi (lunar day), and muhurta data

The practice is supported by institutional infrastructure including university-level Jyotish programs at multiple Indian universities (Banaras Hindu University, University of Calcutta), professional associations, and government recognition [21].

> **Related:** [BMR](../BMR/index.html) Living cultural traditions and transmission, [ECO](../ECO/index.html) hereditary knowledge systems

---

## 10. Mathematical Precision and Computational Tools

Modern Jyotish computation uses the Swiss Ephemeris (maintained by Astro.com) as the astronomical engine, providing planetary positions to sub-arcsecond accuracy. The Lahiri ayanamsa is computed from the IAU precession model and updated annually. Software packages including Jagannatha Hora, Parashara's Light, and the open-source Swiss Ephemeris library implement all major ayanamsa standards [22].

The mathematical precision of the system is notable: the nakshatra boundaries are defined to the arcminute (13 degrees 20 minutes 00 seconds per nakshatra), and the pada boundaries to 3 degrees 20 minutes 00 seconds. Modern ephemeris computation can determine a planet's nakshatra and pada at any historical or future date to within fractions of an arcsecond [23].

---

## 11. Cross-References

| Topic | Appears In | Related Projects |
|---|---|---|
| Sidereal vs tropical zodiac | M1, M4, M5 | ATC, EAZ, FDR |
| Precession of the equinoxes | M1, M4 | SGM, LKR |
| Lunar mansions (comparative) | M1, M2, M4 | TIBS, BMR |
| 108-fold cosmological number | M1, M4 | SGM, ECO |
| Angular measurement systems | M1, M2, M4 | SGM, ATC |
| Living cultural practices | M1, M5 | BMR, TIBS, LKR |
| Moon-centered astronomy | M1, M2 | ATC, FDR |
| Indicator star astronomy | M1, M2, M4 | ATC, SGM |

---

## 12. Sources

1. *Vedanga Jyotisha*. Final centuries BCE. Earliest Vedic astronomical text with nakshatra listings.
2. Pingree, David. "Precession and Trepidation in Indian Astronomy." *Journal for the History of Astronomy*, vol. iii (1972). Establishes pre-Hellenistic origins of nakshatra system.
3. International Astronomical Union. Precession parameters: P03 precession model. ~50.3 arcseconds/year, ~25,772-year cycle.
4. Frawley, David. *Astrology of the Seers*. Delhi: Motilal Banarsidass, 1990. Comparative sidereal-tropical framework.
5. Astro.com. "Ayanamshas in Sidereal Astrology." Technical reference. https://www.astro.com/astrology/in_ayanamsha_e.htm
6. Dieter Koch. "The Hindu Lunisolar Calendar and its Astronomical Foundations." Swiss Ephemeris documentation, 2014.
7. Government of India. Calendar Reform Committee, chaired by Meghnad Saha. Adopted Lahiri (Chitrapaksha) ayanamsa for national calendar, 1956.
8. Fagan, Cyril and Roy C. Firebrace. *Primer of Sidereal Astrology*. London: Isabella Fagan, 1971. Western sidereal framework.
9. Pingree, David. "The Recovery of Early Greek Astronomy from India." *Journal for the History of Astronomy*, vol. 7 (1976).
10. Wikipedia. "Sidereal and tropical astrology." Structural comparison. Retrieved March 2026.
11. Wikipedia. "Nakshatra." Mathematical structure and anchor star identifications. Retrieved March 2026.
12. Lahiri, N.C. *Tables of the Sun for Astrological Purposes*. Calcutta: Astro Research Bureau, 1942. Defines Chitrapaksha ayanamsa.
13. Harness, Dennis. *The Nakshatras: The Lunar Mansions of Vedic Astrology*. Twin Lakes: Lotus Press, 1999.
14. Frawley, David. *Shaktis of the Nakshatras*. American Institute of Vedic Studies publications.
15. Subbarayappa, B.V. "Indian Astronomy: An Historical Perspective." In Corbin, B.G. et al. (eds.), *Library and Information Services in Astronomy IV*, US Naval Observatory, 2003.
16. Rao, K.N. *Planets and Children*. New Delhi: Vani Publications, 1993. Navamsa-pada mapping.
17. Parashara. *Brihat Parashara Hora Shastra*. Classical Jyotish text. Vimshottari Dasha chapter.
18. Rao, K.N. *Dashas and How to Use Them*. New Delhi: Vani Publications, 1995.
19. Hart, Defouw and Robert Svoboda. *Light on Life: An Introduction to the Astrology of India*. London: Penguin, 1996.
20. Panchang.org. Hindu calendar and festival calculation methodology. Traditional Panchang publication standards.
21. Banaras Hindu University. Department of Jyotish and Vastu. Institutional Jyotish program curriculum.
22. Swiss Ephemeris. Astro.com. Open-source astronomical computation library with Lahiri ayanamsa implementation.
23. Dieter Koch and Alois Treindl. "Swiss Ephemeris: Why It Is the Best Ephemeris." Technical documentation, 2020.
