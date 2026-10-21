---
title: Testing
type: guide
status: active
summary: The self-test harness — how to run it, what it covers, and the rule that makes it the contract
tags: [tests, quality]
covers: [tests/**]
updated: 2026-10-21
verified_at: ef2b0df59c6a
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

- `node tests/check-truth.mjs` guards current live runtime/test claims, SHIP-only install examples, canonical evidence links and illustrative/unmeasured UI boundaries. It was observed failing on the old live website baseline before Feature 09 corrections and passes after them. The guard runs in self-context CI; it is not an evaluation of answer quality.

- CI tests the supported tracks on explicitly named Ubuntu, macOS and Windows runners; runtime declarations stay in package.json and runner details stay in .github/workflows/ci.yml.
- `node tests/check-versions.mjs` checks each version track and the mapping in README.md. `--require-tag` additionally checks the newest reachable release tag; `--tag=<tag>` verifies the actual release identity and its attachment to HEAD. Candidates do not claim a tag already exists.
- `node tests/check-baseline.mjs` clones full history into a disposable fixture, proves strict lint rejects a real placeholder and stale rejects a committed source-only change, then verifies current-field version/mapping/tag mutations and malformed metadata fail. A correct tag on the wrong commit is rejected. The actual repository gates are unconditional; mutations derive from current declarations rather than a fixed release number.
- `sandbox()` canonicalizes its temporary root before creating fault-injection paths. The migration/rollback tests require injection markers, preserved human bytes, configuration state and reported recovery content, not merely a nonzero exit. A directory alias run in POSIX CI exercises the macOS temporary-root path class.

## Housekeeping contracts

- `isSourcePath` shares extension/directory/glob policy across inventory and changed-source counts. Docs/reference examples are excluded from app sources; explicit non-context/raw coverage still creates owner review. Deleted/rename paths are classified without requiring existence.
- Archive validates both config and flag windows before writes, accepts zero, and subtracts local calendar days across DST. Log metadata/entry use one local date and atomic locked publication; supported block-scalar metadata replacement removes its old continuation without corrupting neighbors. Machine install/lock/backup timestamps remain ISO.

## Known flaky / slow

- `ctx tools` probes PATH (`where`/`which`) — tests only assert the array shape, never which tools exist on the machine.
- The harness bounds each subprocess at 30 seconds. EOF is required for hook stdin; tests closing a pipe do not prove an open stream cannot block.
- `stale` still uses touched-page bookkeeping, not semantic verification; `brief.changedSources` keeps dirty claims review-required. Doctor checks hook event names, not complete executable hook contracts (deferred).

## Verification evidence

- 2026-10-21, Feature 10 final local candidate: `node tests/run.mjs` passed 147 tests / 0 failures / 0 skips on Windows. Truth, negative baseline and version/tag guards passed; syntax and copied-CLI parity passed; strict lint reports 28 pages 0/0, stale clean, doctor 13/13. The test-only midnight clock correction is included in this full rerun. Remote CI verification remains the publication gate.

- 2026-10-21, Feature 10 focused checks: 15 passed / 0 failed / 0 skipped after source/material classification, archive input/local-DST cutoffs, one-date log/index publication and block-scalar metadata-upsert repair. The folded-updated regression failed before the shared fix. An advancing-clock fixture initially used the wrong UTC-to-IST hour; its test-only instant was corrected and the focused suite rerun. Adjacent archive 8/0/0, impact 3/0/0, Stop-hook 3/0/0 and reliability 13/0/0 filters passed. The full integrated count comes from the actual full suite, not summed overlapping filters.

- 2026-10-21, Feature 10 worktree cleanup: `git worktree list --porcelain` identified the exact registered detached legacy checkout; its status and ignored/untracked inventories were empty, and b59ed5d was reachable from origin/main. Approved `git worktree remove` left only the primary worktree and preserved the reachable commit; no forced filesystem deletion occurred. CLI housekeeping verification remains pending implementation.

- 2026-10-21, Feature 09 local candidate: full CLI suite 132 passed / 0 failed / 0 skipped on Windows; static truth guard, negative baseline fixture and release consistency passed. Strict lint reports 27 pages 0/0, stale clean, doctor 13/13. Existing Vite build passed. Chrome CDP device emulation verified actual 1440/390-pixel viewports, desktop/mobile rendering, and genuine script-disabled static fallback (`js: false`), with page scrollWidth matching viewport; deliberate horizontally scrollable nav/tables retain their incumbent behavior. Static and interactive demo labels identify illustrative/legacy content and unmeasured cost inputs. No CSS or interaction redesign. Deployment verification later passed: candidate39555626175 and main39556052075 succeeded; Pages39556051956 deployed ef2b0df. The existing URL returned corrected HTML (339490 bytes, HTTP200), and real Chrome desktop/mobile/script-disabled views confirmed the deployed truth labels and unchanged layout behavior.

- 2026-10-21, Feature 08 published baseline: candidate run 39552815955 and actual main run 39553397681 succeeded on all six Ubuntu/macOS/Windows Node 22/24 jobs; each full suite reported 132 passed / 0 failed / 0 skipped. POSIX alias filters reported 14/0/0. Main strict self-context and scaffold checks passed; actual tag run 39553402796 passed including release-consistency. Release v2.7.0 is published, latest-release API/badge report v2.7.0, and Pages run 39553397649 succeeded with the existing site returning HTTP 200. Source: GitHub run/job logs and release API, not local inference.

- 2026-10-21, Feature 08 final local candidate: `node tests/run.mjs` on Windows Node 24.21.0 passed 132 cases, 0 failed, 0 skipped. Syntax checks and copied-CLI parity passed; strict lint reported 26 pages 0/0, stale clean, doctor 13/13. `node tests/check-baseline.mjs` and `node tests/check-versions.mjs` passed. Existing website `npm run build` passed with its declared Vite 7.3.2 and emitted one 334460-byte HTML artifact. Remote supported-matrix success is still required before main/release publication.
- Candidate CI run 39552399951 passed both Ubuntu and both macOS Node 22/24 jobs, including aliased-temp preservation checks. Its actual self-context job correctly rejected a route to the ignored local issue page and absent fresh-checkout Git symlink transport configuration. The candidate correction removes that local-only route, configures local Git transport before read-only checks, and excludes the ignored issue page from the negative fixture. No lint bypass is introduced.

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
