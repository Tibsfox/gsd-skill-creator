# Capstone -- Apollo 11 1202 alarm reproduction
#
# Reproduces the overload that triggered BAILOUT during lunar descent.
# Contains job bodies for P63 guidance, rendezvous radar, display update,
# background task, and filler jobs. Used with the Executive, BAILOUT,
# and restart point registration to recreate the Apollo 11 scenario.
#
# Curriculum Exercise 8: Reproducing the 1202 Alarm

SETLOC   4000

# P63 Guidance (CRITICAL -- priority 0)
# Continuous guidance computation: reads IMU, computes, writes command
P63      CA     GDATA        # Load guidance state
         AD     DELTA        # Compute next guidance command
         TS     GDATA        # Update state
         EXTEND
         WRITE  10           # Output guidance command to channel 10
         TC     P63          # Continue guidance loop

# Rendezvous Radar (IMPORTANT -- priority 2)
# Simulates radar stealing CPU cycles with I/O reads
RADAR    EXTEND
         READ   33           # Read radar channel (simulates RUPT overhead)
         CA     RCOUNT
         AD     ONE
         TS     RCOUNT       # Count radar iterations
         TC     RADAR

# Display Update (DEFERRABLE -- no restart point)
# Updates DSKY with mission status
DSKYUP   CA     DDATA
         EXTEND
         WRITE  11           # Channel 11: DSKY relay word 2
         CA     DDATA
         AD     ONE
         TS     DDATA
         TC     DSKYUP

# Background Task (DEFERRABLE -- no restart point)
BKGND    CA     BCOUNT
         AD     ONE
         TS     BCOUNT
         TC     BKGND

# Filler jobs -- represent the accumulation of tasks
FILL1    TC     FILL1        # Busy loop
FILL2    TC     FILL2
FILL3    TC     FILL3

# Constants and variables
ONE      DEC    1
DELTA    DEC    5            # Guidance delta per iteration
GDATA    ERASE              # Guidance state
RCOUNT   ERASE              # Radar iteration count
DDATA    ERASE              # Display data
BCOUNT   ERASE              # Background count

# Restart addresses (only CRITICAL and IMPORTANT jobs register these)
P63RST   TC     P63          # Guidance restart: resume P63
RADRST   TC     RADAR        # Radar restart: resume radar
