# NASA Open Data Integration Guide

> Practical pathways for integrating NASA datasets into local simulations and software -- from Python notebooks to Minecraft worlds to Arduino hardware.

---

## Data Source Registry

Before diving into platform-specific integration, here is the master list of NASA data sources referenced throughout this guide.

| Source | URL | Data Type | Auth Required | Rate Limit |
|--------|-----|-----------|---------------|------------|
| NASA Open APIs | https://api.nasa.gov | REST JSON | API key (free) | DEMO_KEY: 30/hr, 50/day. Personal key: 1000/hr |
| JPL Horizons | https://ssd.jpl.nasa.gov/horizons/ | Ephemeris tables | None | Reasonable use |
| NAIF SPICE | https://naif.jpl.nasa.gov/naif/data.html | Binary kernels (SPK, CK, PCK) | None | FTP/HTTP download |
| MAST Archive | https://mast.stsci.edu | FITS images | MAST account (free) | Bulk download limits |
| PDS | https://pds.nasa.gov | IMG, FITS, CSV, XML labels | None | FTP/HTTP download |
| PDS Geosciences | https://pds-geosciences.wustl.edu | Terrain models, spectra | None | FTP/HTTP download |
| PDS Small Bodies | https://sbn.psi.edu | Shape models, spectra | None | FTP/HTTP download |
| DONKI | https://api.nasa.gov/DONKI/ | Space weather JSON | API key | Same as NASA Open APIs |
| CelesTrak | https://celestrak.org/NORAD/elements/ | TLE/OMM text | None (Space-Track needs account) | Reasonable use |
| NASA 3D Resources | https://science.nasa.gov/3d-resources/ | glTF, OBJ, STL, FBX | None | Direct download |
| Planck Legacy Archive | https://pla.esac.esa.int | HEALPix FITS maps | None | Direct download |
| USGS Astrogeology | https://astrogeology.usgs.gov | GeoTIFF, IMG DEMs | None | Direct download |
| NASA SVS | https://svs.gsfc.nasa.gov | Rendered imagery, data products | None | Direct download |

---

## 1. Python Scientific Computing

### 1.1 JPL Horizons -- Ephemeris Data

**Packages:** `pip install astroquery astropy`

**What you get:** Position, velocity, orbital elements, and physical properties for 1.4M+ asteroids, 4000+ comets, all planets, 424 natural satellites, 239 spacecraft.

**Data format:** Astropy Table objects (convertible to pandas DataFrame, CSV, FITS).

```python
from astroquery.jplhorizons import Horizons

# Query Mars position as seen from Earth, Jan-Jun 2025
mars = Horizons(
    id='499',           # Mars NAIF ID
    location='500',     # Geocentric
    epochs={'start': '2025-01-01', 'stop': '2025-07-01', 'step': '1d'}
)

# Ephemeris: RA, Dec, distance, magnitude, etc.
eph = mars.ephemerides()
print(eph.columns)
# ['targetname', 'datetime_str', 'datetime_jd', 'H', 'G', 'solar_presence',
#  'flags', 'RA', 'DEC', 'RA_app', 'DEC_app', 'RA_rate', 'DEC_rate',
#  'AZ', 'EL', 'airmass', 'magextinct', 'V', 'surfbright', ...]

# State vectors: position (x,y,z) and velocity (vx,vy,vz) in km and km/s
vec = mars.vectors()
print(vec['x', 'y', 'z', 'vx', 'vy', 'vz'])

# Orbital elements
elem = mars.elements()
print(elem['a', 'e', 'incl', 'Omega', 'w', 'M'])
```

**Key IDs:** Sun=10, Mercury=199, Venus=299, Earth=399, Moon=301, Mars=499, Jupiter=599, Saturn=699, ISS=-125544, Voyager 1=-31, Voyager 2=-32, Apollo 11 CSM=-911.

**Approximate data sizes:** Single query returns KB-scale tables. Bulk queries with fine time steps (seconds over years) can produce MB-scale results.

---

### 1.2 SPICE Toolkit via SpiceyPy

**Packages:** `pip install spiceypy`

**What you get:** Sub-kilometer precision trajectory data for spacecraft and solar system bodies. Time system conversions. Reference frame transformations. Geometry computations (occultation, illumination angles, etc.).

**SPICE kernel types:**
- **SPK** -- Spacecraft/planet ephemeris (position + velocity)
- **CK** -- Spacecraft orientation (attitude)
- **PCK** -- Planetary constants (size, shape, orientation)
- **LSK** -- Leap seconds
- **FK** -- Reference frame definitions
- **IK** -- Instrument parameters
- **SCLK** -- Spacecraft clock coefficients

**Where to download kernels:** https://naif.jpl.nasa.gov/pub/naif/

```python
import spiceypy as spice
import numpy as np

# Load required kernels (download from NAIF first)
spice.furnsh('naif0012.tls')        # Leap seconds (~5 KB)
spice.furnsh('de440.bsp')           # Planetary ephemeris (~120 MB)
spice.furnsh('pck00011.tpc')        # Planetary constants (~130 KB)

# Convert calendar time to ephemeris time
et = spice.str2et('1969 JUL 20 20:17:40 UTC')  # Apollo 11 landing

# Get Moon position relative to Earth at that moment
state, lt = spice.spkezr('MOON', et, 'J2000', 'LT+S', 'EARTH')
pos = state[:3]   # km
vel = state[3:]   # km/s
distance = np.linalg.norm(pos)
print(f"Earth-Moon distance at Apollo 11 landing: {distance:.1f} km")

# For Apollo trajectory specifically, load Apollo SPK kernels
# Available at: naif.jpl.nasa.gov/pub/naif/APOLLO/kernels/
```

**Example -- Plot Apollo 11 trajectory:**
```python
import spiceypy as spice
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import numpy as np

spice.furnsh('naif0012.tls')
spice.furnsh('de440.bsp')
# Apollo 11 SPK from NAIF APOLLO collection
spice.furnsh('apollo11_trajectory.bsp')

# Time range: launch to lunar orbit insertion
et_start = spice.str2et('1969 JUL 16 13:32:00 UTC')
et_end   = spice.str2et('1969 JUL 19 17:22:00 UTC')
times = np.linspace(et_start, et_end, 5000)

# Get positions relative to Earth
positions = np.array([
    spice.spkpos('-911', t, 'J2000', 'NONE', 'EARTH')[0]
    for t in times
])

fig = plt.figure(figsize=(12, 10))
ax = fig.add_subplot(111, projection='3d')
ax.plot(positions[:, 0], positions[:, 1], positions[:, 2], 'b-', linewidth=0.5)
ax.scatter([0], [0], [0], color='blue', s=100, label='Earth')

# Moon position at arrival
moon_pos = spice.spkpos('MOON', et_end, 'J2000', 'NONE', 'EARTH')[0]
ax.scatter(*moon_pos, color='gray', s=50, label='Moon')
ax.set_xlabel('X (km)')
ax.set_ylabel('Y (km)')
ax.set_zlabel('Z (km)')
ax.legend()
plt.title('Apollo 11 Translunar Trajectory')
plt.show()

spice.kclear()
```

**Data sizes:** Generic kernels (leap seconds, planetary constants): 5-200 KB. Planetary ephemeris (de440.bsp): ~120 MB covers 1550-2650 AD. Mission-specific SPKs: 1-500 MB depending on time span and resolution.

---

### 1.3 FITS Files from MAST (Hubble / JWST / Kepler)

**Packages:** `pip install astropy astroquery`

**What you get:** Science-ready images, spectra, and time-series data from space telescopes. FITS files contain headers with WCS (World Coordinate System) metadata for precise sky coordinates.

```python
from astropy.io import fits
from astroquery.mast import Observations, MastMissions
import matplotlib.pyplot as plt
import numpy as np

# --- Method 1: Query MAST for JWST observations ---
obs_table = Observations.query_criteria(
    obs_collection='JWST',
    target_name='Carina Nebula',
    dataproduct_type='image',
    calib_level=3  # Fully calibrated
)
print(f"Found {len(obs_table)} observations")

# Get data products and download
products = Observations.get_product_list(obs_table[:5])
manifest = Observations.download_products(
    products,
    productType='SCIENCE',
    extension='fits'
)

# --- Method 2: Open a local FITS file ---
with fits.open('jw02731-o001_t017_nircam_clear-f444w_i2d.fits') as hdul:
    hdul.info()
    # Filename: ...
    # No.  Name      Ver  Type        Cards  Dimensions        Format
    # 0    PRIMARY     1  PrimaryHDU     265  ()
    # 1    SCI         1  ImageHDU        83  (8630, 8932)      float32
    # 2    ERR         1  ImageHDU        14  (8630, 8932)      float32
    # 3    DQ          1  ImageHDU        13  (8630, 8932)      uint32

    sci_data = hdul['SCI'].data     # numpy array
    header = hdul['SCI'].header     # WCS + metadata

    plt.figure(figsize=(12, 12))
    # Log stretch for astronomical images
    vmin, vmax = np.percentile(sci_data[np.isfinite(sci_data)], [1, 99.5])
    plt.imshow(sci_data, origin='lower', cmap='inferno',
               vmin=vmin, vmax=vmax, norm='log')
    plt.colorbar(label='MJy/sr')
    plt.title(f"JWST NIRCam F444W -- {header.get('TARGNAME', 'Unknown')}")
    plt.show()

# --- Method 3: Cloud access (no download) ---
from astropy.io import fits
hdul = fits.open(
    's3://stpubdata/jwst/public/jw02731/jw02731001001/jw02731001001_02101_00001_nrcb1_cal.fits',
    use_fsspec=True,
    fsspec_kwargs={'anon': True}
)
```

**Data sizes:** Individual JWST FITS files: 50 MB - 2 GB. Hubble images: 10-500 MB. Kepler light curves: 1-10 MB each. Full mission archives: TB-scale (use cloud access for large-scale analysis).

---

### 1.4 Mars Imagery (HiRISE / CTX)

**Packages:** `pip install rasterio gdal numpy matplotlib`

**What you get:** Mars surface imagery at up to 25 cm/pixel (HiRISE) and 6 m/pixel (CTX). Digital Terrain Models at 1 m/pixel resolution.

**Data source:** https://www.uahirise.org/dtm/ (HiRISE DTMs), PDS Geosciences Node

```python
import rasterio
import numpy as np
import matplotlib.pyplot as plt

# HiRISE DTMs come as GeoTIFF or IMG format
# Download from: https://www.uahirise.org/dtm/
with rasterio.open('DTEEC_045994_1985_046060_1985_U01.tif') as src:
    elevation = src.read(1)  # Band 1 = elevation in meters
    transform = src.transform
    crs = src.crs

    # Compute hillshade for visualization
    from matplotlib.colors import LightSource
    ls = LightSource(azdeg=315, altdeg=45)
    hillshade = ls.hillshade(elevation, vert_exag=2)

    fig, axes = plt.subplots(1, 2, figsize=(16, 8))
    axes[0].imshow(elevation, cmap='terrain')
    axes[0].set_title('Mars Elevation (m)')
    axes[1].imshow(hillshade, cmap='gray')
    axes[1].set_title('Mars Hillshade')
    plt.suptitle('HiRISE Digital Terrain Model')
    plt.show()

    print(f"Shape: {elevation.shape}")
    print(f"Elevation range: {np.nanmin(elevation):.1f} to {np.nanmax(elevation):.1f} m")
    print(f"Resolution: {transform.a:.2f} m/pixel")
```

**PDS IMG files** (older format) can also be read via GDAL:
```python
import rasterio
# GDAL supports PDS3/PDS4 format natively
with rasterio.open('ESP_045994_1985_RED.IMG') as src:
    data = src.read(1)
```

**Data sizes:** Individual HiRISE DTMs: 200 MB - 4 GB. CTX mosaics: 100 MB - 1 GB. Full HiRISE archive: ~100 TB. Work with targeted areas, not bulk download.

---

### 1.5 Space Weather with SunPy

**Packages:** `pip install sunpy[all] drms zeep`

**What you get:** Solar imagery (SDO/AIA, SOHO), solar wind data, flare catalogs, sunspot records, CME detections. Interface to Virtual Solar Observatory (VSO) and Heliophysics Event Knowledgebase (HEK).

```python
import sunpy.map
from sunpy.net import Fido, attrs as a
import astropy.units as u
from astropy.time import Time
import matplotlib.pyplot as plt

# Search for SDO/AIA 171 Angstrom images (solar corona)
result = Fido.search(
    a.Time('2025-01-15 00:00', '2025-01-15 00:05'),
    a.Instrument.aia,
    a.Wavelength(171 * u.angstrom)
)
print(result)

# Download the first file
downloaded = Fido.fetch(result[0, 0])

# Create a SunPy Map and display
smap = sunpy.map.Map(downloaded[0])
fig = plt.figure(figsize=(10, 10))
ax = fig.add_subplot(projection=smap)
smap.plot(ax)
smap.draw_limb(ax)
smap.draw_grid(ax)
plt.title(f"SDO/AIA 171A -- {smap.date}")
plt.show()

# Search for solar flares in the HEK
from sunpy.net import hek
client = hek.HEKClient()
flares = client.search(
    hek.attrs.Time('2025-01-01', '2025-01-31'),
    hek.attrs.EventType('FL')  # FL = flare
)
print(f"Found {len(flares)} flares in January 2025")
```

**Data sizes:** Individual AIA FITS files: 10-50 MB. Full-disk AIA images at all wavelengths for one day: ~1.5 TB. GOES X-ray flux data: KB-scale CSV.

---

### 1.6 CMB Data Analysis (WMAP / Planck)

**Packages:** `pip install healpy numpy matplotlib astropy`

**What you get:** Full-sky cosmic microwave background temperature and polarization maps. Power spectra. Component-separated maps (CMB, dust, synchrotron, free-free).

```python
import healpy as hp
import numpy as np
import matplotlib.pyplot as plt

# Download Planck SMICA CMB map from:
# https://irsa.ipac.caltech.edu/data/Planck/release_3/all-sky-maps/
# or use healpy's built-in downloader for WMAP:
# hp.download_file(url, md5=True)

# Read the Planck CMB temperature map
cmb_map = hp.read_map('COM_CMB_IQU-smica_2048_R3.01_full.fits', field=0)

# Visualize with Mollweide projection
hp.mollview(
    cmb_map,
    title='Planck SMICA CMB Temperature Map',
    unit='K',
    min=-300e-6, max=300e-6,
    cmap='RdBu_r'
)
plt.show()

# Compute angular power spectrum
cl = hp.anafast(cmb_map, lmax=2500)
ell = np.arange(len(cl))
plt.figure(figsize=(12, 6))
plt.plot(ell[2:], ell[2:] * (ell[2:] + 1) * cl[2:] / (2 * np.pi) * 1e12)
plt.xlabel('Multipole moment l')
plt.ylabel('l(l+1)C_l / 2pi [uK^2]')
plt.title('CMB Temperature Power Spectrum')
plt.xlim(2, 2500)
plt.show()
```

**Data sizes:** Planck full-sky maps at Nside=2048: ~200 MB per component. Full Planck data release: ~50 GB. WMAP 9-year maps: ~2 GB total.

---

### 1.7 Orbital Mechanics with Poliastro

**Packages:** `pip install poliastro astropy matplotlib`

**What you get:** Hohmann transfers, Lambert problem solving, orbit plotting, mission planning. Uses JPL ephemeris data internally via astropy.

```python
from poliastro.bodies import Earth, Mars, Sun
from poliastro.twobody import Orbit
from poliastro.maneuver import Maneuver
from poliastro.plotting.static import StaticOrbitPlotter
from astropy.time import Time
import astropy.units as u

# Define departure and arrival dates (Earth-Mars transfer)
departure = Time('2026-09-01', scale='tdb')
arrival = Time('2027-04-15', scale='tdb')

# Get Earth and Mars orbits at departure
earth_orbit = Orbit.from_body_ephem(Earth, departure)
mars_orbit = Orbit.from_body_ephem(Mars, arrival)

# Solve Lambert problem for the transfer orbit
from poliastro.iod import izzo
(v_depart, v_arrive), = izzo.lambert(
    Sun.k,
    earth_orbit.r,
    mars_orbit.r,
    tof=(arrival - departure).to(u.s)
)

# Plot the transfer
plotter = StaticOrbitPlotter()
plotter.plot_body_orbit(Earth, departure, label='Earth')
plotter.plot_body_orbit(Mars, arrival, label='Mars')

# Hohmann transfer (simpler, circular orbit approximation)
hohmann = Maneuver.hohmann(earth_orbit, mars_orbit.a)
print(f"Delta-v for Hohmann transfer: {hohmann.get_total_cost():.2f}")
```

---

### 1.8 Example -- Voyager 2 Neptune Flyby

```python
import spiceypy as spice
import numpy as np
import matplotlib.pyplot as plt

# Load kernels (download Voyager SPKs from NAIF)
spice.furnsh('naif0012.tls')
spice.furnsh('de440.bsp')
spice.furnsh('vgr2_nep_version2.bsp')  # Voyager 2 Neptune encounter SPK

# Time range: 3 days around closest approach (1989 Aug 25)
et_start = spice.str2et('1989 AUG 23 00:00:00 UTC')
et_end   = spice.str2et('1989 AUG 27 00:00:00 UTC')
times = np.linspace(et_start, et_end, 10000)

# Voyager 2 position relative to Neptune
positions = np.array([
    spice.spkpos('-32', t, 'J2000', 'NONE', 'NEPTUNE BARYCENTER')[0]
    for t in times
])

distances = np.linalg.norm(positions, axis=1)
closest_idx = np.argmin(distances)
closest_time = spice.et2utc(times[closest_idx], 'C', 0)
print(f"Closest approach: {closest_time}")
print(f"Distance: {distances[closest_idx]:.0f} km")

fig = plt.figure(figsize=(14, 6))
ax1 = fig.add_subplot(121, projection='3d')
ax1.plot(positions[:, 0], positions[:, 1], positions[:, 2], 'b-', linewidth=0.8)
ax1.scatter([0], [0], [0], color='blue', s=200, label='Neptune')
ax1.scatter(*positions[closest_idx], color='red', s=50, label='Closest approach')
ax1.legend()
ax1.set_title('Voyager 2 Neptune Flyby -- 3D')

ax2 = fig.add_subplot(122)
hours = (times - times[0]) / 3600
ax2.plot(hours, distances)
ax2.axvline(hours[closest_idx], color='r', linestyle='--', label='Closest approach')
ax2.set_xlabel('Hours since Aug 23')
ax2.set_ylabel('Distance from Neptune (km)')
ax2.legend()
ax2.set_title('Distance Profile')
plt.tight_layout()
plt.show()
```

---

## 2. Minecraft World Generation

### 2.1 Mars DEM to Minecraft Terrain

**Pipeline:** HiRISE GeoTIFF --> Python (rasterio + numpy) --> 16-bit PNG heightmap --> WorldPainter --> Minecraft world

**Tools needed:**
- Python with rasterio, numpy, PIL
- WorldPainter (https://www.worldpainter.net/) -- free, Java-based
- Optionally: Amulet Editor (https://www.amuletmc.com/) for post-processing

```python
import rasterio
import numpy as np
from PIL import Image

# Step 1: Load HiRISE DTM
with rasterio.open('DTEEC_045994_1985_046060_1985_U01.tif') as src:
    elevation = src.read(1).astype(np.float64)

# Step 2: Handle no-data values
nodata = -3.4028235e+38  # Common PDS nodata value
elevation[elevation <= nodata] = np.nan
valid_min = np.nanmin(elevation)
valid_max = np.nanmax(elevation)

# Step 3: Normalize to Minecraft build height (0-319, with 64 as "sea level")
# Scale factor: 1 pixel = 1 block, vertical exaggeration adjustable
VERT_EXAG = 1.0  # Increase for dramatic terrain
mc_min = 0
mc_max = 255  # WorldPainter uses 0-255 grayscale

normalized = (elevation - valid_min) / (valid_max - valid_min)
normalized = np.nan_to_num(normalized, nan=0.0)
heightmap = (normalized * mc_max * VERT_EXAG).clip(mc_min, mc_max).astype(np.uint8)

# Step 4: Export as grayscale PNG (WorldPainter import format)
img = Image.fromarray(heightmap, mode='L')
img.save('mars_heightmap.png')
print(f"Heightmap size: {heightmap.shape}")
print(f"Elevation range mapped to blocks: {mc_min}-{int(mc_max * VERT_EXAG)}")

# Step 5: Generate a color map for surface texture
# Mars rusty-red palette mapped to elevation
from matplotlib import cm
colored = cm.YlOrRd(normalized)  # Yellow-Orange-Red colormap
colored_img = Image.fromarray((colored[:, :, :3] * 255).astype(np.uint8))
colored_img.save('mars_surface_color.png')
```

**WorldPainter import steps:**
1. File --> Import --> Height Map
2. Select `mars_heightmap.png`
3. Set scale: 1 pixel = 1 block (or adjust for larger areas)
4. Set water level to 0 (Mars has no oceans)
5. Apply the surface color as a custom terrain layer
6. Export as Minecraft world

**Block mapping suggestions:**
| Elevation Zone | Minecraft Block | Mars Analog |
|---------------|----------------|-------------|
| Lowest 10% | Red sandstone | Basin floor |
| 10-40% | Terracotta (orange) | Plains |
| 40-70% | Terracotta (red) | Uplands |
| 70-90% | Smooth stone | Canyon walls |
| Top 10% | Packed ice | Polar/summit |

---

### 2.2 Lunar Surface from LRO LOLA

**Data source:** USGS Astrogeology (https://astrogeology.usgs.gov/search/map/moon_lro_lola_dem_118m)

The process is identical to Mars, but with lunar-specific considerations:

```python
import rasterio
import numpy as np
from PIL import Image

# LOLA DEM at 118m resolution, global coverage
# Download the GeoTIFF from USGS Astrogeology
# Full global DEM: ~3.5 GB GeoTIFF
# For Minecraft, crop to a region of interest first
with rasterio.open('Lunar_LRO_LOLA_Global_LDEM_118m.tif') as src:
    # Read a window (e.g., region around a specific crater)
    from rasterio.windows import Window
    # Aristarchus crater region (approximate pixel coords)
    window = Window(col_off=5000, row_off=3000, width=2048, height=2048)
    elevation = src.read(1, window=window).astype(np.float64)

# Normalize and export as heightmap (same as Mars pipeline)
normalized = (elevation - np.nanmin(elevation)) / (np.nanmax(elevation) - np.nanmin(elevation))
heightmap = (normalized * 255).clip(0, 255).astype(np.uint8)

img = Image.fromarray(heightmap, mode='L')
img.save('lunar_crater_heightmap.png')
```

**Lunar block palette:**
| Feature | Minecraft Block | Notes |
|---------|----------------|-------|
| Mare (dark plains) | Gray concrete | Basalt analog |
| Highlands | Light gray concrete | Anorthosite analog |
| Crater floors | Smooth stone | Impact melt |
| Crater rims | Cobblestone | Ejecta blanket |
| Rays | White concrete powder | Fresh impact |

**Data sizes:** Global LOLA DEM (118m): ~3.5 GB. Regional crops: 10-500 MB. SLDEM2015 (59m): ~14 GB.

---

### 2.3 Scale Spacecraft Models

NASA provides dimension data for all major spacecraft. Build guides can be derived from published specifications:

| Spacecraft | Length | Width | MC Scale (1:10) | Source |
|-----------|--------|-------|-----------------|--------|
| ISS | 109 m | 73 m | 11 x 7 blocks | NASA Facts |
| Saturn V | 110 m | 10 m dia | 11 x 1 blocks | NASA History |
| Space Shuttle | 56 m | 24 m wingspan | 6 x 2 blocks | KSC |
| JWST | 21 m (sunshield) | 14 m | 2 x 1 blocks | JWST Docs |
| Voyager | 3.7 m (bus) | 12 m (antenna) | -- | JPL |

At 1:1 scale, Saturn V would be 110 blocks tall. Use NASA 3D Resources (see Section 3) to extract exact proportions from official models.

---

### 2.4 Atmosphere Simulation with Datapacks

Mars atmosphere (thin, dusty) and lunar conditions (vacuum) can be simulated with custom datapacks:

```json
// data/mars_atmo/dimension_type/mars.json
{
  "ultrawarm": false,
  "natural": false,
  "piglin_safe": false,
  "respawn_anchor_works": false,
  "bed_works": false,
  "has_raids": false,
  "has_skylight": true,
  "has_ceiling": false,
  "coordinate_scale": 1.0,
  "ambient_light": 0.3,
  "logical_height": 384,
  "infiniburn": "#minecraft:infiniburn_overworld",
  "min_y": -64,
  "height": 384,
  "monster_spawn_light_level": 0,
  "monster_spawn_block_light_limit": 0
}
```

Particle effects for dust storms can use the `minecraft:dust` particle type with custom orange-red colors configured through datapacks.

---

## 3. Blender 3D Visualization

### 3.1 Import NASA 3D Spacecraft Models

**Data source:** https://science.nasa.gov/3d-resources/ and https://github.com/nasa/NASA-3D-Resources

**Available formats:** glTF, OBJ, STL, FBX, Collada (DAE). Most models are directly importable into Blender.

**Available models include:** ISS, JWST, Hubble, Curiosity, Perseverance, Voyager, Cassini, Juno, New Horizons, Parker Solar Probe, Mars Reconnaissance Orbiter, Apollo CSM/LM, Saturn V, Space Shuttle, and many more.

```python
# Blender Python script (run in Blender's text editor)
import bpy

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Import glTF model (preferred format for Blender)
bpy.ops.import_scene.gltf(filepath='/path/to/JWST.glb')

# Or import OBJ
bpy.ops.wm.obj_import(filepath='/path/to/ISS.obj')

# Scale to consistent units (NASA models vary in scale)
obj = bpy.context.selected_objects[0]
obj.scale = (0.001, 0.001, 0.001)  # If model is in mm, convert to m

# Add space environment
world = bpy.data.worlds['World']
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs[0].default_value = (0, 0, 0, 1)  # Black space background
bg.inputs[1].default_value = 0.0  # No ambient light
```

---

### 3.2 Orbital Animations from Ephemeris Data

```python
# Blender Python script using astropy + SpiceyPy for real trajectories
import bpy
import numpy as np
import sys

# Ensure your Python packages are available to Blender
# You may need: import subprocess; subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'spiceypy', 'astropy'])
import spiceypy as spice

# Load SPICE kernels
spice.furnsh('/path/to/naif0012.tls')
spice.furnsh('/path/to/de440.bsp')

# Generate positions for inner solar system over one year
et_start = spice.str2et('2025-01-01 00:00:00 UTC')
et_end   = spice.str2et('2026-01-01 00:00:00 UTC')
num_frames = 365  # One position per day

planets = {
    'Mercury': ('199', (0.7, 0.7, 0.7, 1), 0.05),
    'Venus':   ('299', (0.9, 0.8, 0.5, 1), 0.08),
    'Earth':   ('399', (0.2, 0.5, 1.0, 1), 0.08),
    'Mars':    ('499', (0.8, 0.3, 0.2, 1), 0.06),
}

SCALE = 1e-8  # Convert km to Blender units

for name, (naif_id, color, size) in planets.items():
    # Create sphere for planet
    bpy.ops.mesh.primitive_uv_sphere_add(radius=size, location=(0, 0, 0))
    planet_obj = bpy.context.active_object
    planet_obj.name = name

    # Create material
    mat = bpy.data.materials.new(name=f'{name}_mat')
    mat.use_nodes = True
    mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = color
    mat.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value = color
    mat.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.5
    planet_obj.data.materials.append(mat)

    # Keyframe positions
    for frame_num in range(num_frames):
        et = et_start + (et_end - et_start) * frame_num / num_frames
        pos, _ = spice.spkpos(naif_id, et, 'ECLIPJ2000', 'NONE', '10')

        planet_obj.location = (pos[0] * SCALE, pos[1] * SCALE, pos[2] * SCALE)
        planet_obj.keyframe_insert(data_path='location', frame=frame_num + 1)

# Add Sun at origin
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, location=(0, 0, 0))
sun_obj = bpy.context.active_object
sun_obj.name = 'Sun'
sun_mat = bpy.data.materials.new(name='Sun_mat')
sun_mat.use_nodes = True
sun_mat.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value = (1, 0.9, 0.5, 1)
sun_mat.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 10
sun_obj.data.materials.append(sun_mat)

# Set animation range
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = num_frames

spice.kclear()
```

---

### 3.3 Planetary Surface from PDS Texture Maps

```python
# Blender script: Create Mars globe with real texture data
import bpy
import math

# Download Mars texture maps from:
# https://astrogeology.usgs.gov/search/map/mars_viking_mdim21_global_mosaic_232m
# Available as GeoTIFF or PNG

# Create sphere
bpy.ops.mesh.primitive_uv_sphere_add(
    radius=1.0,
    segments=128,
    ring_count=64,
    location=(0, 0, 0)
)
mars = bpy.context.active_object
mars.name = 'Mars'

# Apply smooth shading
bpy.ops.object.shade_smooth()

# Create material with texture
mat = bpy.data.materials.new(name='Mars_surface')
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links

# Clear default nodes
for node in nodes:
    nodes.remove(node)

# Add nodes
output = nodes.new('ShaderNodeOutputMaterial')
bsdf = nodes.new('ShaderNodeBsdfPrincipled')
tex_image = nodes.new('ShaderNodeTexImage')
tex_coord = nodes.new('ShaderNodeTexCoord')
mapping = nodes.new('ShaderNodeMapping')

# Load Mars color texture
tex_image.image = bpy.data.images.load('/path/to/mars_color_mosaic.png')

# Connect nodes
links.new(tex_coord.outputs['UV'], mapping.inputs['Vector'])
links.new(mapping.outputs['Vector'], tex_image.inputs['Vector'])
links.new(tex_image.outputs['Color'], bsdf.inputs['Base Color'])
links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

mars.data.materials.append(mat)
```

---

### 3.4 Asteroid Shape Models from PDS

**Data source:** https://sbn.psi.edu/pds/shape-models/

Shape models come in ICQ (implicitly connected quadrilateral) or OBJ format. For Blender, vertex-facet format is easiest.

```python
# Convert PDS shape model to OBJ for Blender import
import numpy as np

def pds_shape_to_obj(shape_file, output_obj):
    """Convert PDS ICQ or vertex-facet shape model to OBJ format."""
    with open(shape_file, 'r') as f:
        lines = f.readlines()

    # First line: num_vertices num_faces
    header = lines[0].strip().split()
    n_vertices = int(header[0])
    n_faces = int(header[1])

    vertices = []
    faces = []

    # Read vertices
    for i in range(1, n_vertices + 1):
        parts = lines[i].strip().split()
        vertices.append((float(parts[0]), float(parts[1]), float(parts[2])))

    # Read faces (1-indexed in PDS, same as OBJ)
    for i in range(n_vertices + 1, n_vertices + 1 + n_faces):
        parts = lines[i].strip().split()
        # PDS shape files typically have 3 vertices per face
        num_verts = int(parts[0])
        face_verts = [int(parts[j]) for j in range(1, num_verts + 1)]
        faces.append(face_verts)

    # Write OBJ
    with open(output_obj, 'w') as f:
        f.write(f"# PDS Shape Model: {n_vertices} vertices, {n_faces} faces\n")
        for v in vertices:
            f.write(f"v {v[0]} {v[1]} {v[2]}\n")
        for face in faces:
            f.write("f " + " ".join(str(v) for v in face) + "\n")

# Example: convert Bennu shape model
pds_shape_to_obj('bennu_shape_v20.tab', 'bennu.obj')

# Then in Blender:
# bpy.ops.wm.obj_import(filepath='bennu.obj')
```

**Available models:** Eros (multiple resolutions), Bennu (OSIRIS-REx), Itokawa (Hayabusa), Ida, Gaspra, Mathilde, Vesta, Phobos, Deimos, Hyperion, and hundreds of radar-derived asteroid shapes.

---

## 4. WebGL / GLSL Shaders

### 4.1 Planetary Atmosphere Shader

**Libraries:** Three.js (https://threejs.org)

```glsl
// atmosphere.frag -- Rayleigh scattering approximation
// Uses NASA atmospheric composition data for accurate scattering coefficients

uniform vec3 sunDirection;
uniform float atmosphereRadius;    // km, from NASA planetary fact sheets
uniform float planetRadius;        // km
uniform vec3 rayleighCoeff;        // Scattering coefficients per wavelength
uniform float scaleHeight;         // km, atmospheric scale height

// Earth values (from NASA Planetary Fact Sheet):
// atmosphereRadius = 6471.0 (Earth radius + 100km)
// planetRadius = 6371.0
// rayleighCoeff = vec3(5.5e-6, 13.0e-6, 22.4e-6) // RGB
// scaleHeight = 8.5

// Mars values:
// atmosphereRadius = 3489.5 (Mars radius + 100km)
// planetRadius = 3389.5
// rayleighCoeff = vec3(19.918e-6, 13.57e-6, 5.75e-6) // Dusty red-shifted
// scaleHeight = 11.1

varying vec3 vWorldPosition;
varying vec3 vNormal;

float rayleighPhase(float cosAngle) {
    return 0.75 * (1.0 + cosAngle * cosAngle);
}

void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float cosAngle = dot(viewDir, sunDirection);

    // Optical depth approximation
    float altitude = length(vWorldPosition) - planetRadius;
    float density = exp(-altitude / scaleHeight);

    // Rayleigh scattering color
    vec3 scatter = rayleighCoeff * rayleighPhase(cosAngle) * density;

    // Limb darkening
    float limb = dot(vNormal, viewDir);
    float atmosphere = pow(1.0 - limb, 3.0) * 2.0;

    gl_FragColor = vec4(scatter * atmosphere, atmosphere * 0.5);
}
```

---

### 4.2 Real-Time Orbital Visualization with TLE Data

**Packages:** `npm install satellite.js three cesium`

**TLE data source:** CelesTrak (https://celestrak.org/NORAD/elements/) -- no auth required, updated daily.

```typescript
// satellite-tracker.ts
import * as satellite from 'satellite.js';
import * as THREE from 'three';

interface SatPosition {
  lat: number;
  lon: number;
  alt: number;  // km
}

// Parse TLE data (from CelesTrak bulk download)
function parseTLEs(tleText: string): satellite.TleSatRec[] {
  const lines = tleText.trim().split('\n');
  const sats: satellite.TleSatRec[] = [];

  for (let i = 0; i < lines.length; i += 3) {
    const name = lines[i].trim();
    const tle1 = lines[i + 1].trim();
    const tle2 = lines[i + 2].trim();
    const satrec = satellite.twoline2satrec(tle1, tle2);
    sats.push(satrec);
  }
  return sats;
}

// Propagate satellite position at given time
function getSatPosition(satrec: satellite.TleSatRec, date: Date): SatPosition | null {
  const posVel = satellite.propagate(satrec, date);
  if (typeof posVel.position === 'boolean') return null;

  const gmst = satellite.gstime(date);
  const geo = satellite.eciToGeodetic(posVel.position, gmst);

  return {
    lat: satellite.degreesLat(geo.latitude),
    lon: satellite.degreesLong(geo.longitude),
    alt: geo.height  // km above Earth surface
  };
}

// Convert lat/lon/alt to Three.js 3D position
function geoTo3D(lat: number, lon: number, alt: number, earthRadius: number = 6371): THREE.Vector3 {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  const r = earthRadius + alt;

  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// Fetch TLEs from CelesTrak
async function fetchTLEs(group: string = 'stations'): Promise<string> {
  // Groups: stations, visual, active, weather, science, gps-ops, etc.
  const response = await fetch(
    `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`
  );
  return response.text();
}

// Animation loop
function animate(sats: satellite.TleSatRec[], scene: THREE.Scene) {
  const now = new Date();
  sats.forEach((satrec, i) => {
    const pos = getSatPosition(satrec, now);
    if (pos) {
      const point = scene.getObjectByName(`sat_${i}`);
      if (point) {
        const vec = geoTo3D(pos.lat, pos.lon, pos.alt);
        point.position.copy(vec.multiplyScalar(0.001)); // Scale down
      }
    }
  });
  requestAnimationFrame(() => animate(sats, scene));
}
```

---

### 4.3 Star Field from Hipparcos/Tycho Catalogs

**Data source:** Hipparcos catalog (~118,000 stars), Tycho-2 (~2.5 million stars)
- https://heasarc.gsfc.nasa.gov/W3Browse/all/hipparcos.html
- https://www.cosmos.esa.int/web/hipparcos/tycho-2

```glsl
// starfield.vert -- Vertex shader for catalog stars
attribute float magnitude;  // Visual magnitude from catalog
attribute vec3 color;       // B-V color index mapped to RGB
attribute vec3 position;    // RA/Dec converted to unit sphere coords

uniform float fovScale;     // Adjust point size for zoom level
uniform float magnitudeLimit;

varying vec3 vColor;
varying float vBrightness;

void main() {
    // Brighter stars = lower magnitude numbers
    // Hipparcos: -1.44 (Sirius) to ~12.0
    vBrightness = pow(10.0, -0.4 * (magnitude - magnitudeLimit));
    vColor = color;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position * 1000.0, 1.0);

    // Point size inversely proportional to magnitude
    gl_PointSize = max(1.0, 6.0 - magnitude) * fovScale;
}
```

```typescript
// star-catalog-loader.ts -- Parse Hipparcos catalog for WebGL
interface Star {
  ra: number;      // Right ascension (degrees)
  dec: number;     // Declination (degrees)
  vmag: number;    // Visual magnitude
  bv: number;      // B-V color index
}

function bvToRGB(bv: number): [number, number, number] {
  // Convert B-V color index to approximate RGB
  // B-V ranges from -0.4 (hot blue) to 2.0 (cool red)
  let r: number, g: number, b: number;
  const t = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));

  // Blackbody approximation
  if (t >= 6600) {
    r = 1.0;
    g = Math.min(1, Math.max(0, 0.39 * Math.log(t / 100 - 60) - 0.634));
    b = Math.min(1, Math.max(0, 0.543 * Math.log(t / 100 - 60) - 1.185));
  } else {
    r = Math.min(1, Math.max(0, 0.329 * Math.log(t / 100) - 0.130));
    g = Math.min(1, Math.max(0, 0.390 * Math.log(t / 100) - 0.631));
    b = 1.0;
  }
  return [r, g, b];
}

function raDec3D(ra: number, dec: number): [number, number, number] {
  const raRad = ra * Math.PI / 180;
  const decRad = dec * Math.PI / 180;
  return [
    Math.cos(decRad) * Math.cos(raRad),
    Math.cos(decRad) * Math.sin(raRad),
    Math.sin(decRad)
  ];
}
```

**Data sizes:** Hipparcos main catalog: ~50 MB (ASCII). Tycho-2: ~500 MB. For WebGL, pre-filter to magnitude < 8 for ~100K stars (~3 MB compressed JSON).

---

### 4.4 CME Propagation Animation (DONKI Data)

```typescript
// cme-viz.ts -- Fetch and animate CME propagation from DONKI
const NASA_API_KEY = 'your_api_key_here';  // Get from api.nasa.gov

interface CMEEvent {
  activityID: string;
  startTime: string;
  sourceLocation: string;
  speed: number;        // km/s
  halfAngle: number;    // degrees
  latitude: number;
  longitude: number;
}

async function fetchRecentCMEs(days: number = 30): Promise<CMEEvent[]> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const response = await fetch(
    `https://api.nasa.gov/DONKI/CME?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_API_KEY}`
  );
  const data = await response.json();

  return data.map((cme: any) => ({
    activityID: cme.activityID,
    startTime: cme.startTime,
    sourceLocation: cme.sourceLocation,
    speed: cme.cmeAnalyses?.[0]?.speed || 500,
    halfAngle: cme.cmeAnalyses?.[0]?.halfAngle || 45,
    latitude: cme.cmeAnalyses?.[0]?.latitude || 0,
    longitude: cme.cmeAnalyses?.[0]?.longitude || 0,
  }));
}

// In Three.js: render CME as expanding cone from Sun
function createCMECone(cme: CMEEvent, scene: THREE.Scene) {
  const halfAngleRad = cme.halfAngle * Math.PI / 180;

  // Expanding sphere section
  const geometry = new THREE.SphereGeometry(
    1, 32, 32,
    0, Math.PI * 2,
    0, halfAngleRad
  );

  const material = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  // Orient toward CME direction
  mesh.rotation.x = cme.latitude * Math.PI / 180;
  mesh.rotation.y = cme.longitude * Math.PI / 180;

  scene.add(mesh);
  return mesh;
}
```

---

## 5. Arduino / Raspberry Pi Hardware Projects

### 5.1 Real-Time ISS Tracker with Servos

**Hardware:** ESP32 (WiFi-capable), 2x servo motors (pan/tilt), OLED display (optional)

**Data source:** CelesTrak TLE or Open Notify API (http://api.open-notify.org/iss-now.json)

```cpp
// iss_tracker.ino -- ESP32 ISS Pointer
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <math.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";

// Observer location (set to your coordinates)
const double OBS_LAT = 47.6062;   // Seattle
const double OBS_LON = -122.3321;
const double OBS_ALT = 0.0;       // km above sea level

Servo panServo;   // Azimuth (0-360 mapped to 0-180)
Servo tiltServo;  // Elevation (0-90)

const int PAN_PIN = 13;
const int TILT_PIN = 14;

struct ISSPosition {
  double latitude;
  double longitude;
  double altitude;  // ~420 km
};

ISSPosition getISSPosition() {
  ISSPosition pos = {0, 0, 420};
  HTTPClient http;
  http.begin("http://api.open-notify.org/iss-now.json");
  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<512> doc;
    deserializeJson(doc, payload);

    pos.latitude = doc["iss_position"]["latitude"].as<double>();
    pos.longitude = doc["iss_position"]["longitude"].as<double>();
  }
  http.end();
  return pos;
}

void calculateAzEl(ISSPosition iss, double* az, double* el) {
  // Convert to radians
  double obsLatR = OBS_LAT * DEG_TO_RAD;
  double obsLonR = OBS_LON * DEG_TO_RAD;
  double issLatR = iss.latitude * DEG_TO_RAD;
  double issLonR = iss.longitude * DEG_TO_RAD;

  double dLon = issLonR - obsLonR;

  // Azimuth calculation
  double y = sin(dLon) * cos(issLatR);
  double x = cos(obsLatR) * sin(issLatR) - sin(obsLatR) * cos(issLatR) * cos(dLon);
  *az = atan2(y, x) * RAD_TO_DEG;
  if (*az < 0) *az += 360.0;

  // Simplified elevation (ignoring Earth curvature for display purposes)
  double dist = sqrt(pow(iss.altitude, 2) +
    pow(6371.0 * acos(sin(obsLatR) * sin(issLatR) +
    cos(obsLatR) * cos(issLatR) * cos(dLon)), 2));
  *el = atan2(iss.altitude, dist) * RAD_TO_DEG;
  *el = constrain(*el, 0, 90);
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  panServo.attach(PAN_PIN);
  tiltServo.attach(TILT_PIN);
}

void loop() {
  ISSPosition iss = getISSPosition();

  double az, el;
  calculateAzEl(iss, &az, &el);

  // Map azimuth (0-360) to servo range (0-180)
  int panAngle = map((int)az, 0, 360, 0, 180);
  int tiltAngle = map((int)el, 0, 90, 0, 90);

  panServo.write(panAngle);
  tiltServo.write(tiltAngle);

  Serial.printf("ISS: %.2f, %.2f | Az: %.1f El: %.1f\n",
    iss.latitude, iss.longitude, az, el);

  delay(5000);  // Update every 5 seconds
}
```

**Libraries to install in Arduino IDE:** ArduinoJson, ESP32Servo

---

### 5.2 Space Weather LED Display

**Hardware:** ESP32 + WS2812B LED matrix (8x32 or similar)

```cpp
// space_weather_display.ino
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <FastLED.h>

#define NUM_LEDS 256  // 8x32 matrix
#define DATA_PIN 5
CRGB leds[NUM_LEDS];

const char* NASA_API_KEY = "YOUR_API_KEY";

struct SpaceWeather {
  String kpIndex;      // Geomagnetic storm index (0-9)
  int gstCount;        // Recent geomagnetic storms
  int cmeCount;        // Recent CMEs
  String latestFlare;  // Latest solar flare class
};

SpaceWeather getSpaceWeather() {
  SpaceWeather sw = {"0", 0, 0, "none"};
  HTTPClient http;

  // Fetch geomagnetic storms (last 7 days)
  String endDate = "2025-03-29";  // Use current date
  String startDate = "2025-03-22";

  String url = "https://api.nasa.gov/DONKI/GST?startDate=" + startDate +
               "&endDate=" + endDate + "&api_key=" + String(NASA_API_KEY);
  http.begin(url);
  int code = http.GET();

  if (code == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(4096);
    deserializeJson(doc, payload);
    sw.gstCount = doc.size();
    if (sw.gstCount > 0) {
      sw.kpIndex = doc[0]["allKpIndex"][0]["kpIndex"].as<String>();
    }
  }
  http.end();

  // Fetch solar flares
  url = "https://api.nasa.gov/DONKI/FLR?startDate=" + startDate +
        "&endDate=" + endDate + "&api_key=" + String(NASA_API_KEY);
  http.begin(url);
  code = http.GET();

  if (code == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(8192);
    deserializeJson(doc, payload);
    int n = doc.size();
    if (n > 0) {
      sw.latestFlare = doc[n - 1]["classType"].as<String>();
    }
  }
  http.end();
  return sw;
}

CRGB kpToColor(int kp) {
  // Kp index color scale (matches NOAA standard)
  if (kp <= 3) return CRGB::Green;      // Quiet
  if (kp == 4) return CRGB::Yellow;     // Unsettled
  if (kp == 5) return CRGB::Orange;     // Minor storm (G1)
  if (kp == 6) return CRGB::OrangeRed;  // Moderate storm (G2)
  if (kp == 7) return CRGB(255, 50, 0); // Strong storm (G3)
  if (kp == 8) return CRGB::Red;        // Severe storm (G4)
  return CRGB(255, 0, 100);             // Extreme storm (G5)
}

void setup() {
  Serial.begin(115200);
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(50);
  WiFi.begin("SSID", "PASSWORD");
  while (WiFi.status() != WL_CONNECTED) delay(500);
}

void loop() {
  SpaceWeather sw = getSpaceWeather();
  int kp = sw.kpIndex.toInt();

  // Fill matrix with Kp-based color
  fill_solid(leds, NUM_LEDS, kpToColor(kp));

  // Pulse effect for active storms
  if (kp >= 5) {
    uint8_t pulse = beatsin8(30, 100, 255);
    FastLED.setBrightness(pulse);
  }

  FastLED.show();
  delay(60000);  // Update every minute
}
```

---

### 5.3 OpenMCT Telemetry Dashboard on Raspberry Pi

See Section 9 for full OpenMCT setup. For Raspberry Pi specifically:

```bash
# Raspberry Pi setup
sudo apt update && sudo apt install -y nodejs npm
git clone https://github.com/nasa/openmct.git
cd openmct
npm install
npm start
# Dashboard available at http://localhost:8080
```

---

## 6. TypeScript / Web Applications

### 6.1 NASA Open API Client

**Packages:** `npm install node-fetch` (or use browser fetch)

```typescript
// nasa-api-client.ts
const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const BASE_URL = 'https://api.nasa.gov';

interface APODResponse {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: 'image' | 'video';
  copyright?: string;
}

interface MarsPhoto {
  id: number;
  sol: number;
  camera: { name: string; full_name: string };
  img_src: string;
  earth_date: string;
  rover: { name: string; status: string };
}

interface NearEarthObject {
  id: string;
  name: string;
  estimated_diameter: {
    meters: { estimated_diameter_min: number; estimated_diameter_max: number };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: Array<{
    close_approach_date: string;
    miss_distance: { kilometers: string };
    relative_velocity: { kilometers_per_second: string };
  }>;
}

class NasaAPI {
  private apiKey: string;

  constructor(apiKey: string = NASA_API_KEY) {
    this.apiKey = apiKey;
  }

  // Astronomy Picture of the Day
  async getAPOD(date?: string): Promise<APODResponse> {
    const params = new URLSearchParams({ api_key: this.apiKey });
    if (date) params.append('date', date);
    const resp = await fetch(`${BASE_URL}/planetary/apod?${params}`);
    return resp.json();
  }

  // Mars Rover Photos (Curiosity, Opportunity, Spirit, Perseverance)
  async getMarsPhotos(rover: string = 'curiosity', sol: number = 1000): Promise<MarsPhoto[]> {
    const resp = await fetch(
      `${BASE_URL}/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}&api_key=${this.apiKey}`
    );
    const data = await resp.json();
    return data.photos;
  }

  // Near Earth Objects (asteroids)
  async getNEOs(startDate: string, endDate: string): Promise<NearEarthObject[]> {
    const resp = await fetch(
      `${BASE_URL}/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${this.apiKey}`
    );
    const data = await resp.json();
    return Object.values(data.near_earth_objects).flat() as NearEarthObject[];
  }

  // EPIC (Earth Polychromatic Imaging Camera) -- full-disk Earth photos
  async getEPIC(date?: string): Promise<any[]> {
    const url = date
      ? `${BASE_URL}/EPIC/api/natural/date/${date}?api_key=${this.apiKey}`
      : `${BASE_URL}/EPIC/api/natural?api_key=${this.apiKey}`;
    const resp = await fetch(url);
    return resp.json();
  }

  // DONKI -- Space weather events
  async getCMEs(startDate: string, endDate: string): Promise<any[]> {
    const resp = await fetch(
      `${BASE_URL}/DONKI/CME?startDate=${startDate}&endDate=${endDate}&api_key=${this.apiKey}`
    );
    return resp.json();
  }

  // JPL Horizons (ephemeris)
  async getEphemeris(body: string, startDate: string, stopDate: string, step: string = '1d'): Promise<string> {
    const params = new URLSearchParams({
      format: 'json',
      COMMAND: `'${body}'`,
      EPHEM_TYPE: 'OBSERVER',
      CENTER: "'500'",
      START_TIME: `'${startDate}'`,
      STOP_TIME: `'${stopDate}'`,
      STEP_SIZE: `'${step}'`,
      QUANTITIES: "'1,9,20,23,24'",  // RA/Dec, distance, etc.
    });
    const resp = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${params}`);
    const data = await resp.json();
    return data.result;
  }
}

// Usage
const nasa = new NasaAPI();

// Get today's APOD
const apod = await nasa.getAPOD();
console.log(`${apod.title}: ${apod.url}`);

// Get Mars photos from Perseverance
const photos = await nasa.getMarsPhotos('perseverance', 100);
console.log(`${photos.length} photos from sol 100`);

// Get near-Earth asteroids this week
const neos = await nasa.getNEOs('2025-03-22', '2025-03-29');
const hazardous = neos.filter(n => n.is_potentially_hazardous_asteroid);
console.log(`${hazardous.length} potentially hazardous asteroids this week`);
```

**Rate limits:**
- `DEMO_KEY`: 30 requests/hour, 50 requests/day per IP
- Personal API key (free): 1,000 requests/hour
- Sign up at https://api.nasa.gov

---

### 6.2 CesiumJS 3D Globe with Satellite Tracking

**Packages:** `npm install cesium satellite.js`

```typescript
// cesium-sat-tracker.ts
import * as Cesium from 'cesium';
import * as satellite from 'satellite.js';

// CesiumJS requires an ion access token (free tier available)
Cesium.Ion.defaultAccessToken = 'YOUR_CESIUM_ION_TOKEN';

const viewer = new Cesium.Viewer('cesiumContainer', {
  terrainProvider: await Cesium.createWorldTerrainAsync(),
  shouldAnimate: true,
});

// Fetch TLEs from CelesTrak
const tleResponse = await fetch(
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle'
);
const tleText = await tleResponse.text();
const tleLines = tleText.trim().split('\n');

// Parse and propagate each satellite
for (let i = 0; i < tleLines.length; i += 3) {
  const name = tleLines[i].trim();
  const tle1 = tleLines[i + 1].trim();
  const tle2 = tleLines[i + 2].trim();
  const satrec = satellite.twoline2satrec(tle1, tle2);

  // Generate CZML for Cesium animation
  const positions: number[] = [];
  const startTime = Cesium.JulianDate.now();

  for (let min = 0; min < 90; min++) {  // 90 minutes (one orbit)
    const date = new Date(Date.now() + min * 60000);
    const posVel = satellite.propagate(satrec, date);
    if (typeof posVel.position === 'boolean') continue;

    const gmst = satellite.gstime(date);
    const geo = satellite.eciToGeodetic(posVel.position, gmst);

    positions.push(
      Cesium.JulianDate.secondsDifference(
        Cesium.JulianDate.addSeconds(startTime, min * 60, new Cesium.JulianDate()),
        startTime
      )
    );
    positions.push(
      Cesium.Math.toDegrees(geo.longitude),
      Cesium.Math.toDegrees(geo.latitude),
      geo.height * 1000  // Cesium expects meters
    );
  }

  viewer.entities.add({
    name: name,
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({ start: startTime, stop: Cesium.JulianDate.addSeconds(startTime, 5400, new Cesium.JulianDate()) })
    ]),
    position: new Cesium.SampledPositionProperty(),
    point: { pixelSize: 5, color: Cesium.Color.YELLOW },
    path: { width: 1, material: Cesium.Color.YELLOW.withAlpha(0.5) },
    label: { text: name, font: '10px sans-serif', pixelOffset: new Cesium.Cartesian2(10, 0) },
  });
}
```

---

### 6.3 MAST Image Viewer

```typescript
// mast-viewer.ts -- Query and display JWST/Hubble images
const MAST_API = 'https://mast.stsci.edu/api/v0/invoke';

interface MASTObservation {
  obsid: string;
  target_name: string;
  instrument_name: string;
  filters: string;
  t_exptime: number;
  dataURL: string;
  jpegURL: string;
}

async function searchMAST(target: string, collection: string = 'JWST'): Promise<MASTObservation[]> {
  const request = {
    service: 'Mast.Caom.Filtered',
    format: 'json',
    params: {
      columns: 'obsid,target_name,instrument_name,filters,t_exptime,dataURL,jpegURL',
      filters: [
        { paramName: 'obs_collection', values: [collection] },
        { paramName: 'target_name', values: [target] },
        { paramName: 'dataproduct_type', values: ['image'] },
        { paramName: 'calib_level', values: ['3'] },
      ],
    },
  };

  const response = await fetch(MAST_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  return data.data;
}
```

---

## 7. Rust / High-Performance Computation

### 7.1 Orbital Mechanics with nyx-space

**Cargo.toml:**
```toml
[dependencies]
nyx-space = "2"     # High-fidelity astrodynamics
fitsio = "0.21"     # FITS file I/O
rust-spice = "0.7"  # NAIF SPICE bindings (optional)
nalgebra = "0.33"   # Linear algebra
hifitime = "4"      # Precision time handling (used by nyx)
```

```rust
// src/trajectory.rs -- Basic orbit propagation with nyx-space
use nyx::cosmic::{Bodies, Cosm, Orbit};
use nyx::dynamics::orbital::OrbitalDynamics;
use nyx::propagators::Propagator;
use nyx::time::{Epoch, Unit};

fn propagate_earth_orbit() -> Result<(), Box<dyn std::error::Error>> {
    // Load cosmic model (includes planetary ephemeris)
    let cosm = Cosm::de438();

    // Define an orbit: ISS-like LEO
    let epoch = Epoch::from_gregorian_utc(2025, 3, 15, 12, 0, 0, 0);
    let iss_orbit = Orbit::keplerian(
        6778.0,   // semi-major axis (km) -- ~400km altitude
        0.0001,   // eccentricity (nearly circular)
        51.6,     // inclination (degrees)
        0.0,      // RAAN (degrees)
        0.0,      // argument of periapsis (degrees)
        0.0,      // true anomaly (degrees)
        epoch,
        cosm.frame("EME2000"),  // Earth-centered inertial frame
    );

    println!("Initial orbit: {}", iss_orbit);
    println!("Period: {:.2} min", iss_orbit.period().in_unit(Unit::Minute));
    println!("Altitude: {:.2} km", iss_orbit.rmag() - 6371.0);

    // Set up dynamics (two-body + J2 perturbation)
    let dynamics = OrbitalDynamics::two_body();

    // Propagate for one orbital period
    let prop = Propagator::default(dynamics);
    let final_state = prop.with(iss_orbit)
        .for_duration(iss_orbit.period())?;

    println!("Final state: {}", final_state);
    Ok(())
}
```

**Performance note:** nyx-space uses multi-threaded propagation (uncommon in astrodynamics toolkits). It has been validated against GMAT and used operationally for NASA CAPSTONE and Firefly Blue Ghost 1 missions. Licensed under AGPLv3 for open-source use.

---

### 7.2 FITS File Processing

```rust
// src/fits_reader.rs -- Read astronomical FITS files efficiently
use fitsio::FitsFile;
use fitsio::images::{ImageDescription, ImageType};
use ndarray::Array2;

fn read_fits_image(path: &str) -> Result<Array2<f32>, Box<dyn std::error::Error>> {
    let mut fitsfile = FitsFile::open(path)?;

    // List HDUs
    for i in 0..fitsfile.num_hdus()? {
        let hdu = fitsfile.hdu(i)?;
        println!("HDU {}: {:?}", i, hdu.info);
    }

    // Read the science image (usually HDU 1 for JWST/Hubble)
    let hdu = fitsfile.hdu("SCI")?;

    // Read image dimensions from header
    let naxis1: i64 = hdu.read_key(&mut fitsfile, "NAXIS1")?;
    let naxis2: i64 = hdu.read_key(&mut fitsfile, "NAXIS2")?;

    // Read all pixel data as f32
    let data: Vec<f32> = hdu.read_image(&mut fitsfile)?;

    // Reshape into 2D array
    let image = Array2::from_shape_vec(
        (naxis2 as usize, naxis1 as usize),
        data,
    )?;

    println!("Image shape: {:?}", image.shape());
    println!("Value range: {:.4} to {:.4}",
        image.iter().copied().reduce(f32::min).unwrap(),
        image.iter().copied().reduce(f32::max).unwrap());

    Ok(image)
}
```

---

### 7.3 SPICE Kernel Loading

```rust
// src/spice_ops.rs -- Load SPICE kernels and compute positions
use spice;

fn compute_mars_position() {
    // Load kernels
    spice::furnsh("data/kernels/naif0012.tls");   // Leap seconds
    spice::furnsh("data/kernels/de440.bsp");       // Planetary ephemeris
    spice::furnsh("data/kernels/pck00011.tpc");    // Planetary constants

    // Convert time string to ephemeris time
    let et = spice::str2et("2025-07-04 12:00:00 UTC");

    // Get Mars position relative to Earth
    let (state, _lt) = spice::spkezr("MARS", et, "J2000", "LT+S", "EARTH");

    let pos = &state[0..3];  // km
    let vel = &state[3..6];  // km/s

    let distance = (pos[0].powi(2) + pos[1].powi(2) + pos[2].powi(2)).sqrt();
    println!("Mars distance from Earth: {:.0} km ({:.4} AU)",
        distance, distance / 149_597_870.7);

    let speed = (vel[0].powi(2) + vel[1].powi(2) + vel[2].powi(2)).sqrt();
    println!("Relative velocity: {:.2} km/s", speed);

    spice::kclear();
}
```

**Build note:** `rust-spice` downloads and links CSPICE automatically. CSPICE is not thread-safe internally -- `rust-spice` provides a `lock` feature for thread-safe access via mutex.

---

### 7.4 PDS4 XML Label Parsing

```rust
// src/pds4_reader.rs -- Parse PDS4 XML product labels
use quick_xml::events::Event;
use quick_xml::reader::Reader;
use std::fs;

struct PDS4Product {
    logical_identifier: String,
    title: String,
    description: String,
    file_name: String,
    file_size: u64,
    axes: Vec<(String, u32)>,  // (axis_name, sequence_number)
}

fn parse_pds4_label(xml_path: &str) -> Result<PDS4Product, Box<dyn std::error::Error>> {
    let xml = fs::read_to_string(xml_path)?;
    let mut reader = Reader::from_str(&xml);
    reader.config_mut().trim_text(true);

    let mut product = PDS4Product {
        logical_identifier: String::new(),
        title: String::new(),
        description: String::new(),
        file_name: String::new(),
        file_size: 0,
        axes: Vec::new(),
    };

    let mut current_tag = String::new();
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf)? {
            Event::Start(e) => {
                current_tag = String::from_utf8_lossy(e.name().as_ref()).to_string();
            }
            Event::Text(e) => {
                let text = e.unescape()?.to_string();
                match current_tag.as_str() {
                    "logical_identifier" => product.logical_identifier = text,
                    "title" => product.title = text,
                    "description" => product.description = text,
                    "file_name" => product.file_name = text,
                    "file_size" => product.file_size = text.parse().unwrap_or(0),
                    _ => {}
                }
            }
            Event::Eof => break,
            _ => {}
        }
        buf.clear();
    }

    Ok(product)
}
```

---

## 8. GMAT (General Mission Analysis Tool)

### 8.1 Installation and Setup

**Download:** https://sourceforge.net/projects/gmat/ (latest: R2025a)

GMAT provides both a GUI and a MATLAB-like scripting language. All examples below use the script interface.

### 8.2 Basic Earth Orbit Simulation

```matlab
% GMAT script: basic_orbit.script
% Propagate ISS-like orbit for 1 day

Create Spacecraft ISS;
ISS.DateFormat = UTCGregorian;
ISS.Epoch = '01 Mar 2025 12:00:00.000';
ISS.CoordinateSystem = EarthMJ2000Eq;
ISS.SMA = 6778.14;          % Semi-major axis (km)
ISS.ECC = 0.0001;           % Eccentricity
ISS.INC = 51.6;             % Inclination (deg)
ISS.RAAN = 0.0;             % Right ascension of ascending node
ISS.AOP = 0.0;              % Argument of perigee
ISS.TA = 0.0;               % True anomaly

Create ForceModel FM;
FM.CentralBody = Earth;
FM.PrimaryBodies = {Earth};
FM.GravityField.Earth.Degree = 20;
FM.GravityField.Earth.Order = 20;
FM.Drag.AtmosphereModel = JacchiaRoberts;
FM.SRP = On;

Create Propagator Prop;
Prop.FM = FM;
Prop.Type = RungeKutta89;
Prop.InitialStepSize = 60;
Prop.MaxStepSize = 300;

Create OrbitView View;
View.Add = {ISS, Earth};
View.ViewPointVector = [0 0 30000];

BeginMissionSequence;
Propagate Prop(ISS) {ISS.ElapsedDays = 1.0};
```

### 8.3 Apollo Trans-Lunar Injection

```matlab
% GMAT script: apollo_tli.script
% Simulate Apollo-style trans-lunar injection

Create Spacecraft Apollo;
Apollo.DateFormat = UTCGregorian;
Apollo.Epoch = '16 Jul 1969 16:22:13.000';  % Post-TLI
Apollo.CoordinateSystem = EarthMJ2000Eq;
Apollo.SMA = 191206.0;      % Post-TLI orbit
Apollo.ECC = 0.9673;
Apollo.INC = 31.383;
Apollo.RAAN = -8.579;
Apollo.AOP = 0.0;
Apollo.TA = 0.0;

Create CelestialBody Moon;
Create ForceModel EarthMoonFM;
EarthMoonFM.CentralBody = Earth;
EarthMoonFM.PointMasses = {Earth, Moon, Sun};

Create Propagator LunarProp;
LunarProp.FM = EarthMoonFM;
LunarProp.Type = RungeKutta89;

Create OrbitView LunarView;
LunarView.Add = {Apollo, Earth, Moon};
LunarView.CoordinateSystem = EarthMJ2000Eq;
LunarView.ViewPointVector = [0 0 600000];

BeginMissionSequence;
% Propagate until Moon SOI (roughly)
Propagate LunarProp(Apollo) {Apollo.Earth.RMAG = 326000, Apollo.ElapsedDays = 4.0};
```

### 8.4 Mars Transfer Orbit

```matlab
% GMAT script: mars_transfer.script
% Earth-Mars Hohmann-like transfer

Create Spacecraft MarsProbe;
MarsProbe.DateFormat = UTCGregorian;
MarsProbe.Epoch = '01 Sep 2026 00:00:00.000';
MarsProbe.CoordinateSystem = SunMJ2000Eq;  % Heliocentric
MarsProbe.SMA = 149598023;  % 1 AU in km (Earth orbit)
MarsProbe.ECC = 0.0167;
MarsProbe.INC = 0.0;

Create ForceModel SolarFM;
SolarFM.CentralBody = Sun;
SolarFM.PointMasses = {Sun, Earth, Mars, Jupiter};

Create Propagator SolarProp;
SolarProp.FM = SolarFM;
SolarProp.Type = RungeKutta89;

Create ImpulsiveBurn TMI;  % Trans-Mars injection
TMI.CoordinateSystem = SunMJ2000Eq;
TMI.Element1 = 2.94;       % Delta-V in km/s (approximate Hohmann)

BeginMissionSequence;
Maneuver TMI(MarsProbe);
% Propagate for ~9 months (typical Hohmann transfer time)
Propagate SolarProp(MarsProbe) {MarsProbe.ElapsedDays = 259};
```

**GMAT data inputs:**
- Planetary ephemeris: Uses JPL DE405/DE421 (bundled with GMAT)
- Atmospheric models: JacchiaRoberts, MSISE90 (bundled)
- Gravity models: EGM96 (Earth), LP165P (Moon), MGS95J (Mars) (bundled)
- SPICE kernels: Can load via `GMAT.Kernel` configuration

---

## 9. OpenMCT (Telemetry Dashboard)

### 9.1 Local Setup

```bash
# Clone and install
git clone https://github.com/nasa/openmct.git
cd openmct
npm install
npm start
# Open http://localhost:8080

# For the guided tutorial (recommended):
git clone https://github.com/nasa/openmct-tutorial.git
cd openmct-tutorial
npm install
npm start
```

### 9.2 Custom Telemetry Plugin -- NASA Data Feed

```javascript
// nasa-telemetry-plugin.js
// Custom OpenMCT plugin for NASA real-time data

function NASATelemetryPlugin() {
  return function install(openmct) {

    // Define the root object (spacecraft model)
    const rootKey = { namespace: 'nasa', key: 'spacecraft' };

    openmct.objects.addRoot(rootKey);

    openmct.objects.addProvider('nasa', {
      get: function (identifier) {
        if (identifier.key === 'spacecraft') {
          return Promise.resolve({
            identifier: identifier,
            name: 'NASA Live Data',
            type: 'folder',
            location: 'ROOT',
            composition: [
              { namespace: 'nasa', key: 'iss-position' },
              { namespace: 'nasa', key: 'space-weather' },
              { namespace: 'nasa', key: 'mars-weather' },
            ]
          });
        }

        const telemetryPoints = {
          'iss-position': { name: 'ISS Position', type: 'telemetry.point' },
          'space-weather': { name: 'Space Weather (Kp)', type: 'telemetry.point' },
          'mars-weather': { name: 'Mars Weather', type: 'telemetry.point' },
        };

        if (telemetryPoints[identifier.key]) {
          return Promise.resolve({
            identifier: identifier,
            name: telemetryPoints[identifier.key].name,
            type: telemetryPoints[identifier.key].type,
            telemetry: {
              values: [
                { key: 'utc', source: 'timestamp', name: 'Timestamp', format: 'utc', hints: { domain: 1 } },
                { key: 'value', name: 'Value', hints: { range: 1 } },
              ]
            },
            location: 'nasa:spacecraft',
          });
        }
      }
    });

    // Telemetry provider -- fetches real data
    openmct.telemetry.addProvider({
      supportsRequest: function (domainObject) {
        return domainObject.identifier.namespace === 'nasa';
      },
      request: function (domainObject, options) {
        const key = domainObject.identifier.key;
        if (key === 'iss-position') {
          return fetch('http://api.open-notify.org/iss-now.json')
            .then(r => r.json())
            .then(data => [{
              timestamp: data.timestamp * 1000,
              value: parseFloat(data.iss_position.latitude),
            }]);
        }
        return Promise.resolve([]);
      },
      supportsSubscribe: function (domainObject) {
        return domainObject.identifier.namespace === 'nasa';
      },
      subscribe: function (domainObject, callback) {
        const key = domainObject.identifier.key;
        const interval = setInterval(() => {
          if (key === 'iss-position') {
            fetch('http://api.open-notify.org/iss-now.json')
              .then(r => r.json())
              .then(data => {
                callback({
                  timestamp: Date.now(),
                  value: parseFloat(data.iss_position.latitude),
                });
              });
          }
        }, 5000);  // Update every 5 seconds
        return function unsubscribe() { clearInterval(interval); };
      }
    });
  };
}

// Install the plugin
openmct.install(NASATelemetryPlugin());
```

### 9.3 Console Layout Configuration

OpenMCT supports custom layouts through its composition and layout APIs:

```javascript
// Create a mission control layout with multiple telemetry views
const layout = {
  name: 'Mission Control Console',
  type: 'layout',
  composition: [
    { namespace: 'nasa', key: 'iss-position' },
    { namespace: 'nasa', key: 'space-weather' },
  ],
  configuration: {
    items: [
      { identifier: { namespace: 'nasa', key: 'iss-position' }, x: 0, y: 0, width: 6, height: 4 },
      { identifier: { namespace: 'nasa', key: 'space-weather' }, x: 6, y: 0, width: 6, height: 4 },
    ]
  }
};
```

---

## 10. Cross-Platform Data Pipeline

### 10.1 Standard Data Flow

```
NASA API / PDS / NAIF
        |
        v
  [Download Layer]
  - REST API calls (JSON response)
  - FTP/HTTP bulk download (FITS, IMG, SPK)
  - Authenticated access (MAST, Space-Track)
        |
        v
  [Local Cache]
  ~/.nasa-data/
  ├── spice-kernels/     # SPK, CK, PCK, LSK files
  ├── fits/              # Hubble/JWST science images
  ├── pds/               # Mars terrain, asteroid shapes
  ├── tle/               # Satellite orbital elements
  ├── api-cache/         # JSON responses with TTL
  └── textures/          # Planetary surface maps
        |
        v
  [Format Conversion]
  - PDS IMG → GeoTIFF (via GDAL)
  - FITS → numpy array → PNG/EXR (via astropy)
  - SPK → position arrays (via SpiceyPy)
  - TLE → lat/lon/alt arrays (via satellite.js/sgp4)
  - HEALPix → Mollweide PNG (via healpy)
  - Shape model → OBJ/glTF (custom parser)
        |
        v
  [Simulation Input]
  - Python: numpy arrays, astropy objects
  - Minecraft: grayscale PNG heightmaps
  - Blender: keyframed positions, OBJ meshes, texture PNGs
  - WebGL: JSON arrays, typed arrays, texture URLs
  - Arduino: JSON fields, float arrays
  - Rust: ndarray, f64 vectors
  - GMAT: script parameters, kernel paths
```

### 10.2 File Format Conversion Chains

| Source Format | Intermediate | Target | Tool Chain |
|--------------|-------------|--------|------------|
| PDS IMG | GeoTIFF | numpy array | `gdal_translate` then `rasterio` |
| PDS IMG | GeoTIFF | Minecraft heightmap | `rasterio` + PIL → WorldPainter |
| PDS IMG | GeoTIFF | Blender mesh | `rasterio` → `bpy.ops.mesh` |
| FITS (image) | numpy array | PNG/WebGL texture | `astropy.io.fits` + matplotlib/PIL |
| FITS (table) | pandas DataFrame | JSON / CSV | `astropy.table.Table` |
| SPK (SPICE) | numpy array | Blender keyframes | SpiceyPy → bpy |
| SPK (SPICE) | JSON | WebGL animation | SpiceyPy → JSON export |
| TLE text | ECI vectors | lat/lon/alt JSON | satellite.js or sgp4 |
| HEALPix FITS | numpy array | Mollweide PNG | healpy → matplotlib |
| Shape model | OBJ | Blender mesh | Custom parser → bpy |
| Shape model | glTF | Three.js mesh | Custom parser or trimesh |
| GeoTIFF | 16-bit PNG | Minecraft world | PIL → WorldPainter |

### 10.3 Caching Strategy

```python
# cache_manager.py -- Local caching for NASA data
import os
import json
import time
import hashlib
from pathlib import Path

CACHE_DIR = Path.home() / '.nasa-data'

# TTL by data type (seconds)
CACHE_TTL = {
    'api-response': 3600,        # 1 hour for API JSON
    'tle': 86400,                # 1 day for TLEs (updated daily)
    'spice-kernel': float('inf'),# Permanent (versioned files)
    'fits': float('inf'),        # Permanent (archival data)
    'pds': float('inf'),         # Permanent (archival data)
    'texture': float('inf'),     # Permanent
}

def cache_path(data_type: str, key: str) -> Path:
    """Generate cache file path."""
    safe_key = hashlib.md5(key.encode()).hexdigest()
    dir_path = CACHE_DIR / data_type
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path / safe_key

def get_cached(data_type: str, key: str):
    """Retrieve from cache if not expired."""
    path = cache_path(data_type, key)
    meta_path = path.with_suffix('.meta')

    if not path.exists() or not meta_path.exists():
        return None

    with open(meta_path) as f:
        meta = json.load(f)

    ttl = CACHE_TTL.get(data_type, 3600)
    if time.time() - meta['timestamp'] > ttl:
        return None  # Expired

    if data_type == 'api-response':
        with open(path) as f:
            return json.load(f)
    else:
        return str(path)  # Return file path for binary data

def set_cached(data_type: str, key: str, data, binary: bool = False):
    """Store in cache."""
    path = cache_path(data_type, key)
    meta_path = path.with_suffix('.meta')

    if binary:
        with open(path, 'wb') as f:
            f.write(data)
    elif isinstance(data, (dict, list)):
        with open(path, 'w') as f:
            json.dump(data, f)
    else:
        with open(path, 'w') as f:
            f.write(str(data))

    with open(meta_path, 'w') as f:
        json.dump({'timestamp': time.time(), 'key': key, 'type': data_type}, f)
```

### 10.4 Offline Data Packages

For environments without internet (field research, classroom, Burning Man):

| Package | Contents | Approximate Size | Source |
|---------|----------|-----------------|--------|
| Basic Solar System | de440.bsp + naif0012.tls + pck00011.tpc | ~125 MB | NAIF |
| ISS TLE Archive | 1 year of TLEs | ~5 MB | CelesTrak |
| Mars Exploration | Gale Crater DTM + Jezero Crater DTM | ~2 GB | PDS |
| Moon Landing Sites | LOLA DEMs for Apollo sites | ~500 MB | USGS |
| Star Catalog | Hipparcos (mag < 8) | ~3 MB (JSON) | ESA/HEASARC |
| NASA APOD Archive | 1 year of daily images + metadata | ~2 GB | api.nasa.gov |
| Asteroid Shapes | Top 20 shape models (OBJ format) | ~50 MB | PDS SBN |
| Planetary Textures | Mars, Moon, Earth, Jupiter (4K) | ~200 MB | NASA SVS / USGS |

### 10.5 Bulk Download Script

```bash
#!/bin/bash
# download_nasa_data.sh -- Download essential offline data package

CACHE_DIR="$HOME/.nasa-data"
mkdir -p "$CACHE_DIR"/{spice-kernels,tle,textures,pds,fits}

echo "=== Downloading SPICE kernels ==="
cd "$CACHE_DIR/spice-kernels"
# Leap seconds kernel (~5 KB)
wget -nc https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls
# Planetary ephemeris (~120 MB)
wget -nc https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de440.bsp
# Planetary constants (~130 KB)
wget -nc https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc

echo "=== Downloading TLE data ==="
cd "$CACHE_DIR/tle"
wget -O stations.tle "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle"
wget -O active.tle "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
wget -O science.tle "https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=tle"

echo "=== Downloading planetary textures ==="
cd "$CACHE_DIR/textures"
# Mars color mosaic (232m resolution, ~2.8 GB full, smaller crops available)
echo "For Mars texture: visit https://astrogeology.usgs.gov/search/map/mars_viking_mdim21_global_mosaic_232m"
# Moon color shaded relief (388m, ~450 MB)
echo "For Moon texture: visit https://astrogeology.usgs.gov/search/map/moon_lro_lola_color_shaded_relief_388m"

echo "=== Done ==="
echo "Total estimated download: ~125 MB (kernels + TLEs)"
echo "Optional large files listed above for manual download"
```

---

## Appendix A: Package Summary by Platform

### Python
```
pip install astroquery astropy spiceypy poliastro sunpy healpy
pip install rasterio gdal numpy matplotlib scipy
pip install pds4_tools pvl
```

### npm (TypeScript/JavaScript)
```
npm install satellite.js three cesium
npm install @types/three  # TypeScript types
# ootk-core as modern typed alternative to satellite.js
```

### Cargo (Rust)
```toml
nyx-space = "2"           # Orbital mechanics
fitsio = "0.21"           # FITS file I/O
rust-spice = "0.7"        # SPICE toolkit bindings
nalgebra = "0.33"         # Linear algebra
hifitime = "4"            # Precision time
quick-xml = "0.36"        # PDS4 XML parsing
```

### Arduino Libraries (via Arduino IDE Library Manager)
```
ArduinoJson
ESP32Servo (or Servo for Arduino)
FastLED
WiFi (built-in for ESP32)
HTTPClient (built-in for ESP32)
```

### Desktop Tools
```
GMAT R2025a        -- https://sourceforge.net/projects/gmat/
Blender 4.x        -- https://www.blender.org/download/
WorldPainter       -- https://www.worldpainter.net/
Amulet Editor      -- https://www.amuletmc.com/
OpenMCT            -- https://github.com/nasa/openmct
```

---

## Appendix B: Data Size Reference

| Dataset | Size | Notes |
|---------|------|-------|
| de440.bsp (planetary ephemeris) | 120 MB | Covers 1550-2650 AD |
| Single JWST FITS image | 50 MB - 2 GB | Varies by instrument/mode |
| HiRISE DTM (single site) | 200 MB - 4 GB | 1 m/pixel resolution |
| LOLA global DEM (118m) | 3.5 GB | Entire lunar surface |
| Planck CMB full-sky map | 200 MB | Per component, Nside=2048 |
| Hipparcos catalog | 50 MB | 118,218 stars (ASCII) |
| Tycho-2 catalog | 500 MB | 2.5 million stars |
| Active satellite TLEs | 5 MB | ~10,000 objects |
| Full CelesTrak catalog | 50 MB | All tracked objects |
| NASA 3D model (single) | 1-50 MB | Per spacecraft (glTF/OBJ) |
| GMAT installation | 500 MB | Includes bundled data |
| Mars global color mosaic | 2.8 GB | Viking MDIM 232m |

---

## Appendix C: API Key and Authentication Reference

| Service | Auth Type | How to Get | Cost |
|---------|-----------|-----------|------|
| api.nasa.gov | API key in URL param | https://api.nasa.gov -- email registration | Free |
| MAST (STScI) | MAST token | https://auth.mast.stsci.edu -- web registration | Free |
| Space-Track.org | Username/password | https://www.space-track.org -- application form | Free (US/allied nations) |
| CelesTrak | None | Direct download | Free |
| NAIF (SPICE) | None | Direct FTP/HTTP download | Free |
| PDS (all nodes) | None | Direct download | Free |
| Cesium Ion | API token | https://ion.cesium.com -- web registration | Free tier (75K tiles/mo) |
| USGS Astrogeology | None | Direct download | Free |

---

## Appendix D: Usage Policies

All NASA data is in the **public domain** under NASA's open data policy. No license restrictions on use, modification, or redistribution.

Key policies to be aware of:
- **api.nasa.gov rate limits:** Exceeding limits returns HTTP 429. Use your own API key (not DEMO_KEY) for any real application.
- **MAST bulk downloads:** Large requests may be queued. Use cloud access (AWS S3) for TB-scale analysis.
- **Space-Track terms:** Data is free but redistribution of raw TLEs may have restrictions. CelesTrak provides the same data with fewer restrictions.
- **SPICE kernels:** No restrictions. NAIF encourages citation in publications.
- **PDS data:** Public domain. Citation of the original data providers is encouraged.
- **NASA imagery:** Public domain. Credit "NASA" or the specific mission/instrument. Some images from partner agencies (ESA, JAXA) may have separate terms.
- **NASA 3D models:** Public domain, free for any use including commercial.

---

*This guide covers practical integration pathways for 10 simulation platforms using data from 13+ NASA and affiliated data sources. All packages, endpoints, and data formats verified as of March 2025.*
