# Visualize a Pipeline

A guided build that teaches data pipeline concepts through Minecraft spatial construction.

---

## 1. Overview

### What You Will Learn

- **Data pipelines:** How data flows through sequential processing stages
- **Processing stages:** How each stage transforms data in a specific way
- **Buffering:** How queues manage the flow between stages that work at different speeds
- **Error handling:** How systems route bad data away from the main processing path
- **Bottlenecks:** How the slowest stage limits the entire pipeline's throughput

### What You Will Build

A 5-stage data pipeline where rooms represent processing stages and corridors carry data between them. Raw materials enter the Intake Room, pass through Validation, Transformation, and Enrichment, then arrive at the Output Room as finished products. Along the way, you will build error handling paths, buffering mechanisms, and monitoring points.

```
[Intake]-->[Validate]-->[Transform]-->[Enrich]-->[Output]
  5x5        5x5          7x7         5x5        5x5
     3-wide     3-wide      3-wide      3-wide
```

### Time

**30-45 minutes** (beginner friendly)

- 10 build steps at 3-4 minutes each
- 5-10 minutes reading and orientation
- 5 minutes for the final walkthrough

### Prerequisites

- Minecraft creative mode basics (placing blocks, opening chests, reading signs)
- No computing knowledge required -- this build teaches the concepts

### Reference

This build follows the methodology defined in the [System Architecture as Buildings](../../methodology/system-architecture-as-buildings.md) document. Refer to it for the spatial metaphor system, block palette standards, and sign formatting conventions used throughout this guide.

---

## 2. The Concept: What Is a Data Pipeline?

### The Simple Version

A data pipeline is a system where data enters at one end, gets processed in stages, and exits at the other end in a transformed state. Each stage does one specific job. The stages are connected in sequence -- the output of one stage becomes the input of the next.

You encounter data pipelines every day:

- **Email:** Your message is received -> checked for spam -> routed to the right mailbox -> indexed for search -> displayed in your inbox
- **Online orders:** Order placed -> payment validated -> inventory checked -> item shipped -> delivery confirmed
- **Photo upload:** Image received -> virus scanned -> resized for thumbnails -> compressed -> stored -> displayed

### The Technical Version

In computing, a data pipeline (also called ETL -- Extract, Transform, Load) processes data through a series of stages:

1. **Extract/Intake:** Data enters the pipeline from an external source
2. **Validate:** Data is checked for correctness and completeness
3. **Transform:** Data is converted, calculated, or reformatted
4. **Enrich:** Data is combined with reference information
5. **Load/Output:** Processed data is delivered to its destination

### Key Vocabulary

| Term | Meaning | In This Build |
|---|---|---|
| **Stage** | One step in the pipeline that does a specific job | A room |
| **Transformation** | Changing data from one form to another | Crafting table converting items |
| **Input** | Data entering a stage | Items entering a room through a door |
| **Output** | Data leaving a stage | Items leaving a room through the opposite door |
| **Buffer** | A queue that holds data between stages | Hopper chain between rooms |
| **Throughput** | How much data the pipeline processes per unit of time | How many items pass through per minute |
| **Bottleneck** | The slowest stage that limits the whole pipeline | The smallest or most complex room |

---

## 3. The Build Plan

### Floor Plan

```
                         Error Room
                          (5x5)
                            ^
                            |
                         branch
                            |
[Intake]--->[Validate]--->[split]--->[Transform]--->[Enrich]--->[Output]
 Room 1      Room 2        |          Room 3        Room 4      Room 5
  5x5         5x5       corridor       7x7           5x5         5x5
              |                         |
              |         3-wide        3-wide
           3-wide     + hopper
                       buffer
```

### Room Dimensions

| Room | Interior Size | Purpose | Ceiling Height |
|---|---|---|---|
| Intake Room | 5x5 blocks | Data entry point | 4 blocks |
| Validation Room | 5x5 blocks | Data checking | 4 blocks |
| Transform Room | 7x7 blocks | Data processing (larger = heavier work) | 4 blocks |
| Enrichment Room | 5x5 blocks | Data augmentation | 4 blocks |
| Output Room | 5x5 blocks | Data delivery | 4 blocks |
| Error Room | 5x5 blocks | Failed data collection | 4 blocks |

### Corridor Dimensions

All main corridors are 3 blocks wide and 4 blocks tall. Length varies:
- Corridor 1 (Intake to Validate): 5 blocks long
- Corridor 2 (Validate to Transform): 8 blocks long (includes branch)
- Corridor 3 (Transform to Enrich): 5 blocks long (includes hopper buffer)
- Corridor 4 (Enrich to Output): 5 blocks long

### Total Footprint

Approximately **50 blocks long x 15 blocks wide x 8 blocks tall** (including walls and roof).

### Materials You Will Use

| Material | Purpose | Where |
|---|---|---|
| Stone Brick | Walls of all rooms | Every room |
| Stone Brick Stairs | Wall trim and details | Room corners, doorframes |
| Cyan Glazed Terracotta | Corridor floors | All corridors (shows flow direction) |
| Glass Block | Front wall of Intake, rear wall of Output | Input/output interfaces |
| Redstone Comparator | Validation mechanism | Room 2, Room 5 |
| Crafting Table | Transformation work surface | Room 3 |
| Hopper | Buffer queue between rooms | Corridor 3 |
| Chest | Data storage at each stage | Every room |
| Barrel | Alternative storage | Rooms 3 and 4 |
| Bookshelf | Reference data for enrichment | Room 4 |
| Lectern | Data lookup point | Room 4 |
| Oak Sign | All text and labels | Throughout |
| Red Concrete | Error room indicator | Error Room walls |
| Red Glazed Terracotta | Error corridor floor | Branch to Error Room |
| Green Concrete | Output success indicator | Output Room accent |

---

## 4. Step-by-Step Build Instructions

### Step 1: Build the Intake Room (3-4 minutes)

**Build:**
1. Create a 5x5 interior room using stone brick walls, 4 blocks high
2. Place stone brick stairs along the top edge as trim
3. Make the front wall (the side data enters from) entirely glass blocks
4. Place a chest against the glass wall -- this is the "raw data input"
5. Place a hopper pointing into the chest (data arriving from external source)
6. Add a dark oak slab roof
7. Leave an opening on the opposite wall for the exit door (place a door here)

**Concept:** This room represents the **data ingestion point** -- where raw data first enters the pipeline. The glass wall shows that data comes from outside the system. The chest holds data waiting to be processed. In real pipelines, this is where data arrives from APIs, file uploads, sensor readings, or user input.

**Signs to place:**
- Wall sign outside the door:
  ```
  [Pipeline]
  Intake Room
  ```
- Wall sign next to the chest:
  ```
  DATA INTAKE
  = Input Chest
  Raw data enters
  the pipeline
  ```
- Wall sign on glass wall:
  ```
  Step 1 of 10
  This glass wall
  shows data comes
  from outside
  ```

---

### Step 2: Build Corridor 1 (3 minutes)

**Build:**
1. From the Intake Room exit door, build a 3-wide corridor, 5 blocks long
2. Floor: cyan glazed terracotta with the arrow pattern pointing away from Intake (toward Validate)
3. Walls: stone brick, 4 blocks high
4. Ceiling: dark oak slabs

**Concept:** This corridor represents **data in transit** between the intake stage and validation stage. In real pipelines, data moves between stages through message queues (like RabbitMQ or Kafka topics), function calls, or network requests. The directional terracotta arrows show which way data flows -- always forward through the pipeline.

**Signs to place:**
- Wall sign at corridor entrance:
  ```
  --> Validate
  Room 2 of 5
  ```

---

### Step 3: Build the Validation Room (3-4 minutes)

**Build:**
1. At the end of Corridor 1, build a 5x5 interior room using stone brick
2. Place a redstone comparator on the floor, pointing from an input chest to a lamp
3. Place a chest on one side (data arriving for validation)
4. Place a redstone lamp behind the comparator (lights up when chest has items = valid data)
5. Place a second chest on the opposite side (validated data ready to move on)
6. Exit door on the wall toward the Transform Room

**Concept:** This room represents **data validation** -- checking whether incoming data meets the expected format and rules before processing it. The redstone comparator "checks" the chest contents; if valid (chest has items), the lamp activates. In real pipelines, validation catches malformed records, missing fields, or out-of-range values before they cause problems downstream.

**Signs to place:**
- Wall sign outside the door:
  ```
  [Pipeline]
  Validate Room
  ```
- Wall sign next to comparator:
  ```
  VALIDATION
  = Comparator
  Checks if data
  meets the rules
  ```

**Self-check:**
- Question sign on the wall:
  ```
  ? THINK ?
  What happens if
  bad data enters
  this room?
  ```
  Answer: Bad data should be routed somewhere else -- which is exactly what we build in the next step.

---

### Step 4: Build Corridor 2 with Error Branch (4-5 minutes)

**Build:**
1. From the Validation Room exit, build a 3-wide corridor, 4 blocks long
2. At the 4-block mark, create a T-junction: the main path continues forward, a branch goes to the side
3. The branch corridor: 3-wide, 4 blocks long, using **red glazed terracotta** for the floor (error path)
4. At the end of the branch, build a small 5x5 room using **red concrete** for the walls
5. Place a chest inside the red room -- this is the "dead letter queue"
6. The main corridor continues 4 more blocks toward the Transform Room (cyan terracotta)

**Concept:** This branching corridor represents **error handling in pipelines**. When data fails validation, it cannot continue to the Transform stage -- it would cause errors. Instead, failed data is routed to a **dead letter queue** (the red room with a chest) where someone can inspect it later. The red floor and walls make the error path visually distinct from the normal flow.

In real systems, this is implemented as:
- Exception handling that catches validation failures
- Dead letter queues in message brokers (AWS SQS DLQ, RabbitMQ dead letter exchange)
- Error logs and alerting systems

**Signs to place:**
- Direction sign at the T-junction:
  ```
  --> Transform
  Main data path
  ```
- Direction sign at the branch:
  ```
  --> Error Room
  Failed data
  ```
- Wall sign in the Error Room:
  ```
  DEAD LETTER Q
  = Error Room
  Failed data is
  stored here
  ```

**Self-check:**
- Question sign at the T-junction:
  ```
  ? THINK ?
  What real system
  uses a path
  like this?
  ```
  Answer: Email spam filters route suspected spam to a junk folder (error path) instead of the inbox (main path).

---

### Step 5: Build the Transform Room (4-5 minutes)

**Build:**
1. At the end of the main corridor, build a **7x7** interior room using stone brick
2. This room is deliberately larger than the others -- transformation is the heaviest processing
3. Place 3 crafting tables in a row in the center -- these represent transformation logic
4. Place a chest on the input side (data arriving from validation)
5. Place barrels on the output side (transformed data ready for enrichment)
6. Add redstone lamps in the ceiling, powered by a lever (shows "processing active")
7. Exit door on the wall toward the Enrichment Room

**Concept:** This room represents **data transformation** -- the core processing where data is converted, calculated, reformatted, or otherwise changed. The crafting tables symbolize transformation logic: raw materials go in, finished products come out. This room is larger because transformation typically requires more computing resources than validation or routing.

In real pipelines, transformation includes:
- Parsing JSON into database records
- Calculating aggregate statistics
- Converting file formats (CSV to Parquet)
- Normalizing addresses, phone numbers, currencies
- Applying business rules ("if order > $100, apply discount")

**Signs to place:**
- Wall sign outside the door:
  ```
  [Pipeline]
  Transform Room
  ```
- Wall sign next to crafting tables:
  ```
  TRANSFORMATION
  = Crafting Table
  Data is changed
  from one form
  ```
- Wall sign noting room size:
  ```
  RESOURCE USE
  Bigger room =
  more computing
  power needed
  ```

---

### Step 6: Build Corridor 3 with Buffer (4 minutes)

**Build:**
1. From the Transform Room exit, build a 3-wide corridor, 5 blocks long
2. Floor: cyan glazed terracotta (flow direction arrows)
3. Along one wall, place a chain of 4 hoppers pointing toward the Enrichment Room
4. The hopper chain sits at floor level, clearly visible as you walk through

**Concept:** This hopper chain represents a **buffer** (also called a queue or backpressure mechanism). If the Enrichment Room is busy and cannot accept new data, items accumulate in the hopper chain instead of being lost. The buffer absorbs temporary speed differences between stages.

In real systems, buffers are everywhere:
- Message queues (Kafka partitions, SQS queues) between microservices
- TCP receive buffers in network connections
- Print queues holding documents when the printer is busy
- Browser request queues when the server is overloaded

The key insight: **without buffers, a slow downstream stage forces the entire pipeline to slow down or lose data.**

**Signs to place:**
- Wall sign next to hopper chain:
  ```
  DATA BUFFER
  = Hopper Chain
  Items queue here
  before processing
  ```
- Wall sign explaining backpressure:
  ```
  BACKPRESSURE
  If next room is
  full, items wait
  in the buffer
  ```

**Self-check:**
- Question sign on the wall:
  ```
  ? THINK ?
  What happens if
  the buffer is
  full too?
  ```
  Answer: This is called "backpressure" -- the system pushes back, slowing down upstream stages. In the worst case, the pipeline stops accepting new data until space opens up.

---

### Step 7: Build the Enrichment Room (3-4 minutes)

**Build:**
1. At the end of Corridor 3, build a 5x5 interior room using stone brick
2. Place bookshelves along two walls -- these represent reference data used for enrichment
3. Place a lectern in the center with a written book (title: "Lookup Table")
4. Place a chest on the input side (data arriving from transformation)
5. Place barrels on the output side (enriched data ready for output)
6. Exit door on the wall toward the Output Room

**Concept:** This room represents **data enrichment** -- augmenting processed data with additional information from reference sources. The bookshelves are the reference data (like a lookup table or external database), and the lectern is the join operation (combining your pipeline data with the reference data).

Real-world enrichment examples:
- Adding geographic coordinates to an address (geocoding)
- Looking up a product name from a product ID
- Adding weather data to a delivery route
- Matching a user ID to their profile information
- Cross-referencing a transaction with a fraud database

**Signs to place:**
- Wall sign outside the door:
  ```
  [Pipeline]
  Enrich Room
  ```
- Wall sign next to bookshelves:
  ```
  ENRICHMENT
  = Bookshelves
  Reference data
  for lookups
  ```
- Wall sign next to lectern:
  ```
  DATA JOIN
  = Lectern
  Combine pipeline
  + reference data
  ```

---

### Step 8: Build Corridor 4 (2-3 minutes)

**Build:**
1. From the Enrichment Room exit, build a 3-wide corridor, 5 blocks long
2. Floor: cyan glazed terracotta (flow direction arrows pointing to Output)
3. Walls: stone brick, 4 blocks high
4. Ceiling: dark oak slabs

This is the final stretch. Data has been validated, transformed, and enriched. The next room is its destination.

**Signs to place:**
- Wall sign at corridor entrance:
  ```
  --> Output
  Room 5 of 5
  Almost done!
  ```

---

### Step 9: Build the Output Room (3-4 minutes)

**Build:**
1. At the end of Corridor 4, build a 5x5 interior room using stone brick
2. Make the rear wall (the side data exits from) entirely glass blocks -- data leaves the pipeline here
3. Place a large chest against the glass wall -- this is the "finished product storage"
4. Place a redstone comparator reading the chest contents, connected to a redstone lamp
5. When the chest has items (pipeline has produced output), the lamp lights up green
6. Place green concrete accents around the lamp -- success indicator
7. Place a barrel labeled "Archive" in one corner (long-term storage)

**Concept:** This room represents the **data sink** -- the final destination where fully processed data is delivered. The glass wall shows that data leaves the pipeline to be consumed by external systems. The comparator + lamp combination provides a visual indicator that the pipeline is producing output successfully.

In real systems, output destinations include:
- A database (data warehouse, data lake)
- An API response to a waiting client
- A file export (CSV, JSON, PDF report)
- A notification system (email, SMS, push notification)
- A dashboard or visualization tool

**Signs to place:**
- Wall sign outside the door:
  ```
  [Pipeline]
  Output Room
  ```
- Wall sign next to chest:
  ```
  DATA SINK
  = Output Chest
  Finished data
  is delivered
  ```
- Wall sign next to comparator:
  ```
  MONITORING
  = Comparator
  Lamp ON = data
  is flowing out
  ```

**Self-check:**
- Question sign on the wall:
  ```
  ? THINK ?
  Why is Room 3
  bigger than
  this room?
  ```
  Answer: The Transform Room (Room 3) does the heaviest processing -- converting data from one form to another. The Output Room just stores the result. In real systems, transformation stages typically use the most CPU, memory, and time.

---

### Step 10: The Walkthrough (5 minutes)

**This step has no building -- it is a guided tour of what you just created.**

1. Return to the Intake Room (Room 1)
2. Place 5 items (any items -- cobblestone works fine) in the Intake chest
3. Now walk the entire pipeline, end to end, slowly
4. At each room, stop and read every sign
5. Move one item from the Intake chest to Room 2's chest, then to Room 3, then to Room 4, then to Room 5's output chest (simulating data flowing through the pipeline)
6. Watch the Output Room's redstone lamp light up when items are in the final chest
7. Walk back through the pipeline in reverse -- notice how the experience is different going upstream

**As you walk, think about:**
- How does it feel to walk through each room?
- Which room feels the most important?
- Where would a bottleneck happen if Room 3 were slower?
- What would happen if you blocked Corridor 2?

**Signs to place at the Intake Room entrance:**
- Wall sign:
  ```
  WALKTHROUGH
  Start here.
  Place items in
  the chest.
  ```
- Wall sign:
  ```
  Step 10 of 10
  Walk the whole
  pipeline. Read
  every sign.
  ```

---

## 5. Reflection Questions

After completing the build and walkthrough, consider these questions. Discuss with a partner if possible, or write your answers on signs in the build.

### Question 1: Bottlenecks
**"What would happen if Room 3 (Transform) processed data slower than the other rooms?"**

The entire pipeline would slow to the speed of Room 3. Rooms 1 and 2 would fill up with unprocessed data. The buffer (hopper chain) before Room 3 would fill up. Eventually, Room 1 would have to stop accepting new data. This is a **bottleneck** -- the slowest stage determines the maximum throughput of the entire pipeline.

### Question 2: Resource Allocation
**"Why is Room 3 bigger than the others?"**

Because transformation is typically the most resource-intensive operation. In real systems, transformation stages get allocated more CPU cores, more memory, and more processing time. The physical size of the room makes this resource difference tangible -- you can see and feel that this stage needs more space to do its work.

### Question 3: Error Handling
**"What does the branching corridor in Step 4 represent in a real system?"**

It represents error handling and dead letter queues. When data fails validation, it cannot continue through the pipeline -- it would cause cascading failures in downstream stages. Instead, the error branch routes failed data to a separate location where it can be inspected, fixed, and potentially reprocessed. Without this branch, one bad record could crash the entire pipeline.

### Question 4: Backpressure
**"Why did we add a hopper buffer before the Transform room?"**

Because the Transform room processes data more slowly (it has more work to do). Without the buffer, data arriving from Validation would have nowhere to go while Transform is busy. The buffer absorbs temporary speed mismatches between stages, allowing the pipeline to handle bursts of incoming data without losing anything.

### Question 5: Horizontal Scaling
**"How would you add a second Transform room for parallel processing?"**

You would create a second 7x7 room next to Room 3, with a branching corridor from Room 2 that splits data between the two Transform rooms (like a load balancer). Both rooms would then merge their output into a single corridor leading to Room 4. This is **horizontal scaling** -- adding more instances of the bottleneck stage to increase throughput.

---

## 6. Real-World Connections

The pipeline you just built is not a toy -- it is the exact architecture used by real systems at massive scale. Here is how your Minecraft build maps to actual technologies.

### Unix Pipes

The most direct analogy. The Unix command:
```bash
cat access.log | grep "ERROR" | sort | uniq -c | sort -rn | head -10
```
is a 6-stage pipeline where each command is a processing stage (room) and the pipe (`|`) is a corridor. Data flows left to right, each stage transforms the data, and the output of one stage feeds the input of the next.

### Apache Kafka Streams

Kafka is a distributed streaming platform where data flows through "topics" (corridors) between "consumers" (rooms). Your Intake Room is a Kafka producer. Your corridors are Kafka topics. Your processing rooms are Kafka consumers. The hopper buffer is Kafka's built-in message retention. The error branch is Kafka's dead letter topic.

### AWS Step Functions

Amazon's serverless orchestration service connects Lambda functions (rooms) in sequence. Each function does one transformation. The pipeline you built is visually identical to an AWS Step Functions state machine diagram -- rooms connected by arrows.

### CI/CD Pipelines

When you push code to GitHub, it enters a pipeline: build -> test -> lint -> deploy. Each stage is a room. If tests fail, the code goes to the error path (build fails). If all stages pass, the code reaches the output (deployed to production). Jenkins, GitHub Actions, and GitLab CI all implement exactly this pattern.

### The Spatial Experience Maps to Data Flow Diagrams

The walk you took through the pipeline is literally what software architects draw on whiteboards -- boxes connected by arrows. The difference is that you can walk through your version. You can feel the distance between stages (latency). You can see the size differences (resource allocation). You can stand at the branch point and understand the decision (routing logic).

---

## 7. Extension Ideas

Finished the main build? Try these extensions to explore more pipeline concepts.

### Extension 1: Monitoring Tower (Observability)

Build a 3x3 tower next to the pipeline, tall enough to see into every room from above. Place glass floors at the top so you can look down. Add signs explaining what you are monitoring (throughput, error rate, stage health). This represents **observability** -- the ability to see what is happening inside a system without being part of the data flow.

### Extension 2: Parallel Processing Path

Split Corridor 2 into two paths after the Validation Room. Build a second Transform Room (Room 3B) identical to Room 3. Both paths merge back into a single corridor before the Enrichment Room. This represents **parallel processing** -- doing the same work in two places at once to increase throughput.

### Extension 3: Replay Mechanism

Build a corridor from the Output Room back to the Intake Room, creating a loop. Add a lever that "opens" this corridor. This represents a **replay mechanism** -- the ability to re-process data through the pipeline. Used for reprocessing after bug fixes, testing with historical data, or recovering from partial failures.

### Extension 4: Schema Evolution

Add a second floor to the Transform Room. The ground floor uses the original crafting tables. The second floor uses different crafting tables (representing a new transformation version). Add a lever to switch between floors. This represents **schema evolution** -- how pipelines handle changes in data format over time.

---

## 8. Build Checklist

Before calling this build complete, verify:

- [ ] All 5 rooms are built with stone brick walls and 4-block ceilings
- [ ] All corridors use cyan glazed terracotta with directional arrows
- [ ] The Error Room uses red concrete walls and red glazed terracotta floor
- [ ] Every room has a title sign and at least one concept sign
- [ ] The Transform Room (Room 3) is 7x7 -- visibly larger than the 5x5 rooms
- [ ] The hopper buffer chain is visible in Corridor 3
- [ ] The Intake Room has a glass front wall
- [ ] The Output Room has a glass rear wall and green concrete accents
- [ ] Redstone comparators work in Rooms 2 and 5
- [ ] All direction signs point the correct way
- [ ] You have walked the complete pipeline end-to-end at least once
- [ ] You have considered at least 3 of the 5 reflection questions

---

*This guided build is part of the Knowledge World Educational Curriculum.*
*Methodology: [System Architecture as Buildings](../../methodology/system-architecture-as-buildings.md)*
*Phase 189 -- Educational Curriculum, GSD Skill Creator v1.22*
