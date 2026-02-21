# Scheduler -- job body that identifies itself via I/O
#
# Three job bodies at different addresses, each writing a unique
# identifier to channel 10. Used with the Executive's novac() and
# scheduleNext() to demonstrate priority-based job scheduling.
#
# Curriculum Exercise 5: Executive Job Scheduling

SETLOC   4000

JOB1     CA     ID1          # Job 1 identifies itself
         EXTEND
         WRITE  10           # Write to channel 10
         TC     JOB1         # Loop (job runs until preempted)

JOB2     CA     ID2          # Job 2
         EXTEND
         WRITE  10
         TC     JOB2

JOB3     CA     ID3          # Job 3
         EXTEND
         WRITE  10
         TC     JOB3

ID1      OCT    00001        # Job 1 marker
ID2      OCT    00002        # Job 2 marker
ID3      OCT    00003        # Job 3 marker
