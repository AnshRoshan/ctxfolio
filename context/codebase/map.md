---
title: Codebase Map
type: architecture
status: active
summary: The CLI, behavior suite, baseline/release probes and markdown layers — where each behavior lives
tags: [map, structure, entry-points]
covers: [scripts/ctx.mjs, tests/**]
related: [../architecture.md]
updated: 2026-10-21
confidence: verified
verified_at: ef2b0df59c6a
---

# Codebase Map

## TL;DR

- CLI entrypoint: `scripts/ctx.mjs`; behavior checks: `tests/run.mjs`; development-only baseline/release gates: tests/check-baseline.mjs and tests/check-versions.mjs.
- Use the symbol routing table below for changes. Component roles and invariants live in [architecture](../architecture.md), not this navigation map.
- Project-generated catalogs and native adapters are views; edit their canonical inputs.

## Annotated tree

```
SKILL.md              the router agents load (mode table, bootstrap, core loop, recording table)
scripts/ctx.mjs       the entire CLI: args → commands.{setup,init,task,lint,doctor,impact,stale,brief,rules,index,coverage,log,stamp,new,status,detect,tools,archive,hook,install}
  ├ utils/frontmatter glob engine         parseFrontmatter (folded/literal scalars, named errors) / globToRegex (nested braces, fail-closed) / matchers — shared by every command
  ├ atomicWrite/withLock/archiveEntries   temp+fsync+rename writes, external advisory lock, idempotent archive replay
  install transaction              SHIP-only staged copy, symlink refusal, local manifest, recoverable two-rename backup/publication; setup CLI backup and config schema migration
  roadmapReservations()            parses build-plan numeric rows; guards new feature/task add and lint queue coherence
  scanCodeSpans()/related check    validates router backticks and page-relative related targets during lint
  ├ pages()/isSourcePath()/sourceFiles()/staleReport()   source inventory/counting reuses configured path filters; impact separately reviews explicit material owners
  today()/archiveWindow()/commands.log   local calendar dates, validated no-write archive cutoffs, one-date atomic log metadata/entry
  ├ detect() + DEP_MARKERS + INTEL_TOOLS  profile detection and delegation-tool probing (setup/init read it)
  └ commands.*                            each subcommand; emit() wraps human/JSON output ({command, ok})
references/           deep playbooks, one per operation (ctx-cli.md documents every flag)
assets/               templates for every scaffolded file; *.template suffix stripped on copy
tests/run.mjs         self-test: sandbox() builds throwaway git repos, ctx() drives the copied CLI
```

## Entry points

| Kind | File | Notes |
|---|---|---|
| CLI | `scripts/ctx.mjs` | `node scripts/ctx.mjs <command>`; help text is the file's own header comment |
| bin | package.json `bin.ctx` | same file |
| Test | `tests/run.mjs` | `node tests/run.mjs [filter]` |
| Static truth guard | `tests/check-truth.mjs` | `node tests/check-truth.mjs`; current live claims, install boundary, evidence links and illustrative demo labels |

## Where is X?

| I need to… | Go to |
|---|---|
| change scaffold behavior / add a shipped file | `commands.init` + `INIT_MAP` in scripts/ctx.mjs, template in assets/ |
| change profile detection | `detect()` / `DEP_MARKERS` / `MANIFEST_LANG` |
| add a lint rule | `commands.lint` (+ document in references/ctx-cli.md, test in tests/run.mjs) |
| change context routing/budgets/trust | `commands.brief` + `orientationFiles()`; references/context-routing.md + ctx-cli.md |
| change git filenames/impact | `gitFiles()` / `changedSince()` / `dirtyFiles()`; NUL-delimited records |
| change safe setup boundaries | `projectPathError()` / `assertProjectPath()` + init preflight + pristine-template `mapDraft()` |
| change canonical host integration | `resourceInventory()` / `adapterReport()` / `commands.adapters` |
| change real symlink layout/migration | `SYMLINK_LAYOUT` / `symlinkReport()` / `probeSymlinks()` / `commands.symlinks` |
| change file separation checks | `ownershipHealth()` / `duplicateProse()` + ownership template |
| change task-ledger states | `commands.task` + `TASK_SECTIONS` + tracker template |
| edit what agents are told | SKILL.md (router) or references/*.md (depth) — never both |
| ship a new file into projects | assets/*.template + INIT_MAP entry with a profile predicate |

Source review: scripts/ctx.mjs → imports, commands dispatch, SHIP/install, gitFiles/dirtyFiles/staleReport, doctor/hook and INIT_MAP; tests/run.mjs → sandbox/ctx/filter and install no-leak case; package.json → bin/scripts, at `b7e58d6586c2` on 2026-10-21. Full-run results remain in [testing evidence](../testing.md#verification-evidence).

## Generated / do-not-edit

- `context/ctx.mjs` (a copy — refresh via setup) and the catalog block between `<!-- ctx:index:* -->` markers in context/index.md are generated views.
- The former legacy editor worktree was safely removed through Git in Feature 10; its reachable commit history is retained. Cleanup evidence and recovery limits live in [operational gotchas](../library-docs.md#known-operational-gotchas).
