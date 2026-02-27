sc-config(5)

# NAME

sc-config - GSD Skill Creator configuration file format

# DESCRIPTION

The GSD Skill Creator uses JSON configuration files at two levels:

- Project-level: _.sc-config.json_ in the project root
- User-level: _~/.config/gsd-os/config.json_

Project-level settings override user-level defaults.

# SCHEMA

The configuration file is a JSON object with the following fields:

*name* (string)
	Project name.

*version* (string)
	Project version following semver.

*profile* (string)
	Execution profile: "quality", "balanced", or "speed". Controls which
	model is used for executor agents.

*mode* (string)
	Interaction mode: "yolo" (autonomous) or "interactive" (with
	checkpoints).

*verbosity* (integer, 1-5)
	Output verbosity level. 1 = silent, 3 = standard, 5 = transparent.

*commit_docs* (boolean)
	Whether to commit .planning/ files. Default: false.

# DEFAULTS

```
{
  "name": "my-project",
  "version": "0.1.0",
  "profile": "balanced",
  "mode": "interactive",
  "verbosity": 3,
  "commit_docs": false
}
```

# EXAMPLES

Minimal configuration:

```
{
  "name": "my-app",
  "version": "1.0.0"
}
```

Full configuration with quality profile:

```
{
  "name": "my-app",
  "version": "2.0.0",
  "profile": "quality",
  "mode": "yolo",
  "verbosity": 4,
  "commit_docs": true
}
```

# SEE ALSO

*skill-creator*(1), *gsd-os*(1)

# AUTHORS

Maintained by the GSD project. See _https://github.com/Tibsfox/gsd-skill-creator_.
