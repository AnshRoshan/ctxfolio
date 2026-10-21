# Actual cold-start evidence protocol

Routing evaluation is not an answer-quality experiment. Run this protocol only after the parent integrates and refreshes the installed CLI/wiki. Feature 19 stays experiment-pending until the actual records exist.

1. Freeze the integrated revision and the bytes/hash of `context/evals/questions.json`. Do not alter questions, expected owners or rubrics after seeing answers. Record dirty paths or use a clean revision.
2. Run `node context/ctx.mjs eval --fixture context/evals/questions.json --k 8 --json` and retain its deterministic routing report. Its character/4 estimates are not measured host tokens or savings.
3. Run `node context/ctx.mjs evalpack --fixture context/evals/questions.json --json` and save the output outside the authored wiki. The output is an unfilled evidence template, not a score.
4. Start a genuinely fresh read-only reader session with only the packet reader instruction and ten frozen questions. Give it no parent transcript, previous answers or graded results. The reader follows AGENTS.md, consults the wiki, verifies sources when warranted and records answers/citations/files opened. Capture session/model identity and available host usage. Missing usage stays null.
5. A separate human or fresh evaluator grades each actual answer as correct, partial, wrong or not-found against the frozen rubric and source owners. Do not treat citation presence or routing hit@k as correctness. Attach notes for failures, preserve disagreements and record grader identity.
6. Fill only observed packet fields. Correct count is the number actually graded correct, denominator is frozen questions length. Cost/time/tokens need captured host evidence; unknowns remain null. No claimed improvement or savings without a matched baseline experiment under the same questions/model/conditions.
7. Parent records actual artifacts and grade provenance in the testing owner. Fix the wiki failures in the single final consolidated fix pass. Rewrite public claims only to observed findings; do not turn protocol targets into achieved scores.

The fixture selects real owner questions, not fixed current counts or feature-state answers. Re-read current tracker/memory after integration. If the parent has an independently prepared question pack, convert it to the validated fixture schema before freezing and retain the provenance of that substitution.
