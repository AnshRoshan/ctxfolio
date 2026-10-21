#!/usr/bin/env node
// Keep current claims separate from historical transcripts and measured evidence.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const site = read('web/index.html');
const install = read('INSTALL.md');
const overview = read('context/overview.md');
for (const [file, text] of [['web/index.html', site], ['INSTALL.md', install], ['context/overview.md', overview]]) {
  assert(!/47\s*(?:\/\s*47|end-to-end|, on three)|72 cases|Node\s*18\s*(?:or newer|\+)|node\s*18\s*or newer|twelve doctor|wiring checks \(12\)/i.test(text), `${file}: obsolete live baseline claim`);
}
assert(!/^\s*cp\s+-r\s+(?:project-context-system|ctxfolio)\s/m.test(install), 'INSTALL.md: whole-repository copy bypasses SHIP-only installer');
assert(install.includes('install --tool claude') && install.includes('install --tool qoder') && install.includes('install --dest'), 'INSTALL.md: supported SHIP-only install examples missing');
assert(/testing\.md(?:#verification-evidence)?/.test(install) && /testing\.md/.test(overview), 'current test claims must link their evidence owner');
assert(/Node\s*22.*24/i.test(site), 'website: supported Node tracks missing');
assert(!/v2\.4\.1/.test(site), 'website: old release displayed as current');
assert(/illustrative|synthetic|example/i.test(site) && /legacy|historical|versioned/i.test(site), 'website: demo scope not visibly qualified');
assert(/assumptions|illustrative inputs|not measured|not a benchmark/i.test(site), 'website: cost inputs need an unmeasured qualification');
assert(!/output quality[\s\S]{0,240}degrades near 50k/i.test(site), 'website: unsupported quality threshold advertised');
for (const file of ['web/src/islands/Terminal.tsx', 'web/src/islands/StopHook.tsx', 'web/src/islands/CostChart.tsx']) {
  assert(/illustrative|synthetic|legacy|assumptions|not measured/i.test(read(file)), `${file}: interactive example/evidence qualification missing`);
}
assert(!/confidence[^\n]{0,100}(?:proves|human checked)/i.test(read('web/src/islands/CompiledPage.tsx')), 'compiled-page confidence metadata cannot prove human review');
assert(!/copy of D-NN/.test(read('docs/README.md')), 'docs: exported decision copies violate canonical ownership');
assert(!/stale[^\n]{0,60}worktree[^\n]{0,30}untracked/i.test(read('context/codebase/map.md')), 'code map: registered legacy worktree mislabeled untracked');
assert(/CLI/.test(read('context/library-docs.md')), 'library zero-dependency scope must identify the CLI');
console.log('Truth guards: live baseline declarations, SHIP-only install examples, canonical evidence, illustrative UI and unmeasured costs checked.');
