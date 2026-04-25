# Grove Format Specification

**Version:** 1
**Status:** Draft — normative for all implementations
**Created:** 2026-04-08
**Authors:** gsd-skill-creator contributors

---

## 0. Purpose

The **Grove format** is a content-addressed, append-only, self-describing
record protocol for storing durable knowledge artifacts — skills, sessions,
research documents, activation events, proof objects, calibration snapshots,
muse observations, and any other category of thing a practitioner wants to
preserve across years and decades.

Grove is not a storage engine. It is the **wire format and hashing protocol**
that multiple storage engines can agree on. A Grove record written by one
implementation in 2026 must be readable by an implementation written in 2046
with no code shared between them, as long as both implementations conform to
this document.

This is why the spec is the authoritative artifact and the code is an
interpretation of it. Code is mortal. Specs outlive their authors.

### Design goals

1. **Indefinitely extensible.** New record types require no format changes,
   no reader updates, no migrations. Adding a new kind of thing to store is a
   matter of writing a new type record.
2. **Self-describing.** A record carries enough information for a reader that
   has never seen its specific type to interpret its fields. No hardcoded
   schemas in readers.
3. **Deterministic.** Identical content produces identical bytes produces
   identical hashes. Bit-for-bit, forever, across any implementation.
4. **Backward-read compatible.** Implementations must read every format
   version from 1 onward. Forward compat is aspirational; backward compat is
   the law.
5. **Hash-agile.** The format does not assume SHA-256. Any hash algorithm
   whose output is 1..=255 bytes can be used.
6. **Append-only.** Records are immutable by construction. Mutation is
   modeled as new records that supersede old ones via typed references.
7. **Cryptographically additive.** Signatures are wrapper records, not
   in-place modifications. Unsigned records remain valid forever; signing
   layers on top.

### Non-goals

- **Not a query language.** Grove defines how records are stored and
  addressed. Traversal, indexing, and search are implementation concerns.
- **Not a transport.** Grove records can be transported over any medium
  (filesystem, network, tarball, IPFS, physical disk). The format does not
  specify how records move between stores.
- **Not a compression format.** Records may be compressed at the storage
  layer but the canonical bytes used for hashing are uncompressed.
- **Not opinionated about types.** Grove provides a primitive type system
  sufficient to describe any record's fields. Semantic typing (units,
  constraints, validation) is the concern of type records, not the protocol.

---

## 1. Canonical binary encoding

All data in a Grove record is encoded using a single, deterministic
length-prefixed binary format. The encoding has exactly these rules:

- **Multi-byte integers are big-endian** (network byte order).
- **Strings are UTF-8, NFC-normalized** (Unicode Normalization Form C).
- **Map keys are always strings**, compared and sorted by **byte-lexicographic
  order** (not by code point, not by locale). Sorting bytes avoids
  Unicode normalization disputes between implementations.
- **Map keys must be unique.** Duplicate keys are an encoding error.
- **All lengths are unsigned 32-bit big-endian integers** unless otherwise
  noted. A length of 0 is valid.

### 1.1 Type tags

The first byte of every canonical value is a type tag:

| Tag  | Name    | Payload                                             |
|------|---------|-----------------------------------------------------|
| 0x00 | NULL    | *(none)*                                            |
| 0x01 | TRUE    | *(none)*                                            |
| 0x02 | FALSE   | *(none)*                                            |
| 0x03 | UINT64  | 8 bytes, big-endian, unsigned                       |
| 0x04 | INT64   | 8 bytes, big-endian, two's complement               |
| 0x05 | BYTES   | 4-byte length + raw bytes                           |
| 0x06 | STRING  | 4-byte length + UTF-8 NFC bytes                     |
| 0x07 | ARRAY   | 4-byte count + each element                         |
| 0x08 | MAP     | 4-byte count + each (STRING key, value) pair        |
| 0x09 | HASHREF | 1-byte hash-algo id + 1-byte length + hash bytes    |

Tags 0x0A..0x7F are **reserved** for future extensions and MUST be rejected
by a v1 reader. Tags 0x80..0xFF are **reserved for private use** and MUST be
rejected by default but implementations MAY enable them behind an explicit
private-extension flag.

### 1.2 Floating point is deliberately absent

Grove does not define a float tag. Floats are omitted because canonical
hashing over IEEE 754 is fraught (signed zero, NaN payload variance,
denormal handling, non-associativity). Applications that need real numbers
should use one of:

- A rational encoding as `{"num": int64, "den": uint64}` in a map
- A fixed-point encoding as an int64 with an implicit or explicit scale
- A stringified decimal representation as STRING

If a future version of Grove adds a float tag, it will be tag 0x0A with a
strictly-canonicalized IEEE 754 double-precision encoding (no negative zero,
no NaN, or a single canonical NaN payload).

### 1.3 HASHREF tag

The HASHREF tag is a content-addressed reference to another record by its
identity hash. Its encoding is:

```
[0x09] [algo_id: u8] [length: u8] [hash bytes: length]
```

Algorithm IDs are registered in section 4.3. The length field must match
the algorithm's output length. A reader that does not recognize the algo_id
MUST preserve the HASHREF bytes unchanged but MAY refuse to dereference the
hash.

HASHREF exists as a distinct tag from BYTES because it carries semantic
meaning: "this is an edge in the record graph." Tools can walk HASHREFs
without needing to know the schema of the containing record.

### 1.4 Map key ordering

Map keys are sorted by byte-lexicographic order of their UTF-8 NFC
encoding. Example:

```
Keys: "age", "name", "Age"

UTF-8 bytes:
  "Age"  = 41 67 65
  "age"  = 61 67 65
  "name" = 6e 61 6d 65

Sorted order: "Age" < "age" < "name"
```

Note that uppercase ASCII letters (`A`-`Z`, 0x41-0x5A) sort BEFORE lowercase
(`a`-`z`, 0x61-0x7A), which is the opposite of locale-aware sort. This is
intentional and stable forever.

### 1.5 Test vectors

Implementations MUST reproduce these exact byte sequences.

**Test vector 1: NULL**
Input: `null`
Output (hex): `00`

**Test vector 2: TRUE**
Input: `true`
Output (hex): `01`

**Test vector 3: FALSE**
Input: `false`
Output (hex): `02`

**Test vector 4: UINT64 42**
Input: `42` (as uint64)
Output (hex): `03 00 00 00 00 00 00 00 2A`

**Test vector 5: INT64 -1**
Input: `-1` (as int64)
Output (hex): `04 FF FF FF FF FF FF FF FF`

**Test vector 6: STRING "test"**
Input: `"test"`
Output (hex): `06 00 00 00 04 74 65 73 74`

**Test vector 7: BYTES (3 bytes)**
Input: `[0xDE, 0xAD, 0xBE]`
Output (hex): `05 00 00 00 03 DE AD BE`

**Test vector 8: empty STRING**
Input: `""`
Output (hex): `06 00 00 00 00`

**Test vector 9: empty ARRAY**
Input: `[]`
Output (hex): `07 00 00 00 00`

**Test vector 10: empty MAP**
Input: `{}`
Output (hex): `08 00 00 00 00`

**Test vector 11: ARRAY of two uint64s**
Input: `[1, 2]`
Output (hex):
```
07 00 00 00 02
03 00 00 00 00 00 00 00 01
03 00 00 00 00 00 00 00 02
```

**Test vector 12: MAP {"age": 42, "name": "test"}**
Input: `{"age": 42, "name": "test"}`
Sorted keys: `age`, `name` (byte-lex order, both lowercase, "a"(0x61) < "n"(0x6E))
Output (hex):
```
08 00 00 00 02
06 00 00 00 03 61 67 65 03 00 00 00 00 00 00 00 2A
06 00 00 00 04 6E 61 6D 65 06 00 00 00 04 74 65 73 74
```
Length: 40 bytes total.

**Test vector 13: HASHREF (sha256, 32 bytes of 0xAB)**
Input: HASHREF with algo=1 (sha-256) and 32 bytes of 0xAB
Output (hex):
```
09 01 20 AB AB AB AB AB AB AB AB AB AB AB AB AB AB AB AB
         AB AB AB AB AB AB AB AB AB AB AB AB AB AB AB AB
```

Implementations that disagree on any of these test vectors are non-conforming
and MUST be fixed before interoperating.

---

## 2. Record envelope

A Grove record is a MAP with exactly these top-level keys:

```
{
  "version":    UINT64,    // format version, currently 1
  "type_hash":  HASHREF,   // identity hash of the type schema record
  "payload":    BYTES,     // canonical-encoded type-specific content
  "provenance": MAP        // provenance metadata (see 2.1)
}
```

All four keys are mandatory for v1 records. The record is serialized by
canonically encoding this MAP. The record's **identity hash** is the
selected hash algorithm applied to the canonical bytes of the entire MAP
(including provenance — provenance is part of the identity).

### 2.1 Provenance

Provenance is itself a MAP with these keys:

```
{
  "created_at_ms":  UINT64,              // Unix milliseconds
  "author":         STRING | NULL,       // opaque author identifier
  "parent_hashes":  ARRAY[HASHREF],      // records this was derived from
  "session_id":     STRING | NULL,       // session/context identifier
  "tool_version":   STRING,              // software version that wrote this
  "dependencies":   ARRAY[HASHREF]       // semantic references to other records
}
```

All keys are mandatory. Use NULL for unknown `author` or `session_id`. Use
empty arrays `[]` for `parent_hashes` and `dependencies` when none apply.
`tool_version` should be non-empty; use `"unknown"` if literally nothing is
known.

Why provenance is in the identity hash: if an author writes "the first
version of skill X" and a different author writes "the first version of
skill X" with a byte-identical body, they are NOT the same record. They are
two records with the same payload and different provenance, and the graph
should preserve that distinction.

### 2.2 Encoding a record is deterministic

Given the same input values, encoding MUST produce the same bytes on any
conforming implementation. This is what makes the identity hash meaningful
across implementations and time.

---

## 3. Type records

A **type record** is a record whose payload describes the schema of another
record type. Type records are stored in the same arena as any other record
and are referenced by their own identity hash.

### 3.1 The bootstrap problem

When a record says `type_hash = H`, that H refers to another record that
must itself be a type record. But what is the type of a type record? It
can't be a normal type record, because that would recurse infinitely.

Grove solves this with a single **well-known sentinel hash** that means "I
am a bootstrap type record, interpret me using this spec directly":

```
BOOTSTRAP_TYPE_HASH = 32 bytes of 0x00
```

A record whose `type_hash` equals this sentinel is a bootstrap record.
Readers interpret its payload using the type rules in section 3.2, NOT by
fetching another type record. The bootstrap records are:

1. **The type record for type records** (`TypeRecord`)
2. **The type record for namespace records** (`NamespaceRecord`)
3. **The type record for signature records** (`SignatureRecord`)

These three bootstrap types are defined statically in this specification
(section 5) and MUST be implemented identically by all readers.

After bootstrap, any further type can be defined as a normal record with
`type_hash = hash(TypeRecord bootstrap)`. That is, the type of user-defined
types is the TypeRecord bootstrap.

### 3.2 TypeRecord schema (bootstrap)

A `TypeRecord` payload is a MAP with these keys:

```
{
  "name":        STRING,         // human-readable type name
  "description": STRING,         // free-form description
  "fields":      ARRAY[FieldDef]
}
```

Where `FieldDef` is a MAP:

```
{
  "name":        STRING,         // field name
  "kind":        STRING,         // one of: "null" | "bool" | "uint64" |
                                 //         "int64" | "string" | "bytes" |
                                 //         "hashref" | "array" | "map"
  "element_kind": STRING | NULL, // required if kind == "array"; recursive type name
  "required":    TRUE | FALSE,
  "description": STRING
}
```

When `kind` is `"array"`, `element_kind` names the element type and MAY be
any of the primitive kinds or a user-defined type name registered elsewhere.
When `kind` is `"map"`, the shape is a free-form map; tighter constraints
can be expressed via a nested type record.

---

## 4. The three bootstrap types

These three types are baked into the spec and have fixed identity hashes
that readers must know before they can parse any record.

### 4.1 TypeRecord (self-describing)

```
{
  "version":   1,
  "type_hash": BOOTSTRAP_TYPE_HASH,
  "payload":   <canonical encoding of the TypeRecord schema definition>,
  "provenance": {
    "created_at_ms": 0,
    "author": null,
    "parent_hashes": [],
    "session_id": null,
    "tool_version": "grove-format/1.0",
    "dependencies": []
  }
}
```

The payload is the MAP:

```
{
  "name": "TypeRecord",
  "description": "A record that describes the schema of another record type.",
  "fields": [
    {"name": "name",        "kind": "string", "element_kind": null, "required": true,
     "description": "Human-readable type name."},
    {"name": "description", "kind": "string", "element_kind": null, "required": true,
     "description": "Free-form description of what records of this type mean."},
    {"name": "fields",      "kind": "array",  "element_kind": "map", "required": true,
     "description": "Ordered list of field definitions."}
  ]
}
```

The identity hash of the TypeRecord bootstrap record is **TYPE_RECORD_HASH**
and is an invariant of the v1 spec. All conforming implementations MUST
derive the same 32-byte SHA-256 from the canonical encoding of this record.

### 4.2 NamespaceRecord

```
Payload:
{
  "name": "NamespaceRecord",
  "description": "A mapping from human-readable names to record hashes.",
  "fields": [
    {"name": "bindings", "kind": "map", "element_kind": null, "required": true,
     "description": "Map of string name → hashref to the bound record."},
    {"name": "previous", "kind": "hashref", "element_kind": null, "required": false,
     "description": "Hashref to the prior NamespaceRecord in the mutation chain."}
  ]
}
```

A namespace record's payload contains the current bindings AND a hashref to
the previous namespace record, forming a linked list through time. Walking
the chain of `previous` pointers gives the complete mutation history of the
namespace.

### 4.3 SignatureRecord

```
Payload:
{
  "name": "SignatureRecord",
  "description": "A cryptographic signature over another record's hash.",
  "fields": [
    {"name": "signed_hash", "kind": "hashref", "element_kind": null, "required": true,
     "description": "Hashref to the record being signed."},
    {"name": "algorithm",   "kind": "string",  "element_kind": null, "required": true,
     "description": "Signature algorithm identifier, e.g. 'ed25519'."},
    {"name": "public_key",  "kind": "bytes",   "element_kind": null, "required": true,
     "description": "Signer's public key."},
    {"name": "signature",   "kind": "bytes",   "element_kind": null, "required": true,
     "description": "Signature bytes over the signed record's identity hash."}
  ]
}
```

Signature records are independent of the records they sign. A record may
have zero, one, or many signature records referencing it. Trust is a query
over the signature graph, not a property of the signed record itself.

---

## 5. Hash algorithm registry

HASHREF values include an `algo_id` byte identifying the hash algorithm.
The v1 spec defines:

| algo_id | Name       | Length (bytes) | Notes                    |
|---------|------------|----------------|--------------------------|
| 0x00    | *reserved* | —              | Never used in v1         |
| 0x01    | SHA-256    | 32             | Default, baseline        |
| 0x02    | Blake3-256 | 32             | Performance              |
| 0x03    | SHA3-256   | 32             | Post-SHA2 backup         |
| 0x04    | SHA-512    | 64             | When 256 bits isn't enough |
| 0x05    | Blake3-512 | 64             |                          |

Algorithm IDs 0x06..0xFE are reserved for future allocation. Algorithm ID
0xFF is reserved for private-use hashes; implementations MAY ship private
hashes behind a flag but MUST NOT publish records using 0xFF to shared
stores.

When computing a record's identity hash, any of the registered algorithms
may be used. The choice is implementation-driven. Records signed by one
implementation using Blake3 can be verified by another implementation as
long as that implementation has a Blake3 library available.

---

## 6. Record identity

A record's identity hash is computed as:

1. Encode the record envelope (a MAP with the four mandatory keys) using
   the canonical encoding from section 1.
2. Apply the selected hash algorithm to the resulting bytes.
3. The hash output is the record's identity.

The identity hash is deterministic: the same record content MUST produce
the same identity on any conforming implementation.

### 6.1 Referencing a record

To reference a record from another record, use HASHREF with the referenced
record's identity hash and algo_id. A reader that encounters a HASHREF can
look it up in any available store; if the store returns a record whose
re-computed identity hash matches the HASHREF, the reference is valid.

**Readers MUST verify re-computed hashes match.** Storage can be corrupt,
networks can lie, adversaries can substitute. The hash check is the only
guarantee of integrity.

### 6.2 Dangling references

A HASHREF may point to a record that is not currently available. This is
NOT an error. Records can be retrieved later, from another store, from an
import, from a backup. A reader that encounters a dangling reference
SHOULD report it but MUST NOT refuse to process the containing record.

---

## 7. Mutation model

Grove is append-only. "Mutation" is modeled as writing new records that
reference or supersede old ones. There are three patterns:

### 7.1 New version via parent_hashes

When a record evolves (e.g. a skill's body is edited), the new version is
a new record with the old version's hash in `parent_hashes`. The record
graph preserves the full evolution chain. Readers can walk `parent_hashes`
to reconstruct history.

### 7.2 Name rebinding via namespace chains

When a human-readable name should point to a different record, a new
`NamespaceRecord` is written with the updated bindings and the old
namespace record's hash in its `previous` field. The "head pointer" to the
current namespace is the only mutable state in the system — every name
resolution walks from the head pointer through the binding map.

Implementations store the head pointer in a well-known location that is
not itself a Grove record (e.g. a filesystem path, a database row, an
arena chunk under a sentinel hash). The head pointer's format is
implementation-defined; the spec only requires that it identify the
current namespace record.

### 7.3 Superseding via typed relationships

Record types MAY define fields that express superseding relationships —
for example, a `Retraction` record type could have a `retracts: HASHREF`
field. This is semantic mutation at the record-type level, orthogonal to
the format-level `parent_hashes` mechanism.

---

## 8. Export format

A Grove export is a single-file bundle for transferring a set of records
between stores. The canonical export format is a **tar archive**
(optionally compressed with gzip or zstd) containing:

```
grove-export/
├── MANIFEST.grove                 # canonical-encoded manifest record
├── records/
│   ├── <hex-hash-1>.grove        # one file per record, canonical bytes
│   ├── <hex-hash-2>.grove
│   └── ...
└── README.txt                     # human-readable summary
```

### 8.1 Manifest

The manifest is itself a Grove record with a dedicated `ExportManifest`
type (see section 9 for how user-defined types are registered). Its
payload contains:

```
{
  "format_version":   UINT64 = 1,
  "exported_at_ms":   UINT64,
  "exported_by":      STRING | NULL,
  "record_count":     UINT64,
  "head_namespace":   HASHREF | NULL,
  "hash_algorithm":   STRING,                  // e.g. "sha-256"
  "records":          ARRAY[HASHREF],          // every record in this export
  "bootstrap_types":  ARRAY[HASHREF]           // the three bootstrap hashes
}
```

### 8.2 Verification

A reader ingesting an export MUST:

1. Parse the manifest.
2. For each entry in `records`, verify that the corresponding file exists
   in `records/` and that the hex-decoded filename equals the hash
   computed over the file's canonical bytes.
3. Walk HASHREFs starting from `head_namespace` (if present) and confirm
   all reachable records are present. Dangling references are warnings,
   not errors (per section 6.2).

### 8.3 Filename convention

Record files are named `<hash-hex>.grove` where `<hash-hex>` is the
lowercase hex encoding of the identity hash bytes. For SHA-256 this is a
64-character hex string. The filename carries the hash so that filesystem
tools can enumerate records without parsing any files.

---

## 9. Extensibility rules

These rules exist so that the format can grow without breaking existing
records and readers.

### 9.1 New record types

Anyone can define a new record type by writing a `TypeRecord` and storing
it. The new type is usable immediately; no spec update is required.
Records using the new type interoperate across all conforming Grove stores.

### 9.2 New canonical tags

Tags 0x0A..0x7F are reserved for future versions of the spec. Adding a tag
is a MINOR format version bump (v1 → v1.1). v1.0 readers MUST reject
records containing v1.1 tags (since they can't interpret them). v1.1
readers MUST read both v1.0 and v1.1 records.

### 9.3 New hash algorithms

Adding a hash algorithm to the registry in section 5 is a MINOR spec
update. Implementations MAY support any subset of registered algorithms;
a reader that cannot verify a given algorithm MUST treat the hash as
opaque but MUST preserve the bytes on export.

### 9.4 Format version bumps

The top-level `version` field in the record envelope controls format
compatibility:

- **v1** (current): everything in this document
- **v2** (future): will be defined when a breaking change is needed

A v1 reader MUST reject v2 records. A v2 reader MUST read both v1 and v2
records. Breaking changes are rare by policy — we should be able to go
decades on v1 before any v2 is needed.

### 9.5 What must NEVER change

These are the immutable contracts. Breaking any of them is a new format,
not a new version:

- The four top-level keys of a record (`version`, `type_hash`, `payload`,
  `provenance`) and their types
- The six provenance keys and their types
- The three bootstrap type identity hashes
- The canonical encoding of tags 0x00..0x09
- Big-endian integer encoding
- UTF-8 NFC string encoding
- Byte-lexicographic map key sorting
- HASHREF as a distinct tag from BYTES

---

## 10. Security considerations

### 10.1 Hashes are integrity, not secrecy

A Grove record's identity hash proves the bytes haven't changed since they
were written. It proves nothing about confidentiality. Sensitive records
should be stored in encrypted-at-rest stores or encrypted before being
written into Grove.

### 10.2 Signature records are additive, not authoritative

The presence of a SignatureRecord tells you who signed a record. It does
NOT tell you whether to trust that signer. Trust is a policy decision
made by the reader, using its own trust graph, whitelist, or other
mechanism. A malicious actor can sign any record they like; what matters
is whose signatures you recognize.

### 10.3 Dangling HASHREFs are a DoS vector if misused

A malicious record could contain millions of dangling HASHREFs intended
to overwhelm a reader's "go find these" phase. Readers MUST bound the
work they do resolving references and SHOULD surface unresolved refs as
warnings, not halt conditions.

### 10.4 Length fields can cause OOMs

Every length field is 32-bit unsigned, which permits up to 4 GiB of
payload per field. Readers MUST bound accepted payloads to
implementation-specific limits and reject records exceeding them. Public
stores should document their limits.

### 10.5 Hash algorithm deprecation

When a hash algorithm is broken (e.g. SHA-1 today), records hashed with
that algorithm lose their integrity guarantee. The format allows re-
hashing old records with a new algorithm and storing the results as new
records, but the OLD records remain in the store for archaeological
purposes. Readers should visibly mark records hashed with deprecated
algorithms as "historical" so users are aware.

---

## 11. Reference implementations

The reference TypeScript implementation lives in this repository at:

- `src/memory/grove-format.ts` — encoder, decoder, record envelope, hashing
- `src/mesh/skill-view.ts` — the first record type defined on top

Additional implementations in Rust, Python, and other languages may exist.
All of them MUST pass the test vectors in section 1.5 and produce
byte-identical canonical encodings of the three bootstrap type records.

The bootstrap type record identity hashes are computed by the reference
implementation at build time and baked into this specification as
immutable constants:

```
TYPE_RECORD_HASH       = sha-256 of canonical encoding of the TypeRecord bootstrap (section 4.1)
NAMESPACE_TYPE_HASH    = sha-256 of canonical encoding of the NamespaceRecord bootstrap (section 4.2)
SIGNATURE_TYPE_HASH    = sha-256 of canonical encoding of the SignatureRecord bootstrap (section 4.3)
```

These hashes will be listed here once the reference implementation computes
them and a test vector is added. They are fixed points in the v1 spec.

---

## 12. Changelog

- **v1 draft (2026-04-08)**: initial specification.
- **v1.49.573 addendum (2026-04-24)**: two substrate modules added as
  composable pre-audit layers over Grove record audit pipelines.

### v1.49.573 — T2c PromptCluster BatchEffect Detector

The [T2c PromptCluster BatchEffect Detector](substrate/promptcluster-batcheffect.md)
adds batch-effect detection on Grove skill embeddings as an optional audit
companion. It identifies systematic embedding-space shifts across batches
(model-version changes, training-distribution changes, prompt-template
changes) that the v1.49.571 Skill Space Isotropy Audit (SSIA) cannot catch.
`composeWithSSIA` returns a `CombinedReport` with a joint status; neither
report overwrites the other.

Grounded in Tao et al., *Batch Effects in Brain Foundation Model Embeddings*
(arXiv:2604.14441 / `eess26_2604.14441`, 2026). The module is read-only and
has no write path into Grove record storage.

### v1.49.573 — T2d ArtifactNet Provenance Verifier

The [T2d ArtifactNet Provenance Verifier](substrate/artifactnet-provenance.md)
wires into the Grove record audit pipeline as a **pre-audit step** — strictly
additive, never mutating. With the `artifactnet-provenance` flag on,
`preAuditHook` wraps any Grove audit-producing function and prepends provenance
findings on a separate `preAudit` array. The existing `findings` array in the
Grove audit report is never mutated. Gate G13 (CAPCOM hard-preservation)
guarantees the Grove audit pipeline is byte-identical with the flag off.

Grounded in Heewon Oh et al., *ArtifactNet: Forensic-Residual Physics for
AI-Generated Content Detection* (arXiv:2604.16254 / `eess26_2604.16254`,
SONICS 2026). The SONICS 3-way (real / partial / synthetic) classifier is
applied to Grove text, audio, and image assets before the existing audit runs.

See [`substrate/upstream-intelligence/README.md`](substrate/upstream-intelligence/README.md)
for the full v1.49.573 substrate cluster hub.

---

## Appendix A: Why not CBOR, BSON, MsgPack, or Cap'n Proto

All of these are serialization formats with reasonable wire efficiency.
None of them commit hard enough to determinism for content-addressing.

- **CBOR** has canonical profiles (RFC 8949 §4.2) but compliance is not
  universal, and implementations have drifted.
- **BSON** is not deterministic.
- **MessagePack** is not deterministic and lacks a required canonical form.
- **Cap'n Proto** optimizes for zero-copy access and is schema-driven; it
  doesn't natively support ad-hoc types without a schema registry.
- **Protobuf** is not deterministic by default (map field ordering, varint
  encoding variations) and has known canonicalization pitfalls.

Grove is small (50 lines to implement the encoder) and strict. The
tradeoff is that it has worse density than CBOR for typical payloads, but
density is not the bottleneck when storage is cheap and the goal is
multi-decade stability.

---

## Appendix B: Why SHA-256 as the default

- Universal library support across every language Grove might ever be
  implemented in
- Well-understood security properties, no known collision attacks
- Output size (32 bytes) is a good balance between integrity and overhead
- Hardware acceleration on all modern CPUs
- Conservative choice that we're unlikely to regret

If and when SHA-256 is deprecated, Grove's hash-agile design means we
rehash and add new algorithm IDs without breaking existing records.

---

**End of specification.**
