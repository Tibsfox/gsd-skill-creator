# The Storage Hierarchy: From Punch Cards to Persistent Memory

*Where the bits actually live --- a physics-and-economics tour of two centuries of storage media*

---

## 1. Holes in Paper: The Pre-Electronic Era

Before electrons held information, holes did. The lineage of stored-program computing begins not with Babbage but with **Joseph-Marie Jacquard**, whose 1804 loom (publicly demonstrated in Lyon and granted a French patent in April of that year) used a chain of stiffened punched cards to control the raising and lowering of warp threads on a drawloom. Each hole corresponded to a hook lifted; each blank meant a hook left down. A complex silk brocade could require tens of thousands of cards, laced together like a rigid linen tape. This was not yet a general-purpose memory --- the cards encoded a single fixed program --- but it established two principles that every subsequent storage medium would honor. First, information could be decomposed into a stream of binary decisions (hole or no-hole). Second, that stream could outlive the machine that wrote it and could be read back, deterministically, by a mechanism that understood only "presence" and "absence."

Charles Babbage, who met Jacquard's cards through a woven silk portrait of the inventor that he owned in the 1840s, designed his Analytical Engine to accept both "operation cards" and "variable cards," explicitly crediting the loom. Babbage's engine was never finished, but the cards themselves entered computing seventy years later through a different door.

That door belonged to **Herman Hollerith**, a young engineer at the U.S. Census Bureau who watched clerks spend most of the 1880s tabulating the 1880 census by hand. Hollerith patented an electric tabulating system in 1889 (U.S. Patent 395,782, issued January 8, 1889) that used a punched card, a spring-loaded pin array, and small cups of mercury: when a pin found a hole, it dipped into mercury, closed a circuit, and advanced a counter. The 1890 U.S. Census was processed in roughly eighteen months using Hollerith's machines --- previous censuses had taken seven or eight years --- and the savings were variously estimated at five million dollars. Hollerith's Tabulating Machine Company merged with three others in 1911 to become the Computing-Tabulating-Recording Company, renamed **International Business Machines** in 1924. The 80-column IBM card, standardized around 1928, became the single most important physical data carrier of the twentieth century's first half. A single card held 80 characters (960 bits of addressable data at six-bit BCD), weighed about 2.5 grams, and could survive decades in a filing cabinet. IBM operated card-punch factories producing billions of cards per year at the peak.

Cards were cheap, human-readable with a little squinting, and catastrophically slow. A fast reader of the 1950s managed perhaps a thousand cards per minute, which works out to about 1.3 kilobytes per second. For anything larger than a payroll, cards were a bottleneck, and the bottleneck demanded a faster medium.

## 2. Magnetism Arrives: Tape, Drum, and Core

The first magnetic computer storage was **UNIVAC I's UNISERVO** tape drive, delivered to the U.S. Census Bureau in March 1951. The UNISERVO used a half-inch nickel-plated phosphor-bronze tape (chosen over iron-oxide-coated plastic because early plastic bases stretched) with eight parallel tracks recorded at 100 characters per inch and read at 12,800 characters per second. A single 1,200-foot reel held approximately 1.4 megabytes --- equivalent to about 15,000 IBM cards in a volume smaller than a hatbox. For the next half-century, magnetic tape would remain the cheapest way to store data per byte, a title it has, as we will see, never quite surrendered.

Parallel to tape came the **magnetic drum**, a rotating cylinder coated with ferromagnetic material and read by fixed heads. The ERA 1101 (1950) and the IBM 650 (1953) used drums as their primary working memory, with the 650's drum holding 2,000 ten-digit signed words and rotating at 12,500 RPM. Drums were random-access in principle but average-latency in practice: you waited for the right slot to rotate under the head, typically 2.4 milliseconds for the 650. Programmers wrote "optimum programming" assemblers that laid out instructions around the drum so that the next instruction arrived just as the previous one finished, a manual form of the pipelining that modern processors do in silicon.

The medium that finally gave computers a true random-access working memory was **magnetic core**. **Jay Forrester** at MIT, working on the Whirlwind I air-defense computer, sketched the idea in a June 1949 lab notebook and filed U.S. Patent 2,736,880 in May 1951 (granted February 1956). Tiny ferrite toroids, about a millimeter across, were threaded onto a grid of wires; each core could be magnetized clockwise or counter-clockwise, representing a bit, and read by the coincident-current method in about a microsecond. Whirlwind's 32-by-32 core plane came online in 1953 and replaced its notoriously flaky electrostatic storage tubes. By the early 1960s, core was the universal main memory of every serious computer on Earth, hand-woven by skilled workers (often women) in facilities from Massachusetts to Taiwan. The word *core* survives in Unix today, fifty years after the last core plane shipped, in the noun phrase *core dump*.

## 3. The Disk Era: RAMAC, Winchester, and Kryder's Law

On September 13, 1956, IBM announced the **305 RAMAC** (Random Access Method of Accounting and Control) in San Jose. The RAMAC's storage unit, the IBM 350, held fifty 24-inch aluminum disks coated on both sides with iron-oxide paint. It stored five million 7-bit characters --- about 4.4 megabytes in modern terms --- weighed more than a ton, leased for $3,200 per month (roughly $36,000 in 2025 dollars), and was the size of two refrigerators pushed together. Two hydraulically-driven read/write heads serviced all one hundred surfaces. The RAMAC's great conceptual contribution was random access by address: you no longer had to spool a tape to find a record. Every block was reachable in under a second.

Seventeen years later, IBM shipped the **IBM 3340** in March 1973. Its project code name, *Winchester* (after the .30-30 rifle, from its original "30-30" specification of two 30-megabyte spindles), gave a name to an entire class of drive. The Winchester innovation was the sealed head-disk assembly: lightweight heads that flew on an air bearing a few microinches above the platter, parked on a dedicated landing zone when powered down. Sealing the assembly kept dust out and allowed lower flying heights, which meant higher areal density, which meant more bytes per dollar. Every spinning disk shipped since 1973 is, in architectural terms, a Winchester.

Areal density --- bits per square inch on the platter surface --- became the defining metric. **Mark Kryder** of Seagate observed around 2005 that disk density had been doubling roughly every thirteen months through the 1990s, outpacing even Moore's Law. The press christened this *Kryder's Law*. It did not hold. The superparamagnetic limit, which makes small bits thermally unstable, forced the industry into **perpendicular magnetic recording** (Toshiba shipped the first PMR drive in 2005) and then into exotic technologies like shingled magnetic recording (SMR, 2013) and heat-assisted magnetic recording (HAMR, Seagate production shipments began in earnest in 2024). Kryder's doubling time slowed to roughly two to three years in the 2010s and slipped further thereafter. Today's largest nearline HDDs ship around 30 TB (HAMR) and 24 TB (CMR/PMR), far below what a naive extrapolation of Kryder's Law would have predicted by 2026.

## 4. Flash: Masuoka, NAND, and the SSD Revolution

In 1980, **Fujio Masuoka**, an engineer at Toshiba in Kawasaki, invented a non-volatile semiconductor memory cell that could be erased electrically in large blocks. Masuoka presented **NOR flash** at the IEEE International Electron Devices Meeting (IEDM) in 1984 and **NAND flash** at IEDM 1987. The names describe the cell wiring: NOR cells are accessed individually for fast random reads; NAND cells are wired in series to pack more bits per area at the cost of block-level, not byte-level, access. Toshiba's management underestimated the invention, and Masuoka spent years frustrated inside the company before leaving in 1994 for Tohoku University. Flash became the foundation of every memory card, USB stick, smartphone, and solid-state drive shipped since.

The transition from curiosity to infrastructure happened through a chain of product milestones. **M-Systems**, an Israeli company founded in 1989, shipped the **DiskOnChip** in 1995 --- a small flash module that emulated a hard drive via a DIP socket and is widely credited as the first commercially successful SSD for embedded use. M-Systems also shipped the first **USB flash drive**, the DiskOnKey, in 2000, though IBM branded and distributed the American version. By the mid-2000s, Samsung, SanDisk, Intel, and Micron were pushing SSDs at laptops, and the **Intel X25-M** (2008) made SSDs credibly faster than HDDs for random workloads, collapsing the gap between "what a computer could do" and "what its storage would permit it to do."

Cost pressure forced more bits per cell. **Single-level cell (SLC)** stores one bit per cell and is fastest and most durable, rated for roughly 100,000 program/erase cycles per cell. **Multi-level cell (MLC)**, two bits per cell, dropped endurance to about 10,000 cycles. **Triple-level cell (TLC)**, three bits, landed near 3,000 cycles. **Quad-level cell (QLC)** pushed four bits per cell (sixteen distinguishable voltage levels) and knocked endurance down to roughly 1,000 cycles in consumer-grade parts. **Penta-level cell (PLC)** prototypes have been demonstrated but have not yet reached broad commercial shipping. Each step traded longevity and speed for capacity per dollar, and each step was made tolerable by ever-more-aggressive **wear-leveling**, **error correction** (modern NAND relies on LDPC codes), and **write amplification** management. The SSD controller has become a small computer in its own right, running more firmware than a 1990s PC.

## 5. AHCI to NVMe: Shedding Forty Years of SATA

Early SSDs plugged into the same SATA ports as disks and spoke the same **AHCI** (Advanced Host Controller Interface) protocol, designed in 2004 for rotating media with a single command queue of 32 outstanding requests. Once flash latency fell below the rotational latency of a disk, AHCI became the bottleneck: SATA's 6 Gb/s link and 32-deep queue had been engineered for devices where the seek dominated everything. **NVMe** (Non-Volatile Memory Express), whose 1.0 specification was published on March 1, 2011 by a working group including Intel, Samsung, Micron, and others, threw AHCI out. NVMe runs over PCIe directly, supports 65,535 queues of 65,536 commands each, halves the protocol overhead, and reaches millions of IOPS on a single consumer drive. Typical 4K random-read latency on a 2024 consumer NVMe drive is around 20 microseconds end-to-end, compared with 100 microseconds for a good SATA SSD and 5,000 microseconds for a 7200-RPM disk. Sequential bandwidth on PCIe 5.0 x4 NVMe drives now exceeds 14 GB/s. IOPS and throughput are different axes: a drive can be throughput-heavy (HDDs, tape) or IOPS-heavy (NVMe), and modern storage stacks are designed around that distinction.

## 6. Persistent Memory: Optane's Rise and Fall

Between DRAM and flash sat a long-imagined tier: byte-addressable, persistent, DRAM-adjacent memory. **Intel and Micron** announced **3D XPoint** in July 2015 and claimed it was a fundamentally new memory type --- not flash, not DRAM, but a bulk-resistance-switching material arranged in a stackable cross-point grid. The technology shipped first as **Intel Optane SSDs** in 2017 and then as **Optane DC Persistent Memory** DIMMs in April 2019, slotting into DDR4 memory channels on second-generation Xeon Scalable servers. Optane DIMMs offered roughly 300 nanosecond loaded latency, several times slower than DRAM but orders of magnitude faster than NVMe, and they could be used in "Memory Mode" (as a large DRAM cache) or "App Direct Mode" (as a persistent byte-addressable region exposed through DAX-aware filesystems).

Commercially, Optane failed. Intel took a $559 million inventory impairment on Optane in Q2 2022 and announced the **discontinuation** of the Optane business that July. The reasons were economic rather than technical: 3D XPoint's manufacturing was expensive, the ecosystem of software that could exploit byte-addressable persistence was thin, and CPU vendors had already committed to a different route to the same destination --- **CXL** (Compute Express Link). CXL 1.1 was announced in March 2019, and CXL 2.0 (November 2020) added memory pooling and switching. CXL-attached memory modules now carry the persistent-memory-tier story forward in principle, with the wrinkle that most CXL memory on the market today is DRAM, not persistent, and the durable-memory future is once again deferred.

## 7. DRAM and the Memory Wall

**Dynamic RAM**, invented by Robert Dennard at IBM in 1966 (U.S. Patent 3,387,286), stores a bit as charge on a capacitor that must be refreshed every few milliseconds. DRAM density and cost-per-bit have tracked Moore's Law closely, but DRAM latency --- the time from address to data --- has improved stubbornly slowly. In 1995, **William Wulf and Sally McKee** published *Hitting the Memory Wall: Implications of the Obvious*, a three-page note in *ACM SIGARCH Computer Architecture News* that pointed out the looming problem: processor speeds were improving at 60% per year while DRAM latency was improving at 7% per year, and the two lines had to cross. They have crossed many times. The entire modern cache hierarchy --- L1, L2, L3, victim caches, prefetchers, memory-level parallelism, out-of-order execution --- exists to pretend the memory wall isn't there. It still is.

The response on the bandwidth side has been **HBM** (High Bandwidth Memory), a JEDEC standard first published in October 2013 and pioneered by AMD and SK Hynix. HBM stacks DRAM dies vertically using through-silicon vias and sits on an interposer next to the processor die, exposing an extremely wide bus (1024 bits for HBM1, 2048 bits for HBM3E). HBM3E modules shipping in 2024 reach ~1.2 TB/s per stack, and an NVIDIA H200 GPU carries 141 GB of HBM3E delivering 4.8 TB/s aggregate bandwidth. HBM has become the enabling substrate for modern AI workloads; the economics of training large language models are, to a first approximation, economics of HBM.

## 8. Object Storage and Eleven Nines

On March 14, 2006, Amazon Web Services launched **Simple Storage Service (S3)**, offering storage priced at $0.15 per gigabyte-month with no setup fees and a simple HTTP PUT/GET API. S3 introduced two ideas that have become universal. First, **eleven nines of durability** (99.999999999%) --- Amazon's claim that, if you stored 10 million objects in S3, you could expect to lose one object every 10,000 years. Underneath, S3 uses **erasure coding** (a Reed-Solomon-family scheme that splits objects into data and parity shards) and distributes those shards across multiple availability zones in a region. A single failing disk, rack, or entire datacenter can be tolerated without data loss and usually without the user noticing. Second, S3 defined a de facto **API standard**: every competing object store (Google Cloud Storage, Azure Blob, Backblaze B2, MinIO, Ceph RGW, Cloudflare R2) now speaks S3-compatible HTTP, because the application ecosystem built around `boto3` and the S3 SDK made it the path of least resistance.

## 9. Tape Is Not Dead

The **LTO** (Linear Tape-Open) consortium (HP, IBM, and Quantum) shipped its first format in 2000 with 100 GB native capacity. The roadmap since has been remarkably consistent: LTO-9 shipped in September 2021 at **18 TB native** (45 TB compressed) per cartridge; LTO-10 landed in 2024 at roughly **30 TB native**; the published roadmap targets **LTO-14 at 576 TB native** over the next several generations. A tape cartridge costs a small fraction per terabyte of any online medium, consumes zero power at rest, and has a specified archival life of thirty years. **Amazon Glacier** (launched August 2012) and **Glacier Deep Archive** (2019) are widely understood to be tape-backed, with retrieval latencies of hours specifically because a robotic arm has to fetch and mount a physical cartridge. Hyperscalers --- Google, Microsoft, Amazon, Meta --- operate some of the largest tape libraries ever built, because for cold data measured in exabytes, nothing else pencils out economically.

## 10. Exotic Media and the Thousand-Year Question

For the truly long term, researchers have looked beyond magnetism and charge. **Holographic storage** --- encoding data as volumetric interference patterns in photosensitive crystals or polymers --- was pursued commercially by **InPhase Technologies** through the 2000s and never achieved reliable manufacturing; the company dissolved in 2012. **DNA storage** has had a run of credible demonstrations: **George Church's group** at Harvard encoded 5.27 megabits (a draft of a book) in synthesized oligonucleotides in 2012; **Nick Goldman and Ewan Birney** at EMBL-EBI stored 739 kilobytes including Shakespeare's sonnets and an MP3 of Martin Luther King's "I Have a Dream" speech in a 2013 *Nature* paper; by 2018, Microsoft and the University of Washington had demonstrated an automated end-to-end DNA read/write system. DNA's appeal is density (petabytes per gram) and longevity (thousands of years if kept cool and dry), but the synthesis cost per byte remains many orders of magnitude too high for anything but archival curiosities. **Project Silica**, a Microsoft Research effort announced in 2019 in partnership with Warner Bros., stores data as femtosecond-laser-written voxels inside quartz glass plates; an initial demonstration encoded the 1978 *Superman* film on a piece of glass roughly the size of a drink coaster, rated for thousands of years of shelf life.

## 11. Latency Numbers Every Programmer Should Know

Much of the culture of modern systems engineering is organized around a single slide. **Jeff Dean**, speaking at Stanford in 2010 and in a talk circulated widely in 2012, tabulated the typical latencies of each level of the storage hierarchy. In his updated 2020 version, the orders of magnitude are roughly: L1 cache reference, 0.5 nanoseconds; L2 cache, 7 ns; main memory reference, 100 ns; compress 1 KB, 2 microseconds; send 1 KB over a 10 Gbps link, 10 µs; SSD random read, 16 µs; round trip within the same datacenter, 500 µs; disk seek, 3 ms; send a packet from California to the Netherlands and back, 150 ms. The **ten-thousand-fold gap** between L1 (under a nanosecond) and disk (several milliseconds) is the single most important number a systems engineer carries in their head. Every cache, every prefetch, every index, every compiled query plan exists to avoid paying the long tail of that distribution.

## 12. The Pyramid

Assembled, the tiers form the familiar pyramid, each row about ten to a hundred times slower and ten to a hundred times cheaper per byte than the row above it.

| Tier | Typical latency | Typical capacity | Cost per GB (2025) |
|---|---|---|---|
| Registers | < 1 ns | hundreds of bytes | n/a |
| L1 cache | ~1 ns | tens of KB | thousands of dollars |
| L2 cache | 3--10 ns | hundreds of KB | hundreds |
| L3 cache | 10--30 ns | tens of MB | tens |
| DRAM | 80--120 ns | tens to hundreds of GB | ~$3 |
| HBM | ~150 ns, >1 TB/s | tens of GB | ~$20 |
| CXL memory | 200--400 ns | TB-scale | ~$5 |
| NVMe SSD | 20--100 µs | TB-scale | ~$0.08 |
| SATA SSD | 100--500 µs | TB-scale | ~$0.06 |
| HDD | 3--10 ms | tens of TB | ~$0.012 |
| Object / cold | 100 ms -- hours | ~unlimited | ~$0.004 -- $0.001 |
| Tape / Glacier Deep Archive | hours | ~unlimited | ~$0.001 |

Every piece of software ever written is, at some level, an argument about which tier a particular piece of data should live in. The history of storage is not really a history of media; it is a history of that argument, carried out over two centuries, in iron oxide and ferrite toroids and floating gates and femtosecond-written voxels --- each generation's answer to the same question Hollerith asked in 1889: *where do we put the bits so we can find them again?*

---

## Study Guide — Storage Hierarchy

### Tiers

L1 → L2 → L3 → DRAM → persistent memory → NVMe →
SATA SSD → HDD → object → tape. Each step is 10-1000x
slower and 10-1000x cheaper.

## DIY — Measure latency from each tier

Write a micro-benchmark that reads 1 byte from each
available tier on your machine. Confirm the pyramid.

## TRY — Use Intel Optane PMem (if available)

Optane is being EOL'd but still exists. Map a file with
`mmap` on a pmem device. Observe the performance.

*Next in the HKP series: filesystems and the software abstraction layer that pretends all of these tiers are one big flat address space.*
