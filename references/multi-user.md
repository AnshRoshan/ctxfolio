# Multi-user — ten people, ten features, one wiki

The wiki is a shared, committed artifact, so treat it like code: **branches own units, merges reconcile, tooling catches collisions.** Everything below is designed so nobody has to negotiate in chat.

## The ownership model

- **One unit = one branch = one owner.** `ctx task add` on the branch, `ctx task start NN` there too. The branch's diff touches: its own spec file, its tracker line, its decisions, its module pages for the area it changed.
- **Per-unit files are the concurrency trick** — `feature-specs/NN-*.md`, `codebase/modules/<area>.md`, `sources/<slug>.md` are one-file-per-thing, so two people building two features edit two different files and never conflict.
- **Per-person files are gitignored** — `CLAUDE.local.md`, `.claude/settings.local.json`, `context/issues.local.md`, legacy `context/current-issues.md`. Shared sanitized issues live in context/issues.md; never auto-promote private diagnostic bytes.
- `context/index.md`'s catalog block is **generated**: on conflict, don't merge it by hand — take either side and run `ctx index`.
- Agent `MEMORY.md` files append newest-on-top: on conflict keep both sides' lines (they're dated one-liners), `ctx archive` trims later.

## Where collisions happen and who catches them

| Shared file | Collision | Caught by |
|---|---|---|
| `progress-tracker.md` | two branches claim Feature NN | `ctx lint` ERROR "listed twice" (same section) / "two states" (cross section); `ctx task add --spec` refuses a taken number |
| `feature-specs/` | two specs share the number | `ctx lint` WARN — renumber one, update its tracker line |
| `decisions.md` | two branches both write D-07 | `ctx lint` ERROR duplicate decision id — renumber the later merge, update references (lint lists them) |
| `log.md` | both appended | no problem — append-only, keep both, entries are dated |
| a module page | both edited the same area | normal code conflict: resolve by keeping both facts; `ctx stamp` after |

## The merge loop (every branch, every merge)

1. Before PR: `ctx impact` clean, `ctx task done NN -m "..."`, `ctx index && ctx lint && ctx log build`.
2. After merging to main (or after merging main in): **SYNC** — `ctx stale`, `ctx impact --since <merge-ref>`, `ctx lint` (this is where collision catches fire), fix, `ctx stamp`, `ctx log sync`.
3. CI runs `node context/ctx.mjs lint` — a red lint means a shared-file collision or a forgotten record, and the PR is not done. `--json` gives `{command, ok}` for scripts.

## Scale valves (the file-growth problem)

The hot files stay small because old material rotates out — nothing is deleted, only moved off the fast path:

- `ctx archive` (run at phase boundaries or when lint starts warning about page size): log entries older than `archiveAfterDays` (default 180) → `context/archive/log-YYYY-MM.md`; tracker completions older than `trackerKeepDays` (90) → `context/archive/tracker-YYYY.md` with a pointer line left behind. Archive stays fully greppable (`grep "Feature 07" context/archive/*.md`).
- `decisions.md` grows fastest — it is a page, so the 160-line lint cap fires; split by year into `context/archive/decisions-YYYY.md`, **keep D-NN ids stable** (everything links them).
- Superseded pages → `status: superseded` + `superseded_by` first (they drop out of routing), then `context/archive/` after a phase.
- Whole-wiki growth: the COMPACT procedure (`operations.md` §9) and hierarchical indexes past ~150 pages (`context-routing.md → Scaling`).

## Retrieval stays fast at any size

Orient reads only: AGENTS.md (≤120 lines, incl. Lessons) → index catalog → memory.md → tracker hot window. Everything older is found by `ctx brief` (live pages), `grep "^## \[" context/log.md`, or grep in `archive/` — dated, structured, append-only lines are what make that work.
