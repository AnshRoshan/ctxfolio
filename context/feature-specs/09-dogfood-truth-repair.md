---
title: Dogfood truth repair
type: feature
status: complete
summary: Repair remaining live claims and pointers against current source and published evidence, without inventing evaluation results
tags: [truth, dogfood, docs]
covers: [README.md, INSTALL.md, docs/**, web/**, references/ctx-cli.md, tests/check-truth.mjs, package.json, .github/workflows/ci.yml]
related: [../testing.md, ../overview.md, ../ownership.md, ./08-always-green-baseline.md]
updated: 2026-10-24
confidence: unverified
unverified_snapshot: 3b439390a859851eeea46cf75e4880d07c21b8f572ecd18861e65f1239b8e1d9
snapshot_state: dirty-tree
---

# Dogfood Truth Repair

## TL;DR

- 2026-10-21 provenance review: legacy checkpoint `ef2b0df59c6a` (recorded 2026-10-21) is explicitly unverified; no declared verifier or validity interval is established. Historical completion dates/evidence/checks are retained, not reverified. Source: dated evidence/checklist below and ../testing.md#verification-evidence.

- Goal: every current user-facing count, runtime, release, verification statement and example label has a truthful owner or measured source.
- Boundary: live documentation and website copy. Preserve the incumbent visual design and behavior; distinguish illustrative fixtures from measured product evidence.
- Depends on: Feature 08 main-green baseline, now verified by main run 39553397681 and tag run 39553402796.

The 2026-10-24 human-approved [website redesign](35-website-redesign.md) separately authorizes a replacement visual world. The historical no-redesign scope below is unchanged; its factual/evidence/illustrative-content requirements remain preserved, as checked by `tests/check-truth.mjs`.

## What to build

1. Replace obsolete live test inventories in overview and install docs with the testing evidence owner. Keep dated history unchanged.
2. Replace whole-repository install copies with the existing SHIP-only installer commands. Explain staged backup publication and recovery limits.
3. Narrow doctor/hook claims to structural bookkeeping and their actual contracts. Do not claim live loader or security enforcement verification.
4. Correct the legacy worktree description to registered, ignored and detached. Leave physical housekeeping to Feature 10.
5. Make optional contract/UI owners conditional. Remove obsolete self-scaffolding instructions from the live website module; describe configured and measured build/deploy evidence separately.
6. Scope zero-dependency prose to the copied CLI. Replace exported ADR copy instructions with links to canonical decisions.
7. Repair stale website runtime/release/test/doctor text using the declarations and Feature 08 evidence. Label synthetic/versioned transcripts and token-cost assumptions visibly, including static fallbacks and accessible output.
8. Add a runnable static truth regression for current live declarations, install boundaries and demo labels. Build the existing website and verify current deployment after publication. Preserve layout, tokens and component behavior.
9. Record unsupported benchmark/answer-quality claims as unmeasured. Do not turn model assumptions or illustrative output into measured success.

## Explicitly NOT in this spec

- Do not change CLI behavior, housekeeping, cursor liveness, profile gating or provenance enforcement. Features 10-16 own those.
- Do not generate facts or implement evals. Features 13 and 18-19 own those.
- Do not redesign the website or add dependencies/components.
- Do not bulk rewrite completed history or stamp unsupported provenance as verified.
- Do not remove the legacy editor worktree.

## Clarifications

- The direct end-to-end request authorizes factual corrections to the existing site after Feature 08, not a visual redesign.
- Current declarations come from manifests/CLI; observed success comes from run logs. A fixture may remain versioned only with a visible illustrative label.
- Existing token-cost inputs are assumptions, not measured bounds; they must say so. No new performance number is invented.

## Value sources

| Value | Comes from |
|---|---|
| Supported runtime and version tracks | package.json, SKILL.md, scripts/ctx.mjs VERSION, plugin manifests, README mapping |
| Published baseline and release | Main run 39553397681, tag run 39553402796, release API v2.7.0, testing evidence |
| Obsolete live counts and copied install examples | context/overview.md and INSTALL.md source review on 2026-10-21 |
| Doctor/hook scope | scripts/ctx.mjs commands.doctor and hook; references/safety-permissions.md |
| Registered ignored legacy worktree | git worktree list --porcelain, git check-ignore .kilo/worktrees/super-raincoat |
| Demo and static site claims | web/index.html and web/src/data/transcripts.ts source review |

## Verification checklist

- [x] Live counts and declarations route to current evidence/owners
- [x] Install examples ship only the intended boundary and describe recovery truthfully
- [x] Hook/doctor claims do not exceed the implemented checks
- [x] Optional owners and worktree prose match observed structure
- [x] Website static and interactive illustrative labels agree; benchmark assumptions are explicit
- [x] Static truth regression and website build pass
- [x] Full CLI suite, strict lint/stale, doctor and release consistency pass
- [x] Existing deployed site reflects the correction without layout/behavior regression
- [x] Tracker, log, memory and derived catalog reflect verified closure

- 2026-10-21 publication checkpoint (09): ctxfolio metadata/versions updated; scoped behavior unchanged. Not semantic verification.
