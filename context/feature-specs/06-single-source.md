---
title: Single-Source Agent Resources and File Ownership
type: feature
status: complete
summary: Canonical agent resources with portable host adapters and explicit non-overlapping markdown ownership
updated: 2026-10-14
covers: [scripts/ctx.mjs, tests/run.mjs, assets/**, references/**, SKILL.md]
---

# Single-Source Agent Resources and File Ownership

## TL;DR

- Direct follow-up request: include memory, decisions, rules, skills and internally created agent folders; eliminate repeated facts and unclear ownership.
- Canonical resources live in `.agents/`; host adapters point there and never own reusable instruction bodies.
- Native settings remain host-specific. No whole-directory symlinks, new dependencies, external install, or destructive migration.

## Acceptance criteria

- [x] Scaffold memory.md, context/decisions.md, ownership.md, rules, agent definitions and local skill directories.
- [x] Root AGENTS.md owns shared agent policy; CLAUDE.md imports it and owns only Claude-specific notes; Cursor/Copilot/Gemini adapters point to it.
- [x] `.agents/agents`, `.agents/rules`, `.agents/skills` are canonical; tool adapters contain only discovery metadata and links.
- [x] `ctx new agent|rule|skill` creates canonical authorable resources with safe paths; copied CLI works without skill assets.
- [x] Generated adapters refresh from canonical metadata, but hand edits and existing custom legacy files are preserved and reported as conflicts.
- [x] `ctx rules` follows canonical routes and includes native Cursor .mdc files without duplicate page lists.
- [x] Lint/doctor find broken adapter sources, competing instruction bodies and likely exact prose duplication; semantic uniqueness remains a reviewed rule, not a guarantee.
- [x] Templates clearly separate session state, task ledger, decision rationale, architecture, data/API/UI details, host config and reusable procedures.
- [x] Existing regression suite plus focused adapter/ownership/migration cases pass; dogfood scaffold and handoff agree.

## Verification

Verification outcome: [Testing evidence](../testing.md#verification-evidence). Source review covers fresh/upgrade scaffolds, copied-CLI authoring, adapter parity, broken routes, quoted/brace metadata and custom-content preservation. No live-host loader behavior is claimed without host verification.
