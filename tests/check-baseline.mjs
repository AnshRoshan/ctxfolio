#!/usr/bin/env node
// Gate regressions run in a disposable full-history clone, never the source tree.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-baseline-')));
const fixture = path.join(temp, 'repo');
const run = (cmd, args, cwd = fixture) => spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 60000, env: { ...process.env, NODE_OPTIONS: '' } });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const node = (...args) => run(process.execPath, args);
const cli = (...args) => node('context/ctx.mjs', ...args);
const clean = (result) => assert(result.status === 0, `${result.stdout || ''}${result.stderr || ''}`);
const write = (file, value) => fs.writeFileSync(path.join(fixture, file), value);
const read = (file) => fs.readFileSync(path.join(fixture, file), 'utf8');
try {
  clean(run('git', ['clone', '--quiet', '--no-hardlinks', '-c', 'core.symlinks=true', source, fixture], temp));
  // The clone is a history substrate; current candidate bytes include uncommitted work.
  for (const entry of ['AGENTS.md', 'memory.md', 'context', '.agents', '.claude', '.cursor', '.github', '.claude-plugin', 'assets', 'scripts', 'tests', 'SKILL.md', 'README.md', 'CHANGELOG.md', 'package.json', '.gitignore']) {
    const target = path.resolve(fixture, entry);
    assert(path.dirname(target) === fixture, 'unsafe fixture overlay path');
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(path.join(source, entry), target, { recursive: true, verbatimSymlinks: true });
  }
  const localIssues = path.resolve(fixture, 'context/current-issues.md');
  assert(path.dirname(localIssues) === path.join(fixture, 'context'), 'unsafe local fixture path');
  fs.rmSync(localIssues, { force: true }); // ignored local pages must not hide clean-checkout routing defects
  clean(run('git', ['config', 'user.name', 'Baseline Test']));
  clean(run('git', ['config', 'user.email', 'baseline@example.invalid']));
  clean(run('git', ['add', '-A']));
  clean(run('git', ['commit', '--quiet', '--allow-empty', '-m', 'baseline fixture']));
  clean(cli('lint', '--strict'));
  clean(cli('stale', '--strict'));
  clean(cli('doctor'));

  const testing = read('context/testing.md');
  write('context/testing.md', testing + '\n{{CI_UNFILLED}}\n');
  const placeholder = cli('lint', '--strict', '--json');
  const lint = JSON.parse(placeholder.stdout);
  assert(placeholder.status !== 0 && lint.errors.some((error) => error.includes('context/testing.md: unfilled')), 'self-context gate did not detect the injected placeholder');
  write('context/testing.md', testing);

  const suite = read('tests/run.mjs');
  write('tests/run.mjs', suite + '\n// baseline stale source probe\n');
  clean(run('git', ['add', 'tests/run.mjs']));
  clean(run('git', ['commit', '--quiet', '-m', 'source-only drift']));
  const stale = cli('stale', '--strict', '--json');
  const report = JSON.parse(stale.stdout);
  assert(stale.status !== 0 && report.git === true && report.items.some((item) => item.page === 'context/testing.md' && item.hits.includes('tests/run.mjs')), 'self-context gate did not detect committed source drift');

  clean(node('tests/check-versions.mjs'));
  const currentVersion = read('scripts/ctx.mjs').match(/^const VERSION = '([^']+)';/m)[1];
  const packageVersion = JSON.parse(read('package.json')).version;
  const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const file of ['SKILL.md', 'scripts/ctx.mjs', 'CHANGELOG.md', 'package.json', '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'README.md']) {
    const original = read(file);
    let changed;
    if (file === 'SKILL.md') changed = original.replace(/^(# Ctxfolio \(v)[^)]+\)/m, '$199.99.99)');
    else if (file === 'scripts/ctx.mjs') changed = original.replace(/^const VERSION = '[^']+';/m, "const VERSION = '99.99.99';");
    else if (file === 'CHANGELOG.md') changed = original.replace(/^## v\d+\.\d+(?:\.\d+)?/m, '## v99.99.99');
    else if (file === 'README.md') changed = original.replace(new RegExp(`^\\|\\s*${escape(currentVersion)}\\s*\\|\\s*${escape(packageVersion)}\\s*\\|.*\\r?\\n`, 'm'), '');
    else changed = original.replace(/("version"\s*:\s*")[^"]+"/, '$199.99.99"');
    assert(changed !== original, `version mutation did not change ${file}`);
    write(file, changed);
    const mismatch = node('tests/check-versions.mjs');
    assert(mismatch.status !== 0, `release check missed mismatch in ${file}`);
    write(file, original);
  }
  const tags = run('git', ['tag', '--list', `v${currentVersion}`]);
  clean(tags);
  if (tags.stdout.trim()) clean(run('git', ['tag', '-d', `v${currentVersion}`]));
  clean(run('git', ['tag', `v${currentVersion}`, 'HEAD^']));
  const wrongCommit = node('tests/check-versions.mjs', '--require-tag', `--tag=v${currentVersion}`);
  assert(wrongCommit.status !== 0 && wrongCommit.stderr.includes('does not identify HEAD'), 'release check missed a correct tag attached to the wrong commit');
  clean(run('git', ['tag', '-f', `v${currentVersion}`]));
  clean(node('tests/check-versions.mjs', '--require-tag', `--tag=v${currentVersion}`));
  assert(node('tests/check-versions.mjs', '--require-tag', '--tag=v0.0.0').status !== 0, 'release check missed the wrong triggering tag');
  const mappingReadme = read('README.md');
  write('README.md', mappingReadme.replace(new RegExp(`^(\\|\\s*${escape(currentVersion)}\\s*\\|\\s*${escape(packageVersion)}\\s*\\|)\\s*v[^|]+\\|`, 'm'), '$1 v0.0.0 |'));
  assert(node('tests/check-versions.mjs').status !== 0, 'release check missed the wrong mapping tag column');
  write('README.md', mappingReadme);
  for (const [file, value] of [['package.json', 'null'], ['.claude-plugin/plugin.json', '[]'], ['.claude-plugin/marketplace.json', '{"plugins":{}}']]) {
    const original = read(file);
    write(file, value);
    const invalid = node('tests/check-versions.mjs');
    assert(invalid.status !== 0 && !invalid.stderr.includes('TypeError'), `release check crashed instead of diagnosing invalid ${file}`);
    write(file, original);
  }
  clean(run('git', ['tag', 'v99.99.99']));
  assert(node('tests/check-versions.mjs', '--require-tag').status !== 0, 'release check missed a mismatched newest tag');
  console.log('Baseline guards: placeholder drift, committed source drift, seven version/mapping mutations and release-tag mismatch detected.');
} finally {
  // Verify the absolute disposable target before deleting only our own fixture.
  assert(path.dirname(temp) === fs.realpathSync(os.tmpdir()) && path.basename(temp).startsWith('ctx-baseline-'), 'unsafe fixture cleanup path');
  fs.rmSync(temp, { recursive: true, force: true });
}
