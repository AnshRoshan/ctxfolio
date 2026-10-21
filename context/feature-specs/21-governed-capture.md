---
title: Governed git session capture
type: feature
status: complete
summary: Deterministic metadata-only git digest with isolated inbox and hash-bound declared-human approval before draft promotion
covers: [scripts/ctx.mjs, tests/batch17-21.mjs]
updated: 2026-10-21
confidence: inferred
---

# Governed git session capture

## TL;DR
- Goal: retain a deterministic session digest without covertly copying prose, leaking secrets or promoting untrusted claims.
- Boundary: ctx capture digest/approve/promote; explicit inbox is outside wiki retrieval.
- Three focused checks passed; shared Feature 15/16 quarantine/provenance guard hooks are integrated and final consolidated local verification passed (D-15).

## What to build
1. Hash local HEAD/base plus sorted changed/dirty project paths and opaque content hashes; no diffs, file prose, commit messages or model summaries.
2. Default digest is read-only; --write explicitly stores a content-addressed inbox JSON without overwriting edited records.
3. Require separate full-hash --human --approved-by declared-human approval; never automatically approve/promote.
4. Promote only approved digest with unchanged HEAD/source hashes to a new ordinary context markdown draft/inferred page, with authored attribution and provenance; refuse raw/inbox/core/secret/outside/existing destinations.
5. Invoke available propagationProblems/pageProvenance validators at capturePromotionGuard before publication; never stamp verified status or bypass raw quarantine.

## Explicitly NOT in this spec
- Source prose or secret-file capture, automatic promotion, source edits/overwrites, self-verification, authenticated identity claims or model memory.

## Clarifications
- --human is declared attestation, not identity authentication; agents must not impersonate the approving human.
- Raw and secret paths are excluded before content reads. Generated draft contains metadata only and must not be treated as a claim owner without later evidence.
- Integrated Feature 15/16 helpers block promotion on errors; warnings retain draft/inferred status.
- Approval preserves hash and actor/date; freshness checks repeat before promotion.

## Value sources
| Value | Comes from |
|---|---|
| Observed digest | Reliable git HEAD/status/changedSince and SHA-256 of permitted present files |
| Approval provenance | Explicit separate declared-human flags plus stored full digest hash |
| Claim confidence | Always inferred draft; no verified_by written |
| Check evidence | node tests/run.mjs Feature21: 3 passed, 0 failed, 0 skipped |

## Verification checklist
- [x] Deterministic metadata-only digest, default no writes and secret/raw exclusions driven.
- [x] Explicit approval/promotion, new-owner-only behavior and stale source-hash refusal driven.
- [x] Tampered record and unsafe destination refusal driven; syntax passed.
- [x] Parent checks final 15/16 shared guard adapter contracts and consolidated local verification.


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.

- 2026-10-21: Portable facts source attribution was corrected and checked across source/project CLI; this unit's substantive scoped contracts are unchanged. This records a narrow bookkeeping review, not new semantic verification.
