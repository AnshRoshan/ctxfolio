---
title: Website redesign
type: feature
status: complete
summary: User-authorized modern redesign of the public website with factual content and interactive/static behavior preserved
tags: [website, design, accessibility]
covers: [web/**]
related: [../codebase/modules/website.md, ../testing.md]
updated: 2026-10-24
confidence: unverified
unverified_snapshot: ece5d7c80d2e7b21cbbcc7cfd7e2d5ef55560188533fcb98ccb2daa06d3f1329
snapshot_state: dirty-tree
---

# Website Redesign

## TL;DR

- The user requested a complete, beautiful modern website redesign and approved creative control, preserving product facts, install commands, demos, themes, and no-JavaScript support.
- Boundary: public website presentation and UI behavior only. CLI behavior, release versions and remote publication are unchanged.
- Visual decisions belong to [the design contract](../../web/design-system/CONTRACT.md); actual checks belong to [testing evidence](../testing.md#verification-evidence).

## What to build

Replace the cream/serif engineering folio with a neutral/cobalt context workbench, self-hosted Geist typography, a clear two-line proposition, source/wiki/session demonstration, responsive navigation and varied content rhythm. Reuse the real React islands; keep every fragment target and synthetic/legacy qualification. Repair chart contrast, motion liveness, keyboard shortcut handling, clipboard error feedback, and theme/BFCache behavior.

## Explicitly NOT in this spec

No CLI changes, invented customer proof or savings, release changes, remote deploy, or new application framework.

## Clarifications

The user delegated the design choice on 2026-10-24 and subsequently requested quicker completion. This supersedes Feature 09's historical no-redesign boundary for this new unit, not its factual-truth requirements.

## Value sources

Existing factual passages and installation commands: web/index.html. Synthetic demonstration content: web/src/data/page.ts and web/src/data/transcripts.ts. Design choices: user's approved creative control and web/design-system/CONTRACT.md. Verification: web/tests/browser-check.mjs and testing evidence.

## Verification checklist

- [x] Production build and TypeScript check pass
- [x] Desktop and mobile layouts have no document overflow
- [x] Light/dark selection and persistence work
- [x] Real no-JavaScript static fallbacks remain readable
- [x] Demo rails, keyboard slider/Stop, CLI switch, ledger cycles and copy commands work
- [x] Factual truth guard and design token contract pass
- [x] Primary and secondary text pairs pass WCAG AA contrast checks

## Evidence and remaining closure

Browser evidence is recorded in web/.impeccable/review/checks.json. Independent finish review returned ship and the full self-test passed; actual results and limits are recorded in testing evidence. Remote deployment is outside this request.
.