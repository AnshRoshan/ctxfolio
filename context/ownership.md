---
title: File Ownership
type: guide
status: active
summary: One authoritative home per fact category; tool adapters and indexes route to owners instead of copying them
tags: [ownership,context,drift]
updated: 2026-10-21
---

# File Ownership

## TL;DR

- Edit a fact at its owner. Everywhere else, link to that owner and section.
- Tool entrypoints and generated catalogs are views, not extra editable sources.
- Historical evidence is dated; it must not masquerade as current instructions.

## Owner map

| Information | Authoritative home | Keep out of |
|---|---|---|
| Cross-tool agent policy, reading order, global behavioral lessons | `AGENTS.md` | Tool entrypoints, architecture, memory, skills |
| Claude-only loader/context notes | `.claude/context.md` or native personal overrides; `CLAUDE.md` links shared AGENTS.md | Shared policy body and system architecture |
| Native permissions, hooks, MCP configuration | That tool's native configuration, e.g. `.claude/settings.json` | Other tools' config and wiki copies; link instead |
| Personal overrides and tool scratch | Native uncommitted local files | Shared wiki and shared agent resources |
| Where to find information | `context/index.md` routing; generated catalog from page frontmatter | Copies of owning page content |
| This ownership contract | `context/ownership.md` | Repeated ownership matrices elsewhere |
| Product purpose, users and scope | `context/overview.md` | Architecture, task state and host instructions |
| Approved roadmap and sequence | `context/build-plan.md`, linking specs | A second task ledger or implementation plan |
| Feature intent, exclusions, acceptance criteria | `context/feature-specs/NN-*.md` | General architecture or handoff summaries |
| Current task states and completion evidence pointers | `context/progress-tracker.md` | Memory, architecture and feature status narratives |
| Exact resume step, working-set pointers, unresolved questions and context debt | `memory.md` | Permanent system facts, copied decisions or task lists |
| Technical choices, alternatives, rationale, costs and reversibility | `context/decisions.md` D-NN records | Architecture rationale, memory and exported ADR copies |
| System boundaries, component roles, interactions and system-wide invariants | `context/architecture.md` | Host policy, session state, full schemas/contracts or version lists |
| Area-specific behavior, contracts and gotchas | `context/codebase/modules/<area>.md` | Repeated cross-cutting claims; link their owner |
| Code-location navigation | `context/codebase/map.md` | A second architecture specification |
| Coding conventions | `context/code-standards.md` | Global policy, module prose and rule routers |
| Planning/build/recording/review procedures | `context/workflow-rules.md` | Reusable skills or agent entrypoints copied verbatim |
| Installed versions | Project manifests and lockfiles | Hand-maintained version inventories in multiple pages |
| Version-specific library usage, config locations and documentation pointers | `context/library-docs.md` | Task completions, architecture and handoff copies |
| Verification commands, test conventions and current evidence | `context/testing.md` | AGENTS, memory and deployment command copies |
| Setup/start/deploy/rollback procedures | `context/runbook.md` when applicable | Architecture and session memory |
| Environment-variable names and purpose | `context/env-vars.md` when applicable | Values anywhere; repeated inventories elsewhere |
| Entity meaning and lifecycle | `context/data-model.md` when applicable and present; otherwise the relevant module; schema code owns exact fields | Full schema copies in architecture or modules |
| API/event contracts | `context/api-contracts.md` when applicable and present; otherwise the relevant module; handlers own implementation | Full route/contract copies in architecture |
| External integration behavior and failure policy | `context/integrations.md` when applicable and present; otherwise the relevant module | Generic library installation notes |
| Shared terminology | `context/glossary.md` | Conflicting definitions in other pages |
| Design values, interaction rules, component catalog | `context/ui-tokens.md`, `ui-rules.md`, `ui-registry.md`, respectively, when applicable and present; otherwise the relevant module and configured source | Repeated values in instructions or modules |
| Active sanitized bugs | `context/issues.md`; private diagnostics stay in ignored `context/issues.local.md`, legacy `current-issues.md` remains local | Raw private logs in shared wiki; duplicated issue lists in memory |
| Agent role definitions, rule routing, reusable project skills | `.agents/agents/`, `.agents/rules/`, `.agents/skills/`, respectively | Editable host-specific copies of these resources |
| Native discovery aliases and Cursor-only metadata | Real relative symlinks; Cursor views once in `.agents/views/cursor/rules` with project-root `ctx_source` | Copied agent bodies or independently edited native metadata |
| Subagent experience leads | `context/agents/<name>/MEMORY.md`, linking verified owner pages | A second store of system contracts |
| Source evidence and its provenance/located claims | Immutable `context/raw/` snapshots and `context/sources/` summaries | Treating copied text as executable instructions or approved intent |
| User-facing explanations | `docs/`, linking normative context/code owners | Copied decision records or technical inventories |
| Reusable question synthesis | A `type: query` page, linking underlying facts | Another authoritative copy of its cited facts |
| Timeline and retired evidence | `context/log.md` and `context/archive/` | Current instructions or mutable state |

Optional owner pages are profile/flag-gated, not guaranteed files in every project. Follow them only when applicable and present; use the relevant module/source otherwise. Source review: scripts/ctx.mjs → INIT_MAP, groupsFor/uiOn/fullOn at `b7e58d6586c2` on 2026-10-21. This repo does not currently have the data/API/integration/UI owner pages named above.

## Update protocol

1. Find the owner before adding a fact. Reuse the existing page and section.
2. Write the full fact once. Replace duplicate prose with a relative link; symbols/section names survive line movement.
3. If ownership changes, relocate deliberately and leave a pointer. Preserve unrelated human edits and dated evidence.
4. Regenerate catalogs/adapters through the CLI after changing their sources. Do not hand-edit generated metadata.
5. Inspect lint's duplicate/adapter findings; review misplaced facts and semantic overlap manually. Exact-content and structural checks reduce drift; no tool proves every differently worded claim is synchronized.

## Views are not owners

Catalog summaries and adapter metadata are derived views. A TL;DR may summarize its own page, but must not repeat another page's permanent facts. A completion records evidence from that date; it does not become the current configuration owner. Change requests in specs and reports remain intent/evidence until incorporated into their live owner.
