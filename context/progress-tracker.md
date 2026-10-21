---
title: Progress Tracker
type: tracker
status: active
summary: The task ledger — In progress (max one), Blocked, Up next, Completed with concrete details
tags: [progress,status,tasks]
updated: 2026-10-21
verified_at: 69e9f4c26c27
---

# Progress Tracker

## TL;DR

- The sections below own task execution states. Verification evidence lives in [testing](testing.md#verification-evidence); project facts are not copied into this ledger.

The only file that updates constantly, and the only place a unit's state lives. States are
mutually exclusive — move lines with `ctx task` (`add` / `start` / `block` / `done`); it keeps
the ledger honest (one unit In progress at a time, `done` requires concrete details).

Roadmap position: [build plan](build-plan.md) Phase 4 Wave 0 complete. Feature 08 is complete and main/release checks are green. Active unit: Feature 09 (dogfood truth repair).

## In progress
- Feature 09: Dogfood truth repair — started 2026-10-21
## Blocked

## Up next
- Phase 4 waves 0-6 (Features 08-34) live in [build-plan](build-plan.md) - Wave 0 first, then smallest first, provenance before capture. Create each numbered spec only when its unit starts.

## Completed
- Feature 04: dogfood — this repo runs its own context system (setup + filled wiki) — 2026-10-06 — decisions: D-04; details: 47/47 tests, doctor 12/12, VERSION 2.4.0, detect false-positive fixed (word-boundary dep matching)
- Feature 03: v2.4 self-install — 2026-10-06 — `ctx install` SHIP list + GitHub-link flow; boundary tests for dev-history leaks
- Feature 02: v2.3 teams + growth — 2026-10-06 — references/multi-user.md, merge-collision lint, `ctx archive` (archiveAfterDays 180 / trackerKeepDays 90)
- Feature 01: v2.2 one command — 2026-10-06 — `ctx setup` (idempotent, upgrade-safe via setupVersion), path-gated rules, agent memory, Lessons, danger zones; decisions: D-03
- Feature 05: reliable context routing and safe updates — 2026-10-14 — CLI 2.5.0, metadata 3.5.0; 72/72 Windows tests; strict lint clean; doctor 12/12; budgeted JSON and safe updates
- Feature 06: single-source agent resources and file ownership — 2026-10-14 — Accepted single-source ownership; decisions: D-06; evidence: context/testing.md#verification-evidence
- Feature 07: native Git-compatible symlink layout — 2026-10-14 — Native relative link layout accepted; decisions: D-07; evidence: context/testing.md#verification-evidence
- Feature 30: Page-contract integrity — 2026-10-21 — parseFrontmatter folded/literal scalars + named errors; recursive brace globs fail closed via globError; duplicate/typo/nested/tab and malformed-glob regressions; 106 tests, lint 22 pages 0/0, doctor 13/13
- Feature 31: Crash-safe writes — 2026-10-21 — atomicWrite (temp+fsync+rename) and appendAtomic; cross-process advisory lock with stale recovery/reentrancy; archive replay dedupe; 109 tests, lint 23 pages 0/0, doctor 13/13
- Feature 32: Install transaction — 2026-10-21 — SHIP-only staged install with name/symlink refusal, manifest and backup swap; dry-run; setup CLI backup; .ctx.json schemaVersion migration preserving unknown keys; 114 tests, lint 24 pages 0/0, stale clean, doctor 13/13
- Feature 33: Spec-queue integrity — 2026-10-21 — build-plan numeric reservations parsed; new feature/task add refuse implicit reserved IDs and accept explicit --spec; lint enforces roadmap-spec-tracker coherence, required Wave 0 sections and D-NN refs; 117 tests, lint 25 pages 0/0, stale clean, doctor 13/13
- Feature 34: Route and relation integrity — 2026-10-21 — Router templates now use only always-created pages; lint validates router backticks, code-span paths and related targets; fixed relative related paths in map/module/API/integration templates; 119 tests, lint 26 pages 0/0, stale clean, doctor 13/13
- Feature 08: always-green baseline: CI red, self-context gate, release hygiene — 2026-10-21 — Evidence: context/testing.md#verification-evidence; main run 39553397681 and candidate 39552815955 green across Node22/24 on three OSes; actual tag check passed; v2.7.0 published. Wave 0 safety regressions corrected.
## Session notes

- 2026-10-06: detect() substring bug found by dogfooding — 'gin' matched "context-engineering" → backend false positive; fixed with word-boundary regex over manifest text (dep names keep substring match).
