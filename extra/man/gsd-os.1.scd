gsd-os(1)

# NAME

gsd-os - GSD-OS Desktop Application

# SYNOPSIS

*gsd-os* [OPTIONS]

# DESCRIPTION

GSD-OS is a desktop application for the Get Shit Done project management
framework. It provides a tmux-integrated terminal, Claude AI assistant,
file watcher, and dashboard in a unified desktop environment built with
Tauri.

# OPTIONS

*--version*
	Print version and exit.

*--help*
	Show help message.

*--headless*
	Run in headless agent mode without GUI.

*--new-project*
	Launch with new project creation dialog.

# ENVIRONMENT

*XDG_CONFIG_HOME*
	User configuration directory. Defaults to _~/.config_.
	GSD-OS stores its configuration in _$XDG_CONFIG_HOME/gsd-os/_.

*XDG_DATA_HOME*
	User data directory. Defaults to _~/.local/share_.
	GSD-OS stores persistent data in _$XDG_DATA_HOME/gsd-os/_.

*XDG_STATE_HOME*
	User state directory. Defaults to _~/.local/state_.
	GSD-OS stores logs and history in _$XDG_STATE_HOME/gsd-os/_.

*XDG_CACHE_HOME*
	User cache directory. Defaults to _~/.cache_.
	GSD-OS stores cached data in _$XDG_CACHE_HOME/gsd-os/_.

# FILES

_~/.config/gsd-os/config.json_
	User configuration file.

_~/.local/share/gsd-os/_
	Persistent data (skills, patterns, agent state).

_~/.local/state/gsd-os/_
	Logs and session history.

# SEE ALSO

*skill-creator*(1), *sc-config*(5)

# AUTHORS

Maintained by the GSD project. See _https://github.com/Tibsfox/gsd-skill-creator_.
