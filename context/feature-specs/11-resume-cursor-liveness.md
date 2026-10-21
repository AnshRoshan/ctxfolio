---
title: Resume-cursor liveness
type: feature
status: complete
summary: Read-only advisory signals when recorded memory lags HEAD or a current clean-tree claim contradicts reliable Git status
tags: [memory, cursor, liveness]
covers: [scripts/ctx.mjs, tests/run.mjs, assets/memory.md.template, references/ctx-cli.md]
related: [../testing.md, ../decisions.md, ./10-cli-honesty-housekeeping.md]
updated: 2026-10-21
---

# Resume-cursor Liveness

## TL;DR

- Goal: status, brief and SessionStart expose cursor contradictions before a recorded next step is treated as current guidance.
- Boundary: one shared read-only observation of project memory and Git history/status. Warnings are advisory, not verification or a hard execution gate.
- Depends on Feature 10. D-14 approves committed-history/reliable-status advisory defaults.

## What to build

1. Observe the fixed project-root memory.md without writes. Validate its real project boundary and regular-file shape before reading.
2. Report current HEAD and the last committed memory touch from successful Git observations. When they differ, warn that the recorded cursor may lag, not that it is proven wrong.
3. Report local cursor edits separately. Touching memory never grants freshness; committed-history lag stays a qualified observation.
4. Recognize only a canonical Current state line `Working tree: nothing pending.` or legacy standalone `Nothing pending.`. Strip fenced/inline code and quotations; do not search history/debt or infer product/task state.
5. Compare that claim with successful project-scoped NUL Git status including staged, unstaged, deleted, renamed and nonignored untracked/wiki/cursor paths. Preserve unavailable versus clean; nested siblings are excluded from pending paths.
6. Add an additive resumeCursor diagnostic to status/brief JSON and one human advisory block. SessionStart labels an actionable next step as recorded/reconcile-required when warnings exist. Stop behavior and command ok/exit semantics remain unchanged.
7. Use no-optional-locks and disabled fsmonitor for Git read observations on these paths. No cursor/config/index/stamp/log/lock mutation or automatic acknowledgement.
8. Handle absent/untracked memory, no Git/unborn HEAD, shallow/failed history/status, unsafe paths and local edits as explicit unknown/limited observations. No unknown becomes false/clean/verified.
9. Add focused diagnostics/nontrigger/Unicode/rename/nested/failure/read-only tests. Refresh the copied CLI with backup, update public/template wording, and pass full gates.

## Explicitly NOT in this spec

- Do not add author verification, validity intervals, dirty-stamp provenance or reachability-from-main enforcement. Feature 16 owns those.
- Do not change Stop gates, lint/CI policy or status/brief health flags based on an advisory.
- Do not create background capture, per-agent cursors, arbitrary path/config thresholds or a disable switch without a request.
- Do not rewrite memory automatically or treat a recorded claim as proof.

## Clarifications

- The minimal implementation is always-on and advisory, with no new config key. D-14's approved conservative policy permits this read-only signal without hard gating.
- HEAD is repository-global; even a sibling commit can advance it. The advisory states that limitation, while pending paths remain project-scoped.
- Dirty memory keeps qualified committed-history evidence plus a local-modification warning; it never becomes fresh because touched.
- `nothing pending` means only tracked/untracked nonignored working-tree changes under the chosen project root, not absence of tasks/issues/releases.
- Current section recognition accepts `Current state` or `Current State`; the two exact claim lines are case-insensitive. Incidental prose/quotes/examples are not claims.

## Value sources

| Value | Comes from |
|---|---|
| Cursor path | memory ownership and fixed project-root memory.md |
| HEAD | successful Git rev-parse --verify HEAD |
| Last committed cursor update | successful Git log -1 --format=%H -- memory.md |
| Dirty/current paths | reliable NUL porcelain Git status with project-prefix normalization |
| Narrow pending claim | present Current state section after code/quote exclusion |
| Advisory policy | human-approved D-14 |
| Baseline | Feature 10 testing evidence: full147/0/0 and six-job candidate/main CI |

## Implementation checkpoint

- Implemented on 2026-10-21. Targeted Feature11 checks: 11 passed; original unsafe-orientation, symlink and Stop filters passed. The single consolidated local review/fix pass and final integrated verification are complete (D-15); remote batch CI/publication is still pending.

## Verification checklist

- [x] All three consumers expose consistent advisory observations without changing health/Stop semantics
- [x] HEAD lag and local cursor edits are qualified, never self-verified
- [x] Canonical/legacy current clean-tree claims detect reliable pending paths; examples/history do not trigger
- [x] Git failure/missing/shallow/unsafe cursor states remain explicit unknown or limited
- [x] Unicode/rename/nested paths remain exact
- [x] Read paths do not write cursor/config/index/locks or invoke fsmonitor
- [x] Focused/full tests, syntax, copied parity, truth/baseline/version guards and strict wiki/doctor gates pass
- [x] Specs/tracker and parent-owned testing, memory and public/template owners record local closure; final log/catalog publication bookkeeping remains in the common publication gate


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.

- 2026-10-21: Portable facts source attribution was corrected and checked across source/project CLI; this unit's substantive scoped contracts are unchanged. This records a narrow bookkeeping review, not new semantic verification.

- 2026-10-21 publication checkpoint (11): ctxfolio metadata/versions updated; scoped behavior unchanged. Not semantic verification.
