---
title: Knowledge types ADR lifecycle and query filing
type: feature
status: complete
summary: Optional neutral security quality risk debt pages, stable ADR split and explicit evidence-linked query filing
covers: [scripts/ctx.mjs, assets/decisions.md.template, tests/batch17-21.mjs]
updated: 2026-10-21
confidence: inferred
---

# Knowledge types ADR lifecycle and query filing

## TL;DR
- Goal: own missing security/NFR/risk/debt knowledge without inventing project defaults, and preserve decision/query knowledge explicitly.
- Boundary: new optional types, ADR lifecycle validation/split and ctx query file.
- Three focused checks passed in isolation; parent final integrated consolidated local verification/fixes are complete (D-15).

## What to build
1. Add neutral draft/inferred security, quality, risk and debt templates with source/owner/unknown sections; no unconditional scaffold expansion.
2. Add proposed/accepted/deprecated/superseded lifecycle fields to decision records and validate replacement ID links reciprocally.
3. Split a decision log only on explicit ctx adr split past a configurable line threshold into stable D-ID owners; preserve original headings/anchors and refuse overwrites.
4. File explicit answers with existing safe evidence paths into uniquely identified draft query pages, without self-verifying or overwriting owners.

## Explicitly NOT in this spec
- Preset security controls/NFR numbers, automatic ADR acceptance, silent historical ID renumbering, automatic query generation.

## Clarifications
- Legacy chosen decisions default to accepted; lifecycle is separate from general page status.
- Superseded requires a replacement ID; Supersedes/Superseded by references must exist, not self-reference and be reciprocal.
- Split uses existing maxPageLines by default and --threshold to override; incomplete crash publication fails closed rather than overwrite.
- Query filing uses --answer and --evidence; inferred filing is not verification.

## Value sources
| Value | Comes from |
|---|---|
| Type contents | Named unknown sections, never invented project claims |
| ADR IDs/lifecycle | Existing record headings and explicit Lifecycle/Supersedes/Superseded by fields |
| Split threshold | CONFIG.maxPageLines or explicit --threshold |
| Query identity/evidence | Question SHA-256 prefix and validated named existing files |
| Check evidence | node tests/run.mjs Feature20: 3 passed, 0 failed, 0 skipped |

## Verification checklist
- [x] Optional neutral type creation and overwrite refusal driven.
- [x] Explicit evidence-linked query filing, duplicate and secret-path refusal driven.
- [x] ADR stable split/anchor preservation, idempotence and invalid lifecycle links driven; syntax passed.
- [x] Parent integrated consolidated local verification.


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.

- 2026-10-21: Portable facts source attribution was corrected and checked across source/project CLI; this unit's substantive scoped contracts are unchanged. This records a narrow bookkeeping review, not new semantic verification.
