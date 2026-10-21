#!/usr/bin/env node
/**
 * ctx self-test — zero dependencies, no framework, no network.
 *
 *   node tests/run.mjs          run every case
 *   node tests/run.mjs brief    run cases whose name contains "brief"
 *
 * Each case gets a throwaway git repo and drives the CLI exactly the way an
 * agent or CI would, then asserts on the real output. The point is to catch the
 * bugs that only appear once the tool meets a repository: paths that get
 * mangled, hooks that loop, lints that silently pass, scaffolding that no-ops.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CTX_SRC = path.join(HERE, '..', 'scripts', 'ctx.mjs');

let passed = 0;
let skipped = 0;
const failures = [];
const filter = process.argv[2] || '';

/* ----------------------------------------------------------------- helpers */
function sh(cmd, args, cwd, env = {}, input) {
  try {
    return { code: 0, out: execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 30000, env: { ...process.env, ...env }, input }) };
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') };
  }
}

/** A fresh git repo with a couple of source files. */
function sandbox() {
  // macOS temporary roots can be aliases; child cwd resolves to the physical path.
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-')));
  sh('git', ['init', '-q'], dir);
  sh('git', ['config', 'user.email', 't@example.com'], dir);
  sh('git', ['config', 'user.name', 'Test'], dir);
  fs.mkdirSync(path.join(dir, 'src', 'auth'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'src', 'billing'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'auth', 'session.ts'), 'export const login = () => "v1";\n');
  fs.writeFileSync(path.join(dir, 'src', 'billing', 'charge.ts'), 'export const charge = () => 1;\n');
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'demo', scripts: { dev: 'next dev' } }, null, 2));
  return dir;
}

/** Run ctx in a repo. Returns { code, out }. */
function ctx(dir, ...args) {
  return sh('node', [path.join(dir, 'context', 'ctx.mjs'), ...args], dir);
}

/** Run a ctx hook the way Claude Code does: JSON payload on stdin. */
function ctxHook(dir, which, payload) {
  return sh('node', [path.join(dir, 'context', 'ctx.mjs'), 'hook', which], dir, {}, JSON.stringify(payload));
}

function test(name, fn) {
  if (filter && !name.includes(filter)) return;
  let dir;
  try {
    dir = sandbox();
    fn(dir);
    passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    if (e.nativeSkip) {
      skipped++;
      console.log(` SKIP  ${name}: ${e.message}`);
      if (dir) fs.rmSync(dir, { recursive: true, force: true });
      return;
    }
    failures.push({ name, message: e.message });
    console.log(` FAIL  ${name}\n       ${String(e.message).split('\n').join('\n       ')}`);
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
    return;
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const assertContains = (haystack, needle, msg = '') =>
  assert(String(haystack).includes(needle), `${msg}\n--- expected to find ---\n${needle}\n--- in ---\n${String(haystack).slice(0, 2500)}`);

function initRepo(dir, extra = []) {
  const r = sh('node', [CTX_SRC, 'init', '--root', dir, '--portable-pointers', ...extra], dir);
  assert(r.code === 0, `init failed: ${r.out}`);
  // Fill the one placeholder-free page we need and commit, mirroring a real setup.
  return r;
}

function queueFixture(dir) {
  initRepo(dir);
  fs.writeFileSync(path.join(dir, 'context', 'build-plan.md'), `---
title: Build Plan
type: plan
status: active
summary: Fixture roadmap for the spec queue.
tags: [plan]
updated: 2026-10-21
---

# Build Plan

| # | Feature | Size | Build first because |
|---|---|---|---|
| 30 | Queue unit — the first fixture unit | S | fixture |
| 31 | Second unit — the second fixture unit | S | fixture |
`);
  fs.writeFileSync(path.join(dir, 'context', 'feature-specs', '30-queue-unit.md'), `---
title: Queue unit
type: feature
status: complete
summary: Fixture spec that satisfies the required Wave 0 section schema.
tags: [queue]
covers: []
related: []
updated: 2026-10-21
---

# Queue Unit

## TL;DR

- Goal: fixture.
- Boundary: fixture.

## What to build

1. Fixture.

## Explicitly NOT in this spec

- Nothing.

## Clarifications

- Fixture.

## Value sources

| Value | Comes from |
|---|---|
| fixture | tests/run.mjs |

## Verification checklist

- [x] fixture verified
`);
  const tr = path.join(dir, 'context', 'progress-tracker.md');
  fs.writeFileSync(tr, fs.readFileSync(tr, 'utf8').replace('## Completed\n', '## Completed\n- Feature 30: Queue unit — 2026-10-21 — fixture evidence\n'));
  const r = ctx(dir, 'index');
  assert(r.code === 0, `fixture index failed: ${r.out}`);
}

/* ------------------------------------------------------------------- cases */
console.log('\nctx self-test\n');

test('init scaffolds the documented tree and never overwrites', (dir) => {
  initRepo(dir);
  for (const f of ['AGENTS.md', 'CLAUDE.md', 'memory.md', 'context/index.md', 'context/log.md', 'context/decisions.md', 'context/ctx.mjs', '.claude/settings.json']) {
    assert(fs.existsSync(path.join(dir, f)), `${f} was not created`);
  }
  assert(fs.existsSync(path.join(dir, 'context', 'feature-specs')), 'feature-specs/ missing');
  assert(fs.existsSync(path.join(dir, 'context', 'codebase', 'modules')), 'codebase/modules/ missing');

  // Idempotence: a second init must not clobber human edits.
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), 'HAND EDITED\n');
  initRepo(dir);
  assert(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8') === 'HAND EDITED\n', 'init overwrote an existing file');
});

test('init refuses to no-op when the skill assets are absent', (dir) => {
  // The copy that init places in context/ has no assets/ beside it.
  initRepo(dir);
  const r = ctx(dir, 'init', '--root', path.join(dir, 'nested'));
  assert(r.code !== 0, 'init from the copied CLI should fail, not silently succeed');
  assertContains(r.out, 'assets', 'failure should explain what is missing');
});

test('dirty file paths are parsed intact (regression: porcelain trim)', (dir) => {
  initRepo(dir);
  fs.writeFileSync(path.join(dir, 'src', 'auth', 'session.ts'), 'export const login = () => "v2";\n');
  const r = ctx(dir, 'impact', '--json');
  const data = JSON.parse(r.out);
  // Compare exactly: a substring check would be fooled by "src/..." containing
  // the truncated "rc/..." — which is precisely the bug being guarded against.
  assert(data.uncovered.includes('src/auth/session.ts'), `impact mangled the changed path: ${JSON.stringify(data.uncovered)}`);
  assert(!data.uncovered.some((f) => f === 'rc/auth/session.ts'), 'leading status column was eaten by trimming');
});

test('a file with spaces in its name is still routed', (dir) => {
  initRepo(dir);
  fs.writeFileSync(path.join(dir, 'src', 'auth', 'my weird file.ts'), 'export const x = 1;\n');
  const data = JSON.parse(ctx(dir, 'impact', '--json').out);
  assert(data.uncovered.includes('src/auth/my weird file.ts'), `whitespace path was mangled: ${JSON.stringify(data.uncovered)}`);
});

test('impact flags a page whose covered code changed', (dir) => {
  initRepo(dir);
  ctx(dir, 'new', 'module', 'auth', '--covers', 'src/auth/**');
  ctx(dir, 'index');
  sh('git', ['add', '-A'], dir);
  sh('git', ['commit', '-qm', 'setup'], dir);

  fs.writeFileSync(path.join(dir, 'src', 'auth', 'session.ts'), 'export const login = () => "v2";\n');
  const r = ctx(dir, 'impact');
  assertContains(r.out, 'REVIEW', 'impact should mark the auth page for review');
  assertContains(r.out, 'context/codebase/modules/auth.md');
});

test('stale detects covered code changed after the page was written', (dir) => {
  initRepo(dir);
  ctx(dir, 'new', 'module', 'auth', '--covers', 'src/auth/**');
  ctx(dir, 'index');
  sh('git', ['add', '-A'], dir);
  sh('git', ['commit', '-qm', 'setup'], dir);

  fs.writeFileSync(path.join(dir, 'src', 'auth', 'session.ts'), 'export const login = () => "v2";\n');
  const r = ctx(dir, 'stale');
  assertContains(r.out, 'context/codebase/modules/auth.md', 'stale missed the changed module');
});

test('stamp clears staleness once the page is re-verified', (dir) => {
  initRepo(dir);
  ctx(dir, 'new', 'module', 'auth', '--covers', 'src/auth/**');
  ctx(dir, 'index');
  sh('git', ['add', '-A'], dir);
  sh('git', ['commit', '-qm', 'setup'], dir);
  fs.writeFileSync(path.join(dir, 'src', 'auth', 'session.ts'), 'export const login = () => "v2";\n');

  const before = ctx(dir, 'stale');
  assert(before.out.includes('modules/auth.md'), 'precondition: page should be stale');

  ctx(dir, 'stamp', 'context/codebase/modules/auth.md');
  sh('git', ['add', '-A'], dir);
  sh('git', ['commit', '-qm', 'restamp'], dir);
  const after = ctx(dir, 'stale');
  assert(!after.out.includes('modules/auth.md'), `stamp should clear staleness, got:\n${after.out}`);
});

test('brief routes by covers and reports the token cost', (dir) => {
  initRepo(dir);
  ctx(dir, 'new', 'module', 'auth', '--covers', 'src/auth/**');
  const r = ctx(dir, 'brief', 'src/auth/session.ts');
  assertContains(r.out, 'modules/auth.md', 'brief did not match the covering page');
  assertContains(r.out, 'tokens');
});

test('brief warns when the file you are about to touch has no page', (dir) => {
  initRepo(dir);
  const r = ctx(dir, 'brief', 'src/billing/charge.ts');
  assertContains(r.out, 'BLIND SPOT', 'brief should surface the routing blind spot');
});

test('frontmatter block scalars keep their text and the catalog stays one line', (dir) => {
  initRepo(dir);
  const page = path.join(dir, 'context', 'folded.md');
  fs.writeFileSync(page, '---\ntitle: Folded Guide\ntype: guide\nstatus: active\nsummary: >\n  A folded summary\n  that spans two lines.\nupdated: 2026-10-21\n---\n\n# Folded Guide\n\n## TL;DR\n- Block scalars are parsed.\n');
  const literal = path.join(dir, 'context', 'literal.md');
  fs.writeFileSync(literal, '---\ntitle: Literal Guide\ntype: guide\nstatus: active\nsummary: |\n  A literal summary\n  that spans two lines.\nupdated: 2026-10-21\n---\n\n# Literal Guide\n\n## TL;DR\n- Literal blocks are parsed.\n');
  ctx(dir, 'index');
  const idx = fs.readFileSync(path.join(dir, 'context', 'index.md'), 'utf8');
  assertContains(idx, 'A folded summary that spans two lines.', 'folded summary was not parsed');
  assertContains(idx, 'A literal summary that spans two lines.', 'literal summary was not parsed');
  assert(!idx.includes('— >'), 'the block scalar marker leaked into the catalog');
});

test('lint fails closed on duplicate frontmatter keys', (dir) => {
  initRepo(dir);
  fs.writeFileSync(path.join(dir, 'context', 'duplicate.md'), '---\ntitle: Duplicate\ntype: guide\nstatus: active\nsummary: first\nsummary: second\nupdated: 2026-10-21\n---\n\n# Duplicate\n\n## TL;DR\n- Duplicate keys are rejected.\n');
  const r = ctx(dir, 'lint');
  assert(r.code !== 0, 'lint should fail on a duplicate frontmatter key');
  assertContains(r.out, 'duplicate frontmatter key `summary`');
});

test('lint fails closed on a cover typo and nested mappings', (dir) => {
  initRepo(dir);
  fs.writeFileSync(path.join(dir, 'context', 'typo.md'), '---\ntitle: Typo\ntype: guide\nstatus: active\nsummary: A cover typo.\ncover: ["src/auth/**"]\nupdated: 2026-10-21\n---\n\n# Typo\n\n## TL;DR\n- Typo keys are rejected.\n');
  const r = ctx(dir, 'lint');
  assert(r.code !== 0, 'lint should fail on a cover typo');
  assertContains(r.out, 'has `cover:` but no `covers:`');
  fs.writeFileSync(path.join(dir, 'context', 'nested.md'), '---\ntitle: Nested\ntype: guide\nstatus: active\nsummary: Nested values.\nmetadata:\n  owner: team\nupdated: 2026-10-21\n---\n\n# Nested\n\n## TL;DR\n- Nested mappings are rejected.\n');
  const nested = ctx(dir, 'lint');
  assert(nested.code !== 0, 'lint should fail on a nested frontmatter mapping');
  assertContains(nested.out, 'nested mapping under `metadata` is not supported');
  fs.writeFileSync(path.join(dir, 'context', 'tabbed.md'), '---\ntitle: Tabbed\ntype: guide\nstatus: active\n\tsummary: Tab indentation.\nupdated: 2026-10-21\n---\n\n# Tabbed\n\n## TL;DR\n- Tabs are rejected.\n');
  const tabbed = ctx(dir, 'lint');
  assert(tabbed.code !== 0, 'lint should fail on tab indentation');
  assertContains(tabbed.out, 'tab indentation is not valid frontmatter');
});

test('brace globs match alternatives without crashing', (dir) => {
  initRepo(dir);
  fs.writeFileSync(path.join(dir, 'context', 'brace.md'), '---\ntitle: Brace Guide\ntype: guide\nstatus: active\nsummary: Brace alternatives.\ncovers: ["{*.ts,*.tsx}", "{src/auth/*.ts,src/billing/*.ts}"]\nupdated: 2026-10-21\n---\n\n# Brace Guide\n\n## TL;DR\n- Brace globs compile.\n');
  const lint = ctx(dir, 'lint');
  assert(!lint.out.includes('Nothing to repeat'), `brace glob crashed lint:\n${lint.out}`);
  const r = ctx(dir, 'brief', 'src/auth/session.ts');
  assert(!r.out.includes('SyntaxError'), `brace glob crashed brief:\n${r.out}`);
  assertContains(r.out, 'brace.md', 'brace alternatives should match a covered file');
  assert(r.code === 0, `brief should answer with the brace page:\n${r.out}`);
});

test('a malformed glob is reported, not thrown', (dir) => {
  initRepo(dir);
  fs.writeFileSync(path.join(dir, 'context', 'bad-glob.md'), '---\ntitle: Bad Glob\ntype: guide\nstatus: active\nsummary: Unbalanced brace.\ncovers: ["src/{auth/*.ts"]\nupdated: 2026-10-21\n---\n\n# Bad Glob\n\n## TL;DR\n- Malformed globs fail closed.\n');
  const lint = ctx(dir, 'lint');
  assert(lint.code !== 0, 'lint should fail on a malformed covers glob');
  assertContains(lint.out, 'invalid covers glob');
  const r = ctx(dir, 'brief', 'src/auth/session.ts');
  assertContains(r.out, 'invalid covers glob', 'brief should warn about the malformed cover');
  assert(!r.out.includes('SyntaxError'), `brief threw on a malformed glob:\n${r.out}`);
  for (const command of ['impact', 'stale']) {
    const out = ctx(dir, command);
    assert(!out.out.includes('SyntaxError'), `${command} threw on a malformed glob:\n${out.out}`);
  }
});

test('lint catches an incomplete decision record', (dir) => {
  initRepo(dir);
  const dec = path.join(dir, 'context', 'decisions.md');
  const text = fs.readFileSync(dec, 'utf8');
  fs.writeFileSync(dec, text.replace(/^## D-01[\s\S]*$/m, '## D-01: Choose Postgres — 2026-10-01\nTrigger: needed a database\nChosen: Postgres, because it is relational\n'));
  const r = ctx(dir, 'lint');
  assert(r.code !== 0, 'lint should fail on an incomplete decision record');
  assertContains(r.out, 'Lost alternative', 'lint should name the missing fields');
  assertContains(r.out, 'D-01');
});

test('lint accepts a complete decision record', (dir) => {
  initRepo(dir);
  const dec = path.join(dir, 'context', 'decisions.md');
  const text = fs.readFileSync(dec, 'utf8');
  fs.writeFileSync(dec, text.replace(/^## D-01[\s\S]*$/m,
    '## D-01: Choose Postgres — 2026-10-01\nTrigger: needed a relational store\nOptions considered: Postgres / SQLite / Mongo\nChosen: Postgres, because relations are the domain\nLost alternative: SQLite — it cannot serve concurrent writers\nCost paid: one more service to run and back up\nReversibility: painful — a schema rewrite plus a data migration\nCorrectness policy: writes are never stale; read replicas may lag seconds\n'));
  const r = ctx(dir, 'lint');
  assert(!r.out.includes('ERROR'), `a complete record should not error:\n${r.out}`);
});

test('lint catches a spec marked complete with unticked boxes', (dir) => {
  initRepo(dir);
  fs.writeFileSync(
    path.join(dir, 'context', 'feature-specs', '01-login.md'),
    '---\ntitle: Login\ntype: feature\nstatus: complete\nsummary: Login form\nupdated: 2026-10-01\n---\n\n# Login\n\n## Explicitly NOT in this spec\n- real SSO\n\n## Verification checklist\n- [x] build passes\n- [ ] the flow was driven in the browser\n',
  );
  const r = ctx(dir, 'lint');
  assert(r.code !== 0, 'lint should fail a spec that claims completion with open checks');
  assertContains(r.out, 'still unticked');
});

test('lint catches a feature in the tracker with no spec', (dir) => {
  initRepo(dir);
  const tr = path.join(dir, 'context', 'progress-tracker.md');
  fs.writeFileSync(tr, fs.readFileSync(tr, 'utf8').replace('- {{Feature NN: name — started {{date}}}}', '- Feature 07: phantom work'));
  const r = ctx(dir, 'lint');
  assertContains(r.out, 'Feature 07', 'lint should notice the missing spec');
});

test('lint enforces tracker state exclusivity', (dir) => {
  initRepo(dir);
  const tr = path.join(dir, 'context', 'progress-tracker.md');
  fs.writeFileSync(
    tr,
    fs.readFileSync(tr, 'utf8')
      .replace('- {{Feature NN: name — started {{date}}}}', '- Feature 03: the same work')
      .replace('- {{Feature NN: name — {{date}} — decisions: D-NN; evidence: owner-page#verification}}', '- Feature 03: the same work — done'),
  );
  const r = ctx(dir, 'lint');
  assert(r.code !== 0, 'lint should fail when a feature is both in progress and complete');
  assertContains(r.out, 'exclusive');
});

test('lint catches a broken cross-link', (dir) => {
  initRepo(dir);
  const p = path.join(dir, 'context', 'overview.md');
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8') + '\nSee [the missing page](./nope-does-not-exist.md).\n');
  const r = ctx(dir, 'lint');
  assert(r.code !== 0, 'lint should fail on a broken link');
  assertContains(r.out, 'broken link');
});

test('lint catches a secret-shaped string in a page', (dir) => {
  initRepo(dir);
  const p = path.join(dir, 'context', 'overview.md');
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8') + '\nStripe key sk_live_51H8xQ2LkdIwHu7ixx for the demo.\n');
  const r = ctx(dir, 'lint');
  assert(r.code !== 0, 'lint should fail on a secret-shaped string');
  assertContains(r.out, 'secret');
});

test('lint --fix repairs the derived catalog without touching content', (dir) => {
  initRepo(dir);
  ctx(dir, 'index');
  const idx = path.join(dir, 'context', 'index.md');
  const before = fs.readFileSync(idx, 'utf8');
  fs.appendFileSync(idx, '\n## Stray hand-written section\n');
  ctx(dir, 'lint', '--fix');
  const after = fs.readFileSync(idx, 'utf8');
  assert(before === after || after.includes('Stray'), 'lint --fix should leave hand-written content outside the markers alone');
  assertContains(after, '<!-- ctx:index:start -->');
});

test('doctor verifies the scaffold is wired, not just present', (dir) => {
  initRepo(dir);
  const r = ctx(dir, 'doctor');
  assertContains(r.out, 'ctx doctor:');
  // A freshly-scaffolded repo must pass the import and gitignore checks.
  assert(!r.out.includes('FAIL  CLAUDE.md does not import'), 'CLAUDE.md import should be correct in the template');
});

test('doctor catches a CLAUDE.md that stopped importing AGENTS.md', (dir) => {
  initRepo(dir);
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '# CLAUDE.md\nSome rules here.\n');
  const r = ctx(dir, 'doctor');
  assert(r.code !== 0, 'doctor should fail when the import is gone');
  assertContains(r.out, 'AGENTS.md');
});

test('doctor catches an un-gitignored issue file', (dir) => {
  initRepo(dir);
  fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules\n');
  const r = ctx(dir, 'doctor');
  assert(r.code !== 0, 'doctor should fail when current-issues.md is not ignored');
  assertContains(r.out, 'current-issues.md');
});

test('doctor catches a missing .env deny rule', (dir) => {
  initRepo(dir);
  fs.writeFileSync(path.join(dir, '.claude', 'settings.json'), JSON.stringify({ permissions: { allow: [], ask: [], deny: [] } }));
  const r = ctx(dir, 'doctor');
  assert(r.code !== 0, 'doctor should fail without a deny rule for secrets');
  assertContains(r.out, '.env');
});

test('doctor catches missing enforcement hooks', (dir) => {
  initRepo(dir);
  const sp = path.join(dir, '.claude', 'settings.json');
  fs.writeFileSync(sp, JSON.stringify({ permissions: { deny: ['Read(**/.env*)'] } }));
  const r = ctx(dir, 'doctor');
  assert(r.code !== 0, 'doctor should fail without hooks');
  assertContains(r.out, 'hook');
});

test('stop hook blocks when code changed without context updates', (dir) => {
  initRepo(dir);
  sh('git', ['add', '-A'], dir);
  sh('git', ['commit', '-qm', 'setup'], dir);
  fs.writeFileSync(path.join(dir, 'src', 'auth', 'session.ts'), 'export const login = () => "v2";\n');
  const r = ctx(dir, 'hook', 'stop');
  assert(r.code === 2, `stop hook should block (exit 2), got ${r.code}:\n${r.out}`);
  assertContains(r.out, 'memory.md');
});

test('stop hook never loops when re-invoked', (dir) => {
  initRepo(dir);
  sh('git', ['add', '-A'], dir);
  sh('git', ['commit', '-qm', 'setup'], dir);
  fs.writeFileSync(path.join(dir, 'src', 'auth', 'session.ts'), 'export const login = () => "v2";\n');
  const first = ctxHook(dir, 'stop', { stop_hook_active: false, cwd: dir });
  assert(first.code === 2, 'first pass should block');
  // Claude Code re-invokes the hook after a block; it must not block again.
  const again = ctxHook(dir, 'stop', { stop_hook_active: true, cwd: dir });
  assert(again.code === 0, `stop hook must not re-block when stop_hook_active is true, got ${again.code}:\n${again.out}`);
});

test('stop hook allows a stop when nothing changed', (dir) => {
  initRepo(dir);
  sh('git', ['add', '-A'], dir);
  sh('git', ['commit', '-qm', 'setup'], dir);
  const r = ctx(dir, 'hook', 'stop');
  assert(r.code === 0, `clean tree should allow stop, got ${r.code}:\n${r.out}`);
});

test('session-start hook injects orientation and survives bad input', (dir) => {
  initRepo(dir);
  const r = ctx(dir, 'hook', 'session-start');
  assertContains(r.out, 'AGENTS.md');
  assertContains(r.out, 'memory.md');
  const bad = ctxHook(dir, 'stop', 'not-an-object');
  assert(bad.code === 0, `malformed hook input must degrade to a no-op, got ${bad.code}`);
});

test('session-start hook recognises a compaction', (dir) => {
  initRepo(dir);
  const r = ctxHook(dir, 'session-start', { source: 'compact', cwd: dir });
  assertContains(r.out, 'compacted', 'compaction should re-inject the reading order');
});

test('json output is machine readable and honours the documented ok contract', (dir) => {
  initRepo(dir);
  sh('git', ['add', '-A'], dir);
  sh('git', ['commit', '-qm', 'setup'], dir);
  // Every command that accepts --json must emit parseable JSON *and* a boolean
  // `ok`, because that is the documented stability contract other tools rely on.
  for (const cmd of ['lint', 'status', 'stale', 'coverage', 'impact', 'doctor']) {
    const r = ctx(dir, cmd, '--json');
    let parsed;
    try {
      parsed = JSON.parse(r.out);
    } catch {
      throw new Error(`${cmd} --json did not emit valid JSON:\n${r.out.slice(0, 600)}`);
    }
    if (parsed.command !== cmd) throw new Error(`${cmd} --json is missing its \`command\` field, got ${JSON.stringify(parsed).slice(0, 200)}`);
    if (typeof parsed.ok !== 'boolean') throw new Error(`${cmd} --json is missing a boolean \`ok\` field, got ${JSON.stringify(parsed).slice(0, 200)}`);
  }
});

test('works without git and degrades gracefully', (dir) => {
  initRepo(dir);
  fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true });
  for (const cmd of ['stale', 'lint', 'brief']) {
    const r = ctx(dir, cmd, 'src/auth/session.ts');
    assert(r.code === 0, `${cmd} should not crash without git (exit ${r.code}):\n${r.out}`);
  }
});

test('new pages use the shipped template when it is available', (dir) => {
  initRepo(dir);
  ctx(dir, 'new', 'module', 'billing', '--covers', 'src/billing/**');
  const p = path.join(dir, 'context', 'codebase', 'modules', 'billing.md');
  assert(fs.existsSync(p), 'module page was not created');
  const txt = fs.readFileSync(p, 'utf8');
  assert(/^title: Billing$/m.test(txt), `title not substituted:\n${txt.slice(0, 200)}`);
  assert(/^tags: \[billing\]$/m.test(txt), 'tags not substituted');
  assert(/^covers: \[src\/billing\/\*\*\]$/m.test(txt), 'covers not substituted');
  assert(!/\{\{TODAY\}\}/.test(txt), '{{TODAY}} should be substituted');
  assert(/^updated: \d{4}-\d{2}-\d{2}$/m.test(txt), 'updated should be a real date');
  // A new page must satisfy the structural lint rules immediately.
  const r = ctx(dir, 'lint');
  assert(!r.out.includes('missing frontmatter'), `new page failed lint:\n${r.out}`);
  assert(!r.out.includes('ERROR'), `new page has lint errors:\n${r.out}`);
});

test('new falls back to a built-in skeleton without the skill assets', (dir) => {
  initRepo(dir);
  // Remove the only template that `new module` would prefer, proving the CLI
  // still works from the copy in context/ (which ships no assets/).
  fs.rmSync(path.join(dir, 'context', 'codebase', 'modules', 'billing.md'), { force: true });
  ctx(dir, 'new', 'entity', 'invoice');
  const p = path.join(dir, 'context', 'invoice.md');
  assert(fs.existsSync(p), 'generic type page was not created');
  assert(fs.readFileSync(p, 'utf8').includes('title: Invoice'), 'fallback skeleton is malformed');
});

test('hook commands never hang when stdin has no payload', (dir) => {
  initRepo(dir);
  sh('git', ['add', '-A'], dir);
  sh('git', ['commit', '-qm', 'setup'], dir);
  // Regression: reading fd 0 synchronously blocks forever when the hook is run
  // by a human, CI or the pre-commit script instead of by Claude Code.
  for (const which of ['session-start', 'stop']) {
    const started = Date.now();
    const r = sh('node', [path.join(dir, 'context', 'ctx.mjs'), 'hook', which], dir, {}, '');
    const elapsed = Date.now() - started;
    assert(r.code !== null && r.code !== undefined, `${which} produced no exit status (likely killed)`);
    assert(elapsed < 8000, `${which} hung for ${elapsed}ms waiting on stdin`);
    assert(r.code === 0, `${which} on a clean tree should succeed, got ${r.code}`);
  }
});

test('unknown command prints usage instead of a stack trace', (dir) => {
  const r = sh('node', [CTX_SRC, 'not-a-command'], dir);
  assert(r.code !== 0, 'unknown command should exit non-zero');
  assert(!r.out.includes('at Object.'), 'should not dump a stack trace');
  assertContains(r.out, 'brief');
});

test('init adapts the scaffold to the detected project profile', (dir) => {
  fs.rmSync(path.join(dir, 'package.json'));
  fs.writeFileSync(path.join(dir, 'pyproject.toml'), '[project]\nname="x"\ndependencies=["fastapi","sqlalchemy"]\n');
  const r = sh('node', [CTX_SRC, 'init', '--root', dir, '--portable-pointers'], dir);
  assert(r.code === 0, `init failed: ${r.out}`);
  assert(!fs.existsSync(path.join(dir, 'context', 'ui-tokens.md')), 'UI pages created for a headless API');
  assert(fs.existsSync(path.join(dir, 'context', 'data-model.md')), 'data-model missing for a DB project');
  assert(fs.existsSync(path.join(dir, 'docs', 'README.md')), 'docs/ not scaffolded');
  assert(fs.existsSync(path.join(dir, '.claude', 'agents', 'context-explorer.md')), 'subagent definitions not scaffolded');
  const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'context', '.ctx.json'), 'utf8'));
  assert(cfg.sourceExt.includes('.py'), 'config not seeded from the python profile');
  assert(!cfg.sourceExt.includes('.tsx'), 'config carries extensions the project cannot have');
});

test('a frontend profile gets the UI pages', (dir) => {
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'ui', dependencies: { react: '^19.0.0', next: '^15.0.0' } }));
  const r = sh('node', [CTX_SRC, 'init', '--root', dir, '--portable-pointers'], dir);
  assert(r.code === 0, `init failed: ${r.out}`);
  assert(fs.existsSync(path.join(dir, 'context', 'ui-tokens.md')), 'UI pages missing for a React project');
});

test('task ledger enforces the state machine', (dir) => {
  initRepo(dir);
  let r = ctx(dir, 'task', 'add', 'login flow');
  assert(r.code === 0 && /Feature 01/.test(r.out), `add failed: ${r.out}`);
  ctx(dir, 'task', 'add', 'billing');
  r = ctx(dir, 'task', 'start', '1');
  assert(r.code === 0, `start failed: ${r.out}`);
  r = ctx(dir, 'task', 'start', '2');
  assert(r.code !== 0 && /one unit/.test(r.out), 'a second unit must not start while one is active');
  r = ctx(dir, 'task', 'done', '1');
  assert(r.code !== 0, 'done without concrete details must fail');
  r = ctx(dir, 'task', 'done', '1', '-m', 'session.ts v2, env AUTH_URL');
  assert(r.code === 0, `done failed: ${r.out}`);
  const tr = fs.readFileSync(path.join(dir, 'context', 'progress-tracker.md'), 'utf8');
  assert(/## Completed[\s\S]*Feature 01: login flow — \d{4}-\d{2}-\d{2} — session\.ts v2/.test(tr), `done lost the title:\n${tr}`);
  assert(!/## In progress\n\n- Feature/.test(tr), 'the finished unit is still In progress');
  const j = JSON.parse(ctx(dir, 'task', 'list', '--json').out);
  assert(j.command === 'task' && typeof j.ok === 'boolean', 'task list --json contract');
});

test('detect and tools honour the json contract', (dir) => {
  initRepo(dir);
  const d = JSON.parse(ctx(dir, 'detect', '--json').out);
  assert(d.command === 'detect' && Array.isArray(d.langs) && Array.isArray(d.kinds), `detect json: ${JSON.stringify(d)}`);
  const t = JSON.parse(ctx(dir, 'tools', '--json').out);
  assert(t.command === 'tools' && Array.isArray(t.available), `tools json: ${JSON.stringify(t).slice(0, 200)}`);
});

function setupRepo(dir, extra = []) {
  const r = sh('node', [CTX_SRC, 'setup', '--root', dir, '--portable-pointers', ...extra], dir);
  assert(r.code === 0, `setup failed: ${r.out}`);
  return r;
}

test('setup does the whole mechanical job on a brownfield repo, then no-ops', (dir) => {
  fs.mkdirSync(path.join(dir, 'src', 'components'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'components', 'Button.tsx'), 'export const B = 1;\n');
  const r = setupRepo(dir);
  assertContains(r.out, 'ctx doctor: 13/13', 'a fresh setup must pass every doctor check:\n' + r.out);
  const map = fs.readFileSync(path.join(dir, 'context', 'codebase', 'map.md'), 'utf8');
  assertContains(map, 'src/auth/', 'map draft missing the directory census');
  assertContains(map, 'next dev', 'map draft missing entry points from the manifest');
  assert(fs.existsSync(path.join(dir, '.claude', 'rules', 'frontend.md')), 'path-gated rules not generated');
  assert(fs.existsSync(path.join(dir, 'context', 'agents', 'context-explorer', 'MEMORY.md')), 'subagent memory not scaffolded');
  // idempotence: a second run creates nothing and leaves the filled map alone
  fs.writeFileSync(path.join(dir, 'context', 'codebase', 'map.md'), '# FILLED BY HAND\n');
  const again = setupRepo(dir);
  assert(!/created \((?!0)/.test(again.out), `second setup created files:\n${again.out}`);
  assert(fs.readFileSync(path.join(dir, 'context', 'codebase', 'map.md'), 'utf8') === '# FILLED BY HAND\n', 'setup clobbered a hand-filled map');
});

test('setup upgrades a project scaffolded by an older version', (dir) => {
  setupRepo(dir);
  const cfgP = path.join(dir, 'context', '.ctx.json');
  const cfg = JSON.parse(fs.readFileSync(cfgP, 'utf8'));
  cfg.setupVersion = '0.0.1';
  fs.writeFileSync(cfgP, JSON.stringify(cfg, null, 2));
  const bad = sh('node', [CTX_SRC, 'doctor', '--root', dir], dir);
  assert(bad.code !== 0 && /re-run/.test(bad.out), 'doctor must flag a stale setupVersion with the fix');
  setupRepo(dir);
  assert(JSON.parse(fs.readFileSync(cfgP, 'utf8')).setupVersion !== '0.0.1', 'setup did not bump setupVersion');
  assert(sh('node', [CTX_SRC, 'doctor', '--root', dir], dir).code === 0, 'doctor should pass after the upgrade');
});

test('rules routes a file to its path-gated rules and covering pages', (dir) => {
  setupRepo(dir);
  ctx(dir, 'new', 'module', 'auth', '--covers', 'src/auth/**');
  const r = ctx(dir, 'rules', 'src/auth/session.ts', '--json');
  const data = JSON.parse(r.out);
  const m = data.matches[0];
  assert(m.pages.includes('context/codebase/modules/auth.md'), `covering page missed: ${JSON.stringify(m)}`);
  const h = ctx(dir, 'rules', 'src/auth/session.ts');
  assertContains(h.out, 'modules/auth.md');
});

test('lint flags machine-specific absolute paths in pages', (dir) => {
  initRepo(dir);
  const p = path.join(dir, 'context', 'overview.md');
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8') + '\nThe dataset lives in C:\\Users\\dev\\data\\raw.csv on my machine.\n');
  const r = ctx(dir, 'lint');
  assertContains(r.out, 'absolute path', 'lint should push project-relative paths');
  assert(!r.out.includes('ERROR'), 'an absolute path is a warning, not an error');
});

test('setup --danger drops a nested AGENTS.md in the landmine directory', (dir) => {
  setupRepo(dir, ['--danger', 'src/auth,src/nope']);
  const nested = fs.readFileSync(path.join(dir, 'src', 'auth', 'AGENTS.md'), 'utf8');
  assertContains(nested, 'src/auth/');
  assert(!fs.existsSync(path.join(dir, 'src', 'nope', 'AGENTS.md')), 'a nonexistent danger zone must be skipped, not created');
});

test('archive rotates old log and tracker entries without deleting history', (dir) => {
  initRepo(dir);
  const lp = path.join(dir, 'context', 'log.md');
  const fresh = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(lp, fs.readFileSync(lp, 'utf8') + `\n## [2025-01-05] build | ancient unit\nnote one\n\n## [${fresh}] build | fresh unit\n`);
  const tr = path.join(dir, 'context', 'progress-tracker.md');
  fs.writeFileSync(tr, fs.readFileSync(tr, 'utf8').replace(/\r\n/g, '\n').replace('## Completed\n', '## Completed\n\n- Feature 01: old thing — 2025-01-05 — details here\n'));
  const r = ctx(dir, 'archive');
  assertContains(r.out, 'log: 1 entr');
  assertContains(r.out, 'tracker: 1 old completion');
  const arch = fs.readdirSync(path.join(dir, 'context', 'archive'));
  const archLog = arch.find((f) => f.startsWith('log-'));
  const archTrk = arch.find((f) => f.startsWith('tracker-'));
  assert(archLog && archTrk, `archives missing: ${arch.join(', ')}`);
  const logNow = fs.readFileSync(lp, 'utf8');
  assert(!logNow.includes('ancient unit') && logNow.includes('fresh unit'), 'log rotation moved the wrong entries');
  assertContains(fs.readFileSync(path.join(dir, 'context', 'archive', archLog), 'utf8'), 'ancient unit', 'history must be preserved in the archive');
  assertContains(fs.readFileSync(tr, 'utf8'), 'older completions archived', 'tracker must keep a pointer to its archive');
});

test('archive replay does not duplicate entries a crashed run already archived', (dir) => {
  initRepo(dir);
  const lp = path.join(dir, 'context', 'log.md');
  fs.writeFileSync(lp, fs.readFileSync(lp, 'utf8') + '\n## [2025-01-05] build | ancient unit\nnote one\n\n## [2099-01-01] build | future unit\n');
  const tr = path.join(dir, 'context', 'progress-tracker.md');
  const oldLine = '- Feature 01: old thing — 2025-01-05 — details here';
  fs.writeFileSync(tr, fs.readFileSync(tr, 'utf8').replace(/\r\n/g, '\n').replace('## Completed\n', `## Completed\n\n${oldLine}\n`));
  const cl = new Date(Date.now() - 180 * 864e5).toISOString().slice(0, 7);
  const ct = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 4);
  const archDir = path.join(dir, 'context', 'archive');
  fs.mkdirSync(archDir, { recursive: true });
  const logArchive = path.join(archDir, `log-${cl}.md`);
  const trackerArchive = path.join(archDir, `tracker-${ct}.md`);
  fs.writeFileSync(logArchive, '# Log (archived)\n\n## [2025-01-05] build | ancient unit\nnote one\n');
  fs.writeFileSync(trackerArchive, '# Completed (archived)\n\n' + oldLine + '\n');
  const r = ctx(dir, 'archive');
  assert(r.code === 0, `archive replay failed:\n${r.out}`);
  const logText = fs.readFileSync(logArchive, 'utf8');
  const trackerText = fs.readFileSync(trackerArchive, 'utf8');
  assert(logText.split('ancient unit').length - 1 === 1, `log archive duplicated the entry:\n${logText}`);
  assert(trackerText.split(oldLine).length - 1 === 1, `tracker archive duplicated the line:\n${trackerText}`);
  assert(!fs.readFileSync(lp, 'utf8').includes('ancient unit'), 'source log still holds the archived entry');
  assert(!fs.readFileSync(tr, 'utf8').includes(oldLine), 'source tracker still holds the archived line');
});

test('core commands leave no temp files and recover a stale lock', (dir) => {
  initRepo(dir);
  ctx(dir, 'log', 'build', 'atomic one');
  ctx(dir, 'index');
  const seen = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else seen.push(p);
    }
  };
  walk(path.join(dir, 'context'));
  assert(!seen.some((f) => f.includes('.tmp-')), `temp file left behind: ${seen.filter((f) => f.includes('.tmp-')).join(', ')}`);
  const key = createHash('sha1').update(fs.realpathSync(dir)).digest('hex').slice(0, 16);
  const lock = path.join(os.tmpdir(), 'ctx-locks', key + '.lock');
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  fs.writeFileSync(lock, 'stale');
  const old = new Date(Date.now() - 60000);
  fs.utimesSync(lock, old, old);
  const r = ctx(dir, 'task', 'add', 'after stale lock');
  assert(r.code === 0, `stale lock was not recovered:\n${r.out}`);
  assert(!fs.existsSync(lock), 'stale lock was not removed');
});

test('a blocked writer fails without truncating the original', (dir) => {
  initRepo(dir);
  const lp = path.join(dir, 'context', 'log.md');
  const before = fs.readFileSync(lp, 'utf8');
  const key = createHash('sha1').update(fs.realpathSync(dir)).digest('hex').slice(0, 16);
  const lock = path.join(os.tmpdir(), 'ctx-locks', key + '.lock');
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  fs.writeFileSync(lock, 'held');
  const r = sh('node', [path.join(dir, 'context', 'ctx.mjs'), 'log', 'build', 'blocked'], dir, { CTX_LOCK_WAIT_MS: '150' });
  assert(r.code !== 0 && /ctx is busy/.test(r.out), `a held lock must fail clearly:\n${r.out}`);
  assert(fs.readFileSync(lp, 'utf8') === before, 'a blocked writer changed the original file');
  fs.unlinkSync(lock);
});

test('lint catches branch-merge ID collisions in the tracker', (dir) => {
  initRepo(dir);
  const tr = path.join(dir, 'context', 'progress-tracker.md');
  fs.writeFileSync(tr, fs.readFileSync(tr, 'utf8').replace(/\r\n/g, '\n').replace('## Up next\n', '## Up next\n\n- Feature 04: branch A unit\n- Feature 04: branch B unit\n'));
  const r = ctx(dir, 'lint');
  assert(r.code !== 0 && /listed twice/.test(r.out), `duplicate Feature id in one section must error:\n${r.out}`);
});

test('task refuses to claim a number already in the ledger', (dir) => {
  initRepo(dir);
  ctx(dir, 'task', 'add', 'first unit');
  const r = ctx(dir, 'task', 'add', 'second unit', '--spec', '1');
  assert(r.code !== 0 && /already in the ledger/.test(r.out), `--spec collision must be refused:\n${r.out}`);
});

test('the CLI copy shipped into a project carries no skill lineage', (dir) => {
  initRepo(dir);
  const t = fs.readFileSync(path.join(dir, 'context', 'ctx.mjs'), 'utf8');
  assert(!/karpathy/i.test(t), 'attribution leaked into the project copy');
  assert(!/CHANGELOG|dogfood|aisdlc/i.test(t), 'repo dev narrative leaked into the project copy');
  assert(!/^\s*\*\s.*\(v\d/m.test(t.split('\n').slice(0, 15).join('\n')), 'version chatter in the copied header');
});

test('install ships the skill files and keeps repo dev history behind', (dir) => {
  const dest = path.join(dir, 'skillhome');
  const r = sh('node', [CTX_SRC, 'install', '--dest', dest], dir);
  assert(r.code === 0, `install failed: ${r.out}`);
  const root = path.join(dest, 'project-context-system');
  for (const f of ['SKILL.md', 'scripts/ctx.mjs', 'references/operations.md', 'assets/AGENTS.md.template']) {
    assert(fs.existsSync(path.join(root, f)), `${f} not installed`);
  }
  for (const f of ['CHANGELOG.md', 'tests', 'README.md', '.git']) {
    assert(!fs.existsSync(path.join(root, f)), `repo dev history leaked into the install: ${f}`);
  }
  // idempotent re-install overwrites cleanly
  const again = sh('node', [CTX_SRC, 'install', '--dest', dest], dir);
  assert(again.code === 0 && again.out.includes('installed'), `re-install failed:\n${again.out}`);
});

test('install refuses an unsafe skill name before writing', (dir) => {
  const fake = path.join(dir, 'fake-skill');
  fs.mkdirSync(path.join(fake, 'scripts'), { recursive: true });
  fs.copyFileSync(CTX_SRC, path.join(fake, 'scripts', 'ctx.mjs'));
  fs.writeFileSync(path.join(fake, 'SKILL.md'), '---\nname: ../escape\n---\n\n# fake\n');
  const dest = path.join(dir, 'installed');
  const r = sh('node', [path.join(fake, 'scripts', 'ctx.mjs'), 'install', '--dest', dest], dir);
  assert(r.code !== 0 && /unsafe skill name/.test(r.out), `unsafe name was accepted:\n${r.out}`);
  assert(!fs.existsSync(path.join(dir, 'escape')), 'unsafe name escaped the destination');
});

test('install refuses a symlinked destination', (dir) => {
  const dest = path.join(dir, 'skillhome');
  const outside = path.join(dir, 'outside');
  fs.mkdirSync(dest, { recursive: true });
  fs.mkdirSync(outside, { recursive: true });
  try {
    fs.symlinkSync(outside, path.join(dest, 'project-context-system'), process.platform === 'win32' ? 'junction' : 'dir');
  } catch (e) {
    const skip = new Error(`native link privilege unavailable (${e.code}); no success simulated`);
    skip.nativeSkip = true;
    throw skip;
  }
  const r = sh('node', [CTX_SRC, 'install', '--dest', dest], dir);
  assert(r.code !== 0 && /refusing destination symlink/.test(r.out), `symlink destination was accepted:\n${r.out}`);
  assert(!fs.readdirSync(outside).length, 'symlink destination was written through');
});

test('install stages a full tree, removes stale files and backs up local edits', (dir) => {
  const dest = path.join(dir, 'skillhome');
  const root = path.join(dest, 'project-context-system');
  const first = sh('node', [CTX_SRC, 'install', '--dest', dest], dir);
  assert(first.code === 0, `install failed: ${first.out}`);
  fs.writeFileSync(path.join(root, 'obsolete.txt'), 'old copy\n');
  fs.writeFileSync(path.join(root, 'SKILL.md'), 'LOCAL EDIT\n');
  const again = sh('node', [CTX_SRC, 'install', '--dest', dest], dir);
  assert(again.code === 0 && again.out.includes('backup:'), `re-install failed:\n${again.out}`);
  assert(!fs.existsSync(path.join(root, 'obsolete.txt')), 'a file dropped from SHIP survived reinstall');
  assert(fs.readFileSync(path.join(root, 'SKILL.md'), 'utf8').includes('project-context-system'), 'new tree was not published');
  const backups = fs.readdirSync(dest).filter((f) => f.includes('.ctx-backup-'));
  assert(backups.length === 1, `expected one install backup, got ${backups.join(', ')}`);
  assert(fs.readFileSync(path.join(dest, backups[0], 'SKILL.md'), 'utf8') === 'LOCAL EDIT\n', 'local edit was not preserved in the backup');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, '.ctx-install.json'), 'utf8'));
  assert(manifest.name === 'project-context-system' && manifest.version && manifest.checksum && manifest.files.includes('SKILL.md'), 'install manifest is incomplete');
});

test('install --dry-run writes nothing', (dir) => {
  const dest = path.join(dir, 'dry-home');
  const r = sh('node', [CTX_SRC, 'install', '--dest', dest, '--dry-run'], dir);
  assert(r.code === 0 && /would install/.test(r.out), `dry-run failed:\n${r.out}`);
  assert(!fs.existsSync(path.join(dest, 'project-context-system')), 'dry-run created the target');
});

test('setup backs up a changed CLI and migrates the config schema', (dir) => {
  setupRepo(dir);
  const cfgP = path.join(dir, 'context', '.ctx.json');
  const cfg = JSON.parse(fs.readFileSync(cfgP, 'utf8'));
  assert(cfg.schemaVersion === 2, `new config lacks the current schema: ${JSON.stringify(cfg)}`);
  cfg.unknownKey = 'preserve-me';
  cfg.schemaVersion = 1;
  fs.writeFileSync(cfgP, JSON.stringify(cfg, null, 2));
  const self = path.join(dir, 'context', 'ctx.mjs');
  fs.writeFileSync(self, 'HAND EDITED CLI\n');
  setupRepo(dir);
  const backups = fs.readdirSync(path.join(dir, 'context')).filter((f) => f.startsWith('ctx.mjs.bak-'));
  assert(backups.length === 1, `expected one CLI backup, got ${backups.join(', ')}`);
  assert(fs.readFileSync(path.join(dir, 'context', backups[0]), 'utf8') === 'HAND EDITED CLI\n', 'CLI backup lost the hand edit');
  assert(fs.readFileSync(self, 'utf8') !== 'HAND EDITED CLI\n', 'setup did not refresh the CLI');
  const migrated = JSON.parse(fs.readFileSync(cfgP, 'utf8'));
  assert(migrated.schemaVersion === 2 && migrated.unknownKey === 'preserve-me', 'config migration dropped schema or unknown keys');
});

test('new feature and task add refuse implicit roadmap-reserved numbers', (dir) => {
  initRepo(dir);
  fs.writeFileSync(path.join(dir, 'context', 'build-plan.md'), `---
title: Build Plan
type: plan
status: active
summary: Fixture roadmap.
tags: [plan]
updated: 2026-10-21
---

| # | Feature | Size | Build first because |
|---|---|---|---|
| 01 | Reserved unit — first | S | fixture |
| 02 | Later unit — second | S | fixture |
`);
  let r = ctx(dir, 'new', 'feature', 'Reserved unit');
  assert(r.code !== 0 && r.out.includes('reserved by context/build-plan.md'), `implicit reserved number was accepted:\n${r.out}`);
  r = ctx(dir, 'new', 'feature', 'Reserved unit', '--spec', '1');
  assert(r.code === 0 && fs.existsSync(path.join(dir, 'context', 'feature-specs', '01-reserved-unit.md')), `explicit reserved spec failed:\n${r.out}`);
  r = ctx(dir, 'new', 'feature', 'Unreserved unit', '--spec', '3');
  assert(r.code !== 0 && r.out.includes('not reserved'), `unreserved explicit number was accepted:\n${r.out}`);
  r = ctx(dir, 'task', 'add', 'Reserved unit');
  assert(r.code !== 0 && r.out.includes('reserved by context/build-plan.md'), `implicit reserved tracker number was accepted:\n${r.out}`);
  r = ctx(dir, 'task', 'add', 'Reserved unit', '--spec', '1');
  assert(r.code === 0 && r.out.includes('added Feature 01'), `explicit tracker number failed:\n${r.out}`);
});

test('lint enforces roadmap spec and tracker coherence', (dir) => {
  queueFixture(dir);
  const tr = path.join(dir, 'context', 'progress-tracker.md');
  const spec = path.join(dir, 'context', 'feature-specs', '30-queue-unit.md');
  const baseTracker = fs.readFileSync(tr, 'utf8');
  const baseSpec = fs.readFileSync(spec, 'utf8');
  const lint = () => ctx(dir, 'lint');
  let r = lint();
  assert(r.code === 0, `coherent fixture failed lint:\n${r.out}`);

  fs.writeFileSync(path.join(dir, 'context', 'feature-specs', '99-rogue.md'), baseSpec.replace(/title: Queue unit/, 'title: Rogue unit'));
  r = lint();
  assert(r.code !== 0 && r.out.includes('Feature 99 is not reserved'), `unreserved spec passed lint:\n${r.out}`);
  fs.rmSync(path.join(dir, 'context', 'feature-specs', '99-rogue.md'));

  fs.writeFileSync(tr, baseTracker.replace('## Up next\n', '## Up next\n- Feature 99: rogue unit\n'));
  r = lint();
  assert(r.code !== 0 && r.out.includes('Feature 99 is not reserved'), `unreserved tracker number passed lint:\n${r.out}`);

  fs.writeFileSync(tr, baseTracker.replace(/- Feature 30: Queue unit[^\n]*\n/, ''));
  r = lint();
  assert(r.code !== 0 && r.out.includes('not under Completed'), `complete spec outside Completed passed lint:\n${r.out}`);

  fs.writeFileSync(tr, baseTracker);
  fs.writeFileSync(spec, baseSpec.replace('status: complete', 'status: draft'));
  r = lint();
  assert(r.code !== 0 && r.out.includes('under Completed'), `draft spec in Completed passed lint:\n${r.out}`);
});

test('lint requires Wave 0 spec sections and real decision references', (dir) => {
  queueFixture(dir);
  const spec = path.join(dir, 'context', 'feature-specs', '30-queue-unit.md');
  const base = fs.readFileSync(spec, 'utf8');
  fs.writeFileSync(spec, base.replace('## Value sources', '## Sources'));
  let r = ctx(dir, 'lint', '--strict');
  assert(r.code !== 0 && r.out.includes('missing required spec section "## Value sources"'), `missing section passed lint:\n${r.out}`);
  fs.writeFileSync(spec, base.replace('## Clarifications', '## Clarifications\n\n- D-99 is not defined.'));
  r = ctx(dir, 'lint', '--strict');
  assert(r.code !== 0 && r.out.includes('references D-99'), `unknown decision reference passed lint:\n${r.out}`);
});

test('lint catches dead router backticks and related targets', (dir) => {
  queueFixture(dir);
  const idx = path.join(dir, 'context', 'index.md');
  const spec = path.join(dir, 'context', 'feature-specs', '30-queue-unit.md');
  const baseIdx = fs.readFileSync(idx, 'utf8').replace(/\r\n/g, '\n');
  const baseSpec = fs.readFileSync(spec, 'utf8').replace(/\r\n/g, '\n');
  assert(fs.readdirSync(path.join(dir, 'context', 'feature-specs')).includes('30-queue-unit.md'), 'fixture spec is missing');
  let r = ctx(dir, 'lint');
  assert(r.code === 0, `coherent routing fixture failed lint:\n${r.out}`);

  const deadIdx = baseIdx.replace('| Task | Read, in this order |\n', '| Task | Read, in this order |\n| Dead route | `missing-page.md` |\n');
  assert(deadIdx !== baseIdx, 'fixture could not inject a dead route');
  fs.writeFileSync(idx, deadIdx);
  assert(fs.readFileSync(idx, 'utf8').includes('missing-page.md'), 'fixture did not persist the dead route');
  r = ctx(dir, 'lint');
  assert(r.code !== 0 && r.out.includes('code-span path not found -> missing-page.md'), `dead router page passed lint:\n${r.out}`);

  fs.writeFileSync(idx, baseIdx.replace('| Task | Read, in this order |\n', '| Task | Read, in this order |\n| Dead route | `scripts/missing.mjs` |\n'));
  r = ctx(dir, 'lint');
  assert(r.code !== 0 && r.out.includes('code-span path not found -> scripts/missing.mjs'), `dead code-span path passed lint:\n${r.out}`);

  fs.writeFileSync(idx, baseIdx);
  fs.writeFileSync(spec, baseSpec.replace('related: []', 'related: [../missing.md]'));
  r = ctx(dir, 'lint');
  assert(r.code !== 0 && r.out.includes('related target not found -> ../missing.md'), `missing related target passed lint:\n${r.out}`);
});

test('shipped routing templates name only always-created pages', () => {
  const idx = fs.readFileSync(path.join(HERE, '..', 'assets', 'index.md.template'), 'utf8');
  const flow = fs.readFileSync(path.join(HERE, '..', 'assets', 'workflow-rules.md.template'), 'utf8');
  for (const dead of ['ui-rules.md', 'ui-tokens.md', 'ui-registry.md', 'data-model.md', 'api-contracts.md', 'integrations.md', 'runbook.md', 'env-vars.md']) {
    assert(!idx.includes(dead), `index template still routes to optional ${dead}`);
  }
  assert(idx.includes('`designs/`') && idx.includes('`codebase/map.md`'), 'index template lost its always-created UI route');
  assert(!/runbook\.md/.test(flow), 'workflow template still names runbook.md unconditionally');
});

/* ---- reliability regressions */
test('reliability setup stays in cwd rather than an ancestor project', (dir) => {
  const child = path.join(dir, 'child');
  fs.mkdirSync(child);
  const r = sh('node', [CTX_SRC, 'setup', '--portable-pointers'], child);
  assert(r.code === 0, `child setup failed: ${r.out}`);
  assert(fs.existsSync(path.join(child, 'context', 'ctx.mjs')), 'setup escaped into ancestor git repo');
  assert(!fs.existsSync(path.join(dir, 'AGENTS.md')), 'ancestor was mutated');
});

test('reliability missing value flags fail before mutation and preserve JSON errors', (dir) => {
  for (const args of [['setup', '--root'], ['setup', '--danger'], ['setup', '--root', '--json']]) {
    const r = sh('node', [CTX_SRC, ...args], dir);
    assert(r.code !== 0, `missing flag value accepted: ${args}`);
    assert(!fs.existsSync(path.join(dir, 'context')), 'invalid invocation wrote files');
    if (args.includes('--json')) assert(JSON.parse(r.out).ok === false, 'missing flag JSON error contract');
  }
});

test('reliability danger rejects traversal and external junctions before writes', (dir) => {
  const project = path.join(dir, 'project');
  const outside = path.join(dir, 'outside');
  fs.mkdirSync(project); fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(project, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  for (const zone of ['../outside', 'linked']) {
    const r = sh('node', [CTX_SRC, 'setup', '--root', project, '--danger', zone], project);
    assert(r.code !== 0, `unsafe danger accepted: ${zone}`);
    assert(!fs.existsSync(path.join(outside, 'AGENTS.md')), 'external directory was written');
    assert(!fs.existsSync(path.join(project, 'AGENTS.md')), 'unsafe setup partially mutated project');
  }
});

test('reliability setup rejects external context directory links before writes', (dir) => {
  const project = path.join(dir, 'project'), outside = path.join(dir, 'outside');
  fs.mkdirSync(project); fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(project, 'context'), process.platform === 'win32' ? 'junction' : 'dir');
  const r = sh('node', [CTX_SRC, 'setup', '--root', project], project);
  assert(r.code !== 0, 'external context link accepted');
  assert(!fs.existsSync(path.join(project, 'AGENTS.md')) && !fs.readdirSync(outside).length, 'setup wrote before rejecting escape');
});

test('reliability setup rejects dangling destination symlinks before writes', (dir) => {
  const project = path.join(dir, 'project'), outside = path.join(dir, 'outside');
  fs.mkdirSync(project); fs.mkdirSync(outside);
  const target = path.join(outside, 'missing-directory');
  fs.symlinkSync(target, path.join(project, 'context'), process.platform === 'win32' ? 'junction' : 'dir');
  const r = sh('node', [CTX_SRC, 'setup', '--root', project], project);
  assert(r.code !== 0, 'dangling destination symlink accepted');
  assert(!fs.existsSync(target) && !fs.existsSync(path.join(project, 'AGENTS.md')), 'setup mutated project before rejecting dangling symlink');
});

test('reliability setup preserves partially filled maps containing placeholders', (dir) => {
  setupRepo(dir);
  const p = path.join(dir, 'context', 'codebase', 'map.md');
  const edited = fs.readFileSync(p, 'utf8').replace('## TL;DR', '## TL;DR\nHuman-authored contract; {{unfinished}} remains.');
  fs.writeFileSync(p, edited);
  fs.writeFileSync(path.join(dir, 'src', 'more.ts'), 'export const more = 1;\n');
  setupRepo(dir);
  assert(fs.readFileSync(p, 'utf8') === edited, 'partially filled map was clobbered');
});

test('reliability Unicode git paths are exact in impact stale and coverage', (dir) => {
  initRepo(dir);
  const name = 'src/auth/caf\u00e9.ts';
  fs.writeFileSync(path.join(dir, name), 'export const cafe = 1;\n');
  ctx(dir, 'new', 'module', 'unicode', '--covers', name);
  sh('git', ['add', '-A'], dir); sh('git', ['commit', '-qm', 'base'], dir);
  fs.appendFileSync(path.join(dir, name), '// changed\n');
  const impact = JSON.parse(ctx(dir, 'impact', '--json').out);
  assert(impact.pages.some((p) => p.hits.includes(name)), 'Unicode status path does not route');
  assert(JSON.parse(ctx(dir, 'stale', '--json').out).items.some((p) => p.hits.includes(name)), 'Unicode stale hit is missing');
  assert(JSON.parse(ctx(dir, 'coverage', '--json').out).total === 3, 'Unicode source excluded from coverage');
  sh('git', ['add', '-A'], dir); sh('git', ['commit', '-qm', 'Unicode change'], dir);
  assert(JSON.parse(ctx(dir, 'stale', '--json').out).items.some((p) => p.hits.includes(name)), 'Unicode committed diff does not route');
});

test('reliability renamed paths review both old and new coverage', (dir) => {
  initRepo(dir); ctx(dir, 'new', 'module', 'auth', '--covers', 'src/auth/**');
  sh('git', ['add', '-A'], dir); sh('git', ['commit', '-qm', 'base'], dir);
  sh('git', ['mv', 'src/auth/session.ts', 'src/moved.ts'], dir);
  const data = JSON.parse(ctx(dir, 'impact', '--json').out);
  assert(data.pages.some((p) => p.hits.includes('src/auth/session.ts')), 'old rename path not reviewed');
  assert(data.uncovered.includes('src/moved.ts'), 'new rename path not reported');
  assert(JSON.parse(ctx(dir, 'stale', '--json').out).items.length > 0, 'rename out of covered area was fresh');
});

test('reliability git paths are relative to nested project root', (dir) => {
  sh('git', ['add', '-A'], dir); sh('git', ['commit', '-qm', 'parent'], dir);
  const child = path.join(dir, 'child'); fs.mkdirSync(child);
  fs.writeFileSync(path.join(child, 'package.json'), '{"name":"child"}');
  fs.mkdirSync(path.join(child, 'src')); fs.writeFileSync(path.join(child, 'src', 'one.ts'), 'export const one=1;');
  initRepo(child); ctx(child, 'new', 'module', 'child', '--covers', 'src/**');
  sh('git', ['add', '-A'], dir); sh('git', ['commit', '-qm', 'child'], dir);
  fs.appendFileSync(path.join(child, 'src', 'one.ts'), '// change');
  fs.appendFileSync(path.join(dir, 'src', 'auth', 'session.ts'), '// parent change');
  const data = JSON.parse(ctx(child, 'impact', '--json').out);
  assert(data.changedCode === 1 && data.pages.some((p) => p.hits.includes('src/one.ts')), 'nested project status paths leaked parent prefix/files');
  assert(JSON.parse(ctx(child, 'stale', '--json').out).items.some((p) => p.hits.includes('src/one.ts')), 'nested git log/diff do not route');
});

test('reliability invalid since commit fails instead of reporting clean', (dir) => {
  initRepo(dir);
  const r = ctx(dir, 'impact', '--since', 'does-not-exist', '--json');
  assert(r.code !== 0 && JSON.parse(r.out).ok === false, 'invalid revision silently ignored');
});

test('reliability malformed config diagnoses and setup does not partly mutate', (dir) => {
  fs.mkdirSync(path.join(dir, 'context'));
  const cfg = path.join(dir, 'context', '.ctx.json');
  for (const text of ['{broken', 'null', '{"alwaysRead":"wrong-type"}']) {
    fs.writeFileSync(cfg, text);
    const r = sh('node', [CTX_SRC, 'setup', '--root', dir], dir);
    assert(r.code !== 0 && !r.out.includes('TypeError'), 'setup did not reject malformed config cleanly');
    assert(!fs.existsSync(path.join(dir, 'AGENTS.md')), 'malformed config caused partial setup');
    const doctor = sh('node', [CTX_SRC, 'doctor', '--root', dir, '--json'], dir);
    assert(doctor.code !== 0 && JSON.parse(doctor.out).ok === false, 'doctor must emit diagnostics for malformed config');
  }
  fs.rmSync(cfg);
  const doctor = sh('node', [CTX_SRC, 'doctor', '--root', dir, '--json'], dir);
  assert(doctor.code !== 0 && JSON.parse(doctor.out).ok === false, 'doctor crashed on missing config');
});

test('reliability hook accepts null and nonobject input without crashes', (dir) => {
  initRepo(dir); sh('git', ['add', '-A'], dir); sh('git', ['commit', '-qm', 'base'], dir);
  for (const payload of [null, [], 'not-an-object', 42]) for (const which of ['stop', 'session-start']) {
    const r = ctxHook(dir, which, payload);
    assert(r.code === 0 && !r.out.includes('TypeError'), `hook crashed on ${JSON.stringify(payload)}: ${r.out}`);
  }
});

test('reliability stop ignores prior commits and blocks uncovered working code', (dir) => {
  initRepo(dir); sh('git', ['add', '-A'], dir); sh('git', ['commit', '-qm', 'base'], dir);
  fs.appendFileSync(path.join(dir, 'src', 'auth', 'session.ts'), '// change');
  sh('git', ['add', '-A'], dir); sh('git', ['commit', '-qm', 'prior-session-code'], dir);
  assert(ctxHook(dir, 'stop', {}).code === 0, 'clean session blocked because of previous commit');
  fs.writeFileSync(path.join(dir, 'src', 'uncovered.ts'), 'export const uncovered=1;');
  fs.appendFileSync(path.join(dir, 'memory.md'), '\nUpdated handoff');
  const r = ctxHook(dir, 'stop', {});
  assert(r.code === 2 && r.out.includes('uncovered.ts'), 'uncovered source passed Stop gate');
});

/* ---- routing regressions */
function routingPage(dir, name, body, extra = '') {
  fs.writeFileSync(path.join(dir, 'context', `${name}.md`), `---\ntitle: ${name}\ntype: module\nstatus: active\nsummary: routing contract\nupdated: 2026-10-14\n${extra}---\n\n# ${name}\n\n## TL;DR\n${body}\n`);
}

test('brief JSON exposes reasons, TLDR and verification needs', (dir) => {
  initRepo(dir);
  routingPage(dir, 'routing', '- Route requests safely', 'covers: [src/auth/**]\nconfidence: inferred\n');
  const r = ctx(dir, 'brief', 'src/auth/session.ts', '--json');
  const data = JSON.parse(r.out);
  assert(data.command === 'brief' && typeof data.ok === 'boolean', 'brief JSON contract');
  const page = data.pages.find((p) => p.page === 'context/routing.md');
  assert(page && page.reasons.includes('covers src/auth/session.ts'), 'missing cover reason');
  assert(page.verificationRequired && page.confidence === 'inferred', 'inferred claim must be verified');
  assert(page.tldr.includes('- Route requests safely'), 'missing TLDR');
});

test('brief enforces budget even for the first matching page', (dir) => {
  initRepo(dir);
  routingPage(dir, 'huge', 'routing '.repeat(1200), 'covers: [src/auth/**]\n');
  const cfg = path.join(dir, 'context', '.ctx.json');
  fs.writeFileSync(cfg, JSON.stringify({ alwaysRead: [] }));
  const r = ctx(dir, 'brief', 'src/auth/session.ts', '--budget', '100', '--json');
  const data = JSON.parse(r.out);
  assert(data.estimatedTokens <= 100 && data.pages.length === 0, 'first page must not bypass budget');
  assert(data.skipped.some((p) => p.page === 'context/huge.md' && p.reason === 'budget'), 'budget omission must be visible');
});

test('brief reports mandatory orientation overflow without adding pages', (dir) => {
  initRepo(dir);
  const data = JSON.parse(ctx(dir, 'brief', 'auth', '--budget', '1', '--json').out);
  assert(data.budgetExceeded && !data.ok && data.pages.length === 0, 'mandatory overflow must be explicit');
  assert(data.alwaysRead.length > 0, 'do not silently drop orientation');
});

test('brief excludes history unless requested and normalizes Windows paths', (dir) => {
  initRepo(dir);
  routingPage(dir, 'retired', '- historical contract', 'covers: [src/auth/**]\n');
  const p = path.join(dir, 'context', 'retired.md');
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace('status: active', 'status: superseded'));
  routingPage(dir, 'current', '- current contract', 'covers: [src/auth/**]\nconfidence: verified\n');
  const data = JSON.parse(ctx(dir, 'brief', 'src\\auth\\session.ts', '--json').out);
  assert(data.pages.some((p) => p.page === 'context/current.md' && p.reasons.includes('covers src/auth/session.ts')), 'Windows paths do not route');
  assert(!data.pages.some((p) => p.page === 'context/retired.md'), 'retired instructions leaked into current routing');
  const hist = JSON.parse(ctx(dir, 'brief', 'src/auth/session.ts', '--history', '--json').out);
  assert(hist.pages.some((p) => p.page === 'context/retired.md' && p.verificationRequired), 'explicit history should be labelled');
});

test('brief flags stale pages and unavailable git without claiming trust', (dir) => {
  initRepo(dir);
  routingPage(dir, 'current', '- auth contract', 'covers: [src/auth/**]\nconfidence: verified\n');
  sh('git', ['add', '-A'], dir);
  sh('git', ['commit', '-qm', 'base'], dir);
  fs.appendFileSync(path.join(dir, 'src', 'auth', 'session.ts'), '// changed\n');
  let data = JSON.parse(ctx(dir, 'brief', 'src/auth/session.ts', '--json').out);
  assert(data.pages.find((p) => p.page === 'context/current.md').stale, 'stale claim not labelled');
  fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true });
  data = JSON.parse(ctx(dir, 'brief', 'src/auth/session.ts', '--json').out);
  assert(data.gitAvailable === false && data.pages.find((p) => p.page === 'context/current.md').verificationRequired, 'no git cannot establish freshness');
});

test('brief rejects invalid numeric limits and emits JSON errors', (dir) => {
  initRepo(dir);
  for (const args of [['--budget', 'NaN'], ['--budget', '-1'], ['--limit', '0'], ['--limit', '1.5']]) {
    const r = ctx(dir, 'brief', 'auth', ...args, '--json');
    assert(r.code !== 0, `invalid flag accepted: ${args}`);
    const data = JSON.parse(r.out);
    assert(data.command === 'brief' && data.ok === false && data.error, 'invalid flag must be actionable JSON');
  }
});

test('brief fits smaller pages and does not double-count mandatory reads', (dir) => {
  initRepo(dir);
  routingPage(dir, 'huge', 'routing '.repeat(1000), 'covers: [src/auth/**]\n');
  routingPage(dir, 'small', '- routing contract', 'confidence: verified\n');
  const cfg = path.join(dir, 'context', '.ctx.json');
  fs.writeFileSync(cfg, JSON.stringify({ alwaysRead: ['context/small.md', 'context/small.md'] }));
  let data = JSON.parse(ctx(dir, 'brief', 'routing', '--json').out);
  assert(data.alwaysRead.length === 1 && !data.pages.some((p) => p.page === 'context/small.md'), 'mandatory page counted twice');
  fs.writeFileSync(cfg, JSON.stringify({ alwaysRead: [] }));
  data = JSON.parse(ctx(dir, 'brief', 'src/auth/session.ts', 'routing', '--budget', '200', '--json').out);
  assert(data.pages.some((p) => p.page === 'context/small.md') && data.estimatedTokens <= 200, 'a large top result must not starve a fitting page');
});

test('brief refuses unsafe orientation paths before reading', (dir) => {
  initRepo(dir);
  const cfg = path.join(dir, 'context', '.ctx.json');
  for (const file of ['../outside.md', '.env.local', path.resolve(dir, 'AGENTS.md')]) {
    fs.writeFileSync(cfg, JSON.stringify({ alwaysRead: [file] }));
    const r = ctx(dir, 'brief', 'auth', '--json');
    assert(r.code !== 0, `unsafe orientation accepted: ${file}`);
    assert(JSON.parse(r.out).ok === false, 'unsafe path must emit an actionable error');
  }
});

test('module templates and generated pages do not claim unearned verification', (dir) => {
  const template = fs.readFileSync(path.join(HERE, '..', 'assets', 'module.md.template'), 'utf8');
  assert(/^status: draft$/m.test(template) && /^confidence: inferred$/m.test(template), 'fresh module template must start draft/inferred');
  initRepo(dir);
  ctx(dir, 'new', 'module', 'knowledge');
  const page = fs.readFileSync(path.join(dir, 'context', 'codebase', 'modules', 'knowledge.md'), 'utf8');
  assert(/^status: draft$/m.test(page) && /^confidence: inferred$/m.test(page), 'copied CLI must also start draft/inferred');
});

test('brief does not mistake touched documentation for verified dirty sources', (dir) => {
  initRepo(dir);
  routingPage(dir, 'current', '- auth contract', 'covers: [src/auth/**]\nconfidence: verified\n');
  sh('git', ['add', '-A'], dir); sh('git', ['commit', '-qm', 'base'], dir);
  fs.appendFileSync(path.join(dir, 'src', 'auth', 'session.ts'), '// changed\n');
  fs.appendFileSync(path.join(dir, 'context', 'current.md'), '\nUnrelated typo fix\n');
  const data = JSON.parse(ctx(dir, 'brief', 'src/auth/session.ts', '--json').out);
  const page = data.pages.find((p) => p.page === 'context/current.md');
  assert(page.verificationRequired && page.changedSources.includes('src/auth/session.ts'), 'touching page must not certify code freshness');
});

test('brief checks trust and history for mandatory module pages too', (dir) => {
  initRepo(dir);
  routingPage(dir, 'mandatory', '- routing contract', 'covers: [src/auth/**]\nconfidence: inferred\n');
  const cfg = path.join(dir, 'context', '.ctx.json');
  fs.writeFileSync(cfg, JSON.stringify({ alwaysRead: ['context/mandatory.md'] }));
  let data = JSON.parse(ctx(dir, 'brief', 'auth', '--json').out);
  assert(!data.ok && data.alwaysRead[0].verificationRequired, 'mandatory page bypassed trust checks');
  const page = path.join(dir, 'context', 'mandatory.md');
  fs.writeFileSync(page, fs.readFileSync(page, 'utf8').replace('status: active', 'status: superseded'));
  const r = ctx(dir, 'brief', 'auth', '--json');
  assert(r.code !== 0 && JSON.parse(r.out).error.includes('retired'), 'mandatory history bypassed opt-in');
  data = JSON.parse(ctx(dir, 'brief', 'auth', '--history', '--json').out);
  assert(data.alwaysRead[0].verificationRequired, 'explicit mandatory history was not labelled');
});

test('brief ignores literal placeholder examples inside code', (dir) => {
  initRepo(dir);
  routingPage(dir, 'routing', '- Use the documented format\n\nExample: `{{PLACEHOLDER}}` names a template marker.', 'confidence: verified\n');
  const data = JSON.parse(ctx(dir, 'brief', 'routing', '--json').out);
  const page = data.pages.find((p) => p.page === 'context/routing.md');
  assert(page && !page.warnings.some((w) => w.startsWith('UNFILLED')), 'literal example was mistaken for an unfinished page');
});

/* ---- ownership and host-adapter regressions */
test('ownership scaffold includes canonical resources and linked host adapters', (dir) => {
  setupRepo(dir, ['--pointers']);
  for (const f of ['memory.md', 'context/decisions.md', 'context/ownership.md', '.agents/README.md', '.agents/agents/context-explorer.md', '.agents/agents/context-reviewer.md', '.agents/rules/testing.md']) assert(fs.existsSync(path.join(dir, f)), `missing owner: ${f}`);
  assert(fs.statSync(path.join(dir, '.agents', 'skills')).isDirectory(), 'canonical local skill directory missing');
  for (const [native, source] of [['.claude/agents/context-explorer.md', '.agents/agents/context-explorer.md'], ['.claude/rules/testing.md', '.agents/rules/testing.md'], ['.cursor/rules/testing.mdc', '.agents/rules/testing.md']]) {
    const text = fs.readFileSync(path.join(dir, native), 'utf8');
    assertContains(text, `ctx_source: ${JSON.stringify(source)}`, 'native adapter must route to canonical owner');
    assert(!text.includes('Your memory:') && !text.includes('Procedure:'), 'canonical instruction body copied into native adapter');
  }
});

test('ownership copied CLI creates internal agent rule and skill resources', (dir) => {
  setupRepo(dir);
  for (const type of ['agent', 'rule', 'skill']) {
    const r = ctx(dir, 'new', type, 'local-check', '--covers', 'src/auth/**');
    assert(r.code === 0, `${type} creation failed: ${r.out}`);
  }
  for (const f of ['.agents/agents/local-check.md', '.agents/rules/local-check.md', '.agents/skills/local-check/SKILL.md', '.claude/agents/local-check.md', '.cursor/rules/local-check.mdc', '.claude/skills/local-check/SKILL.md', '.cursor/skills/local-check/SKILL.md']) assert(fs.existsSync(path.join(dir, f)), `resource/adaptor not created: ${f}`);
  assert(!fs.existsSync(path.join(dir, 'context', 'local-check.md')), 'agent resources were misfiled as wiki pages');
  const checked = ctx(dir, 'adapters', '--check', '--json');
  assert(checked.code === 0, 'fresh adapters must be synchronized');
  assert(JSON.parse(checked.out).resources.every((r) => !('body' in r) && !('text' in r)), 'audit JSON unnecessarily dumped canonical bodies twice');
});

test('ownership adapter refresh derives metadata but never copies rule bodies', (dir) => {
  setupRepo(dir);
  ctx(dir, 'new', 'rule', 'local-route', '--covers', 'src/auth/**');
  const source = path.join(dir, '.agents', 'rules', 'local-route.md');
  let text = fs.readFileSync(source, 'utf8');
  text = text.replace('src/auth/**', 'src/billing/**') + '\nUNIQUE DOMAIN CONTRACT MUST LIVE ONLY HERE\n';
  fs.writeFileSync(source, text);
  assert(ctx(dir, 'adapters', '--check', '--json').code !== 0, 'stale native metadata not detected');
  assert(ctx(dir, 'adapters', '--json').code === 0, 'safe generated adapter refresh failed');
  for (const f of ['.claude/rules/local-route.md', '.cursor/rules/local-route.mdc']) {
    const adapter = fs.readFileSync(path.join(dir, f), 'utf8');
    assertContains(adapter, 'src/billing/**', 'derived glob metadata stale');
    assert(!adapter.includes('UNIQUE DOMAIN CONTRACT'), 'adapter duplicated canonical data');
  }
  assert(ctx(dir, 'adapters', '--check', '--json').code === 0, 'refreshed adapter drift remains');
});

test('ownership adapter refresh preserves hand edits and reports conflicts', (dir) => {
  setupRepo(dir);
  const file = path.join(dir, '.claude', 'rules', 'testing.md');
  const edited = fs.readFileSync(file, 'utf8') + '\nHUMAN EDIT DO NOT ERASE\n';
  fs.writeFileSync(file, edited);
  const r = ctx(dir, 'adapters', '--json');
  assert(r.code !== 0 && JSON.parse(r.out).ok === false, 'hand-edited adapter conflict hidden');
  assert(fs.readFileSync(file, 'utf8') === edited, 'hand edits clobbered');
});

test('ownership explicit migration preserves sole legacy agent content', (dir) => {
  setupRepo(dir);
  const legacy = path.join(dir, '.claude', 'agents', 'custom-reader.md');
  const original = '---\nname: custom-reader\ndescription: Custom investigator\ntools: Read, Grep\n---\n\nHUMAN AUTHORED ROLE CONTRACT\n';
  fs.writeFileSync(legacy, original);
  assert(ctx(dir, 'adapters', '--check', '--json').code !== 0, 'unmanaged native resource was not surfaced');
  assert(ctx(dir, 'adapters', '--migrate', '--json').code === 0, 'explicit sole-owner migration failed');
  const source = path.join(dir, '.agents', 'agents', 'custom-reader.md');
  assert(fs.readFileSync(source, 'utf8') === original, 'migration changed the authored contract');
  assertContains(fs.readFileSync(legacy, 'utf8'), 'ctx_source: ".agents/agents/custom-reader.md"');
  assert(!fs.readFileSync(legacy, 'utf8').includes('HUMAN AUTHORED ROLE'), 'migration left two editable bodies');
});

test('ownership competing legacy and canonical bodies refuse automatic merge', (dir) => {
  setupRepo(dir);
  ctx(dir, 'new', 'agent', 'contested');
  const native = path.join(dir, '.claude', 'agents', 'contested.md');
  const source = path.join(dir, '.agents', 'agents', 'contested.md');
  const canonical = fs.readFileSync(source, 'utf8');
  fs.writeFileSync(native, '---\nname: contested\ndescription: Other contract\n---\n\nHUMAN NATIVE OWNER\n');
  const r = ctx(dir, 'adapters', '--migrate', '--json');
  assert(r.code !== 0, 'conflicting instruction owners were silently resolved');
  assert(fs.readFileSync(source, 'utf8') === canonical && fs.readFileSync(native, 'utf8').includes('HUMAN NATIVE OWNER'), 'automatic merge lost a competing owner');
});

test('ownership rules query includes canonical routes and native Cursor mdc', (dir) => {
  setupRepo(dir);
  fs.writeFileSync(path.join(dir, '.cursor', 'rules', 'custom.mdc'), '---\ndescription: Custom billing\nglobs: src/billing/**\n---\nRead context/decisions.md\n');
  ctx(dir, 'new', 'rule', 'auth-route', '--covers', 'src/auth/**');
  const auth = JSON.parse(ctx(dir, 'rules', 'src/auth/session.ts', '--json').out).matches[0];
  assert(auth.rules.includes('.agents/rules/auth-route.md'), 'canonical rule not routed');
  assert(!auth.rules.includes('.claude/rules/auth-route.md') && !auth.rules.includes('.cursor/rules/auth-route.mdc'), 'same canonical rule routed more than once');
  const billing = JSON.parse(ctx(dir, 'rules', 'src/billing/charge.ts', '--json').out).matches[0];
  assert(billing.rules.includes('.cursor/rules/custom.mdc'), 'native .mdc rule ignored');
});

test('ownership lint catches missing owners and broken canonical adapter sources', (dir) => {
  setupRepo(dir);
  const owner = path.join(dir, 'context', 'ownership.md');
  fs.renameSync(owner, owner + '.saved');
  let data = JSON.parse(ctx(dir, 'lint', '--json').out);
  assert(data.errors.some((e) => e.includes('ownership.md')), 'missing ownership contract passed lint');
  fs.renameSync(owner + '.saved', owner);
  const file = path.join(dir, '.claude', 'rules', 'testing.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('ctx_source: ".agents/rules/testing.md"', 'ctx_source: ".agents/rules/missing.md"'));
  data = JSON.parse(ctx(dir, 'lint', '--json').out);
  assert(data.errors.some((e) => /adapter|canonical|ctx_source/i.test(e)), 'broken canonical route passed lint');
});

test('ownership lint flags exact repeated live prose but not historical snapshots', (dir) => {
  setupRepo(dir);
  const claim = 'Billing entries are settled only after both the ledger record and the provider acknowledgement have been durably recorded, and every failed settlement remains available for an explicit operator retry rather than being silently discarded.';
  for (const [file, status] of [['first.md', 'active'], ['second.md', 'active'], ['history.md', 'complete']]) fs.writeFileSync(path.join(dir, 'context', file), `---\ntitle: ${file}\ntype: guide\nstatus: ${status}\nsummary: Billing invariant\nupdated: 2026-10-14\n---\n\n# Billing\n\n## TL;DR\n\n${claim}\n`);
  let data = JSON.parse(ctx(dir, 'lint', '--json').out);
  assert(data.warns.some((w) => /duplicate prose/i.test(w) && w.includes('first.md') && w.includes('second.md')), 'repeated live fact not detected');
  fs.writeFileSync(path.join(dir, 'context', 'second.md'), fs.readFileSync(path.join(dir, 'context', 'second.md'), 'utf8').replace('status: active', 'status: complete'));
  data = JSON.parse(ctx(dir, 'lint', '--json').out);
  assert(!data.warns.some((w) => /duplicate prose/i.test(w) && w.includes('history.md')), 'intentional historical evidence treated as a live owner');
});

test('ownership authoring refuses native collisions before creating another owner', (dir) => {
  setupRepo(dir);
  const native = path.join(dir, '.claude', 'agents', 'existing.md');
  const text = '---\nname: existing\ndescription: Authored role\n---\n\nKEEP THIS ONLY OWNER\n';
  fs.writeFileSync(native, text);
  const r = ctx(dir, 'new', 'agent', 'existing', '--json');
  assert(r.code !== 0 && !fs.existsSync(path.join(dir, '.agents', 'agents', 'existing.md')), 'failed new command left a competing canonical body');
  assert(fs.readFileSync(native, 'utf8') === text, 'native owner changed');
});

test('ownership metadata-shaped adapter body edits cannot bypass preservation', (dir) => {
  setupRepo(dir);
  const file = path.join(dir, '.claude', 'rules', 'testing.md');
  const edited = fs.readFileSync(file, 'utf8') + 'ctx_checksum: HUMAN NOTE\n';
  fs.writeFileSync(file, edited);
  const r = ctx(dir, 'adapters', '--json');
  assert(r.code !== 0 && fs.readFileSync(file, 'utf8') === edited, 'checksum-shaped body edit was overwritten');
});

test('ownership brace globs survive canonical and native metadata roundtrip', (dir) => {
  setupRepo(dir);
  const r = ctx(dir, 'new', 'rule', 'two-areas', '--covers', 'src/{auth,billing}/**');
  assert(r.code === 0, `brace resource creation failed: ${r.out}`);
  for (const file of ['src/auth/session.ts', 'src/billing/charge.ts']) {
    const data = JSON.parse(ctx(dir, 'rules', file, '--json').out);
    assert(data.matches[0].rules.includes('.agents/rules/two-areas.md'), `brace glob lost path: ${file}`);
  }
  assert(ctx(dir, 'adapters', '--check', '--json').code === 0, 'brace metadata did not roundtrip');
});

test('ownership companion skill migration refuses partial relocation', (dir) => {
  setupRepo(dir);
  const legacy = path.join(dir, '.claude', 'skills', 'with-script');
  fs.mkdirSync(legacy, { recursive: true });
  const text = '---\nname: with-script\ndescription: Uses a companion\n---\n\nRun scripts/check.mjs\n';
  fs.writeFileSync(path.join(legacy, 'SKILL.md'), text);
  fs.mkdirSync(path.join(legacy, 'scripts'));
  fs.writeFileSync(path.join(legacy, 'scripts', 'check.mjs'), 'console.log("keep");\n');
  const r = ctx(dir, 'adapters', '--migrate', '--json');
  assert(r.code !== 0 && !fs.existsSync(path.join(dir, '.agents', 'skills', 'with-script')), 'partial skill move created a broken new owner');
  assert(fs.readFileSync(path.join(legacy, 'SKILL.md'), 'utf8') === text && fs.existsSync(path.join(legacy, 'scripts', 'check.mjs')), 'legacy skill resources were lost');
});

test('ownership checks do not mutate and refuse external canonical directories', (dir) => {
  setupRepo(dir);
  const paths = ['.agents/rules/testing.md', '.claude/rules/testing.md', '.cursor/rules/testing.mdc'];
  const before = paths.map((f) => fs.readFileSync(path.join(dir, f), 'utf8'));
  assert(ctx(dir, 'adapters', '--check', '--json').code === 0, 'valid check failed');
  assert(paths.every((f, i) => fs.readFileSync(path.join(dir, f), 'utf8') === before[i]), 'read-only adapter check mutated files');
  const project = path.join(dir, 'project');
  fs.mkdirSync(project);
  setupRepo(project);
  const external = path.join(dir, 'outside');
  fs.mkdirSync(external);
  fs.writeFileSync(path.join(external, 'SKILL.md'), 'PRIVATE OUTSIDE MARKER');
  fs.symlinkSync(external, path.join(project, '.agents', 'skills', 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
  const r = ctx(project, 'adapters', '--check', '--json');
  assert(r.code !== 0 && !r.out.includes('PRIVATE OUTSIDE MARKER'), 'external canonical data was followed or exposed');
});

test('ownership linked factual duplicates warn without treating routes as facts', (dir) => {
  setupRepo(dir);
  const claim = 'The settlement service must preserve the provider acknowledgement and the durable ledger entry together before marking the transaction complete, and failed operations remain visible for an explicit retry rather than being discarded.';
  for (const name of ['linked-a', 'linked-b']) fs.writeFileSync(path.join(dir, 'context', `${name}.md`), `---\ntitle: ${name}\ntype: guide\nstatus: active\nsummary: Settlement behavior\nupdated: 2026-10-14\n---\n\n# Settlement\n\n${claim} [Evidence](../README.md)\n`);
  const data = JSON.parse(ctx(dir, 'lint', '--json').out);
  assert(data.warns.some((w) => /duplicate prose/i.test(w) && w.includes('linked-a') && w.includes('linked-b')), 'adding a source link concealed copied live facts');
});

test('ownership legacy resource names produce valid escaped markdown links', (dir) => {
  setupRepo(dir);
  const name = 'caf\u00e9 reader';
  fs.writeFileSync(path.join(dir, '.claude', 'agents', `${name}.md`), '---\nname: reader\ndescription: Legacy reader\n---\n\nRead-only local role.\n');
  assert(ctx(dir, 'adapters', '--migrate', '--json').code === 0, 'legacy filename migration failed');
  const text = fs.readFileSync(path.join(dir, '.claude', 'agents', `${name}.md`), 'utf8');
  assertContains(text, `${encodeURIComponent(name)}.md)`, 'native pointer did not escape spaces/Unicode for Markdown');
});

/* ---- native symbolic-link regressions */
function requireNativeLinks(dir) {
  const probe = path.join(dir, 'native-link-probe');
  fs.mkdirSync(probe);
  try {
    fs.writeFileSync(path.join(probe, 'owner'), 'probe');
    fs.symlinkSync('owner', path.join(probe, 'alias'), 'file');
    fs.mkdirSync(path.join(probe, 'owner-dir'));
    fs.symlinkSync('owner-dir', path.join(probe, 'alias-dir'), 'dir');
  } catch (e) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(e.code)) {
      const skip = new Error(`native link privilege unavailable (${e.code}); no success simulated`);
      skip.nativeSkip = true;
      throw skip;
    }
    throw e;
  } finally {
    assert(path.resolve(probe) === path.join(path.resolve(dir), 'native-link-probe'), 'unexpected probe cleanup target');
    fs.rmSync(probe, { recursive: true, force: true });
  }
}
function nativeSetup(dir) {
  const r = sh('node', [CTX_SRC, 'setup', '--root', dir], dir);
  assert(r.code === 0, `native setup failed: ${r.out}`);
  return r;
}
function denyLinkCreation(dir) {
  const hook = path.join(dir, 'deny-link-creation.cjs');
  fs.writeFileSync(hook, 'const fs=require("node:fs"); fs.symlinkSync=()=>{const e=new Error("test denied native symlinks");e.code="EPERM";throw e;};\n');
  return { NODE_OPTIONS: `--require "${hook.replace(/\\/g, '/')}"` };
}

test('symlinks default setup creates real relative aliases and enables local Git', (dir) => {
  requireNativeLinks(dir);
  nativeSetup(dir);
  for (const [file, target] of [['CLAUDE.md', 'AGENTS.md'], ['GEMINI.md', 'AGENTS.md'], ['.github/copilot-instructions.md', '../AGENTS.md'], ['.claude/agents', '../.agents/agents'], ['.claude/rules', '../.agents/rules'], ['.claude/skills', '../.agents/skills'], ['.cursor/skills', '../.agents/skills'], ['.cursor/rules', '../.agents/views/cursor/rules']]) {
    const abs = path.join(dir, file);
    assert(fs.lstatSync(abs).isSymbolicLink(), `${file} is a regular copy, not a native symlink`);
    assert(fs.readlinkSync(abs).replace(/\\/g, '/') === target, `${file} has the wrong/absolute target`);
  }
  assert(sh('git', ['config', '--local', '--get', 'core.symlinks'], dir).out.trim() === 'true', 'repo-local Git symlinks not enabled');
  const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'context', '.ctx.json'), 'utf8'));
  assert(cfg.resourceMode === 'symlink', 'new setup did not persist the real-link strategy');
  assert(ctx(dir, 'symlinks', '--check', '--json').code === 0, 'native link audit failed');
});

test('symlinks canonical edits and skills remain visible through one directory owner', (dir) => {
  requireNativeLinks(dir);
  nativeSetup(dir);
  const source = path.join(dir, '.agents', 'agents', 'context-explorer.md');
  fs.appendFileSync(source, '\nONE LIVE BODY\n');
  assert(fs.readFileSync(path.join(dir, '.claude', 'agents', 'context-explorer.md'), 'utf8').includes('ONE LIVE BODY'), 'native host does not see canonical changes');
  assert(ctx(dir, 'new', 'skill', 'shared-check').code === 0, 'internal linked skill creation failed');
  const canonical = path.join(dir, '.agents', 'skills', 'shared-check', 'SKILL.md');
  assert(fs.realpathSync(canonical) === fs.realpathSync(path.join(dir, '.claude', 'skills', 'shared-check', 'SKILL.md')) && fs.realpathSync(canonical) === fs.realpathSync(path.join(dir, '.cursor', 'skills', 'shared-check', 'SKILL.md')), 'skill bodies were copied into host folders');
  const matches = JSON.parse(ctx(dir, 'rules', 'tests/anything.mjs', '--json').out).matches[0];
  assert(matches.rules.filter((f) => f.endsWith('testing.md') || f.endsWith('testing.mdc')).length === 1, 'native aliases are treated as separate rules');
});

test('symlinks Git stages actual links as mode 120000 not copied bodies', (dir) => {
  requireNativeLinks(dir);
  nativeSetup(dir);
  assert(sh('git', ['add', '-A'], dir).code === 0, 'could not stage disposable fixture');
  const staged = sh('git', ['ls-files', '--stage'], dir).out;
  assert(/120000 [^\n]*\tCLAUDE\.md/m.test(staged) && /120000 [^\n]*\t\.claude\/agents/m.test(staged), 'Git index stores ordinary copies rather than symlinks');
  assert(sh('git', ['show', ':CLAUDE.md'], dir).out === 'AGENTS.md', 'Git stored the master body instead of its link target');
  assert(sh('git', ['show', ':.claude/agents'], dir).out === '../.agents/agents', 'Git stored a non-portable directory target');
});

test('symlinks permission denial fails before project copies and never falls back', (dir) => {
  const env = denyLinkCreation(dir);
  const r = sh('node', [CTX_SRC, 'setup', '--root', dir], dir, env);
  assert(r.code !== 0, 'native permission denial silently used pointer copies');
  assert(/Developer Mode|symbolic.link privilege|EPERM/i.test(r.out), `permission error lacks the Windows prerequisite: ${r.out}`);
  assert(!fs.existsSync(path.join(dir, 'AGENTS.md')) && !fs.existsSync(path.join(dir, 'CLAUDE.md')), 'denied preflight created duplicate project files');
});

test('symlinks existing valid layout works without new link creation permission', (dir) => {
  requireNativeLinks(dir);
  nativeSetup(dir);
  const env = denyLinkCreation(dir);
  for (const args of [['symlinks', '--check', '--json'], ['adapters', '--json'], ['new', 'agent', 'another-reader', '--json']]) {
    const r = sh('node', [path.join(dir, 'context', 'ctx.mjs'), ...args], dir, env);
    assert(r.code === 0, `existing linked layout incorrectly needs Developer Mode: ${args} ${r.out}`);
  }
});

test('symlinks migration preserves conflicting custom native owners', (dir) => {
  requireNativeLinks(dir);
  setupRepo(dir);
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '@AGENTS.md\n');
  const file = path.join(dir, '.claude', 'agents', 'private-reader.md');
  const text = '---\nname: private-reader\ndescription: Keep my owner\n---\n\nCUSTOM CONTENT KEEP\n';
  fs.writeFileSync(file, text);
  const r = ctx(dir, 'symlinks', '--migrate', '--json');
  assert(r.code !== 0 && fs.readFileSync(file, 'utf8') === text, 'custom native content was erased during migration');
  assert(!fs.lstatSync(path.join(dir, '.claude', 'agents')).isSymbolicLink(), 'conflicting native folder was replaced');
});

test('symlinks intact managed pointer folders migrate without a second body', (dir) => {
  requireNativeLinks(dir);
  setupRepo(dir);
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '@AGENTS.md\n');
  const before = fs.readFileSync(path.join(dir, '.agents', 'agents', 'context-explorer.md'), 'utf8');
  const r = ctx(dir, 'symlinks', '--migrate', '--json');
  assert(r.code === 0, `managed pointer migration failed: ${r.out}`);
  assert(fs.lstatSync(path.join(dir, '.claude', 'agents')).isSymbolicLink(), 'directory stayed a copied adapter tree');
  assert(fs.readFileSync(path.join(dir, '.agents', 'agents', 'context-explorer.md'), 'utf8') === before, 'canonical owner changed during migration');
});

test('symlinks concurrent native edits are preserved during migration validation', (dir) => {
  requireNativeLinks(dir);
  setupRepo(dir);
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '@AGENTS.md\n');
  const native = path.join(dir, '.claude', 'agents', 'context-explorer.md');
  const hook = path.join(dir, 'edit-during-validation.cjs');
  const marker = path.join(dir, 'validation-injected');
  fs.writeFileSync(hook, `const fs=require('node:fs');const target=${JSON.stringify(native)};const read=fs.readFileSync;let edited=false;fs.readFileSync=function(file,...args){const data=read.call(fs,file,...args);if(!edited&&String(file)===target&&args[0]==='utf8'){edited=true;fs.writeFileSync(${JSON.stringify(marker)},'hit');fs.appendFileSync(target,'\\nCONCURRENT HUMAN CHANGE\\n');}return data;};\n`);
  const r = sh('node', [path.join(dir, 'context', 'ctx.mjs'), 'symlinks', '--migrate', '--json'], dir, { NODE_OPTIONS: `--require "${hook.replace(/\\/g, '/')}"` });
  assert(fs.existsSync(marker), `validation edit was never injected: ${r.out}`);
  assert(r.code !== 0 && fs.readFileSync(native, 'utf8').includes('CONCURRENT HUMAN CHANGE'), `concurrent native edit lost: ${r.out}`);
  assert(!fs.lstatSync(path.dirname(native)).isSymbolicLink(), 'validation failure replaced the edited native directory');
  assert(JSON.parse(fs.readFileSync(path.join(dir, 'context', '.ctx.json'), 'utf8')).resourceMode === 'pointer', 'validation failure committed native mode');
});

test('symlinks concurrent configuration edits survive Git setup and rollback', (dir) => {
  requireNativeLinks(dir);
  setupRepo(dir);
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '@AGENTS.md\n');
  const cfgPath = path.join(dir, 'context', '.ctx.json');
  const hook = path.join(dir, 'edit-during-git.cjs');
  fs.writeFileSync(hook, `const fs=require('node:fs');const cp=require('node:child_process');const run=cp.execFileSync;let edited=false;cp.execFileSync=function(cmd,args,...rest){if(!edited&&cmd==='git'&&args.join(' ')==='config --local core.symlinks true'){edited=true;const file=${JSON.stringify(cfgPath)};const cfg=JSON.parse(fs.readFileSync(file,'utf8'));cfg.humanNote='CONCURRENT CONFIG CHANGE';fs.writeFileSync(file,JSON.stringify(cfg));}return run.call(cp,cmd,args,...rest);};require('node:module').syncBuiltinESMExports();\n`);
  const r = sh('node', [path.join(dir, 'context', 'ctx.mjs'), 'symlinks', '--migrate', '--json'], dir, { NODE_OPTIONS: `--require "${hook.replace(/\\/g, '/')}"` });
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  assert(r.code !== 0 && cfg.humanNote === 'CONCURRENT CONFIG CHANGE' && cfg.resourceMode === 'pointer', `concurrent configuration edit lost: ${r.out}`);
  assert(!fs.lstatSync(path.join(dir, '.claude', 'agents')).isSymbolicLink(), 'failed install did not restore native pointer folder');
});

test('symlinks portable pointer opt-out cannot overwrite an existing linked layout', (dir) => {
  requireNativeLinks(dir);
  nativeSetup(dir);
  const view = path.join(dir, '.agents', 'views', 'cursor', 'rules', 'testing.mdc');
  const before = fs.readFileSync(view, 'utf8');
  const r = sh('node', [CTX_SRC, 'setup', '--root', dir, '--portable-pointers'], dir);
  assert(r.code !== 0 && fs.readFileSync(view, 'utf8') === before, 'failed reverse strategy switch rewrote a linked central view');
  assert(JSON.parse(fs.readFileSync(path.join(dir, 'context', '.ctx.json'), 'utf8')).resourceMode === 'symlink', 'installed link mode changed without reverse migration');
});

test('symlinks rollback does not overwrite a concurrent replacement at the destination', (dir) => {
  requireNativeLinks(dir);
  setupRepo(dir);
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '@AGENTS.md\n');
  const target = path.join(dir, 'CLAUDE.md');
  const hook = path.join(dir, 'occupied-rollback.cjs');
  const marker = path.join(dir, 'rollback-injected');
  fs.writeFileSync(hook, `const fs=require('node:fs');const rename=fs.renameSync;const target=${JSON.stringify(target)};let injected=false;fs.renameSync=function(from,to){if(!injected&&String(to)===target&&String(from).endsWith('-new')){injected=true;fs.writeFileSync(${JSON.stringify(marker)},'hit');fs.writeFileSync(target,'CONCURRENT DESTINATION CONTENT');const e=new Error('test publication failure');e.code='EACCES';throw e;}return rename.call(fs,from,to);};\n`);
  const r = sh('node', [path.join(dir, 'context', 'ctx.mjs'), 'symlinks', '--migrate', '--json'], dir, { NODE_OPTIONS: `--require "${hook.replace(/\\/g, '/')}"` });
  assert(fs.existsSync(marker), `occupied rollback was never injected: ${r.out}`);
  assert(r.code !== 0 && fs.readFileSync(target, 'utf8') === 'CONCURRENT DESTINATION CONTENT', `rollback overwrote a new destination: ${r.out}`);
  const data = JSON.parse(r.out);
  const backup = data.recovery?.find((file) => file.endsWith('-backup') && !file.includes('/'));
  assert(backup && fs.readFileSync(path.join(dir, backup), 'utf8') === '@AGENTS.md\n', 'original loader notes not preserved in reported recovery backup');
});

test('symlinks rollback preserves view edits made after publication', (dir) => {
  requireNativeLinks(dir);
  setupRepo(dir);
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '@AGENTS.md\n');
  const viewDir = path.join(dir, '.agents', 'views', 'cursor', 'rules');
  const target = path.join(dir, 'CLAUDE.md');
  const hook = path.join(dir, 'published-view-edit.cjs');
  const marker = path.join(dir, 'view-edit-injected');
  fs.writeFileSync(hook, `const fs=require('node:fs');const path=require('node:path');const rename=fs.renameSync;const view=${JSON.stringify(viewDir)},target=${JSON.stringify(target)};fs.renameSync=function(from,to){if(String(to)===target&&String(from).endsWith('-new'))throw new Error('test later alias failure');const result=rename.call(fs,from,to);if(String(to)===view){fs.writeFileSync(${JSON.stringify(marker)},'hit');fs.appendFileSync(path.join(view,'testing.mdc'),'\\nPUBLISHED HUMAN VIEW EDIT\\n');}return result;};\n`);
  const r = sh('node', [path.join(dir, 'context', 'ctx.mjs'), 'symlinks', '--migrate', '--json'], dir, { NODE_OPTIONS: `--require "${hook.replace(/\\/g, '/')}"` });
  assert(fs.existsSync(marker), `published view edit was never injected: ${r.out}`);
  assert(r.code !== 0 && fs.existsSync(path.join(viewDir, 'testing.mdc')) && fs.readFileSync(path.join(viewDir, 'testing.mdc'), 'utf8').includes('PUBLISHED HUMAN VIEW EDIT'), `rollback removed a published edit: ${r.out}`);
  const data = JSON.parse(r.out);
  assert(data.recovery?.includes('.agents/views/cursor/rules'), 'edited published view not reported for recovery');
  assert(fs.readFileSync(target, 'utf8') === '@AGENTS.md\n', 'later alias failure lost original loader notes');
});

test('symlinks failed fresh install does not claim an installed symlink mode', (dir) => {
  requireNativeLinks(dir);
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), 'CUSTOM CLAUDE NOTES KEEP');
  const r = sh('node', [CTX_SRC, 'setup', '--root', dir], dir);
  assert(r.code !== 0 && fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8') === 'CUSTOM CLAUDE NOTES KEEP', 'custom fresh entrypoint was overwritten');
  const cfgPath = path.join(dir, 'context', '.ctx.json');
  if (fs.existsSync(cfgPath)) assert(JSON.parse(fs.readFileSync(cfgPath, 'utf8')).resourceMode !== 'symlink', 'failed installation falsely persisted native link mode');
  const again = sh('node', [CTX_SRC, 'setup', '--root', dir], dir, denyLinkCreation(dir));
  assert(again.code !== 0 && /Developer Mode|EPERM/.test(again.out), 'retry silently downgraded the requested symlink strategy');
  const adapters = ctx(dir, 'adapters', '--json');
  assert(adapters.code !== 0 && !fs.existsSync(path.join(dir, '.claude', 'agents', 'context-explorer.md')), 'pending native setup silently generated portable adapter copies');
});

/* ---- Wave0 audit safety regressions (append-only ownership boundary) */
function wave0Lock(dir) {
  const key = createHash('sha1').update(fs.realpathSync(dir)).digest('hex').slice(0, 16);
  return path.join(os.tmpdir(), 'ctx-locks', key + '.lock');
}
function wave0Hook(dir, source) {
  const hook = path.join(dir, 'wave0-fault.cjs');
  fs.writeFileSync(hook, source);
  return { NODE_OPTIONS: `--require "${hook.replace(/\\/g, '/')}"`, CTX_LOCK_WAIT_MS: '0' };
}
function wave0Skill(dir, name = 'demo') {
  const source = path.join(dir, 'skill-source');
  fs.mkdirSync(path.join(source, 'scripts'), { recursive: true });
  fs.copyFileSync(CTX_SRC, path.join(source, 'scripts', 'ctx.mjs'));
  fs.writeFileSync(path.join(source, 'SKILL.md'), `---\nname: ${name}\n---\n\n# fixture\n`);
  for (const folder of ['references', 'assets']) {
    fs.mkdirSync(path.join(source, folder));
    fs.writeFileSync(path.join(source, folder, 'fixture.txt'), 'SHIPPABLE CONTENT\n');
  }
  return source;
}

test('Wave0 stale locks never evict a live or permission-protected PID', (dir) => {
  initRepo(dir);
  const lock = wave0Lock(dir);
  const original = fs.readFileSync(path.join(dir, 'context', 'log.md'), 'utf8');
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  const text = JSON.stringify({ pid: process.pid, token: 'live-owner' });
  const old = new Date(Date.now() - 60000);
  try {
    for (const env of [{ CTX_LOCK_WAIT_MS: '0' }, wave0Hook(dir, `process.kill=()=>{const e=new Error('protected PID');e.code='EPERM';throw e;};`)]) {
      fs.writeFileSync(lock, text);
      fs.utimesSync(lock, old, old);
      const r = sh('node', [path.join(dir, 'context', 'ctx.mjs'), 'log', 'build', 'blocked'], dir, env);
      assert(r.code !== 0 && /ctx is busy/.test(r.out), `live lock was evicted: ${r.out}`);
      assert(fs.readFileSync(lock, 'utf8') === text, 'live ownership record was replaced');
      assert(fs.readFileSync(path.join(dir, 'context', 'log.md'), 'utf8') === original, 'blocked writer changed the log');
    }
  } finally { if (fs.existsSync(lock)) fs.unlinkSync(lock); }
});

test('Wave0 normal and process-exit release preserve replacement lock ownership', (dir) => {
  initRepo(dir);
  const lock = wave0Lock(dir);
  const replacement = JSON.stringify({ pid: process.pid, token: 'replacement-owner' });
  try {
    const env = wave0Hook(dir, `const fs=require('node:fs');const rename=fs.renameSync;fs.renameSync=function(...args){const result=rename.apply(fs,args);if(String(args[1]).endsWith('log.md'))fs.writeFileSync(${JSON.stringify(lock)},${JSON.stringify(replacement)});return result;};`);
    const r = sh('node', [path.join(dir, 'context', 'ctx.mjs'), 'log', 'build', 'release'], dir, env);
    assert(r.code === 0 && fs.existsSync(lock) && fs.readFileSync(lock, 'utf8') === replacement, `normal release removed another owner: ${r.out}`);
    fs.unlinkSync(lock);
    const exitEnv = wave0Hook(dir, `const fs=require('node:fs');const read=fs.readFileSync;fs.readFileSync=function(file,...args){const result=read.call(fs,file,...args);if(String(file).endsWith('progress-tracker.md'))fs.writeFileSync(${JSON.stringify(lock)},${JSON.stringify(replacement)});return result;};`);
    const failed = sh('node', [path.join(dir, 'context', 'ctx.mjs'), 'task', 'start', '999'], dir, exitEnv);
    assert(failed.code !== 0 && fs.existsSync(lock) && fs.readFileSync(lock, 'utf8') === replacement, `exit release removed another owner: ${failed.out}`);
  } finally { if (fs.existsSync(lock)) fs.unlinkSync(lock); }
});

test('Wave0 internal index callers cannot bypass a held writer lock', (dir) => {
  initRepo(dir);
  const idx = path.join(dir, 'context', 'index.md');
  const original = fs.readFileSync(idx, 'utf8');
  const lock = wave0Lock(dir);
  fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, token: 'held-owner' }));
  try {
    for (const args of [[path.join(dir, 'context', 'ctx.mjs'), 'lint', '--fix'], [CTX_SRC, 'setup', '--root', dir, '--portable-pointers']]) {
      const r = sh('node', args, dir, { CTX_LOCK_WAIT_MS: '0' });
      assert(r.code !== 0 && /ctx is busy/.test(r.out), `internal index bypassed the lock: ${r.out}`);
      assert(fs.readFileSync(idx, 'utf8') === original, 'held index was rewritten');
    }
  } finally { if (fs.existsSync(lock)) fs.unlinkSync(lock); }
});

test('Wave0 archive dedupe compares exact blocks and lines rather than substrings', (dir) => {
  initRepo(dir);
  const lp = path.join(dir, 'context', 'log.md');
  const tr = path.join(dir, 'context', 'progress-tracker.md');
  const entry = '## [2025-01-05] build | short entry\nshort note';
  const line = '- Feature 01: short unit — 2025-01-05 — short detail';
  fs.appendFileSync(lp, '\n' + entry + '\n');
  fs.writeFileSync(tr, fs.readFileSync(tr, 'utf8').replace('## Completed\n', `## Completed\n${line}\n`));
  const arch = path.join(dir, 'context', 'archive');
  const logArchive = path.join(arch, `log-${new Date(Date.now() - 180 * 864e5).toISOString().slice(0, 7)}.md`);
  const trackerArchive = path.join(arch, `tracker-${new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 4)}.md`);
  fs.writeFileSync(logArchive, '# Log (archived)\n\n' + entry + ' with additional detail\n');
  fs.writeFileSync(trackerArchive, '# Completed (archived)\n\n' + line + ' with additional detail\n');
  const r = ctx(dir, 'archive');
  assert(r.code === 0, `archive failed: ${r.out}`);
  const logs = fs.readFileSync(logArchive, 'utf8').split(/\n(?=## \[)/).map((s) => s.trim());
  assert(logs.includes(entry), 'short exact log block was lost inside a longer archived block');
  assert(fs.readFileSync(trackerArchive, 'utf8').split('\n').includes(line), 'short exact tracker line was lost inside a longer archived line');
  fs.appendFileSync(lp, '\n' + entry + '\n');
  assert(ctx(dir, 'archive').code === 0, 'archive replay failed');
  assert(fs.readFileSync(logArchive, 'utf8').split(/\n(?=## \[)/).filter((s) => s.trim() === entry).length === 1, 'exact archive replay duplicated a block');
});

test('Wave0 install refuses missing and empty names without destination writes', (dir) => {
  const source = wave0Skill(dir);
  const dest = path.join(dir, 'installed');
  for (const fm of ['title: unnamed', 'name:', 'name: ""', "name: ''", 'name: []']) {
    fs.writeFileSync(path.join(source, 'SKILL.md'), `---\n${fm}\n---\n\n# fixture\n`);
    const r = sh('node', [path.join(source, 'scripts', 'ctx.mjs'), 'install', '--dest', dest], dir);
    assert(r.code !== 0 && /skill name/.test(r.out), `missing/empty name accepted: ${fm}: ${r.out}`);
    assert(!fs.existsSync(dest), `refused name created destination: ${fm}`);
  }
});

test('Wave0 install refuses lexical source ancestors before moving the source', (dir) => {
  const source = wave0Skill(dir, path.basename(dir));
  const before = fs.readFileSync(path.join(source, 'scripts', 'ctx.mjs'), 'utf8');
  const r = sh('node', [path.join(source, 'scripts', 'ctx.mjs'), 'install', '--dest', path.dirname(dir), '--dry-run'], dir);
  assert(r.code !== 0 && /source tree/.test(r.out), `source ancestor accepted: ${r.out}`);
  assert(fs.readFileSync(path.join(source, 'scripts', 'ctx.mjs'), 'utf8') === before, 'ancestor install moved its own source');
});

test('Wave0 install resolves existing ancestor aliases for missing destinations', (dir) => {
  const source = wave0Skill(dir);
  const alias = path.join(dir, 'source-alias');
  try { fs.symlinkSync(source, alias, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (e) { if (['EPERM', 'EACCES', 'ENOTSUP'].includes(e.code)) { const skip = new Error(`native link privilege unavailable (${e.code})`); skip.nativeSkip = true; throw skip; } throw e; }
  const dest = path.join(alias, 'missing-home');
  const r = sh('node', [path.join(source, 'scripts', 'ctx.mjs'), 'install', '--dest', dest], dir);
  assert(r.code !== 0 && /source tree/.test(r.out), `real ancestor source containment bypassed: ${r.out}`);
  assert(!fs.existsSync(path.join(source, 'missing-home')), 'alias install wrote into its source');
});

test('Wave0 install copy and publication faults restore the original tree', (dir) => {
  const source = wave0Skill(dir);
  const dest = path.join(dir, 'installed');
  const target = path.join(dest, 'demo');
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, 'owner.txt'), 'ORIGINAL LOCAL OWNER\n');
  const faults = [
    `const fs=require('node:fs');const copy=fs.copyFileSync;fs.copyFileSync=function(from,to,...args){if(String(to).includes('.stage-')&&String(from).endsWith('fixture.txt'))throw new Error('INJECTED COPY FAILURE');return copy.call(fs,from,to,...args);};`,
    `const fs=require('node:fs');const rename=fs.renameSync;fs.renameSync=function(from,to){if(String(from).includes('.stage-')&&String(to)===${JSON.stringify(target)})throw new Error('INJECTED PUBLISH FAILURE');return rename.call(fs,from,to);};`,
  ];
  for (const fault of faults) {
    const r = sh('node', [path.join(source, 'scripts', 'ctx.mjs'), 'install', '--dest', dest], dir, wave0Hook(dir, fault));
    assert(r.code !== 0 && /INJECTED/.test(r.out), `fault did not run: ${r.out}`);
    assert(fs.readFileSync(path.join(target, 'owner.txt'), 'utf8') === 'ORIGINAL LOCAL OWNER\n', `failed install lost original tree: ${r.out}`);
    assert(fs.readdirSync(dest).join(',') === 'demo', 'failure left a stage or failed to restore its backup');
  }
});

test('Wave0 install occupied rollback preserves destination and reports original backup', (dir) => {
  const source = wave0Skill(dir);
  const dest = path.join(dir, 'installed');
  const target = path.join(dest, 'demo');
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, 'owner.txt'), 'ORIGINAL LOCAL OWNER\n');
  const env = wave0Hook(dir, `const fs=require('node:fs');const rename=fs.renameSync;fs.renameSync=function(from,to){if(String(from).includes('.stage-')&&String(to)===${JSON.stringify(target)}){fs.mkdirSync(to);fs.writeFileSync(require('node:path').join(to,'replacement.txt'),'CONCURRENT OWNER');throw new Error('INJECTED OCCUPIED PUBLISH');}return rename.call(fs,from,to);};`);
  const r = sh('node', [path.join(source, 'scripts', 'ctx.mjs'), 'install', '--dest', dest], dir, env);
  assert(r.code !== 0 && /INJECTED/.test(r.out), `occupied fault did not run: ${r.out}`);
  assert(fs.readFileSync(path.join(target, 'replacement.txt'), 'utf8') === 'CONCURRENT OWNER', 'rollback overwrote concurrent destination');
  const backup = fs.readdirSync(dest).find((f) => f.includes('.ctx-backup-'));
  assert(backup && fs.readFileSync(path.join(dest, backup, 'owner.txt'), 'utf8') === 'ORIGINAL LOCAL OWNER\n', 'original backup was lost');
  assertContains(r.out, path.join(dest, backup), 'preserved original backup was not reported');
});

test('Wave0 duplicate normalized roadmap IDs fail lint even without a tracker', (dir) => {
  queueFixture(dir);
  const roadmap = path.join(dir, 'context', 'build-plan.md');
  fs.appendFileSync(roadmap, '| 031 | Conflicting second reservation | S | collision |\n');
  for (const removeTracker of [false, true]) {
    if (removeTracker) fs.unlinkSync(path.join(dir, 'context', 'progress-tracker.md'));
    const r = ctx(dir, 'lint', '--json');
    const data = JSON.parse(r.out);
    assert(data.errors.some((e) => /build-plan.md.*duplicate.*31/i.test(e)), `duplicate roadmap ID was hidden: ${r.out}`);
  }
});

test('Wave0 duplicate roadmap reservations refuse feature and task authoring', (dir) => {
  queueFixture(dir);
  const roadmap = path.join(dir, 'context', 'build-plan.md');
  fs.appendFileSync(roadmap, '| 031 | Conflicting second reservation | S | collision |\n');
  const tracker = path.join(dir, 'context', 'progress-tracker.md');
  const before = fs.readFileSync(tracker, 'utf8');
  for (const args of [['new', 'feature', 'second-unit', '--spec', '31'], ['task', 'add', 'second unit', '--spec', '31']]) {
    const r = ctx(dir, ...args);
    assert(r.code !== 0 && /duplicate.*31/i.test(r.out), `ambiguous roadmap authored new work: ${r.out}`);
    assert(fs.readFileSync(tracker, 'utf8') === before, 'refused authoring changed the tracker');
    assert(!fs.existsSync(path.join(dir, 'context', 'feature-specs', '31-second-unit.md')), 'refused authoring created a spec');
  }
});

test('Wave0 frontmatter rejects leading indentation tabs before block and list parsing', (dir) => {
  initRepo(dir);
  const file = path.join(dir, 'context', 'tabbed.md');
  for (const fields of ['summary: >\n \tbad folded line', 'summary: |\n  \tbad literal line', 'summary: Good\ncovers:\n \t- src/auth/**', 'summary: >\n \t\n  good text']) {
    fs.writeFileSync(file, `---\ntitle: Tabbed\ntype: guide\nstatus: active\n${fields}\nupdated: 2026-10-21\n---\n\n# Tabbed\n`);
    const r = ctx(dir, 'lint', '--json');
    assert(JSON.parse(r.out).errors.some((e) => e.includes('tabbed.md') && /tab indentation/.test(e)), `indent tab was accepted: ${fields}: ${r.out}`);
  }
  fs.writeFileSync(file, '---\ntitle: Tabbed\ntype: guide\nstatus: active\nsummary: >\n  ordinary\tcontent\nupdated: 2026-10-21\n---\n\n# Tabbed\n');
  assert(!JSON.parse(ctx(dir, 'lint', '--json').out).errors.some((e) => /tab indentation/.test(e)), 'content tab incorrectly treated as indentation');
});

test('Wave0 router code spans ignore fenced examples without expanding ordinary page scope', (dir) => {
  queueFixture(dir);
  const idx = path.join(dir, 'context', 'index.md');
  const workflow = path.join(dir, 'context', 'workflow-rules.md');
  const example = '\n\nFlags: `--example/file.md` and `-example/file.md`\n\n```markdown\n`missing-example.md`\n```\n\n   ~~~~md\n`missing-tilde.md`\n   ~~~~\n';
  for (const file of [idx, workflow]) fs.appendFileSync(file, example);
  fs.appendFileSync(path.join(dir, 'context', 'feature-specs', '30-queue-unit.md'), '\nOrdinary illustrative path: `missing-ordinary.md`\n');
  let data = JSON.parse(ctx(dir, 'lint', '--json').out);
  assert(!data.errors.some((e) => /missing-example|missing-tilde|missing-ordinary|example\/file/.test(e)), `illustrative paths entered router scope: ${JSON.stringify(data.errors)}`);
  fs.appendFileSync(workflow, '\nReal route: `missing-live.md`\n\n~~~md\n`unclosed-fence.md`\n');
  data = JSON.parse(ctx(dir, 'lint', '--json').out);
  assert(data.errors.some((e) => /workflow-rules.md.*missing-live.md/.test(e)), 'live router code-span no longer checked');
  assert(!data.errors.some((e) => /unclosed-fence/.test(e)), 'unclosed fenced example entered router scope');
});

/* ----------------------------------------------------------------- summary */
console.log(`\n${passed} passed, ${failures.length} failed, ${skipped} skipped`);
if (failures.length) {
  for (const f of failures) console.log(`  FAIL ${f.name}`);
  process.exit(1);
}
