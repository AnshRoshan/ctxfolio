---
title: Teams and Growth
type: feature
status: complete
summary: v2.3 — multi-user ownership model, merge-collision lint, ctx archive rotation, no-leak boundary
tags: [multi-user, archive, v2.3]
covers: []
updated: 2026-10-21
confidence: unverified
---

# Teams and Growth (v2.3)

## TL;DR

- 2026-10-21 provenance review: legacy checkpoint `080a7adb7826` (recorded 2026-10-06) is explicitly unverified; no declared verifier or validity interval is established. Historical completion dates/evidence/checks are retained, not reverified. Source: historical checklist and ../testing.md#verification-evidence.
- Goal: ten people on ten branches share one wiki without negotiation; hot files stay small forever.

## What to build
references/multi-user.md playbook; lint catches duplicate Feature ids per section (ERROR), duplicate spec numbers (WARN); `task add --spec` refuses claimed numbers; `ctx archive` rotates log/tracker into dated archive files with pointers; neutral (lineage-free) copied CLI header.

## Explicitly NOT in this spec
Per-user tracker files; server-side merge tooling.

## Clarifications
User: "10 people working on 10 features… know when to move into another file… archive or dated folder".

## Verification checklist
- [x] two-branch collision simulation ends in a lint ERROR with an actionable fix
- [x] archive moves old entries, keeps them greppable, leaves pointers (test)
- [x] nothing deleted by archive (test asserts content lands in archive)
- [x] context pages updated (ctx impact shows no ✗)
