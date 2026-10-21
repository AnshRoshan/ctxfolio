---
title: Testing
type: guide
status: active
summary: The self-test harness — how to run it, what it covers, and the rule that makes it the contract
tags: [tests, quality]
covers: [tests/**]
updated: 2026-10-21
verified_at: 69e9f4c26c27
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

- Canonical resource authoring, pointer-only adapters, metadata refresh, hand-edit preservation, legacy conflict migration, missing owners and duplicate-prose heuristics; hook loop-safety and closed-stdin behavior; Unicode/spaces/rename/nested git paths; hard routing budgets, mandatory-page trust and history, unsafe orientation paths; config/path preflight and partial-map preservation; JSON contracts `{command, ok}`; scaffold idempotence + upgrade path; profile gating (python gets no UI pages); the two no-leak boundary tests; task-ledger state machine; frontmatter block scalars, duplicate/typo keys, nested/tab errors, brace glob matching and malformed-glob non-crash; atomic writes, stale-lock recovery and idempotent archive replay; unsafe install name/symlink refusal, stage stale-file removal, local-edit backup, dry-run, setup CLI backup and `.ctx.json` schema migration; reserved roadmap numbers at `new`/`task add`, roadmap-spec-tracker coherence, required Wave 0 spec sections and real `D-NN` refs; dead router backticks, missing code-span paths and missing `related:` targets, with always-created routing templates; lint rules both ways (fires + templates stay clean).

## Wave 0 completion recheck

- The appended `Wave0` regression filter first observed 12 failures and one passing existing failure-recovery path, then passed all 13 cases after repair (source review and focused run, 2026-10-21).
- Regression boundaries: live/permission-protected lock ownership and successor-safe cleanup, internal index calls taking the writer lock, exact archive block/line identity, required install name and lexical/real source containment, copy/publication/occupied-rollback recovery, duplicate normalized roadmap lint/authoring refusal, leading block/list tab validation, and fenced router examples excluded.
- Install publication is recoverable through staged sibling renames and reported backups, not a crash-atomic directory exchange. The advisory lock is for cooperating writers, not a security boundary against non-cooperating processes.
- Adjacent focused runs passed: archive 3/3, install 11/11, frontmatter 3/3, roadmap 4/4, stale-lock 2/2; final router fence/flag nontrigger case 1/1. Source: `node tests/run.mjs <filter>` on Windows, 2026-10-21. The full candidate suite is the final count, not the sum of overlapping filters.

## Baseline and release gates

- CI tests the supported tracks on explicitly named Ubuntu, macOS and Windows runners; runtime declarations stay in package.json and runner details stay in .github/workflows/ci.yml.
- `node tests/check-versions.mjs` checks each version track and the mapping in README.md. `--require-tag` additionally checks the newest reachable release tag; `--tag=<tag>` verifies the actual release identity and its attachment to HEAD. Candidates do not claim a tag already exists.
- `node tests/check-baseline.mjs` clones full history into a disposable fixture, proves strict lint rejects a real placeholder and stale rejects a committed source-only change, then verifies current-field version/mapping/tag mutations and malformed metadata fail. A correct tag on the wrong commit is rejected. The actual repository gates are unconditional; mutations derive from current declarations rather than a fixed release number.
- `sandbox()` canonicalizes its temporary root before creating fault-injection paths. The migration/rollback tests require injection markers, preserved human bytes, configuration state and reported recovery content, not merely a nonzero exit. A directory alias run in POSIX CI exercises the macOS temporary-root path class.

## Known flaky / slow

- `ctx tools` probes PATH (`where`/`which`) — tests only assert the array shape, never which tools exist on the machine.
- The harness bounds each subprocess at 30 seconds. EOF is required for hook stdin; tests closing a pipe do not prove an open stream cannot block.
- `stale` still uses touched-page bookkeeping, not semantic verification; `brief.changedSources` keeps dirty claims review-required. Doctor checks hook event names, not complete executable hook contracts (deferred).

## Verification evidence

- 2026-10-21, Feature 08 final local candidate: `node tests/run.mjs` on Windows Node 24.21.0 passed 132 cases, 0 failed, 0 skipped. Syntax checks and copied-CLI parity passed; strict lint reported 26 pages 0/0, stale clean, doctor 13/13. `node tests/check-baseline.mjs` and `node tests/check-versions.mjs` passed. Existing website `npm run build` passed with its declared Vite 7.3.2 and emitted one 334460-byte HTML artifact. Remote supported-matrix success is still required before main/release publication.

- 2026-10-21, Feature 08 initial verification: `node tests/run.mjs` reproduced 119 passed / 0 failed / 0 skipped on Windows Node 24.21.0; strict lint 26 pages 0/0, stale clean, doctor 13/13. This preceded additional Wave 0 regression repairs and does not certify the final candidate.
- Feature 08 preservation proof: the aliased-temp POSIX reproduction failed the three reported tests; the canonicalized harness passed the Windows symlink filter (14 selected, 0 failed, 0 skipped). Independent isolated POSIX checks passed three exact baselines and caught three intentionally disabled preservation defenses with the expected loss assertions. Debian Node 20.19.2 was used only for mutation/reproduction evidence, not supported-platform certification.

- 2026-10-14, Feature 05 baseline: full suite 72 passed, zero failed on Windows; syntax checks, strict wiki lint, doctor and copied-CLI parity passed.
- 2026-10-14, Feature 06: full suite 88 passed, zero failed on Windows after resume. Nine initial ownership cases and the brace/escaped-filename regressions were observed failing before fixes.
- Node syntax checks passed; strict context lint reports 19 pages with zero errors/warnings. Canonical adapter audit reports four valid native adapters with no conflicts; doctor passes 13/13. Final close verifies copied-CLI parity again.
- The sole legacy role/rule bodies were explicitly promoted before their reviewed instruction update; native files now contain only metadata and canonical pointers. Hand-edit and competing-owner preservation are regression-tested.
- 2026-10-14, Feature 07 final: full suite 101 passed, zero failed, zero skipped on Windows with Developer Mode enabled; real file/directory links and Git mode 120000 plus relative link blobs were verified. Permission-off and concurrency/rollback failures were fault-injected separately, not counted as simulated native success.
- This repository was migrated to eight actual relative symlinks; local Git core.symlinks is true. Claude-only notes were preserved in .claude/context.md. Central Cursor views resolve project-root sources, and valid existing aliases work without new-link permission.
- Independent migration review exposed six preservation regressions; all were reproduced before fixing validated snapshots, unpublished expected contents, occupied rollback destinations, pending mode commits and unsupported pointer downgrades.
- Future-user Windows prerequisites are documented in SKILL.md, README.md, INSTALL.md and actionable CLI errors. No remote CI or live Claude/Cursor loader verification is implied by local CLI tests.
- 2026-10-21, Feature 30: full suite 106 passed, zero failed, zero skipped on Windows; folded/literal summaries, duplicate keys, `cover:` typos, nested/tab errors, brace glob matching and malformed-glob non-crash are covered. Strict lint reports 22 pages with zero errors/warnings after owner review, `stale --strict` is clean and doctor passes 13/13.
- 2026-10-21, Feature 31: full suite 109 passed, zero failed, zero skipped on Windows; core commands leave no temp files, a stale advisory lock is recovered, a held lock fails without changing the original, and a seeded archive replay adds no duplicate log entry or tracker line. Strict lint reports 23 pages with zero errors/warnings after owner review, `stale --strict` is clean and doctor passes 13/13.
- 2026-10-21, Feature 32: full suite 114 passed, zero failed, zero skipped on Windows; unsafe install names and symlinked destinations are refused before writes, reinstall removes stale files, local edits survive in a timestamped backup, `--dry-run` writes nothing, setup backs up a changed CLI, and `.ctx.json` gains `schemaVersion` while preserving unknown keys. Strict lint reports 24 pages with zero errors/warnings, `stale --strict` is clean and doctor passes 13/13.
- 2026-10-21, Feature 33: full suite 117 passed, zero failed, zero skipped on Windows; implicit `new feature`/`task add` refuse roadmap-reserved numbers, explicit `--spec` claims them, lint rejects unreserved spec/tracker IDs and complete/incomplete state mismatches, requires the Wave 0 spec sections and still rejects unknown `D-NN` references. Strict lint reports 25 pages with zero errors/warnings, `stale --strict` is clean and doctor passes 13/13.
- 2026-10-21, Feature 34: full suite 119 passed, zero failed, zero skipped on Windows; a dead router page, a missing code-span path and a missing `related:` target each fail lint, while commands, globs, URLs and placeholders do not. The shipped routing templates name only always-created pages, and module/API/integration `related:` paths resolve. Strict lint reports 26 pages with zero errors/warnings, `stale --strict` is clean and doctor passes 13/13.

Evidence source: tests/run.mjs → routing, reliability and ownership cases. memory.md links here rather than copying results.
