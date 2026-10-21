#!/usr/bin/env node
// Development-only release check. Installed/project CLI stays self-contained.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(process.argv.find((arg) => arg.startsWith('--root='))?.slice(7) || '.');
const errors = [];
const read = (file) => {
  try { return fs.readFileSync(path.join(root, file), 'utf8'); }
  catch (e) { errors.push(`${file}: ${e.code || e.message}`); return ''; }
};
const json = (file) => {
  try {
    const value = JSON.parse(read(file));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('expected object');
    return value;
  } catch { errors.push(`${file}: invalid JSON object`); return {}; }
};
const normalize = (value) => {
  const match = String(value || '').match(/^v?(\d+)\.(\d+)(?:\.(\d+))?$/);
  return match ? `${match[1]}.${match[2]}.${match[3] || 0}` : null;
};
const skill = normalize(read('SKILL.md').match(/^# Project Context System \(v([^)]*)\)/m)?.[1]);
const cli = normalize(read('scripts/ctx.mjs').match(/^const VERSION = '([^']+)';/m)?.[1]);
const changelog = normalize(read('CHANGELOG.md').match(/^## v(\d+\.\d+(?:\.\d+)?)(?:\s|$)/m)?.[1]);
const pkg = json('package.json').version;
const plugin = json('.claude-plugin/plugin.json').version;
const marketplaceData = json('.claude-plugin/marketplace.json');
const marketplace = Array.isArray(marketplaceData.plugins) ? marketplaceData.plugins.find((item) => item?.name === 'project-context-system')?.version : null;
if (!Array.isArray(marketplaceData.plugins)) errors.push('marketplace.json: plugins must be an array');
for (const [label, value] of [['SKILL.md', skill], ['scripts/ctx.mjs', cli], ['CHANGELOG.md', changelog]]) {
  if (!value || value !== cli) errors.push(`${label}: skill track ${value || 'missing'} differs from CLI ${cli || 'missing'}`);
}
for (const [label, value] of [['package.json', pkg], ['plugin.json', plugin], ['marketplace.json', marketplace]]) {
  if (!normalize(value) || value !== pkg) errors.push(`${label}: package track ${value || 'missing'} differs from package ${pkg || 'missing'}`);
}
const mapping = read('README.md').split('\n').some((line) => {
  const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
  return cells[0] === cli && cells[1] === pkg && cells[2] === `v${cli}`;
});
if (!mapping) errors.push(`README.md: missing release mapping ${cli} -> ${pkg}`);
const expectedTag = process.argv.find((arg) => arg.startsWith('--tag='))?.slice(6);
if (expectedTag && expectedTag !== `v${cli}`) errors.push(`release ref: ${expectedTag} differs from v${cli}`);
if (process.argv.includes('--require-tag')) {
  try {
    if (expectedTag) {
      const tagged = execFileSync('git', ['rev-parse', '--verify', `${expectedTag}^{commit}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
      const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
      if (tagged !== head) errors.push(`release ref: ${expectedTag} does not identify HEAD`);
    }
    const tags = execFileSync('git', ['tag', '--merged', 'HEAD', '--list', 'v*', '--sort=-version:refname'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim().split(/\r?\n/).filter((tag) => /^v\d+\.\d+(?:\.\d+)?$/.test(tag));
    if (normalize(tags[0]) !== cli) errors.push(`git tag: newest reachable release ${tags[0] || 'missing'} differs from v${cli}`);
  } catch { errors.push('git tag: cannot inspect release history (fetch full history and tags)'); }
}
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else console.log(`Release tracks agree: skill/CLI ${cli} -> package/plugin ${pkg}${process.argv.includes('--require-tag') ? '; tag verified' : '; release candidate (tag not required)'}`);
