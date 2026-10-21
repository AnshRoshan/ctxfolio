---
title: Team scoping and federation
type: feature
status: complete
summary: Keep parallel agent cursors independent and cross-repository reads explicitly allowlisted
updated: 2026-10-21
covers: [scripts/ctx.mjs, tests/features22-29.mjs]
---

# Team scoping and federation

## TL;DR

- Goal: Keep parallel agent cursors independent and cross-repository reads explicitly allowlisted.
- Boundary: authored context/team.json declarations, fixed per-agent cursors and explicitly allowlisted read-only federation.

## What to build

Add authored context/team.json schema with validated agent IDs, fixed owned cursor paths and canonical glob ownership declarations. ctx cursor --agent reads or explicitly writes only that agent memory, and brief/status/facts orientation routes to it; default shared memory is unchanged. ctx team reports ambiguous owner matches instead of merging them. Opt-in --federate brief/search reads only explicitly enabled relative allowlist roots, validates real directory boundaries and non-secret config/page paths, runs fixed readonly bounded APIs and never rebuilds sibling indexes. Unsupported scoped mutations fail closed.

## Explicitly NOT in this spec

No network, dependency additions, hidden writes or canonical repository edits.

## Clarifications

Implemented and integrated; the single consolidated local review/fix pass and functional verification are complete. Existing user-owned files remain preserved; host/runtime capabilities are declarations unless explicitly functionally tested, not live discovery proof.

## Value sources

| Value | Source |
|---|---|
| Agent identity and ownership | Human-authored context/team.json declarations |
| Cursor destination | Fixed context/agents/<declared-id>/MEMORY.md |
| Federated roots | Explicit enabled project-relative allowlist, never CLI arbitrary paths |

## Verification checklist

- [x] Independent scoped cursors and ambiguous ownership fail closed
- [x] Federated query obeys enabled allowlist and performs no sibling writes
- [x] Parent consolidated local functional tests and review/fixes


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.
