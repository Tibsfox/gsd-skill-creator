# Module 3: FidoNet

> **Tier**: 2 | **Safety Mode**: Annotate

## Overview

FidoNet is the store-and-forward messaging network that connected BBS systems worldwide before the Internet became publicly accessible. Where Module 1 established the point-to-point serial connection between two computers, FidoNet built a global mesh network on top of those connections: thousands of BBS systems automatically dialing each other in the middle of the night to exchange message packets using the ZMODEM protocol covered in Module 1. Created by Tom Jennings in 1984 as a way to exchange messages between his two Fido BBS systems, FidoNet grew to over 40,000 nodes across six geographic zones by its peak in the mid-1990s. -- FTS-0001; XMODEM/YMODEM/ZMODEM

FidoNet's architecture is defined by the FidoNet Technical Standards (FTS) documents, with FTS-0001 being the foundational specification for the Type-2 packet format. Every FidoNet system is identified by a hierarchical address (zone:net/node.point), and messages are packed into binary packets with precisely defined header fields for routing. This module covers FidoNet's addressing scheme, packet format, message types (netmail and echomail), the tosser/scanner mechanism, nodelist structure, and session-layer protocols. Understanding FidoNet means understanding how a decentralized message network operated before email and Usenet became ubiquitous. -- FTS-0001

## Topics

### Topic 1: Zone:Net/Node.Point Addressing

Every FidoNet system is identified by a hierarchical address in the format Zone:Net/Node.Point. The zone represents a geographic region: Zone 1 is North America, Zone 2 is Europe, Zone 3 is Oceania, Zone 4 is Latin America, Zone 5 is Africa, and Zone 6 is Asia. Within each zone, nets group nearby BBS systems into local calling areas to minimize long-distance phone charges. Each BBS within a net has a unique node number. The optional point suffix (e.g., .3) identifies individual users who poll a node for their mail rather than operating their own full node. The address 2:280/464.3 identifies Zone 2 (Europe), Net 280, Node 464, Point 3 (a user polling that node). Points use .0 or omit the suffix entirely to refer to the node itself. This addressing scheme enabled efficient routing: messages could be forwarded zone-to-zone, then net-to-net, then to the final node, minimizing the number of long-distance hops. -- FTS-0001

### Topic 2: FTS-0001 Type-2 Packet Header

The Type-2 packet header is a 58-byte binary structure that precedes every FidoNet message packet. All multi-byte fields are stored in little-endian byte order. The field layout is: origNode (uint16, offset 0), destNode (uint16, offset 2), year (uint16, offset 4), month (uint16, offset 6), day (uint16, offset 8), hour (uint16, offset 10), minute (uint16, offset 12), second (uint16, offset 14), baud (uint16, offset 16), version (uint16, offset 18, always value 2), origNet (uint16, offset 20), destNet (uint16, offset 22), prodCode (uint8, offset 24), serialNo (uint8, offset 25), password (8 bytes, offset 26), origZone (uint16, offset 34), destZone (uint16, offset 36). Bytes 38 through 57 are reserved and implementation-dependent in the original Type-2 specification; the Type-2+ extension defined additional fields in this area, but implementations varied. The header encodes both routing information (origin and destination addresses) and timestamp (when the packet was created). -- FTS-0001, Section 2: Packet Header

### Topic 3: Packed Message Format

Within a Type-2 packet, after the 58-byte header, individual messages are stored sequentially. Each packed message begins with a 2-byte marker (0x0002), followed by fixed fields: origNode (uint16), destNode (uint16), origNet (uint16), destNet (uint16), attribute (uint16, message flags like private/crash/kill-sent), cost (uint16), then null-terminated strings for DateTime, ToUser, FromUser, Subject, and the message body. The message body uses carriage return (0x0D) as the line separator and is terminated by a null byte (0x00). After the last message in a packet, a 2-byte zero marker (0x0000) signals the end of packet contents. This packed format allowed multiple messages to be bundled efficiently for a single phone call between two nodes. -- FTS-0001, packed message structure

### Topic 4: Netmail

Netmail is FidoNet's private, point-to-point message delivery system. A netmail message is addressed to a specific node (or point on a node) and is routed through the FidoNet topology to reach its destination. Routing typically followed the zone-net-node hierarchy: a message from 1:123/456 to 2:280/464 would first be forwarded to a Zone 1 gateway node, then to a Zone 2 gateway, then through the Zone 2 network to Net 280, and finally to Node 464. Some messages used "crash" routing (direct dial to the destination, bypassing intermediaries) for urgency. Netmail was used for private correspondence, file requests (REQ), and system operator (sysop) administrative communication. Each hop along the routing path created a new packet with updated header fields reflecting the current leg of the journey. -- FTS-0001

### Topic 5: Echomail

Echomail is FidoNet's public conference messaging system, similar to Usenet newsgroups. An echomail area (also called an echo or conference) has a tag name like "BBS_CARNIVAL" or "FN_SYSOP" and distributes messages to all subscribing nodes. When a user posts a message in an echomail area on their local BBS, the BBS's scanner software packages it into outbound packets for all connected nodes that subscribe to that area. Those nodes' tosser software imports the message into their local message base and re-exports it to their connected nodes, creating a flood-fill distribution pattern. Duplicate detection (using message IDs and SEEN-BY/PATH control lines) prevents messages from circulating indefinitely. At its peak, FidoNet carried hundreds of echomail areas covering topics from programming to politics to regional BBS discussions. -- FTS-0001

### Topic 6: Tosser and Scanner

The tosser and scanner are the two essential software components that handle echomail distribution on each FidoNet node. The **tosser** processes incoming packets: it opens each received packet file, parses the packet header and packed messages, and imports the messages into the appropriate echomail areas in the local message base. It also updates the SEEN-BY and PATH kludge lines to record that this node has processed the message. The **scanner** performs the reverse operation: it scans the local message base for new outbound messages, packs them into Type-2 packets addressed to each connected node (called "downlinks"), and places the packets in the outbound queue. The mailer software then dials each connected node and transfers the packets using file transfer protocols (typically ZMODEM, as covered in Module 1). Popular tosser/scanner packages included Squish, FastEcho, and GoldEd's integrated tools. -- FTS-0001

### Topic 7: Nodelist Structure

The FidoNet nodelist is a global directory of all registered nodes, published weekly with daily differential updates (NODEDIFFs). Each line in the nodelist follows the format: keyword,number,name,location,phone,baud,flags. The keywords define the node's role in the hierarchy: Zone (zone coordinator), Region (regional coordinator), Host (net host/hub), Hub (local hub), Node (standard node), Pvt (private -- unlisted phone), Hold (temporarily not accepting calls), and Down (offline). For example, the line "Node,464,Crystal_Palace_BBS,Amsterdam_NL,31-20-555-1234,9600,CM,XA,V32b" describes Node 464 in its net, named Crystal Palace BBS, located in Amsterdam, reachable at the listed phone number, at 9600 baud, with flags indicating continuous mail (CM), XA (crash mail accepted), and V32b (V.32bis modem). The nodelist was distributed as a compressed file through the FidoNet network itself. -- FTS-0001

### Topic 8: Nodelist Updates

Maintaining an accurate nodelist across tens of thousands of nodes required an efficient update mechanism. The full nodelist (NODELIST.nnn, where nnn is the day-of-year) was published weekly and could be several hundred kilobytes. Daily difference files (NODEDIFF.nnn) contained only the changes since the last full list: additions, deletions, and modifications encoded as line-level diffs. A node's software applied each daily NODEDIFF to its local copy of the nodelist to stay current. Missing a NODEDIFF meant requesting a full nodelist from the zone or regional coordinator. The nodelist compiler software (such as MakeNL or V7) processed the text nodelist into a binary index for fast address lookups during mail routing. Zone and regional coordinators were responsible for collecting updates from their area and propagating them upward for inclusion in the global list. -- FTS-0001

### Topic 9: FTS-0006 EMSI Session Layer

The EMSI (Electronic Mail Standard Identification) session protocol, defined in FTS-0006, governs the handshake between two FidoNet mailers when they connect. After the modem establishes a carrier (using the Hayes AT commands from Module 1), the calling mailer sends an EMSI_REQ sequence. The answering mailer responds with EMSI_DAT containing its FidoNet addresses, system name, operator name, supported protocols, and capabilities. The caller then sends its own EMSI_DAT. This handshake establishes the session parameters: which file transfer protocol to use (ZMODEM, HYDRA, etc.), whether to compress packets, and the authentication password for the link. After the EMSI handshake, the mailers exchange packet files bidirectionally, then terminate the session. EMSI replaced the earlier YooHoo/2U2 and FTSC-0001 handshake protocols with a more extensible ASCII-based negotiation. -- FTS-0001; FTS-0006

### Topic 10: Modern FTN Networks

FidoNet-Technology Networks (FTN) continue to operate today, using the same packet formats and addressing schemes defined in the 1980s and 1990s, often tunneled over TCP/IP instead of dial-up phone lines. fsxNet (founded 2015) is an active hobbyist FTN network connecting BBS systems worldwide using binkd (a FidoNet mailer that operates over TCP/IP). ArakNet and other small FTN networks demonstrate that the store-and-forward messaging model remains viable for communities that value the decentralized, operator-controlled nature of BBS networking. Modern FTN nodes typically run on Linux or FreeBSD using Synchronet, Mystic BBS, or ENiGMA 1/2 BBS software, with binkd handling the IP-based mailer sessions. The FidoNet addressing scheme and packet format have proven remarkably durable -- the same Type-2 packets defined in 1985 are still being generated and parsed by active networks. -- FTS-0001

## Learn Mode Depth Markers

### Level 1: Practical

> FidoNet connected BBS systems into a global message network. Each BBS has an address like 1:123/456 (Zone:Net/Node). Messages travel as binary packets exchanged during nightly phone calls. Echomail is public (like forums), netmail is private (like email). -- FTS-0001

### Level 2: Reference

> See FTS-0001 for the Type-2 packet header specification, packed message format, and addressing conventions. The nodelist format documents the keyword,number,name,location,phone,baud,flags structure. FTS-0006 defines the EMSI session handshake protocol used between mailers. -- FTS-0001; FTS-0006

### Level 3: Technical

> Type-2 packet header (58 bytes, little-endian): origNode (uint16, offset 0), destNode (uint16, offset 2), year (offset 4), month (offset 6), day (offset 8), hour (offset 10), minute (offset 12), second (offset 14), baud (offset 16), version=2 (offset 18), origNet (offset 20), destNet (offset 22), prodCode (uint8, offset 24), serialNo (uint8, offset 25), password (8 bytes, offset 26), origZone (offset 34), destZone (offset 36). Bytes 38-57 reserved/implementation-dependent. Packed message starts with 0x0002 marker, ends with null-terminated strings (DateTime, ToUser, FromUser, Subject, Body). End-of-packet: 0x0000. -- FTS-0001, Section 2: Packet Header
