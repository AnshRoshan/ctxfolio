# Evals — proving the wiki works

"Looks thorough" is not a test. A wiki is good if a **cold agent** (fresh session, no chat history, wiki only) answers real questions correctly, cheaply.

## Cold-start test (run after ADOPT, at each phase boundary, and whenever agents seem lost)

1. Write 10 questions a new teammate would ask, from easy to nasty. Mix:
   - Where is X? (3) · How does Y flow end to end? (2) · What must never change in Z? (2) · Why was W chosen? (1) · What's next / what's in progress? (1) · What is explicitly out of scope? (1)
2. Fresh session. Give it only: *"Read AGENTS.md, then answer using the context wiki. This is read-only: do not update pages, logs, stamps, or memory. Check source files when a page is missing, stale, inferred/unverified, or lacks confidence/evidence. Cite each answer and distinguish observed behavior from approved intent and unknowns."*
3. A human (or separate reviewer agent with the code) grades each: **correct / partially / wrong / not-found**, and notes tokens used and files opened.
4. Triage failures into the *wiki fix*, not an agent scolding:
   - not-found → missing page or poor tags/summary → add page / fix routing
   - wrong → stale or low-confidence page → fix, `ctx stamp`
   - correct but slow (many files opened) → TL;DR too weak or route missing → improve
5. Record the score in `ctx log lint "cold-start 8/10, 14k tokens"`. Keep the question set in `context/testing.md` (or `context/archive/evals.md`) and reuse it.

Targets: ≥ 8/10 correct, ≤ 15k tokens, ≤ 2 source files opened on average. Do not skip necessary source verification to hit the token/file target. The evaluator files fixes and scores only when writes are authorized.

## Task-start benchmark
Pick a recent real task. Measure tokens + files read from "start" to "first edit" with and without the wiki. A healthy wiki cuts this by more than half and removes wrong-file edits.

## Continuous signals (cheap, from the CLI)
| Signal | Command | Healthy |
|---|---|---|
| Stale pages | `ctx stale` | 0 at merge time |
| Code with no page | `ctx coverage` | ≥ 80% (core areas 100%) |
| Orphans / broken links / placeholders | `ctx lint` | 0 errors |
| Orient cost | `ctx status` | ≤ 5k tokens |
| Unverified claims | grep `confidence: (inferred|unverified)` | trending down |
| Decision coverage | each major library has a D-NN | yes |

## Regression guard
Add `node context/ctx.mjs lint` to CI (`--strict` for stale/placeholder failures once the wiki is mature) and the optional pre-commit hook (`assets/pre-commit.template`). Treat a failing lint like a failing test.

## Skill self-test
After editing this skill: run `ctx init` in a scratch git repo, create a module page, change covered code, commit, and confirm `ctx stale`, `ctx impact`, `ctx brief <file>` and `ctx hook stop` behave as documented. Test the tooling like code.
