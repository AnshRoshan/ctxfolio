---
title: Retrieval precision
type: feature
status: complete
summary: Unicode and IDF routing with code-history discount and capped one-hop relation expansion
covers: [scripts/ctx.mjs, tests/batch17-21.mjs]
updated: 2026-10-21
confidence: inferred
---

# Retrieval precision

## TL;DR
- Goal: route multilingual and current code tasks to owner guidance without bypassing trust or budgets.
- Boundary: wordTokens, briefData and commands.brief in the existing dependency-free CLI.
- Implemented and locally complete: three isolated focused checks and the final integrated consolidated verification passed (D-15).

## What to build
1. NFKC Unicode word segmentation through Intl.Segmenter, with Unicode-run fallback and CJK matching.
2. IDF-weight existing title/tag/summary/path/body signals while retaining covers ownership dominance.
3. Discount complete feature history for detected or explicit code tasks; retired history remains opt-in.
4. Expand related targets from selected direct hits only, using the same trust warnings, hard page limit and token budget.

## Explicitly NOT in this spec
- Model calls, embeddings, dependencies, persistent indexes or recursive graph traversal.
- Treating freshness/bookkeeping as semantic proof.

## Clarifications
- --code-task overrides keyword detection; complete feature discount is separate from archived/superseded visibility.
- Mandatory orientation still counts before task selection. Related warnings can make ok false.
- Related expansion uses spare capacity after direct matches and is one hop only.

## Value sources
| Value | Comes from |
|---|---|
| IDF | 1 + log((1 + page count)/(1 + term document frequency)) over current page corpus |
| History factor | Existing retired quarter-weight reused for complete code-task feature history |
| Estimated tokens | Existing full-page UTF-16 characters / 4 rounded up, not actual model usage |
| Check evidence | node tests/run.mjs Feature17: 3 passed, 0 failed, 0 skipped in isolated Windows copy |

## Verification checklist
- [x] Unicode/CJK retrieval and rare-term weighting driven through installed CLI.
- [x] History discount preserves covers dominance.
- [x] One-hop trust/history/limit/budget guards driven; syntax checks passed.
- [x] Parent integrated consolidated local review/fixes and verification.


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.

- 2026-10-21: Portable facts source attribution was corrected and checked across source/project CLI; this unit's substantive scoped contracts are unchanged. This records a narrow bookkeeping review, not new semantic verification.
