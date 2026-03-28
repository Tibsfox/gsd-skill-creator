# Citizen Science Protocols

## Overview

This module documents the scientific methods accessible to distributed amateur telescope networks, with data quality requirements and demonstrated results from existing citizen science programs.

## Occultation Timing

### Method

When an asteroid passes in front of a background star (an occultation), the star's brightness drops to zero for a period determined by the asteroid's size and speed. Multi-site timing of the brightness dip -- observed from different geographic positions -- produces a set of "chords" across the asteroid's shadow, determining its:

- **Size**: Chord lengths directly measure the asteroid's cross-section
- **Shape**: Multiple chords from different positions map the silhouette
- **Trajectory**: Precise timing from GPS-synchronized observers refines the orbital elements
- **Binarity**: Double dips reveal binary asteroid systems

### Precision Requirements

- **Timing accuracy**: <100 milliseconds -- GPS timestamp in FITS header mandatory
- **Sampling rate**: Video mode at 15-30 fps preferred for precise ingress/egress timing
- **Geographic spread**: Observers spaced 1-10 km apart maximize chord density across the shadow path
- **Equipment minimum**: 4" aperture with video-capable camera; larger aperture for fainter target stars

### Demonstrated Results

The Unistellar network has achieved occultation science for targets including:

- **Lucy mission asteroid Eurybates**: Pre-flyby shape determination from citizen occultation data
- **136 asteroids detected**: Multi-chord occultation measurements published through IOTA (International Occultation Timing Association)
- **Trojan asteroids**: Shape models of Jupiter Trojans from coordinated multi-continent observations

## Exoplanet Transit Photometry

### Method

When an exoplanet passes in front of its host star, the star's brightness decreases by a small, measurable amount. The depth, duration, and shape of the transit light curve reveal:

- **Planet radius**: Transit depth = (planet radius / star radius)^2
- **Orbital period**: Repeated transits at regular intervals confirm the period
- **Orbital inclination**: Transit duration constrains the orbital geometry
- **Atmosphere**: Wavelength-dependent transit depth variations indicate atmospheric composition (advanced)

### Precision Requirements

- **Photometric precision**: <0.01 magnitude (1%) for Jupiter-sized planets; <0.001 magnitude for Neptune-sized
- **Time coverage**: Complete transit (ingress + flat bottom + egress) required for useful data
- **Calibration**: Comparison stars in the same field for differential photometry
- **Cadence**: 1-2 minute sampling for typical hot Jupiter transits (2-4 hour duration)

### Demonstrated Results

- **26-hour continuous coverage**: 26 Unistellar observers across multiple time zones achieved uninterrupted monitoring of a long-duration exoplanet transit -- impossible from any single ground-based site
- **20 exoplanet orbits refined**: Citizen transit observations contributed to ephemeris updates published in peer-reviewed journals
- **Transit timing variations (TTVs)**: Multiple citizen observations of the same system over months can detect gravitational perturbations from unseen companion planets

## Variable Star Monitoring

### Method

Long-term brightness tracking of intrinsically variable stars, novae, and cataclysmic variable systems. AAVSO has maintained continuous records for over a century, with some stars having light curves spanning 100+ years.

### Science Cases

- **Recurrent novae**: T Coronae Borealis (T CrB) has been monitored for decades; its next eruption is anticipated and will be a Tier 1 GTM event
- **Eclipsing binaries**: Period changes reveal mass transfer, orbital evolution, and circumbinary objects
- **Pulsating variables**: Cepheids and RR Lyrae stars serve as cosmic distance indicators
- **Dwarf novae**: Outburst monitoring alerts professional telescopes for spectroscopic follow-up

### Precision Requirements

- **Photometric**: Visual estimates to 0.1 magnitude; CCD/CMOS photometry to 0.01 magnitude
- **Cadence**: Daily for slow variables; hourly during outburst monitoring
- **Standardization**: Standard photometric systems (Johnson-Cousins BVRI, Sloan ugriz)
- **Reporting**: AAVSO standard format; WebObs submission; AAVSO Photometric All-Sky Survey (APASS) calibration

## Comet Activity Tracking

### Method

Brightness monitoring, coma morphology measurement, and fragment tracking during cometary approach and breakup events. Citizen observers provide geographic diversity that enables continuous monitoring during perihelion passage.

### Demonstrated Results

- **Comet K1 (2024)**: Unistellar observers captured all three fragments during disintegration in November 2024 -- multi-site observations from different angles revealed 3D fragment separation geometry
- **Brightness monitoring**: Consistent multi-site photometry during approach and recession allows professional teams to characterize dust and gas production rates

### Equipment Requirements

- **Aperture**: 4" minimum for coma detection; 8"+ for fragment resolution
- **Field of view**: Wide field preferred for comets near perihelion (large apparent motion)
- **Image stacking**: Comet-rate tracking or software stacking on the comet nucleus

## Satellite Brightness Surveys

### Method

Measuring the apparent brightness of artificial satellites to assess their impact on astronomical observations. Critical for policy advocacy regarding mega-constellation operators (Starlink, OneWeb, Amazon Kuiper).

### Science Value

- **Impact quantification**: Measured satellite trail brightness in magnitudes enables quantitative assessment of survey contamination
- **Mitigation validation**: Comparing brightness of visor-equipped vs. standard satellites verifies operator mitigation measures
- **Regulatory input**: Citizen-collected brightness data has been cited in IAU and FCC filings regarding constellation licensing

## Data Quality Gates

### GTM Ingestion Requirements

All data submitted to GTM passes through quality gates before inclusion in science-grade datasets:

| Gate | Requirement | Verification Method |
|------|-------------|-------------------|
| Timestamp | GPS-synchronized UTC in FITS header | Header keyword validation |
| Coordinates | RA/DEC in FITS header (J2000/ICRS) | Plate-solve verification |
| Calibration | At minimum: dark frame subtracted | IMAGETYP keyword check |
| Signal-to-noise | Target detected at SNR > 5 | Aperture photometry on target |
| Observer ID | Registered GTM identifier | Authentication token |
| Equipment ID | Registered telescope/camera pair | Equipment registry lookup |
| Flat field | Applied (recommended for Tier 1/2) | FLATCOR keyword check |
| Bias frame | Applied (recommended for Tier 1/2) | BIASCOR keyword check |

### Quality Tiers

- **Gold**: Full calibration (dark, flat, bias), GPS timestamp, plate-solved, SNR > 20. Suitable for publication-quality science.
- **Silver**: Dark-subtracted, GPS timestamp, plate-solved, SNR > 10. Suitable for campaign-level analysis.
- **Bronze**: Minimal calibration, approximate timestamp, target identified. Suitable for detection confirmation and monitoring.
- **Report**: Visual observation or uncalibrated image. Suitable for event confirmation and participation records.

> **SAFETY: Data quality gates must never be used to exclude observers from participation. All tiers contribute to the GTM mission. Gates determine data routing (which science analyses include which data), not observer access. Radical Inclusion applies: everyone who looks up is part of the network.**

## Summary

Citizen science protocols span from simple naked-eye reporting to precision photometry rivaling professional instruments. The key methods -- occultation timing, exoplanet transits, variable star monitoring, comet tracking, and satellite surveys -- all benefit from the geographic distribution and sheer numbers that the GTM citizen network provides. Data quality gates ensure appropriate routing without excluding any observer from participation.
