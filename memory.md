# Memory

Resume cursor, not a second wiki or task ledger. Keep under ~60 lines. Link current facts and evidence at their owners; dated history belongs in context/log.md.

_Last updated: 2026-10-21, during Feature 09 truth repair_

## Current state

Feature 08 is complete: main CI39553397681 and tag CI39553402796 are green on the supported matrix; v2.7.0 is published and Pages succeeded. Wave 0 was re-audited and its missing safety regressions corrected in preserved commits 6a2c962 and b7e58d6. Evidence: [testing](context/testing.md#verification-evidence). Feature 09 is In progress on `feat/09-dogfood-truth`: [active spec](context/feature-specs/09-dogfood-truth-repair.md). Main remains at verified b7e58d6; current feature changes are uncommitted.

## Next step

Finish Feature 09's live docs/site truth corrections, collect the two scoped writer results, add a static truth regression, run the full CLI and existing website build, then verify the deployed copy. Preserve design/layout/behavior; mark legacy demo transcripts and token assumptions explicitly. Only close after owner review, strict lint/stale, doctor and evidence pass. Feature 10 follows in roadmap order.

## Working set

- Roadmap: [build plan](context/build-plan.md); ledger: [progress tracker](context/progress-tracker.md).
- Relevant choices: [decisions](context/decisions.md) D-08 through D-13 and F-01.
- Feature 09 scope: live README/INSTALL/docs/wiki facts and website copy. No housekeeping/profile/provenance/eval behavior change.
- Router internals for later precision work: scripts/ctx.mjs (`brief`, `staleReport`, `impactData`).

## Open questions

- F-01: stable spec IDs vs execution numbering remains historical; already-shipped Wave 0 IDs are preserved.
- Feature 24 needs an evidence-based host survey before adapter/destination choices.
- Features 18-19 must produce real routing/cold-start evidence; existing token-cost inputs are assumptions, not measurements.

## Context debt

- Feature 09 repairs current unsupported live claims without rewriting dated history; Feature 13 later derives facts and Feature 16 enforces provenance/validity.
- The legacy editor worktree is registered/ignored/detached. Feature 10 must inspect its own changes before any authorized cleanup.
- context/sources/ has no ingested primary evidence; audit source filing remains future authorized work.
- No eval has run; do not turn illustrative cost/transcript data into empirical product claims.

## Verification boundaries

The install tree swap is recoverable across two sibling renames, not a crash-atomic directory exchange. Locks coordinate cooperating writers, not hostile filesystem races. Hooks/doctor check bookkeeping/wiring, not live host enforcement or semantic truth.
## Local recovery

Prior CLI bytes are retained in the ignored baseline backup; do not publish/delete them as feature output. Published main/tag history is never rewritten.
