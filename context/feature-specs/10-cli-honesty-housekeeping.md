---
title: CLI honesty and housekeeping
type: feature
status: complete
summary: Count source impact honestly, validate archive windows before writes, use local calendar dates and refresh log metadata
tags: [cli, impact, archive, dates]
covers: [scripts/ctx.mjs, tests/run.mjs, references/ctx-cli.md]
related: [../testing.md, ../decisions.md, ./09-dogfood-truth-repair.md]
updated: 2026-10-21
confidence: unverified
---

# CLI Honesty and Housekeeping

## TL;DR

- 2026-10-21 provenance review: legacy checkpoint `ef2b0df59c6a` (recorded 2026-10-21) is explicitly unverified; no declared verifier or validity interval is established. Historical completion dates/evidence/checks are retained, not reverified. Source: dated evidence/checklist below and ../testing.md#verification-evidence.

- Goal: source counts and archive/log dates describe what the CLI actually operates on, without crashes or partial writes.
- Boundary: shared source classification, impact/Stop consumers, archive input/cutoff formatting, log metadata and local legacy-worktree cleanup.
- Depends on Feature 09. The human approved conservative semantics in D-14; local calendar policy is D-12.

## What to build

1. Reuse one path classifier for sourceFiles and impact source counts. Respect configured extensions, ignored directories and ignored source globs; do not require a changed path to still exist.
2. Exclude docs/reference examples from default app-source counts. Retain explicitly covered non-context materials and raw source snapshots as owner-review hits; never silently bypass documentation contracts. Ordinary wiki bookkeeping remains excluded from material review.
3. Keep deleted paths and both rename sides routable. Preserve current NUL/Unicode/nested-root handling. Make Stop use the same source/material classification without manufacturing a source blocker for unowned docs-only changes.
4. Validate both archive windows before any source/archive/index mutation. Accept finite non-negative whole days, including zero; reject invalid/overflowing dates with actionable errors, not stack traces.
5. Use local calendar dates for human-facing updated/log/tracker/archive fields. Subtract calendar days with local Date setters across DST; leave machine timestamps and lock durations precise.
6. Capture one local date per log/archive invocation. Update log frontmatter and append its new heading in one atomic locked write; preserve metadata/history. Tail remains a non-mutating read.
7. Correct archive's no-op sentence to name the day window and local cutoff accurately. Preserve dry-run, replay identity and locking behavior.
8. Remove the registered legacy editor worktree using Git only after rechecking its exact path, clean status, ignored data and detached-history reachability. Keep its reachable history and do not force-delete unknown content.
9. Add focused source/docs/delete/rename/config, archive-invalid/no-write/zero/cutoff and frozen-clock/timezone/DST regressions. Refresh the copied CLI with recovery bytes and verify full gates.

## Explicitly NOT in this spec

- Do not implement cursor liveness, facts, quarantine, provenance or retrieval scoring; Features 11-18 own those.
- Do not change safe install/symlink publication or archive replay semantics.
- Do not change release identities or publish another release tag.
- Do not delete detached unique history, ignored content or an unverified worktree.

## Clarifications

- D-14: archive zero means today. Inputs are non-negative integers and must produce a representable cutoff before writes.
- Default docs/reference sample exclusion affects app-source classification only. Explicit covers still produce owner-review obligations.
- Source classification works on path strings, including deleted and renamed sources. Existence checks belong only to inventory commands.
- D-12 local human dates do not alter installedAt/lock/backup machine timestamps.
- The inspected worktree is clean, ignored and detached at a commit reachable from main; recheck before approved Git removal.

## Value sources

| Value | Comes from |
|---|---|
| impact classifies almost every changed non-context path as code | scripts/ctx.mjs impactData source review |
| archive invalid windows crash and no-op sentence uses date as day count | scripts/ctx.mjs commands.archive source review |
| log updated missing and UTC/local split | scripts/ctx.mjs today/commands.log; D-12 |
| Source filtering configuration | scripts/ctx.mjs sourceFiles/DEFAULTS/context config |
| Archive/input/cursor/worktree defaults | Human confirmation recorded in D-14 |
| Legacy worktree safe-state evidence | git worktree list --porcelain, status, ignored inventory, merge-base against main |
| Baseline suite | testing evidence: 132 passed / 0 failed / 0 skipped for Feature 09 |

## Verification checklist

- [x] Counts exclude unowned docs/reference examples but retain explicit owner-review hits
- [x] Configured filters and deleted/renamed sources remain correct
- [x] Invalid archive windows fail before any write; zero and cutoff boundaries work
- [x] Local-calendar dates and DST subtraction pass frozen-clock checks
- [x] Log updated/heading agree and tail preserves bytes
- [x] Registered clean reachable legacy worktree is removed via Git with no data loss; detached commit b59ed5d remains reachable
- [x] Focused regressions, full CLI suite, syntax, copied parity, truth/baseline/version checks pass (147/0/0 final full run)
- [x] Strict lint/stale and doctor pass; owner pages, tracker, log and memory record evidence (28 pages 0/0, stale clean, doctor13/13)
