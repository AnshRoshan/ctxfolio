# Multi-agent & multi-tool interop

One set of owners, multiple tool entrypoints. **AGENTS.md owns shared agent policy, not every project fact.** `context/ownership.md` assigns the remaining facts; native resource adapters discover canonical `.agents/` sources through `ctx_source`. Pointers and generated metadata still need validation; they are not a guarantee against all drift.

| Tool | Reads | What to scaffold |
|---|---|---|
| Codex, Cursor, Copilot (agent), Zed, Jules, Amp, many others | `AGENTS.md` | the real file |
| Claude Code | `CLAUDE.md` | Real symlink to AGENTS.md. Claude-only loader context belongs in `.claude/context.md`; native settings/hooks and personal overrides remain separate |
| Gemini CLI | `GEMINI.md` | Real symlink to AGENTS.md |
| GitHub Copilot (chat/instructions) | `.github/copilot-instructions.md` | Relative symlink to shared AGENTS.md |
| Cursor rules | `.cursor/rules/*.mdc` | Folder symlink to central `.agents/views/cursor/rules`; native metadata resolves canonical `ctx_source` from the project root |
| Windsurf, others | `AGENTS.md` (current) | inspect legacy `.windsurfrules`, `.cursorrules`, singular `AGENT.md`; merge useful content at its owner before deliberately retiring shadowing files |
| Web chat / no filesystem | whatever you paste | paste `AGENTS.md` + `context/index.md` + the TL;DRs from `ctx brief`; or point at `llms.txt` |

Fresh setup defaults to native relative links; recorded legacy layouts require `ctx symlinks --migrate`. `--portable-pointers` is an explicit legacy opt-out, not an automatic permission fallback. Canonical roles/rules/skills have one physical owner; compatible host folders alias it.

Do not alias entire native configuration folders or make regular copies of AGENTS.md: host settings and loader-only context have different owners. Windows must permit native symlinks before creation; existing links continue to work after Developer Mode is disabled, but future recreation may require it again. Keep `ctx_source` project-relative, regenerate adapters after source changes, and check for missing/misdirected sources or stale generated metadata. Existing custom native files require a deliberate merge; never replace them just to force a uniform tree.

## Loader budgets & gotchas
- Codex concatenates nested AGENTS.md root-down with a size cap (`project_doc_max_bytes`, ~32 KiB by default): keep each tiny; push content into `context/`.
- Claude Code loads CLAUDE.md fully at launch — big files cost tokens every session. Keep AGENTS.md ≤ 120 lines and let `index.md` route.
- First-match loaders can silently shadow AGENTS.md when a legacy file exists — `ctx lint` flags them.
- Hooks (`SessionStart`, `Stop`) are Claude Code features. For other tools the same checks run as: a pre-commit git hook (`assets/pre-commit.template`), CI (`ctx lint`), or by instruction ("run `ctx impact` before finishing").
- Tool auto-memory is scratch; `memory.md` is a resume cursor, not another permanent knowledge store. Resolve conflicts using current evidence and approved intent, then update the owning page. Do not pick a winner solely because it is a file.

## Monorepos
Root `AGENTS.md` = what is true everywhere. Per-package nested `AGENTS.md` (`assets/nested-AGENTS.md.template`) = only local rules + a line pointing to that package's wiki. Per-package `context/` is optional but recommended above ~150 files; the root index lists each package index.

## Multiple agents at once (parallel work)
- Each agent owns **one spec / one boundary**; pages are the shared state, so conflicts show up in git, not in lost chat.
- Agents write to different pages by default; shared pages (`progress-tracker`, `decisions`, `index`) are append/merge-friendly by design — `ctx index` regenerates the catalog so merge conflicts there are resolved by re-running it.
- `log.md` is append-only → trivially mergeable.
- Researchers (read-only subagents) return findings; one writer commits to the wiki.

## Co-existing with other pipelines
SDLC packs (explore → plan → design → apply → verify → archive) overlap with the session protocol. Route intent/acceptance artifacts into `context/feature-specs/`, current task state into the task ledger and decisions into `decisions.md`; use pointers instead of a parallel spec/status/decision tree. Standalone knowledge-base tools that write into AGENTS.md: back it up first and merge custom content back.

## Human tooling
The wiki is plain markdown + git: open it in Obsidian (graph view shows the link structure; wikilinks work), VS Code, or any editor. Obsidian is optional — nothing depends on it.
