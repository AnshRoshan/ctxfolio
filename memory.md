# Memory

_Last updated: 2026-10-21, all roadmap units locally verified; final batch publication gate_

## Current state

All 34 numbered features are implemented and locally verified. [Tracker](context/progress-tracker.md) records individual completion/evidence. Prior main commit 369acde is published and green; the remaining integrated batch is not yet remotely published. Local full CLI suite: 192 passed, 0 failed, 0 skipped. Scale/host/MCP/team checks: 18 passed. Syntax, copied-CLI parity, strict lint/stale, coverage, doctor, truth/baseline/version guards passed. Actual cold-start evaluation: 8 correct and 2 partial out of 10, one independent reader/grader pair, with unavailable usage and concurrent-checkout limits. Evidence: [testing](context/testing.md#verification-evidence).

## Exact next step

Regenerate the final catalog and explicit facts block after this cursor is written. Commit the integrated batch once on a candidate branch, push `ci/final-roadmap-batch`, collect the actual supported-matrix/scale/routing/self-context CI run, and promote to main only after successful checks. No additional review round or per-feature full-suite cycle: D-15's consolidated review/fix pass is complete. Fix actual CI failures if they appear; do not claim remote success from local results.

## Evidence and limits

- [Routing result](context/evals/routing-result.json): hit@8 1.0, precision 0.15; character/4 estimates, not measured model usage.
- [Cold-reader answers](context/evals/cold-start-reader.json) and [independent grades](context/evals/cold-start-grades.json): 8 correct, 2 partial, no wrong/not-found. No measured token savings, matched baseline or generalized task-success claim.
- [Derived facts](context/facts.md) is a generated source-backed owner. Refresh only explicitly; local authorship/verifier labels are declarations, not authentication.
- MCP evidence is bounded local initialized stdio exchange, not every native host live loader. Locks remain advisory; install's two-rename swap is recoverable, not crash-atomic exchange.

## Recovery

Ignored CLI backup files retain prior bytes. The safely removed legacy worktree's reachable history remains in Git. Published main/tag history is never rewritten. Release v2.7.0 remains unchanged; post-release capabilities are recorded under Unreleased until a separately authorized release.
