---
title: Decisions Log
type: decision-log
status: active
summary: Every hard technical decision with options, lost alternative, cost and reversibility; plus flagged assumptions
tags: [decisions,adr,tradeoffs]
updated: 2026-10-20
verified_at: 47d649bcfa8c
---

# Decisions Log

## TL;DR

- D-01–D-05 retain the baseline policies. D-06 records the user's single-source ownership requirement and the portable adapter tradeoff.
- D-07 supersedes the transport part of D-06 with real relative aliases. D-08 orders the Phase 4 spec queue with provenance before capture; D-09 keeps evals deterministic and zero-dependency; D-10 requires a measurement source for every committed number. D-11 records the two version tracks; D-12 fixes human-facing dates to the local calendar day. F-01 flags the appended Wave 0 numbering.
- Reversibility: D-01/D-03/D-04 are painful-to-easy policy anchors — changing one needs a new D entry that supersedes it, not an edit.

One entry per hard technical decision, written the moment it is made. Not buried in code, not lost in chat — written down where the human can see it and overrule it.

Current working policy lives in AGENTS.md; system structure lives in architecture.md. Entries below record rationale and dated decisions, not a parallel settings/architecture file.

## Record format

Decisions use `## D-NN: <title> — <date>` and all seven fields shown in D-11. Undecided assumptions use `## F-NN: <title> — <date> (attached to Feature NN)` and name the pending human choice, as in F-01.

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

## D-08: Audit findings become an ordered spec list, security before capture — 2026-10-20

Trigger: the 2026-10-20 audit produced roughly two dozen gaps at once, and the human asked for a speclist to work through smallest-first, fixing security first where it exists.
Options considered: one large "make it best" rebuild / priority tiers with unordered numbers / a single numbered execution queue where the next free number is always the next unit to start.
Chosen: the numbered execution queue in `build-plan.md` Phase 4, waves ordered by size and dependency, with the hard rule that provenance and injection-quarantine work (14-16) lands before governed auto-capture (21).
Lost alternative: tiers-without-order — honest reason: tiers let an agent pick the interesting feature; the human's rule was smallest-first, and capture built on an unverified substrate would multiply the exact stale-claim failure this audit found in our own repo.
Cost paid: the list must be renumbered when a unit is reordered; work that looks more exciting waits behind housekeeping; 22 roadmap rows to keep honest.
Reversibility: easy — reorder or renumber before each unit starts; a shipped feature cannot be un-numbered.
Correctness policy: the ordering may be revised as evidence arrives; the invariant that never bends is "no passive capture before provenance and quarantine exist".

## D-09: Evals measure deterministic routing, not LLM-judged answers — 2026-10-20

Trigger: `references/evals.md` prescribes a cold-start test nobody has run, and the audit found retrieval returning completed history ahead of current guidance. The CLI must keep its zero-dependency contract (D-01), so it cannot call a model.
Options considered: human-run cold-start protocol only / a scoring script that shells out to an LLM judge / a frozen `question → expected pages` set scored by `ctx brief` for hit@k, precision, token cost and blind spots, plus the human protocol kept as a separate ritual.
Chosen: the deterministic routing harness as the CI-gated artifact, with the human cold-start protocol retained for answer quality where the CLI cannot judge prose.
Lost alternative: LLM-as-judge in the CLI — honest reason: it adds a network dependency, a cost line and nondeterministic CI to a bookkeeping tool, and it measures the model rather than the wiki.
Cost paid: the expected-pages set must be maintained as the wiki evolves, and a page can be retrieved yet still be wrong — that residual needs the human protocol.
Reversibility: easy — the eval set is data; a judge layer can be added later without changing the router.
Correctness policy: routing metrics may be imperfect proxies for usefulness; the claim "the wiki cut orientation cost and returned the right pages" must be backed by measured numbers, never by lint passing.

## D-10: Numbers in a committed page carry their measurement source — 2026-10-20

Trigger: the audit found four stale claims while every local check reported green, so any number quoted in a roadmap must name where it was measured.
Options considered: cite findings freely / re-verify each number when writing specs / require a Value-sources table on every Phase 4 spec.
Chosen: the Value-sources table is mandatory per spec, with the command or run identifier that produced each figure (Feature 08 proves the shape).
Lost alternative: free citation — honest reason: unattributed numbers are how the "72 cases" claim survived in the first place.
Cost paid: each spec gains one small table; re-measuring before quoting costs a minute.
Reversibility: easy.
Correctness policy: prose may summarize; a number in a committed page without a source line is a defect.

## D-11: Two version tracks, one release mapping — 2026-10-21

Trigger: the 2026-10-21 audit found the always-green spec required `SKILL.md`, `package.json`, `plugin.json`, the CHANGELOG and the newest tag to agree on one identity, while the repo intentionally ships skill/CLI 2.7.0 and package/plugin 3.7.0, and `marketplace.json` also carries 3.7.0.
Options considered: force one version everywhere / keep two tracks with no check / keep two tracks and check each track plus the mapping and tag.
Chosen: keep two tracks. The skill/CLI track is `SKILL.md`, `scripts/ctx.mjs` `VERSION` and the CHANGELOG heading; the package/plugin track is `package.json`, `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`; the git tag follows the skill track; a documented mapping connects them (currently 2.7.0 ↔ 3.7.0). `ctx --version` reports the skill track.
Lost alternative: one identity — honest reason: it would force a needless major bump on the skill or the package and break existing installs that key off the 2.x skill line.
Cost paid: one extra mapping table and a slightly longer release check; readers must know which track a number belongs to.
Reversibility: easy — the mapping is documentation plus a test; collapsing the tracks later is a deliberate release decision.
Correctness policy: each track may move independently; a release is valid only when each track is internally consistent, the mapping is current, and the tag matches the skill track. No check may assert a single number for both tracks.

## D-12: Human-facing dates use the local calendar day — 2026-10-21

Trigger: `today()` used `new Date().toISOString().slice(0, 10)`, so at 00:57 IST on 2026-10-21 it wrote 2026-10-20. Pages, the log and the tracker are read by humans in their local day, and `ctx log` did not bump `updated` at all.
Options considered: keep UTC everywhere / use the local calendar day for pages and logs / store UTC timestamps and render local dates.
Chosen: use the local calendar day for every human-facing `updated`, log heading, tracker date and archive cutoff. Keep ISO timestamps only if a future machine-readable field needs them.
Lost alternative: UTC everywhere — honest reason: it makes "today" disagree with the human's calendar for the first hours of every day in Asia, and the wiki is a human-facing artifact.
Cost paid: tests must freeze `TZ` and inject a clock; a user who travels can see the date move.
Reversibility: easy — one helper plus tests.
Correctness policy: a date may be one day off only if the local clock is wrong; machine timestamps remain precise. `ctx log` must also bump `updated`, so the page date and the newest entry never disagree.

## D-13: Validate on a remote candidate branch before publishing — 2026-10-21

Trigger: Feature 08 forbids a push before cross-platform green, but this Windows host has no macOS runner; remote CI requires candidate publication.
Options considered: leave Feature 08 pending / push main without proof / publish a temporary CI branch and update main only after all candidate checks pass.
Chosen: the human approved a temporary CI-validation branch, followed by main and v2.7.0 publication only after all cross-platform checks are green. Existing uncommitted Wave 0 work is preserved in the reviewed candidate history.
Lost alternative: local-only changes — they cannot prove the macOS fixes or satisfy the main-green gate before Feature 09.
Cost paid: one remote candidate branch and additional CI runs. Release-candidate checks validate both tracks without pretending an unpublished tag already exists; actual release checks require the tag.
Reversibility: easy — the candidate does not change main until verified; rollback remains a new commit rather than rewriting user history.
Correctness policy: never report cross-platform success from local simulations; main and release publication wait for successful candidate checks. This narrowly supersedes Feature 08's no-push rule, not its no-unverified-main rule.

## F-01: Appended Wave 0 IDs vs execution order — 2026-10-21 (attached to Features 30-34)

We appended Features 30-34 instead of renumbering 08-29, and made the wave table authoritative while the numbers stay stable. Nobody has decided whether stable IDs or "next number = next unit" is the long-term rule. Until decided, Wave 0 runs first and no later wave starts while an earlier wave is red. If the human prefers strict execution numbers, renumber 08-34 once, before any Wave 0 unit starts.
