---
title: Project-local discovery skill
type: feature
status: complete
summary: Route skill-loading hosts into the wiki without a global install
updated: 2026-10-21
covers: [scripts/ctx.mjs, tests/features22-29.mjs]
---

# Project-local discovery skill

## TL;DR

- Goal: Route skill-loading hosts into the wiki without a global install.
- Boundary: scaffold the canonical project-context discovery skill and preserve declared native discovery adapters.

## What to build

Generate .agents/skills/project-context/SKILL.md during every scaffold tier. Existing canonical user content survives reruns; existing adapter inventory supplies Claude/Cursor discovery views or D-7 relative directory aliases. The skill uses project-root wiki paths, trust rules and optional agent routing, not copied wiki facts.

## Explicitly NOT in this spec

No network, dependency additions, hidden writes or canonical repository edits.

## Clarifications

Implemented and integrated; the single consolidated local review/fix pass and functional verification are complete. Existing user-owned files remain preserved; host/runtime capabilities are declarations unless explicitly functionally tested, not live discovery proof.

## Value sources

| Value | Source |
|---|---|
| Skill body | assets/project-skill.md.template |
| Discovery aliases | Existing adapterTargets and SYMLINK_LAYOUT |

## Verification checklist

- [x] Copied CLI sees project-context in canonical inventory
- [x] Existing user skill body is unchanged during setup
- [x] Parent consolidated local functional tests and review/fixes


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.

- 2026-10-21: Portable facts source attribution was corrected and checked across source/project CLI; this unit's substantive scoped contracts are unchanged. This records a narrow bookkeeping review, not new semantic verification.

- 2026-10-21 publication checkpoint (23): ctxfolio metadata/versions updated; scoped behavior unchanged. Not semantic verification.
