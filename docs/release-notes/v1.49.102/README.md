# v1.49.102 "The Wire Format Is Architecture"

**Released:** 2026-03-28
**Code:** SRD
**Series:** PNW Research Series (#102 of 167)

## Summary

Wire-level protocol mapping for every major remote access protocol in production use. This release adds the SRD research project -- a deep study of SSH (RFCs 4250-4256 plus updates through RFC 9142), RDP (MS-RDPBCGR), VNC/RFB (RFC 6143), and SPICE, covering every packet field, message type byte, and cryptographic handshake at specification fidelity. The through-line connects protocol design to the Amiga Principle: small, principled building blocks (a 32-byte ECDH public key, a 4-byte padding field, a one-byte message type) producing systems capable of securing billions of connections daily.

## Key Features

| Metric | Value |
|--------|-------|
| Research Modules | 6 |
| Total Lines | ~4,764 |
| Safety-Critical Tests | 6 |
| Parallel Tracks | 3 |
| Est. Tokens | ~76K |
| Color Theme | Terminal green / key gold / steel dark |

### Research Modules

1. **M1: SSH Core Transport** -- SSH binary packet format (RFC 4253), cipher negotiation, algorithm name-lists, key exchange (DH/ECDH/Curve25519), protocol version exchange, message type catalog
2. **M2: SSH Application Layer** -- RFC 4252 authentication methods (publickey, password, keyboard-interactive), RFC 4254 connection protocol, channel lifecycle, port forwarding, SFTP subsystem
3. **M3: RDP Protocol** -- MS-RDPBCGR wire format, complete 10-phase connection sequence, static virtual channels (max 31), dynamic channel architecture, NLA/CredSSP/TLS security modes
4. **M4: VNC/RFB & SPICE** -- VNC/RFB RFC 6143 framebuffer model, encoding registry (Raw, CopyRect, Hextile, Tight, ZRLE), SPICE multi-channel QXL device model, X11 forwarding and NX/XPRA
5. **M5: Security & Hardening** -- Cross-protocol security comparison, CVE landscape (BlueKeep, DejaBlue, SSH historical), hardening per RFC 9142 and NIST SP 800-series, cipher suite recommendations
6. **M6: Implementation Guide** -- Protocol selection decision matrix, performance characteristics, network overhead comparison, SSH tunneling for mesh communications, deployment architecture patterns

### Cross-References

- **TCP** -- Transport layer foundation for all remote access protocols
- **PNP** -- Unix IPC to socket API, pipes underlying SSH multiplexing
- **FEC** -- Key exchange cryptographic primitives, cipher suite selection
- **RFC** -- IETF RFC archive, source authority for SSH and VNC specifications
- **SYS** -- Systems administration, SSH authentication and SPICE deployment

## Retrospective

### What Worked
- Three parallel tracks (SSH family, RDP, VNC/SPICE) allow independent deep dives that converge naturally at the security synthesis layer
- Wire-level fidelity -- every message type byte, every field width -- produces reference material that survives API version changes
- The security comparison across four protocol families reveals architectural trade-offs invisible when studying any single protocol in isolation

### What Could Be Better
- Emerging protocols (Wayland remote, PipeWire network streaming) are not yet covered and represent the next generation of display protocols
- The SPICE QXL device model deserves deeper treatment of GPU passthrough and virtio-gpu evolution

## Lessons Learned

- SSH's three-layer architecture (Transport, Authentication, Connection) is a masterwork of compositional design that maps directly to the Amiga Principle: each layer does exactly one thing and hands off cleanly
- RDP's 10-phase connection sequence reveals what happens when backward compatibility over 25 years of Windows evolution meets protocol design -- feature depth traded for elegance
- VNC's radical simplicity ("put a rectangle of pixel data at x,y") achieves universal portability through constraint, proving that the most portable protocol is often the one that promises the least

---
*Part of the v1.49.101-131 research batch -- 31 new projects in a single session.*
