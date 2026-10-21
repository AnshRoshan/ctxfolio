---
title: Claim provenance and temporal validity
type: feature
status: complete
summary: Diagnose declared verification identity, main-reachable evidence and validity intervals without granting trust from stamps
tags: [provenance, validity, trust]
covers: [scripts/ctx.mjs, tests/run.mjs, references/**]
related: [./15-ingest-quarantine.md]
updated: 2026-10-21
---

# Claim Provenance and Temporal Validity

## TL;DR

- Goal: declared actors, reachable evidence and validity intervals make unsupported verification visible.
- Boundary: additive page metadata, stamp semantics and lint/brief trust diagnostics. No external identity proof.

## What to build

1. Reuse frontmatter for authored_by, verified_by, valid_from and review_by; validate calendar dates/order and warn when not yet valid or review-expired.
2. Resolve verified_at only as a real commit reachable from main (local main first, origin/main fallback); without main, report repository-HEAD reachability explicitly as unknown main provenance.
3. Stamps with explicit --actor NAME --actor-type human|agent record declared verifier only for reliable clean-tree/main-reachable checkpoints; agent actor matching authored_by is refused. No implicit human/independent verifier claim.
4. Dirty/unknown stamps retain an explicitly unverified content snapshot and do not leave a clean verified_at proof. Unknown actor stamps are bookkeeping only, marked unverified.
5. Expose additive provenance warnings/metadata in brief and lint; do not change ranking or treat a clean checkpoint as semantic claim verification. New --actor pages record declared authorship.

## Explicitly NOT in this spec

- No authenticated identity, external corroboration or automatic confidence promotion.
- No retrieval ranking, model/network calls or provenance service.
- No consolidated full-suite/review/CI before D-15 final verification.

## Clarifications

- Actor labels and actor types are caller declarations. Equality prevents declared agent self-verification, not impersonation; explicit evidence still requires review.
- Legacy stamps without an actor remain allowed as unverified bookkeeping, never a named human verification.
- Dirty means reliable tracked/nonignored-untracked project status has pending paths; failed/no-Git status is unknown, never clean.
- Main reachability does not prove covered claims or independent review. Existing verified pages lacking declared verifier/validity are warned, not silently upgraded.
- The snapshot hashes page body and current covered file bytes; it is a local unverified observation, not a commit identity.

## Value sources

| Value | Comes from |
|---|---|
| Actors and validity | Explicit frontmatter/caller declarations |
| Reachability | Safe read-only Git rev-parse/merge-base against main, origin/main, or qualified HEAD fallback |
| Dirty state | Existing safe repoRead project-scoped status observation |
| Snapshot | SHA-256 current page body and covered source bytes |
| Diagnostics | Existing parsed frontmatter and local calendar today() |

## Verification checklist

- [x] Date/order/expiry and declared verifier diagnostics are exposed in lint/brief
- [x] Unreachable/missing main proof remains untrusted and fallback is labeled unknown
- [x] Dirty/unknown stamps cannot record clean verification; declared agent self-verification refused
- [x] Targeted checks and final consolidated local verification pass


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.
