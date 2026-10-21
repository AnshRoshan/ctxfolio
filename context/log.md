---
title: Activity Log
type: log
status: active
summary: Append-only timeline of ingests, builds, decisions, fixes and lint passes
updated: 2026-10-21
---

# Log

Append-only. One entry per meaningful event, newest at the bottom. Prefix is fixed so it stays greppable:

`## [YYYY-MM-DD] <op> | <title>` — ops: `ingest` `query` `build` `decision` `fix` `lint` `sync` `audit` `handoff`

Add entries with: `node context/ctx.mjs log <op> "<title>" -m "one or two lines: what changed, which pages"`
Read recent history with: `node context/ctx.mjs log --tail 10`

## [2026-10-06] audit | Context system scaffolded
Initial scaffold created. Placeholders to be filled from the planning conversation.

## [2026-10-06] build | dogfood: this repo now runs its own context system
setup + filled wiki; detect word-boundary fix

## [2026-10-06] decision | D-05 ASD-STE100 prompt craft
pages: references/prompt-craft.md (new), feature-spec template, workflow-rules, SKILL.md

## [2026-10-06] build | README rewritten as landing surface; MIT LICENSE added
pages: README.md, LICENSE

## [2026-10-06] build | website: integrated the model-built Vite site into web/
scroll-meter moved to CSS scroll-timeline; mobile section nav added; future dates fixed; website.md module page keeps coverage at 100%

## [2026-10-14] build | Feature 05 reliable routing and safe updates
72/72 local Windows tests; strict lint and doctor pass; no commits or publish. Hook EOF and executable-config validation limits retained in memory.md.

## [2026-10-14] build | Feature 06 single-source ownership
Evidence: context/testing.md#verification-evidence; canonical sources linked to host-native adapters; no commits or publishing.

## [2026-10-14] build | Feature 07 native symlinks
Evidence: context/testing.md#verification-evidence; actual project aliases verified; Windows prerequisite documented; no commit or publish.

## [2026-10-20] audit | market, evidence and repo audit of the project-context category
Competitors compared: AGENTS.md-native loaders, Cline/Roo Memory Bank, Claude auto-memory, Cursor/Windsurf memories, DeepWiki and local-first code intelligence, Mem0/Zep/Letta, Spec Kit/BMAD/Kiro. Findings: governance and portability lead; proof, capture, retrieval precision and two knowledge classes missing. Local checks were all green while four wiki claims were stale.

## [2026-10-20] decision | D-08 D-09 D-10 — ordered spec queue, deterministic evals, sourced numbers
Phase 4 sequenced smallest-first with provenance and quarantine before passive capture; evals stay zero-dependency routing metrics; every committed number names its measurement source.

## [2026-10-20] build | Phase 4 spec list created; Feature 08 specced and registered
build-plan.md gained Waves 1-6 (Features 08-29). Feature 08 always-green baseline spec written and added to the ledger. No code changes yet.

## [2026-10-21] audit | substrate addendum — the checker is not fail-closed
Second audit found a multiline-summary parser drop, a brace-glob `Nothing to repeat` crash, eight dead routes, nine pages citing unreachable `080a7adb7826`, in-place writes outside the symlink transaction, an unvalidated install name and stale-file leak, and a red CI (98/3 on macOS Node 20/22, 97/4 on Node 18).

## [2026-10-21] decision | D-11 D-12 F-01 — version tracks, local dates, appended Wave 0 IDs
Skill/CLI 2.x and package/plugin 3.x stay separate with a mapping; human-facing dates use the local calendar day; Features 30-34 are appended as Wave 0, with the wave table authoritative until F-01 is decided.

## [2026-10-21] plan | Wave 0 added; Feature 08 corrected
build-plan.md gained Features 30-34 (page-contract integrity, crash-safe writes, upgrade/install transaction, spec-queue integrity, route integrity). Feature 08 now covers the fourth macOS Node 18 failure, Node 22/24, and the two-track version check. No code changes.

## [2026-10-21] build | Feature 30 page-contract integrity
parseFrontmatter folded/literal scalars and named errors; recursive brace covers compiler fails closed with globError; lint/brief surface contract errors; 5 regression cases. 106 tests passed, lint 22 pages 0/0, stale clean, doctor 13/13. Evidence: context/testing.md#verification-evidence.

## [2026-10-21] build | Feature 31 crash-safe writes
atomicWrite (temp+fsync+rename), appendAtomic, cross-process advisory lock with stale recovery and process-exit cleanup, idempotent archive replay; core writers locked. 109 tests passed, lint 23 pages 0/0, stale clean, doctor 13/13. Evidence: context/testing.md#verification-evidence.

## [2026-10-21] build | Feature 32 install transaction
Staged SHIP-only install with name/symlink refusal, manifest and backup swap; --dry-run; setup CLI backup; .ctx.json schemaVersion migration preserving unknown keys; 114 tests, lint 24 pages 0/0, stale clean, doctor 13/13.

## [2026-10-21] build | Feature 33 spec-queue integrity
Roadmap numeric reservations parsed; new feature/task add refuse implicit reserved IDs and accept explicit --spec; lint enforces roadmap-spec-tracker coherence, required Wave 0 sections and D-NN refs; 117 tests, lint 25 pages 0/0, stale clean, doctor 13/13.

## [2026-10-21] build | Feature 34 route and relation integrity
Router templates now use only always-created pages; lint validates router backticks, code-span paths and related targets; fixed relative related paths in map/module/API/integration templates; 119 tests, lint 26 pages 0/0, stale clean, doctor 13/13. Wave 0 reported complete at this checkpoint.

## [2026-10-21] audit | Wave 0 completion rechecked before the green baseline
The 119-test Windows baseline reproduced, but independent source review found uncovered live-lock eviction, lock-release ownership, internal index locking, install real-ancestor/name validation, archive block identity, duplicate roadmap IDs and fenced/tab parsing defects. Corrections and focused regressions are part of the Feature 08 candidate; the earlier green result was necessary, not sufficient.

## [2026-10-21] decision | D-13 remote candidate validation approved
The human approved a temporary CI-validation branch, followed by main/release publication only after all checks pass. This resolves the no-push-before-macOS-green paradox without weakening the main-green gate before Feature 09.

## [2026-10-21] build | Feature 08 baseline gates and preservation proof
Aliased POSIX TMPDIR reproduced the three macOS failures. Shared sandbox canonicalization and explicit injection/recovery assertions fix the test-harness cause without changing native symlink semantics. Three isolated mutants each failed their expected preservation assertion. Actual cross-platform CI remains required. New self-context/version gates and their negative fixture checks passed locally; runtime floors and Actions/runner declarations refreshed.

## [2026-10-21] build | Feature 08 candidate gates validated locally
Exact placeholder/source-drift, version/mapping/metadata/tag regressions passed; final source suite and remote supported CI pending. Wave 0 safety audit corrections included.
