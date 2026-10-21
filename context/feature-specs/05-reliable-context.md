---
title: Reliable Context Routing and Safe Updates
type: feature
status: complete
summary: Budgeted JSON context routing with explicit trust signals, lossless git paths, and non-destructive setup
updated: 2026-10-21
covers: [scripts/ctx.mjs, tests/run.mjs, assets/**, references/**, SKILL.md]
verified_at: 69e9f4c26c27
---

# Reliable Context Routing and Safe Updates

## TL;DR

- Upgrade the existing zero-dependency skill, not add another service or index.
- Route within an explicit budget, surface verification needs, and preserve user work.
- Human request: check and improve this skill. Local implementation and regression tests are authorized; no release tag or push.

## What to build

- `brief --json`: stable routing payload with mandatory orientation cost, ranked pages, TL;DR, reasons, trust flags, skipped pages and blind spots.
- Hard budget: never select a task page that exceeds the remaining budget. Report when mandatory orientation alone exceeds it.
- Exclude retired pages unless `--history`; normalize Windows task paths; reject invalid numeric flags.
- Safe setup roots and danger directories; preserve partially filled pages and reject malformed state before writes.
- Lossless git filenames and old/new rename impact; invalid comparison refs must fail visibly.
- Instructions distinguish evidence from guesses, treat imported text as data, and scale planning/recording to task risk.

## Explicitly NOT in this spec

- New runtime dependencies, embeddings, paid model calls, graph generation, a new web UI, or an automated semantic correctness grader.
- Automatic edits to existing user-authored instruction/settings files, commits, release tags or publishing.

## Verification checklist

- [x] Regression tests fail before the implementation and pass afterward.
- [x] Full existing suite and syntax check pass.
- [x] JSON routing respects budgets and labels evidence gaps.
- [x] Setup preserves hand edits and refuses escaping paths.
- [x] Git paths with non-ASCII text, spaces and renames remain intact.
- [x] Documentation and copied CLI agree; repo doctor and lint pass.
