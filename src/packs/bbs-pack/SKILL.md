---
name: bbs
description: BBS Educational Pack — routes queries to 5 modules covering terminal protocols through door games
triggers:
  - BBS
  - bulletin board
  - ANSI art
  - FidoNet
  - IRC
  - modem
  - terminal
  - door game
  - CP437
  - SAUCE
  - RS-232
  - Hayes
  - XMODEM
  - ZMODEM
  - echomail
  - netmail
  - DOOR.SYS
  - FOSSIL
---

# BBS Educational Pack

Comprehensive BBS curriculum covering the culture, protocols, and art of the bulletin board system era. From the low-level RS-232 serial signals and Hayes modem AT commands that connected users to remote systems, through the ANSI escape sequences and CP437 character art that gave BBS interfaces their distinctive look, to the store-and-forward FidoNet mail network, real-time IRC messaging, and the door game programs that extended BBS functionality into multiplayer gaming. Five modules across three tiers, with interactive labs powered by real binary parsers.

## Routing

Given a user topic, this skill routes to the appropriate module by matching trigger keywords against the 5 domain skills defined in `chipset.yaml`.

### routeToModule(topic: string): string | null

Accepts a topic string (user query or keyword) and returns the target module directory name, or `null` if no match is found.

**Algorithm:**
1. Normalize the topic string (lowercase, trim whitespace)
2. Match against each skill's `triggers` array from `chipset.yaml`
3. If multiple skills match, prefer the most specific match (longest matching trigger string)
4. Return the matched skill's `module` field (e.g., `"01-terminal-modem"`)
5. If no trigger matches, return `null`

**Keyword-to-Module Routing Table:**

| Keyword | Module | Skill |
|---------|--------|-------|
| RS-232, Hayes, AT command, modem, XMODEM, ZMODEM, serial, baud, terminal, dial-up | 01-terminal-modem | terminal-modem |
| ANSI, CP437, SAUCE, escape sequence, color palette, block character, textmode | 02-ansi-art | ansi-art |
| FidoNet, FTS-0001, echomail, netmail, nodelist, zone:net/node, packet, mailer | 03-fidonet | fidonet |
| IRC, RFC 1459, Dancer, channel, PRIVMSG, bot, services, ircd, JOIN, PART | 04-irc-dancer | irc-dancer |
| door game, DOOR.SYS, CHAIN.TXT, FOSSIL, drop file, BBS door, TradeWars, LORD | 05-door-games | door-games |

## Modules

| # | Module | Tier | Topics |
|---|--------|------|--------|
| 1 | Terminal and Modem Protocols | 1 | RS-232 signals, Hayes AT commands, XMODEM/ZMODEM file transfer, baud rates |
| 2 | ANSI Art | 1 | Escape sequences, CP437 character set, SAUCE metadata, color palettes, rendering |
| 3 | FidoNet | 2 | FTS-0001 packets, echomail/netmail, nodelist, zone:net/node addressing |
| 4 | IRC and Dancer | 2 | RFC 1459 protocol, Dancer ircd source analysis, channel ops, bot architecture |
| 5 | Door Games | 3 | DOOR.SYS/CHAIN.TXT drop files, FOSSIL driver, game loops, multiplayer |

## Learning Progression

The curriculum follows a 3-tier pipeline, where each tier builds on the previous:

**Tier 1 (Foundations)** -- Modules 1-2
Terminal emulation, serial protocols, and ANSI art rendering. How users connected to BBS systems and what they saw on screen. Safety: Annotate mode.

**Tier 2 (Networks)** -- Modules 3-4
Store-and-forward FidoNet mail and real-time IRC messaging. How BBS systems connected to each other and to the wider internet. Safety: Annotate mode.

**Tier 3 (Applications)** -- Module 5
Door game programming and BBS extensibility. How developers built interactive applications on top of the BBS platform. Safety: Annotate mode.

## Configuration

See `chipset.yaml` for detailed skill triggers, agent assignments, and pipeline topology.
See `metadata.yaml` for pack identity, version, and tier structure.
See `references/bibliography.md` for BBS primary source citations.
