---
title: Crash-safe writes
type: feature
status: complete
summary: Make every core wiki write atomic, serialize concurrent agents with an advisory lock, and make archive idempotent so a crash cannot duplicate history
tags: [crash-safety, concurrency, archive, reliability]
covers: [scripts/ctx.mjs, tests/run.mjs]
related: [../build-plan.md, ../decisions.md, ./30-page-contract-integrity.md, ./32-install-transaction.md]
updated: 2026-10-21
verified_at: 6a2c96252924
---

# Crash-safe Writes

## TL;DR

- Goal: a process kill during `index`, `log`, `task`, `stamp`, `new`, `rules` or `archive` leaves either the old file or the complete new file, never a truncated ledger; two agents cannot lose each other's updates; rerunning `archive` after a crash never duplicates entries.
- Boundary: a single write primitive, one advisory lock, and the core wiki-mutating commands. `setup`/`install` transactions belong to Feature 32; symlink publication already has staging and rollback.
- Measurable: writes go through temp file + fsync + rename; every multi-file command holds a lock; archive appends only entries not already archived; full suite stays green, including an interrupted-archive replay test.

## Why now

The 2026-10-21 audit found 29 direct `writeFileSync`/`appendFileSync` calls in `scripts/ctx.mjs`. The symlink transaction is robust, but index, log, task, stamp, new, rules and archive write in place. `ctx archive` appends to `context/archive/*.md` and only then rewrites `log.md`/`progress-tracker.md`; a crash between those writes duplicates entries on the retry. Two agents running `ctx task` or `ctx log` at the same time can read the same source and overwrite each other. A green suite does not exercise process death or concurrency.

## What to build

1. Add `atomicWrite(file, data)`: write to a unique temp file in the same directory with `flag: 'wx'`, fsync it, rename over the destination, and remove the temp file on failure. Preserve the existing file mode when replacing a file.
2. Add `appendAtomic(file, text)` as read + `atomicWrite` for append-only files, so `ctx log` cannot leave a half-written entry.
3. Add `withLock(fn)`: a cross-process advisory lock keyed by the real project root. Use `open(..., 'wx')`, bounded retries, stale-lock recovery, and always remove it in `finally`. Re-enter without deadlock when a command calls another locked command in the same process (for example `archive` calling `index`).
4. Wrap the read-modify-write core commands in the lock: `task`, `log`, `stamp`, `archive`, `index` and `new`. Readers such as `rules`, `brief` and `stale` stay lock-free.
5. Replace in-place writes in those commands with `atomicWrite`/`appendAtomic`. Leave setup/install and the symlink staging writes to Feature 32/07.
6. Make `archive` replay-safe: after writing the archive file, rewrite the source; on retry, parse the archive and append only entries/lines whose exact text is not already present. Use the same rule for log entries and tracker completion lines.
7. Add a test that seeds an archive with the entries a prior crashed run would have written, reruns `ctx archive`, and asserts the archive has no duplicates and the source is cleaned.
8. Add a test that runs two `ctx log` writes concurrently and asserts both entries survive; if the harness cannot overlap subprocesses reliably, test the lock's stale-recovery and reentrancy paths directly instead.

## Explicitly NOT in this spec

- Do not redesign `setup`/`install` into stage+backup+swap or validate `SKILL.md` names. That is Feature 32.
- Do not change symlink staging/rollback; it already has a transaction.
- Do not fix `ctx log`'s missing `updated` bump or the malformed archive message; Feature 10 owns those.
- Do not add a dependency, database, daemon or network lock.
- Do not make every `lint`/`brief` read take a lock; readers stay lock-free.

## Clarifications

- "Atomic" means a reader sees the old bytes or the new bytes, not a partial file. It does not promise durability across a power loss beyond fsync of the temp file.
- The advisory lock prevents cooperating `ctx` processes from interleaving. Stale age alone never evicts a live or permission-protected PID; release verifies the ownership record before unlinking. It does not stop a human editor or provide an atomic compare-and-delete against a non-cooperating replacement.
- Lock path lives outside the wiki (git dir or OS temp), so it never appears in `git status` or the index catalog.
- Archive idempotency is by exact normalized block text; a legitimate edit to an archived entry is preserved and is not re-appended from the source.
- Feature 31 runs after 30 because 30 guarantees the page contract that archive and task operate on is read correctly.

## Value sources

| Value | Comes from |
|---|---|
| 29 direct write/append calls | `rg -n "writeFileSync|appendFileSync" scripts/ctx.mjs` on 2026-10-21 |
| archive appends before rewriting sources | `scripts/ctx.mjs` → `commands.archive`, read 2026-10-21 |
| symlink publication already stages + rolls back | `scripts/ctx.mjs` → `publishLinks`, read 2026-10-21 |
| 106 passed / 0 failed / 0 skipped baseline | `node tests/run.mjs` on Windows, 2026-10-21 (before Feature 31) |
| 109 passed / 0 failed / 0 skipped | `node tests/run.mjs` on Windows, 2026-10-21 (after Feature 31) |

## Verification checklist

- [x] `index`, `log`, `task`, `stamp`, `archive` and `new` write through `atomicWrite`/`appendAtomic`; no in-place write remains in those paths
- [x] No temp file is left behind after a successful command
- [x] A command that fails mid-write leaves the original file readable (held-lock failure leaves the log unchanged)
- [x] Stale-lock recovery is directly tested; reentrant locking is exercised by `archive` calling `index`
- [x] Rerunning `archive` with an already-seeded archive appends no duplicate log entry or tracker line
- [x] Lock file never appears in `git status` or `context/index.md`
- [x] `node tests/run.mjs` passes with the new cases and 0 failures (109 passed)
- [x] `node context/ctx.mjs lint --strict`, `stale --strict` and `doctor` are green (23 pages 0/0; 13/13)
- [x] `../progress-tracker.md`, `../../memory.md`, `../log.md` and `../index.md` reflect the unit
