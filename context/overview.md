---
title: Project Overview
type: overview
status: active
summary: What ctxfolio is, who it serves, its core flows and the remaining non-scope list
tags: [overview,scope,product]
updated: 2026-10-21
---

# Project Overview

## TL;DR

- This repo is `ctxfolio`: markdown method docs and a zero-dependency Node CLI (`scripts/ctx.mjs`) that scaffolds and maintains a compiled project wiki for coding agents. Historical records retain their earlier product names.
- Product = the skill's OUTPUT (any project's `context/` wiki) as much as the code: changing templates/docs changes user behavior, so every edit is judged as "what will an agent do differently".
- The test suite (`tests/run.mjs`) is the CLI's contract — a feature without a test is unfinished. Current results and case counts live in [testing evidence](testing.md#verification-evidence).

## What this is

A drop-in engineering system: `ctx install` puts the skill into an agent tool; `ctx setup` turns any repository (any language, greenfield or brownfield) into a self-maintaining markdown knowledge base — AGENTS.md schema, `context/` wiki with frontmatter pages, task ledger, path-gated rules, subagent definitions and best-effort workflow hooks. Budgeted JSON routing exposes freshness/trust review needs; agents verify evidence rather than treating pages or hook success as proof.

## Who it's for

Solo builders and small teams (2–10 devs, each with coding agents) who want session-zero recovery: any fresh agent, any tool, picks up from the repo without re-explaining.

## Core flows

1. **Adopt**: clone/link → `ctx install` → `cd project && ctx setup` → agent fills placeholders from the planning conversation → `ctx task add/start/done` loop.
2. **Maintain**: code changes → `ctx impact` → review/update owner pages in the same change → `ctx stamp` after source verification. Configured Claude Stop hooks can request missing bookkeeping; [bypass and verification limits](../references/safety-permissions.md#hooks-shipped-with-this-skill-v2) still apply.
3. **Grow**: `ctx archive` rotates hot files; lint flags collisions, size, staleness; `ctx detect`/`ctx tools` keep it stack-agnostic.

## Complex patterns / what could go wrong

- The CLI must stay **zero-dependency and Windows-safe** (git output parsing, CRLF, path separators) — regressions here break every user.
- Templates are user-facing prompts: wording bugs = agent behavior bugs.
- The no-leak boundary (repo dev history vs shipped skill vs scaffolded project) is subtle; keep its [boundary tests](testing.md#must-be-covered).

## In scope

The currently authorized feature/request only; build-plan.md contains future proposals, not blanket authorization. The skill's own wiki (this folder) is in scope for keeping this upgrade accurately documented.

## Deliberately out of scope

- daemon/watch mode · databases or backends of any kind (this repo has none) · IDE plugins · personal-assistant memory trees (see CHANGELOG v2.2 rationale) · auto-filling placeholders from guesses — that's the agent's judgement job, not the tool's.

Source review: package.json → engines/bin, scripts/ctx.mjs → SHIP/install/setup/hook and tests/run.mjs → CLI fixtures/no-leak cases, at `b7e58d6586c2` on 2026-10-21. Observed verification belongs to [testing evidence](testing.md#verification-evidence); this review is not a benchmark or host-loader proof.
