# Memory

Resume cursor, not a second wiki or task ledger. Keep under ~60 lines. Link facts/evidence at their owners; history belongs in context/log.md.

_Last updated: 2026-10-21, during Feature 10 final verification_

## Current state

14 numbered features are complete: 01-09 and 30-34. Feature 10 is In progress on `feat/10-cli-housekeeping`; 11-29 remain queued. Main at ef2b0df is CI-green and carries the deployed truth repair. Release v2.7.0 is published. Evidence: [testing](context/testing.md#verification-evidence). [Feature 10](context/feature-specs/10-cli-honesty-housekeeping.md) source/tests are implemented, copied CLI parity is verified, 15 focused regressions passed, and the approved clean legacy worktree was safely removed through Git. Current Feature 09 closure/D-14/Feature 10 work is uncommitted.

## Exact next step

Collect the existing final full-suite job `pwsh-d2e5d5a1535a4741` (do not duplicate it). The earlier full run loaded an obsolete midnight test instant and reported 146 passed/1 failed; that fixture is corrected, its targeted 15-test filter passed, and this final rerun owns the integrated result. Verify all truth/baseline/version and strict lint/stale/doctor gates; record the measured final count. Then commit/push Feature 10 on a `ci/` validation branch, verify actual CI, fast-forward main only when green, close the unit, and begin Feature 11.

## Working set

- Roadmap: [build plan](context/build-plan.md); ledger: [progress tracker](context/progress-tracker.md).
- Human choices: [decisions](context/decisions.md) D-12 local calendar dates and D-14 conservative archive/count/cursor/worktree defaults.
- Source: scripts/ctx.mjs (`isSourcePath`, `impactData`, `archiveWindow`, `today`, `commands.log`, continuation-aware `upsertFm`); public contract: references/ctx-cli.md.
- Tests: 15 appended Feature10 regressions; no new framework or production clock backdoor. Advancing-clock fixture uses 18:29Z (23:59 IST), not the earlier 17:29Z typo.
- Writer/reviewer finished. No remaining source-review blocker. Preserve explicit covered documentation/raw review while excluding examples from app-source counts.

## Upcoming Feature 11 contract

Use a shared read-only advisory for status/brief/session-start based on committed memory history and reliable project-scoped Git status. Dirty/unavailable cursor state never means fresh/verified. Recognize a narrow current-state pending claim, not arbitrary history/prose. No hidden writes or provenance/self-verification; Feature 16 owns those. D-14 already records approved conservative policy. Create its spec only after Feature 10 closes.

## Remaining knowledge

Feature 12's minimal gate change adds cli/library eligibility only for API/env/runbook under existing full predicates, with neutral CLI/library templates. Do not broaden no-detect/full semantics or unrelated UI/DB pages; tiers belong Feature 22. Source filing, host survey and real routing/cold-start evidence remain queued.

## Recovery and limits

Ignored CLI recovery files retain prior bytes; do not publish/delete them as feature output. Git retains the removed legacy worktree's reachable history. Published main/tag history is never rewritten. Install's two-rename publication is recoverable, not crash-atomic; locks coordinate cooperating writers; hooks/doctor are bookkeeping, not semantic/live-host enforcement proof.
