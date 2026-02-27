skill-creator(1)

# NAME

skill-creator - GSD Skill Creator CLI

# SYNOPSIS

*skill-creator* <command> [OPTIONS]++
*sc* <command> [OPTIONS]

# DESCRIPTION

The GSD Skill Creator CLI manages skills, agents, teams, and chipsets for
Claude Code. It provides commands for project initialization, pack
management, contribution workflows, website staging, and adaptive learning.

# COMMANDS

*project*
	Manage skill-creator projects. Subcommands: init, list, status.

*pack*
	Manage educational and skill packs. Subcommands: list, info.

*contrib*
	Contribution workflow management. Subcommands: status, list.

*www*
	Website staging and deployment. Subcommands: status.

*learn*
	Adaptive learning — ingest external resources into skills.

*unlearn*
	Remove previously learned material from skills.

*orchestrator*
	GSD orchestrator commands for discovery, classification, and lifecycle.

# OPTIONS

*--version*
	Print version and exit.

*--help*
	Show help message.

*--verbose*
	Enable verbose output.

# ENVIRONMENT

*XDG_CONFIG_HOME*
	User configuration directory. Defaults to _~/.config_.
	Configuration stored in _$XDG_CONFIG_HOME/gsd-os/_.

*XDG_DATA_HOME*
	User data directory. Defaults to _~/.local/share_.
	Skill data stored in _$XDG_DATA_HOME/gsd-os/_.

*XDG_CACHE_HOME*
	User cache directory. Defaults to _~/.cache_.
	Cached data stored in _$XDG_CACHE_HOME/gsd-os/_.

# FILES

_.sc-config.json_
	Project-level configuration file (in project root).

_~/.config/gsd-os/config.json_
	User-level configuration file.

# SEE ALSO

*gsd-os*(1), *sc-config*(5)

# AUTHORS

Maintained by the GSD project. See _https://github.com/Tibsfox/gsd-skill-creator_.
