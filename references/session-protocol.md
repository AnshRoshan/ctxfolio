# Session Protocol - the full working loop

## Roles
Human + planning AI = the architect. The coding agent = the implementation engine. "Spec-driven keeps the thinking with you." Use a separate chat (ChatGPT/Claude/Gemini or plan mode) for planning; the coding agent executes specs it did not write.

## Opening a session
One prompt restores full context:

> Read AGENTS.md. Read context/index.md and memory.md, skim progress-tracker.md. Run `node context/ctx.mjs brief <task files/keywords>` and read only the pages it returns (TL;DR first). Confirm once you are ready to build Feature NN.

v2 note: the old "always read overview + workflow-rules + tracker + memory" set is replaced by routing through `context/index.md` (task → pages) so orientation costs ~2-5k tokens regardless of project size. `workflow-rules.md` and `code-standards.md` are read before any code change; `overview.md` when the task is product-level. A SessionStart hook re-injects this after clear/compact.

## Skills loop pattern
Discover installed project skills through `.agents/README.md` and `.agents/skills/`. A skill can route to planning, handoff or review procedures, but must not copy the complete workflow into another editable tree. Do not assume named commands exist merely because a playbook mentions them.

One fresh chat/session per feature unit. Never keep an old chat for unrelated work; "we don't want stale context lingering. Only remain within the same chat when what you're about to do next is related."

## Context budget
A model advertising a 200k window shows measurable degradation from ~50k tokens. Only a quarter in. The number on the box is the technical ceiling, not where quality starts to slip; it slips continuously, not as a cliff.
- Clear context when moving to something genuinely unrelated (30 minutes of auth debugging → now redesigning product cards: clear).
- Compact to summarize the conversation when continuing the same work but needing room. "In most cases, when you fill up the context, you're already done with the feature - just clear."
- Inspect what is filling context (`/context`, `/context all`).
- Skills load on demand, so a detailed UI workflow doesn't occupy context while debugging a migration. Skill metadata is always in context: 10 useful skills are fine, 100 random ones aren't.

## The spec loop
Use the full loop for new or risky behavior. Small authorized fixes can use the request and focused checks; questions use QUERY. Read-only scope forbids artifact, log, stamp, and memory writes, including at handoff.

1. **Plan the unit** using the current request, source facts and version-matched library documentation. Reuse existing tools; install a new skill/MCP only when needed and authorized.
2. **Write the spec** to `context/feature-specs/NN-name.md`. One system boundary per spec. Big features split into 2-3 independent specs, each scoped so "each one is independent, but together they complete the experience".
2a. **Clarify gate.** Before planning, the agent asks up to five targeted questions about underspecified areas of the spec - **one question at a time**, confirming shared terminology as it goes ("RLS - is that right?"). Answers are written back into the spec file, not left in chat.
2b. **Consistency check, read-only.** Cross-check spec ↔ plan ↔ task coverage (a task with no matching requirement, a plan contradicting the spec) before implementing anything; fix the artifacts, not the code.
3. **Implement.** Prompt: "Read that spec. Mark that unit as in progress in the progress tracker. Implement it exactly as specified **without going beyond scope**." The agent writes and saves its plan, then executes. Prefer a failing test first for logic changes. If implementation already exists, verify the test detects the intended regression; do not discard correct code solely for test ordering.
4. **Review against the spec's checklist, then converge.** Re-check spec ↔ implementation until nothing is missing; the converge pass may only *append* tasks, never rewrite the spec. Then: "show me the important changes you made and explain anything I should review", plus the diff.
5. **Scope discipline.** Correct only your own out-of-scope changes and preserve unrelated user work. Give a focused prompt with the wrong behavior, expected result and owning files.
6. **Close the unit.** Record verification at its evidence owner, link it from the task completion and save the resume cursor. Commit or start another spec only when authorized.

## UI-first, logic-second
For a feature with both: "Do the UI first and then the logic second - complete the profile page with mock data, without save logic." Two clean results instead of one muddy one.

## Design references
For UI pages, use visual references in `context/designs/` or `screenshots/` so the agent is "not inventing, it's matching what's already there". Feed screenshots back as visual feedback.

## Corrective prompt anatomy
1. File references + screenshots up front (stops it wandering the entire project).
2. Every issue listed one by one, with technical hints as shortcuts.
3. Describe exactly what success looks like - "not just what's broken, but what done looks like".

One issue at a time: "whenever you give it more stuff to fix, it's easy for some of these to fall through." If a batch fix drops an item, re-issue a single-issue prompt.

## Plan mode gates
Use plan mode when the approach itself needs review: database changes, authentication, migrations, large refactors, changes across several parts. Not for obvious changes - "if the change is obvious, don't add another step". Approving the plan exits plan mode and unblocks edits.
- "The cheapest place to fix a wrong decision is in the plan, not after the code is written."
- "If you immediately press approve without reading the plan, you've gained almost nothing. The whole point is to catch bad decisions before they become code."
- Spend 5-10 minutes. Check: tables created, relationships, where state lives, schema location, files that will change, verification approach. A weak plan says "add database, update storefront" - reject and replan.
- If it drifts mid-execution, go back into plan mode rather than correcting line by line.
- Plans can be exported to markdown for review; edit directly before approving.

## Subagents
Another agent receives a focused task and works inside its own context: main delegates, subagent investigates, reports back. Context isolation, not intelligence - fancy job titles ("senior staff backend engineer") add no knowledge. The right question: "what work can happen separately that my main conversation doesn't need to carry?"

Fan-out pattern, verbatim shape:
> Investigate using separate focused subagents. Have them independently inspect [data model / stock behavior / auth + admin access / order lifecycle / UI patterns]. Each subagent returns the current behavior, relevant files, important constraints, and a recommended approach. **Do not implement anything yet.** Combine their findings into one concise summary.

Five parallel agents finish in ~3 minutes what takes 15 serially, and the main thread carries only the summary. When research returns, don't say "build" immediately - first scope what v1 needs versus excludes. Later layer: git worktrees for parallel feature builds.

## Verification before "done"
- Agent runs the project's declared checks that apply (tests, lint, typecheck, build) and reports results; do not invent unavailable commands.
- Verify the actual product behavior: CLI invocation, library test, document review, or browser flow as applicable. For risky web flows, include second-account access-control and integration replay checks.
- Completion = four separate jobs (see SKILL.md), scaled to risk.

## Git flow
Push at every phase boundary. Per feature: push to `development` → PR → AI code review → fix → merge to `main`. "Review of AI output isn't optional. It's the step that keeps you in control" - AI code creates roughly 1.7x more problems per reported studies. The review contract: findings come back grouped by severity (critical / important / minor) and the reviewer **never auto-fixes** - so you stay in control; the human then says "resolve issues 1, 2, 3". Local pre-push review also works. Apply review suggestions directly, or hand the finding to the agent with "investigate first without modifying anything, confirm, then fix".

Per-finding triage: is this real? is it relevant? does it need fixing now? "Not every finding gets fixed the moment it appears. Some get a note I will keep and fix later. But what you never want to do is silently ignore it." Re-scan after every major feature, always after commit+push. Feed confirmed findings back into the spec text so specs stay precise.

Commit hygiene and cutover follow the project's native permission policy and runbook. Do not copy deploy commands, environment values or library configuration into session memory, architecture or task completions.

## Analytics-informed planning
Wire product analytics into the app early (one-command SDK install + a few core events) so later build decisions come from usage, not guesses: check what users actually click before speccing the next phase. Feed findings back into build-plan.md as new numbered features - the same append-only rule as any discovered gap applies.

## Prompt style
Keep prompts short. "Notice just how short that prompt is. No stack explanation, no folder structure, no UI rules - because the agent already has all of that from the context files." When stuck, point at the right source explicitly: "check the Liveblocks best practices and fix the drag-and-drop flow", "analyze and provide your reasoning, don't fix it immediately" (analysis clutters context less than edits).

## Model choice
With the context files in place, a cheaper/faster model suffices for implementation - "it doesn't have to do the thinking, it just has to write code". Reserve the top model for architecture and review. The system is tool-agnostic: switch between Claude Code / Codex / Copilot freely; one tool can review and fix code another wrote.


## v2 additions to the loop
- **Orient** via index + memory + `ctx brief`; never scan the repo.
- **Context-diff** before closing a unit: `ctx impact` (✗ pages updated or confirmed + stamped; UNCOVERED files get a page or a `covers` entry).
- **Close** with `ctx index` → `ctx lint` → `ctx log build "<unit>"` → memory.md.
- **Questions** are answered from the wiki (QUERY) and reusable answers are filed back as pages.
- Playbooks for every operation: `operations.md`. Page spec: `page-format.md`.
