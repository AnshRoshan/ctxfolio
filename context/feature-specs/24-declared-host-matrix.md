---
title: Declared host matrix
type: feature
status: complete
summary: Make host capabilities and install destinations explicit without guessing discovery
updated: 2026-10-21
covers: [scripts/ctx.mjs, tests/features22-29.mjs]
---

# Declared host matrix

## TL;DR

- Goal: Make host capabilities and install destinations explicit without guessing discovery.
- Boundary: Add ctx hosts with named evidence and declared-not-live-verified capability rows.

## What to build

Add ctx hosts with named evidence and declared-not-live-verified capability rows. Skill installation defaults to the shared ~/.agents/skills destination; Claude and Qoder remain explicit targets, and legacy auto selects only shared home. --host selects declared ids and persists unknown-safe config. Explicit Qoder project skill discovery uses existing generated adapters or staged relative symlink transaction; preserve all D-7 native aliases and conflicts.

## Explicitly NOT in this spec

No network, dependency additions, hidden writes or canonical repository edits.

## Clarifications

Implemented and integrated; the single consolidated local review/fix pass and functional verification are complete. Existing user-owned files remain preserved; host/runtime capabilities are declarations unless explicitly functionally tested, not live discovery proof.

## Value sources

| Value | Source |
|---|---|
| Capability evidence | Existing templates, adapter targets and D-6/D-7 contracts |
| Host selection | Explicit --host or persisted config |
| Install home | TOOL_HOMES and os.homedir, never environment secrets |

## Verification checklist

- [x] Matrix distinguishes declarations from live verification
- [x] Unknown host rejected before writes; Qoder opt-in discovery resolves
- [x] Parent consolidated local functional tests and review/fixes


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.

- 2026-10-21: Portable facts source attribution was corrected and checked across source/project CLI; this unit's substantive scoped contracts are unchanged. This records a narrow bookkeeping review, not new semantic verification.

- 2026-10-21 publication checkpoint (24): ctxfolio metadata/versions updated; scoped behavior unchanged. Not semantic verification.
