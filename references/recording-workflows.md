# Recording Workflows - templates and timing

The root cause of project decay: "no plan the agent remembers, no record of the decisions, nothing making it build with what already exists instead of just piling more." These templates are the cure. Write at the moment of the event, never batch it to the end.

Read-only scope overrides every recording obligation here: return proposed entries without writing pages, logs, stamps, or memory.

Configured Claude hooks provide reminders and limited working-tree checks (see safety-permissions.md), not a guarantee that all recording occurred or claims are true. Stop has a second-pass escape; explicit verification and wiki review still determine completion. Custom compaction instruction goes in the instruction files: "When compacting, always preserve the full list of modified files, the current unit, test/build commands, and open questions."

## 1. Decision record (context/decisions.md)

```markdown
## D-07: Realtime transport - 2026-09-29
Trigger: two-tab collaborative editing must stay in sync without a custom websocket layer
Options considered: raw websockets / Liveblocks / Ably
Chosen: Liveblocks - presence + threads + webhooks in one dependency
Lost alternative: raw websockets - we would own scaling, reconnects, and presence typing
Cost paid: new SaaS moving part + per-room pricing; vendor lock on presence semantics
Reversibility: painful - transport abstraction would need writing first
Correctness policy: cursor presence may lag 200ms; document state may not lag at all
```

Rules: options and the honest losing alternative are mandatory ("the one who gets hired says why they would pick one over the other and what it costs"). Cost always named in one of: new moving part / single point of failure, per-request latency tax, tolerated incorrectness, money. Reversibility stated, because "going back is its own painful migration".

## 2. Flagged assumption (decisions owner; feature/task pointers)

Taken when building under pressure with an undecided value source:

```markdown
FLAGGED: order total uses the cached price, not the price at checkout time.
Assumed acceptable to ship Feature 12. Nobody has decided this. Needs a real call.
```

Write the full assumption once as F-NN in decisions.md. The feature and task reference that entry; neither repeats its undecided value or rationale.

## 3. Shared issue entry (context/issues.md)

Sanitize summaries before recording. Raw local diagnostics belong in ignored context/issues.local.md; preserve legacy context/current-issues.md as private scratch, never copy it automatically.

```markdown
## Issue 3 - pending verification
Symptom: after 100% zoom, header still says "profile needs attention"
Suspected file: src/components/Header.tsx
Fix direction: completion % is derived, not stored; the label condition reads stale state
Definition of success: at 100% the header shows "complete"; no other label changes; build passes
```

Statuses: `open` → `analyzing` → `approved` → `fixing` → `pending verification` → `resolved`.

Use the bug-investigation procedure in the project's workflow-rules.md. Keep reproduction/verification evidence with the issue or its linked testing section; do not maintain a second issue list in memory or architecture.

## 4. Session handoff (memory.md)

```markdown
# Memory
_Last updated: 2026-09-29, end of session 4_

## Current state
Paused at the next acceptance check in context/feature-specs/02-auth.md.
Task state: context/progress-tracker.md. Verification evidence: context/testing.md#verification.

## Next step
Run the second-account session-isolation check from the spec before continuing implementation.

## Open questions (carried forward, unresolved)
- Resolve F-05 at context/decisions.md before expanding the public-search flow.
- Resume question: which test account should exercise this check?
```

Write the resume cursor when authorized. Keep direct questions needed to resume and pointers to issues/assumptions already owned elsewhere; do not copy their full records, current configuration or completed-task history.

## 5. Changelog / PR description
Generated from the **actual diff**, not from the agent's memory of what it thinks it changed. Per feature or phase: what changed, why, files touched, how it was verified, what is still open.

## 6. Sync pass checklist
Run at phase boundaries, before handing off to another agent or human, or when docs and code seem to disagree:
- [ ] Re-read each context file against what the repo actually shows now.
- [ ] Code disagrees with a doc → flag the conflict for the human; never silently overwrite docs or code.
- [ ] Preserve human-written edits; only fill gaps and remove lines no longer true.
- [ ] Verify progress-tracker states are mutually exclusive (reviewers have caught features listed as both current and complete).
- [ ] Verify meaningful technical choices link their D-NN records; manifests/library notes own current dependency facts, not a duplicated stack inventory in decisions.
- [ ] Shared issues.md retains sanitized unresolved issues; issues.local.md and legacy current-issues.md remain ignored and never auto-promoted.
- [ ] Keep shared behavioral policy in AGENTS.md; link technical choices at their decision owner even when frequently used.
- [ ] Confirm every context file's claims are still checkable (paths exist, commands run).

"So the context you read in month three still describes the app you actually have."

## 7. In-app agent logging (agents that run autonomously)
When the product itself calls an agent, log its paper trail in the database, not just the console:
- `agent_runs` - one row per run: inputs, items found, start/complete times, status.
- `agent_logs` - one row per step: level (info/success/warning/error), message, timestamps.

Errors get diagnosed from these tables. "A job you dropped in a queue and never checked on is a job that you're quietly not doing."

## 8. Registry hygiene (UI)
Before building a component: check `ui-registry.md` for a similar one. Match its exact classes if found. Otherwise build to ui-rules + ui-tokens, then append it to the registry with its file path and variant list. The registry is what stops the fifth card component from existing.
