---
title: Code Standards
type: standards
status: active
summary: How ctx.mjs, templates, docs and tests are written here — style rules with reasons, not preferences
tags: [standards,conventions,style]
updated: 2026-10-06
verified_at: 080a7adb7826
---

# Code Standards

## TL;DR

- One-file zero-dep CLI, node builtins only; ESM; two-space indent; semicolons.
- Every command output goes through `emit(payload, humanFn)` — JSON contract `{command, ok}` or human text, never raw prints in JSON mode.
- Tests are the contract: behavior change without a test in `tests/run.mjs` is not done.

## Language & style

- Plain JS on the supported Node tracks declared in package.json, no TypeScript, no deps — D-01. `node --check` must pass.
- Helpers live at the top with the rest (glob engine, frontmatter, git); commands only compose them.
- Paths: internal absolute, user-facing ALWAYS relative via `rel()`.
- git invocations: through `git()` (CRLF-normalized, never `.trim()` on positional output).

## Templates (assets/)

- `{{PLACEHOLDER}}` = needs human/agent judgement (lint flags unfilled); `{{TODAY}}` = CLI-substituted. Nothing else may use double braces.
- A template is a user-facing prompt: write it as instructions to an agent, tight and imperative; no repo dev history inside (boundary tests enforce).
- Every scaffolded file has a predicate in `INIT_MAP` — profile-gated, never unconditional bloat.

## Docs (SKILL.md, references/)

- SKILL.md is a router (~130 lines cap); depth goes to references/; one fact, one home.
- No emoji, no marketing voice, concrete commands over descriptions.

## Error handling

- CLI misuse → `die(msg)` (exit 1, actionable message, no stack traces).
- Missing optional machinery (no git, no assets, probe failure) → degrade with a printed note, never crash.

## Testing

- `node tests/run.mjs` before finishing ANY unit; `node tests/run.mjs <filter>` while iterating.
- New lint rule → new test asserting both the trigger and the non-trigger (templates must stay clean).
- Tests drive the copied `context/ctx.mjs` (proves portability), never import the CLI.

## Quality gates

- Follow the applicable checks and evidence at [testing](testing.md); record user-facing changes and declared release metadata at their owners, not as another check-count inventory here.
