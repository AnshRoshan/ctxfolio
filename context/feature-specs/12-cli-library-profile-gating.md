---
title: CLI and library profile gating
type: feature
status: complete
summary: Scaffold applicable public-contract, environment and operations owners for detected CLI/library profiles without unrelated UI extras
tags: [profiles, cli, library]
covers: [scripts/ctx.mjs, tests/run.mjs, assets/api-contracts.md.template, assets/env-vars.md.template, assets/runbook.md.template]
related: [../testing.md, ./11-resume-cursor-liveness.md]
updated: 2026-10-21
---

# CLI and Library Profile Gating

## TL;DR

- Goal: detected CLI/library projects receive applicable contract/env/runbook pages under existing full predicates.
- Boundary: three scaffold predicates and their neutral templates; no detector or tier redesign.
- Features 11–29 passed the single consolidated local verification/fix pass (D-15); remote batch CI/publication remains pending.

## What to build

1. Add CLI/library eligibility to API-contracts, env-vars and runbook gates only. Preserve existing backend/UI/data/mobile behavior.
2. Generalize templates to CLI streams/flags/exit codes, library exports/returns/errors and HTTP where applicable. Avoid guessed Next/database/server assumptions; verified none/N/A is valid.
3. Preserve default full behavior, --no-full precedence, --no-ui isolation and --no-detect empty signals. --full does not force unrelated optional pages.
4. Test detected bin/main/exports profiles, CLI/library no-UI/no-DB extras, flag precedence and upgrade preservation with targeted checks.

## Explicitly NOT in this spec

- Do not add cross-language library detection, new templates by language, scaffold tiers or new host rules.
- Do not add optional pages to unconditional routes or invent environment names.
- Do not run another separate review/full CI; D-15 consolidates final verification.

## Clarifications

- Detector currently recognizes Node library exports/main and CLI dependencies/bin; preserve that scope.
- Upgrade adds eligible missing pages but never deletes or overwrites existing owner content.

## Value sources

| Value | Comes from |
|---|---|
| CLI/library signals and missing pages | detect JSON and INIT_MAP source, 2026-10-21 |
| Existing full/override semantics | fullOn/uiOn and commands.init |
| Neutral template scope | current API/env/runbook assets |

## Verification checklist

- [x] Eligible CLI/library profiles receive the three owner pages and no unrelated extras
- [x] Flag precedence and upgrades preserve existing behavior/content
- [x] Targeted syntax/profile checks pass
- [x] Consolidated local batch verification passes before local completion


## Local completion evidence

- 2026-10-21: Implemented capability and functional acceptance passed the final integrated local checks; commands and actual results are owned by [testing](../testing.md#verification-evidence), including `node tests/run.mjs` and `node tests/features22-29.mjs`. Syntax, copied-CLI parity, truth/baseline/version, strict lint/stale and doctor checks passed in that recorded run.
- This is local completion, not actual remote batch CI success, live native-host discovery or authenticated external identity proof. The common [publication gate](../progress-tracker.md#local-completion-and-publication-gate) remains pending.

- 2026-10-21: Portable facts source attribution was corrected and checked across source/project CLI; this unit's substantive scoped contracts are unchanged. This records a narrow bookkeeping review, not new semantic verification.

- 2026-10-21 publication checkpoint (12): ctxfolio metadata/versions updated; scoped behavior unchanged. Not semantic verification.
