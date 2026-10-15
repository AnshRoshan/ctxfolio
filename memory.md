# Memory

A resume cursor, not a second task ledger or configuration inventory.

## Resume

The requested native-link upgrade is ready for review. Use [the ledger](context/progress-tracker.md) for execution state and [Feature 07](context/feature-specs/07-native-symlinks.md) for accepted scope.

Exact next step: review the local diff before committing or publishing. Windows users should follow [the setup prerequisite](INSTALL.md#windows-native-symlink-prerequisite) whenever creating/recreating links; do not toggle OS security automatically. Existing-alias behavior and final evidence stay at [testing](context/testing.md#verification-evidence).

## Working set

- [Canonical resource entrypoint](.agents/README.md) and [File Ownership](context/ownership.md).
- [CLI source](scripts/ctx.mjs); actual link audit: `node context/ctx.mjs symlinks --check --json`.
- [D-07 rationale](context/decisions.md#d-07-real-relative-resource-aliases--2026-10-14).
- [Host-specific Claude context](.claude/context.md) is separate from the shared policy source.

## Context debt

Existing operational ceilings and live-host-loader verification limits stay at [their owner](context/testing.md#known-flaky--slow). This handoff copies neither completed tasks nor test/configuration inventories.
