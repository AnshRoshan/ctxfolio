---
title: Portable context checks
type: feature
status: complete
summary: Expose one read-only gate summary usable by every host and CI
updated: 2026-10-21
covers: [scripts/ctx.mjs, tests/features22-29.mjs]
---

# Portable context checks

## TL;DR

- Goal: Expose one read-only gate summary usable by every host and CI.
- Boundary: Add ctx check --gates lint,stale,coverage,impact,doctor using existing JSON APIs in bounded Node subprocesses without a shell.

## What to build

Add ctx check --gates lint,stale,coverage,impact,doctor using existing JSON APIs in bounded Node subprocesses without a shell. Default gates are lint and stale, optional coverage/impact/doctor are explicit. Return a single JSON or human summary and nonzero failure exit; never repair or assume Claude hook availability. Existing doctor remains available explicitly, including its declared Claude wiring checks.

## Explicitly NOT in this spec

No network, dependency additions, hidden writes or canonical repository edits.

## Clarifications

Implemented and integrated; the single consolidated local review/fix pass and functional verification are complete. Existing user-owned files remain preserved; host/runtime capabilities are declarations unless explicitly functionally tested, not live discovery proof.

## Value sources

| Value | Source |
|---|---|
| Gate status | Existing gate JSON ok and errors contracts |
| Default gates | CLI portable policy: lint, stale |

## Verification checklist

- [x] One JSON summary and unchanged files on a read-only check
- [x] Invalid gates and repair flags refused; failed lint visible
- [x] Parent consolidated local functional tests and review/fixes


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.
