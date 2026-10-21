---
title: Derived facts
type: feature
status: complete
summary: Generate source-backed project facts and flag unowned live copies of measurable counts or versions
tags: [facts, derived, lint]
covers: [scripts/ctx.mjs, tests/run.mjs]
related: [../testing.md, ./12-cli-library-profile-gating.md]
updated: 2026-10-21
---

# Derived Facts

## TL;DR

- Goal: current derived counts/declared versions have one generated owner with named sources; old handwritten live inventories are detectable.
- Boundary: facts JSON/markdown derived block and focused lint rule. Historical evidence remains historical.

## What to build

1. Add `ctx facts --json` as a read-only report of deterministic page/source/stale/coverage/orient facts and declared package/CLI versions. Each value names its source; never invent a test result.
2. Add explicit `ctx facts --write` to refresh a marked generated block in context/facts.md using the existing lock/atomic writer. Preserve surrounding authored content.
3. Lint generated block drift and narrowly recognized live copied test/page/doctor counts or versions without an owning-source link. Exclude dated evidence, historical specs/logs, code/examples and the generated owner; avoid blanket number lint.
4. Add targeted tests for correct sources/JSON, idempotent preservation, mismatches and legitimate historical/source-linked claims.

## Explicitly NOT in this spec

- Do not execute the full suite to claim a test count, call models/network or add dependencies.
- Do not implement provenance16, retrieval17 or eval18.
- Do not run separate review/full CI; final verification is consolidated by D-15.

## Clarifications

- Derived facts mean deterministic current project metadata; measured test/eval outcomes require their separately recorded evidence.
- Writing is explicit; read-only report never stamps/logs/updates files.

## Value sources

| Value | Comes from |
|---|---|
| Current page/source/coverage/orient metrics | Existing pages/sourceFiles/staleReport/orientationFiles helpers |
| Declared versions | package.json and copied CLI VERSION |
| Mutation safety | Existing withLock/atomicWrite |

## Verification checklist

- [x] Fact values have named sources and read-only mode writes nothing
- [x] Explicit generated block refresh preserves authored content and detects drift
- [x] Focused copied-live-claim lint triggers without flagging dated/source-linked evidence
- [x] Targeted checks and final consolidated local verification pass


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.

- 2026-10-21: Portable facts source attribution was corrected and checked across source/project CLI; this unit's substantive scoped contracts are unchanged. This records a narrow bookkeeping review, not new semantic verification.

- 2026-10-21 publication checkpoint (13): ctxfolio metadata/versions updated; scoped behavior unchanged. Not semantic verification.
