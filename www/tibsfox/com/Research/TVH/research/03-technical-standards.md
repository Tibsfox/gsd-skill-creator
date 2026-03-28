# Technical Standards -- NTSC, ATSC, VHF/UHF & Spectrum Allocation

## Mechanical Scanning Systems

The earliest television used mechanical scanning: a Nipkow disc (1884 patent) with spirally arranged holes scanning an image into sequential lines. Paul Nipkow's disc, combined with photomultiplier tubes, produced low-resolution images (30-60 lines) sufficient for demonstration but unsuitable for broadcast.

## NTSC Standard (1941/1953)

The National Television System Committee established two standards:
- **1941 Monochrome:** 525 lines, 30 fps (60 fields interlaced), 6 MHz channel bandwidth
- **1953 Color:** Backward-compatible with monochrome receivers; color encoded via QAM subcarrier at 3.579545 MHz

The NTSC color standard used I/Q color-difference signals encoded onto the luminance carrier, allowing monochrome receivers to ignore the color information.

## VHF and UHF Spectrum

| Band | Channels | Frequency Range | Characteristics |
|---|---|---|---|
| VHF Low | 2-6 | 54-88 MHz | Long range, good building penetration |
| VHF High | 7-13 | 174-216 MHz | Moderate range, allocated early |
| UHF | 14-51 (post-auction) | 470-698 MHz | Shorter range, more channels available |

The 1963 All-Channel Receiver Act mandated UHF tuners in all new TV sets, critical for opening UHF spectrum to meaningful viewership.

## ATSC 1.0 (Digital Transition)

The Advanced Television Systems Committee standard replaced NTSC for US broadcasting:
- **Video:** MPEG-2 compression at up to 19.39 Mbps
- **Audio:** Dolby AC-3 (5.1 surround)
- **Resolutions:** 480i, 480p, 720p, 1080i (1080p added later)
- **Modulation:** 8-VSB for terrestrial broadcast

The FCC-mandated digital transition completed June 12, 2009, ending analog broadcasting.

## ATSC 3.0 (NextGen TV)

ATSC 3.0 represents a fundamental architectural shift: an IP-native broadcast standard.

**Key features:**
- **Modulation:** OFDM (Orthogonal Frequency Division Multipling) replacing 8-VSB
- **Video:** HEVC (H.265), supporting 4K UHD and HDR
- **Audio:** MPEG-H 3D Audio
- **IP backbone:** All content delivered as IP packets, enabling hybrid OTA+internet delivery
- **Interactive:** Return channel via broadband enables targeted advertising and interactive content
- **Scalability:** Single-frequency networks (SFN) for wide-area coverage

ATSC 3.0 adoption reached 76% of US households by 2026, with 62 markets broadcasting.

## 5G Broadcast

5G Broadcast (3GPP Release 16+) enables cellular towers to function as broadcast transmitters:
- **Band 108:** Dedicated broadcast spectrum allocation
- **LPTV petitions:** HC2 Broadcasting and XGen Network have petitioned the FCC for 5G Broadcast LPTV operation
- **Convergence:** Same content delivered via both ATSC 3.0 antenna and 5G cellular

## Cross-References

> **Related:** [Television History](01-television-history.md) for the historical arc, [FCC Licensing](04-fcc-licensing.md) for spectrum regulation, [Streamer Bridge](06-streamer-bridge.md) for ATSC 3.0 community applications.
