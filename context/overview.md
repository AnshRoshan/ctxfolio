---
title: Project Overview
type: overview
status: active
summary: What the project-context-system skill is, who it's for, its core flows, and the hard non-scope list
tags: [overview,scope,product]
updated: 2026-10-14
verified_at: 080a7adb7826
---

# Project Overview

## TL;DR

- This repo IS the `project-context-system` skill: markdown method docs + a zero-dependency Node CLI (`scripts/ctx.mjs`) that scaffolds and maintains a compiled project wiki for coding agents.
- Product = the skill's OUTPUT (any project's `context/` wiki) as much as the code: changing templates/docs changes user behavior, so every edit is judged as "what will an agent do differently".
- The test suite (`tests/run.mjs`, 72 cases) is the CLI's contract — a feature without a test is unfinished.

## What this is

A drop-in engineering system: `ctx install` puts the skill into an agent tool; `ctx setup` turns any repository (any language, greenfield or brownfield) into a self-maintaining markdown knowledge base — AGENTS.md schema, `context/` wiki with frontmatter pages, task ledger, path-gated rules, subagent definitions and best-effort workflow hooks. Budgeted JSON routing exposes freshness/trust review needs; agents verify evidence rather than treating pages or hook success as proof.

## Who it's for

Solo builders and small teams (2–10 devs, each with coding agents) who want session-zero recovery: any fresh agent, any tool, picks up from the repo without re-explaining.

## Core flows

1. **Adopt**: clone/link → `ctx install` → `cd project && ctx setup` → agent fills placeholders from the planning conversation → `ctx task add/start/done` loop.
2. **Maintain**: code changes → `ctx impact` → pages updated in the same change → `ctx stamp` → Stop hook blocks otherwise.
3. **Grow**: `ctx archive` rotates hot files; lint flags collisions, size, staleness; `ctx detect`/`ctx tools` keep it stack-agnostic.

## Complex patterns / what could go wrong

- The CLI must stay **zero-dependency and Windows-safe** (git output parsing, CRLF, path separators) — regressions here break every user.
- Templates are user-facing prompts: wording bugs = agent behavior bugs.
- The no-leak boundary (repo dev history vs shipped skill vs scaffolded project) is subtle; three tests guard it — don't remove them.

## In scope

The currently authorized feature/request only; build-plan.md contains future proposals, not blanket authorization. The skill's own wiki (this folder) is in scope for keeping this upgrade accurately documented.

## Deliberately out of scope

- npm publishing of the CLI (it's copied, never installed as a package) · daemon/watch mode · databases or backends of any kind (this repo has none) · IDE plugins · personal-assistant memory trees (see CHANGELOG v2.2 rationale) · auto-filling placeholders from guesses — that's the agent's judgement job, not the tool's.
