# Priority -- high-priority guidance preempts low-priority display
#
# Two job bodies: guidance (priority 0, writes to channel 10) and
# display (priority 6, writes to channel 11). Used with the Executive
# to demonstrate that the highest-priority RUNNABLE job always runs.
#
# Curriculum Exercise 6: Priority Preemption

SETLOC   4000

# Guidance job (priority 0 -- highest)
GUIDE    CA     GCOUNT       # Load guidance iteration counter
         AD     ONE          # Increment
         TS     GCOUNT
         EXTEND
         WRITE  10           # Report iteration on channel 10
         TC     GUIDE        # Continue (cooperative -- no yield)

# Display job (priority 6 -- low)
DISPLY   CA     DCOUNT       # Load display counter
         AD     ONE
         TS     DCOUNT
         EXTEND
         WRITE  11           # Report on channel 11 (different channel)
         TC     DISPLY

ONE      DEC    1
GCOUNT   ERASE
DCOUNT   ERASE
