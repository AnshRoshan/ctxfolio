---
title: Page-Contract Integrity
type: feature
status: complete
summary: Make frontmatter parsing and covers matching fail closed instead of silently dropping data or crashing
tags: [frontmatter, glob, parsing, reliability]
covers: [scripts/ctx.mjs, tests/run.mjs]
related: [../build-plan.md, ../decisions.md, ./08-always-green-baseline.md]
updated: 2026-10-21
verified_at: 69e9f4c26c27
---

# Page-Contract Integrity

## TL;DR

- Goal: every page contract either parses into exactly the values the author wrote or reports a named error; a `covers:` glob never crashes a command.
- Boundary: `parseFrontmatter`, `globToRegex`, and the `pages()` / `lint` / `brief` paths that consume them. No new frontmatter types, no route lint, no retrieval scoring.
- Measurable: a folded summary keeps its text; duplicate keys and `cover:` typos fail lint; `{*.ts,*.tsx}` compiles and matches; the full suite stays green.

## Why now

The 2026-10-21 audit found the checker is not fail-closed. `parseFrontmatter` stores `summary: >` as the literal `>`, so a valid block scalar loses its text. Duplicate keys silently keep the last value. A `cover:` typo is ignored, which disables staleness for that page. `globToRegex` builds `(?:*.ts|*.tsx)` for a brace glob with wildcards and throws `SyntaxError: Nothing to repeat`; because `lint`, `brief`, `impact` and `stale` compile covers, one page can take down the whole command. A green lint is not evidence if the page contract is being read wrong.

## What to build

1. Extend `parseFrontmatter` to support folded (`>`) and literal (`|`) block scalars, including the `-` chomping suffix, and normalize a `summary` to one line.
2. Return `errors` from `parseFrontmatter`. Report duplicate keys, nested mappings, tab indentation, top-level sequence items, and unparseable non-empty lines. Do not silently ignore them.
3. Add near-miss key detection in `lint` for `cover`/`covers`, `summery`/`summary`, `statuss`/`status`, `titel`/`title`, `updted`/`updated`, `tag`/`tags`, and `relateds`/`related` when the canonical key is absent.
4. Replace the brace branch in `globToRegex` with a recursive compiler that handles `*`, `?`, `**`, nested braces, and comma-separated alternatives. Escape every literal correctly.
5. Make glob compilation non-throwing for callers: return a never-matching regex carrying a `globError` description. `lint` reports that error for the page; `brief` adds it to the page's trust warnings; `stale` and `impact` simply do not match that glob.
6. Keep the existing dead-pointer warning: a covers glob that compiles but matches no tracked file stays a warning.
7. Add regression tests for folded and literal summaries, duplicate keys, a `cover:` typo, nested mappings, a brace glob with wildcards, and an invalid glob that must not crash.

## Explicitly NOT in this spec

- Do not validate `related:` targets or routing-table code spans. That is Feature 34.
- Do not change retrieval scoring, IDF, CJK tokenization or `status: complete` discounts. That is Feature 17.
- Do not make writes atomic or add locking. That is Feature 31.
- Do not change the page schema, required fields, or the `status` enum.
- Do not add a YAML dependency; D-01 keeps the CLI zero-dependency.

## Clarifications

- "Fail closed" means an unreadable contract is named and does not silently become empty data or a false match. It does not mean every malformed page aborts every command.
- A block scalar is supported for string fields. Arrays stay inline or block-list only. Leading indentation tabs are rejected before block/list parsing; tabs inside already-indented content are ordinary text.
- `globError` is an internal marker, not a page field. It is reported through lint and brief, never written to a page.
- Feature 30 starts before Feature 08 in the Wave 0 order recorded by F-01; it needs no macOS runner.

## Value sources

| Value | Comes from |
|---|---|
| `summary: >` becomes `>` | `parseFrontmatter` source, 2026-10-21; direct read |
| `{*.ts,*.tsx}` throws `Nothing to repeat` | `node -e` against `globToRegex`, 2026-10-21 |
| 101 passed / 0 failed / 0 skipped baseline | `node tests/run.mjs` on Windows, 2026-10-21 (before Feature 30) |
| 106 passed / 0 failed / 0 skipped | `node tests/run.mjs` on Windows, 2026-10-21 (after Feature 30) |
| 22 pages, 0 errors / 0 warnings | `node context/ctx.mjs lint --strict`, 2026-10-21 (after updating + stamping owners) |
| Nine pages cite unreachable `080a7adb7826` | `rg -l "^verified_at: 080a7adb7826" context`, 2026-10-21 |

## Verification checklist

- [x] A page with `summary: >` and two indented lines yields the joined sentence, not `>`
- [x] A page with a literal `summary: |` keeps both lines, and the index catalog joins them on one line
- [x] Duplicate frontmatter keys fail lint with the key name
- [x] A `cover:` typo fails lint and names `covers`
- [x] Nested mappings and tab indentation fail lint
- [x] `{*.ts,*.tsx}` compiles and does not throw; brace alternatives route a covered file
- [x] A malformed glob is reported by lint and does not crash `brief`, `impact` or `stale`
- [x] `node tests/run.mjs` passes with the new cases and 0 failures (106 passed)
- [x] `node context/ctx.mjs lint --strict`, `stale --strict` and `doctor` are green (22 pages 0/0; 13/13 checks)
- [x] `../progress-tracker.md`, `../../memory.md`, `../log.md` and `../index.md` reflect the unit
