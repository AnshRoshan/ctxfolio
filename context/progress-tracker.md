---
title: Progress Tracker
type: tracker
status: active
summary: The task ledger — In progress (max one), Blocked, Up next, Completed with concrete details
tags: [progress,status,tasks]
updated: 2026-10-14
verified_at: 080a7adb7826
---

# Progress Tracker

## TL;DR

- The sections below own task execution states. Verification evidence lives in [testing](testing.md#verification-evidence); project facts are not copied into this ledger.

The only file that updates constantly, and the only place a unit's state lives. States are
mutually exclusive — move lines with `ctx task` (`add` / `start` / `block` / `done`); it keeps
the ledger honest (one unit In progress at a time, `done` requires concrete details).

Roadmap position: [build plan](build-plan.md). Authorized acceptance criteria: [Feature 07](feature-specs/07-native-symlinks.md).

## In progress

## Blocked

## Up next
- evals runner — spec first: `ctx new feature evals-runner` (next free spec number; see build-plan)
- hook parity beyond Claude (P3-F06, spec pending)
- `ctx query` filing (P3-F07, spec pending)
- opt-in project skills `--skills` (P3-F08, spec pending)

## Completed
- Feature 04: dogfood — this repo runs its own context system (setup + filled wiki) — 2026-10-06 — decisions: D-04; details: 47/47 tests, doctor 12/12, VERSION 2.4.0, detect false-positive fixed (word-boundary dep matching)
- Feature 03: v2.4 self-install — 2026-10-06 — `ctx install` SHIP list + GitHub-link flow; boundary tests for dev-history leaks
- Feature 02: v2.3 teams + growth — 2026-10-06 — references/multi-user.md, merge-collision lint, `ctx archive` (archiveAfterDays 180 / trackerKeepDays 90)
- Feature 01: v2.2 one command — 2026-10-06 — `ctx setup` (idempotent, upgrade-safe via setupVersion), path-gated rules, agent memory, Lessons, danger zones; decisions: D-03
- Feature 05: reliable context routing and safe updates — 2026-10-14 — CLI 2.5.0, metadata 3.5.0; 72/72 Windows tests; strict lint clean; doctor 12/12; budgeted JSON and safe updates
- Feature 06: single-source agent resources and file ownership — 2026-10-14 — Accepted single-source ownership; decisions: D-06; evidence: context/testing.md#verification-evidence
- Feature 07: native Git-compatible symlink layout — 2026-10-14 — Native relative link layout accepted; decisions: D-07; evidence: context/testing.md#verification-evidence
## Session notes

- 2026-10-06: detect() substring bug found by dogfooding — 'gin' matched "context-engineering" → backend false positive; fixed with word-boundary regex over manifest text (dep names keep substring match).
