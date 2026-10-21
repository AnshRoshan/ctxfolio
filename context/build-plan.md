---
title: Build Plan
type: plan
status: active
summary: v2.0–v2.7 shipped; Phase 4 is the ordered 2026 audit spec list plus Wave 0; what comes next is never the agent's call
tags: [plan,roadmap,phases]
updated: 2026-10-21
---

# Build Plan

## TL;DR

- Phases 1–3 are shipped (v2.0 wiki, v2.1 dynamic and delegating, v2.2 one-command, v2.3 teams and growth, v2.4 self-install, v2.5 reliable routing, v2.6 single-source ownership, v2.7 native symlinks). Current work: Phase 4.
- Phase 4 is the ordered spec list from the 2026-10-20 audit: smallest first, workable before new capability, security and provenance before passive capture.
- The 2026-10-21 addendum adds Wave 0 (Features 30–34): parser/glob integrity, crash-safe writes, upgrade/install transactions, spec-queue integrity, and route integrity. Wave 0 runs before Wave 1 (F-01).
- Scope (WHAT) stays separate from tooling (HOW): the CLI can grow features without the method docs changing.
- New ideas discovered during a build get appended here first — then specced — never silently implemented.

## Phase 1 — the wiki foundation (COMPLETE — v2.0/v2.1)

- Compiled-knowledge architecture, router index, page format, staleness from git, hooks, task ledger, profile detection, tool delegation. See CHANGELOG.

## Phase 2 — one command, teams, self-install (COMPLETE — v2.2–v2.4)

- `ctx setup` idempotent + upgrade-safe; path-gated rules; agent memory; Lessons; danger zones; multi-user collision lint; `ctx archive`; `ctx install` from a GitHub link; dogfood (this repo's own wiki).

## Phase 3 — verification and reach (COMPLETE — v2.5–v2.7)

- Feature 05: reliable routing and safe updates — spec: feature-specs/05-reliable-context.md.
- Feature 06: single-source agent resources and file ownership — spec: feature-specs/06-single-source.md.
- Feature 07: real Git-compatible relative symlinks — spec: feature-specs/07-native-symlinks.md.

## Phase 4 — the 2026-10-20 market and audit findings (CURRENT)

**Why this phase exists.** A competitor and evidence audit (2026-10-20) compared this system against AGENTS.md-native loaders, Cline/Roo Memory Bank, Claude Code auto-memory, Cursor/Windsurf memories, DeepWiki and local-first code-intelligence tools, Mem0/Zep/Letta memory services, and Spec Kit/BMAD/Kiro spec workflows. It also audited this repo. Verdict: the substrate and the governance model are ahead of the field; **proof, capture, retrieval precision, and two knowledge classes are missing**, and this repo itself shipped with four stale claims and a red CI badge.

**Ordering rule (the human's call, recorded as D-08; amended by F-01).** Smallest first, then larger. Workable before new capability. Security and provenance **before** passive capture, so auto-captured material lands on a governed substrate rather than creating the drift we cannot yet detect. Numbers are stable IDs; the wave table is execution order. Wave 0 runs first.

### Wave 0 — substrate integrity (2026-10-21 audit; run before Wave 1)

| # | Feature | Size | Build first because |
|---|---|---|---|
| 30 | Page-contract integrity — fail-closed frontmatter parsing and a glob compiler that cannot crash on a valid `covers:` | M | A `summary: >` is silently stored as `>` and a `{*.ts,*.tsx}` cover throws `Nothing to repeat`, taking down `lint`, `brief`, `impact` and `stale`; a `cover:` typo silently disables staleness |
| 31 | Crash-safe writes and concurrent-agent safety — atomic temp+rename for every write, an advisory lock, and a transactional `archive` | M | `log`, `task`, `index`, `archive`, `stamp`, `new` and `setup` write in place; a crash or two agents can truncate the ledger or duplicate archive entries. The symlink transaction already has staging/backup/rollback; the rest does not |
| 32 | Upgrade and install transaction — validate `name`/dest, refuse symlinks, stage+backup+atomic swap, `--dry-run`, stale-file removal, local checksum manifest, `.ctx.json` schema migration (remote pin/checksum authentication remains outside the numbered scope) | M | `install` follows symlinks, trusts an unvalidated `SKILL.md` name, never removes dropped files, and overwrites local edits; `setup` overwrites `context/ctx.mjs` with no backup or diff |
| 33 | Spec-queue integrity — reserved numbers, roadmap↔spec↔tracker coherence, required spec sections, `D-NN` refs | S | `ctx new feature` uses max+1 and can steal a number the roadmap reserved; lint checks tracked→spec but not the roadmap, contiguity, value-source tables or section schema |
| 34 | Route and relation integrity — no dead routing targets, validated `related:` and code-span paths | S | Eight routes in `context/index.md` point at missing pages and `workflow-rules.md` names `runbook.md` unconditionally; lint only checks markdown `[]()` links, not the router's backticks |

**Why Wave 0 exists.** The first audit asked whether the wiki stays true; this second pass asked whether the machinery that decides "true" is itself fail-closed. It is not. The 2026-10-21 checks found: `node tests/run.mjs` 101 passed / 0 failed / 0 skipped on Windows; `ctx lint --strict` 21 pages with 0 errors and 0 warnings; `ctx stale --strict` clean; `ctx doctor` 13/13. Those green checks coexist with a parser that drops multiline summaries, a glob compiler that throws on a common brace pattern, eight dead routes, nine pages citing an unreachable `verified_at` commit, and no atomic write outside the symlink transaction. A green lint is therefore necessary, not sufficient.

**Evidence for the addendum (2026-10-21).** `node -e` against the real `globToRegex('{*.ts,*.tsx}')` throws `SyntaxError: Invalid regular expression: /^(?:*.ts|*.tsx)$/: Nothing to repeat`. `parseFrontmatter` handles only flat keys, inline arrays and block lists; `summary: >` becomes `>`. `rg -n "verified_at" context` shows nine pages pointing at `080a7adb7826`; `git merge-base --is-ancestor 080a7adb7826 main` exits 1. `context/index.md` routes to `ui-rules.md`, `ui-tokens.md`, `ui-registry.md`, `data-model.md`, `api-contracts.md`, `integrations.md`, `runbook.md` and `env-vars.md`; none exists. CI run 38672645470 is green on ubuntu/windows, 98/3 on macOS Node 20/22 and 97/4 on macOS Node 18.

### Wave 1 — make it provably workable (all small)

| # | Feature | Size | Build first because |
|---|---|---|---|
| 08 | Always-green baseline — the three macOS Node 20/22 symlink failures plus the Node 18 stop-hook failure, a `self-context` CI gate, two-track version check, runner refresh, publish v2.7 | S | `main` is red and the newest release is three versions behind. Spec: feature-specs/08-always-green-baseline.md |
| 09 | Dogfood truth repair — every stale claim the audit found, minus what 08 and this planning change already corrected; includes `memory.md`'s "nothing pending" claim, `current-issues.md`'s "(none open)" while CI is red, and the README "two versions behind" count | S | The audit found false claims that `ctx stale` cannot see |
| 10 | CLI honesty and housekeeping — `impact` counting docs/references code samples as app code, the malformed `archive` sentence, unvalidated `archive` days (`NaN` → `RangeError`), `ctx log` not bumping `updated`, the UTC/local date split, the stale in-tree git worktree | S | Small defects that mislead every user |
| 11 | Resume-cursor liveness — `memory.md` warns when HEAD moved past its last update or when `git status` contradicts its "nothing pending" claim | S | The cursor was stale while every dashboard said green |
| 12 | Profile gating for CLI and library projects — `api-contracts`, `env-vars`, `runbook` | S | A CLI's public surface is its contract; this repo proves the gap |

### Wave 2 — derived facts, then trust (small to medium)

| # | Feature | Size | Build here because |
|---|---|---|---|
| 13 | `ctx facts` — generated derived-facts block plus a lint rule against hand-copied counts and versions | M | Kills the whole class of 09's drift permanently |
| 14 | Issue queue split — tracked sanitized `issues.md` plus gitignored `issues.local.md` | S | Today the bug queue is per-machine and invisible at handoff |
| 15 | INGEST quarantine — flag instruction-shaped prose in `context/raw/**`, require human acknowledgement before it propagates | M | Published work shows >85 percent attack success against coding agents through docs |
| 16 | Claim provenance and temporal validity — `verified_by`, `valid_from`, `review_by`, `verified_at` reachability from `main`, dirty-tree stamp semantics, plus the rule that an agent-written page cannot self-verify | M | Evidence: repeated claims are treated as corroboration; `updated` is weaker than validity intervals; nine pages currently cite an unreachable commit |

### Wave 3 — prove the value (medium)

| # | Feature | Size | Build here because |
|---|---|---|---|
| 17 | Retrieval precision — discount `status: complete` history for code tasks, IDF weighting, Unicode/CJK tokenization, one-hop `related` expansion | M | A measured query returned three completed specs ahead of current guidance; non-Latin queries currently tokenize to nothing |
| 18 | `ctx eval` — deterministic routing harness over a frozen question set; reports hit@k, precision, token cost, blind spots; CI-gated | M | The published finding is that retrieval precision, not scaffolding, is the bottleneck |
| 19 | Cold-start evidence pack — run the `references/evals.md` protocol for real, publish the numbers, and rewrite every README claim to what the data supports | M | Controlled studies show context files cut cost and time but do not reliably raise task success; claims must match |

### Wave 4 — complete the knowledge model (medium to large)

| # | Feature | Size | Build here because |
|---|---|---|---|
| 20 | Missing page types — security and trust model, quality and non-functional targets, risks and technical debt, plus ADR lifecycle fields and a `decisions/` split past a threshold | M | Nothing in the current model owns NFRs, threat surface, or debt |
| 21 | Governed capture — deterministic session digest from git plus a promotion inbox; never auto-promote | L | The one real advantage of competing auto-memory, taken without their opacity. Needs 16 first |

### Wave 5 — ergonomics and reach (large)

| # | Feature | Size | Build here because |
|---|---|---|---|
| 22 | Scaffold tiers — `--lite`, `--standard`, profile extras; stop shipping placeholder debt | L | A new repo gets about twenty empty pages, which is negative context |
| 23 | Generated project-level skill so any skill-loading host routes into the wiki without the global install | S | Depends on 22 |
| 24 | Host adapter matrix — prune now-redundant aliases, add the hosts that do not read AGENTS.md, extend `ctx install` destinations | M | AGENTS.md is read natively by most major hosts in 2026 |
| 25 | Hook parity — one portable `ctx check` for non-Claude hosts plus CI guidance | M | Enforcement currently exists in one host only |

### Wave 6 — scale (large, only when signals say so)

| # | Feature | Size | Trigger |
|---|---|---|---|
| 26 | Symbol-level routing through delegated tools (ctags, graphify) | L | Path globs too coarse for a large repo |
| 27 | Derived search index and automatic hierarchical indexes | L | Over 150 pages, or orient cost over 6k tokens |
| 28 | `ctx mcp` read-only server for hosts without filesystem access | L | Real remote or web-host demand; keep files canonical |
| 29 | Team scoping — per-agent cursors, human ownership map, cross-repo context | L | Parallel agents clobbering one `memory.md` |

**Deferred from Phase 3, now absorbed:** `ctx query` filing → Feature 20 scope; hook parity → Feature 25; opt-in project skills → Feature 23; evals runner → Feature 18.

## Rules

- One system boundary per spec; ledger unit = branch = owner (see references/multi-user.md).
- Every feature lands with tests in the same commit (the suite is the contract).
- Phase 4 numbers are stable IDs; the wave table is execution order. Wave 0 runs before Wave 1 (F-01). Create the numbered spec file with `ctx new feature <name>` only when that unit is about to start, then register it with `ctx task add --spec NN` — no batch of empty specs. `ctx new feature` must not reuse a number reserved here.
- A feature is not done until its wiki claims, the ledger, `context/log.md` and the changelog agree with the diff.
