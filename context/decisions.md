---
title: Decisions Log
type: decision-log
status: active
summary: Every hard technical decision with options, lost alternative, cost and reversibility; plus flagged assumptions
tags: [decisions,adr,tradeoffs]
updated: 2026-10-14
verified_at: 47d649bcfa8c
---

# Decisions Log

## TL;DR

- D-01–D-05 retain the baseline policies. D-06 records the user's single-source ownership requirement and the portable adapter tradeoff.
- Reversibility: D-01/D-03/D-04 are painful-to-easy policy anchors — changing one needs a new D entry that supersedes it, not an edit.

One entry per hard technical decision, written the moment it is made. Not buried in code, not lost in chat — written down where the human can see it and overrule it.

Current working policy lives in AGENTS.md; system structure lives in architecture.md. Entries below record rationale and dated decisions, not a parallel settings/architecture file.

## Decision record format

```markdown
## D-NN: <title> — <date>
Trigger: what forced this decision
Options considered: A / B / C
Chosen: <option>, because <reason>
Lost alternative: <option>, honest reason it lost
Cost paid: new moving part / per-request latency / tolerated incorrectness / money
Reversibility: easy | painful (what a rollback costs)
Correctness policy: what is now ALLOWED to be slightly wrong (and what never is)
```

---

---

## FLAGGED assumptions (undecided shortcuts, visible until decided)

```markdown
## F-NN: <assumption> — <date> (attached to Feature NN)
We built assuming <X>. Nobody has decided this. Needs a real call.
```

---

## D-01: Zero-dependency single-file CLI — 2026-10-06

Trigger: the CLI is copied into every user's repo and run on unknown machines; every dep is a future supply-chain, install and rot problem.
Options considered: single file, node builtins only / small npm package (commander, fast-glob, gray-matter) / hybrid (deps optional).
Chosen: single file, builtins only, because it must survive being copied into any repo on any OS with no install step — and the glob/frontmatter parsers it needs are ~80 lines.
Lost alternative: npm package — honest reason: `init` copies the tool into `context/` by design (the project must carry its own tooling), and a copied node_modules or a package that expects `node_modules` is exactly the fragility we're avoiding.
Cost paid: hand-rolled glob + frontmatter parsers (test-covered), no ecosystem niceties, ~800-line file instead of ~300.
Reversibility: painful — every user's context/ctx.mjs assumes self-containment.
Correctness policy: glob matching may miss exotic patterns (users can fix `covers:` by hand); file walking and git parsing must never be wrong.

## D-02: Delegate code intelligence, keep the wiki authoritative — 2026-10-06

Trigger: hand-building repo maps/module pages re-derives what graphify/ctags/aider/dependency-cruiser already index better.
Options considered: keep doing it by hand / require external tools / detect tools, distill their output, keep ctx as the bookkeeper.
Chosen: detect (`ctx tools`), delegate the structural pass where available, wiki stores only distilled results; manual subagent procedure remains the fallback.
Lost alternative: hard dependency on graphify — honest reason: it isn't everywhere, and the skill must degrade gracefully to zero-tool environments.
Cost paid: one more reference doc + probe code; output quality now depends on tools we don't own (mitigated by `confidence: inferred` + staleness policing).
Reversibility: easy — probes and doc only; no schema change.
Correctness policy: distilled tool output may be slightly wrong until verified (inferred); covers-globs and staleness checks must never lie.

## D-03: Everything project-relative — 2026-10-06

Trigger: absolute paths (`C:\Users\…`) in committed context break every other machine and make docs painful to port; user rule: "always use relative paths".
Options considered: allow absolute paths with lint silence / document the convention only / convention + CLI messages + lint check + test.
Chosen: all three layers — relative is the only shape the tool emits, warns on, and tests against.
Lost alternative: absolute-with-rewrite — honest reason: rewriting paths on read is a class of bugs worse than a rule nobody can violate.
Cost paid: one heuristic lint WARN that can't tell a quoted example from a real path (accepted: warnings are cheap).
Reversibility: painful — it's a user-facing contract now.
Correctness policy: the lint heuristic may miss exotic absolute forms; the CLI itself must never EMIT one.

## D-04: Three-boundary no-leak model (dev repo / installed skill / scaffolded project) — 2026-10-06

Trigger: skill dev history (version chatter, CHANGELOG, lineage notes) must not appear in users' repos or installs.
Options considered: one repo, careful copying / separate docs repo / single repo + explicit SHIP list + boundary tests.
Chosen: single repo, `ctx install` ships only SKILL.md+references+assets+scripts, project copies get a neutral CLI header — and a test guards each boundary so it can't rot.
Lost alternative: separate repos — honest reason: two places to keep in sync, worse for the one-link install flow.
Cost paid: the SHIP list must be remembered when adding shippable files; three extra tests.
Reversibility: easy.
Correctness policy: README/CHANGELOG may lag a release by hours; shipped files must never carry dev history at all.

## D-05: ASD-STE100 discipline for emitted prompts — 2026-10-06

Trigger: specs, subagent briefs and clarify questions ARE prompts; misread instructions ship wrong features; the aerospace documentation standard (issue 100) demonstrably reduces LLM ambiguity-guessing.
Options considered: free prose specs / ad-hoc "be clear" advice / adopt STE100's concrete grammar rules as a reference + template wiring.
Chosen: references/prompt-craft.md (8 rules with bad/good examples), inline note in the feature-spec template, PLAN-step and workflow-rules pointers — because concrete, checkable writing rules change behavior where "be clear" does not.
Lost alternative: lint-enforcing sentence length/imperative mood — honest reason: style linting markdown prose produces noise and churn; scope rule says new/edited text only, judged at review.
Cost paid: one more reference to read when writing specs; writers spend a few more seconds per sentence.
Reversibility: easy — it is a reference + two template lines.
Correctness policy: existing pages may keep legacy prose; new specs and briefs must follow the rules; a stylistic miss is not a defect.

## D-06: Canonical resource bodies and portable host adapters — 2026-10-14

Trigger: the human asked for shared internal agent resources and unambiguous file separation to avoid independently edited copies drifting.
Options considered: copied native instruction trees / whole-directory symbolic links / canonical .agents resources with thin native adapters.
Chosen: one editable body per resource in .agents; host-native adapters link to it and contain only derived discovery metadata. A project ownership contract routes memory, decisions, architecture, policy and specialized facts to separate homes.
Lost alternative: whole-directory links — native settings and rule formats differ; aliasing entire .claude/.cursor trees mixes incompatible formats and can overwrite host configuration. Independent copies violate the user's requirement.
Cost paid: native metadata is a generated cache that must be refreshed and checked; legacy/user-edited adapters require an explicit preservation-first migration or manual merge.
Reversibility: easy — canonical bodies are plain markdown; adapters can be regenerated without changing their instructions.
Correctness policy: canonical instruction content is never silently copied or merged; broken/stale adapters fail checks. Exact prose duplication checks are heuristic, not proof of semantic uniqueness. Host loader behavior requires verification in that host.

## D-07: Real relative resource aliases — 2026-10-14

Trigger: the human explicitly clarified that native files/folders must be filesystem symlinks, not ordinary discovery-pointer copies; Windows Developer Mode was enabled to permit creation.
Options considered: retain regular pointer files / alias whole native configuration trees / real relative aliases for compatible entrypoints/resources with one central Cursor view directory.
Chosen: real file and directory symlinks, with repository-local Git core.symlinks enabled. This supersedes the transport portion of D-06; canonical ownership and separate native settings remain unchanged.
Lost alternative: whole configuration-tree aliases — incompatible formats/private settings must not share one directory. Junctions or copied files would misrepresent Git-compatible symbolic-link behavior.
Cost paid: Windows creation permission and explicit migration preflight are required; incompatible Cursor metadata is a generated view. Validation snapshots, expected staged contents and final mode commit protect failures and concurrent edits.
Reversibility: easy to inspect and regenerate; a reverse migration is deliberate, never an implicit --portable-pointers overwrite of linked sources.
Correctness policy: links must be real, relative and resolve the intended owner. Custom/concurrently changed content is preserved; rollback refuses occupied destinations and reports recovery paths. Existing valid aliases do not require new-link permission.
