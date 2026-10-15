# AGENTS.md / CLAUDE.md Authoring Rules

## Purpose
`AGENTS.md` owns cross-tool agent behavior and routing. It does not own the project's stack/version inventory, system architecture, commands, task ledger or handoff. Link those facts at the owners defined by `context/ownership.md`.

`CLAUDE.md` starts with `@AGENTS.md` and contains only additional Claude-specific loader/context notes. Native permissions/hooks are configuration, not architecture prose. Cursor/Gemini/Copilot entrypoints point to shared instructions; canonical role/rule/skill bodies live in `.agents/`, not in editable host copies.

## Mental model
The context files are the knowledge; AGENTS.md is the instruction manual that tells the agent how to use that knowledge. Without it the agent skips a file, reads them in the wrong order, or misses a rule. With it, every session starts exactly the same way. Its job is wiring, not content.

## The three sections

1. **Reading order and routes** — index → resume cursor → task-specific pages. Describe when to follow an owner link, not the owner's contents. Never preload the entire tree.
2. **Global agent policy** — authorization/read-only behavior, protecting user edits/secrets, handling evidence and surfacing important conflicts. System invariants remain in architecture/module/contract owners; routers make them load when relevant.
3. **Resource discovery and lessons** — point to `.agents/README.md`; keep only short global behavioral corrections here. Area-specific lessons belong in their owner page.

## Inclusion test
"If removing this instruction would probably make the agent assume the wrong thing, keep it. Otherwise ask whether it really needs to be in every session." Never put something in just because the agent might need it one day. Don't dump the entire project structure or huge API documentation.

## Specificity
Vague imperatives tell the agent nothing: "write high-quality code", "follow best practices", "make the UI beautiful", "keep everything clean". Replace with behavior-changing facts:
- "format code properly" → "use two-space indentation"
- "test your work" → "run npm test before finishing the task"
- "keep API organized" → "API handlers live in src/api/handlers"
- design rules: "editorial, product-focused, reuse the design system, no dashboard-style UI, no purple gradients"

The more specific, the less the agent has to guess.

## Size
Well under 200 lines, but don't treat 200 as a target. If everything useful fits in 30-40 lines, that is better. Each line spends the attention budget.

## Hierarchy
1. Personal tool context — user-owned cross-project behavior; do not copy it into a shared project wiki.
2. Project root AGENTS.md (+ CLAUDE.md wrapper importing `@AGENTS.md`) - commit to git so everyone gives the agent the same instructions.
3. `CLAUDE.local.md` (project root, gitignored) - personal per-project overrides (local test accounts, sandbox URLs); Claude appends it after CLAUDE.md per directory. Never committed.
4. Nested AGENTS.md - monorepos: one lean root file for what is true everywhere, separate files next to the parts with their own rules. The closest AGENTS.md wins (OpenAI's own repo runs ~88 nested files). The agent only pulls the instructions relevant to the area it is actually working on. Budget: Codex concatenates nested files root-down with a 32 KiB `project_doc_max_bytes` cap and honors `AGENTS.override.md` - keep nested files tiny. Delete legacy shadowing config: `.cursorrules`, `.windsurfrules`, singular `AGENT.md` (first-match loaders like Zed silently shadow AGENTS.md).

## Rules splitting
When instructions grow, route through canonical `.agents/rules/` scopes to the existing owner pages. Native Claude/Cursor discovery adapters contain metadata plus `ctx_source`, not copied policy bodies. Repeatable procedures live in their owner page; a skill may link that procedure instead of duplicating it.

## Growth discipline
- Grow only because the project made a real decision worth remembering ("this is exactly how AGENTS.md should grow - not because you want a bigger file").
- Keep it updated; remove things that aren't true anymore. Sometimes the right change is deleting.
- "If the agent keeps making the same wrong assumption every time, that is a sign your project instructions are missing or wrong."
- AGENTS.md is guidance, not enforcement. Hard blocks live in permissions/hooks, not prose.
- Facts go to their declared owner. AGENTS routes; skills discover reusable procedures; one-time requests do not need another persistent instruction file.
- Keep tool-generated preamble that helps (e.g. Next.js's "training data may be outdated, read the install docs before writing code" note).
- If an external MCP/tool rewrites AGENTS.md: back the file up first, then merge your custom content back on top. Both need to be there; neither replaces the other.


## v2 update — AGENTS.md is the schema, the index is the router
- Reading order is now: `context/index.md` -> `memory.md` -> tracker skim -> `ctx brief` for the task. The old fixed always-read list is retired because it grows with the project; routing does not.
- AGENTS.md carries shared behavior, reading order, resource/owner links and global lessons. Deep execution/recording steps belong in workflow-rules; commands/evidence in testing/runbook; architecture, decisions, current task state and memory have separate owners.
- Target 60-90 lines, hard cap 120 (`ctx lint` warns). Each line must pass the inclusion test: removing it would make the agent assume the wrong thing.
- `ctx lint` also checks: CLAUDE.md starts with `@AGENTS.md`; AGENTS.md routes through `context/index.md`; legacy `.cursorrules/.windsurfrules/AGENT.md` absent.
- Evolve it: when an agent repeats a mistake twice, add the one-line rule (or a page) that prevents it; when a rule never prevents anything, delete it. You and the agent co-evolve the schema.
