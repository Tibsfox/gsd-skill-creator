# Sensing the Forest

> **Domain:** PNW Forest Ecology
> **Module:** 7 -- Mesh Telemetry & Forest Monitoring
> **Through-line:** *The mycorrhizal network is the forest's own sensing system. Mesh telemetry is ours. Both map the same territory -- one evolved over millions of years, the other we built in decades.*

---

## Table of Contents

1. [Two Sensing Systems](#1-two-sensing-systems)
2. [Weather Stations and RAWS](#2-weather-stations-and-raws)
3. [Soil Moisture Networks](#3-soil-moisture-networks)
4. [Dendrometer Bands: Listening to Growth](#4-dendrometer-bands-listening-to-growth)
5. [Camera Traps](#5-camera-traps)
6. [Passive Acoustic Monitoring](#6-passive-acoustic-monitoring)
7. [Satellite Eyes: Landsat and Sentinel](#7-satellite-eyes-landsat-and-sentinel)
8. [LiDAR: The Forest in Three Dimensions](#8-lidar-the-forest-in-three-dimensions)
9. [IoT Sensor Networks](#9-iot-sensor-networks)
10. [The Digital Twin](#10-the-digital-twin)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Two Sensing Systems

The living forest has been sensing its own environment for 400 million years. The mycorrhizal network that connects tree roots through fungal hyphae is, in functional terms, a distributed sensor network: it detects nutrient gradients, water availability, chemical signals from stressed neighbors, and pathogen presence, and it routes resources accordingly. The network has no central processor. It operates through local interactions at each node (root-fungal interface) that produce system-level responses (carbon flow from resource-rich to resource-poor trees). It is self-healing, self-extending, and powered by solar energy captured by leaves and delivered as photosynthate to the fungal partners that maintain the network [1][2].

Human forest monitoring is the attempt to build a parallel sensing system. Where the mycorrhizal network uses fungal hyphae, we use sensor wires and radio waves. Where the network detects nutrients through chemical diffusion, we detect temperature through thermistors and moisture through capacitance probes. Where the network responds to stress signals through metabolic adjustment, we respond through management decisions informed by data. The parallel is structural: both are distributed, decentralized networks that map the same territory and respond to the same environmental variables [1][2][3].

The difference is timescale. The mycorrhizal network evolved its sensing capabilities over hundreds of millions of years of natural selection. Our sensor networks were developed in the last 50 years. The mycorrhizal network operates at the pace of biological processes -- hours to years. Our sensor networks operate at the pace of electronics -- milliseconds to minutes. The convergence of these two sensing systems -- biological and electronic -- in the same forest opens the possibility of understanding forest dynamics at timescales and spatial scales that neither system could achieve alone [1][2].

---

## 2. Weather Stations and RAWS

The backbone of forest weather monitoring is the RAWS network -- Remote Automated Weather Stations operated by federal and state agencies throughout the wildland fire protection system. RAWS stations record temperature, relative humidity, wind speed and direction, solar radiation, precipitation, and fuel moisture at intervals of 10 minutes to 1 hour. The data is transmitted via satellite (GOES) and made available through the Weather Information Management System (WIMS) and MesoWest aggregation platforms [4][5].

In the PNW, RAWS stations are concentrated in fire-prone areas: the eastern Cascades, the Rogue Valley, the Deschutes National Forest, and the Columbia Basin. Station density is sparser in the wet maritime forests west of the Cascades, where fire risk is historically lower. This distribution reflects the network's primary purpose -- fire weather forecasting -- rather than ecological monitoring, creating data gaps in precisely the forests where climate change is now creating new fire risk [4][5].

The MesoWest system, maintained by the University of Utah, aggregates data from over 40,000 surface weather stations across the United States, including RAWS, state DOT stations, university stations, and private networks. For any location in the PNW, MesoWest can provide current conditions from the nearest available station, typically within 10-30 km. This network provides the baseline environmental data against which all other forest monitoring is calibrated [5][6].

Limitations: weather stations measure conditions at their specific location (typically an open clearing at instrument height -- 2 meters for temperature, 6 meters for wind). Conditions within the forest canopy can differ dramatically from open-clearing measurements -- temperature 5-10 degrees cooler, humidity 20-40% higher, wind speed 80-95% lower. Translating station data to in-forest conditions requires models of canopy interception, shading, and wind attenuation that introduce uncertainty [4][5].

---

## 3. Soil Moisture Networks

Soil moisture is arguably the single most important variable for predicting forest stress, fire risk, and tree growth. The amount of water stored in the root zone determines whether trees can maintain transpiration and photosynthesis during the summer drought, whether seedlings survive their critical first year, and whether surface fuels are dry enough to carry fire [7][8].

Modern soil moisture sensors use capacitance or time-domain reflectometry (TDR) to measure the volumetric water content of the soil at specific depths. Multiple sensors placed at 10 cm, 30 cm, 60 cm, and 100 cm depths reveal the vertical profile of soil moisture -- information critical for understanding which root zones have access to water and when deep soil moisture begins to decline [7][8].

The USDA Natural Resources Conservation Service operates the SNOTEL (Snow Telemetry) and SCAN (Soil Climate Analysis Network) systems, which include soil moisture sensors at many PNW sites. SNOTEL stations, located primarily at high-elevation snow survey sites in the Cascades, measure snow water equivalent (SWE), soil moisture, and air temperature. SCAN stations, located at lower elevations, focus on soil moisture and temperature profiles. Together, these networks provide the data to assess how snowmelt timing affects soil moisture availability through the growing season [7][8][9].

Research networks add density. The H.J. Andrews Experimental Forest in the Oregon Cascades -- a Long-Term Ecological Research (LTER) site since 1980 -- maintains an intensive soil moisture monitoring network across a watershed gradient from 400 to 1,600 meters elevation. Decades of continuous data from the Andrews Forest have documented the relationship between snowpack decline, earlier soil moisture depletion, and Douglas fir growth reduction that is now appearing across the region [7][10].

---

## 4. Dendrometer Bands: Listening to Growth

A dendrometer is a precision instrument that measures the radial change in a tree's trunk diameter. Band dendrometers wrap around the trunk like a belt; point dendrometers use a fixed reference point and a displacement sensor against the bark. Both types measure changes at sub-millimeter resolution, recording the daily and seasonal rhythms of tree growth and water status [11][12].

The data from continuous dendrometers reveals the tree's daily pulse. During daylight: the tree transpires, losing water through its stomata. The trunk contracts as water is drawn from storage in the sapwood. During nighttime: transpiration ceases, the trunk rehydrates from soil moisture, and the tree expands. In spring and early summer, when soil moisture is abundant and photosynthesis is active, the nighttime expansion exceeds the daytime contraction -- the tree grows. In late summer, when soil moisture is depleted, the expansion fails to exceed contraction -- the tree shrinks. Growth ceases. The dendrometer records this transition precisely [11][12].

When connected to data loggers with wireless transmission (typically LoRaWAN or cellular), dendrometer networks provide real-time data on how individual trees are responding to weather events: rain causes immediate rehydration visible as a growth pulse; drought causes progressive shrinkage; heat waves accelerate contraction through increased transpiration. A network of dendrometers across a gradient of elevation, aspect, and soil type reveals which trees are stressed and which are thriving -- information that no satellite can provide [11][12].

Dendrometer data has direct applications in the climate-forest module (Module 06). The growth decline documented in Douglas fir across the western US was first detected through tree ring analysis -- and tree rings are simply the annual integral of the daily growth signal that dendrometers measure continuously. Dendrometers provide the temporal resolution to understand not just whether a tree grew less in a given year, but when it stopped growing, how quickly it recovered after rain events, and whether its growth pattern is tracking climate trends in real time [11][12].

---

## 5. Camera Traps

Camera traps -- motion-triggered cameras deployed in the field to photograph wildlife -- have revolutionized the study of forest mammals, providing data on species that are otherwise invisible to human observers. Modern camera traps use passive infrared (PIR) motion sensors to detect warm bodies passing within their field of view, triggering high-resolution color photographs or video, with timestamps, temperature readings, and lunar phase data [13][14].

The technology has matured dramatically in the last decade. Current-generation camera traps are weatherproof, battery-powered (lasting 3-12 months on alkaline batteries or indefinitely with solar panels), and equipped with infrared flash for nighttime photography without disturbing animals. They store thousands of images on SD cards or transmit via cellular network for near-real-time monitoring. Artificial intelligence algorithms trained on known species can automatically classify camera trap images, reducing the manual effort of reviewing millions of photographs [13][14].

In PNW forests, camera trap networks document:

- **Large carnivores:** Cougar (*Puma concolor*), black bear (*Ursus americanus*), coyote (*Canis latrans*), bobcat (*Lynx rufus*). Camera traps have documented the recovery of gray wolves (*Canis lupus*) in the Washington and Oregon Cascades, confirming pack territories in areas where wolves had been absent for 80+ years [13][14].

- **Ungulates:** Black-tailed deer (*Odocoileus hemionus columbianus*), Roosevelt elk (*Cervus canadensis roosevelti*), mountain goat (*Oreamnos americanus*). Population density estimates from camera trap networks are increasingly used to inform hunting regulations and habitat management [13][14].

- **Small mammals:** Northern flying squirrels (*Glaucomys sabrinus*), red-backed voles (*Myodes gapperi*), mountain beaver (*Aplodontia rufa*). These species are critical links in the mycorrhizal dispersal network -- flying squirrels and voles consume the underground fruiting bodies (truffles) of ectomycorrhizal fungi and disperse the spores in their feces [13][14][15].

- **Rare and elusive species:** Fisher (*Pekania pennanti*), Pacific marten (*Martes caurina*), wolverine (*Gulo gulo*). Camera trap documentation of these species in PNW forests has provided critical data for conservation planning and ESA listing decisions [13][14].

---

## 6. Passive Acoustic Monitoring

Passive acoustic monitoring (PAM) deploys microphone arrays in the forest to record the soundscape continuously. Unlike camera traps, which detect visual presence, PAM detects auditory presence -- identifying species by their vocalizations without requiring physical proximity or visual detection [16][17].

The technology: autonomous recording units (ARUs) -- weatherproof devices containing microphones, batteries, data storage, and programmable recording schedules -- are deployed at monitoring sites and record continuously or on scheduled intervals. Modern ARUs can record for weeks to months on battery power, storing compressed audio files on high-capacity SD cards. The recorded audio is analyzed using machine learning algorithms trained on reference libraries of known species vocalizations [16][17].

PAM is particularly valuable for monitoring:

- **Northern spotted owl** (*Strix occidentalis caurina*): The spotted owl's distinctive four-note call is readily detected by PAM systems, providing presence/absence data across large landscapes without the labor-intensive night surveys traditionally used to locate owl territories. PAM can monitor multiple sites simultaneously and detect owls that would be missed by human observers [16][17][18].

- **Marbled murrelet** (*Brachyramphus marmoratus*): Murrelets produce a distinctive "keer" call during their dawn and dusk flights between ocean feeding areas and inland nesting sites. PAM deployed in old-growth forests can detect murrelet presence and estimate activity levels, supporting habitat assessments for this threatened species [16][17].

- **Barred owl** (*Strix varia*): The invasive barred owl, which has expanded into the PNW from eastern North America and is displacing the native spotted owl, is readily detected by PAM. The ability to simultaneously monitor both species across large areas is critical for understanding the competitive dynamics between them [16][17][18].

- **Amphibians:** Pacific chorus frog (*Pseudacris regilla*), tailed frog (*Ascaphus truei*), and other anurans produce species-specific calls that PAM can detect, monitor, and quantify. Amphibian populations are sensitive indicators of stream water quality and forest health [16][17].

- **Soundscape ecology:** Beyond individual species detection, PAM data enables analysis of the entire soundscape -- the aggregate acoustic environment of the forest. Soundscape indices (acoustic diversity, acoustic evenness, biophonic index) can characterize habitat quality, detect disturbance, and track seasonal patterns across landscapes. A forest recovering from fire has a different soundscape than an intact old-growth forest, and PAM can quantify the difference [16][17].

---

## 7. Satellite Eyes: Landsat and Sentinel

Orbital remote sensing provides the landscape-scale perspective that ground-based sensors cannot. Two satellite families dominate forest monitoring in the PNW: Landsat (USGS/NASA) and Sentinel-2 (European Space Agency) [19][20].

**Landsat** has provided continuous multispectral imagery of the Earth's surface since 1972 -- the longest unbroken record of satellite Earth observation. Currently operating spacecraft (Landsat 8 and 9) provide 30-meter resolution imagery in multiple spectral bands (visible, near-infrared, shortwave infrared, thermal) with a 16-day revisit interval (8 days with both spacecraft). The Landsat archive contains over 50 years of calibrated imagery, enabling time-series analysis of forest change at 30-meter resolution from 1972 to the present [19].

**Sentinel-2** (launched 2015-2017) provides 10-meter resolution imagery in the visible and near-infrared bands (20-meter in SWIR, 60-meter in atmospheric correction bands) with a 5-day revisit interval. The higher spatial and temporal resolution compared to Landsat makes Sentinel-2 valuable for detecting fine-scale canopy changes and for monitoring rapidly evolving events like fires and insect outbreaks [20].

Key applications for PNW forest monitoring:

- **NDVI (Normalized Difference Vegetation Index):** The ratio of near-infrared to visible red reflectance, which correlates with photosynthetic activity and canopy "greenness." NDVI time series reveal forest health trends, detect drought stress (declining greenness in late summer), track post-fire recovery, and identify insect outbreaks (beetle-killed trees show rapid NDVI decline) [19][20].

- **Forest disturbance detection:** Algorithms like LandTrendr (Kennedy et al., developed at Oregon State University) analyze the full Landsat time series pixel by pixel to detect disturbance events (logging, fire, insect kill, windthrow) and characterize recovery trajectories. The Oregon Department of Forestry uses LandTrendr to monitor forest harvest compliance across the state [19][21].

- **Canopy cover mapping:** Multi-temporal satellite imagery combined with ground truth data enables mapping of canopy cover at landscape scales. The NLCD (National Land Cover Database) provides 30-meter resolution land cover maps for the entire US, updated approximately every 3-5 years, including forest canopy cover and forest type classification [19].

- **Fire perimeter mapping:** Satellite imagery (both Landsat/Sentinel and dedicated fire-monitoring satellites like MODIS and VIIRS) is used to map fire perimeters, estimate burn severity, and monitor post-fire recovery. The Monitoring Trends in Burn Severity (MTBS) project provides standardized burn severity maps for all large fires in the US since 1984 [19][20].

---

## 8. LiDAR: The Forest in Three Dimensions

LiDAR (Light Detection and Ranging) has transformed forest ecology by providing the first technology capable of mapping the three-dimensional structure of the forest canopy with sub-meter precision. An airborne LiDAR system emits laser pulses toward the ground from an aircraft and records the time of flight for each returning pulse. Because the laser beam penetrates through the canopy (reflecting off leaves, branches, and eventually the ground), a single flight produces millions to billions of point measurements that describe the complete three-dimensional structure of the forest [22][23].

The key derived products:

**Digital Terrain Model (DTM):** The bare-earth surface beneath the canopy, generated from the "last return" of each laser pulse (the ground reflection). DTM accuracy is typically 10-30 cm vertical in forested terrain -- far better than any other technology for mapping terrain beneath a closed canopy [22][23].

**Digital Surface Model (DSM):** The top of the canopy and other surface features, generated from the "first return" of each laser pulse (the canopy reflection). DSM shows the three-dimensional surface of the forest as seen from above [22][23].

**Canopy Height Model (CHM):** The difference between DSM and DTM, yielding the height of the canopy at each point. CHM maps reveal individual tree crowns, canopy gaps, snags, and the structural complexity that defines old-growth forest. At 1-meter resolution, CHM maps can distinguish individual large trees and characterize canopy layering [22][23].

The USGS 3D Elevation Program (3DEP) is systematically collecting LiDAR data across the United States. The PNW has extensive 3DEP coverage, with Quality Level 2 data (2+ points per square meter, 10 cm vertical accuracy in open terrain) available for most of western Washington and Oregon. This data is publicly available through the USGS National Map and Amazon S3 [22][23][24].

LiDAR data has enabled forest research that was previously impossible:

- **Mapping old-growth structural complexity** from the air -- identifying stands with the canopy layering, gap distribution, and snag density characteristic of old-growth without requiring ground-based surveys [22][23].
- **Estimating biomass and carbon storage** at landscape scales -- combining CHM-derived tree heights with allometric equations to calculate standing biomass for entire watersheds [22][23].
- **Detecting post-fire recovery** -- repeat LiDAR flights showing how canopy structure rebuilds after disturbance [22][23].
- **Feeding the Living Forest digital twin** -- LiDAR data provides the structural template for computational models of forest dynamics [22][24].

---

## 9. IoT Sensor Networks

Emerging forest monitoring systems deploy networks of low-power, low-cost sensors connected via wireless mesh networking protocols to create continuous environmental monitoring at scales from individual research plots to entire watersheds [3][25][26].

The typical IoT forest monitoring node includes: temperature and humidity sensors (BME280 or SHT31), soil moisture probes (capacitive), light sensors (PAR -- photosynthetically active radiation), a microcontroller (ESP32, Arduino, or similar), a LoRaWAN radio module for long-range, low-power data transmission, and a battery with solar charging. Cost per node: $50-200, depending on sensor complement. Deployment density: 1-10 nodes per hectare for research plots, 1 node per 10-100 hectares for landscape-scale monitoring [25][26].

LoRaWAN (Long Range Wide Area Network) is the dominant wireless protocol for forest IoT applications. LoRa radio modules transmit small data packets (10-50 bytes) over distances of 2-15 km in forested terrain, with battery lifetimes of 1-5 years depending on transmission interval. Gateway stations (mounted on ridgetops, fire lookout towers, or communication towers) aggregate data from hundreds of field nodes and relay it to cloud servers via cellular or satellite backhaul [25][26].

Applications in PNW forests:

- **Fire weather monitoring:** Dense sensor networks provide the spatial resolution to detect fire weather conditions (low humidity, high temperature, high wind) in real time across landscapes, filling the gaps between widely spaced RAWS stations [25][26].

- **Soil moisture mapping:** Networks of soil moisture probes across topographic gradients reveal the spatial patterns of drought stress that determine which trees are most vulnerable [25][26].

- **Microclimate monitoring:** Sensors deployed within the canopy (at multiple heights) and on the forest floor document the temperature and humidity gradients discussed in Module 04, providing data for canopy energy balance models [25][26].

- **Stream temperature monitoring:** Inexpensive temperature loggers deployed in streams provide continuous data on the thermal regime that determines salmon habitat suitability. Networks of stream temperature sensors across a watershed reveal the spatial pattern of thermal refugia -- cold-water patches where salmon can survive heat events [25][26][27].

---

## 10. The Digital Twin

The convergence of all these monitoring technologies -- weather stations, soil moisture networks, dendrometers, camera traps, acoustic monitoring, satellite imagery, LiDAR, and IoT sensor arrays -- opens the possibility of constructing a digital twin of a living forest: a computational model that ingests real-time sensor data and simulates forest dynamics at ecologically meaningful spatial and temporal resolution [3][28][29].

A forest digital twin would incorporate:

- **Terrain:** LiDAR-derived DTM and CHM providing the three-dimensional structural template.
- **Climate:** Real-time weather data driving temperature, precipitation, wind, and humidity in the model domain.
- **Hydrology:** Soil moisture and stream flow data driving the water balance that determines tree growth and stress.
- **Growth:** Dendrometer data calibrating tree growth models, with species-specific growth curves derived from forest inventory data.
- **Disturbance:** Satellite fire detections, beetle kill mapping, windthrow events entered as model perturbations.
- **Biodiversity:** Camera trap and acoustic monitoring data providing occupancy models for key species.
- **Carbon:** Biomass estimates from LiDAR-allometry calibrated by field measurements, tracking carbon fluxes in response to growth, mortality, and disturbance [28][29].

The concept is not purely theoretical. Research programs including NEON (National Ecological Observatory Network), AmeriFlux (continental-scale eddy covariance network), and ForestGEO (Smithsonian's global forest dynamics network) are building the data infrastructure for forest digital twins. The Living Forest mission pack (in the companion TeX document) describes a specific implementation: a Minecraft-based digital twin of Weyerhaeuser PNW timberlands fed by real-time sensor data from government APIs and mesh telemetry [28][29].

The parallel to the mycorrhizal network is exact. The CMN is the forest's distributed sensing and resource-routing system, built by biological processes over millions of years. The sensor mesh is our distributed sensing and data-routing system, built by engineering over decades. Both respond to the same environmental variables. Both produce system-level understanding from local measurements. The mycorrhizal network routes carbon to stressed trees. The sensor mesh routes data to human decision-makers. Both serve the same purpose: keeping the forest alive [1][2][28].

---

## 11. Cross-References

| Project | Connection |
|---------|------------|
| [BPS](../BPS/index.html) | Bio-physics sensing -- the physical principles behind biological and electronic sensors, photosynthesis as light sensing |
| [SYN](../SYN/index.html) | Synsor Corporation -- sensor technology, environmental monitoring hardware, telemetry systems |
| [SHE](../SHE/index.html) | Smart home and DIY electronics -- ESP32 microcontrollers, LoRaWAN modules, the same IoT components used in forest sensor nodes |
| [LED](../LED/index.html) | LED and controllers -- measurement instruments, oscilloscopes, the electronics of environmental sensing |
| [CMH](../CMH/index.html) | Computational mesh networks -- LoRaWAN mesh architecture, data routing, the digital parallel to the mycorrhizal network |
| [VAV](../VAV/index.html) | Voxel as Vessel -- spatial data representation, LiDAR point clouds as voxel data, Minecraft as a 3D forest model |
| [MCR](../MCR/index.html) | Minecraft RAG -- Minecraft world data as a container for forest monitoring data, the digital twin in block form |
| [MAM](../MAM/index.html) | Mammals -- camera trap monitoring of forest mammals, northern flying squirrel as mycorrhizal disperser |
| [AVI](../AVI/index.html) | Birds -- passive acoustic monitoring of avian species, spotted owl and murrelet detection via PAM |
| [WYR](../WYR/index.html) | Weyerhaeuser -- operational forest monitoring, LiDAR for timber inventory, the business case for sensor networks |

---

## 12. Sources

1. Simard, S.W. 2021. *Finding the Mother Tree.* Knopf.
2. Smith, S.E. & Read, D.J. 2008. *Mycorrhizal Symbiosis.* 3rd edition. Academic Press.
3. Fang, Y. et al. 2016. "Complex networks, community structure, and catchment biogeochemical dynamics." *Ecological Monographs* 86(3): 380-406.
4. National Wildfire Coordinating Group. 2020. *Remote Automated Weather Stations (RAWS) Guide.*
5. Horel, J. et al. 2002. "Mesowest: cooperative mesonets in the western United States." *Bulletin of the American Meteorological Society* 83: 211-226.
6. Thornton, P.E. et al. 2021. "Daymet: Daily Surface Weather Data on a 1-km Grid for North America, Version 4." *ORNL DAAC.*
7. NRCS. 2020. *Snow Telemetry (SNOTEL) and Snow Course Data.* USDA Natural Resources Conservation Service.
8. Bell, J.E. et al. 2013. "U.S. Climate Reference Network soil moisture and temperature observations." *Journal of Hydrometeorology* 14: 977-988.
9. Serreze, M.C. et al. 1999. "Characteristics of the western United States snowpack from snowpack telemetry (SNOTEL) data." *Water Resources Research* 35: 2145-2160.
10. Jones, J.A. & Grant, G.E. 1996. "Peak flow responses to clear-cutting and roads in small and large basins, western Cascades, Oregon." *Water Resources Research* 32: 959-974.
11. Deslauriers, A. et al. 2007. "Daily weather response of balsam fir (*Abies balsamea*) stem radius increment from dendrometer analysis." *Trees* 21: 481-490.
12. Drew, D.M. & Downes, G.M. 2009. "The use of precision dendrometers in research on daily stem size variation and wood property variation." *Dendrochronologia* 27: 159-172.
13. Steenweg, R. et al. 2017. "Scaling up camera traps: monitoring the planet's biodiversity with networks of remote sensors." *Frontiers in Ecology and the Environment* 15(1): 26-34.
14. Burton, A.C. et al. 2015. "Wildlife camera trapping: a review and recommendations for linking surveys to ecological processes." *Journal of Applied Ecology* 52: 675-685.
15. Maser, C. et al. 1978. "The role of small mammals in forest ecosystems." *USDA Forest Service General Technical Report PNW-72.*
16. Shonfield, J. & Bayne, E.M. 2017. "Autonomous recording units in avian ecological research." *Avian Conservation and Ecology* 12(1): 14.
17. Darras, K. et al. 2019. "Measuring sound detection spaces for acoustic animal sampling and monitoring." *Biological Conservation* 236: 474-489.
18. Wiens, J.D. et al. 2014. "Three years of experimental removal of barred owls." *Journal of Wildlife Management* 78(8): 1337-1351.
19. Vogelmann, J.E. et al. 2012. "Perspectives on monitoring gradual change across the continuity of Landsat sensors." *Remote Sensing of Environment* 118: 259-271.
20. Drusch, M. et al. 2012. "Sentinel-2: ESA's optical high-resolution mission for GMES operational services." *Remote Sensing of Environment* 120: 25-36.
21. Kennedy, R.E. et al. 2010. "Detecting trends in forest disturbance and recovery using yearly Landsat time series." *Remote Sensing of Environment* 114: 2897-2910.
22. Lefsky, M.A. et al. 2002. "Lidar remote sensing for ecosystem studies." *BioScience* 52(1): 19-30.
23. Wulder, M.A. et al. 2012. "Lidar sampling for large-area forest characterization: a review." *Remote Sensing of Environment* 121: 196-209.
24. USGS. 2023. *3D Elevation Program (3DEP).* National Map.
25. Baggio, A. 2005. "Wireless sensor networks in precision agriculture." *ACM Workshop on Real-World Wireless Sensor Networks.*
26. Kerkez, B. et al. 2012. "Design and performance of a wireless sensor network for catchment-scale snow and soil moisture measurements." *Water Resources Research* 48: W09515.
27. Isaak, D.J. et al. 2012. "Climate change effects on stream and river temperatures across the northwest U.S." *Climatic Change* 113: 499-524.
28. Strigul, N. et al. 2008. "Scaling from trees to forests: tractable macroscale equations for forest dynamics." *Ecological Monographs* 78(4): 523-545.
29. Seidl, R. et al. 2012. "An individual-based process model to simulate landscape-scale forest ecosystem dynamics." *Ecological Modelling* 231: 87-100.
