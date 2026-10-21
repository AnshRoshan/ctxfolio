---
title: Derived search and hierarchy
type: feature
status: complete
summary: Scale retrieval with deterministic derived indexes without hidden read writes
updated: 2026-10-21
covers: [scripts/ctx.mjs, tests/features22-29.mjs]
---

# Derived search and hierarchy

## TL;DR

- Goal: Scale retrieval with deterministic derived indexes without hidden read writes.
- Boundary: Add ctx search rebuild and bounded read-only query.

## What to build

Add ctx search rebuild and bounded read-only query. Fingerprints derive from canonical page bytes, ordering is deterministic, stale indexes fall back to current canonical pages without writing. Explicit rebuild creates separate .indexes type catalogs; ctx index compacts only its existing generated block above 150 pages or 6000 orientation tokens. Other existing locked write commands rebuild derived search after threshold; manual routes and canonical page contents remain unchanged.

## Explicitly NOT in this spec

No network, dependency additions, hidden writes or canonical repository edits.

## Clarifications

Implemented and integrated; the single consolidated local review/fix pass and functional verification are complete. Existing user-owned files remain preserved; host/runtime capabilities are declarations unless explicitly functionally tested, not live discovery proof.

## Value sources

| Value | Source |
|---|---|
| Index fingerprints | SHA256 of sorted page names and canonical page bytes |
| Automatic trigger | User-requested >150 pages or >6000 orientation token estimate |
| Search terms | Unicode query terms, title/summary/body literal matches |

## Verification checklist

- [x] Deterministic rebuild; query leaves stale bytes unchanged
- [x] Threshold index compacts generated catalog only and preserves canonical pages
- [x] Parent consolidated local functional tests and review/fixes


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.
