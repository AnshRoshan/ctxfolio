---
title: Actual cold-start evidence pack
type: feature
status: complete
summary: Actual fresh-reader and independent-grader evidence, 8 correct and 2 partial of 10, with unknown usage and explicit limits
covers: [scripts/ctx.mjs, tests/batch17-21.mjs, context/evals/questions.json]
updated: 2026-10-21
confidence: inferred
---

# Actual cold-start evidence pack

## TL;DR
- Goal: collect actual cold-start answers and independent grades, with available measured usage and honest unknowns.
- Boundary: evalpack preparation, references/cold-start-evidence.md protocol and retained actual reader/grader artifacts after integration.
- Locally complete: one actual fresh-reader/independent-grader pair produced 8 correct, 2 partial, 0 wrong and 0 not-found answers out of 10. This meets the 8/10 correctness target for this pair only; token/cost/time and efficiency outcomes remain unknown.

## What to build
1. Emit frozen fixture/hash/repository revision and dirty-path provenance plus ten questions/rubrics in a machine-readable packet.
2. Require genuinely fresh read-only readers and separate source-grounded graders; retain correct/partial/wrong/not-found outcomes.
3. Leave answer/grade/model/session/cost/time/token fields null until real evidence exists.
4. Keep deterministic routing estimates separate from measured runtime usage; public claims must follow actual results.

## Explicitly NOT in this spec
- Invented experiment scores or savings, auto-filled usage, treating routing hits as correctness, new CLI model integrations.
- Marking Feature 19 complete on packet preparation alone.

## Clarifications
- Parent executed actual fresh agents against frozen questions/rubrics after integration. Concurrent checkout changes and unavailable per-read source snapshots limit revision reproducibility; later edits do not expand the retained answers.
- Actual usage unavailable from host stays null; no estimator substitutes for billing or model tokens.
- A savings claim needs a matched baseline under equivalent conditions, not a protocol target.

## Value sources
| Value | Comes from |
|---|---|
| Expected answers | Frozen fixture rubric and current source owners, not fixed feature status/counts |
| Revision/hash | Local git observation and SHA-256 of actual fixture bytes |
| Actual grades and usage | context/evals/cold-start-reader.json and context/evals/cold-start-grades.json; observed grades, unavailable host usage explicitly null |
| Preparation checks | node tests/run.mjs Feature19: 3 passed, 0 failed, 0 skipped |

## Verification checklist
- [x] Packet preserves frozen questions, owners and null result/usage fields.
- [x] Packet read-only determinism driven.
- [x] Fail-closed validation and actual-reader/grader protocol checked; syntax passed.
- [x] Parent ran the ACTUAL fresh-reader experiment after integration.
- [x] Independent grades, usage unknowns and evidence-backed public claim changes recorded in final consolidated pass.


## Actual experiment result and limits

- The retained [reader answers](../evals/cold-start-reader.json) were graded without retrospective answer expansion by a separate independent grader; the [grade artifact](../evals/cold-start-grades.json) records one pass, identities, input hashes and rubric-grounded notes. Actual outcome: **8 correct, 2 partial, 0 wrong, 0 not-found out of 10**. The partial answers omitted routing overflow/fit/history details and the dependency-free parser/helper maintenance tradeoff.
- Explicit accounting records **25 unique project files**; hidden filesystem opens and repeated-open timing are uninstrumented. Actual reader/grader tokens, cost and elapsed time remain **null**, not zero. Token and average-source-open efficiency targets are **not established**; no cost-benefit or generalized savings claim is made.
- The checkout changed concurrently during reading/grading; full per-read source snapshots were unavailable. Frozen question/rubric hashes and retained answers are evidence, not a claim of a fully reproducible immutable checkout.
- Deterministic [routing output](../evals/routing-result.json) reports hit@8 **1.0** and precision **0.15** for its recorded integrated run. These are routing metrics, not semantic answer success or actual token/cost measurements.


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.

- 2026-10-21: Portable facts source attribution was corrected and checked across source/project CLI; this unit's substantive scoped contracts are unchanged. This records a narrow bookkeeping review, not new semantic verification.

- 2026-10-21 publication checkpoint (19): ctxfolio metadata/versions updated; scoped behavior unchanged. Not semantic verification.
