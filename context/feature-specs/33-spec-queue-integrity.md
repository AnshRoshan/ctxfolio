---
title: Spec-queue integrity
type: feature
status: complete
summary: Reserved roadmap numbers, roadmap-spec-tracker coherence and required spec sections, enforced before new work is authored
tags: [specs,roadmap,tracker,lint]
covers: [scripts/ctx.mjs, tests/run.mjs]
related: [../build-plan.md, ../progress-tracker.md, ../../memory.md, ./32-install-transaction.md, ./34-route-and-relation-integrity.md]
updated: 2026-10-21
verified_at: 69e9f4c26c27
---

# Spec-Queue Integrity

## TL;DR

- Goal: a new spec can only take a number the roadmap reserved for that unit, and lint proves the roadmap, spec files and tracker agree on every active number.
- Boundary: `ctx new feature`, `ctx task add`, and the feature-spec section of `ctx lint`.
- Measurable: `ctx new feature` refuses an implicit reserved number; lint catches an unreserved spec or tracker ID, a tracked unit without a spec, a complete spec missing from Completed, an incomplete spec marked Completed, and a Wave 0+ spec missing a required section.

## Why now

The 2026-10-21 audit found that `ctx new feature` chooses `max + 1`, so a branch with non-contiguous specs can land on a number the roadmap reserved for another unit. `ctx task add` has the same max-plus-one rule. Lint only checks tracked units against spec files; it never checks either against `context/build-plan.md`, so a spec can exist for a unit the plan never authorized, or a complete spec can sit outside the Completed ledger. New specs also vary in shape: some omit `Value sources` or `Verification checklist`, which defeats the evidence review that the queue exists to support.

## What to build

1. Read the roadmap reservations from numeric table rows in `context/build-plan.md` (`| 30 | ... |`). Preserve the roadmap title after the leading ID.
2. Make `ctx new feature` choose `max + 1` only when that number is not reserved. If it is reserved, refuse and name the roadmap unit; accept an explicit `--spec NN` only for a reserved, unused number. Keep non-feature `ctx new` behavior unchanged.
3. Apply the same reservation guard to `ctx task add` without `--spec`; accept explicit `--spec NN` only when it is reserved and unused. Projects without a numeric roadmap keep the current sequential behavior.
4. In `ctx lint`, when a roadmap exists:
   - every Wave 0+ spec number and Wave 0+ tracker feature number must be reserved by the roadmap;
   - every tracker feature must still have a spec (existing rule);
   - every `status: complete` spec must appear under Completed and nowhere else;
   - every non-complete, live spec must appear in Up next, In progress or Blocked;
   - duplicate roadmap or spec numbers remain visible.
5. Require each feature spec numbered 30+ to carry `## TL;DR`, `## What to build`, `## Explicitly NOT in this spec`, `## Clarifications`, `## Value sources` and `## Verification checklist`. Legacy specs 01-07 stay grandfathered.
6. Keep the existing unknown `D-NN` reference check and cover it in the new tests, so a spec cannot point at a decision that does not exist.
7. Add tests for reserved-number refusal and explicit selection, lint against an unreserved spec and tracker ID, complete/incomplete tracker state mismatches, a missing required section, and a valid queue that stays clean.

## Explicitly NOT in this spec

- Do not renumber existing specs or rewrite completed history.
- Do not require every roadmap row to have a spec; specs are created only when a unit starts.
- Do not validate roadmap prose, sizes or wave ordering beyond numeric IDs and duplicates.
- Do not add a remote issue tracker or generate the roadmap from the tracker.
- Do not change the spec template beyond the sections already present.

## Clarifications

- "Reserved" means a numeric row exists in `context/build-plan.md`; a project with no build plan has no reservations and keeps sequential numbering.
- Explicit `--spec NN` is the deliberate act that claims a reserved unit; the operator is responsible for matching the title.
- A legacy spec is any feature spec numbered below 30; the required-section and roadmap-reservation rules apply from the Wave 0 convention onward, so the completed 01-07 history stays valid.
- Lint reports queue defects as errors because they make the ledger's authority ambiguous; duplicate numbers remain errors where they identify two owners.
- A complete spec is evidence, not proof: the check is structural and does not inspect whether the verification claims are true.

## Value sources

| Value | Comes from |
|---|---|
| `ctx new feature` uses `max + 1` | `scripts/ctx.mjs` → `commands.new`, read 2026-10-21 |
| `ctx task add` uses the ledger's highest number + 1 | `scripts/ctx.mjs` → `commands.task`, read 2026-10-21 |
| Lint checks tracked units against specs but not the roadmap | `scripts/ctx.mjs` → `commands.lint`, read 2026-10-21 |
| Roadmap reserves Features 08-34 in numeric tables | `context/build-plan.md`, read 2026-10-21 |
| 117 passed / 0 failed / 0 skipped baseline | `node tests/run.mjs` on Windows, 2026-10-21 |

## Verification checklist

- [x] Implicit `ctx new feature` refuses a reserved number and names the roadmap unit
- [x] Explicit `ctx new feature --spec NN` accepts a reserved, unused number
- [x] Implicit `ctx task add` refuses a reserved number
- [x] Lint errors on a spec number absent from the roadmap
- [x] Lint errors on a tracker number absent from the roadmap
- [x] Lint errors when a complete spec is not in Completed, or an incomplete spec is in Completed
- [x] Lint errors when a Wave 0+ spec misses a required section
- [x] Lint still errors on an unknown `D-NN` reference
- [x] A coherent roadmap/spec/tracker fixture lints clean
- [x] `node tests/run.mjs` passes with the new cases and 0 failures
- [x] `node context/ctx.mjs lint --strict`, `stale --strict` and `doctor` are green
- [x] `../progress-tracker.md`, `../../memory.md`, `../log.md` and `../index.md` reflect the unit

## Verification evidence

- 2026-10-21 completion recheck: duplicate normalized roadmap IDs were previously silently collapsed. The candidate now surfaces them in lint even with a missing tracker and refuses ambiguous feature/task authoring. Focused regression checks are recorded at [testing](../testing.md).

- 2026-10-21, Feature 33: full suite 117 passed, zero failed, zero skipped on Windows; reserved-number refusal, explicit --spec selection, roadmap/spec/tracker coherence, required Wave 0 sections and unknown D-NN refs are covered.
- Strict lint reports 25 pages with zero errors/warnings after indexing, stale --strict is clean and doctor passes 13/13.
