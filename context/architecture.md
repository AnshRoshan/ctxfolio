---
title: Architecture
type: architecture
status: active
summary: Component roles, compilation flow and system invariants; file policy, runtime declarations and decisions have separate owners
tags: [architecture,components,boundaries]
covers: [scripts/**, assets/**, references/**, tests/**, SKILL.md]
updated: 2026-10-21
confidence: verified
verified_at: ef2b0df59c6a
---

# Architecture

## TL;DR

- The skill compiles project-local knowledge and shared agent resources into routable markdown and native host adapters.
- Canonical instruction bodies and native discovery views are separate; configuration formats are not shared across hosts.
- Tests exercise the installed CLI in disposable projects. Development-only baseline and live-truth probes guard repository claims separately. Results and commands belong in [testing](testing.md), not here.

## Components and roles

| Component | Role | Detail owner |
|---|---|---|
| SKILL.md | Entry router for the reusable skill | The skill's references |
| references/ | Operation and format specifications | Each focused reference |
| assets/ | Project-neutral scaffold inputs | File ownership contract |
| scripts/ctx.mjs | Profile detection, markdown bookkeeping and native adapter compilation | [Code map](codebase/map.md) |
| context/ | This project's normative knowledge pages | [File Ownership](ownership.md) |
| .agents/ | Shared authorable resource bodies | [Resource entrypoint](../.agents/README.md) |
| Native host folders | Loader/discovery adapters and host-owned configuration | The host's native files |
| tests/run.mjs | CLI behavior checks on copied tooling | [Testing](testing.md) |

Runtime requirements and installed versions are declared in package.json/manifests. Library usage lives in [library docs](library-docs.md). Design rationale lives in [decisions](decisions.md), including D-01, D-06 and D-07; this page does not repeat it.

## Compilation and lookup flow

1. Project manifests feed profile detection and select applicable scaffold inputs.
2. Setup creates missing owner pages and canonical resources; human/source-derived content stays in its selected owner.
3. Compatible native entrypoints/resource folders become real relative symlinks to canonical owners. Cursor metadata is generated once in a central view directory and directory-linked; checks compare both physical link targets and generated metadata.
4. Page frontmatter generates the catalog; task routing selects relevant pages and evidence review needs.
5. Git paths and covers globs identify affected owner pages. The main writer updates those owners; the next session resumes through pointers.

## System invariants

- The CLI is self-contained and portable; no external runtime install is required for a scaffolded project's bookkeeping.
- Development repository, installed skill and scaffolded project are distinct shipping boundaries; project output contains no development narrative.
- Project file operations stay within the chosen lexical and real root. User-authored sources are not silently overwritten; competing owners require deliberate resolution.
- Native adapter bodies never become independent procedure stores. Derived metadata can be regenerated; canonical bodies remain the editable source.
- Host configuration folders stay independent. Only compatible resource folders share filesystem aliases; incompatible Cursor metadata has one central generated view owner.
- Native permissions are checked before link replacement; validated snapshots/staged expected contents protect concurrent edits. Installed resource mode is committed last, and rollback never overwrites a newly occupied destination.
- Wiki writes are atomic (temp + fsync + rename); cooperating writers serialize on an external advisory lock; archive replay is idempotent. Install publishes through staged tree swaps with recoverable backups (not a crash-atomic directory exchange); setup backs up changed CLI bytes before atomic file replacement; `.ctx.json` migrates forward under `schemaVersion` without dropping unknown keys.
- Roadmap numeric IDs reserve the spec queue. `new feature` and `task add` only claim a reserved ID deliberately, and lint keeps roadmap, spec and tracker states coherent with required Wave 0 sections.
- Router backticks and `related:` edges must resolve. Shipped routing templates point only at always-created pages; optional contract/UI/ops pages are discovered through the catalog.
- App-source inventory/counting and explicitly covered materials are distinct: docs/reference examples are not app sources, but their declared owners still require review. Human dates use the local calendar; archive inputs validate before mutation and log heading/metadata publish together.
- Code intelligence tools are optional producers of evidence, not required stores or permission boundaries.

## Evidence

Source review: scripts/ctx.mjs → profile/scaffold flow, resourceInventory, adapterReport, ownershipHealth and git routing; tests/run.mjs → regression checks. Verification results are recorded at [their owner](testing.md#verification-evidence).
