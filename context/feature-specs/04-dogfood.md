---
title: Dogfood the Skill
type: feature
status: complete
summary: v2.4.1 — the skill's own repo runs ctx setup; wiki filled with real facts; found and fixed a detect false positive
tags: [dogfood, v2.4]
covers: []
updated: 2026-10-21
confidence: unverified
---

# Dogfood the Skill

## TL;DR

- 2026-10-21 provenance review: legacy checkpoint `080a7adb7826` (recorded 2026-10-06) is explicitly unverified; no declared verifier or validity interval is established. Historical completion dates/evidence/checks are retained, not reverified. Source: historical checklist and ../testing.md#verification-evidence.
- Goal: eat the food — this repo carries its own AGENTS.md/context/ wiki, maintained by the same loop users get.

## What to build
Run `ctx setup` here; fill every placeholder from real knowledge (overview, architecture, map, standards, testing, library-docs, glossary, decisions D-01…D-04, tracker, specs 01–04); keep lint at zero errors.

## Explicitly NOT in this spec
Shipping this repo's wiki to users (it stays dev-side; SHIP list excludes it).

## Clarifications
User: "why not [use] the project context system itself in this repository itself".

## Verification checklist
- [x] setup + doctor 12/12 on this repo
- [x] ctx lint: 0 errors
- [x] detect bug found during dogfood fixed + regression-safe (word-boundary matching)
- [x] context pages updated (ctx impact shows no ✗)
