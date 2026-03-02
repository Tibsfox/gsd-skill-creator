# Module 3: FidoNet -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: Conceptual

Explain the difference between netmail and echomail in FidoNet. For each message type, describe how it is routed from sender to recipient, how many copies of the message exist in the network, and what real-world communication system it most closely resembles.

## Question 2: Protocol Analysis

A FidoNet packet header begins with the following bytes (hexadecimal, little-endian):

```
C8 01 90 01 F6 07 02 00 1C 00 0A 00 1E 00 00 00
60 09 02 00 18 01 D0 00
```

Parse the first 24 bytes into the FTS-0001 Type-2 header fields: origNode, destNode, year, month, day, hour, minute, second, baud, version, origNet, destNet. Express each value in decimal.

## Question 3: Application

Given the FidoNet address 2:280/464.3, identify the zone, net, node, and point components. In which geographic region is this system? If a user at point .3 wants to send a netmail message to 1:123/456, describe the routing path the message would take, identifying each type of hop (point-to-node, node-to-zone-gateway, zone-to-zone, zone-gateway-to-net, net-to-node).

## Question 4: Analysis

A FidoNet sysop notices that echomail messages in the "BBS_CARNIVAL" area are appearing twice on their BBS. Explain the mechanism FidoNet uses to prevent duplicate echomail messages (SEEN-BY and PATH kludge lines) and describe what misconfiguration could cause duplicate delivery. How would you diagnose and fix this problem?

## Question 5: Reasoning

FidoNet's store-and-forward architecture means messages could take hours or days to reach their destination, compared to IRC's real-time delivery (covered in Module 4). Despite this latency, FidoNet echomail became enormously popular. Explain why the store-and-forward model was a practical necessity given the telephone infrastructure of the 1980s and 1990s. What economic and technical constraints made real-time global messaging impractical for BBS networks?

## Answer Key

### Answer 1

**Netmail** is private, point-to-point messaging. A netmail message is addressed to a specific FidoNet address (e.g., 2:280/464) and is routed through the network topology: from the sender's node, through hub and gateway nodes, to the destination node. Only one copy of the message exists at each point in the routing chain -- each intermediate node forwards it and may delete its copy (depending on the "kill/sent" flag). Netmail most closely resembles **email** -- it is private, addressed to a specific recipient, and routed through intermediaries.

**Echomail** is public, broadcast messaging. An echomail message is posted to a named area (e.g., "BBS_CARNIVAL") and is distributed to every node that subscribes to that area. The tosser/scanner mechanism floods the message outward: each node that receives it re-exports it to all its connected nodes. Many copies of the message exist simultaneously across the network. Echomail most closely resembles **Usenet newsgroups** -- it is public, topically organized, and distributed to all subscribing systems through a flood-fill mechanism.

Key routing differences: netmail follows a specific path through the topology (possibly multiple hops), while echomail floods outward to all subscribers. Netmail can be crash-routed (direct dial) for urgency; echomail always follows the normal polling schedule.

### Answer 2

Parsing the bytes as little-endian uint16 values:

| Offset | Bytes | Field | Value (decimal) |
|--------|-------|-------|-----------------|
| 0 | C8 01 | origNode | 0x01C8 = **456** |
| 2 | 90 01 | destNode | 0x0190 = **400** |
| 4 | F6 07 | year | 0x07F6 = **2038** |
| 6 | 02 00 | month | **2** (February) |
| 8 | 1C 00 | day | **28** |
| 10 | 0A 00 | hour | **10** |
| 12 | 1E 00 | minute | **30** |
| 14 | 00 00 | second | **0** |
| 16 | 60 09 | baud | 0x0960 = **2400** |
| 18 | 02 00 | version | **2** |
| 20 | 18 01 | origNet | 0x0118 = **280** |
| 22 | D0 00 | destNet | 0x00D0 = **208** |

This packet was sent from node 280/456 to node 208/400 on February 28, 2038 at 10:30:00, at 2400 baud, using the Type-2 packet format (version = 2).

### Answer 3

Address breakdown for **2:280/464.3**:
- **Zone 2** -- Europe
- **Net 280** -- a local network within Zone 2
- **Node 464** -- a specific BBS within Net 280
- **Point 3** -- a user polling Node 464 for their mail

Routing path for a netmail from 2:280/464.3 to 1:123/456:

1. **Point to Node**: Point .3 dials Node 464 (their home node) and uploads the netmail message during their regular polling session.
2. **Node to Zone 2 Gateway**: Node 464's mailer forwards the message to the Zone 2 outbound gateway (typically the Zone 2 coordinator or a designated international gateway node) during the next mail event.
3. **Zone 2 Gateway to Zone 1 Gateway**: The Zone 2 gateway makes an international call (or uses an IP tunnel) to the Zone 1 gateway to transfer the packet.
4. **Zone 1 Gateway to Net Host**: The Zone 1 gateway forwards the message to Net 123's host node within Zone 1.
5. **Net Host to Destination Node**: Net 123's host forwards the message to Node 456, where the recipient can read it.

The total delivery time could range from a few hours (if all nodes poll frequently) to several days (if some nodes only poll once daily during off-peak hours).

### Answer 4

FidoNet uses **SEEN-BY** and **PATH** kludge lines in echomail messages to prevent duplicates:

- **SEEN-BY** lines list every node address that has processed the message (appended by each tosser). When a node's tosser imports a message and finds its own address already in the SEEN-BY list, it knows this is a duplicate and discards it.
- **PATH** lines record the actual routing path the message took (which node forwarded it to which), providing a traceable delivery chain.

**Causes of duplicate delivery:**
1. **Multiple uplinks for the same echo**: If the sysop configured the BBS to receive "BBS_CARNIVAL" from two different uplink nodes, both uplinks would send the same messages, and if the SEEN-BY deduplication fails (e.g., due to a tosser configuration error), duplicates appear.
2. **Misconfigured tosser**: The tosser may not be reading SEEN-BY lines correctly, or the SEEN-BY format from one uplink may differ slightly (e.g., abbreviated zone notation vs. full notation).
3. **Circular routing**: If the node is configured as both a receiver and re-exporter to the same uplink, messages could loop back.

**Diagnosis**: Check the SEEN-BY lines on duplicate messages -- if they arrived via different paths (different SEEN-BY entries), the issue is multiple uplinks. If the SEEN-BY lines are identical, the tosser is not deduplicating properly. **Fix**: Configure the BBS to receive each echomail area from exactly one uplink, or verify that the tosser's duplicate detection is enabled and correctly parsing SEEN-BY lines.

### Answer 5

FidoNet's store-and-forward model was a practical necessity due to three fundamental constraints of the era:

**1. Economic constraint -- phone call costs.** Every FidoNet connection required a phone call. Local calls were free or cheap, but long-distance and international calls were extremely expensive (often $1-3 per minute for international). Real-time global messaging would require maintaining continuous phone connections, which was economically impossible for hobbyist BBS operators. Store-and-forward solved this by batching messages into packets exchanged during brief, scheduled calls -- typically during "Zone Mail Hour" when long-distance rates were lowest (usually 1-4 AM local time).

**2. Technical constraint -- single phone line.** Most BBS systems had one or two phone lines. A BBS could not simultaneously serve callers and make outbound FidoNet calls. Store-and-forward allowed the BBS to dedicate specific time windows (like late night) to FidoNet mail exchanges while serving callers during the day. Real-time messaging would monopolize the phone line.

**3. Infrastructure constraint -- no always-on connectivity.** There was no equivalent of an always-on Internet connection for most BBS operators. Dial-up connections were inherently temporary -- you connected, exchanged data, and disconnected. Maintaining a persistent connection between thousands of nodes worldwide was technically impossible with the telephone infrastructure of the time.

The store-and-forward model turned these constraints into features: messages were queued, batched, compressed, and exchanged during optimal windows. The latency (hours to days) was acceptable because users were accustomed to postal mail timescales, and the asynchronous nature meant time zone differences were irrelevant. IRC (Module 4) only became practical when the Internet provided always-on, flat-rate connectivity that eliminated all three of these constraints.
