---
title: Progress Tracker
type: tracker
status: active
summary: The task ledger — In progress (max one), Blocked, Up next, Completed with concrete details
tags: [progress,status,tasks]
updated: 2026-10-24
---

# Progress Tracker

## TL;DR

- The sections below own task execution states. Verification evidence lives in [testing](testing.md#verification-evidence); project facts are not copied into this ledger.

The only file that updates constantly, and the only place a unit's state lives. States are
mutually exclusive — move lines with `ctx task` (`add` / `start` / `block` / `done`); it keeps
the ledger honest (one unit In progress at a time, `done` requires concrete details).

Roadmap position: [build plan](build-plan.md) Phase 4 Wave 0 and Features 11–29 are locally complete. Features 01–10/30–34 retain their historical completion/publication records below unchanged. Features 11–29 passed the single consolidated local verification/fix pass (D-15); Feature 19 now has actual reader and independent grade artifacts, not only preparation. Final roadmap candidate CI39572599110 succeeded across all six jobs and self-context/scale/eval; main was fast-forwarded to 2263e5e. The separately approved ctxfolio publication follows D-16.

## In progress

## Blocked

## Up next
- Authorized publication task: ctxfolio@3.8.0 / AnshRoshan/ctxfolio / v2.8.0 (D-16). This is not a new numbered feature; registry/release verification remains pending.

## Local completion and publication gate

- Actual local commands/results are owned by [testing](testing.md#verification-evidence): `node tests/run.mjs` **192 passed / 0 failed / 0 skipped**; `node tests/features22-29.mjs` **18 passed / 0 failed**; syntax, copied-CLI parity and truth/baseline/version passed; strict lint **48 pages, 0 errors/warnings**, stale clean and doctor **13/13**. These are the recorded final integrated local run, not inferred remote results.
- Feature 19: [actual reader answers](evals/cold-start-reader.json) and [independent grades](evals/cold-start-grades.json) establish **8 correct, 2 partial, 0 wrong, 0 not-found out of 10** for one reader/grader pair only. Actual tokens/cost/time remain null; hidden opens and repeated-open timing are uninstrumented, and concurrent checkout changes limit reproducibility. No efficiency target, generalized savings or task-success improvement is established.
- Host rows remain declared capabilities; MCP proof is bounded local initialized stdio functional exchange, not live native-host discovery. Human/agent actor labels are declared attribution, not authenticated external identity.
- Final roadmap CI39572599110 succeeded and main now includes 2263e5e. Parent-owned naming/version publication checks and final catalog/facts refresh remain separate; do not treat approval as registry/release success.

## Completed
- Feature 11: Resume-cursor liveness — 2026-10-21 — locally complete; [spec](feature-specs/11-resume-cursor-liveness.md); [CLI](../scripts/ctx.mjs) status/brief/SessionStart advisory, exact project-scoped Git paths and unknown/dirty qualification; [behavior evidence](testing.md#verification-evidence), including focused advisory and read-only regressions.
- Feature 12: CLI and library profile gating — 2026-10-21 — locally complete; [spec](feature-specs/12-cli-library-profile-gating.md); [CLI](../scripts/ctx.mjs) predicates and [contract](../assets/api-contracts.md.template)/[environment](../assets/env-vars.md.template)/[runbook](../assets/runbook.md.template) templates; profile, precedence and preservation [evidence](testing.md#verification-evidence).
- Feature 13: Derived facts — 2026-10-21 — locally complete; [spec](feature-specs/13-derived-facts.md); [CLI](../scripts/ctx.mjs) source-named read-only facts, explicit generated-block refresh and copied-live-claim lint; deterministic/preservation/drift [evidence](testing.md#verification-evidence).
- Feature 14: Issue queue split — 2026-10-21 — locally complete; [spec](feature-specs/14-issue-queue-split.md); [shared issue owner](issues.md), ignored private/legacy diagnostics, preservation and doctor ignore checks through [CLI](../scripts/ctx.mjs); [evidence](testing.md#verification-evidence), with no automatic private promotion.
- Feature 15: INGEST quarantine — 2026-10-21 — locally complete; [spec](feature-specs/15-ingest-quarantine.md); [CLI](../scripts/ctx.mjs) hash-bound declared-human acknowledgement, raw scanner and fail-closed ingest/propagation guards; source-change and refusal [evidence](testing.md#verification-evidence), not identity authentication or universal attack detection.
- Feature 16: Claim provenance and temporal validity — 2026-10-21 — locally complete; [spec](feature-specs/16-claim-provenance-validity.md); [CLI](../scripts/ctx.mjs) declared actors/dates, main reachability and dirty/unknown unverified snapshots; provenance/expiry/self-verification-refusal [evidence](testing.md#verification-evidence), not external identity proof.
- Feature 17: Retrieval precision — 2026-10-21 — locally complete; [spec](feature-specs/17-retrieval-precision.md); [CLI](../scripts/ctx.mjs) Unicode/IDF routing, code-history discount and bounded one-hop related expansion; [batch tests](../tests/batch17-21.mjs) and integrated [evidence](testing.md#verification-evidence).
- Feature 18: Deterministic routing evaluation — 2026-10-21 — locally complete; [spec](feature-specs/18-deterministic-routing-eval.md); frozen [questions](evals/questions.json), fail-closed evaluator and integrated [CI gates](../.github/workflows/ci.yml); [recorded routing output](evals/routing-result.json) and [verification evidence](testing.md#verification-evidence), not semantic correctness or savings.
- Feature 19: Actual cold-start evidence — 2026-10-21 — locally complete; [spec](feature-specs/19-cold-start-evidence.md); actual [reader](evals/cold-start-reader.json)/[independent grader](evals/cold-start-grades.json) artifacts against frozen questions, 8 correct/2 partial of 10; [evidence and limits](testing.md#verification-evidence): one pair, usage null, uninstrumented opens/concurrent checkout, no efficiency claim.
- Feature 20: Knowledge types, ADR lifecycle and query filing — 2026-10-21 — locally complete; [spec](feature-specs/20-knowledge-types-adr-query.md); [CLI](../scripts/ctx.mjs) neutral optional types, stable explicit ADR split/lifecycle and evidence-linked draft query filing; [batch tests](../tests/batch17-21.mjs) and [evidence](testing.md#verification-evidence).
- Feature 21: Governed capture — 2026-10-21 — locally complete; [spec](feature-specs/21-governed-capture.md); [CLI](../scripts/ctx.mjs) metadata-only digest, isolated inbox, declared-human hash approval and draft-only guarded promotion integrated with Features 15/16; tamper/stale/refusal [evidence](testing.md#verification-evidence).
- Feature 22: Scaffold tiers — 2026-10-21 — locally complete; [spec](feature-specs/22-scaffold-tiers.md); [CLI](../scripts/ctx.mjs) lite/standard/full predicates, shared issue owner in every tier, blank queues and preservation-first upgrades; [functional suite](../tests/features22-29.mjs) and [evidence](testing.md#verification-evidence).
- Feature 23: Project-local discovery skill — 2026-10-21 — locally complete; [spec](feature-specs/23-project-local-skill.md); [skill template](../assets/project-skill.md.template) and [CLI](../scripts/ctx.mjs) generation of the canonical project discovery skill, preserved user bodies/declared adapters; [functional evidence](testing.md#verification-evidence), not live host discovery proof.
- Feature 24: Declared host matrix — 2026-10-21 — locally complete; [spec](feature-specs/24-declared-host-matrix.md); [CLI](../scripts/ctx.mjs) hosts/shared install default, explicit host/Qoder adapters and unknown-host refusal; [functional evidence](testing.md#verification-evidence), with capability rows explicitly declared-not-live-verified.
- Feature 25: Portable checks — 2026-10-21 — locally complete; [spec](feature-specs/25-portable-check.md); [CLI](../scripts/ctx.mjs) bounded read-only gate aggregation, failure exits and repair/invalid-gate refusal; unchanged-file [functional evidence](testing.md#verification-evidence).
- Feature 26: Delegated symbol routing — 2026-10-21 — locally complete; [spec](feature-specs/26-delegated-symbol-routing.md); [CLI](../scripts/ctx.mjs) validated Ctags/Graphify import, hash-provenanced derived symbol search and owner routing; traversal/secret refusal and preserved-index [evidence](testing.md#verification-evidence).
- Feature 27: Derived search and hierarchy — 2026-10-21 — locally complete; [spec](feature-specs/27-derived-search-index.md); [CLI](../scripts/ctx.mjs) deterministic explicit rebuild, stale canonical fallback and generated-catalog compaction; scale/no-hidden-read-write [evidence](testing.md#verification-evidence).
- Feature 28: Read-only MCP stdio — 2026-10-21 — locally complete; [spec](feature-specs/28-readonly-mcp.md); [CLI](../scripts/ctx.mjs) initialized newline JSON-RPC and bounded read-only tools; [functional suite](../tests/features22-29.mjs) refusal/exchange [evidence](testing.md#verification-evidence), not live native-host integration proof.
- Feature 29: Team scoping and federation — 2026-10-21 — locally complete; [spec](feature-specs/29-team-scoping.md); [CLI](../scripts/ctx.mjs) declared fixed agent cursors, ambiguity reporting and allowlisted read-only federation; independent cursor/shared-write refusal/no-sibling-index-write [evidence](testing.md#verification-evidence).
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
- Feature 09: Dogfood truth repair — 2026-10-21 — Evidence: context/testing.md#verification-evidence; 132/0/0 suite, truth/baseline/version probes, strict lint27 0/0 stale clean doctor13/13; candidate39555626175/main39556052075 green; Pages39556051956 and real deployed desktop/mobile/noJS verified.
- Feature 10: CLI honesty and housekeeping — 2026-10-21 — Evidence: context/testing.md#verification-evidence; full147/0/0,15focused; candidate39559173759/main39559766799 greenall6; strictlint28 0/0 staleclean doctor13/13 andallguards; safeGitlegacyworktreeremoval retainedhistory.
- Feature 35: website-redesign Modern visual redesign of the public website — 2026-10-24 — Modern website redesigned; build/typecheck/browser checks and full self-test passed; evidence: context/testing.md#verification-evidence
## Session notes

- 2026-10-06: detect() substring bug found by dogfooding — 'gin' matched "context-engineering" → backend false positive; fixed with word-boundary regex over manifest text (dep names keep substring match).
