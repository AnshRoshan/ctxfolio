---
title: Library Docs
type: guide
status: active
summary: CLI builtin/git usage and sharp edges; website dependencies stay in its manifest and module owner
tags: [libraries,dependencies,docs]
updated: 2026-10-21
---

# Library Docs

## TL;DR

- The copied CLI has zero npm dependencies by policy (D-01): node builtins (`fs`, `path`, `os`, `child_process`, `url`, `crypto`) + the `git` CLI. Adding a CLI npm dep requires a decision record and a very good reason. The website has separate dependencies declared in [its manifest](../web/package.json); see the [website module](codebase/modules/website.md).
- Filename lists/status/diffs use NUL-delimited git output; preserve Unicode, spaces and both sides of renames. Non-filename output is CRLF-normalized.

Source review: scripts/ctx.mjs → imports, git/gitFiles/dirtyFiles and hook stdin handling; package.json → engines and dependency-free CLI, web/package.json → website dependencies, at `b7e58d6586c2` on 2026-10-21. CLI run results remain in [testing evidence](testing.md#verification-evidence).

## Installed agent skills / MCP servers

| Tool | Where it comes from | When to load it |
|---|---|---|
| `graphify` skill | installed in this machine's agent | any question about THIS repo's structure — it indexes repos; `ctx tools` detects it |
| `skill-creator` | agent built-in | editing SKILL.md's structure/description |

## Authorized distribution

The user approved `ctxfolio@3.8.0`, GitHub repository `AnshRoshan/ctxfolio` and release `v2.8.0` (D-16). The CLI remains dependency-free and project copies remain supported. Publication results belong in [testing evidence](testing.md#verification-evidence); authorization alone is not proof of registry or release success.

## Per-library usage notes

### git (via execFileSync)
- Called through `git()` / `gitFiles()` in `scripts/ctx.mjs`. NUL filename output is never whitespace-trimmed or dequoted; non-NUL output is CRLF-normalized. Nested project status strips the repository prefix; diffs use `--relative`.
- `status --porcelain -uall` must be ONE argv token (`-u all` as two args makes `all` a pathspec).
- Windows: `where` not `which` for bin probes.

### node builtins
- Git commands ignore stdin; hooks synchronously read a JSON payload until EOF. Hosts must close the payload stream; malformed/nonobject Stop input is a no-op. The test harness bounds each subprocess at 30 seconds, but runtime hooks do not bound an open stdin stream.

## Known operational gotchas

- Feature 10 removed the clean registered legacy editor worktree through `git worktree remove` on 2026-10-21, after checking exact registration/path, tracked/untracked/ignored content and reachability of its detached history from main. The old commit remains in Git history; do not recreate/copy the legacy tree as current source. Evidence: [testing](testing.md#verification-evidence).
- `git ls-files` output is forward-slash on all platforms; keep `posix()` at the boundaries, don't "fix" it.

## Docs sources

- Claude Code hooks/settings schema: `https://json.schemastore.org/claude-code-settings.json` (referenced in the template) — re-read before changing hook wiring.
