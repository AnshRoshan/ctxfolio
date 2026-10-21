---
title: Native Git-Compatible Symlink Layout
type: feature
status: complete
summary: Real relative symbolic links for shared agent files and resource folders, with local Git configuration and preservation-first migration
updated: 2026-10-21
covers: [scripts/ctx.mjs, tests/run.mjs, assets/**, references/**, SKILL.md]
confidence: unverified
---

# Native Git-Compatible Symlink Layout

## TL;DR

- 2026-10-21 provenance review: legacy checkpoint `ef2b0df59c6a` (recorded 2026-10-21) is explicitly unverified; no declared verifier or validity interval is established. Historical completion dates/evidence/checks are retained, not reverified. Source: historical acceptance record and ../testing.md#verification-evidence.

- The human clarified that native host entries must be real filesystem symlinks, not regular pointer copies.
- Canonical content remains under AGENTS.md and .agents/. Native host settings remain independent; incompatible Cursor .mdc views are stored centrally and linked.
- Initial Windows probing failed with EPERM; after the human enabled Developer Mode, native file/directory creation and the actual project migration succeeded. Dated results are owned by testing.md.

## Acceptance criteria

- [x] New project setup defaults to real relative symlinks; explicit --portable-pointers preserves the legacy pointer-only strategy.
- [x] Git core.symlinks is enabled locally when a repository is present; check mode never changes config.
- [x] CLAUDE.md/GEMINI.md/Copilot entrypoints share AGENTS.md, while compatible agent/rule/skill resource folders share their canonical directories.
- [x] Cursor rules use one central native-format view directory, linked into the host, without duplicated instruction bodies.
- [x] Capability checks happen before existing resource entries are altered; unsupported hosts fail clearly, never silently substitute junctions/copies.
- [x] Custom content, competing owners, wrong links and fake-symlink checkout files are preserved or reported for manual resolution.
- [x] Migration stages validated paths and restores existing entries if installation fails.
- [x] Existing valid links can be read/checked and ordinary canonical resources updated after Developer Mode is turned off.
- [x] Tests distinguish native success, native permission denial and explicitly skipped positive cases; no Windows success is claimed from simulation.
- [x] This project's actual links are created and verified after the host prerequisite is enabled, or the exact remaining prerequisite is recorded for handoff.

## Verification

Outcome: [Testing evidence](../testing.md#verification-evidence). Native fs.symlink/lstat/readlink and disposable Git index checks verify actual relative file/directory links and link-target blobs; fault injection separately verifies permission denial and concurrent-edit/rollback preservation. Absolute junction substitutes are refused.

- 2026-10-21: Portable facts source attribution was corrected and checked across source/project CLI; this unit's substantive scoped contracts are unchanged. This records a narrow bookkeeping review, not new semantic verification.
