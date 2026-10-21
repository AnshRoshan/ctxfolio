---
title: Route and relation integrity
type: feature
status: complete
summary: Fail closed on dead router backticks, missing related targets and broken code-span paths, and ship routing templates without optional pages
tags: [routing,relations,lint,templates]
covers: [scripts/ctx.mjs, tests/run.mjs, assets/index.md.template, assets/workflow-rules.md.template, context/index.md, context/workflow-rules.md]
related: [../build-plan.md, ../index.md, ../workflow-rules.md, ./33-spec-queue-integrity.md]
updated: 2026-10-21
confidence: unverified
---

# Route and Relation Integrity

## TL;DR

- 2026-10-21 provenance review: legacy checkpoint `ef2b0df59c6a` (recorded 2026-10-21) is explicitly unverified; no declared verifier or validity interval is established. Historical completion dates/evidence/checks are retained, not reverified. Source: dated evidence/checklist below and ../testing.md#verification-evidence.

- Goal: every hand-maintained route and every `related:` edge resolves to a real page, and a scaffolded router never points at optional pages the project did not create.
- Boundary: the task-routing block in `context/index.md`, `context/workflow-rules.md`, all `related:` frontmatter, and inline code paths in the two router pages. Ordinary-page illustrative code spans are outside this numbered scope.
- Measurable: removing a routed page, renaming a `related:` target or deleting a code-span file makes strict lint fail with the owning page; the shipped templates route only to always-created pages.

## Why now

The 2026-10-21 audit found eight dead routes in `context/index.md` (`ui-rules.md`, `ui-tokens.md`, `ui-registry.md`, `data-model.md`, `api-contracts.md`, `integrations.md`, `runbook.md`, `env-vars.md`) and `workflow-rules.md` naming `runbook.md` unconditionally. Lint checks markdown links and wikilinks, but not the router's backticks or `related:` edges, so the first page an agent reads can send it to files that do not exist. The static index template reproduces the dead routes in every non-UI, non-database project.

## What to build

1. Replace the task-routing rows in `context/index.md` and `assets/index.md.template` with routes to always-created pages. Optional contract, UI and operations pages stay discoverable through the generated catalog instead of dead prose.
2. Remove the unconditional `runbook.md` reference from `context/workflow-rules.md` and `assets/workflow-rules.md.template`; point at testing plus operational pages when the catalog has them.
3. In `ctx lint`, validate each inline code token in the router pages that looks like a project path: resolve from the project root first, then the page directory; skip commands, flags, globs, placeholders, URLs and absolute machine paths.
4. Validate every `related:` frontmatter entry as a page-relative path; a missing target is an error.
5. Validate bare `*.md`/`*.mjs` backticks in the two router pages (`context/index.md`, `context/workflow-rules.md`), where a missing target is unambiguously dead routing rather than optional prose.
6. Add tests for a dead routed page, a missing `related:` target, a missing code-span path, and a clean routing fixture. Assert the shipped templates do not name optional pages in their routing rows.
7. Keep the existing markdown-link and wikilink checks; do not relax them.

## Explicitly NOT in this spec

- Do not generate the hand-maintained routing table from the catalog.
- Do not require optional pages (`ui-*`, `data-model`, `api-contracts`, `integrations`, `env-vars`, `runbook`) to exist.
- Do not validate paths inside fenced code blocks.
- Do not validate prose mentions that are not inline code.
- Do not change the catalog format or page numbering.

## Clarifications

- "Code-span path" means an inline backtick token shaped like a relative project path or a known file extension, not every backtick.
- Bare page names are validated only in the two router pages because elsewhere they are commonly optional-page prose.
- Root-first resolution matches how agents read paths; page-relative fallback matches `related:` and router rows.
- A trailing slash denotes a directory and must exist like any other path.
- The generated catalog is already checked for orphans; this spec adds target existence, not a second catalog.

## Value sources

| Value | Comes from |
|---|---|
| Eight dead routes in `context/index.md` | `context/index.md` task-routing table, read 2026-10-21 |
| `workflow-rules.md` names `runbook.md` unconditionally | `context/workflow-rules.md` line 54, read 2026-10-21 |
| Lint checks markdown links but not router backticks | `scripts/ctx.mjs` → `commands.lint`, read 2026-10-21 |
| Templates reproduce the optional-page routes | `assets/index.md.template` lines 19-23, read 2026-10-21 |
| 119 passed / 0 failed / 0 skipped baseline | `node tests/run.mjs` on Windows, 2026-10-21 |

## Verification checklist

- [x] `context/index.md` and `assets/index.md.template` route only to always-created pages
- [x] `context/workflow-rules.md` and its template no longer name `runbook.md` unconditionally
- [x] Lint errors on a routed page that does not exist
- [x] Lint errors on a missing `related:` target
- [x] Lint errors on a missing code-span path
- [x] Commands, flags, globs, URLs and placeholders do not false-positive
- [x] A coherent routing fixture lints clean
- [x] `node tests/run.mjs` passes with the new cases and 0 failures
- [x] `node context/ctx.mjs lint --strict`, `stale --strict` and `doctor` are green
- [x] `../progress-tracker.md`, `../../memory.md`, `../log.md` and `../index.md` reflect the unit

## Verification evidence

- 2026-10-21 completion recheck: fenced examples (backtick/tilde and unclosed fences) are excluded from router code-span checks; path-shaped flags are excluded, while missing live routes still error. Ordinary-page prose remains out of router scope. Focused regressions are recorded at [testing](../testing.md).

- 2026-10-21, Feature 34: full suite 119 passed, zero failed, zero skipped on Windows; dead router backticks, missing code-span paths and missing related: targets fail lint, while commands, globs, URLs and placeholders do not.
- The completion recheck additionally removed unconditional routing to the ignored local issue page: a fresh checkout must route through tracked owners even without personal scratch.
- Router/template routes now use only always-created tracked pages; .claude/module/API/integration templates resolve their relative related: targets. Strict lint reports 26 pages with zero errors/warnings, stale --strict is clean and doctor passes 13/13.
