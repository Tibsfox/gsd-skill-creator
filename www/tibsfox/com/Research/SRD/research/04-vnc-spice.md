# VNC/RFB & SPICE

> **Domain:** Remote Access Protocols
> **Module:** 4 -- Framebuffer, Encodings & Virtualization Display
> **Through-line:** *VNC's RFB protocol chose radical simplicity: the entire display model is "put a rectangle of pixel data at x,y." That constraint achieves universal portability. SPICE solved the opposite problem: how to pass GPU rendering commands through a hypervisor boundary. Each answers the same question differently: what is the minimum faithful representation of a remote interface that survives the network?*

---

## Table of Contents

1. [VNC/RFB Protocol Overview](#1-vncrfb-protocol-overview)
2. [RFB Handshake](#2-rfb-handshake)
3. [Security Types](#3-security-types)
4. [Pixel Format and Framebuffer](#4-pixel-format-and-framebuffer)
5. [Encoding Registry](#5-encoding-registry)
6. [Client-to-Server Messages](#6-client-to-server-messages)
7. [Server-to-Client Messages](#7-server-to-client-messages)
8. [SPICE Protocol](#8-spice-protocol)
9. [SPICE Channel Architecture](#9-spice-channel-architecture)
10. [X11 Forwarding and Alternatives](#10-x11-forwarding-and-alternatives)
11. [Protocol Comparison](#11-protocol-comparison)
12. [Sources](#12-sources)

---

## 1. VNC/RFB Protocol Overview

VNC (Virtual Network Computing) uses the Remote Framebuffer (RFB) protocol, standardized in RFC 6143. The protocol operates on a simple model: the server maintains a framebuffer, and the client requests updates to regions of that buffer. All VNC implementations -- TightVNC, TigerVNC, RealVNC, UltraVNC, noVNC -- speak the same base protocol [1].

Default port: TCP 5900 (display :0), 5901 (display :1), etc.

---

## 2. RFB Handshake

The connection sequence has four phases [1]:

| Phase | Exchange |
|---|---|
| 1. Protocol Version | Server sends "RFB 003.008\n"; client responds with its version |
| 2. Security | Server lists supported security types; client selects one |
| 3. Authentication | Security-type-specific exchange (e.g., VNC password challenge) |
| 4. Initialization | Client sends ClientInit (shared-flag); server sends ServerInit (framebuffer dimensions, pixel format, name) |

Protocol versions: 3.3 (original), 3.7 (security type negotiation), 3.8 (security result message). Version 3.8 is current [1].

```
RFB HANDSHAKE SEQUENCE (v3.8)
================================================================
  Server -> Client: "RFB 003.008\n"
  Client -> Server: "RFB 003.008\n"
  Server -> Client: number-of-security-types, security-type-list
  Client -> Server: selected-security-type
  [security-type-specific authentication exchange]
  Server -> Client: SecurityResult (OK/Failed)
  Client -> Server: ClientInit (shared-flag: U8)
  Server -> Client: ServerInit (width, height, pixel-format, name)
```

---

## 3. Security Types

| Type ID | Name | Security Level | Notes |
|---|---|---|---|
| 1 | None | None | No authentication; connection proceeds directly |
| 2 | VNC Authentication | Weak (DES) | Challenge-response using DES-encrypted password; DES is broken |
| 5 | RA2 | Medium | RealVNC proprietary; AES-based |
| 6 | RA2ne | Medium | RealVNC no-encryption variant |
| 16 | Tight | Variable | TightVNC extension; supports tunneling and auth sub-types |
| 18 | TLS | Strong | VeNCrypt TLS wrapper; server certificate verification |
| 19 | VeNCrypt | Strong | Nested security types over TLS (x509 + VNC auth, etc.) |

> **SAFETY: VNC Authentication (type 2) uses DES, which is cryptographically broken.** The 8-character password is DES-encrypted with a fixed challenge. Always use VeNCrypt/TLS or tunnel VNC through SSH in production environments.

The security type registry is maintained by IANA (since December 2012) rather than in the RFC itself [1].

---

## 4. Pixel Format and Framebuffer

The ServerInit message includes the pixel format describing how framebuffer pixels are encoded:

| Field | Size | Description |
|---|---|---|
| bits-per-pixel | U8 | 8, 16, or 32 |
| depth | U8 | Number of significant bits |
| big-endian-flag | U8 | Byte order for multi-byte pixels |
| true-colour-flag | U8 | 1 = RGB direct, 0 = color map |
| red-max | U16 | Maximum red value |
| green-max | U16 | Maximum green value |
| blue-max | U16 | Maximum blue value |
| red-shift | U8 | Bit position of red within pixel |
| green-shift | U8 | Bit position of green |
| blue-shift | U8 | Bit position of blue |

The client can request a different pixel format via SetPixelFormat message at any time [1].

---

## 5. Encoding Registry

Encodings define how framebuffer rectangles are compressed. The client advertises supported encodings in preference order via SetEncodings [1]:

| Encoding | ID | Description | Best For |
|---|---|---|---|
| Raw | 0 | Uncompressed pixel data | LAN, debugging |
| CopyRect | 1 | Source coordinates only; client copies from local buffer | Window moves, scrolls |
| RRE | 2 | Rise-and-Run-length Encoding; subrectangles of solid color | Simple desktops |
| CoRRE | 4 | Compact RRE; 8-bit subrect coordinates | Small rectangles |
| Hextile | 5 | 16x16 tile decomposition; raw, solid, or subrect per tile | General purpose |
| Zlib | 6 | Zlib-compressed raw data | High bandwidth |
| Tight | 7 | JPEG + zlib hybrid; quality levels; best compression ratio | WAN connections |
| ZRLE | 16 | Zlib Run-Length Encoding; 64x64 tiles | Good all-around |
| TRLE | 15 | Tight RLE variant without zlib | CPU-constrained |
| Cursor | -239 | Client-side cursor rendering | Reduce updates |
| DesktopSize | -223 | Server desktop resize notification | Dynamic resolution |

Tight encoding (TightVNC) achieves the best compression ratios for typical desktop content by combining JPEG for photographic regions and zlib for solid/gradient regions [2].

---

## 6. Client-to-Server Messages

| Message | Type | Purpose |
|---|---|---|
| SetPixelFormat | 0 | Change pixel encoding |
| SetEncodings | 2 | Declare supported encoding types in preference order |
| FramebufferUpdateRequest | 3 | Request update for a rectangle (incremental or full) |
| KeyEvent | 4 | Key press/release (X11 keysym + down-flag) |
| PointerEvent | 5 | Mouse position + button mask |
| ClientCutText | 6 | Clipboard text transfer to server |

---

## 7. Server-to-Client Messages

| Message | Type | Purpose |
|---|---|---|
| FramebufferUpdate | 0 | One or more encoded rectangles of pixel data |
| SetColourMapEntries | 1 | Color map updates (non-true-colour mode) |
| Bell | 2 | Audio bell notification |
| ServerCutText | 3 | Clipboard text from server |

---

## 8. SPICE Protocol

SPICE (Simple Protocol for Independent Computing Environments) was developed by Qumranet (acquired by Red Hat, 2008) and open-sourced in 2009. Unlike VNC's framebuffer model, SPICE transmits rendering commands from the QXL virtual GPU, enabling hardware-accelerated graphics in virtual machines [3].

Key characteristics:
- **Multi-channel architecture** -- separate TCP connections per channel type
- **QXL device model** -- paravirtual GPU that emits SPICE-native drawing commands
- **Agent-assisted** -- guest agent enables clipboard sharing, resolution changes, seamless windows
- **Image compression** -- QUIC (SPICE-specific), LZ, GLZ, JPEG, ZLIB codecs
- **Video streaming** -- detects video regions and encodes as MJPEG stream

---

## 9. SPICE Channel Architecture

| Channel | Purpose | Transport |
|---|---|---|
| Main | Session control, agent communication, migration | TCP (encrypted) |
| Display | Rendering commands, image data, video streams | TCP or UDP |
| Inputs | Keyboard, mouse, tablet events | TCP |
| Cursor | Hardware cursor images and position | TCP |
| Playback | Audio from guest to client | TCP or UDP |
| Record | Audio from client to guest (microphone) | TCP |
| Smartcard | Smart card reader forwarding | TCP |
| USB Redir | USB device redirection (usbredir protocol) | TCP |
| Webdav | File sharing via WebDAV | TCP |
| Port | Generic data channel | TCP |

SPICE supports TLS encryption per-channel and SASL authentication [3].

---

## 10. X11 Forwarding and Alternatives

### X11 Forwarding (via SSH)
Native X Window System protocol forwarded over SSH tunnel. High latency sensitivity due to chatty protocol design (many round trips per widget). Best for occasional GUI application use [4].

### NX/NoMachine
Compresses X11 protocol traffic and caches drawing operations. Dramatically reduces bandwidth requirements compared to raw X11 forwarding. Proprietary (NoMachine) with open-source roots (FreeNX) [5].

### XPRA
"Screen for X11" -- runs applications in persistent sessions and displays them remotely. Supports forwarding via SSH, TCP, or WebSocket. Handles audio, clipboard, file transfers. HTML5 client available [6].

---

## 11. Protocol Comparison

| Feature | VNC/RFB | RDP | SPICE | X11 Forward |
|---|---|---|---|---|
| Default Port | 5900+ | 3389 | 5900-5930 | via SSH (22) |
| Graphics Model | Framebuffer | GDI/Codec | Render commands | X protocol |
| Best Security | VeNCrypt/TLS | NLA/CredSSP | TLS + SASL | SSH tunnel |
| Audio | Extensions only | Built-in | Built-in | None |
| USB Redir | No | Yes (rdpdr) | Yes (usbredir) | No |
| Multi-monitor | Extension | Native | Native | Per-app |
| Typical Bandwidth | 1-10 Mbps | 0.1-10 Mbps | 1-20 Mbps | Variable |
| Platform | Universal | Windows-centric | KVM/QEMU | Unix/X11 |

---

## 12. Sources

1. RFC 6143 -- The Remote Framebuffer Protocol (Richardson & Levine, 2011)
2. TightVNC Encoding Specification -- tightvnc.com/docs.html
3. SPICE Protocol Reference -- spice-space.org/spice-protocol.html
4. RFC 4254 -- SSH Connection Protocol, Section 6.3.2 (X11 Forwarding)
5. NoMachine NX Technology -- nomachine.com/technology
6. XPRA Documentation -- xpra.org/docs
