---
title: Delegated symbol routing
type: feature
status: complete
summary: Route symbol names to owner pages using imported tool output
updated: 2026-10-21
covers: [scripts/ctx.mjs, tests/features22-29.mjs]
---

# Delegated symbol routing

## TL;DR

- Goal: Route symbol names to owner pages using imported tool output.
- Boundary: Add ctx symbols import/search for Universal Ctags JSONL or tab tags and Graphify nodes JSON.

## What to build

Add ctx symbols import/search for Universal Ctags JSONL or tab tags and Graphify nodes JSON. Store a derived bounded symbol index with source hash, validated relative non-secret paths, optional project-files filtering and deterministic ordering. brief --symbols expands queries with delegated file ownership; source files are never parsed and delegated tools are optional.

## Explicitly NOT in this spec

No network, dependency additions, hidden writes or canonical repository edits.

## Clarifications

Implemented and integrated; the single consolidated local review/fix pass and functional verification are complete. Existing user-owned files remain preserved; host/runtime capabilities are declarations unless explicitly functionally tested, not live discovery proof.

## Value sources

| Value | Source |
|---|---|
| Symbol names and locations | Imported ctags/graphify output, never inferred from code |
| File membership | Existing sourceFiles inventory with --project-files |
| Import provenance | SHA256 of imported file bytes |

## Verification checklist

- [x] Ctags name routes to covered wiki owner via brief
- [x] Graphify import works and traversal/secret import preserves previous index on failure
- [x] Parent consolidated local functional tests and review/fixes


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.
