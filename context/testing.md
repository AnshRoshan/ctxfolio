---
title: Testing
type: guide
status: active
summary: The self-test harness — how to run it, what it covers, and the rule that makes it the contract
tags: [tests, quality]
covers: [tests/**]
updated: 2026-10-14
verified_at: 1043ccc98e2a
---

# Testing

## TL;DR

- Run all: `node tests/run.mjs` · filter: `node tests/run.mjs lint` · no deps or network; duration depends on git/tool-probe speed.
- Each case gets a throwaway git repo (`sandbox()`), drives the copied CLI and asserts real output. Case counts come from the run, not hand-maintained inventories elsewhere.
- The suite IS the CLI contract (commands, exit codes, `--json` shapes, boundaries) — a feature without a test is unfinished.

## Layout & conventions

- One file, `test(name, fn)` + `assert/assertContains`; `initRepo`/`setupRepo` helpers mirror real usage; `ctx(dir, …)` runs the COPIED cli (proves portability); `ctxHook` pipes stdin payloads like Claude Code.
- Name cases as behavior ("stop hook never loops when re-invoked"), not as units ("test hook()").

## Must be covered

- Canonical resource authoring, pointer-only adapters, metadata refresh, hand-edit preservation, legacy conflict migration, missing owners and duplicate-prose heuristics; hook loop-safety and closed-stdin behavior; Unicode/spaces/rename/nested git paths; hard routing budgets, mandatory-page trust and history, unsafe orientation paths; config/path preflight and partial-map preservation; JSON contracts `{command, ok}`; scaffold idempotence + upgrade path; profile gating (python gets no UI pages); the two no-leak boundary tests; task-ledger state machine; lint rules both ways (fires + templates stay clean).

## Known flaky / slow

- `ctx tools` probes PATH (`where`/`which`) — tests only assert the array shape, never which tools exist on the machine.
- The harness bounds each subprocess at 30 seconds. EOF is required for hook stdin; tests closing a pipe do not prove an open stream cannot block.
- `stale` still uses touched-page bookkeeping, not semantic verification; `brief.changedSources` keeps dirty claims review-required. Doctor checks hook event names, not complete executable hook contracts (deferred).

## Verification evidence

- 2026-10-14, Feature 05 baseline: full suite 72 passed, zero failed on Windows; syntax checks, strict wiki lint, doctor and copied-CLI parity passed.
- 2026-10-14, Feature 06: full suite 88 passed, zero failed on Windows after resume. Nine initial ownership cases and the brace/escaped-filename regressions were observed failing before fixes.
- Node syntax checks passed; strict context lint reports 19 pages with zero errors/warnings. Canonical adapter audit reports four valid native adapters with no conflicts; doctor passes 13/13. Final close verifies copied-CLI parity again.
- The sole legacy role/rule bodies were explicitly promoted before their reviewed instruction update; native files now contain only metadata and canonical pointers. Hand-edit and competing-owner preservation are regression-tested.
- 2026-10-14, Feature 07 final: full suite 101 passed, zero failed, zero skipped on Windows with Developer Mode enabled; real file/directory links and Git mode 120000 plus relative link blobs were verified. Permission-off and concurrency/rollback failures were fault-injected separately, not counted as simulated native success.
- This repository was migrated to eight actual relative symlinks; local Git core.symlinks is true. Claude-only notes were preserved in .claude/context.md. Central Cursor views resolve project-root sources, and valid existing aliases work without new-link permission.
- Independent migration review exposed six preservation regressions; all were reproduced before fixing validated snapshots, unpublished expected contents, occupied rollback destinations, pending mode commits and unsupported pointer downgrades.
- Future-user Windows prerequisites are documented in SKILL.md, README.md, INSTALL.md and actionable CLI errors. No remote CI or live Claude/Cursor loader verification is implied by local CLI tests.

Evidence source: tests/run.mjs → routing, reliability and ownership cases. memory.md links here rather than copying results.
