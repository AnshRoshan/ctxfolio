# Prompt Craft — ASD-STE100 discipline for internal prompts

The `ctxfolio` produces prompts: specs an agent implements, subagent briefs, clarify questions, Lessons lines, page TL;DRs. A misread spec is a wrong feature. So every instruction this system writes follows **ASD-STE100** (Simplified Technical English — the aerospace documentation standard, issue 100) adapted for LLM readers: the standard exists because ambiguity kills; in prompts, ambiguity ships bugs.

## The rules (apply to "What to build", briefs, checklists, questions)

| Rule | Bad | Good |
|---|---|---|
| One action per sentence, imperative | "The user can upload a file and it should be parsed and stored." | "Accept one .csv file. Parse it with the rules in data-model.md. Store rows in `uploads`." |
| One word, one meaning — never synonym-drift | "module / unit / component / piece" for the same thing | Pick the glossary term and use it everywhere (see `glossary.md`) |
| Name the actor explicitly | "The data is validated then saved." | "The API validates the payload. The API saves the row." |
| Short sentences (~max 20 words); split compound conditions | "If the user is signed in and the plan allows it and the file is small, allow upload." | "Allow the upload only when all three are true: the user is signed in; the plan allows uploads; the file is ≤ 5 MB." |
| State the result, not the negation | "Don't make it slow or broken." | "The list renders in under 200 ms for 1,000 rows." |
| Numbers and units exact | "a few retries", "small file" | "3 retries, 2 s apart", "≤ 5 MB" |
| Logical order = execution order | describing test, then build, then deploy | build → run → verify → deploy |
| Definitions live in the glossary | inventing "widget" mid-spec | term appears in `glossary.md` first, or ask |

## Where each rule lands

- **Feature specs** (`feature-specs/NN-*.md`): "What to build" is a procedure — imperative, one action per sentence, acceptance checks phrased as observable results.
- **Subagent briefs**: one job, one dome condition, a 5-line report — never two unrelated asks in one brief.
- **Clarify gate**: one question per message, answerable yes/no or with one concrete value.
- **Lessons / TL;DRs**: "When X, do Y." — condition first, action second, ≤ 20 words.
- **Pages**: contracts and invariants in declarative present tense ("The endpoint returns 401 when…"), not prose.

## Scope discipline

Apply the style to NEW and EDITED text only. Do not mass-rewrite existing pages or specs into STE — content correctness beats style, and churn burns review attention. The lint/page rules stay silent on this; it is a writing habit, judged at review.

## Why it works on models, not just humans

STE100 removes the classes of ambiguity LLMs resolve by guessing: synonym drift (pulls the wrong concept), hidden actors (wrong owner for the action), compound conditions (partial satisfaction), and vague quantifiers (invented thresholds). Every guess the text prevents is a decision that stays with the human — Law 4.
