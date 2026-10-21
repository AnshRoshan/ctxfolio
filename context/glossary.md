---
title: Glossary
type: glossary
status: active
summary: The skill's own vocabulary — one meaning per term across code, templates and docs
tags: [terminology, domain]
updated: 2026-10-21
confidence: unverified
---

# Glossary

## TL;DR

- 2026-10-21 provenance review: legacy checkpoint `080a7adb7826` (recorded 2026-10-06) is explicitly unverified; no declared verifier or validity interval is established. Authored records are retained, not reverified. Source: authored terminology and code-name pointers below.
One meaning per term. These words appear in the CLI, the templates and the references — they must stay consistent across all three, or scaffolded projects inherit ambiguity.

| Term | Meaning in this project | Not to be confused with | Code name |
|---|---|---|---|
| Unit | one feature of work = one spec = one branch = one owner | task (todo app sense) | `Feature NN` in the ledger |
| Ledger | the task state machine inside progress-tracker.md | git ledger | `commands.task` |
| Hot files | the always-read set (index, memory, tracker window) | frequently edited files | `alwaysRead`, `archiveAfterDays` |
| Profile | detected project shape: langs/kinds/signals | user profile | `detect()` |
| Page | a frontmatter'd markdown file under context/ | web page | `pages()` |
| Rule (path-gated) | a thin `.claude/rules/*.md` pointer that loads pages for matching paths | lint rule | `commands.rules` |
| Danger zone | a directory whose landmines earn a nested AGENTS.md | hazardous code | `--danger` |
| Scaffold | what setup/init WRITES into a project | boilerplate repos | `INIT_MAP` |
| Ship | copy from this repo into a tool home / project | publish to npm | `SHIP`, `copyTree` |
| Contract | the test suite pinning CLI behavior | — | `emit({command, ok})` |
