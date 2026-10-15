# Docs

User-facing entry points: [Getting started](../README.md), [CLI flags and routing JSON](../references/ctx-cli.md), [Upgrade changes](../CHANGELOG.md). Existing project upgrades refresh the CLI but preserve user-authored instructions/settings; review and merge relevant template guidance deliberately.

Human-facing documentation lives **here**. Agent-facing knowledge lives in `context/`.
One fact, one home: a doc page explains to a person how to use or operate the thing;
if it also constrains the agent, the rule belongs in `context/` and this page links to it.

| Write it here | Write it in context/ instead |
|---|---|
| User guides, tutorials, CLI usage | module pages, contracts, invariants |
| `runbooks/` — operator steps for humans | `context/runbook.md` — the agent's operational duties |
| `adr/` — decision records exported for humans (copy of D-NN) | `context/decisions.md` — the decision sink |
| Onboarding for a new teammate | `context/overview.md`, `AGENTS.md` |

Rules:
- Never restate a `context/` page — link to it. Duplicated prose drifts.
- A feature is not documented until its user-facing behavior is written here (part of "done").
- `context/log.md` records when docs were regenerated so staleness is visible.
