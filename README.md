# project-context-system

**[Live site: anshroshan.github.io/project-context-system](https://anshroshan.github.io/project-context-system/)**

A project-local context wiki lets a fresh coding agent recover decisions, contracts and next steps without rediscovering everything. This skill scaffolds that wiki, routes tasks to relevant pages, and flags context that needs review.

[![release](https://img.shields.io/github/v/release/AnshRoshan/project-context-system?color=blue)](https://github.com/AnshRoshan/project-context-system/releases)
[![ci](https://github.com/AnshRoshan/project-context-system/actions/workflows/ci.yml/badge.svg)](https://github.com/AnshRoshan/project-context-system/actions/workflows/ci.yml)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](scripts/ctx.mjs)
![node](https://img.shields.io/badge/node-22%20%7C%2024-brightgreen)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![agents](https://img.shields.io/badge/Claude·Code-Codex·Cursor·Copilot·Gemini·Qoder-lightgrey)](references/multi-agent-interop.md)

Every session, your coding agent re-derives the same facts about the same repo — tokens spent rediscovering what it did last time. **Context is compiled, not retrieved**: this system has the agent *write down* what it learns, once, at change time, into an interlinked markdown wiki (`context/`); future sessions — any tool, any teammate's machine — orient from those files in ~2–5k tokens instead of re-exploring.

```
raw (code + context/raw/)  ──►  wiki (context/** pages)  ◄──  schema (AGENTS.md + context/index.md)
   code + source snapshots       agent-owned, human-reviewed      how to maintain it
```

Hooks and lint check context bookkeeping alongside the code diff. In configured Claude sessions, Stop can request missing page/coverage/state updates; its repeat-pass bypass and no-git limits mean it is not a safety or correctness guarantee. Other tools use explicit checks or CI. [Hook contract](references/safety-permissions.md).

## 60-second start

**Windows:** enable Developer Mode (or obtain the symbolic-link privilege) before creating/cloning real links. `Start-Process 'ms-settings:developers'` opens the setting; the skill never toggles it automatically. You may turn it off after verified creation, but future clones/checkouts/link repairs can require it again. New setup uses real relative symlinks and local Git `core.symlinks=true`; unsupported permissions fail clearly, not as copied files. `--portable-pointers` is an explicit legacy opt-out.

```bash
# 1 — install the skill (auto-detects ~/.claude / ~/.qoder; --tool|--dest to steer)
git -c core.symlinks=true clone https://github.com/AnshRoshan/project-context-system
node project-context-system/scripts/ctx.mjs install

# 2 — set up any repo: greenfield or brownfield, any language (run from its root)
cd your-project && node <skill-dir>/scripts/ctx.mjs setup

# 3 — work. The agent orients, routes, records, and hands off through files.
node context/ctx.mjs brief src/auth/login.ts   # what to read for this task
node context/ctx.mjs task start 03             # one unit at a time, enforced
```

Or just paste to your agent: *"Clone `https://github.com/AnshRoshan/project-context-system`, install it, then set up this repository."* Setup is **idempotent and upgrade-safe** — re-run `setup` any time; filled content is never clobbered, and after updating the skill it upgrades the project in place.

## What lands in your repo

| Piece | What it does |
|---|---|
| `AGENTS.md` | the schema every agent reads first — ≤120 lines, routed, with a **Lessons** section that turns each of your corrections into a permanent one-liner |
| `context/` | the wiki: router index, append-only log, architecture/standards/decisions pages, **codebase map + module pages with `covers:` globs**, feature specs, immutable `raw/` for ingested docs |
| `context/progress-tracker.md` | the task ledger — In progress (max one) / Blocked / Up next / Completed, moved by `ctx task` |
| `context/ownership.md` | the responsibility map: where a fact belongs, and where it must not be repeated |
| `.agents/{agents,rules,skills}/` | canonical reusable instruction bodies, rule routers and internally authored skills |
| Native resource symlinks | Claude agents/rules/skills and Cursor skills share canonical folders; Cursor rules link one central native-format view folder; host settings remain separate |
| `docs/` | human-facing docs; agents read `context/` — one fact, one home, linked never duplicated |
| `context/ctx.mjs` | the zero-dependency CLI the project carries forever |

## Why it holds up

- **Any project, detected not assumed** — `ctx setup` reads manifests (Node, Python, Go, Rust, Java, Ruby, PHP, Dart, Elixir, C++…), classifies the shape (web-app / api / cli / library / mobile / data / monorepo), and scaffolds only what fits. A FastAPI repo gets no Next.js-flavored pages.
- **Delegates, doesn't hand-roll** — `ctx tools` finds graphify, ctags, aider, dependency-cruiser; the structural pass runs on real code-intelligence, the wiki keeps the distilled result.
- **Evidence-aware routing** — `ctx brief <task> --budget 6000 --json` returns ranked pages, TL;DRs, costs, skipped candidates and verification warnings. Retired pages stay out unless `--history`.
- **Git-backed review signals** — `ctx stale`/`ctx impact` map changed paths to responsible pages. Checks identify review work; they do not prove claims are true.
- **Built for teams** — one unit = one branch = one owner; merge collisions (duplicate task/spec/decision IDs) surface as lint errors, not arguments. `ctx archive` rotates growth out of the hot files. See [references/multi-user.md](references/multi-user.md).
- **Prompts are products** — specs and subagent briefs follow ASD-STE100 (Simplified Technical English) discipline: one action per sentence, one word one meaning. [references/prompt-craft.md](references/prompt-craft.md).
- **Tested as a CLI** — this repo runs its own context system; `node tests/run.mjs` drives disposable git repos and the copied tool, including budgets, filenames, hook edge cases and non-destructive setup. Supported-platform CI and published release results live in [verification evidence](context/testing.md#verification-evidence); local results alone do not certify remote CI.

## The CLI

```
setup · init · detect · tools         one-command scaffold, profile, delegation targets
brief · rules · coverage · status     route a task to pages; what applies to THIS file
task add|start|block|done|list        the ledger, one unit at a time
impact · stale · stamp · lint --fix   keep pages true to code (git-based)
index · log · new · archive           catalog, timeline, page scaffolds, growth rotation
doctor · install · hook               wiring checks, skill installer, Claude hooks
adapters [--check] [--migrate]          recorded layout refresh and central metadata views
symlinks [--check] [--migrate]          real relative link audit/migration and local Git configuration
facts [--write] · quarantine · ingest  derived metadata and hash-bound raw-source governance
eval · evalpack · query file · adr     routing measurements, evidence packets, filed answers, decision lifecycle
capture digest|approve|promote         metadata-only digest and explicit draft promotion
hosts · check · symbols · search       declared compatibility, portable checks and derived tooling
mcp · team · cursor --agent ID          read-only protocol tools and explicit team cursor ownership
```

Read-only commands speak `--json` (`{command, ok}`) for scripts and CI. Configured Claude hooks provide orientation reminders and limited working-tree bookkeeping checks; see the [hook contract and bypass limits](references/safety-permissions.md#hooks-shipped-with-this-skill-v2).

## Measured evidence and limits

The frozen ten-question routing fixture is measured by `ctx eval`, not an LLM judge. Its current result is **hit@8 1.0, precision 0.15**; see [routing output](context/evals/routing-result.json). These measure whether expected pages were retrieved, not answer correctness, billed tokens or savings. The actual ten-question cold-start run was independently graded **8 correct and 2 partial**; see [raw answers](context/evals/cold-start-reader.json), [grades](context/evals/cold-start-grades.json), and [testing evidence](context/testing.md#verification-evidence). This is one reader/grader pair with concurrent-checkout limits; unavailable token/cost fields remain unknown. No matched with/without-wiki baseline was run, so this project does not claim measured token savings or generalized task-success improvements.

## The five laws

1. **Decide what to build first** — a line changed in a plan is free; a decision spread through the codebase is a rewrite.
2. **Make the hard calls on purpose** — every addition gets an explicit cost recorded.
3. **Keep the state in files** — updated *while* working, enforced by tooling, not goodwill.
4. **Never let the AI decide something important silently** — conflicts are flagged to the human.
5. **Read cheap, then deep** — index line → TL;DR → page → source. Stop at the first level that answers.

## Release tracks

The skill/CLI and package/plugin versions have separate identities. Tags follow the skill track; `node tests/check-versions.mjs --require-tag` checks each track, this mapping and the newest reachable release tag.

| Skill / CLI | Package / plugin | Release tag |
|---|---|---|
| 2.7.0 | 3.7.0 | v2.7.0 |

## Docs

[INSTALL.md](INSTALL.md) · [SKILL.md](SKILL.md) (the method agents follow) · [references/ctx-cli.md](references/ctx-cli.md) (every flag) · [references/operations.md](references/operations.md) (the nine playbooks) · [references/llm-wiki-pattern.md](references/llm-wiki-pattern.md) (the architecture) · [CHANGELOG.md](CHANGELOG.md)

**This repo vs your project:** dev history (CHANGELOG, tests, this README) stays here; `ctx install` ships only the skill; `ctx setup` writes only pages about *your* project — no version chatter, no lineage, test-guarded on both boundaries.

## Lineage & license

v1 distilled five senior-engineer AI-build courses plus audits against Anthropic docs, agents.md, OpenAI Codex guidance, GitHub Spec Kit and obra/superpowers. v2 rebuilt it on Andrej Karpathy's LLM-Wiki pattern (raw / wiki / schema; ingest / query / lint) with progressive-disclosure context engineering, git-backed staleness, and enforcement tooling.

MIT — see [LICENSE](LICENSE). Copy, adapt, reuse.
