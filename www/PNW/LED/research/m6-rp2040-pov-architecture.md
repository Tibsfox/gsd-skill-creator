# RP2040 Dual-Core POV Architecture

The RP2040 microcontroller is exceptionally well-suited for POV display control. Its dual ARM Cortex-M0+ cores, eight PIO state machines, and DMA engine provide the deterministic, high-throughput data pipeline that POV demands. This page presents a complete system architecture: hardware block diagram, PIO configuration, DMA strategy, rotation sensing, polar coordinate mapping, and power delivery.

---

## System Block Diagram

```
                    RP2040 (264KB SRAM, 2MB Flash)
    +----------------------------------------------------------+
    |                                                          |
    |  Core 0 (LED Output)          Core 1 (Control)          |
    |  +-------------------+        +--------------------+     |
    |  | SPI DMA engine    |        | Rotation timing    |     |
    |  | Column scheduler  |        | Image loader       |     |
    |  | Buffer read ptr   |        | Polar LUT compute  |     |
    |  +--------+----------+        | Buffer write ptr   |     |
    |           |                   +--------+-----------+     |
    |           v                            |                 |
    |  +-------------------+        +--------+-----------+     |
    |  | PIO Block 0       |        | PIO Block 1        |     |
    |  | SM0: SPI CLK+DATA |        | SM1: Hall sensor   |     |
    |  | SM1: (spare)      |        | SM2: (spare)       |     |
    |  | SM2: (spare)      |        | SM3: (spare)       |     |
    |  | SM3: (spare)      |        |                    |     |
    |  +--------+----------+        +--------+-----------+     |
    |           |                            |                 |
    +-----------|----------------------------|------------------+
                |                            |
                v                            v
    +-----------+--------+      +-----------+-----------+
    | APA102 LED Strip   |      | Hall Effect Sensor    |
    | CLK + DATA (SPI)   |      | + Schmitt Trigger     |
    | 5V power rail      |      | (1 pulse/revolution)  |
    +--------------------+      +-----------------------+
                |
    +-----------+-----------+
    | Power Delivery        |
    | Slip Ring or Inductive |
    | 5V @ 5-10A            |
    +-----------------------+
```

---

## Core Assignment Strategy

### Core 0: LED Output (Real-Time Critical)

Core 0 handles the time-critical LED update pipeline. Its responsibilities:

1. **Column scheduling** -- When a pixel time boundary occurs, begin the next SPI transfer
2. **DMA management** -- Configure DMA channels to stream column data from the frame buffer to the PIO SPI TX FIFO
3. **Double-buffer reads** -- Read from the current front buffer; never the buffer being written

Core 0 runs in a tight loop with interrupts only from the DMA completion and the PIO-generated timing signals. No file I/O, no floating-point math, no dynamic memory allocation.

### Core 1: Control and Computation

Core 1 handles everything that is not cycle-critical:

1. **Rotation timing** -- Process Hall sensor interrupts to measure revolution period and calculate pixel timing
2. **Image loading** -- Read image data from SPI flash (the RP2040's XIP flash)
3. **Polar coordinate mapping** -- Convert rectangular source images to radial frame buffers
4. **Buffer swapping** -- Signal Core 0 when a new back buffer is ready
5. **Animation sequencing** -- Advance to the next frame in an animation sequence

This core can tolerate variable-latency operations (flash reads, floating-point polar transforms) because it runs ahead of Core 0 -- preparing the next frame while the current one is being displayed.

---

## PIO State Machine Configuration

The RP2040 has two PIO blocks, each with four state machines. Each state machine has a 32-instruction program memory, runs at up to 133 MHz, and operates independently of the ARM cores.

### PIO SM0: SPI Clock and Data Output

This state machine generates the SPI clock and shifts out data bits. The APA102 protocol requires only two signals: CLK and DATA (MOSI). No chip select is needed.

```c
// PIO program: SPI master TX-only at programmable clock rate
// Shifts 32 bits MSB-first, generates clock on sideset pin
.program apa102_spi
.side_set 1
.wrap_target
    out pins, 1     side 0   ; Output data bit, clock LOW
    nop             side 1   ; Clock HIGH (data latched by APA102 on rising edge)
.wrap

// C initialization
static inline void apa102_spi_program_init(PIO pio, uint sm,
    uint offset, uint data_pin, uint clk_pin, float clk_div)
{
    pio_sm_config c = apa102_spi_program_get_default_config(offset);

    // Data pin (OUT)
    sm_config_set_out_pins(&c, data_pin, 1);
    pio_gpio_init(pio, data_pin);
    pio_sm_set_consecutive_pindirs(pio, sm, data_pin, 1, true);

    // Clock pin (sideset)
    sm_config_set_sideset_pins(&c, clk_pin);
    pio_gpio_init(pio, clk_pin);
    pio_sm_set_consecutive_pindirs(pio, sm, clk_pin, 1, true);

    // Shift 32 bits MSB-first, autopull
    sm_config_set_out_shift(&c, false, true, 32);

    // Clock divider: 133MHz / (2 * clk_div) = SPI clock
    // For 24 MHz SPI: clk_div = 133 / (2 * 24) = 2.77
    sm_config_set_clkdiv(&c, clk_div);

    pio_sm_init(pio, sm, offset, &c);
    pio_sm_set_enabled(pio, sm, true);
}
```

The PIO program is only 2 instructions. Each iteration shifts one data bit and generates one clock cycle. With autopull enabled, the PIO automatically pulls the next 32-bit word from the TX FIFO when the shift register empties.

### PIO SM1: Hall Sensor Input with Edge Detection

This state machine watches the Hall sensor pin and generates an interrupt on the falling edge (when the magnet passes the sensor):

```c
// PIO program: wait for falling edge, signal IRQ
.program hall_sensor
.wrap_target
    wait 1 pin 0         ; Wait for pin HIGH (magnet not present)
    wait 0 pin 0         ; Wait for pin LOW (magnet arrives)
    irq set 0            ; Signal IRQ 0 to Core 1
.wrap

// C initialization
static inline void hall_sensor_program_init(PIO pio, uint sm,
    uint offset, uint sensor_pin)
{
    pio_sm_config c = hall_sensor_program_get_default_config(offset);

    sm_config_set_in_pins(&c, sensor_pin);
    pio_gpio_init(pio, sensor_pin);
    pio_sm_set_consecutive_pindirs(pio, sm, sensor_pin, 1, false);

    // Enable pull-up if sensor is open-drain
    gpio_pull_up(sensor_pin);

    pio_sm_init(pio, sm, offset, &c);
    pio_sm_set_enabled(pio, sm, true);
}
```

The Hall sensor interrupt is handled on Core 1. The interrupt handler reads the system timer (`time_us_64()`) to measure the exact revolution period, then calculates the pixel timing for the next revolution.

---

## DMA Pipeline

DMA (Direct Memory Access) allows data transfer from SRAM to the PIO TX FIFO without CPU involvement. This is the key to Core 0's efficiency -- it sets up the DMA transfer and then waits for the next pixel boundary.

### DMA Channel Configuration

```c
#define NUM_LEDS       150
#define BYTES_PER_LED  4       // APA102: 1 brightness + 3 color
#define START_FRAME    4       // 4 bytes of 0x00
#define END_FRAME     12       // ceil(150/2/8)*4 rounded up

// Total SPI frame = START + LED data + END
#define FRAME_BYTES    (START_FRAME + (NUM_LEDS * BYTES_PER_LED) + END_FRAME)

static uint8_t frame_buffer[2][FRAME_BYTES];  // Double buffer
static volatile int front_buffer = 0;

void dma_init_for_pio(PIO pio, uint sm) {
    uint dma_chan = dma_claim_unused_channel(true);

    dma_channel_config c = dma_channel_get_default_config(dma_chan);
    channel_config_set_transfer_data_size(&c, DMA_SIZE_8);
    channel_config_set_dreq(&c, pio_get_dreq(pio, sm, true));
    channel_config_set_read_increment(&c, true);
    channel_config_set_write_increment(&c, false);

    dma_channel_configure(
        dma_chan,
        &c,
        &pio->txf[sm],                           // Write to PIO TX FIFO
        frame_buffer[front_buffer],               // Read from front buffer
        FRAME_BYTES / 4,                          // Transfer count (32-bit words)
        false                                     // Don't start yet
    );
}
```

### Column Update Flow

On each pixel time boundary:

```c
void output_column(uint16_t column_index) {
    // 1. Point DMA at the correct column in the frame buffer
    uint8_t *col_data = &frame_buffer[front_buffer][column_index * FRAME_BYTES];

    // 2. Wait for any previous DMA to complete
    dma_channel_wait_for_finish_blocking(dma_chan);

    // 3. Reconfigure read address and restart
    dma_channel_set_read_addr(dma_chan, col_data, true);  // true = start

    // 4. DMA runs autonomously; Core 0 is free until next pixel boundary
}
```

In practice, the frame buffer is organized as a flat array of preformatted SPI frames (including start/end markers), so the DMA can stream each column directly without per-pixel formatting.

---

## Rotation Sensing and Timing

### Hardware: Hall Effect Sensor

The A3144 is a unipolar Hall effect switch:

```
         +-----+
  VCC ---| A3144 |--- OUT (open collector, needs pull-up)
  GND ---|       |
         +-----+

Schmitt trigger debouncing circuit:
                   10K
  A3144 OUT ---/\/\/--- + ----> RP2040 GPIO (with internal pull-up)
                        |
                    100nF
                        |
                       GND

The RC filter (10K + 100nF, tau = 1ms) removes bounce.
The RP2040's Schmitt trigger input further cleans the edge.
```

One small neodymium magnet is mounted on the stationary frame. As the arm rotates past the magnet, the Hall sensor output transitions LOW, triggering the PIO edge-detection state machine.

### Revolution Period Measurement

```c
static volatile uint64_t last_pulse_us = 0;
static volatile uint32_t revolution_period_us = 33333;  // Default: 1800 RPM
static volatile uint32_t pixel_time_us = 185;           // Default: 180 pixels

void pio_irq_handler(void) {
    pio_interrupt_clear(pio1, 0);

    uint64_t now = time_us_64();
    uint32_t period = (uint32_t)(now - last_pulse_us);
    last_pulse_us = now;

    // Sanity check: reject if <10ms (>6000 RPM) or >100ms (<600 RPM)
    if (period > 10000 && period < 100000) {
        revolution_period_us = period;
        pixel_time_us = period / ANGULAR_PIXELS;
    }

    // Signal Core 0: new revolution begins
    multicore_fifo_push_nb(pixel_time_us);
}
```

The adaptive timing measurement means the display automatically adjusts to motor speed variations. If the motor slows due to load, the pixel time stretches and the image remains stable (though refresh rate drops).

---

## Polar Coordinate Image Mapping

### The Mapping Problem

Source images are rectangular (width x height pixels). The POV display is polar (radius x angle). A lookup table (LUT) maps each (r, theta) display position to the corresponding (x, y) source pixel.

```
Source image (rectangular):            POV display (polar):
  +------------------+
  |                  |                      .  .  .
  |    (x, y)        |                  .    ooooo    .
  |       *          |                .   ooo     ooo   .
  |                  |               .  oo    * r    oo  .
  |                  |                .   ooo theta ooo   .
  +------------------+                 .    ooooo    .
                                          .  .  .

  Mapping: for each (r, theta) in the display,
           compute (x, y) in the source image
```

### LUT Precomputation

```c
#define RADIAL_PIXELS   150
#define ANGULAR_PIXELS  180
#define IMG_WIDTH       300
#define IMG_HEIGHT      300

typedef struct {
    uint16_t src_x;
    uint16_t src_y;
} pixel_map_t;

static pixel_map_t polar_lut[ANGULAR_PIXELS][RADIAL_PIXELS];

void compute_polar_lut(void) {
    float cx = IMG_WIDTH / 2.0f;
    float cy = IMG_HEIGHT / 2.0f;
    float max_r = fminf(cx, cy);

    for (int theta_idx = 0; theta_idx < ANGULAR_PIXELS; theta_idx++) {
        float theta = (2.0f * M_PI * theta_idx) / ANGULAR_PIXELS;

        for (int r_idx = 0; r_idx < RADIAL_PIXELS; r_idx++) {
            float r_norm = (float)r_idx / RADIAL_PIXELS;
            float r = r_norm * max_r;

            float x = r * cosf(theta) + cx;
            float y = r * sinf(theta) + cy;

            // Clamp to image bounds
            int ix = (int)(x + 0.5f);
            int iy = (int)(y + 0.5f);

            if (ix >= 0 && ix < IMG_WIDTH && iy >= 0 && iy < IMG_HEIGHT) {
                polar_lut[theta_idx][r_idx].src_x = ix;
                polar_lut[theta_idx][r_idx].src_y = iy;
            } else {
                polar_lut[theta_idx][r_idx].src_x = 0xFFFF;  // Sentinel: black
                polar_lut[theta_idx][r_idx].src_y = 0xFFFF;
            }
        }
    }
}
```

LUT size: 180 x 150 x 4 bytes = 108 KB. This fits in SRAM alongside one frame buffer, but not two. In practice, store the LUT in flash and read via XIP (execute-in-place), which is fast enough for sequential access patterns.

### Rendering a Column from the LUT

```c
void render_column(uint16_t theta_idx, uint8_t *column_buf,
                   const uint8_t *source_image)
{
    // Write start frame
    memset(column_buf, 0x00, 4);
    uint8_t *p = column_buf + 4;

    for (int r = 0; r < RADIAL_PIXELS; r++) {
        pixel_map_t pm = polar_lut[theta_idx][r];

        if (pm.src_x == 0xFFFF) {
            // Outside image: black
            *p++ = 0xE0 | GLOBAL_BRIGHTNESS;  // Header + brightness
            *p++ = 0;   // Blue
            *p++ = 0;   // Green
            *p++ = 0;   // Red
        } else {
            uint32_t offset = (pm.src_y * IMG_WIDTH + pm.src_x) * 3;
            *p++ = 0xE0 | GLOBAL_BRIGHTNESS;
            *p++ = source_image[offset + 2];  // Blue
            *p++ = source_image[offset + 1];  // Green
            *p++ = source_image[offset + 0];  // Red
        }
    }

    // Write end frame
    memset(p, 0xFF, END_FRAME);
}
```

---

## Wireless Power Delivery

A spinning POV arm cannot use fixed wires for power. Two approaches exist:

### Option 1: Slip Rings

A slip ring is an electromechanical device with rotating contacts:

```
        Stationary Side         Rotating Side
        +-----------+           +-----------+
  5V ---|  Ring 1   |==brush====|  Ring 1   |--- 5V to LEDs
 GND ---|  Ring 2   |==brush====|  Ring 2   |--- GND
 SIG ---|  Ring 3   |==brush====|  Ring 3   |--- (optional data)
        +-----------+           +-----------+
```

| Parameter | Typical Spec |
|-----------|-------------|
| Current per ring | 2A (standard), 10A (high-current) |
| Voltage drop | 50-200 mV per ring |
| RPM rating | 300-3000 RPM |
| Lifespan | 10-50 million revolutions |
| Noise | Electrical noise from brush contact; add 100uF cap on rotating side |
| Cost | $8-15 (6-wire capsule type) |

**Pros:** Simple, high current capacity, standard component.
**Cons:** Mechanical wear, contact noise, periodic replacement needed.

### Option 2: Inductive (Wireless) Power Transfer

An air-core transformer with a stationary primary coil and a rotating secondary coil:

```
  Stationary:                     Rotating:
  +--------+                      +--------+
  | Primary |   ~~ magnetic ~~   | Secondary |
  |  coil   |   ~~ coupling ~~  |   coil    |
  +----+----+                    +----+-----+
       |                              |
  Oscillator                     Rectifier +
  (50-200 kHz)                   regulator (5V)
```

| Parameter | Typical Spec |
|-----------|-------------|
| Efficiency | 60-85% (gap and alignment dependent) |
| Power | 5-25W typical for hobby scale |
| Gap tolerance | 1-5mm air gap |
| Cost | $15-30 (Qi transmitter + custom secondary) |
| Lifespan | Unlimited (no contact) |

**Pros:** No wear, no noise, unlimited lifespan.
**Cons:** Lower efficiency, heat generation, more complex electronics, alignment-sensitive.

> **SAFETY WARNING:** Inductive power transfer coils generate significant electromagnetic fields at 50-200 kHz. Keep pacemakers and other medical devices away from operating POV displays with inductive power. The rotating secondary coil and rectifier add weight to the arm, affecting balance.

For most hobbyist POV projects, a **capsule slip ring** is the practical choice. Reserve inductive coupling for commercial or sealed designs where maintenance-free operation is required.

---

## PCB Design for High-G Environments

### Component Placement Rules

At 1800 RPM with a 150mm arm radius, components at the tip experience 543 G (see [POV Physics](m6-pov-physics.md) for the calculation). PCB design must account for this:

```
    Rotation axis
         |
         |   Heavy components HERE (low G)
    [MCU]o   RP2040, capacitors, connectors
         |
    [LED]|   LED strip solder points
    [LED]|   oriented radially
    [LED]|
    [LED]|
         |   Light components OK here
    [sensor]  Hall sensor at tip (minimal mass)
         |
       (tip)  Highest G -- minimize mass
```

Design rules:

1. **Orient SMD components radially** so centrifugal force pushes them into their solder pads (not peeling them away)
2. **Place heavy components near the axis** where centrifugal force is lowest
3. **Use conformal coating** to prevent component lift at high G
4. **Add mechanical retention** for through-hole connectors (epoxy, lock washers)
5. **Route traces radially** where possible -- radial traces experience tension, not shear
6. **Use wider traces** near the tip where vibration stress is highest

### Recommended PCB Stackup

For a simple 2-layer POV arm:

```
Layer 1 (top):    Signal traces + component pads
                  Ground pour around signals
Layer 2 (bottom): Continuous ground plane + 5V power pour

Board thickness:  1.6mm (standard FR4)
Copper weight:    2 oz (for current capacity on power traces)
Board outline:    Narrow strip, 15-20mm wide, 150-300mm long
Mounting:         Central hub clamp with set screws
```

---

## Complete Main Loop (Both Cores)

### Core 0: LED Output Loop

```c
void core0_main(void) {
    // Initialize PIO SPI
    PIO pio = pio0;
    uint sm = 0;
    uint offset = pio_add_program(pio, &apa102_spi_program);
    apa102_spi_program_init(pio, sm, offset, DATA_PIN, CLK_PIN, 2.77f);

    // Initialize DMA
    dma_init_for_pio(pio, sm);

    uint16_t column = 0;

    while (true) {
        // Wait for pixel time boundary (set by Core 1 via timer alarm)
        // Uses a hardware alarm for deterministic timing
        while (!pixel_timer_fired) {
            tight_loop_contents();
        }
        pixel_timer_fired = false;

        // Output current column
        output_column(column);

        // Advance to next angular position
        column++;
        if (column >= ANGULAR_PIXELS) {
            column = 0;
            // Check for buffer swap signal from Core 1
            if (multicore_fifo_rvalid()) {
                uint32_t new_pixel_time = multicore_fifo_pop_blocking();
                update_pixel_timer(new_pixel_time);
                swap_front_buffer();
            }
        }
    }
}
```

### Core 1: Control Loop

```c
void core1_main(void) {
    // Initialize Hall sensor PIO
    PIO pio = pio1;
    uint sm = 0;
    uint offset = pio_add_program(pio, &hall_sensor_program);
    hall_sensor_program_init(pio, sm, offset, HALL_PIN);

    // Enable PIO interrupt
    irq_set_exclusive_handler(PIO1_IRQ_0, pio_irq_handler);
    irq_set_enabled(PIO1_IRQ_0, true);
    pio_set_irq0_source_enabled(pio, pis_interrupt0, true);

    // Compute initial polar LUT
    compute_polar_lut();

    // Load first image from flash
    const uint8_t *image = load_image_from_flash(0);

    // Pre-render all columns into back buffer
    for (int col = 0; col < ANGULAR_PIXELS; col++) {
        render_column(col, get_back_buffer_column(col), image);
    }

    // Signal Core 0: back buffer is ready
    signal_buffer_ready();

    // Main control loop
    uint32_t frame_index = 0;
    while (true) {
        // Wait for revolution complete signal
        __wfi();  // Wait For Interrupt (low power until Hall pulse)

        // Load next animation frame (if animated)
        frame_index = (frame_index + 1) % NUM_FRAMES;
        image = load_image_from_flash(frame_index);

        // Render all columns into back buffer
        for (int col = 0; col < ANGULAR_PIXELS; col++) {
            render_column(col, get_back_buffer_column(col), image);
        }

        // Signal Core 0: new buffer ready for swap at next revolution
        signal_buffer_ready();
    }
}

int main(void) {
    stdio_init_all();

    // Launch Core 1
    multicore_launch_core1(core1_main);

    // Core 0 runs the LED output loop
    core0_main();

    return 0;  // Never reached
}
```

---

## Performance Summary

| Metric | Value |
|--------|-------|
| SPI clock | 24 MHz (PIO-generated) |
| 150-LED update time | ~225 us |
| Angular resolution | 120-180 pixels (at 1800 RPM) |
| Radial resolution | 150 pixels |
| Frame buffer size | 108 KB per buffer |
| Double buffer total | 216 KB (of 264 KB SRAM) |
| Core 0 utilization | ~80% (DMA + timing) |
| Core 1 utilization | ~40% (image processing + idle) |
| Revolution sensing jitter | <1 us (PIO hardware timing) |
| Power consumption (MCU) | ~100 mW |
| Power consumption (150 LEDs, full white) | 45 W |

---

## Key Takeaways

- Core 0 handles time-critical SPI DMA output; Core 1 handles rotation sensing and image processing
- PIO state machines provide deterministic nanosecond-precision SPI and edge detection with only 2-3 instructions each
- DMA streams preformatted column data from SRAM to PIO without CPU involvement
- Polar coordinate LUT is precomputed once per image load, converting per-revolution rendering to indexed reads
- Hall effect sensor with Schmitt trigger provides clean once-per-revolution reference pulses
- Slip rings are the practical power delivery choice; inductive coupling for maintenance-free designs
- PCB components must be oriented radially and weighted toward the axis to survive 500+ G centrifugal loads

---

## Cross-References

- [POV Physics](m6-pov-physics.md) -- Temporal integration, angular resolution, and centrifugal force calculations
- [APA102 POV Design](m6-apa102-pov-design.md) -- Protocol timing analysis and strip selection
- [RP2040 PIO State Machines](m2-rp2040-pio.md) -- PIO architecture fundamentals and programming
- [APA102 SPI Protocol](m3-apa102-spi.md) -- SPI frame structure and clocking details
- [ESP32 LED Control](m2-esp32-led.md) -- Alternative MCU for non-POV LED projects
- [Glossary](00-glossary.md) -- Definitions of terms used throughout this series

---

*Sources: Raspberry Pi Foundation RP2040 datasheet, Raspberry Pi Pico C/C++ SDK documentation, Cornell ECE4760 "POV Display with RP2040" project (Hunter Adams), PIO programming guide (Chapter 3, RP2040 datasheet), Adafruit RP2040 DMA examples, SparkFun RP2040 hookup guide, A3144 Hall effect sensor datasheet.*
