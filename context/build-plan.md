---
title: Build Plan
type: plan
status: active
summary: The skill's phases — v2.1–v2.4 done, Phase 3 (verification + reach) next; what comes next is never the agent's call
tags: [plan,roadmap,phases]
updated: 2026-10-14
verified_at: 080a7adb7826
---

# Build Plan

## TL;DR

- Phases 1–2 are shipped (v2.0 wiki + v2.1 dynamic/delegating + v2.2 one-command + v2.3 teams/growth + v2.4 self-installing). Current work: Phase 3.
- Scope (WHAT) stays separate from tooling (HOW): the CLI can grow features without the method docs changing.
- New ideas discovered during a build get appended here first — then specced — never silently implemented.

## Phase 1 — the wiki foundation (COMPLETE — v2.0/v2.1)

- Compiled-knowledge architecture, router index, page format, staleness from git, hooks, task ledger, profile detection, tool delegation. See CHANGELOG.

## Phase 2 — one command, teams, self-install (COMPLETE — v2.2–v2.4)

- `ctx setup` idempotent + upgrade-safe; path-gated rules; agent memory; Lessons; danger zones; multi-user collision lint; `ctx archive`; `ctx install` from a GitHub link; dogfood (this repo's own wiki).

## Phase 3 — verification and reach (CURRENT)

- Feature 05: reliable routing and safe updates — user-requested skill upgrade; spec: feature-specs/05-reliable-context.md. Includes budgeted JSON, explicit trust flags, safe setup, lossless git paths and evidence-aware instructions.
- Feature 06: single-source agent resources and file ownership — [authorized scope](feature-specs/06-single-source.md); execution status is in the task ledger, and evidence is in testing.md.
- Feature 07: real Git-compatible relative symlinks — [authorized scope](feature-specs/07-native-symlinks.md); host settings remain separate, and evidence lives in testing.md.
- Backlog: evals runner — make `references/evals.md` executable against a human-reviewed answer set. Create the next free numbered spec when authorized.
- Backlog: hook parity beyond Claude — wire equivalents only where the host supports them; spec pending.
- Backlog: `ctx query` filing — reusable answer skeleton from a brief hit; spec pending.
- Backlog: opt-in project skills — authorized security-review/deploy/release playbooks; spec pending.

## Rules

- One system boundary per spec; ledger unit = branch = owner (see references/multi-user.md).
- Every feature lands with tests in the same commit (the suite is the contract).
