---
title: INGEST quarantine
type: feature
status: complete
summary: Scan raw data for instruction-shaped content and gate propagation on hash-bound declared human acknowledgement
tags: [ingest, quarantine, safety]
covers: [scripts/ctx.mjs, tests/run.mjs, references/**]
related: [./14-issue-queue-split.md]
updated: 2026-10-21
---

# INGEST Quarantine

## TL;DR

- Goal: instruction-shaped raw content remains data, not silently promoted authority.
- Boundary: deterministic raw scan, explicit hash-bound acknowledgement and guarded source-summary creation/propagation diagnostics.

## What to build

1. Add read-only ctx quarantine <raw paths> --json (or scan context/raw when omitted), reporting source/hash/status/category/line without printing embedded requests.
2. Explicit --ack --human --actor NAME --hash SHA records a declared human acknowledgement for one exact raw snapshot under context/quarantine, atomic and locked. Changed bytes invalidate acknowledgement.
3. Add ctx ingest <raw path> [--title TITLE] creating only a source summary scaffold with raw/hash/provenance and unverified labels; refuse suspicious unacknowledged or unknown/unsafe sources before writing.
4. Reuse the guard in new source --raw and check declared raw/sources propagation during lint and stamp. Acknowledgement never makes embedded instructions executable or approved scope.

## Explicitly NOT in this spec

- No executing raw commands, model/network classifier or identity authentication.
- No automatic source edits, semantic summary generation or universal attack detection claim.
- No final full-suite/review/CI before consolidated D-15 verification.

## Clarifications

- Actor and --human are explicit declared attestation, not proof of who invoked the command. Refuse absent/mismatched hash or actor.
- Supported textual raw snapshots are decoded as UTF-8; binary/unreadable/unsafe inputs remain unknown and cannot propagate through the guard.
- Detection is narrow heuristic evidence with visible categories, not a security sandbox. Unknown inputs fail closed; absence of findings is not trust.
- Source summaries and promoted pages retain located source-reported/proposed/approved distinctions. CLI cannot govern manual filesystem edits; lint flags declared unsafe propagation.

## Value sources

| Value | Comes from |
|---|---|
| Hash | SHA-256 exact raw bytes |
| Findings | Deterministic instruction-shaped regex categories and raw line numbers |
| Acknowledgement | Explicit --human/--actor/--hash declaration bound to source path and current hash |
| Mutation | Existing root-boundary validation, atomicWrite and withLock |

## Verification checklist

- [x] Read-only scanner reports exact hashes/categories and preserves raw data
- [x] Unacknowledged suspicious and unknown sources cannot ingest/propagate
- [x] Hash-bound human declaration records safely and becomes invalid after source changes
- [x] Targeted checks and final consolidated local verification pass


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.
