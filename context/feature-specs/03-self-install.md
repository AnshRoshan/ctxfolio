---
title: Self-Install from a Link
type: feature
status: complete
summary: v2.4 — ctx install + GitHub-link flow; explicit repo/skill/project boundary with tests
tags: [install, github, v2.4]
covers: []
updated: 2026-10-21
confidence: unverified
---

# Self-Install from a Link (v2.4)

## TL;DR

- 2026-10-21 provenance review: legacy checkpoint `080a7adb7826` (recorded 2026-10-06) is explicitly unverified; no declared verifier or validity interval is established. Historical completion dates/evidence/checks are retained, not reverified. Source: historical checklist and ../testing.md#verification-evidence.
- Goal: paste the repo URL to any agent and it installs the skill and sets up its repo; dev history never leaves this repo.

## What to build
`ctx install` (--tool claude|qoder|auto, --dest): copies SHIP list (SKILL.md, references, assets, scripts) into the tool's skills dir; names itself from SKILL.md frontmatter; README/INSTALL one-link flow; "this repo vs your project" boundary table.

## Explicitly NOT in this spec
npm publishing; writing tool hook configs during install.

## Clarifications
User: "even if I just give my GitHub link the AI should be easily configuring it within their system".

## Verification checklist
- [x] install → setup loop verified from a simulated clone (manual + green)
- [x] install excludes CHANGELOG/tests/README/.git (test)
- [x] re-install overwrites cleanly (test)
- [x] context pages updated (ctx impact shows no ✗)
