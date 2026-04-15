# sm-porting-team

Port or translate code while preserving behavior. Cartographer identifies coupling and platform-specific surfaces, porter-translator does the actual move in test-backed slices, reviewer audits the correspondence table and the behavioral test suite.

**Roster:** `sm-codebase-cartographer`, `sm-porter-translator`, `sm-reviewer`.

**Use when:** moving code to a new platform, rewriting a module in a different language, or running a staged cutover where both implementations live side by side
