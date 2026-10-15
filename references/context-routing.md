# Context Routing — progressive disclosure, budgets and scaling

The point of the wiki is to **spend as few tokens as possible to be correct**. Context rot is real: quality degrades well before the advertised window fills (noticeable from ~50k tokens). So: load lightly, drill selectively, stop early.

## Four levels of disclosure

| Level | Artifact | Cost | Question it answers |
|---|---|---|---|
| L0 | `index.md` catalog line (`summary`) | ~25 tokens/page | "does a page about this exist?" |
| L1 | `## TL;DR` (3–5 lines) | ~80 tokens | "is this the page, and what are the key facts?" |
| L2 | full page | 300–2000 tokens | "I need the contracts/flow/gotchas" |
| L3 | source files | variable | "I need exact code" — only for what pages don't answer |

Rule: **stop at the first level that answers the question.** The `ctx brief` output shows L0 + L1 for ranked candidates with token costs.

## Token budgets (targets — `ctx status` reports actuals)

| Item | Budget |
|---|---|
| AGENTS.md | ≤ 120 lines (aim 60–90) |
| Orient set (index + memory + tracker skim) | ≤ 5k tokens |
| One page | ≤ 160 lines (~2k tokens) |
| One summary line | ≤ 160 chars |
| `memory.md` | ≤ 60 lines |
| `brief` default | 8 pages; use `--budget 6000` to cap |
| Whole task context before first edit | aim ≤ 15k tokens |

## Routing table (in `index.md`, hand-maintained)
Maps task type → ordered page list. This is the deterministic layer; `ctx brief` is the fuzzy layer (keywords/files). Customize the table per project: add rows for recurring task types ("add a webhook", "new report"). If an agent reads something that was not on the route and found it essential → add it to the route.

## How `ctx brief` ranks
1. `covers` match on file arguments (+100) — exact responsibility beats everything.
2. title (+6), tag (+5), summary (+3), path (+3), covers-path (+2), body mentions (+1 each, cap 4).
3. Exclude superseded/archived pages by default; `--history` includes them at ÷4 and labels them historical. Unfilled drafts ÷3 (not established knowledge). Ties sort by page path for stable output.
4. Select within `--limit` and the remaining `--budget`, including mandatory `alwaysRead` cost. Never let the first page bypass the cap; report skipped candidates and orientation overflow. Use `--json` to inspect reasons and verification warnings. Token estimates use full-page characters / 4, not model tokenization.
Good tags are the cheapest routing investment: 3–6 lowercase nouns a developer would search for.

## Retrieval discipline for agents
- Never preload the folder. Never `cat context/*`.
- Prefer `brief <file>` when you already know which code you'll touch; `brief <keywords>` when exploring.
- Two hops max from a page via `related`/links before asking whether the task is scoped correctly.
- No results can mean budget/limit omissions, not missing knowledge; inspect `skipped` first. For a real gap, verify sources and update an existing page before creating another. Read-only tasks return the proposed fix without writing.
- Treat `verificationRequired` as a source-check gate, not a reason to hide relevant pages. Git freshness is a bookkeeping signal; verify important claims against code/tests or approved intent.

## Subagents for research
Reading-heavy exploration goes to read-only subagents with a fixed return shape ("current behavior, relevant files, constraints, recommended approach — do not implement"). Their output is summarized into pages; the raw exploration never enters the main context.

## Scaling the wiki

| Size | Structure |
|---|---|
| ≤ 40 pages | one `index.md` catalog |
| 40–150 pages | catalog grouped by type (default) + routing table |
| 150+ pages or monorepo | **hierarchical indexes**: root `index.md` = routing table + one line per *area* linking to `<area>/index.md` (each its own catalog, generated with `ctx index --root <area>` run from that area's context root); nested `AGENTS.md` per package; keep root catalog under ~6k tokens |
| Very large | optional: add a local search tool (e.g. BM25/vector over `context/`) *behind* the same index — the markdown remains the source of truth; do not make the wiki depend on it |

Signals you need to scale: `ctx status` shows orient cost > 6k tokens; `brief` returns >10 plausible pages for ordinary tasks; agents start creating duplicate pages.

## Compaction (inside a long chat)
Prefer a fresh session per unit — with a good wiki, restarting is cheap. When you must compact, preserve: current unit, full list of modified files, test/build commands, open questions, and **the list of pages already read** (so they aren't re-read).
