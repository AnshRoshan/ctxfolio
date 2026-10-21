# Memory

Resume cursor, not a second wiki or task ledger. Keep under ~60 lines. Link current facts and evidence at their owners; dated history belongs in context/log.md.

_Last updated: 2026-10-21, during Feature 08 baseline verification_

## Current state

Feature 08 is In progress. The baseline verification reproduced the previous 119-test Windows result, then source review found Wave 0 safety regressions now being repaired before publication. The three macOS preservation failures reproduced on a POSIX aliased temporary root; the harness now canonicalizes fixture paths and proves injection plus recovery outcomes. CI and release gates are being added. No main/release publication has occurred yet; actual supported cross-platform CI remains required. Verification belongs in [testing](context/testing.md), scope in the [active spec](context/feature-specs/08-always-green-baseline.md).

## Next step

Finish **Feature 08 - Always-green baseline**: candidate branch `ci/feature-08-baseline` preserves Wave 0 and baseline work (first commit 6a2c962). Run 39552399951 passed both macOS and both Ubuntu Node 22/24 jobs; Windows jobs are finishing. Its self-context job exposed an ignored local issue route and missing fresh-checkout Git symlink configuration; publish the corrected candidate after the clean-checkout negative probe passes. D-13 authorizes the branch only; update main and publish v2.7.0 after the full corrected run is green. Feature 09 cannot start before main is green.

## Working set

- Roadmap owner: [build plan](context/build-plan.md); ledger: [progress tracker](context/progress-tracker.md).
- New decisions to honor while building: [D-08 through D-12 and F-01](context/decisions.md).
- CI failure evidence: run 38672645470 (`gh run view 38672645470 --log-failed`); release gap: `gh release list`.
- Router internals for the Wave 3 precision work: `scripts/ctx.mjs` (`brief`, `staleReport`, `impactData`).

## Open questions

- F-01: keep stable spec IDs with the wave table authoritative, or renumber 08-34 once so the next number is always the next unit? The human has not chosen.
- Does `ctx install` need to support the shared Agent Skills directory alongside `~/.claude` and `~/.qoder`? Decides Feature 24 scope; needs a host survey.
- Which of the six Wave-1 items still read as stale after Feature 08 lands? Feature 09 must re-measure rather than reuse this session's numbers.
- Is a real cold-start round affordable before Feature 18, or does the deterministic harness (Feature 09 of D-09) come first? The human has not chosen.

## Context debt

- The 2026-10-20 audit found four stale claims; the 2026-10-21 pass found more, including nine pages citing unreachable `080a7adb7826` and this file's former "nothing pending" line. One class was corrected during planning; the rest belong to Features 09, 11 and 16, and the permanent fix is Feature 13 (`ctx facts`).
- `context/overview.md` still states a test-case count that no longer matches [testing](context/testing.md#verification-evidence); do not trust it until Feature 09 closes.
- `context/sources/` holds no ingested primary sources, so the audit's competitor and paper findings live only in [the log](context/log.md) until an INGEST pass files them.
- No eval has ever been run; every capability claim in README is architectural, not measured (Feature 18-19).
