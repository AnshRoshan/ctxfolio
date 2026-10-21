---
title: Install transaction
type: feature
status: complete
summary: Stage, validate, back up and atomically swap skill installs; back up setup's CLI refresh; migrate .ctx.json schema without dropping unknown keys
tags: [install, upgrade, transaction, safety]
covers: [scripts/ctx.mjs, tests/run.mjs]
related: [../build-plan.md, ../decisions.md, ./31-crash-safe-writes.md, ./33-spec-queue-integrity.md]
updated: 2026-10-21
verified_at: 69e9f4c26c27
---

# Install Transaction

## TL;DR

- Goal: `ctx install` either publishes a complete, validated skill tree or leaves the previous install untouched; `setup` backs up a changed `context/ctx.mjs` before replacing it; `.ctx.json` upgrades migrate forward without dropping unknown keys.
- Boundary: `install`, the scaffold writes that replace existing files, and `.ctx.json` migration. Core wiki writes already use Feature 31's atomic primitive.
- Measurable: a bad `name`, a symlinked target, or a failed copy never leaves a half-installed tree; reinstall removes files dropped from `SHIP`; a local edit survives in a named backup; `--dry-run` writes nothing; setup's CLI refresh keeps a backup when bytes differ.

## Why now

The 2026-10-21 audit found `ctx install` copies directly into the destination, follows symlinks, trusts the unvalidated `name` from `SKILL.md` (a traversal risk), never removes files dropped from `SHIP`, and overwrites local edits without a backup. `setup` refreshes `context/ctx.mjs` by direct write, so a user edit disappears with no diff. `.ctx.json` only bumps `setupVersion`; there is no schema marker or forward migration. These are upgrade-path failures, not page-content failures, and they undermine every later change.

## What to build

1. Validate the skill `name` from `SKILL.md`: non-empty, no path separators, no `.`/`..`, matches `[A-Za-z0-9][A-Za-z0-9._-]*`. Refuse before touching any destination.
2. Refuse a destination that is the skill source itself, inside it, or an existing symbolic link. Check the final component with `lstat`; do not follow it.
3. Add `--dry-run` to `install`: print the resolved target and the files that would be written, write nothing, and exit 0.
4. Install through a sibling stage directory: copy only `SHIP` with a symlink-refusing walker, write a manifest (`.ctx-install.json`: name, version, shipped files, SKILL.md SHA-256), then swap. If the destination exists, rename it to a timestamped `.ctx-backup-*` first; on failure, restore it. On success, report the backup path.
5. A full stage replaces the destination, so files dropped from `SHIP` disappear instead of lingering as stale copies.
6. In `setup`/`init`, use `atomicWrite` for scaffold files and `.ctx.json`, then before replacing a differing `context/ctx.mjs`, copy the old bytes to a timestamped sibling backup and report it. If bytes match, write nothing.
7. Add a `.ctx.json` schema marker (`schemaVersion`). New configs get the current version; older configs migrate forward in `setup` while preserving unknown keys. An unparseable config still fails before mutation.
8. Add tests for: invalid name refusal, symlinked destination refusal (skip when the host cannot create links), stale-file removal on reinstall, local-edit backup, `--dry-run` no-write, setup CLI backup, and the schema marker.

## Explicitly NOT in this spec

- Do not change the `SHIP` list or add new shipped folders.
- Do not make `install` fetch from the network or verify a remote checksum.
- Do not turn install into a package manager or add a lockfile.
- Do not redesign the symlink migration transaction (Feature 07).
- Do not change archive/log/task/atomic-write behavior from Feature 31.

## Clarifications

- "Backup" is a same-directory sibling with a timestamp; it is recovery evidence, not a permanent version-control replacement.
- A manifest is written inside the installed tree; it records local provenance, not a signature or an expected remote digest. The roadmap's pin/checksum wording is not implemented as remote authentication by this scope.
- The tree swap uses two sibling renames. Caught failures restore an unoccupied old destination or report its preserved backup; a hard process kill between renames may leave the destination absent with recovery bytes in the backup. This is recoverable publication, not a cross-platform atomic directory exchange.
- `--dry-run` still validates the name and destination, so an invalid target fails instead of pretending it would work.
- Unknown `.ctx.json` keys are preserved; only `schemaVersion` and `setupVersion` are bumped.
- Windows may deny symlink creation; the symlink-refusal test skips when link creation is unavailable.

## Value sources

| Value | Comes from |
|---|---|
| `install` copies directly and trusts `SKILL.md` name | `scripts/ctx.mjs` → `commands.install`, read 2026-10-21 |
| `setup` writes `context/ctx.mjs` directly | `scripts/ctx.mjs` → `commands.init` self-refresh block, read 2026-10-21 |
| `.ctx.json` only bumps `setupVersion` | `scripts/ctx.mjs` → `commands.init` config branch, read 2026-10-21 |
| 109 passed / 0 failed / 0 skipped baseline | `node tests/run.mjs` on Windows, 2026-10-21 |

## Verification checklist

- [x] An invalid skill name is refused before any write
- [x] A symlinked destination is refused, or the test skips when links are unavailable
- [x] Reinstall removes a file that is no longer in `SHIP`
- [x] Reinstall preserves a local edit in a timestamped backup and publishes the new tree
- [x] `install --dry-run` creates no target
- [x] `setup` backs up a differing `context/ctx.mjs` and reports the backup
- [x] `.ctx.json` gains `schemaVersion`; unknown keys survive an upgrade
- [x] `node tests/run.mjs` passes with the new cases and 0 failures
- [x] `node context/ctx.mjs lint --strict`, `stale --strict` and `doctor` are green
- [x] `../progress-tracker.md`, `../../memory.md`, `../log.md` and `../index.md` reflect the unit

## Verification evidence

- 2026-10-21 completion recheck: missing/empty skill names, source ancestors and real linked-parent containment now fail before destination writes. Copy/publication fault tests preserve the old tree; occupied rollback keeps concurrent content and reports the original recovery backup. Focused checks are recorded at [testing](../testing.md).

- 2026-10-21, Feature 32: full suite 114 passed, zero failed, zero skipped on Windows; unsafe-name and symlinked-destination refusal, stale-file removal, local-edit backup, `--dry-run`, setup CLI backup and schema migration are covered.
- Strict lint reports 24 pages with zero errors/warnings, `stale --strict` is clean and doctor passes 13/13.
