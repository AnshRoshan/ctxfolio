---
title: Scaffold tiers
type: feature
status: complete
summary: Useful small scaffolds with explicit profile extras and preservation-first upgrades
updated: 2026-10-21
covers: [scripts/ctx.mjs, tests/features22-29.mjs]
---

# Scaffold tiers

## TL;DR

- Goal: reduce setup placeholder debt while retaining useful routing, memory and architecture owners.
- Boundary: new scaffold selection, never deletion or rewriting of user-owned pages.

## What to build

Lite creates populated core knowledge owners plus shared entrypoints, the shared issue owner and memory. Standard is the default and adds useful testing, manifest and planning owners. Full explicitly enables detected profile extras and retains template-based authoring. Conflicting tier selectors fail before writes. Existing files and unknown config keys survive upgrades and downgrades. Queues start blank.

## Explicitly NOT in this spec

No inferred application architecture, automatic task generation or user-file deletion.

## Clarifications

Legacy no-full/no-ui/portable-pointers remain supported. Full/no-full resolves conservatively without extras. Every existing file remains authoritative.

## Value sources

| Value | Source |
|---|---|
| Tier selection | Explicit CLI flags; standard default |
| Languages and kinds | Existing detect API |
| Architecture claims | Deliberately unknown until source verification |

## Verification checklist

- [x] Focused tier selection and populated-lite checks
- [x] Upgrade preserves authored files and blank queue
- [x] Consolidated local review/fixes and functional suite by integrating parent


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.

- 2026-10-21: Portable facts source attribution was corrected and checked across source/project CLI; this unit's substantive scoped contracts are unchanged. This records a narrow bookkeeping review, not new semantic verification.

- 2026-10-21 publication checkpoint (22): ctxfolio metadata/versions updated; scoped behavior unchanged. Not semantic verification.
