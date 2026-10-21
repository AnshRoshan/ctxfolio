---
title: Issue queue split
type: feature
status: complete
summary: Share sanitized issue summaries while retaining private diagnostics in ignored local files
tags: [issues, ownership, safety]
covers: [scripts/ctx.mjs, tests/run.mjs, assets/**, references/**]
related: [./13-derived-facts.md, ../ownership.md]
updated: 2026-10-21
---

# Issue Queue Split

## TL;DR

- Goal: durable sanitized issues remain visible at handoff; private diagnostics remain local.
- Boundary: scaffolds, ownership routes and doctor checks. No automatic diagnostic promotion.

## What to build

1. Scaffold frontmatter-backed context/issues.md for sanitized symptom, suspected path, fix direction, success condition and evidence pointers.
2. Scaffold ignored context/issues.local.md for private diagnostics; preserve legacy context/current-issues.md verbatim and keep it ignored.
3. Route shared bug work through issues.md; local queues are optional and never a required tracked router target.
4. Doctor checks both private paths are ignored and shared issues.md is not ignored, using Git's actual ignore behavior when available.

## Explicitly NOT in this spec

- Do not read or auto-copy legacy/private diagnostics into tracked pages.
- No issue tracker service, token extraction or automatic sanitization claim.
- No separate full-suite/review/CI; D-15 consolidates final verification.

## Clarifications

- Humans/authorized writers explicitly summarize safe diagnostics; ignoring a file does not erase already tracked history.
- Existing authored issue pages survive setup unchanged. Legacy diagnostics stay in place, not destructively migrated.

## Value sources

| Value | Comes from |
|---|---|
| Shared summary fields | Authored issue record and linked reproduction/evidence |
| Ignore state | git check-ignore --no-index, or explicit ignore lines without Git |
| Preservation | Existing init skip-existing and atomicWrite helpers |

## Verification checklist

- [x] Shared/local owners scaffold with safe routes and actual ignore boundaries
- [x] Existing authored and legacy bytes survive upgrades without promotion
- [x] Doctor detects missing local ignore and incorrectly ignored shared owner
- [x] Targeted checks and final consolidated local verification pass


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.
