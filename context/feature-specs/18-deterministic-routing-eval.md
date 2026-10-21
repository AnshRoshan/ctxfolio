---
title: Deterministic routing evaluation
type: feature
status: complete
summary: Frozen real-wiki question fixtures and fail-closed routing metrics without model calls
covers: [scripts/ctx.mjs, tests/batch17-21.mjs, context/evals/questions.json]
updated: 2026-10-21
confidence: inferred
---

# Deterministic routing evaluation

## TL;DR
- Goal: expose reproducible routing hits, precision, estimates and blind spots over frozen real owner questions.
- Boundary: ctx eval and validated question JSON; no answer-generation/evaluator model in CLI.
- Three focused checks and final integrated local verification passed; additive routing/functional CI gates are integrated (D-15). Actual remote batch CI/publication remains pending.

## What to build
1. Validate schemaVersion/name/questions/gates, unique IDs, nonempty inputs/rubrics and existing safe context owner expectations; fail closed before any write.
2. Share briefData for k task pages plus mandatory orientation, reporting per-question hits/precision/skips/trust/blind spots.
3. Report macro hit@k/precision and summed estimated full-page tokens, fixture hash and explicit metric definitions in --json.
4. Fail process status for configured metric gates or routing/budget errors; provide additive existing-job CI steps.

## Explicitly NOT in this spec
- Model calls, semantic correctness claims, real token/cost savings, CI success claims or fixture adaptation after seeing answers.

## Clarifications
- Hit means any expected owner in orientation plus k task pages; precision denominator includes unique orientation owners.
- Trust warnings are visible but are not answer-quality scores.
- The actual parent cold-start pack may substitute a validated fixture before freezing, never after scoring.

## Value sources
| Value | Comes from |
|---|---|
| Questions and expected owners | context/evals/questions.json: ten real owner questions and source-grounded rubrics |
| CI floor | Fixture gates, not an achieved benchmark or answer score |
| Token estimates | Existing characters/4 estimator, explicitly not measured model usage |
| Check evidence | node tests/run.mjs Feature18: 3 passed, 0 failed, 0 skipped |

## Verification checklist
- [x] Deterministic exact output and hand-computable metric/estimate/blind-spot fixture.
- [x] Malformed/empty/duplicate/unsafe fixtures fail closed without writes.
- [x] Gate exit failures and hard budget/invalid k driven; syntax passed.
- [x] Parent integrates additive CI steps and performs final consolidated local gates.


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.

- 2026-10-21: Portable facts source attribution was corrected and checked across source/project CLI; this unit's substantive scoped contracts are unchanged. This records a narrow bookkeeping review, not new semantic verification.
