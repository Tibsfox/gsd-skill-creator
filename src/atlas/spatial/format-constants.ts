/**
 * Format-pin constants for atlas spatial-substrate.
 *
 * Wave 0. Format-version pins live here so any later component reads the same
 * source-of-truth. Bumping a format version is a source-edit at this file.
 */

/** Atlas operates in a logical coordinate space; SRID 0 = "no SRID assigned". */
export const ATLAS_SRID = 0 as const;

/** Default radius for spatial-near queries when caller doesn't override. Logical units. */
export const DEFAULT_RADIUS = 200;

/** Default top-K limit for spatial-near. */
export const DEFAULT_LIMIT = 50;

/** PMTiles 3.x version pin (per upstream spec at github.com/protomaps/PMTiles). */
export const PMTILES_VERSION = 3;

/**
 * PMTiles v3 magic bytes: "PMTiles" + version. Used for early validation when
 * reading a .pmtiles file before the rest of the header is parsed.
 */
export const PMTILES_MAGIC = new Uint8Array([0x50, 0x4d, 0x54, 0x69, 0x6c, 0x65, 0x73, 0x03]);

/** FlatGeobuf 3.x version pin. */
export const FLATGEOBUF_VERSION = 3;

/**
 * FlatGeobuf magic bytes: "fgb" + version. The first 8 bytes of any conforming
 * FlatGeobuf file. Source: https://flatgeobuf.org/.
 */
export const FLATGEOBUF_MAGIC = new Uint8Array([0x66, 0x67, 0x62, 0x03, 0x66, 0x67, 0x62, 0x00]);

/** Default density cap per tile when building the PMTiles pyramid. */
export const PMTILES_DENSITY_CAP = 1000;

/** MVT extent default (4096 = standard Mapbox vector tile resolution). */
export const MVT_EXTENT = 4096;
