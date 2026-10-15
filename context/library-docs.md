---
title: Library Docs
type: guide
status: active
summary: The only "libraries" here are node builtins and the git CLI — with the sharp edges already learned
tags: [libraries,dependencies,docs]
updated: 2026-10-14
verified_at: 080a7adb7826
---

# Library Docs

## TL;DR

- Zero dependencies by policy (D-01): node builtins (`fs`, `path`, `os`, `child_process`, `url`) + the `git` CLI. Adding an npm dep requires a decision record and a very good reason.
- Filename lists/status/diffs use NUL-delimited git output; preserve Unicode, spaces and both sides of renames. Non-filename output is CRLF-normalized.

## Installed agent skills / MCP servers

| Tool | Where it comes from | When to load it |
|---|---|---|
| `graphify` skill | installed in this machine's agent | any question about THIS repo's structure — it indexes repos; `ctx tools` detects it |
| `skill-creator` | agent built-in | editing SKILL.md's structure/description |

## Per-library usage notes

### git (via execFileSync)
- Called through `git()` / `gitFiles()` in `scripts/ctx.mjs`. NUL filename output is never whitespace-trimmed or dequoted; non-NUL output is CRLF-normalized. Nested project status strips the repository prefix; diffs use `--relative`.
- `status --porcelain -uall` must be ONE argv token (`-u all` as two args makes `all` a pathspec).
- Windows: `where` not `which` for bin probes.

### node builtins
- Git commands ignore stdin; hooks synchronously read a JSON payload until EOF. Hosts must close the payload stream; malformed/nonobject Stop input is a no-op. The test harness bounds each subprocess at 30 seconds, but runtime hooks do not bound an open stdin stream.

## Known operational gotchas

- This repo's `.kilo/worktrees/super-raincoat/` is a stale v1 editor worktree (untracked) — never edit or copy from it.
- `git ls-files` output is forward-slash on all platforms; keep `posix()` at the boundaries, don't "fix" it.

## Docs sources

- Claude Code hooks/settings schema: `https://json.schemastore.org/claude-code-settings.json` (referenced in the template) — re-read before changing hook wiring.
