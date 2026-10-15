# Shared Agent Resources

The canonical project resource folder. File responsibilities are defined once in [File Ownership](../context/ownership.md); project entry instructions remain in [AGENTS.md](../AGENTS.md).

- `agents/` contains role definitions.
- `rules/` contains path scopes and pointers to owning context pages.
- `skills/` contains reusable project procedures or pointers to those procedures.

Compatible native resource folders are real relative symlinks to these canonical folders. Cursor's incompatible .mdc metadata lives once under `views/cursor/rules/`, linked into Cursor and resolving `ctx_source` from the project root. Native settings remain separate; never alias entire tool configuration folders.

Resolve resource pointers from the project root. Change the canonical resource, then regenerate/check native adapters with the CLI; edit tool-specific metadata only at its declared owner. Start knowledge lookup at [the context router](../context/index.md), not by preloading this directory.
