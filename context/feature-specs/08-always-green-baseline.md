---
title: Always-Green Baseline
type: feature
status: complete
summary: Make main provably healthy — fix the macOS and Node 18 failures, gate this repo's own wiki in CI, and publish the unreleased v2.7
tags: [ci, testing, release, symlinks, quality]
covers: [scripts/ctx.mjs, tests/**, .github/**, package.json, README.md, INSTALL.md]
related: [../testing.md, ../decisions.md, ./07-native-symlinks.md]
updated: 2026-10-21
confidence: unverified
---

# Always-Green Baseline

## TL;DR

- 2026-10-21 provenance review: legacy checkpoint `ef2b0df59c6a` (recorded 2026-10-21) is explicitly unverified; no declared verifier or validity interval is established. Historical completion dates/evidence/checks are retained, not reverified. Source: dated evidence/checklist below and ../testing.md#verification-evidence.

- Goal: every commit on `main` proves three things in CI — the CLI suite passes on all three OSes, this repo's own wiki passes `ctx lint --strict` and `ctx stale --strict`, and the published release matches the documented version mapping.
- Boundary: test harness, workflow files, and release/tag state. No CLI behavior change except where a test proves the CLI is wrong.
- Measurable: CI green on the 3 OS x 2 Node matrix (22 and 24); a new `self-context` job exists and fails on injected drift; tag `v2.7.0` exists with notes.

## Why now

`main` has been red since 2026-10-15 (run 38672645470): ubuntu and windows pass; macOS Node 20 and 22 fail the same three symlink rollback/concurrency cases — "concurrent native edits are preserved during migration validation", "rollback does not overwrite a concurrent replacement at the destination", "rollback preserves view edits made after publication" — at 98 passed / 3 failed / 0 skipped. macOS Node 18 fails a fourth case, "stop hook allows a stop when nothing changed", with first symptom `init failed: profile: node · kinds: web-app · signals: ui`, at 97 / 4. The README badge advertises a failing pipeline, and the newest published release is v2.4.1 while `package.json` says 3.7.0, `SKILL.md` says skill 2.7.0, and the CHANGELOG documents v2.5-v2.7.

A system whose job is "the docs stay true" cannot ship a red badge and an unreleased version. This spec restores the invariant before any new capability is built.

## What to build

1. Reproduce the macOS failures. Run the suite on macOS with `node tests/run.mjs symlinks` and capture the three failing cases with their assertion output. Run the Node 18 job separately and capture the fourth stop-hook failure.
2. Find the root cause. Inspect the rollback and migration paths in `scripts/ctx.mjs` (`commands.symlinks`, `installLinks`, `adapterReport`, backup/restore helpers). Check three hypotheses in order: platform rename/replace semantics, link-target resolution (`readlink` vs `realpath`), and filesystem timing/visibility between publish and rollback checks. Triage the Node 18 stop-hook path as its own failure, not as a variant of the symlink cases.
3. Fix the proven shared cause. Do not weaken preservation assertions to obtain green. If a harness bug prevents fault injection, repair it and prove injection plus outcomes; change CLI behavior only when source checks establish a CLI defect. Record invariant-changing tradeoffs before editing.
4. Add a deterministic guard. Make each failing case assert on observable state after the operation, so a silent platform difference cannot pass again.
5. Add the `self-context` CI job. Run `node context/ctx.mjs lint --strict`, `node context/ctx.mjs stale --strict`, and `node context/ctx.mjs doctor` against this repository on `ubuntu-latest`. Fail the build on any finding.
6. Add a two-track version-consistency check. Assert that the skill/CLI track agrees (`SKILL.md`, `scripts/ctx.mjs` `VERSION`, newest CHANGELOG heading) and the package/plugin track agrees (`package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`), that a documented mapping connects them (currently skill 2.7.0 ↔ package 3.7.0, per D-11), and that the newest git tag matches the skill track. Fail with every mismatch listed. Do not force the two tracks into one identity.
7. Refresh the runner matrix. Replace deprecated `actions/checkout@v4` and `actions/setup-node@v4` with the current majors, replace the EOL Node 18 and Node 20 entries with Node 22 and Node 24, raise `engines.node`, update the README badge, and name the runner image explicitly instead of relying on `ubuntu-latest` drift.
8. Publish. Tag the current version, create the release with notes drawn from the actual diff since v2.4.1, and confirm the README badges point at the new release.
9. Harden the workflow itself: `permissions: contents: read`, a concurrency group that cancels superseded runs, `timeout-minutes`, and Dependabot for Actions and `web/` dependencies.

## Explicitly NOT in this spec

- Do not repair the stale wiki claims found in the 2026-10-20/21 audits (including `memory.md` and `current-issues.md`). That is Feature 09 (dogfood truth repair) and Feature 11 (resume-cursor liveness).
- Do not build `ctx facts`, `ctx eval`, retrieval scoring changes, or new page types. Each has its own numbered spec in `../build-plan.md` Phase 4.
- Do not add a macOS-specific test skip. A skip that hides a real defect is forbidden; only a genuinely unavailable privilege may report SKIP, and it must say so.
- Do not collapse the skill/CLI and package/plugin versions into one identity; D-11 records the two-track mapping.
- Do not use `ubuntu-latest` as an unexamined moving target or add a Node 18 skip; Node 18 is EOL.
- Do not change the zero-dependency policy (D-01) or the real-symlink policy (D-07) to make a test pass.
- Do not update `main` or tag until the suite is green on all three OSes. The human approved a temporary CI-validation branch to obtain that evidence (D-13).

## Clarifications

- "Always green" means: every check that CI runs on `main` passes, and every claim the README makes about CI is true.
- Node support floor: Node 22 and 24 only. Node 18 reached EOL on 2025-04-30 and Node 20 reaches EOL on 2026-04-30; do not claim support for either.
- Version identity: the skill/CLI version and the package/plugin version are separate tracks with a documented mapping (D-11). `ctx --version` reports the skill track.
- The `self-context` job lints this repository only. User scaffolds stay covered by the existing `scaffold-lint` job.

## Value sources

| Value | Comes from |
|---|---|
| 98 passed / 3 failed on macOS Node 20 and 22 | CI run 38672645470 logs, 2026-10-15 |
| 97 passed / 4 failed on macOS Node 18; fourth case `stop hook allows a stop when nothing changed` | same run, Node 18 job and `--log-failed` output |
| Failing case names | same run, `--log-failed` output |
| Local result 101 passed / 0 failed / 0 skipped | `node tests/run.mjs` on Windows, 2026-10-21 |
| Latest release v2.4.1, dated 2026-10-07 | `gh release list` |
| Package 3.7.0 / skill 2.7.0 / marketplace 3.7.0 | `package.json`, `SKILL.md`, `scripts/ctx.mjs` `VERSION`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `CHANGELOG.md` |
| Node 18 EOL 2025-04-30; Node 20 EOL 2026-04-30 | Node.js release schedule |
| Actions deprecation warning | CI annotations on run 38672645470 |

## Implementation evidence

- 2026-10-21: the unmodified harness reproduced all three macOS case names on Debian's POSIX filesystem when TMPDIR pointed through a symlink; 11 passed / 3 failed / 0 skipped in the symlink filter. The same path class did not reproduce on Windows junctions. Source: sandbox() and child process.cwd() path spelling, not a platform-specific rollback change.
- The patched Windows symlink filter passed every selected case. Each injected race now writes a hit marker and asserts human content plus recovery/configuration outcomes.
- Independent POSIX mutation checks on Node 20.19.2 (not supported-runtime evidence): all three patched cases passed individually; disabling each shared preservation defense produced its expected loss assertion. Actual macOS Node 22/24 validation later passed in candidate and main CI; see ../testing.md for the run evidence.
- Baseline probes and version-track checks live in tests/check-baseline.mjs and tests/check-versions.mjs; the production CI gates never use a test-only bypass.
- Actions current majors were read from the official checkout and setup-node release APIs on 2026-10-21; explicit runner labels were checked against actions/runner-images. Candidate publication follows D-13.

## Verification checklist

- [x] `node tests/run.mjs` passes every current case with 0 failures on Windows; 132 passed / 0 failed / 0 skipped recorded at ../testing.md
- [x] CI passes on ubuntu, macOS and windows for Node 22 and 24 (no FAIL line in any matrix job)
- [x] The three previously failing cases pass on macOS, and each still fails when its guard is deliberately broken
- [x] The fourth macOS Node 18 case is either fixed or the Node 18 job is removed as EOL; no skip hides it
- [x] `self-context` job exists and fails when a wiki page is left stale or a placeholder stays unfilled (exact negative fixture checks passed locally)
- [x] Version-consistency check fails when one file in a track is edited alone; passes when each track agrees and the mapping and tag are current
- [x] Workflow has read-only permissions, concurrency cancellation and a timeout
- [x] Tag plus release exist for the shipped version, and the README badge resolves to it
- [x] `../log.md`, `../progress-tracker.md` and `../decisions.md` are updated in the same candidate as the code; D-13 records the authorized validation branch

- 2026-10-21: Portable facts source attribution was corrected and checked across source/project CLI; this unit's substantive scoped contracts are unchanged. This records a narrow bookkeeping review, not new semantic verification.

- 2026-10-21 publication checkpoint (08): ctxfolio metadata/versions updated; scoped behavior unchanged. Not semantic verification.
