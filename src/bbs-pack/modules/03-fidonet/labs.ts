/**
 * Module 03: FidoNet interactive labs.
 *
 * Lab 1: FTS-0001 packet header decode — constructs a 58-byte Type-2 packet
 * header with little-endian uint16 fields and reads them back.
 *
 * Lab 2: Packed message decode — constructs a packed message with marker,
 * node/net fields, and null-terminated strings, then parses it back.
 *
 * All Uint8Array/DataView allocations happen inside verify() for isolation.
 *
 * Covers requirement: BBS-08 (interactive labs with verify functions).
 */

import type { BbsLab } from '../../shared/types.js';

const lab01: BbsLab = {
  id: 'bbs-m3-lab-01',
  title: 'FTS-0001 Packet Header Decode',
  steps: [
    {
      instruction:
        'Construct a 58-byte Type-2 FidoNet packet header. Write little-endian uint16 fields at fixed offsets: ' +
        'origNode at offset 0, destNode at offset 2, version (must be 2) at offset 18, ' +
        'origNet at offset 20, destNet at offset 22. Then read them back with a fresh DataView ' +
        'and verify all values match.',
      expected_observation:
        'origNode=123, destNode=456, version=2, origNet=100, destNet=200 all read back correctly. ' +
        'The version field at offset 18 confirms this is a Type-2 packet.',
      learn_note:
        'FTS-0001 defines the Type-2 packet format used by FidoNet for inter-node mail exchange. ' +
        'All multi-byte integers are little-endian (Intel byte order), matching the MS-DOS systems ' +
        'that ran FidoNet mailers. The 58-byte header contains addressing (zone:net/node), timestamps, ' +
        'passwords, and capability flags. The version field at offset 18 must be 2 to identify the format.',
    },
  ],
  verify(): boolean {
    // All allocations inside verify() for pool isolation
    const header = new Uint8Array(58);
    const view = new DataView(header.buffer);

    const origNode = 123;
    const destNode = 456;
    const version = 2;
    const origNet = 100;
    const destNet = 200;

    // Write fields at FTS-0001 offsets (little-endian)
    view.setUint16(0, origNode, true);   // origNode
    view.setUint16(2, destNode, true);   // destNode
    view.setUint16(18, version, true);   // version (must be 2)
    view.setUint16(20, origNet, true);   // origNet
    view.setUint16(22, destNet, true);   // destNet

    // Read back with fresh DataView for verification
    const check = new DataView(header.buffer);
    if (check.getUint16(0, true) !== origNode) return false;
    if (check.getUint16(2, true) !== destNode) return false;
    if (check.getUint16(18, true) !== version) return false;
    if (check.getUint16(20, true) !== origNet) return false;
    if (check.getUint16(22, true) !== destNet) return false;

    return true;
  },
};

const lab02: BbsLab = {
  id: 'bbs-m3-lab-02',
  title: 'Packed Message Decode',
  steps: [
    {
      instruction:
        'Construct a packed FidoNet message: 2-byte marker (0x0002 LE), then origNode (uint16 LE), ' +
        'destNode (uint16 LE), origNet (uint16 LE), destNet (uint16 LE), followed by null-terminated ' +
        'ASCII strings for from, to, and subject fields. Parse the buffer back and verify all fields.',
      expected_observation:
        'Marker reads as 0x0002. origNode=1, destNode=2, origNet=10, destNet=20. ' +
        'The null-terminated strings decode as from="SysOp", to="TestUser", subject="Hello FidoNet".',
      learn_note:
        'FidoNet packed messages live inside a Type-2 packet, one after another. Each message starts ' +
        'with a 0x0002 marker followed by fixed-size addressing fields, then variable-length null-terminated ' +
        'strings for sender, recipient, subject, date, and body. The null terminator acts as a field delimiter — ' +
        'the parser reads bytes until it hits 0x00, then advances to the next field. This format predates ' +
        'modern serialization; it was designed for direct memory mapping on 8086 systems.',
    },
  ],
  verify(): boolean {
    // All allocations inside verify() for pool isolation
    const from = 'SysOp';
    const to = 'TestUser';
    const subject = 'Hello FidoNet';

    // Build binary buffer: marker (2) + origNode (2) + destNode (2) + origNet (2) + destNet (2)
    // + from\0 + to\0 + subject\0
    const headerSize = 2 + 2 + 2 + 2 + 2; // 10 bytes
    const stringsSize = from.length + 1 + to.length + 1 + subject.length + 1;
    const buf = new Uint8Array(headerSize + stringsSize);
    const view = new DataView(buf.buffer);

    // Write marker 0x0002 LE
    view.setUint16(0, 0x0002, true);
    // Write addressing fields
    view.setUint16(2, 1, true);   // origNode
    view.setUint16(4, 2, true);   // destNode
    view.setUint16(6, 10, true);  // origNet
    view.setUint16(8, 20, true);  // destNet

    // Write null-terminated strings
    let offset = headerSize;
    for (const ch of from) { buf[offset++] = ch.charCodeAt(0); }
    buf[offset++] = 0;
    for (const ch of to) { buf[offset++] = ch.charCodeAt(0); }
    buf[offset++] = 0;
    for (const ch of subject) { buf[offset++] = ch.charCodeAt(0); }
    buf[offset++] = 0;

    // Parse back
    const readView = new DataView(buf.buffer);
    const marker = readView.getUint16(0, true);
    if (marker !== 0x0002) return false;
    if (readView.getUint16(2, true) !== 1) return false;   // origNode
    if (readView.getUint16(4, true) !== 2) return false;   // destNode
    if (readView.getUint16(6, true) !== 10) return false;  // origNet
    if (readView.getUint16(8, true) !== 20) return false;  // destNet

    // Parse null-terminated strings
    function readNullTerminated(data: Uint8Array, start: number): [string, number] {
      let end = start;
      while (end < data.length && data[end] !== 0) end++;
      const str = Array.from(data.slice(start, end))
        .map((b) => String.fromCharCode(b))
        .join('');
      return [str, end + 1]; // skip past the null
    }

    let pos = headerSize;
    const [parsedFrom, pos2] = readNullTerminated(buf, pos);
    const [parsedTo, pos3] = readNullTerminated(buf, pos2);
    const [parsedSubject] = readNullTerminated(buf, pos3);

    if (parsedFrom !== 'SysOp') return false;
    if (parsedTo !== 'TestUser') return false;
    if (parsedSubject !== 'Hello FidoNet') return false;

    return true;
  },
};

export const labs: BbsLab[] = [lab01, lab02];
