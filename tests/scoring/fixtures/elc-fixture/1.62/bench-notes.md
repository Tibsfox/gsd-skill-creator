# Bench notes — Surveyor 5 alpha-scatterer preamp replication

## Parts list

| Ref | Era-original | Modern bench substitute | Vendor |
|-----|---|---|---|
| U1  | µA709 (1968) | LF411 | [Mouser µA709](https://www.mouser.com/ProductDetail/595-UA709CD) |
| U2  | matched JFET pair | LSK489 | [Digi-Key LSK489](https://www.digikey.com/en/products/detail/linear-systems/LSK489B/2257049) |
| R1  | 1 kΩ 1% | 1 kΩ 0.1% | [Mouser CRCW](https://www.mouser.com/ProductDetail/71-CRCW0805-1.00K-E3) |

## Procedure

1. Wire breadboard per `spice/flight-circuit.cir`.
2. Apply 1 kHz signal to V1, sweep amplitude.
3. Capture scope trace at `out`; compare to measurement-prediction.md.
