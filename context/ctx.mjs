#!/usr/bin/env node
/**
 * ctx — the project's context-wiki tooling (installed by the project-context-system skill).
 *
 * The context/ folder is a compiled, interlinked markdown wiki about this project:
 * raw sources -> pages -> schema. This tool does the mechanical bookkeeping so
 * agents spend tokens on judgement, not on grep:
 *
 *   init        scaffold the whole system into a project (skips existing files);
 *               auto-detects the project profile (stack, kind, UI/DB/API, agent tools)
 *   setup       THE one command: init + path-gated rules + agent memory + mechanical
 *               codebase map draft (brownfield) + index + doctor. Idempotent — re-run
 *               any time (also upgrades: refreshes context/ctx.mjs and adds new files)
 *   install     install the skill itself into an agent tool's skills folder
 *               (--tool claude|qoder|auto, --dest dir); ships SKILL/references/assets/
 *               scripts only — repo dev history stays in the repo
 *   rules       which rules/pages apply to these files (path-gated, zero wasted tokens)
 *   detect      print the detected project profile (stack, kind, groups, pointer files)
 *   tools       code-intelligence tools available here to delegate to (graphify, ctags, …)
 *   brief       route a task/file/keywords to the few pages worth reading (+ token cost)
 *   impact      which pages must be updated for the code that changed
 *   stale       pages whose covered code changed after the page was last touched
 *   lint        health check: frontmatter, links, orphans, placeholders, tracker, budgets
 *   doctor      verify the scaffold is wired (imports, gitignore, permissions, hooks)
 *   index       regenerate the catalog in context/index.md (and llms.txt with --llms)
 *   coverage    source files that no page documents (blind spots)
 *   log         append a greppable entry to context/log.md
 *   task        task ledger: list|add|start|done|block (Now/Up next/Blocked/Completed)
 *   archive     rotate old log/tracker entries into context/archive/ (growth control)
 *   stamp       mark pages re-verified against current code
 *   new         create wiki pages or canonical agent|rule|skill resources
 *   adapters    check/refresh the recorded native resource layout
 *   symlinks    real relative link/Git audit or migration (--check, --migrate, --json)
 *   status      one-screen health summary
 *   hook        session-start | stop   (for .claude/settings.json hooks)
 *
 * Most read-only commands accept --json (stable contract: {command, ok, …});
 * lint also accepts --fix (regenerates the index catalog).
 *
 * Usage: node context/ctx.mjs <command> [args] [--root dir]
 * Node 22 or 24. No dependencies. Works without git (staleness features degrade gracefully).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const SELF = fileURLToPath(import.meta.url);
const SKILL_DIR = path.resolve(path.dirname(SELF), '..');
const VERSION = '2.7.0';
const CONFIG_SCHEMA = 2;

/* ------------------------------------------------------------------ args */
const VALUE_FLAGS = new Set(['root', 'since', 'budget', 'covers', 'paths', 'title', 'm', 'tail', 'limit', 'type', 'summary', 'spec', 'danger', 'days', 'keep-days', 'tool', 'dest']);
const argv = process.argv.slice(2);
const cmd = argv[0];
const flags = {};
const pos = [];
let argError = '';
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a === '-m' || a.startsWith('--')) {
    const k = a === '-m' ? 'm' : a.slice(2);
    if (VALUE_FLAGS.has(k)) {
      if (argv[i + 1] === undefined || argv[i + 1].startsWith('--') || argv[i + 1] === '-m') argError ||= `${a} requires a value`;
      else flags[k] = argv[++i];
    } else flags[k] = true;
  } else pos.push(a);
}

/* ------------------------------------------------------------------ utils */
const posix = (p) => p.split(path.sep).join('/');
const today = () => new Date().toISOString().slice(0, 10);
const tokens = (s) => Math.ceil(s.length / 4);
const fmtTok = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n));
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

/* --json contract: every payload has { command, ok }; `ok` means "clean, keep going". */
function emit(payload, humanFn) {
  if (flags.json) {
    console.log(JSON.stringify(payload));
    if (payload.exitCode) process.exit(payload.exitCode);
    return;
  }
  humanFn();
}

function findRoot() {
  if (flags.root) return path.resolve(String(flags.root));
  let dir = process.cwd();
  for (;;) {
    if (fs.existsSync(path.join(dir, 'context', 'index.md')) || fs.existsSync(path.join(dir, 'context', 'overview.md')) || fs.existsSync(path.join(dir, 'AGENTS.md')) || fs.existsSync(path.join(dir, '.git'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return process.cwd();
    dir = up;
  }
}
const ROOT = ['init', 'setup'].includes(cmd) ? path.resolve(String(flags.root || process.cwd())) : findRoot();
const CTX = path.join(ROOT, 'context');
const rel = (abs) => posix(path.relative(ROOT, abs));

/* ------------------------------------------------------------- safe writes */
let tmpSeq = 0;
function atomicWrite(file, data) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  let mode;
  try { mode = fs.statSync(file).mode & 0o777; } catch {}
  const tmp = path.join(dir, `.${path.basename(file)}.tmp-${process.pid}-${tmpSeq++}-${Math.random().toString(36).slice(2, 8)}`);
  let fd;
  try {
    fd = fs.openSync(tmp, 'wx', mode || 0o666);
    fs.writeFileSync(fd, data);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;
    fs.renameSync(tmp, file);
  } catch (e) {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch {}
    }
    try { fs.unlinkSync(tmp); } catch {}
    throw e;
  }
}
function appendAtomic(file, text) {
  let current = '';
  try { current = fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  atomicWrite(file, current + text);
}
function backupFile(file) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '') + '-' + process.pid;
  const backup = `${file}.bak-${stamp}`;
  fs.copyFileSync(file, backup);
  return backup;
}
const LOCK_DIR = path.join(os.tmpdir(), 'ctx-locks');
let lockDepth = 0;
let activeLock = null;
function lockSnapshot(file) {
  const stat = fs.lstatSync(file);
  return { file, dev: stat.dev, ino: stat.ino, mtimeMs: stat.mtimeMs, text: fs.readFileSync(file, 'utf8') };
}
function releaseLock(owner) {
  if (!owner) return;
  try {
    const current = lockSnapshot(owner.file);
    if (current.dev === owner.dev && current.ino === owner.ino && current.text === owner.text) fs.unlinkSync(owner.file);
  } catch {}
}
process.once('exit', () => releaseLock(activeLock));
const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
function lockPath() {
  let root = ROOT;
  try { root = fs.realpathSync(ROOT); } catch {}
  const key = createHash('sha1').update(root).digest('hex').slice(0, 16);
  return path.join(LOCK_DIR, key + '.lock');
}
function withLock(fn) {
  if (lockDepth > 0) {
    lockDepth += 1;
    try { return fn(); } finally { lockDepth -= 1; }
  }
  fs.mkdirSync(LOCK_DIR, { recursive: true });
  const lock = lockPath();
  const waitMs = Number(process.env.CTX_LOCK_WAIT_MS);
  const deadline = Date.now() + (Number.isFinite(waitMs) && waitMs >= 0 ? waitMs : 10000);
  let fd;
  for (;;) {
    try {
      fd = fs.openSync(lock, 'wx', 0o600);
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      let owner;
      try { owner = lockSnapshot(lock); } catch (err) { if (err.code === 'ENOENT') continue; throw err; }
      if (Date.now() - owner.mtimeMs > 30000) {
        let pid;
        try { pid = JSON.parse(owner.text).pid; } catch {}
        let live = false;
        if (Number.isSafeInteger(pid) && pid > 0) {
          try { process.kill(pid, 0); live = true; } catch (err) { live = err.code !== 'ESRCH'; }
        }
        if (!live) {
          releaseLock(owner);
          // The ownership record may have changed; retry without deleting its successor.
          if (Date.now() < deadline) continue;
          try { fs.lstatSync(lock); } catch (err) { if (err.code === 'ENOENT') continue; throw err; }
        }
      }
      if (Date.now() >= deadline) {
        throw new Error(`ctx is busy: another writer holds ${lock}; wait for it or delete the lock if no ctx process is running`);
      }
      sleepSync(50);
    }
  }
  const text = JSON.stringify({ pid: process.pid, token: randomUUID(), at: new Date().toISOString(), root: ROOT });
  try { fs.writeFileSync(fd, text); }
  finally { fs.closeSync(fd); }
  const owner = { ...lockSnapshot(lock), text };
  lockDepth = 1;
  activeLock = owner;
  try { return fn(); }
  finally {
    lockDepth = 0;
    activeLock = null;
    releaseLock(owner);
  }
}

const DEFAULTS = {
  resourceMode: 'pointer', // existing projects keep their layout until deliberate migration
  maxPageLines: 160,
  maxAgentsLines: 120,
  maxSummaryChars: 160,
  oldPageDays: 120,
  archiveAfterDays: 180,
  trackerKeepDays: 90,
  alwaysRead: ['context/index.md', 'memory.md'],
  ignoreDirs: ['node_modules', '.git', '.next', 'dist', 'build', 'out', 'coverage', '.turbo', '.venv', 'venv', '__pycache__', 'target', 'vendor', '.cache', '.claude', '.cursor', '.agents'],
  sourceExt: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.go', '.rs', '.java', '.kt', '.rb', '.php', '.cs', '.swift', '.sql', '.prisma', '.vue', '.svelte'],
  ignoreSourceGlobs: ['**/*.d.ts', '**/*.test.*', '**/*.spec.*', '**/__tests__/**', '**/migrations/**', '**/drizzle/**', '**/*.config.*', '**/next-env.d.ts'],
  pageExcludes: ['context/raw/', 'context/designs/', 'context/screenshots/', 'context/archive/', 'context/agents/', 'context/index.md', 'context/log.md', 'context/current-issues.md', 'context/README.md'],
};
let CONFIG = { ...DEFAULTS };
let CONFIG_ERROR = '';
try {
  const cfgPath = path.join(CTX, '.ctx.json');
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) throw new Error('expected an object');
    if ('resourceMode' in cfg && !['pointer', 'symlink'].includes(cfg.resourceMode)) throw new Error('resourceMode must be pointer or symlink');
    if ('requestedResourceMode' in cfg && !['pointer', 'symlink'].includes(cfg.requestedResourceMode)) throw new Error('requestedResourceMode must be pointer or symlink');
    for (const key of ['alwaysRead', 'ignoreDirs', 'sourceExt', 'ignoreSourceGlobs', 'pageExcludes']) {
      if (key in cfg && (!Array.isArray(cfg[key]) || cfg[key].some((v) => typeof v !== 'string'))) throw new Error(`${key} must be an array of strings`);
    }
    CONFIG = { ...DEFAULTS, ...cfg };
  }
} catch (e) {
  CONFIG_ERROR = `context/.ctx.json is invalid: ${e.message} — fix it before setup`;
}

function git(args, opts = {}) {
  try {
    // normalize line endings only — do NOT trim(): git status --porcelain lines
    // start with a status-column space and a global trim would shift every path by one
    const out = execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024, ...opts });
    return args.includes('-z') ? out : out.replace(/\r\n/g, '\n').replace(/\s+$/, '');
  } catch {
    return null;
  }
}
const HAS_GIT = () => git(['rev-parse', '--is-inside-work-tree']) === 'true';

function walk(dir, out = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (CONFIG.ignoreDirs.includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/* ------------------------------------------------------------------ glob */
function regexEscape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function globBraceEnd(g, start) {
  let depth = 0;
  for (let i = start; i < g.length; i++) {
    if (g[i] === '\\') { i += 1; continue; }
    if (g[i] === '{') depth += 1;
    else if (g[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}
function globBraceSplit(inner) {
  const parts = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === '\\') {
      current += c;
      if (i + 1 < inner.length) current += inner[++i];
      continue;
    }
    if (c === '{') depth += 1;
    if (c === '}') depth -= 1;
    if (c === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += c;
  }
  parts.push(current);
  return parts;
}
function compileGlob(g) {
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        if (g[i + 2] === '/') {
          re += '(?:.*/)?';
          i += 2;
        } else {
          re += '.*';
          i += 1;
        }
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if (c === '{') {
      const end = globBraceEnd(g, i);
      if (end < 0) throw new Error('unbalanced "{"');
      re += '(?:' + globBraceSplit(g.slice(i + 1, end)).map(compileGlob).join('|') + ')';
      i = end;
    } else re += regexEscape(c);
  }
  return re;
}
function globToRegex(glob) {
  const raw = String(glob);
  let g = raw.replace(/^\.\//, '');
  if (g.endsWith('/')) g += '**';
  try {
    const rx = new RegExp('^' + compileGlob(g) + '$');
    rx.globError = null;
    return rx;
  } catch (e) {
    // Fail closed: a bad pattern matches nothing, but carries the reason so
    // lint/brief can name the page instead of crashing the whole command.
    const rx = /(?!)/;
    rx.globError = `invalid covers glob \`${raw}\`: ${e.message}`;
    return rx;
  }
}
const matchers = (globs) =>
  asList(globs)
    .filter((g) => !/\{\{/.test(String(g)) && String(g).trim())
    .map((g) => globToRegex(String(g)));
const anyMatch = (rxs, f) => rxs.some((r) => r.test(f));

/* ------------------------------------------------------------ frontmatter */
function splitList(value) {
  let text = String(value).trim();
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}
    text = text.slice(1, -1);
  }
  const out = [];
  let start = 0, depth = 0, quote = '', escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') depth = Math.max(0, depth - 1);
    else if (c === ',' && !depth) { out.push(text.slice(start, i)); start = i + 1; }
  }
  out.push(text.slice(start));
  return out.map((item) => unquote(item.trim())).filter(Boolean);
}
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: text, has: false, errors: [] };
  const data = {};
  const errors = [];
  const lines = m[1].split(/\r?\n/);
  let curKey = null;
  let block = null;
  const flushBlock = () => {
    if (!block) return;
    let value;
    if (block.mode === '>') {
      value = block.lines.reduce((acc, line) => {
        if (!line.trim()) return acc + '\n';
        if (!acc) return line;
        return acc.endsWith('\n') ? acc + line : acc + ' ' + line;
      }, '');
    } else value = block.lines.join('\n');
    data[block.key] = value.trim();
    block = null;
    curKey = null;
  };
  for (const line of lines) {
    if (/^[ \t]*\t/.test(line)) {
      errors.push('tab indentation is not valid frontmatter');
      continue;
    }
    if (block) {
      if (!line.trim()) {
        block.lines.push('');
        continue;
      }
      const indent = line.match(/^[ \t]*/)[0].length;
      if (block.indent === Infinity) block.indent = indent;
      if (indent >= block.indent) {
        block.lines.push(line.slice(block.indent));
        continue;
      }
      flushBlock();
    }
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const li = line.match(/^\s+-\s+(.*)$/);
    if (li && curKey) {
      if (!Array.isArray(data[curKey])) data[curKey] = [];
      data[curKey].push(unquote(li[1]));
      continue;
    }
    if (/^\s+-/.test(line)) {
      errors.push('sequence item has no key');
      continue;
    }
    if (/^\s+[A-Za-z0-9_-]+:\s*/.test(line)) {
      errors.push(`nested mapping under \`${curKey || 'frontmatter'}\` is not supported`);
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) {
      errors.push(`unparseable frontmatter line: ${line.trim()}`);
      continue;
    }
    const key = kv[1];
    if (Object.prototype.hasOwnProperty.call(data, key)) errors.push(`duplicate frontmatter key \`${key}\``);
    curKey = key;
    const v = kv[2].trim();
    if (v === '>' || v === '|' || v === '>-' || v === '|-' || v === '>+' || v === '|+') {
      data[key] = '';
      block = { key, mode: v[0], indent: Infinity, lines: [] };
      continue;
    }
    if (v === '') data[key] = '';
    else if (v.startsWith('[') && v.endsWith(']')) data[key] = splitList(v);
    else data[key] = unquote(v);
  }
  flushBlock();
  return { data, body: text.slice(m[0].length), has: true, errors };
}
function unquote(s) {
  if (s.startsWith('"')) {
    try { const value = JSON.parse(s); if (typeof value === 'string') return value; } catch {}
  }
  return s.replace(/^["'](.*)["']$/, '$1');
}
function upsertFm(text, key, value) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return text;
  const block = m[1];
  const rx = new RegExp('^' + key + ':.*$', 'm');
  const nb = rx.test(block) ? block.replace(rx, `${key}: ${value}`) : block + `\n${key}: ${value}`;
  return text.replace(block, nb);
}

/* ------------------------------------------------------------------ pages */
function isPageFile(abs) {
  const r = rel(abs);
  if (!r.startsWith('context/') || !r.endsWith('.md')) return false;
  return !CONFIG.pageExcludes.some((x) => (x.endsWith('/') ? r.startsWith(x) : r === x));
}
let _pages;
function pages() {
  if (_pages) return _pages;
  _pages = walk(CTX)
    .filter(isPageFile)
    .map((abs) => {
      const text = fs.readFileSync(abs, 'utf8');
      const { data, body, has, errors } = parseFrontmatter(text);
      for (const key of ['title', 'summary']) {
        if (typeof data[key] === 'string') data[key] = data[key].replace(/\s+/g, ' ').trim();
      }
      return { abs, rel: rel(abs), relCtx: posix(path.relative(CTX, abs)), text, data, body, has, fmErrors: errors, lines: text.split('\n').length };
    })
    .sort((a, b) => a.rel.localeCompare(b.rel));
  return _pages;
}
function tldr(p, n = 3) {
  const m = p.body.match(/##\s*TL;DR\s*\n([\s\S]*?)(?:\n##\s|$)/i);
  if (!m) return [];
  return m[1].split('\n').map((l) => l.trim()).filter(Boolean).slice(0, n);
}
function orientationFiles() {
  const files = CONFIG.alwaysRead.map((f) => f.replace(/\\/g, '/').replace(/^\.\//, ''));
  const found = new Map();
  for (const f of files) {
    if (!f || path.isAbsolute(f) || /^[A-Za-z]:/.test(f) || f.split('/').some((part) => part === '..' || part.startsWith('.env'))) die(`unsafe alwaysRead path: ${f} — use project-relative non-secret files`);
    const abs = path.resolve(ROOT, f);
    assertProjectPath(abs);
    const exists = fs.existsSync(abs);
    if (exists && (!fs.statSync(abs).isFile() || posix(fs.realpathSync(abs)).split('/').some((part) => part.startsWith('.env')))) die(`alwaysRead must reference a non-secret file: ${f}`);
    const file = rel(abs);
    if (!found.has(file)) found.set(file, { page: file, tokens: exists ? tokens(fs.readFileSync(abs, 'utf8')) : 0, missing: !exists });
  }
  return [...found.values()];
}
function stripCode(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
}

/* --------------------------------------------------------------- profiles */
/* The skill must fit every repo, so init never assumes Node or a web app:
   detect() reads the manifests that exist and derives languages, shape and
   which scaffold groups / config seeds make sense. */
const LANG_EXT = {
  node: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte'],
  python: ['.py', '.pyi'],
  go: ['.go'],
  rust: ['.rs'],
  java: ['.java', '.kt'],
  ruby: ['.rb'],
  php: ['.php'],
  dart: ['.dart'],
  elixir: ['.ex', '.exs'],
  cpp: ['.c', '.cc', '.cpp', '.h', '.hpp'],
  docs: ['.md', '.mdx'],
};
const COMMON_EXT = ['.sql', '.prisma', '.proto', '.graphql', '.tf', '.sh', '.html', '.css', '.scss'];
const STACK_IGNORES = {
  node: ['**/*.d.ts', '**/*.test.*', '**/*.spec.*', '**/__tests__/**', '**/*.config.*'],
  python: ['**/__pycache__/**', '**/*.pyc', '**/.venv/**', '**/tests/**'],
  go: ['**/vendor/**', '**/*_test.go'],
  rust: ['**/target/**', '**/tests/**'],
  java: ['**/build/**', '**/src/test/**'],
};
const DEP_MARKERS = {
  ui: ['react', 'react-dom', 'next', 'vue', 'nuxt', 'svelte', '@angular/core', 'preact', 'solid-js', '@remix-run'],
  mobile: ['react-native', 'expo', '@ionic', 'flutter', 'native'],
  backend: ['express', 'fastify', 'koa', '@nestjs', 'hono', '@hapi', 'flask', 'django', 'fastapi', 'gin', 'actix', 'axum', 'rails', 'spring'],
  db: ['prisma', 'drizzle', 'typeorm', 'sequelize', 'knex', 'mongoose', 'postgres', 'mysql2', 'sqlalchemy', 'django', 'ecto', 'activerecord', 'gorm', 'diesel', 'sqlx'],
  cli: ['commander', 'yargs', 'minimist', 'oclif', 'inquirer', 'prompts', 'cobra', 'clap', 'argparse', 'typer', 'click', 'blessed'],
  data: ['pandas', 'numpy', 'scikit', 'airflow', 'pyspark', 'dbt', 'polars', 'spark'],
  docs: ['docusaurus', 'astro', 'vitepress', 'eleventy', 'mkdocs', 'sphinx'],
};
const MANIFEST_LANG = {
  'package.json': 'node', 'pyproject.toml': 'python', 'requirements.txt': 'python', 'setup.py': 'python', 'Pipfile': 'python',
  'go.mod': 'go', 'Cargo.toml': 'rust', 'pom.xml': 'java', 'build.gradle': 'java', 'build.gradle.kts': 'java',
  'Gemfile': 'ruby', 'composer.json': 'php', 'pubspec.yaml': 'dart', 'mix.exs': 'elixir', 'CMakeLists.txt': 'cpp', 'mkdocs.yml': 'docs',
};
const AGENT_TOOLS = [
  { id: 'claude', dir: '.claude', note: 'settings.json hooks + CLAUDE.md already wired by core' },
  { id: 'cursor', dir: '.cursor', file: 'cursor-rule.mdc.template', dest: '.cursor/rules/project-context.mdc' },
  { id: 'codex', dir: '.codex', note: 'reads AGENTS.md natively — no extra file needed' },
  { id: 'gemini', dir: '.gemini', file: 'GEMINI.md.template', dest: 'GEMINI.md' },
  { id: 'copilot', dir: '.github', file: 'copilot-instructions.md.template', dest: '.github/copilot-instructions.md' },
];

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function detect(root) {
  const langs = new Set();
  const signals = new Set();
  const manifests = [];
  const top = (() => {
    try {
      return fs.readdirSync(root);
    } catch {
      return [];
    }
  })();
  for (const f of top) {
    if (MANIFEST_LANG[f]) {
      langs.add(MANIFEST_LANG[f]);
      manifests.push(f);
    }
  }
  const pkg = readJsonSafe(path.join(root, 'package.json'));
  const allDeps = pkg ? Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }).join(' ').toLowerCase() : '';
  const manifestText = manifests.map((f) => (fs.readFileSync(path.join(root, f), 'utf8') || '').toLowerCase()).join(' ');
  // dep names may substring-match (npm scopes); free manifest text needs word-ish boundaries
  // so 'gin' inside "context-engineering" never claims a Go backend
  const depRx = (m) => new RegExp(`(^|[^a-z0-9-])${m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'm');
  for (const [sig, markers] of Object.entries(DEP_MARKERS)) {
    if (markers.some((m) => allDeps.includes(m) || depRx(m).test(manifestText))) signals.add(sig);
  }
  if (pkg && (pkg.bin || /commander|yargs|oclif|inquirer/.test(allDeps)) && !signals.has('ui')) signals.add('cli');
  if (pkg && (pkg.main || pkg.exports) && !signals.has('ui') && !signals.has('backend')) signals.add('library');
  const isMonorepo = !!(pkg && pkg.workspaces) || top.includes('pnpm-workspace.yaml') || ['apps', 'packages'].some((d) => top.includes(d) && fs.existsSync(path.join(root, d)));
  const kinds = [];
  if (isMonorepo) kinds.push('monorepo');
  if (signals.has('mobile')) kinds.push('mobile');
  if (signals.has('ui')) kinds.push('web-app');
  if (signals.has('backend') && !signals.has('ui')) kinds.push('api');
  if (signals.has('cli')) kinds.push('cli');
  if (signals.has('data')) kinds.push('data');
  if (signals.has('library')) kinds.push('library');
  if (signals.has('docs')) kinds.push('docs');
  if (!langs.size && !kinds.length) {
    // probe with the DEFAULT code extensions — the seeded config may list .md, and the
    // scaffold's own pages must never flip a docs project into "generic" after setup
    const hasAnySource = walk(root).some((f) => DEFAULTS.sourceExt.includes(path.extname(f)) && !rel(f).startsWith('context/'));
    kinds.push(hasAnySource ? 'generic' : 'docs');
    if (!langs.size) langs.add(hasAnySource ? 'generic' : 'docs');
  }
  const sourceExt = [...new Set([...[...langs].flatMap((l) => LANG_EXT[l] || []), ...(langs.has('docs') && !langs.size ? [] : COMMON_EXT)])];
  const ignoreSourceGlobs = [...new Set([...(langs.has('node') ? STACK_IGNORES.node : []), ...[...langs].filter((l) => STACK_IGNORES[l] && l !== 'node').flatMap((l) => STACK_IGNORES[l])])];
  const tools = AGENT_TOOLS.filter((t) => top.includes(t.dir) || (t.id === 'copilot' && fs.existsSync(path.join(root, '.github', 'copilot-instructions.md'))));
  return { langs: [...langs], kinds, signals: [...signals], isMonorepo, manifests, tools: tools.map((t) => t.id), sourceExt, ignoreSourceGlobs };
}

/* Code-intelligence tools worth delegating to instead of hand-rolling (see references/tool-delegation.md). */
const INTEL_TOOLS = [
  { id: 'graphify', probe: () => fs.existsSync(path.join(ROOT, 'graphify-out')) || hasBin('graphify'), best: 'codebase map, module boundaries, dependency questions', how: 'run the graphify skill; distill its output into context/codebase/ pages (ctx owns covers:/TL;DR routing)' },
  { id: 'ctags', probe: () => hasBin('ctags') || hasBin('universal-ctags') || fs.existsSync(path.join(ROOT, 'tags')), best: 'symbol index (functions, classes, exports) per file', how: '`ctags -R` gives the public-surface tables of module pages for free' },
  { id: 'aider', probe: () => hasBin('aider'), best: 'repo-map ranked by PageRank over imports', how: '`aider --map-tokens 2048` output seeds codebase/map.md' },
  { id: 'dependency-cruiser', probe: () => hasBin('depcruise') || fs.existsSync(path.join(ROOT, 'node_modules', '.bin', 'depcruise')), best: 'import graph, cycles, layering violations', how: 'depcruise --output-type dot src | feed the edges into architecture.md dependency notes' },
  { id: 'madge', probe: () => hasBin('madge') || fs.existsSync(path.join(ROOT, 'node_modules', '.bin', 'madge')), best: 'circular dependencies, orphan modules', how: 'madge --circular src — record findings as gotchas in module pages' },
  { id: 'tree-sitter', probe: () => hasBin('tree-sitter'), best: 'structural queries in 100+ languages', how: 'use for symbol extraction when ctags is not enough' },
  { id: 'pyright/mypy', probe: () => hasBin('pyright') || hasBin('mypy'), best: 'python type surface', how: 'typecheck command for AGENTS.md project facts' },
  { id: 'go list', probe: () => detect(ROOT).langs.includes('go') && hasBin('go'), best: 'package dependency graph', how: '`go list -deps ./...` feeds module pages' },
  { id: 'cargo', probe: () => detect(ROOT).langs.includes('rust') && hasBin('cargo'), best: 'crate graph', how: '`cargo tree` seeds library-docs.md' },
];
function hasBin(name) {
  try {
    execFileSync(process.platform === 'win32' ? 'where' : 'which', [name], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------- git state */
function gitFiles(args) {
  const out = git(args);
  return out === null ? null : out.split('\0').filter(Boolean);
}
function changedSince(base) {
  return gitFiles(['diff', '--name-only', '-z', '--no-renames', '--relative', base, 'HEAD', '--', '.']);
}
function dirtyFiles() {
  const out = git(['status', '--porcelain', '-z', '-uall']);
  const s = new Set();
  if (!out) return s;
  // Porcelain -z always uses repository-root paths, even from a nested project.
  const prefix = git(['rev-parse', '--show-prefix']) || '';
  const add = (f) => {
    if (!prefix || f.startsWith(prefix)) s.add(f.slice(prefix.length));
  };
  const records = out.split('\0');
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (!record) continue;
    add(record.slice(3));
    if (/[RC]/.test(record.slice(0, 2))) add(records[++i]); // destination then original
  }
  return s;
}
const diffCache = new Map();
function committedDiff(base) {
  if (!diffCache.has(base)) {
    diffCache.set(base, changedSince(base));
  }
  return diffCache.get(base);
}
const validCommit = (s) => !!s && git(['cat-file', '-e', `${s}^{commit}`]) !== null;
const isAncestor = (a, b) => {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', a, b], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

/** Staleness = covered code changed after the page was last touched (or re-stamped). */
function staleReport() {
  if (!HAS_GIT()) return { available: false, items: [] };
  const dirty = dirtyFiles();
  const items = [];
  for (const p of pages()) {
    const covers = asList(p.data.covers);
    if (!covers.length || ['superseded', 'archived'].includes(p.data.status)) continue;
    const rx = matchers(covers);
    const last = git(['log', '-1', '--format=%H', '--', p.rel]);
    const v = p.data.verified_at;
    let base = last || null;
    if (v && validCommit(v)) {
      const full = git(['rev-parse', v]);
      if (!last || isAncestor(last, full)) base = full;
    }
    const pageDirty = dirty.has(p.rel);
    if (!base && !pageDirty) continue;
    let files = [];
    if (base) {
      const d = committedDiff(base);
      if (d) files = d.filter((f) => !f.startsWith('context/'));
    }
    if (!pageDirty) files = files.concat([...dirty].filter((f) => !f.startsWith('context/')));
    const hits = [...new Set(files.filter((f) => anyMatch(rx, f)))];
    if (hits.length) items.push({ p, hits, base });
  }
  return { available: true, items };
}

function sourceFiles() {
  const files = gitFiles(['ls-files', '-z', '-co', '--exclude-standard']) ?? walk(ROOT).map(rel);
  const ign = matchers(CONFIG.ignoreSourceGlobs);
  return files.filter((f) => !f.startsWith('context/') && CONFIG.sourceExt.includes(path.extname(f)) && !CONFIG.ignoreDirs.some((d) => f.split('/').includes(d)) && !anyMatch(ign, f) && fs.existsSync(path.join(ROOT, f)));
}

/* --------------------------------------------------------------- commands */
const commands = {};

/* ------------------------------------------------------------------ detect */
commands.detect = () => {
  const d = detect(ROOT);
  emit({ command: 'detect', ok: true, ...d, groups: groupsFor(d, flags) }, () => {
    console.log(`project profile for ${ROOT}`);
    console.log(`  languages: ${d.langs.join(', ') || '—'}`);
    console.log(`  kinds:     ${d.kinds.join(', ') || '—'}${d.isMonorepo ? ' (workspaces detected)' : ''}`);
    console.log(`  signals:   ${d.signals.join(', ') || '—'}`);
    console.log(`  manifests: ${d.manifests.join(', ') || '—'}`);
    console.log(`  agent tools present: ${d.tools.join(', ') || '—'}`);
    console.log(`  scaffold groups: ${groupsFor(d, flags).join(', ')}`);
  });
};

/* ------------------------------------------------------------------- tools */
commands.tools = () => {
  const found = INTEL_TOOLS.map((t) => ({ ...t, available: false })).filter((t) => {
    try {
      t.available = !!t.probe();
    } catch {
      /* probe failed -> treat as unavailable */
    }
    return t.available;
  });
  emit({ command: 'tools', ok: true, available: found.map((t) => t.id), tools: found.map(({ probe, ...rest }) => rest) }, () => {
    console.log('Delegation targets — use these instead of hand-building the equivalent (references/tool-delegation.md):');
    if (!found.length) console.log('  (none found — ctx does map/coverage work by hand: parallel read-only subagents, see references/codebase-wiki.md)');
    for (const t of found) console.log(`  ✓ ${t.id}\n      best: ${t.best}\n      how:  ${t.how}`);
    console.log('\nRule: the tool produces, the wiki keeps — distill output into context/ pages, never paste raw dumps.');
  });
};

/* ---- install — copies this skill package into an agent tool's skills folder.
   Run it from a clone of the skill; only the shippable parts go. */
const TOOL_HOMES = { claude: ['.claude', 'skills'], qoder: ['.qoder', 'skills'] };
const SHIP = ['SKILL.md', 'references', 'assets', 'scripts'];
const INSTALL_MANIFEST = '.ctx-install.json';
function assertNotSymlink(file, label = 'destination') {
  try {
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error(`refusing ${label} symlink: ${file}`);
  } catch (e) {
    if (e.code === 'ENOENT') return;
    if (String(e.message).startsWith('refusing ')) throw e;
    throw e;
  }
}
function copyTreeSafe(src, dst) {
  const st = fs.lstatSync(src);
  if (st.isSymbolicLink()) throw new Error(`refusing to ship symlink: ${src}`);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) copyTreeSafe(path.join(src, entry), path.join(dst, entry));
  } else if (st.isFile()) {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  } else throw new Error(`refusing to ship non-file: ${src}`);
}
function shipFiles() {
  const out = [];
  const visit = (abs) => {
    const st = fs.lstatSync(abs);
    if (st.isSymbolicLink()) throw new Error(`refusing to ship symlink: ${abs}`);
    if (st.isDirectory()) for (const entry of fs.readdirSync(abs)) visit(path.join(abs, entry));
    else if (st.isFile()) out.push(posix(path.relative(SKILL_DIR, abs)));
  };
  for (const item of SHIP) {
    const abs = path.join(SKILL_DIR, item);
    if (fs.existsSync(abs)) visit(abs);
  }
  return out.sort();
}
function installStamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '') + '-' + process.pid;
}
commands.install = () => {
  const skillMd = path.join(SKILL_DIR, 'SKILL.md');
  if (!fs.existsSync(skillMd)) return die('install must run from the cloned skill repo (no SKILL.md beside scripts/)');
  const { data, has, errors } = parseFrontmatter(fs.readFileSync(skillMd, 'utf8'));
  if (!has || errors.length || typeof data.name !== 'string' || !data.name.trim()) return die('refusing missing, empty or invalid skill name frontmatter in SKILL.md');
  const name = data.name.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || name === '.' || name === '..') {
    return die(`refusing unsafe skill name from SKILL.md: ${JSON.stringify(name)}`);
  }
  const home = os.homedir();
  let targets;
  if (flags.dest && flags.dest !== true) targets = [path.resolve(String(flags.dest), name)];
  else {
    const tool = flags.tool && flags.tool !== true ? String(flags.tool) : 'auto';
    if (tool === 'auto') {
      targets = Object.values(TOOL_HOMES).filter(([d]) => fs.existsSync(path.join(home, d))).map(([d, sub]) => path.join(home, d, sub, name));
      if (!targets.length) return die(`no supported tool home found in ${home} (~/.claude or ~/.qoder) — pass --tool claude|qoder or --dest <dir>`);
    } else if (TOOL_HOMES[tool]) targets = [path.join(home, TOOL_HOMES[tool][0], TOOL_HOMES[tool][1], name)];
    else return die(`unknown --tool "${tool}" — use claude|qoder|auto, or --dest <dir>`);
  }
  const files = shipFiles();
  const validateDestination = (dst) => {
    assertNotSymlink(dst);
    const source = realPathWithMissing(SKILL_DIR);
    const target = realPathWithMissing(dst);
    if (pathInside(SKILL_DIR, dst) || pathInside(dst, SKILL_DIR) || pathInside(source, target) || pathInside(target, source)) throw new Error('refusing to install onto, inside or over an ancestor of its source tree');
    if (fs.existsSync(dst) && !fs.statSync(dst).isDirectory()) throw new Error(`install destination is not a directory: ${dst}`);
  };
  try { for (const dst of targets) validateDestination(dst); } catch (e) { return die(e.message); }
  for (const dst of targets) {
    if (flags['dry-run']) {
      console.log(`would install ${name} v${VERSION} → ${dst}`);
      for (const file of files) console.log(`  ${file}`);
      continue;
    }
    const parent = path.dirname(dst);
    fs.mkdirSync(parent, { recursive: true });
    const stage = fs.mkdtempSync(path.join(parent, `.${name}.stage-`));
    let backup = null;
    let backedUp = false;
    try {
      for (const item of SHIP) copyTreeSafe(path.join(SKILL_DIR, item), path.join(stage, item));
      atomicWrite(path.join(stage, INSTALL_MANIFEST), JSON.stringify({
        name,
        version: VERSION,
        installedAt: new Date().toISOString(),
        checksum: createHash('sha256').update(fs.readFileSync(skillMd)).digest('hex'),
        files,
      }, null, 2) + '\n');
      validateDestination(dst);
      if (linkStat(dst)) {
        backup = `${dst}.ctx-backup-${installStamp()}-${randomUUID()}`;
        fs.renameSync(dst, backup);
        backedUp = true;
      }
      if (linkStat(dst)) throw new Error(`install destination changed before publication: ${dst}`);
      fs.renameSync(stage, dst);
    } catch (e) {
      const recovery = [];
      try { fs.rmSync(stage, { recursive: true, force: true }); } catch { recovery.push(stage); }
      if (backedUp) {
        try { if (!linkStat(dst)) fs.renameSync(backup, dst); } catch {}
        if (linkStat(backup)) recovery.push(backup);
      }
      return die(`install failed: ${e.message}${recovery.length ? `; preserved for recovery: ${recovery.join(', ')}` : ''}`);
    }
    console.log(`installed ${name} v${VERSION} → ${dst}`);
    if (backup) console.log(`backup: ${backup}`);
  }
  console.log('Next: in any project, tell the agent "set up the project context system" — or run node <install-dir>/scripts/ctx.mjs setup from the project root.');
};

/* ---- brief */
commands.brief = () => {
  if (!pos.length) return die('usage: ctx brief <file | feature | keywords...> [--limit N] [--budget TOKENS] [--json] [--history]');
  const limit = flags.limit === undefined ? 8 : Number(flags.limit);
  const budget = flags.budget === undefined ? Infinity : Number(flags.budget);
  if (!Number.isSafeInteger(limit) || limit < 1) return die('--limit must be a positive integer');
  if (budget !== Infinity && (!Number.isSafeInteger(budget) || budget < 0) || flags.budget !== undefined && budget === Infinity) return die('--budget must be a non-negative integer');
  const inputs = [...new Set(pos.map((s) => s.replace(/\\/g, '/').replace(/^\.\//, '')))];
  const terms = [...new Set(inputs.flatMap((t) => t.toLowerCase().split(/[^a-z0-9_.\/-]+/)).filter((t) => t.length > 2))];
  const alwaysRead = orientationFiles();
  const health = staleReport();
  const stale = new Set(health.items.map((i) => i.p.rel));
  const dirtySources = health.available ? [...dirtyFiles()].filter((f) => !f.startsWith('context/')) : [];
  const trust = (p) => {
    const cov = matchers(p.data.covers);
    const warnings = [];
    const globErrors = cov.map((rx) => rx.globError).filter(Boolean);
    const changedSources = dirtySources.filter((f) => anyMatch(cov, f));
    const isStale = stale.has(p.rel) || p.data.status === 'stale';
    const retired = ['superseded', 'archived'].includes(p.data.status);
    const unfilled = /\{\{[^}]+\}\}/.test(stripCode(p.text)) || /^summary:\s*TODO\b/m.test(p.text) || tldr(p).some((l) => /\bTODO\b/.test(l));
    if (changedSources.length) warnings.push('Covered working-tree sources changed: verify claims even if this page was touched');
    if (p.data.status === 'draft') warnings.push('DRAFT: not approved current guidance');
    if (isStale) warnings.push('STALE: verify against current sources');
    if (unfilled) warnings.push('UNFILLED: draft is not established knowledge');
    if (retired) warnings.push('HISTORY: not current instructions');
    if (p.data.confidence && p.data.confidence !== 'verified') warnings.push(`Confidence: ${p.data.confidence}`);
    if (cov.length && !p.data.confidence) warnings.push('No recorded confidence for code claims');
    if (cov.length && !health.available) warnings.push('Git unavailable: freshness not checked');
    for (const err of globErrors) warnings.push(err);
    return { confidence: p.data.confidence || null, stale: isStale, verificationRequired: warnings.length > 0, changedSources, warnings };
  };
  const knownPages = pages();
  const routingErrors = knownPages.flatMap((p) =>
    matchers(p.data.covers)
      .filter((rx) => rx.globError)
      .map((rx) => ({ page: p.rel, error: rx.globError })),
  );
  for (const p of alwaysRead) {
    const page = knownPages.find((known) => known.rel === p.page);
    if (!page) continue;
    if (['superseded', 'archived'].includes(page.data.status) && !flags.history) die(`retired alwaysRead page: ${p.page} — remove it from orientation or explicitly use --history`);
    Object.assign(p, trust(page));
  }
  const alwaysSet = new Set(alwaysRead.map((p) => p.page));
  const scored = [];
  for (const p of pages()) {
    const retired = ['superseded', 'archived'].includes(p.data.status);
    if (alwaysSet.has(p.rel) || retired && !flags.history) continue;
    let score = 0;
    const why = [];
    const cov = matchers(p.data.covers);
    for (const f of inputs) {
      if (cov.length && anyMatch(cov, f)) {
        score += 100;
        why.push(`covers ${f}`);
      }
    }
    const title = String(p.data.title || '').toLowerCase();
    const summary = String(p.data.summary || '').toLowerCase();
    const tags = asList(p.data.tags).join(' ').toLowerCase();
    const body = p.body.toLowerCase();
    for (const t of terms) {
      if (title.includes(t)) (score += 6), why.push(`title~${t}`);
      if (tags.includes(t)) (score += 5), why.push(`tag~${t}`);
      if (summary.includes(t)) (score += 3), why.push(`summary~${t}`);
      if (p.rel.toLowerCase().includes(t)) score += 3;
      if (asList(p.data.covers).some((c) => String(c).toLowerCase().includes(t))) score += 2;
      const c = body.split(t).length - 1;
      if (c) score += Math.min(c, 4);
    }
    if (retired) score = Math.floor(score / 4);
    const unfilled = /\{\{[^}]+\}\}/.test(stripCode(p.text)) || /^summary:\s*TODO\b/m.test(p.text) || tldr(p).some((l) => /\bTODO\b/.test(l));
    if (unfilled) score = Math.floor(score / 3);
    if (score <= 0) continue;
    scored.push({ page: p.rel, title: p.data.title || '', type: p.data.type || '', status: p.data.status || '', summary: p.data.summary || '', ...trust(p), score, reasons: [...new Set(why)].slice(0, 3), tokens: tokens(p.text), tldr: tldr(p, 3) });
  }
  scored.sort((a, b) => b.score - a.score || a.page.localeCompare(b.page));
  let used = alwaysRead.reduce((n, p) => n + p.tokens, 0);
  const budgetExceeded = used > budget;
  const selected = [], skipped = [];
  for (const s of scored) {
    const reason = selected.length >= limit ? 'limit' : used + s.tokens > budget ? 'budget' : null;
    if (reason) skipped.push({ page: s.page, tokens: s.tokens, reason });
    else {
      used += s.tokens;
      selected.push(s);
    }
  }
  const covering = pages_().flatMap((p) => matchers(p.data.covers));
  const blindSpots = inputs.filter((f) => (f.includes('/') || /\.[a-z0-9]+$/i.test(f)) && !anyMatch(covering, f));
  const payload = { command: 'brief', ok: !budgetExceeded && !alwaysRead.some((p) => p.missing || p.verificationRequired) && selected.length > 0 && !blindSpots.length && !selected.some((p) => p.verificationRequired) && !routingErrors.length, alwaysRead, pages: selected, skipped, blindSpots, routingErrors, estimatedTokens: used, budget: budget === Infinity ? null : budget, budgetExceeded, gitAvailable: health.available };
  emit(payload, () => {
    console.log('ALWAYS READ (orient):');
    for (const p of alwaysRead) {
      console.log(`  - ${p.page}  (${p.missing ? 'MISSING' : '~' + fmtTok(p.tokens) + ' tok'})`);
      for (const warning of p.warnings || []) console.log(`     ! ${warning}`);
    }
    if (budgetExceeded) console.log(`\nBUDGET EXCEEDED: mandatory orientation alone costs ~${fmtTok(used)} tokens. Raise --budget or reduce alwaysRead; no task pages selected.`);
    console.log('\nTASK-RELEVANT (read in this order, stop when you have enough):');
    selected.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.page}  [${p.type || '?'}/${p.status || '?'}, ~${fmtTok(p.tokens)} tok]  (${p.reasons.join(', ')})`);
      if (p.summary) console.log(`     ${p.summary}`);
      for (const l of p.tldr) console.log(`     > ${l.replace(/^[-*]\s*/, '')}`);
      for (const w of p.warnings) console.log(`     ! ${w}`);
    });
    if (!selected.length) console.log(scored.length ? '  (matching pages omitted by budget/limit; inspect skipped in --json or raise the budget)' : '  (no matching pages; inspect relevant sources and record only reusable knowledge)');
    if (skipped.length) console.log(`\nOmitted: ${skipped.filter((p) => p.reason === 'budget').length} by budget, ${skipped.filter((p) => p.reason === 'limit').length} by limit.`);
    if (blindSpots.length) console.log(`\nBLIND SPOT: no current page documents ${blindSpots.join(', ')}. Check the sources; update a relevant page or create a reusable module page.`);
    for (const item of routingErrors) console.log(`\nROUTING CONFIG ERROR: ${item.page} — ${item.error}; routing cannot use this page until the glob is fixed.`);
    console.log(`\nEstimated full-page read cost: ~${fmtTok(used)} tokens (characters / 4, not model tokenization). Read TL;DR first; verify flagged claims before relying on them.`);
  });
};

/* ---- impact */
function impactData(workingTreeOnly = false) {
  const dirty = dirtyFiles();
  const changed = new Set(dirty);
  if (!workingTreeOnly && flags.since) {
    const files = validCommit(String(flags.since)) ? changedSince(String(flags.since)) : null;
    if (files === null) die(`invalid --since commit: ${flags.since}`);
    for (const f of files) changed.add(f);
  } else if (!workingTreeOnly && !dirty.size) for (const f of changedSince('HEAD~1') || []) changed.add(f);
  const all = [...changed];
  const code = all.filter((f) => !f.startsWith('context/') && !/^(AGENTS|CLAUDE|CLAUDE\.local|memory|GEMINI)\.md$/.test(f) && !f.startsWith('.claude/'));
  const touchedPages = new Set(all);
  const rows = [];
  const covered = new Set();
  for (const p of pages()) {
    if (['superseded', 'archived'].includes(p.data.status)) continue;
    const rx = matchers(p.data.covers);
    if (!rx.length) continue;
    const hits = code.filter((f) => anyMatch(rx, f));
    if (!hits.length) continue;
    hits.forEach((h) => covered.add(h));
    rows.push({ p, hits, updated: touchedPages.has(p.rel) });
  }
  const uncovered = code.filter((f) => !covered.has(f) && CONFIG.sourceExt.includes(path.extname(f)) && !anyMatch(matchers(CONFIG.ignoreSourceGlobs), f));
  const trackerTouched = ['context/progress-tracker.md', 'memory.md'].filter((f) => touchedPages.has(f));
  return { code, rows, uncovered, trackerTouched, all };
}
commands.impact = () => {
  if (!HAS_GIT()) return die('impact needs a git repository');
  const { code, rows, uncovered, trackerTouched } = impactData();
  const clean = !rows.some((r) => !r.updated) && !uncovered.length && !!trackerTouched.length;
  emit({ command: 'impact', ok: clean, changedCode: code.length, uncovered, trackerTouched, pages: rows.map((r) => ({ page: r.p.rel, updated: r.updated, hits: r.hits })) }, () => {
    console.log(`IMPACT — ${code.length} changed code file(s)`);
    if (!rows.length) console.log('  (no page covers the changed files)');
    for (const r of rows) console.log(`  ${r.updated ? '✓ updated ' : '✗ REVIEW  '} ${r.p.rel}   <- ${r.hits.slice(0, 3).join(', ')}${r.hits.length > 3 ? ` +${r.hits.length - 3}` : ''}`);
    if (uncovered.length) {
      console.log('\nUNCOVERED changed files (no page documents them — add to a page\'s `covers:` or create a page):');
      uncovered.slice(0, 15).forEach((f) => console.log('  ? ' + f));
    }
    console.log(`\nTracker/memory touched: ${trackerTouched.length ? trackerTouched.join(', ') : 'NO — update progress-tracker.md and memory.md'}`);
  });
  if (flags.check && !clean) process.exit(2);
};

/* ---- stale */
commands.stale = () => {
  const r = staleReport();
  emit({ command: 'stale', ok: !r.available || !r.items.length, git: r.available, items: r.items.map((i) => ({ page: i.p.rel, hits: i.hits })) }, () => {
    if (!r.available) return console.log('git not available — staleness detection skipped');
    if (!r.items.length) return console.log('No stale pages. ✔');
    console.log(`${r.items.length} stale page(s) — covered code changed after the page was last updated:`);
    for (const { p, hits } of r.items) console.log(`  ! ${p.rel}\n      ${hits.slice(0, 4).join(', ')}${hits.length > 4 ? ` +${hits.length - 4} more` : ''}`);
    console.log('\nFix: re-read the page against the code, edit what is wrong, then `ctx stamp <page>`.');
  });
  if (flags.strict && r.available && r.items.length) process.exit(1);
};

/* ---- ownership: structural checks; semantic separation still needs review */
const CORE_OWNERS = ['AGENTS.md', 'memory.md', 'context/index.md', 'context/ownership.md', 'context/decisions.md', 'context/progress-tracker.md'];
function ownershipHealth() {
  const errors = CORE_OWNERS.filter((file) => !fs.existsSync(path.join(ROOT, file))).map((file) => `missing canonical owner: ${file} — re-run setup`);
  for (const dir of ['.agents/agents', '.agents/rules', '.agents/skills']) if (!fs.existsSync(path.join(ROOT, dir)) || !fs.statSync(path.join(ROOT, dir)).isDirectory()) errors.push(`missing canonical resource directory: ${dir} — re-run setup`);
  const adapters = adapterReport({ check: true });
  errors.push(...adapters.errors);
  for (const conflict of adapters.conflicts) errors.push(`adapter conflict ${conflict.file}: ${conflict.reason} (canonical: ${conflict.source})`);
  for (const adapter of adapters.adapters) if (!adapter.ok) errors.push(`adapter out of sync: ${adapter.file} -> ${adapter.source} — run ctx adapters or review the conflict`);
  return { errors: [...new Set(errors)], adapters };
}
function duplicateProse(ps, resources) {
  // ponytail: exact long paragraphs only; semantic paraphrases require human review.
  const docs = ps.filter((p) => ['active', 'stale'].includes(p.data.status) && !['decision-log', 'tracker', 'source', 'feature'].includes(p.data.type)).map((p) => ({ file: p.rel, body: p.body }));
  for (const file of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'memory.md']) {
    const abs = path.join(ROOT, file);
    if (fs.existsSync(abs)) docs.push({ file, body: parseFrontmatter(fs.readFileSync(abs, 'utf8')).body });
  }
  for (const resource of resources) docs.push({ file: resource.file, body: resource.body });
  const seen = new Map();
  const realOwners = new Set();
  for (const doc of docs) {
    const owner = fs.realpathSync(path.resolve(ROOT, doc.file));
    if (realOwners.has(owner)) continue; // symlinked entrypoints are the same owner, not copied prose
    realOwners.add(owner);
    for (const paragraph of stripCode(doc.body).split(/\n\s*\n/)) {
      if (/\{\{|\bTODO\b|^\s*(?:#|\||>|<!--)/m.test(paragraph)) continue;
      const key = paragraph.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (key.length < 180) continue;
      if (!seen.has(key)) seen.set(key, new Set());
      seen.get(key).add(doc.file);
    }
  }
  return [...seen.values()].filter((files) => files.size > 1).map((files) => `duplicate prose: ${[...files].sort().join(' and ')} — keep one live owner and link to it; review for intentional snapshots`);
}

/* ---- lint */
const DECISION_FIELDS = ['Trigger', 'Options considered', 'Chosen', 'Lost alternative', 'Cost paid', 'Reversibility', 'Correctness policy'];
const NEAR_MISS_KEYS = {
  cover: 'covers',
  coverss: 'covers',
  summery: 'summary',
  statuss: 'status',
  titel: 'title',
  updted: 'updated',
  tag: 'tags',
  relateds: 'related',
};
commands.lint = () => {
  if (flags.fix) commands.index();
  const errors = [];
  const warns = [];
  const E = (m) => errors.push(m);
  const W = (m) => warns.push(m);
  const scanCodeSpans = (text, label, abs) => {
    let fence = null;
    const prose = text.split(/\r?\n/).filter((line) => {
      if (fence) {
        if (new RegExp(`^ {0,3}${fence.char}{${fence.length},}\\s*$`).test(line)) fence = null;
        return false;
      }
      const open = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (open && (open[1][0] !== '`' || !open[2].includes('`'))) {
        fence = { char: open[1][0], length: open[1].length };
        return false;
      }
      return true;
    }).join('\n');
    for (const m of prose.matchAll(/`([^`\n]+)`/g)) {
      const token = m[1].trim();
      if (!token || /^-/.test(token) || /\s|[{}*<>$|"'`=]/.test(token) || /^[a-z]+:/i.test(token)) continue;
      const looksPath = /^[\w.@-]+(?:\/[\w.@-]+)*\/?$/.test(token) && (token.includes('/') || /\.(md|mjs|js|json|ts|tsx|jsx|py|go|rs|toml|ya?ml)$/.test(token));
      if (!looksPath) continue;
      const found = [path.resolve(ROOT, token), path.resolve(path.dirname(abs), token)].some((f) => fs.existsSync(f));
      if (!found) E(`${label}: code-span path not found -> ${token}`);
    }
  };
  const ps = pages();
  if (!fs.existsSync(CTX)) return die('no context/ folder — run: node <skill>/scripts/ctx.mjs init');
  const required = ['title', 'type', 'status', 'summary', 'updated'];
  const statuses = ['draft', 'active', 'in-progress', 'complete', 'stale', 'superseded', 'archived'];
  const slugs = new Map();
  for (const p of ps) {
    slugs.set(path.basename(p.rel, '.md').toLowerCase(), p);
    if (p.data.title) slugs.set(String(p.data.title).toLowerCase(), p);
  }

  for (const p of ps) {
    if (!p.has) {
      E(`${p.rel}: missing frontmatter (title, type, status, summary, updated)`);
      continue;
    }
    for (const err of p.fmErrors || []) E(`${p.rel}: ${err}`);
    for (const [wrong, right] of Object.entries(NEAR_MISS_KEYS)) {
      if (p.data[wrong] !== undefined && p.data[right] === undefined) E(`${p.rel}: frontmatter has \`${wrong}:\` but no \`${right}:\` — likely a typo; routing and staleness will not use it`);
    }
    for (const k of required) if (!p.data[k]) E(`${p.rel}: frontmatter missing \`${k}\``);
    if (p.data.status && !statuses.includes(p.data.status)) W(`${p.rel}: unknown status \`${p.data.status}\` (use ${statuses.join('|')})`);
    if (p.data.summary && String(p.data.summary).length > CONFIG.maxSummaryChars) W(`${p.rel}: summary > ${CONFIG.maxSummaryChars} chars (it is the index line — keep it tight)`);
    if (p.lines > CONFIG.maxPageLines) W(`${p.rel}: ${p.lines} lines > ${CONFIG.maxPageLines} — split it into focused pages`);
    if (p.lines > 40 && !/##\s*TL;DR/i.test(p.body)) W(`${p.rel}: no "## TL;DR" section (progressive disclosure: 3-5 lines an agent can stop at)`);
    if (p.data.status === 'superseded' && !p.data.superseded_by) W(`${p.rel}: superseded but no \`superseded_by\``);
    if (p.data.updated && !/^\d{4}-\d{2}-\d{2}/.test(String(p.data.updated)) && !/\{\{/.test(String(p.data.updated))) W(`${p.rel}: \`updated\` should be YYYY-MM-DD`);
    if (asList(p.data.covers).length) {
      const files = sourceFilesAll();
      for (const g of asList(p.data.covers)) {
        if (/\{\{/.test(g)) continue;
        const r1 = globToRegex(String(g));
        if (r1.globError) E(`${p.rel}: ${r1.globError}`);
        else if (!files.some((f) => r1.test(f))) W(`${p.rel}: covers \`${g}\` matches no file (dead pointer — fix or remove)`);
      }
    }
    if (/\{\{[^}]+\}\}/.test(stripCode(p.text))) (flags.strict ? E : W)(`${p.rel}: unfilled {{placeholder}} — fill it or delete the section`);
    // machine-specific absolute paths make committed files unportable — everything is project-relative
    if (/(?:^|[\s(`"'=])(?:[A-Za-z]:[\\/]|\/(?:Users|home)\/[^\s)`"']+)/.test(stripCode(p.text))) W(`${p.rel}: machine-specific absolute path — use project-relative paths (ctx commands run from the project root: node context/ctx.mjs …)`);

    // links
    const clean = stripCode(p.text);
    for (const m of clean.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const href = m[1].split('#')[0];
      if (!href || /^[a-z]+:/i.test(href) || href.startsWith('mailto:')) continue;
      const target = href.startsWith('/') ? path.join(ROOT, href) : path.resolve(path.dirname(p.abs), href);
      if (!fs.existsSync(target)) E(`${p.rel}: broken link -> ${m[1]}`);
    }
    for (const m of clean.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)) {
      const k = m[1].trim().toLowerCase();
      if (!slugs.has(k)) E(`${p.rel}: broken wikilink [[${m[1]}]]`);
    }
    for (const rel of asList(p.data.related)) {
      const target = String(rel).trim();
      if (!target || /^[a-z]+:/i.test(target) || target.startsWith('#')) continue;
      if (!fs.existsSync(path.resolve(path.dirname(p.abs), target))) E(`${p.rel}: related target not found -> ${target}`);
    }
    if (p.rel === 'context/workflow-rules.md') scanCodeSpans(p.text, p.rel, p.abs);
  }

  // index completeness / orphans
  const idxPath = path.join(CTX, 'index.md');
  if (!fs.existsSync(idxPath)) E('context/index.md missing — it is the router every session reads first');
  else {
    const idx = fs.readFileSync(idxPath, 'utf8');
    scanCodeSpans(idx, 'context/index.md', idxPath);
    if (!idx.includes('<!-- ctx:index:start -->')) W('context/index.md has no ctx:index markers — `ctx index` cannot regenerate the catalog');
    for (const p of ps) if (p.has && !['superseded', 'archived'].includes(p.data.status) && !idx.includes(p.relCtx)) W(`${p.rel}: orphan — not in context/index.md (run \`ctx index\`)`);
  }

  // decisions
  const dec = ps.find((p) => p.rel === 'context/decisions.md');
  if (dec) {
    const ids = [...dec.text.matchAll(/^##\s+D-(\d+)/gm)].map((m) => m[1]);
    const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    if (dup.length) E(`context/decisions.md: duplicate decision id(s) D-${[...new Set(dup)].join(', D-')}`);
    const known = new Set(ids);
    for (const p of ps) for (const m of stripCode(p.text).matchAll(/\bD-(\d{2,})\b/g)) if (!known.has(m[1]) && p.rel !== 'context/decisions.md' && !/NN/.test(m[0])) W(`${p.rel}: references D-${m[1]} which does not exist in decisions.md`);
    // completeness: every real (filled) D-NN record must carry all fields
    const blocks = dec.text.split(/\n(?=##\s)/).filter((b) => /^##\s+D-\d+/.test(b));
    for (const b of blocks) {
      if (/\{\{/.test(b)) continue; // unfilled template entry — the placeholder lint already covers it
      const id = (b.match(/^##\s+D-(\d+)/) || [])[1];
      const missing = DECISION_FIELDS.filter((f) => !new RegExp(`^${f}\\s*:`, 'm').test(b));
      if (missing.length) E(`context/decisions.md: D-${id} missing field(s): ${missing.join(', ')}`);
    }
  }

  // specs claimed complete but with unticked verification boxes
  for (const p of ps) {
    if (p.data.type === 'feature' && p.data.status === 'complete') {
      const unticked = (p.body.match(/^\s*[-*]\s*\[ ]/gm) || []).length;
      if (unticked) E(`${p.rel}: status is complete but ${unticked} verification check(s) still unticked — tick or reopen the status`);
    }
  }

  // tracker mutual exclusivity + every tracked unit must have a spec
  const { reservations: roadmap, errors: roadmapErrors } = roadmapReservations();
  roadmapErrors.forEach(E);
  const tr = ps.find((p) => p.rel === 'context/progress-tracker.md');
  if (tr) {
    const sect = (name) => (tr.text.match(new RegExp(`##\\s*${name}[^\\n]*\\n([\\s\\S]*?)(?:\\n##\\s|$)`, 'i')) || [])[1] || '';
    const feats = (s) => new Set([...s.matchAll(/Feature\s+(\d+)/gi)].map((m) => m[1]));
    const a = feats(sect('In progress'));
    const bl = feats(sect('Blocked'));
    const b = feats(sect('Completed'));
    const both = [...a].filter((x) => b.has(x) || bl.has(x)).concat([...bl].filter((x) => b.has(x)));
    if (both.length) E(`progress-tracker.md: Feature ${[...new Set(both)].join(', ')} appears in two states (In progress / Blocked / Completed must be exclusive)`);
    if (a.size > 1) W(`progress-tracker.md: ${a.size} features In progress — one unit at a time per agent/branch (ctx task start enforces this)`);
    // same-section duplicates = two branches claimed the same number (multi-user merge collision)
    const specDir = path.join(CTX, 'feature-specs');
    for (const s of ['In progress', 'Blocked', 'Up next', 'Completed']) {
      const ids = [...sect(s).matchAll(/Feature\s+(\d+)/gi)].map((m) => m[1]);
      const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      if (dup.length) E(`progress-tracker.md: Feature ${[...new Set(dup)].join(', ')} listed twice under ${s} — branch merge collision: keep one line per unit, renumber the other spec`);
    }
    const specNums = fs.existsSync(specDir) ? fs.readdirSync(specDir).filter((f) => /^\d+/.test(f)).map((f) => f.match(/^(\d+)/)[1]) : [];
    const sdup = specNums.filter((x, i) => specNums.indexOf(x) !== i);
    if (sdup.length) E(`feature-specs/: number ${[...new Set(sdup)].join(', ')} used by two specs (branch merge) — renumber one and update its tracker line`);
    const hasSpec = (id) => fs.existsSync(specDir) && fs.readdirSync(specDir).some((f) => f.startsWith(String(id).padStart(2, '0')));
    const upNext = feats(sect('Up next'));
    const tracked = new Set([...a, ...b, ...upNext, ...bl]);
    for (const id of tracked) {
      if (!hasSpec(id)) (a.has(id) || b.has(id) ? E : W)(`progress-tracker.md: Feature ${id} is tracked but has no spec in context/feature-specs/ — create one (ctx new feature <name>) or remove the line`);
    }
    const specPages = ps.filter((p) => p.data.type === 'feature' && /^\d+/.test(path.basename(p.rel)));
    if (roadmap.size) {
      for (const p of specPages) {
        const id = path.basename(p.rel).match(/^(\d+)/)[1];
        if (Number(id) >= 30 && !roadmap.has(id)) E(`${p.rel}: Feature ${id} is not reserved by context/build-plan.md — update the roadmap before keeping this spec`);
      }
      for (const id of tracked) {
        if (Number(id) >= 30 && !roadmap.has(id)) E(`progress-tracker.md: Feature ${id} is not reserved by context/build-plan.md — add it to the roadmap or remove the line`);
      }
    }
    const REQUIRED_SPEC_SECTIONS = ['TL;DR', 'What to build', 'Explicitly NOT in this spec', 'Clarifications', 'Value sources', 'Verification checklist'];
    for (const p of specPages) {
      const id = path.basename(p.rel).match(/^(\d+)/)[1];
      if (Number(id) >= 30) {
        for (const section of REQUIRED_SPEC_SECTIONS) {
          if (!new RegExp(`^##\\s+${regexEscape(section)}\\s*$`, 'm').test(p.text)) E(`${p.rel}: missing required spec section "## ${section}"`);
        }
      }
      if (p.data.status === 'complete') {
        if (!b.has(id)) E(`${p.rel}: status is complete but Feature ${id} is not under Completed in progress-tracker.md`);
        if (a.has(id) || bl.has(id) || upNext.has(id)) E(`${p.rel}: status is complete but Feature ${id} also appears In progress, Blocked or Up next`);
      } else if (!['superseded', 'archived'].includes(p.data.status)) {
        if (b.has(id)) E(`${p.rel}: status is "${p.data.status}" but Feature ${id} is under Completed in progress-tracker.md`);
        else if (!(a.has(id) || bl.has(id) || upNext.has(id))) E(`${p.rel}: live spec is not tracked in progress-tracker.md — register it with ctx task add --spec ${id}`);
      }
    }
  }

  // instruction files
  const agents = path.join(ROOT, 'AGENTS.md');
  if (!fs.existsSync(agents)) E('AGENTS.md missing — the schema file every agent reads');
  else {
    const n = fs.readFileSync(agents, 'utf8').split('\n').length;
    if (n > CONFIG.maxAgentsLines) W(`AGENTS.md is ${n} lines > ${CONFIG.maxAgentsLines} — move detail into context/ and link to it`);
    if (!/context\/index\.md/.test(fs.readFileSync(agents, 'utf8'))) W('AGENTS.md does not route through context/index.md');
  }
  const claude = path.join(ROOT, 'CLAUDE.md');
  if (fs.existsSync(claude) && (!fs.existsSync(agents) || fs.realpathSync(claude) !== fs.realpathSync(agents)) && !fs.readFileSync(claude, 'utf8').trimStart().startsWith('@AGENTS.md')) W('CLAUDE.md must link to AGENTS.md, or use the explicit legacy import layout');
  for (const legacy of ['.cursorrules', '.windsurfrules', 'AGENT.md']) if (fs.existsSync(path.join(ROOT, legacy))) W(`${legacy}: legacy instruction file shadows/duplicates AGENTS.md — delete or migrate`);
  if (!fs.existsSync(path.join(CTX, 'log.md'))) W('context/log.md missing (append-only activity timeline)');

  const ownership = ownershipHealth();
  ownership.errors.forEach(E);
  duplicateProse(ps, ownership.adapters.resources).forEach(W);

  // staleness
  const st = staleReport();
  for (const { p, hits } of st.items) W(`${p.rel}: STALE — ${hits.length} covered file(s) changed since it was last updated (${hits[0]}${hits.length > 1 ? ', …' : ''})`);

  // secrets heuristic
  for (const p of ps) if (/(sk_live_|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})/.test(p.text)) E(`${p.rel}: looks like a secret/token — names of env vars only, never values`);

  const bad = errors.length || (flags.strict && warns.length) ? 1 : 0;
  emit({ command: 'lint', ok: !bad, pages: ps.length, errors, warns, exitCode: bad }, () => {
    errors.forEach((m) => console.log(`ERROR ${m}`));
    warns.forEach((m) => console.log(`WARN  ${m}`));
    console.log(`\nctx lint: ${ps.length} pages · ${errors.length} error(s) · ${warns.length} warning(s)`);
    if (bad) process.exit(1);
  });
};
let _all;
function sourceFilesAll() {
  if (_all) return _all;
  _all = gitFiles(['ls-files', '-z', '-co', '--exclude-standard']) ?? walk(ROOT).map(rel);
  return _all;
}

/* ---- index */
const IDX_START = '<!-- ctx:index:start -->';
const IDX_END = '<!-- ctx:index:end -->';
const TYPE_ORDER = ['overview', 'architecture', 'plan', 'standards', 'guide', 'module', 'entity', 'api', 'integration', 'feature', 'decision-log', 'tracker', 'ui', 'runbook', 'glossary', 'source', 'query'];
commands.index = () => withLock(() => {
  const ps = pages().filter((p) => p.has && !['superseded', 'archived'].includes(p.data.status));
  const groups = new Map();
  for (const p of ps) {
    const t = p.data.type || 'other';
    if (!groups.has(t)) groups.set(t, []);
    groups.get(t).push(p);
  }
  const order = [...groups.keys()].sort((a, b) => (TYPE_ORDER.indexOf(a) + 100) % 100 - (TYPE_ORDER.indexOf(b) + 100) % 100 || a.localeCompare(b));
  let md = `${IDX_START}\n_Generated by \`ctx index\` on ${today()} — ${ps.length} pages. Do not hand-edit between the markers._\n`;
  for (const t of order) {
    md += `\n### ${t}\n`;
    for (const p of groups.get(t)) {
      const unf = /\{\{[^}]+\}\}/.test(stripCode(p.text)) ? ' _(unfilled)_' : '';
      const flag = (p.data.confidence && p.data.confidence !== 'verified' ? ` _(${p.data.confidence})_` : '') + unf;
      md += `- [${p.data.title || p.relCtx}](${p.relCtx}) — ${p.data.summary || 'no summary'}${flag}\n`;
    }
  }
  md += `${IDX_END}`;
  const idxPath = path.join(CTX, 'index.md');
  let cur = fs.existsSync(idxPath) ? fs.readFileSync(idxPath, 'utf8') : `---\ntitle: Context Index\ntype: overview\nstatus: active\nsummary: Router and catalog — the first context file every session reads\nupdated: ${today()}\n---\n\n# Context Index\n\n${IDX_START}\n${IDX_END}\n`;
  if (!cur.includes(IDX_START)) cur += `\n${IDX_START}\n${IDX_END}\n`;
  cur = cur.replace(new RegExp(`${IDX_START}[\\s\\S]*?${IDX_END}`), () => md);
  cur = upsertFm(cur, 'updated', today());
  atomicWrite(idxPath, cur);
  console.log(`index: ${ps.length} pages catalogued in context/index.md`);
  if (flags.llms) {
    let llms = `# ${path.basename(ROOT)}\n\n> Project context for LLMs. Start with AGENTS.md, then context/index.md. Each page below has a one-line summary.\n\n## Core\n- [AGENTS.md](AGENTS.md): instructions and invariants for any agent\n- [memory.md](memory.md): current state and exact next step\n- [context/index.md](context/index.md): task routing + full catalog\n\n## Pages\n`;
    for (const p of ps) llms += `- [${p.data.title || p.relCtx}](${p.rel}): ${p.data.summary || ''}\n`;
    atomicWrite(path.join(ROOT, 'llms.txt'), llms);
    console.log('index: wrote llms.txt');
  }
});

/* ---- coverage */
commands.coverage = () => {
  const rx = pages().filter((p) => !['superseded', 'archived'].includes(p.data.status)).flatMap((p) => matchers(p.data.covers));
  const files = sourceFiles();
  const unc = files.filter((f) => !anyMatch(rx, f));
  const pct = files.length ? Math.round(((files.length - unc.length) / files.length) * 100) : 100;
  const byDir = new Map();
  for (const f of unc) {
    const d = f.split('/').slice(0, Math.min(3, f.split('/').length - 1)).join('/') || '.';
    byDir.set(d, (byDir.get(d) || 0) + 1);
  }
  const spots = [...byDir.entries()].sort((a, b) => b[1] - a[1]).map(([d, n]) => ({ dir: d + '/', files: n }));
  emit({ command: 'coverage', ok: pct >= 80, pct, documented: files.length - unc.length, total: files.length, blindSpots: spots }, () => {
    console.log(`Coverage: ${files.length - unc.length}/${files.length} source files documented (${pct}%)`);
    if (unc.length) console.log('\nBlind spots (uncovered files per directory) — each needs a module page or a `covers:` entry:');
    spots.slice(0, 25).forEach((s) => console.log(`  ${String(s.files).padStart(4)}  ${s.dir}`));
  });
  if (flags.strict && pct < 80) process.exit(1);
};

/* ---- log */
commands.log = () => {
  const lp = path.join(CTX, 'log.md');
  if (flags.tail) {
    const t = fs.existsSync(lp) ? fs.readFileSync(lp, 'utf8').split(/\n(?=## \[)/).filter((s) => s.startsWith('## [')) : [];
    return console.log(t.slice(-Number(flags.tail)).join('\n'));
  }
  const [op, ...title] = pos;
  if (!op || !title.length) return die('usage: ctx log <op> <title...> [-m "note"]   ops: ingest|query|lint|build|decision|fix|sync|audit|handoff');
  if (!fs.existsSync(lp)) atomicWrite(lp, `---\ntitle: Activity Log\ntype: log\nstatus: active\nsummary: Append-only timeline of ingests, builds, decisions and lint passes\nupdated: ${today()}\n---\n\n# Log\n`);
  appendAtomic(lp, `\n## [${today()}] ${op} | ${title.join(' ')}\n${flags.m && flags.m !== true ? flags.m + '\n' : ''}`);
  console.log(`logged: [${today()}] ${op} | ${title.join(' ')}`);
};

/* ---- task — the ledger lives IN progress-tracker.md; ctx keeps the states honest.
   States: In progress (max 1 — one unit at a time) · Blocked · Up next · Completed. */
const TASK_SECTIONS = ['In progress', 'Blocked', 'Up next', 'Completed'];
const escS = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function getSection(text, name) {
  const m = text.match(new RegExp(`^##[^\\n]*${escS(name)}[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'im'));
  return m ? m[1] : null;
}
function setSection(text, name, body) {
  const rx = new RegExp(`(^##[^\\n]*${escS(name)}[^\\n]*\\n)([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'im');
  if (!rx.test(text)) return `${text.replace(/\s+$/, '')}\n\n## ${name}\n\n${body.trim()}\n`;
  return text.replace(rx, (_all, head) => head + body);
}
const taskRx = (id) => new RegExp(`^[-*]\\s+(?:\\[[ x]\\]\\s*)?(?:\\*\\*)?Feature\\s+0*${id}\\b.*$`, 'im');
const isRealTask = (l) => /^[-*]\s+.*Feature\s+\d+/i.test(l) && !/\{\{/.test(l);
function taskTitle(line) {
  const m = line.match(/Feature\s+(\d+)[:*\s]*([^\u2014—]*)/i);
  return { id: String(m[1]).padStart(2, '0'), title: (m[2] || '').replace(/[-–—]\s(started|blocked).*/i, '').trim().replace(/\*\*/g, '').replace(/[:—-]\s*$/, '').trim() || 'untitled' };
}
commands.task = () => {
  const tp = path.join(CTX, 'progress-tracker.md');
  if (!fs.existsSync(tp)) return die('no context/progress-tracker.md — run ctx init first');
  let text = fs.readFileSync(tp, 'utf8');
  const sub = pos[0] || 'list';
  const argId = pos[1] ? String(pos[1]).replace(/^0+/, '').replace(/\D/g, '') : '';
  const note = (flags.m && flags.m !== true ? String(flags.m) : '') || pos.slice(2).join(' ');
  const findLine = (id) => {
    for (const s of TASK_SECTIONS) {
      const m = (getSection(text, s) || '').match(taskRx(id));
      if (m) return { s, line: m[0] };
    }
    return null;
  };
  const move = (id, to, line) => {
    const found = findLine(id);
    if (found) {
      for (const s of TASK_SECTIONS) {
        const body = getSection(text, s) || '';
        const m = body.match(taskRx(id));
        if (m) text = setSection(text, s, body.replace(m[0], ''));
      }
    }
    if (!found && !line) return null;
    const body = (getSection(text, to) || '').split('\n').filter((l) => !/\{\{Feature NN/.test(l)).join('\n');
    text = setSection(text, to, `${body.replace(/\s+$/, '')}\n- ${line}`.trimStart() + '\n');
    return found ? found.s : null;
  };
  if (sub === 'list') {
    const rows = {};
    for (const s of TASK_SECTIONS) rows[s] = ((getSection(text, s) || '').split('\n').filter(isRealTask));
    emit({ command: 'task', ok: rows['In progress'].length <= 1, sections: rows }, () => {
      for (const s of TASK_SECTIONS) console.log(`${s} (${rows[s].length}):\n${rows[s].map((l) => '  ' + l.trim()).join('\n') || '  —'}`);
    });
    return;
  }
  if (sub === 'add') {
    const title = pos.slice(1).join(' ') || (flags.title && flags.title !== true ? String(flags.title) : '');
    if (!title) return die('usage: ctx task add "title" [--spec NN]');
    let id = flags.spec && flags.spec !== true ? String(flags.spec).replace(/\D/g, '') : null;
    const usedNums = () => {
      const s = new Set();
      for (const sec of TASK_SECTIONS) for (const l of (getSection(text, sec) || '').split('\n')) {
        if (!isRealTask(l)) continue;
        const m = l.match(/Feature\s+(\d+)/i);
        if (m) s.add(Number(m[1]));
      }
      return s;
    };
    const { reservations: reserved, errors: roadmapErrors } = roadmapReservations();
    if (roadmapErrors.length) return die(roadmapErrors.join('; '));
    if (!id) {
      const used = usedNums();
      let n = 1;
      for (const u of used) if (u >= n) n = u + 1;
      id = String(n);
      const key = id.padStart(2, '0');
      if (reserved.has(key)) return die(`Feature ${key} is reserved by context/build-plan.md (${reserved.get(key)}) — pass --spec ${key} only when starting that unit`);
    } else if (usedNums().has(Number(id))) {
      return die(`Feature ${id} is already in the ledger (another branch's unit?) — pick a free number or omit --spec`);
    } else if (reserved.size && !reserved.has(id.padStart(2, '0'))) {
      return die(`Feature ${id.padStart(2, '0')} is not reserved by context/build-plan.md — update the roadmap before claiming it`);
    }
    id = id.padStart(2, '0');
    const body = (getSection(text, 'Up next') || '').split('\n').filter((l) => !/\{\{Feature NN/.test(l)).join('\n');
    text = setSection(text, 'Up next', `${body.replace(/\s+$/, '')}\n- Feature ${id}: ${title}`.trimStart() + '\n');
    console.log(`added Feature ${id}: ${title} → Up next`);
  } else if (sub === 'start') {
    if (!argId) return die('usage: ctx task start <NN> [--force]');
    const active = ((getSection(text, 'In progress') || '').split('\n').filter(isRealTask));
    if (active.length && !active[0].match(taskRx(argId)) && !flags.force) return die(`one unit at a time: ${active[0].trim()} is In progress. Finish it (ctx task done) or pass --force.`);
    const f = findLine(argId);
    if (!f) return die(`Feature ${argId} is not in the tracker — add it first: ctx task add "..."`);
    const title = taskTitle(f.line).title;
    move(argId, 'In progress', `Feature ${String(argId).padStart(2, '0')}: ${title} — started ${today()}`);
    console.log(`Feature ${argId} → In progress${f.s !== 'In progress' ? ` (was in ${f.s})` : ''}`);
  } else if (sub === 'block') {
    if (!argId) return die('usage: ctx task block <NN> "why + what unblocks it"');
    if (!note) return die('a blocked task must say why and what unblocks it: ctx task block <NN> "waiting on X"');
    const f = findLine(argId);
    if (!f) return die(`Feature ${argId} is not in the tracker`);
    move(argId, 'Blocked', `Feature ${String(argId).padStart(2, '0')}: ${taskTitle(f.line).title} — blocked: ${note}`);
    console.log(`Feature ${argId} → Blocked`);
  } else if (sub === 'done') {
    if (!argId) return die('usage: ctx task done <NN> -m "concrete details: versions, paths, env names"');
    if (!note) return die('done needs the concrete details: ctx task done <NN> -m "..." — vague completions rot the tracker');
    const f = findLine(argId);
    if (!f) return die(`Feature ${argId} is not in the tracker`);
    move(argId, 'Completed', `Feature ${String(argId).padStart(2, '0')}: ${taskTitle(f.line).title} — ${today()} — ${note}`);
    console.log(`Feature ${argId} → Completed`);
  } else return die('usage: ctx task list|add|start|block|done  (one unit at a time; done requires concrete details)');
  atomicWrite(tp, upsertFm(text, 'updated', today()));
};

/* ---- archive — the growth valve: the wiki stays fast because old material moves out.
   log.md entries and tracker Completed lines older than the cutoff rotate into
   context/archive/ (still greppable forever); nothing is ever deleted. */
function archiveEntries(file, header, entries) {
  let current = '';
  try { current = fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const blocks = (text) => text.replace(/\r\n/g, '\n').split(/\n(?=## \[)/).filter((block) => /^## \[/.test(block)).map((block) => block.trim());
  const archived = new Set(entries.some((entry) => /^## \[/.test(entry)) ? blocks(current) : current.replace(/\r\n/g, '\n').split('\n').map((line) => line.trim()));
  const fresh = entries.filter((entry) => {
    const key = entry.replace(/\r\n/g, '\n').trim();
    if (archived.has(key)) return false;
    archived.add(key);
    return true;
  });
  if (!current) atomicWrite(file, header + (fresh.length ? '\n' + fresh.join('\n') + '\n' : ''));
  else if (fresh.length) appendAtomic(file, (current.endsWith('\n') ? '' : '\n') + fresh.join('\n') + '\n');
  return fresh.length;
}
commands.archive = () => {
  const dry = !!flags['dry-run'];
  const logDays = Number(flags.days || CONFIG.archiveAfterDays || 180);
  const trkDays = Number(flags['keep-days'] || CONFIG.trackerKeepDays || 90);
  const cutoff = (d) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
  const cl = cutoff(logDays), ct = cutoff(trkDays);
  const moved = { log: 0, tracker: 0 };
  const lp = path.join(CTX, 'log.md');
  if (fs.existsSync(lp)) {
    const text = fs.readFileSync(lp, 'utf8');
    const keep = [];
    const old = [];
    for (const entry of text.split(/\n(?=## \[)/)) {
      const m = entry.match(/^## \[(\d{4}-\d{2}-\d{2})\]/);
      if (m && m[1] < cl) old.push({ date: m[1], text: entry.trimEnd() });
      else keep.push(entry);
    }
    if (old.length) {
      moved.log = old.length;
      if (!dry) {
        const ap = path.join(CTX, 'archive', `log-${cl.slice(0, 7)}.md`);
        archiveEntries(ap, `---\ntitle: Activity Log (archived before ${cl})\ntype: log\nstatus: archived\nsummary: Rotated out of context/log.md by ctx archive on ${today()} — still greppable\nupdated: ${today()}\n---\n\n# Log (archived)\n`, old.map((o) => o.text));
        atomicWrite(lp, keep.join('\n'));
      }
      console.log(`log: ${old.length} entr${old.length === 1 ? 'y' : 'ies'} older than ${cl} → context/archive/log-${cl.slice(0, 7)}.md`);
    } else console.log(`log: nothing older than ${cutoff(logDays)} days (${cl})`);
  }
  const tp = path.join(CTX, 'progress-tracker.md');
  if (fs.existsSync(tp)) {
    let text = fs.readFileSync(tp, 'utf8');
    const body = getSection(text, 'Completed');
    if (body) {
      const lines = body.split('\n');
      const keepLines = [];
      const movedLines = [];
      for (const l of lines) {
        const m = l.match(/(\d{4}-\d{2}-\d{2})/);
        if (isRealTask(l) && m && m[1] < ct) movedLines.push(l);
        else keepLines.push(l);
      }
      if (movedLines.length) {
        moved.tracker = movedLines.length;
        if (!dry) {
          const ap = path.join(CTX, 'archive', `tracker-${ct.slice(0, 4)}.md`);
          archiveEntries(ap, `---\ntitle: Completed Work (archived ${ct.slice(0, 4)})\ntype: tracker\nstatus: archived\nsummary: Completions older than ${ct}, rotated by ctx archive — concrete details preserved, greppable\nupdated: ${today()}\n---\n\n# Completed (archived)\n`, movedLines);
          const pointer = `- (older completions archived: ${rel(path.join(CTX, 'archive', `tracker-${ct.slice(0, 4)}.md`))})`;
          if (!keepLines.some((l) => l.includes('older completions archived'))) keepLines.push(pointer);
          text = setSection(text, 'Completed', keepLines.join('\n'));
          atomicWrite(tp, upsertFm(text, 'updated', today()));
        }
        console.log(`tracker: ${movedLines.length} old completion(s) → context/archive/tracker-${ct.slice(0, 4)}.md (pointer left behind)`);
      } else console.log(`tracker: nothing completed before ${ct}`);
    }
  }
  const dec = path.join(CTX, 'decisions.md');
  if (fs.existsSync(dec)) {
    const n = fs.readFileSync(dec, 'utf8').split('\n').length;
    if (n > CONFIG.maxPageLines) console.log(`decisions: ${n} lines — when a page this central grows, split by year: move the oldest D-NN blocks to context/archive/decisions-<year>.md (keep IDs stable — pages link them) and leave a pointer line`);
  }
  if (!dry && (moved.log || moved.tracker)) commands.index();
  console.log(moved.log || moved.tracker ? (dry ? 'dry run — nothing written' : 'archive: done (history is never deleted, only moved out of the hot path)') : 'archive: everything is within the keep window');
};

/* ---- stamp */
commands.stamp = () => {
  const sha = git(['rev-parse', 'HEAD']);
  let targets = pos.map((t) => path.resolve(ROOT, t));
  if (flags.touched) targets = [...dirtyFiles()].filter((f) => f.startsWith('context/') && f.endsWith('.md')).map((f) => path.join(ROOT, f));
  if (!targets.length) return die('usage: ctx stamp <page...> | --touched');
  for (const t of targets) {
    if (!fs.existsSync(t) || !isPageFile(t)) {
      console.log(`skip ${t}`);
      continue;
    }
    let txt = fs.readFileSync(t, 'utf8');
    txt = upsertFm(txt, 'updated', today());
    if (sha) txt = upsertFm(txt, 'verified_at', sha.slice(0, 12));
    atomicWrite(t, txt);
    console.log(`stamped ${rel(t)}${sha ? ' @ ' + sha.slice(0, 7) : ''}`);
  }
};

/* ---- canonical resources and portable host adapters */
const RESOURCE_DIRS = { agent: '.agents/agents', rule: '.agents/rules', skill: '.agents/skills' };
const ruleGlobs = (data) => {
  const value = data.paths || data.globs;
  return Array.isArray(value) ? value.map(String) : value ? splitList(value) : data.alwaysApply === true || data.alwaysApply === 'true' ? ['**'] : [];
};
const ADAPTER_MARK = 'project-context-system';
const hashAdapter = (text) => {
  const normalized = text.replace(/\r\n/g, '\n');
  const unsigned = normalized.replace(/^---\n[\s\S]*?\n---(?:\n|$)/, (frontmatter) => frontmatter.replace(/^ctx_checksum:[^\n]*(?:\n|$)/m, ''));
  return createHash('sha256').update(unsigned).digest('hex');
};
const resourceName = (file, kind) => kind === 'skill' ? path.basename(path.dirname(file)) : path.basename(file, path.extname(file));
const canonicalResourcePath = (kind, name) => `${RESOURCE_DIRS[kind]}/${name}${kind === 'skill' ? '/SKILL.md' : '.md'}`;

function resourceFiles(dir, kind, errors) {
  const abs = path.resolve(ROOT, dir);
  const error = projectPathError(abs);
  if (error) { errors.push(error); return []; }
  if (!fs.existsSync(abs)) return [];
  try {
    const found = [];
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || /^README\.md$/i.test(entry.name)) continue;
      const file = kind === 'skill' ? path.join(abs, entry.name, 'SKILL.md') : path.join(abs, entry.name);
      if (kind !== 'skill' && !/\.(md|mdc)$/.test(entry.name)) continue;
      const unsafe = projectPathError(file);
      if (unsafe) { errors.push(unsafe); continue; }
      if (fs.existsSync(file) && fs.statSync(file).isFile()) found.push(rel(file));
    }
    return found.sort();
  } catch (e) { errors.push(`${dir}: ${e.message}`); return []; }
}

function resourceInventory() {
  const resources = [], errors = [];
  for (const [kind, dir] of Object.entries(RESOURCE_DIRS)) {
    for (const file of resourceFiles(dir, kind, errors)) {
      const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
      const { data, body, has } = parseFrontmatter(text);
      if (!has) errors.push(`${file}: canonical resource needs frontmatter`);
      if (data.ctx_source) errors.push(`${file}: canonical resource cannot point to another owner`);
      resources.push({ kind, name: resourceName(file, kind), file, data, body, text });
    }
  }
  return { resources, errors };
}

function nativeResources(errors) {
  const out = [];
  for (const [kind, dir] of [['agent', '.claude/agents'], ['rule', '.claude/rules'], ['rule', '.cursor/rules'], ['skill', '.claude/skills'], ['skill', '.cursor/skills']]) {
    for (const file of resourceFiles(dir, kind, errors)) {
      if (file === '.cursor/rules/project-context.mdc') continue; // root AGENTS.md adapter, not a reusable rule
      const canonical = path.join(ROOT, canonicalResourcePath(kind, resourceName(file, kind)));
      if (fs.existsSync(canonical) && fs.realpathSync(path.join(ROOT, file)) === fs.realpathSync(canonical)) continue;
      const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
      const { data, body } = parseFrontmatter(text);
      out.push({ kind, name: resourceName(file, kind), file, data, body, text });
    }
  }
  return out;
}

function adapterTargets(resource) {
  const { kind, name } = resource;
  if (kind === 'agent') return [`.claude/agents/${name}.md`];
  if (kind === 'rule') return [`.claude/rules/${name}.md`, `.cursor/rules/${name}.mdc`];
  return [`.claude/skills/${name}/SKILL.md`, `.cursor/skills/${name}/SKILL.md`];
}

function renderAdapter(resource, file) {
  const { kind, name, data } = resource;
  const fields = { name: data.name || name, description: data.description || data.summary || data.title || `${name} ${kind}` };
  if (kind === 'rule') {
    delete fields.name;
    const globs = ruleGlobs(data);
    if (file.startsWith('.claude/')) fields.paths = globs;
    else { fields.globs = globs.join(', '); fields.alwaysApply = data.alwaysApply === true || data.alwaysApply === 'true'; }
  }
  if (kind === 'agent' && data.tools) fields.tools = Array.isArray(data.tools) ? data.tools.join(', ') : data.tools;
  fields.ctx_source = resource.file;
  fields.ctx_generated = ADAPTER_MARK;
  const target = posix(path.relative(path.dirname(path.join(ROOT, file)), path.join(ROOT, resource.file))).split('/').map(encodeURIComponent).join('/');
  const text = `---\n${Object.entries(fields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\nRead and follow the [canonical ${kind}](${target}). Edit its source, not this adapter.\n`;
  return text.replace('\n---\n\n', `\nctx_checksum: ${hashAdapter(text)}\n---\n\n`);
}

/* Relative native links are Git objects, not pointer-file fallbacks or junctions. */
const SYMLINK_LAYOUT = [
  ['CLAUDE.md', 'AGENTS.md', 'file'],
  ['GEMINI.md', 'AGENTS.md', 'file'],
  ['.github/copilot-instructions.md', 'AGENTS.md', 'file'],
  ['.claude/agents', '.agents/agents', 'dir'],
  ['.claude/rules', '.agents/rules', 'dir'],
  ['.claude/skills', '.agents/skills', 'dir'],
  ['.cursor/skills', '.agents/skills', 'dir'],
  ['.cursor/rules', '.agents/views/cursor/rules', 'dir'],
];
const CURSOR_VIEWS = '.agents/views/cursor/rules';
const CURSOR_VIEW_BODY = 'Resolve ctx_source above from the project root and follow that canonical source. Edit its source, not this generated view.';
function renderCursorView(resource, file) {
  const adapter = renderAdapter(resource, file);
  // The same view is discovered at two depths through the directory alias.
  const text = adapter.replace(parseFrontmatter(adapter).body, `\n${CURSOR_VIEW_BODY}\n`);
  return text.replace(/^ctx_checksum:[^\n]*$/m, `ctx_checksum: ${hashAdapter(text)}`);
}
function configureLocalSymlinkGit() {
  const result = { available: HAS_GIT(), enabled: false, errors: [] };
  if (!result.available) return result;
  for (const flag of ['--git-dir', '--git-common-dir']) {
    const location = git(['rev-parse', flag]);
    const unsafe = location === null ? 'cannot locate repository-local Git configuration' : projectPathError(path.resolve(ROOT, location));
    if (unsafe) result.errors.push(`refusing Git configuration outside project: ${unsafe}`);
  }
  if (!result.errors.length && git(['config', '--local', 'core.symlinks', 'true']) === null) result.errors.push('cannot enable repository-local Git core.symlinks');
  result.enabled = git(['config', '--bool', 'core.symlinks']) === 'true';
  if (!result.enabled) result.errors.push('git core.symlinks must be true for a native-link checkout');
  return result;
}
function linkStat(abs) {
  try { return fs.lstatSync(abs); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
function guardLinkOperation(abs, intended = abs) {
  if (path.resolve(abs) !== path.resolve(intended) || path.resolve(abs) === path.resolve(ROOT)) throw new Error('refusing operation on an unintended path');
  const relative = path.relative(ROOT, abs);
  if (path.isAbsolute(relative) || relative === '..' || relative.startsWith('..' + path.sep)) throw new Error(`path escapes project root: ${rel(abs)}`);
  // Resolve the parent, not the final link: unlink/rename must never follow it.
  const unsafe = projectPathError(path.dirname(abs));
  if (unsafe) throw new Error(unsafe);
}
function removeLinkTree(abs, intended = abs) {
  guardLinkOperation(abs, intended);
  const stat = linkStat(abs);
  if (!stat) return;
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    for (const name of fs.readdirSync(abs)) removeLinkTree(path.join(abs, name));
    fs.rmdirSync(abs);
  } else fs.unlinkSync(abs);
}
function symlinkPermissionError(e) {
  return `${e.code || 'ERROR'}: native symbolic links could not be created: ${e.message}. On Windows enable Developer Mode or grant the create-symbolic-link privilege, then retry; do not use junctions or regular-file copies. Existing valid links can still be read and reused without creation privilege.`;
}
// Shared init preflight hook. Owns only this guarded temporary directory.
function probeSymlinks() {
  const errors = [];
  let temp;
  try {
    const prefix = path.join(ROOT, '.ctx-symlink-probe-');
    guardLinkOperation(prefix);
    temp = fs.mkdtempSync(prefix);
    guardLinkOperation(temp);
    fs.writeFileSync(path.join(temp, 'source-file'), 'probe\n', { flag: 'wx' });
    fs.mkdirSync(path.join(temp, 'source-dir'));
    for (const [name, source, type] of [['file-link', 'source-file', 'file'], ['dir-link', 'source-dir', 'dir']]) {
      const abs = path.join(temp, name);
      guardLinkOperation(abs);
      fs.symlinkSync(source, abs, type);
      if (!fs.lstatSync(abs).isSymbolicLink() || fs.readlinkSync(abs).replace(/\\/g, '/') !== source || fs.realpathSync(abs) !== fs.realpathSync(path.join(temp, source))) throw new Error(`${type} symbolic-link verification failed`);
    }
  } catch (e) { errors.push(symlinkPermissionError(e)); }
  finally {
    if (temp) {
      try { removeLinkTree(temp); } catch (e) { errors.push(`cannot clean symlink probe ${rel(temp)}: ${e.message}; remove this recovery directory manually`); }
    }
  }
  return { supported: !errors.length, errors };
}
function managedLinkWrapper(text, source, file) {
  const { data, body } = parseFrontmatter(text);
  const target = posix(path.relative(path.dirname(path.join(ROOT, file)), path.join(ROOT, source))).split('/').map(encodeURIComponent).join('/');
  const pointer = ['agent', 'rule', 'skill'].some((kind) => body.trim() === `Read and follow the [canonical ${kind}](${target}). Edit its source, not this adapter.`);
  const centralView = file.startsWith(CURSOR_VIEWS + '/') && body.trim() === CURSOR_VIEW_BODY;
  return data.ctx_generated === ADAPTER_MARK && data.ctx_source === source && data.ctx_checksum === hashAdapter(text) && (pointer || centralView);
}
function linkPathSnapshot(abs) {
  guardLinkOperation(abs);
  const stat = linkStat(abs);
  if (!stat) return 'missing';
  if (stat.isSymbolicLink()) return `link:${fs.readlinkSync(abs)}`;
  if (stat.isDirectory()) return JSON.stringify(fs.readdirSync(abs).sort().map((name) => [name, linkPathSnapshot(path.join(abs, name))]));
  if (!stat.isFile()) throw new Error(`unsupported file type: ${rel(abs)}`);
  return `file:${createHash('sha256').update(fs.readFileSync(abs)).digest('hex')}`;
}
function knownRootPointer(file, text) {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (['CLAUDE.md', 'GEMINI.md'].includes(file) && normalized === '@AGENTS.md') return true;
  const pointers = {
    'GEMINI.md': '@AGENTS.md\n\n# GEMINI.md\n\n<!-- Shared instructions are imported above. Keep only Gemini-specific loader notes here; do not copy shared policy or wiki content. -->',
    '.github/copilot-instructions.md': '# Copilot project entrypoint\n\nRead [shared agent instructions](../AGENTS.md). This adapter owns no project policy or facts.',
    '.cursor/rules/project-context.mdc': '---\ndescription: Shared project entrypoint\nalwaysApply: true\nctx_source: AGENTS.md\n---\n\nRead [shared agent instructions](../../AGENTS.md). Edit the source, not this tool adapter.',
  };
  return normalized === pointers[file];
}
function migratableLinkPath(abs, file, source, type) {
  const inspect = (target, relative = '') => {
    const unsafe = projectPathError(target);
    if (unsafe) return unsafe;
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink()) return 'unexpected symbolic link preserved';
    if (stat.isDirectory()) {
      if (type !== 'dir') return 'expected a file, found a directory';
      for (const name of fs.readdirSync(target)) {
        const reason = inspect(path.join(target, name), relative ? `${relative}/${name}` : name);
        if (reason) return `${relative ? relative + '/' : ''}${name}: ${reason}`;
      }
      return '';
    }
    if (!stat.isFile()) return 'unrecognized native content preserved';
    if (type === 'dir' && path.basename(target) === '.gitkeep' && stat.size === 0) return '';
    const nativeFile = type === 'file' ? file : `${file}/${relative}`;
    const text = fs.readFileSync(target, 'utf8');
    if (knownRootPointer(nativeFile, text)) return '';
    let expected = source;
    if (type === 'dir') {
      const kind = file.endsWith('/skills') ? 'skill' : file.endsWith('/agents') ? 'agent' : 'rule';
      const valid = kind === 'skill' ? /^[^/]+\/SKILL\.md$/.test(relative) : /^[^/]+\.(md|mdc)$/.test(relative);
      if (!valid) return 'unrecognized companion content preserved';
      expected = canonicalResourcePath(kind, resourceName(nativeFile, kind));
      if (nativeFile === '.cursor/rules/project-context.mdc') expected = 'AGENTS.md';
    }
    if (!managedLinkWrapper(text, expected, nativeFile)) return ['CLAUDE.md', 'GEMINI.md'].includes(nativeFile) ? 'extra loader notes or custom text preserved; deliberately move them to the native context owner before migration' : 'not a checksum-intact generated adapter; custom content preserved';
    return '';
  };
  return inspect(abs);
}
function inspectNativeLink(file, source, type) {
  const abs = path.join(ROOT, file), canonical = path.join(ROOT, source);
  const target = posix(path.relative(path.dirname(abs), canonical));
  const row = { file, source, type, target, linked: false, exists: false, ok: false };
  const stat = linkStat(abs);
  row.exists = !!stat;
  if (!stat) return row;
  row.linked = stat.isSymbolicLink();
  if (!row.linked) { row.reason = 'not a symbolic link (including Git checkouts materialized as regular files)'; return row; }
  const actual = fs.readlinkSync(abs);
  row.actualTarget = actual;
  if (path.isAbsolute(actual) || path.win32.isAbsolute(actual) || /^[A-Za-z]:/.test(actual) || actual.replace(/\\/g, '/') !== target) { row.reason = 'wrong or non-relative symbolic-link target preserved'; return row; }
  const unsafe = projectPathError(abs) || projectPathError(canonical);
  if (unsafe) { row.reason = unsafe; return row; }
  try {
    const sourceStat = fs.statSync(canonical);
    row.ok = (type === 'dir' ? sourceStat.isDirectory() : sourceStat.isFile()) && fs.realpathSync(abs) === fs.realpathSync(canonical);
    if (!row.ok) row.reason = 'symbolic-link source type or real target is incorrect';
  } catch (e) { row.reason = `symbolic-link source is missing or unreadable: ${e.message}`; }
  return row;
}
function symlinkReport({ check = false, migrate = false } = {}) {
  let inventory;
  try { inventory = resourceInventory(); }
  catch (e) { inventory = { resources: [], errors: [`cannot read canonical resource inventory: ${e.message}`] }; }
  const report = { resources: inventory.resources, adapters: [], conflicts: [], errors: [...inventory.errors], written: [], git: { available: HAS_GIT(), enabled: false } };
  const { errors, conflicts, adapters, written } = report;
  report.git.enabled = report.git.available && git(['config', '--bool', 'core.symlinks']) === 'true';
  if (CONFIG_ERROR) errors.push(CONFIG_ERROR);
  const plans = [], directories = [];
  const conflict = (file, source, reason) => conflicts.push({ file, source, reason });
  const parentSafety = (abs) => {
    const unsafe = projectPathError(path.dirname(abs));
    if (unsafe) return unsafe;
    for (let dir = path.dirname(abs); path.resolve(dir) !== path.resolve(ROOT); dir = path.dirname(dir)) {
      const stat = linkStat(dir);
      if (stat?.isSymbolicLink()) return `symbolic-link parent preserved: ${rel(dir)}; native configuration folders must remain independent`;
    }
    return '';
  };
  for (const [file, source, type] of SYMLINK_LAYOUT) {
    try {
      const abs = path.join(ROOT, file), canonical = path.join(ROOT, source);
      const unsafe = parentSafety(abs) || projectPathError(canonical);
      if (unsafe) { errors.push(unsafe); adapters.push({ file, source, type, linked: false, ok: false }); continue; }
      const sourceStat = linkStat(canonical);
      if (!sourceStat && type === 'dir' && source !== CURSOR_VIEWS) {
        if (check) errors.push(`missing canonical resource directory: ${source}`);
        else directories.push(canonical);
      } else if (source !== CURSOR_VIEWS && (!sourceStat || !(type === 'dir' ? fs.statSync(canonical).isDirectory() : fs.statSync(canonical).isFile()))) errors.push(`missing or incorrect canonical ${type}: ${source}`);
      const row = inspectNativeLink(file, source, type);
      adapters.push(row);
      if (row.ok) continue;
      if (row.linked) {
        // An exact relative alias can be reused while its missing generated/empty
        // directory is repaired, without needing symbolic-link creation privilege.
        if (!sourceStat && type === 'dir' && row.actualTarget.replace(/\\/g, '/') === row.target) continue;
        conflict(file, source, row.reason); continue;
      }
      const before = linkPathSnapshot(abs);
      if (row.exists) {
        const reason = migratableLinkPath(abs, file, source, type);
        if (reason) { conflict(file, source, reason); continue; }
        if (linkPathSnapshot(abs) !== before) { conflict(file, source, 'native content changed during validation; preserved'); continue; }
        if (!migrate) { conflict(file, source, 'existing adapter path requires --migrate; preserved'); continue; }
      }
      if (!check) plans.push({ file, abs, source, type, target: row.target, row, before });
    } catch (e) { errors.push(`${file}: ${e.message}`); }
  }
  // Cursor needs native .mdc metadata, but its generated body only links the owner.
  const shared = { kind: 'rule', name: 'project-context', file: 'AGENTS.md', data: { description: 'Shared project policy', alwaysApply: true, paths: ['**'] } };
  const views = new Map();
  for (const resource of [...inventory.resources.filter((r) => r.kind === 'rule'), shared]) {
    const file = `${CURSOR_VIEWS}/${resource.name}.mdc`;
    if (views.has(file)) { errors.push(`${file}: rule name collides with shared project-context view`); continue; }
    views.set(file, { resource, text: renderCursorView(resource, file) });
  }
  let viewsChanged = false;
  const viewAbs = path.join(ROOT, CURSOR_VIEWS);
  try {
    const unsafe = parentSafety(viewAbs) || projectPathError(viewAbs);
    if (unsafe) throw new Error(unsafe);
    const before = linkPathSnapshot(viewAbs);
    const stat = linkStat(viewAbs);
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) conflict(CURSOR_VIEWS, '.agents/rules', 'central Cursor views must be a real generated directory; existing content preserved');
    else if (stat) {
      for (const name of fs.readdirSync(viewAbs)) {
        const abs = path.join(viewAbs, name), file = `${CURSOR_VIEWS}/${name}`;
        const child = fs.lstatSync(abs);
        if (name === '.gitkeep' && child.isFile() && child.size === 0) continue;
        if (child.isSymbolicLink() || !child.isFile() || !name.endsWith('.mdc')) { conflict(file, '.agents/rules', 'unrecognized central view content preserved'); continue; }
        const text = fs.readFileSync(abs, 'utf8');
        const source = name === 'project-context.mdc' ? 'AGENTS.md' : canonicalResourcePath('rule', name.slice(0, -4));
        if (!managedLinkWrapper(text, source, file)) {
          conflict(file, source, 'generated view checksum/source validation failed; preserved');
          errors.push(`${file}: generated Cursor view checksum/source validation failed`);
        } else if (!views.has(file)) { viewsChanged = true; if (check) errors.push(`${file}: obsolete generated Cursor view`); }
      }
    }
    for (const [file, { resource, text: expected }] of views) {
      const abs = path.join(ROOT, file);
      const stat = linkStat(abs);
      const ok = !!stat && stat.isFile() && !stat.isSymbolicLink() && fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n') === expected;
      adapters.push({ file, source: resource.file, type: 'view', linked: false, exists: !!stat, managed: !!stat && stat.isFile() && !stat.isSymbolicLink() && managedLinkWrapper(fs.readFileSync(abs, 'utf8'), resource.file, file), ok });
      if (!ok) { viewsChanged = true; if (check) errors.push(`${file}: generated Cursor view is missing or out of sync`); }
    }
    if (linkPathSnapshot(viewAbs) !== before) conflict(CURSOR_VIEWS, '.agents/rules', 'central views changed during validation; preserved');
    if (viewsChanged && !check) plans.unshift({ file: CURSOR_VIEWS, abs: viewAbs, type: 'views', before });
  } catch (e) { errors.push(`${CURSOR_VIEWS}: ${e.message}`); }
  if (check) {
    if (report.git.available && !report.git.enabled) errors.push('git core.symlinks is not true; run ctx symlinks to configure it locally before Git recreates links');
    report.errors = [...new Set(errors)];
    return report;
  }
  const cfgAbs = path.join(CTX, '.ctx.json');
  let cfg, cfgBefore;
  try {
    const unsafe = parentSafety(cfgAbs) || projectPathError(cfgAbs);
    if (unsafe) throw new Error(unsafe);
    const stat = linkStat(cfgAbs);
    if (stat && (!stat.isFile() || stat.isSymbolicLink())) throw new Error('configuration must be a regular file');
    cfgBefore = linkPathSnapshot(cfgAbs);
    cfg = stat ? JSON.parse(fs.readFileSync(cfgAbs, 'utf8')) : {};
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) throw new Error('configuration must be an object');
    if (linkPathSnapshot(cfgAbs) !== cfgBefore) throw new Error('configuration changed during validation; preserved');
  } catch (e) { errors.push(`context/.ctx.json: ${e.message}`); }
  if (errors.length || conflicts.length) return report;
  try { for (const plan of plans) if (linkPathSnapshot(plan.abs) !== plan.before) throw new Error(`validated content changed: ${plan.file}`); }
  catch (e) { errors.push(`cannot validate adapter staging boundary: ${e.message}`); return report; }
  // Turning off Developer Mode does not prevent no-op reuse or ordinary view updates.
  if (plans.some((p) => p.type === 'file' || p.type === 'dir')) {
    const probe = probeSymlinks();
    report.supported = probe.supported;
    errors.push(...probe.errors);
    if (!probe.supported) return report;
  }
  if (report.git.available) {
    const state = configureLocalSymlinkGit();
    report.git.enabled = state.enabled;
    errors.push(...state.errors);
    if (errors.length) return report;
  }
  if (cfg.resourceMode !== 'symlink' || cfg.requestedResourceMode) {
    const installed = { ...cfg, resourceMode: 'symlink' };
    delete installed.requestedResourceMode;
    plans.push({ file: 'context/.ctx.json', abs: cfgAbs, type: 'config', before: cfgBefore, text: JSON.stringify(installed, null, 2) + '\n' });
  }
  let temp;
  const createdDirs = [], prepared = [];
  const mkdir = (abs) => {
    if (linkStat(abs)) { if (!fs.statSync(abs).isDirectory()) throw new Error(`not a directory: ${rel(abs)}`); return; }
    mkdir(path.dirname(abs));
    guardLinkOperation(abs);
    fs.mkdirSync(abs);
    createdDirs.push(abs);
  };
  const rename = (from, to) => { guardLinkOperation(from); guardLinkOperation(to); fs.renameSync(from, to); };
  try {
    temp = fs.mkdtempSync(path.join(ROOT, '.ctx-symlinks-'));
    guardLinkOperation(temp);
    for (const dir of directories) mkdir(dir);
    for (const [index, plan] of plans.entries()) {
      mkdir(path.dirname(plan.abs));
      const token = `${path.basename(temp)}-${index}`;
      plan.stage = path.join(path.dirname(plan.abs), `${token}-new`);
      plan.backup = path.join(path.dirname(plan.abs), `${token}-backup`);
      guardLinkOperation(plan.stage); guardLinkOperation(plan.backup);
      if (linkStat(plan.stage) || linkStat(plan.backup)) throw new Error(`temporary sibling already exists: ${plan.file}`);
      prepared.push(plan);
      if (plan.type === 'views') {
        fs.mkdirSync(plan.stage);
        for (const [file, { text }] of views) fs.writeFileSync(path.join(plan.stage, path.basename(file)), text, { flag: 'wx' });
      } else if (plan.type === 'config') fs.writeFileSync(plan.stage, plan.text, { flag: 'wx' });
      else fs.symlinkSync(plan.target, plan.stage, plan.type);
      plan.after = linkPathSnapshot(plan.stage); // expected unpublished content, never a mutable destination baseline
    }
    // Every new link exists before the first old adapter is moved.
    for (const plan of prepared) {
      if (plan.type === 'config') {
        for (const row of adapters) {
          if (row.type === 'view') continue;
          const current = inspectNativeLink(row.file, row.source, row.type);
          if (!current.ok) throw new Error(`installed link failed validation: ${row.file}`);
        }
      }
      if (linkPathSnapshot(plan.abs) !== plan.before) throw new Error(`adapter changed during staging; preserved: ${plan.file}`);
      if (linkStat(plan.abs)) { rename(plan.abs, plan.backup); plan.backedUp = true; }
      rename(plan.stage, plan.abs); plan.installed = true;
    }
    for (const row of adapters) {
      if (row.type === 'view') {
        const abs = path.join(ROOT, row.file), stat = fs.lstatSync(abs);
        row.ok = stat.isFile() && !stat.isSymbolicLink() && fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n') === views.get(row.file).text;
        row.exists = true; row.managed = row.ok;
      } else {
        delete row.reason;
        Object.assign(row, inspectNativeLink(row.file, row.source, row.type));
      }
      if (!row.ok) throw new Error(`installed adapter failed validation: ${row.file}`);
    }
    CONFIG.resourceMode = 'symlink';
    written.push(...prepared.map((p) => p.file));
  } catch (e) {
    errors.push(`symbolic-link install failed: ${e.code === 'EPERM' ? symlinkPermissionError(e) : e.message}`);
    for (const plan of [...prepared].reverse()) {
      try {
        if (plan.installed) {
          if (linkPathSnapshot(plan.abs) !== plan.after) throw new Error('installed path changed; refusing to delete new custom content');
          removeLinkTree(plan.abs);
        }
        if (plan.backedUp) {
          if (linkStat(plan.abs)) throw new Error('rollback destination was occupied by new content; backup preserved');
          rename(plan.backup, plan.abs);
        }
        removeLinkTree(plan.stage);
      } catch (rollback) {
        report.recovery ||= [];
        if (linkStat(plan.backup)) report.recovery.push(rel(plan.backup));
        if (linkStat(plan.stage)) report.recovery.push(rel(plan.stage));
        if (linkStat(plan.abs)) report.recovery.push(rel(plan.abs));
        errors.push(`rollback failed for ${plan.file}: ${rollback.message}; preserved recovery backup ${rel(plan.backup)}`);
      }
    }
    for (const row of adapters) row.ok = false;
    for (const dir of [...createdDirs].reverse()) {
      try { guardLinkOperation(dir); if (linkStat(dir) && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir); } catch (cleanup) { errors.push(`cannot clean temporary directory ${rel(dir)}: ${cleanup.message}`); }
    }
  }
  if (!errors.length) {
    // Old generated wrappers are removed only after installation and validation.
    for (const plan of prepared.filter((p) => p.backedUp)) {
      try {
        if (linkPathSnapshot(plan.backup) !== plan.before) throw new Error('backup changed; refusing to delete new custom content');
        removeLinkTree(plan.backup);
      } catch (e) {
        report.recovery ||= []; report.recovery.push(rel(plan.backup));
        report.warnings ||= []; report.warnings.push(`installed successfully; old managed backup preserved at ${rel(plan.backup)}: ${e.message}`);
      }
    }
  }
  if (temp) {
    try { removeLinkTree(temp); } catch (e) { report.warnings ||= []; report.warnings.push(`temporary recovery directory preserved at ${rel(temp)}: ${e.message}`); }
  }
  report.errors = [...new Set(errors)];
  return report;
}

function adapterReport({ check = false, migrate = false, promote = [] } = {}) {
  if (CONFIG.resourceMode === 'symlink' || CONFIG.requestedResourceMode === 'symlink') return symlinkReport({ check, migrate });
  const errors = [], conflicts = [], written = [], adapters = [];
  const native = nativeResources(errors);
  const promoted = new Set(promote);
  if (migrate && !check) {
    const groups = new Map();
    for (const item of native.filter((r) => !r.data.ctx_source && !promoted.has(r.file))) {
      const source = canonicalResourcePath(item.kind, item.name);
      if (!groups.has(source)) groups.set(source, []);
      groups.get(source).push(item);
    }
    for (const [source, items] of groups) {
      const abs = path.join(ROOT, source);
      const unsafe = projectPathError(abs);
      if (unsafe) { errors.push(unsafe); continue; }
      if (fs.existsSync(abs)) { conflicts.push({ file: items[0].file, source, reason: 'canonical resource already exists; refusing competing owners' }); continue; }
      if (items.length !== 1) { conflicts.push({ file: items.map((r) => r.file).join(', '), source, reason: 'multiple legacy owners; choose one before migration' }); continue; }
      const item = items[0];
      if (item.kind === 'skill' && fs.readdirSync(path.dirname(path.join(ROOT, item.file))).some((f) => f !== 'SKILL.md' && f !== '.gitkeep')) {
        conflicts.push({ file: item.file, source, reason: 'skill has companion resources; move the entire validated folder manually' }); continue;
      }
      if (!parseFrontmatter(item.text).has) { conflicts.push({ file: item.file, source, reason: 'legacy resource needs frontmatter before promotion' }); continue; }
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      atomicWrite(abs, item.text); // explicit promotion preserves the exact source, not a rewritten summary
      promoted.add(item.file);
      written.push(source);
    }
  }
  const inventory = resourceInventory();
  errors.push(...inventory.errors);
  const resources = inventory.resources;
  const expectedFiles = new Set();
  for (const resource of resources) {
    for (const file of adapterTargets(resource)) {
      expectedFiles.add(file);
      const abs = path.join(ROOT, file);
      const unsafe = projectPathError(abs);
      if (unsafe) { errors.push(unsafe); adapters.push({ kind: resource.kind, file, source: resource.file, exists: false, managed: false, ok: false, changed: true }); continue; }
      const exists = fs.existsSync(abs);
      const text = exists && fs.statSync(abs).isFile() ? fs.readFileSync(abs, 'utf8') : '';
      const data = parseFrontmatter(text).data;
      const managed = data.ctx_generated === ADAPTER_MARK;
      const expected = renderAdapter(resource, file);
      const row = { kind: resource.kind, file, source: resource.file, exists, managed, ok: text.replace(/\r\n/g, '\n') === expected, changed: false };
      if (exists && !promoted.has(file) && (!managed || data.ctx_checksum !== hashAdapter(text))) {
        conflicts.push({ file, source: resource.file, reason: managed ? 'adapter hand edits detected; preserved' : 'unmanaged native content preserved; migrate or reconcile explicitly' });
      } else if (!row.ok) {
        row.changed = true;
        if (!check) {
          atomicWrite(abs, expected);
          written.push(file); row.ok = true; row.managed = true;
        }
      }
      adapters.push(row);
    }
  }
  for (const item of native) {
    if (expectedFiles.has(item.file)) continue;
    if (item.data.ctx_source) {
      const source = String(item.data.ctx_source);
      const unsafe = projectPathError(path.resolve(ROOT, source));
      if (unsafe) errors.push(unsafe);
      else errors.push(`${item.file}: adapter source is missing or not inventoried: ${source}`);
    } else if (!conflicts.some((c) => c.file.split(', ').includes(item.file))) {
      conflicts.push({ file: item.file, source: canonicalResourcePath(item.kind, item.name), reason: 'legacy owner needs explicit migration; no canonical copy was seeded' });
    }
  }
  return { resources, adapters, conflicts, errors: [...new Set(errors)], written };
}

commands.symlinks = () => {
  if (pos.length) return die('usage: ctx symlinks [--check] [--migrate] [--json]');
  const report = symlinkReport({ check: !!flags.check, migrate: !!flags.migrate });
  const ok = !report.errors.length && !report.conflicts.length && report.adapters.every((a) => a.ok);
  emit({ command: 'symlinks', ok, ...report, resources: report.resources.map(({ kind, name, file }) => ({ kind, name, file })), exitCode: ok ? 0 : 1 }, () => {
    for (const file of report.written) console.log(`symlink/view: ${file}`);
    for (const error of report.errors) console.log(`ERROR ${error}`);
    for (const item of report.conflicts) console.log(`CONFLICT ${item.file}: ${item.reason}`);
    for (const warning of report.warnings || []) console.log(`WARN ${warning}`);
    for (const adapter of report.adapters.filter((a) => !a.ok)) console.log(`REVIEW ${adapter.file} -> ${adapter.source}`);
    console.log(`symlinks: ${report.resources.length} canonical resources, ${ok ? 'clean' : 'needs attention'}; Git ${report.git.available ? report.git.enabled ? 'core.symlinks=true' : 'core.symlinks is not true' : 'unavailable'}`);
  });
  if (!ok) process.exit(1);
};

commands.adapters = () => {
  const report = adapterReport({ check: !!flags.check, migrate: !!flags.migrate });
  const ok = !report.errors.length && !report.conflicts.length && report.adapters.every((a) => a.ok);
  emit({ command: 'adapters', ok, ...report, resources: report.resources.map(({ kind, name, file }) => ({ kind, name, file })), exitCode: ok ? 0 : 1 }, () => {
    for (const file of report.written) console.log(`adapter/resource: ${file}`);
    for (const error of report.errors) console.log(`ERROR ${error}`);
    for (const conflict of report.conflicts) console.log(`CONFLICT ${conflict.file}: ${conflict.reason}`);
    for (const adapter of report.adapters.filter((a) => !a.ok)) console.log(`REVIEW ${adapter.file} -> ${adapter.source}`);
    console.log(`adapters: ${report.resources.length} canonical resources, ${ok ? 'clean' : 'needs attention'}`);
  });
  if (!ok) process.exit(1);
};

/* ---- new */
const SKELETONS = {
  module: (t, slug, covers) => `---\ntitle: ${t}\ntype: module\nstatus: draft\nsummary: TODO one line — what this module owns\ntags: [${slug}]\ncovers: [${covers || `src/${slug}/**`}]\nrelated: []\nupdated: ${today()}\nconfidence: inferred\n---\n\n# ${t}\n\n## TL;DR\n- Owns: TODO\n- Entry points: TODO (file → exported symbol)\n- Biggest gotcha: TODO\n\n## Responsibilities\n\n## Public surface\n| Symbol / route | File | Contract |\n|---|---|---|\n\n## Data flow\n\n## Depends on / used by\n\n## Gotchas & invariants\n\n## Tests\n\n## Open questions\n`,
  feature: (t, slug, covers) => `---\ntitle: ${t}\ntype: feature\nstatus: draft\nsummary: TODO one line — the measurable goal\ntags: [${slug}]\ncovers: [${covers || ''}]\nrelated: []\nupdated: ${today()}\n---\n\n# ${t}\n\n## TL;DR\n- Goal: TODO\n- Boundary: TODO (one system boundary)\n\n## What to build\n\n## Explicitly NOT in this spec\n\n## Clarifications\n\n## Value sources\n| Value | Comes from |\n|---|---|\n\n## Verification checklist\n- [ ] build + lint + typecheck pass\n- [ ] flow driven for real\n- [ ] context pages updated (ctx impact shows no ✗)\n`,
  source: (t) => `---\ntitle: ${t}\ntype: source\nstatus: active\nsummary: TODO one line — what this source says and why it matters\ntags: []\nraw: context/raw/TODO\nupdated: ${today()}\n---\n\n# ${t}\n\n## TL;DR\n\n## Key claims\n\n## Pages updated because of this source\n\n## Contradictions with existing pages\n`,
};
commands.new = () => {
  const [type, ...rest] = pos;
  if (!type || !rest.length) return die('usage: ctx new <module|feature|source|type> <name> [--covers "src/a/**,src/b.ts"] [--title "Title"]');
  const slug = rest.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const title = flags.title && flags.title !== true ? String(flags.title) : rest.join(' ').replace(/^./, (c) => c.toUpperCase());
  const covers = flags.covers && flags.covers !== true ? splitList(flags.covers).join(', ') : '';
  if (Object.hasOwn(RESOURCE_DIRS, type)) {
    if (!slug) return die('resource name must contain letters or numbers');
    const file = canonicalResourcePath(type, slug);
    const abs = path.join(ROOT, file);
    assertProjectPath(abs);
    for (const native of adapterTargets({ kind: type, name: slug })) assertProjectPath(path.join(ROOT, native));
    if (fs.existsSync(abs)) return die(`${file} already exists`);
    for (const native of CONFIG.resourceMode === 'symlink' ? [] : adapterTargets({ kind: type, name: slug })) {
      const target = path.join(ROOT, native);
      if (!fs.existsSync(target)) continue;
      if (!fs.statSync(target).isFile()) return die(`native resource path is not a file: ${native}`);
      const text = fs.readFileSync(target, 'utf8');
      const data = parseFrontmatter(text).data;
      if (data.ctx_generated !== ADAPTER_MARK || data.ctx_source !== file || data.ctx_checksum !== hashAdapter(text)) return die(`native resource conflict: ${native} — preserve its owner; explicitly migrate or reconcile before creating ${file}`);
    }
    const fields = { name: slug, description: String(flags.summary || `TODO ${type} purpose`) };
    if (type === 'rule') fields.paths = splitList(flags.paths || flags.covers || '**/*');
    if (type === 'agent') fields.tools = 'Read, Grep, Glob, Bash';
    const body = type === 'rule' ? `# ${title}\n\nRead the owning context page before editing matching paths. Add links here, not copies of its rules.\n` : type === 'agent' ? `# ${title}\n\nRead AGENTS.md first.\n\n## Purpose\nTODO\n\n## Procedure\nTODO reusable role behavior only; link to project facts and workflow owners.\n` : `# ${title}\n\nRead AGENTS.md first.\n\n## When to use\nTODO\n\n## Procedure\nTODO reusable procedure only; project facts stay at their owners. Resolve companion resources relative to this canonical skill directory.\n`;
    atomicWrite(abs, `---\n${Object.entries(fields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n${body}`);
    const report = adapterReport();
    const ok = !report.errors.length && !report.conflicts.length && report.adapters.every((a) => a.ok);
    emit({ command: 'new', ok, file, ...report, resources: report.resources.map(({ kind, name, file }) => ({ kind, name, file })), exitCode: ok ? 0 : 1 }, () => {
      console.log(`created ${file} — edit this canonical resource only; adapters route to it`);
      for (const error of report.errors) console.log(`ERROR ${error}`);
      for (const conflict of report.conflicts) console.log(`CONFLICT ${conflict.file}: ${conflict.reason}`);
    });
    if (!ok) process.exit(1);
    return;
  }
  let dest;
  if (type === 'module') dest = path.join(CTX, 'codebase', 'modules', `${slug}.md`);
  else if (type === 'feature') {
    const dir = path.join(CTX, 'feature-specs');
    fs.mkdirSync(dir, { recursive: true });
    const { reservations: reserved, errors: roadmapErrors } = roadmapReservations();
    if (roadmapErrors.length) return die(roadmapErrors.join('; '));
    const requested = flags.spec && flags.spec !== true ? String(flags.spec).replace(/\D/g, '') : '';
    let n;
    if (requested) {
      n = Number(requested);
      const key = String(n).padStart(2, '0');
      if (reserved.size && !reserved.has(key)) return die(`Feature ${key} is not reserved by context/build-plan.md — update the roadmap before creating it`);
      if (fs.readdirSync(dir).some((f) => f.startsWith(key + '-'))) return die(`Feature ${key} already has a spec — pick another number`);
    } else {
      n = fs.existsSync(dir) ? Math.max(0, ...fs.readdirSync(dir).map((f) => parseInt(f, 10)).filter((x) => !isNaN(x))) + 1 : 1;
      const key = String(n).padStart(2, '0');
      if (reserved.has(key)) return die(`Feature ${key} is reserved by context/build-plan.md (${reserved.get(key)}) — pass --spec ${key} only when starting that unit`);
    }
    dest = path.join(dir, `${String(n).padStart(2, '0')}-${slug}.md`);
  } else if (type === 'source') dest = path.join(CTX, 'sources', `${slug}.md`);
  else dest = path.join(CTX, `${slug}.md`);
  if (fs.existsSync(dest)) return die(`${rel(dest)} already exists`);
  const sk = SKELETONS[type] || ((t, s) => `---\ntitle: ${t}\ntype: ${type}\nstatus: draft\nsummary: TODO one line\ntags: [${s}]\ncovers: []\nupdated: ${today()}\n---\n\n# ${t}\n\n## TL;DR\n\n`);
  atomicWrite(dest, sk(title, slug, covers));
  console.log(`created ${rel(dest)} — fill TODOs, then run: ctx index`);
};

/* ---- doctor: is the scaffold actually wired (not just present)? */
commands.doctor = () => {
  const checks = [];
  const C = (ok, label, fix) => checks.push({ ok, label, fix: ok ? '' : fix });
  const read = (p) => {
    try {
      return fs.readFileSync(path.join(ROOT, p), 'utf8');
    } catch {
      return '';
    }
  };
  C(fs.existsSync(path.join(ROOT, 'AGENTS.md')), 'AGENTS.md present', 'run ctx init');
  const claude = read('CLAUDE.md');
  const claudePath = path.join(ROOT, 'CLAUDE.md'), agentsPath = path.join(ROOT, 'AGENTS.md');
  const sameInstructions = fs.existsSync(claudePath) && fs.existsSync(agentsPath) && fs.lstatSync(claudePath).isSymbolicLink() && fs.realpathSync(claudePath) === fs.realpathSync(agentsPath);
  C(sameInstructions || !claude || /^\s*@AGENTS\.md\s*$/m.test(claude), 'CLAUDE.md resolves shared AGENTS.md', 'create the real AGENTS.md symlink, or preserve the explicit legacy import layout');
  C(fs.existsSync(path.join(CTX, 'index.md')) && read('context/index.md').includes('<!-- ctx:index:start -->'), 'context/index.md has ctx markers', 'run ctx index');
  C(fs.existsSync(path.join(CTX, 'ctx.mjs')), 'context/ctx.mjs present', 'copy scripts/ctx.mjs to context/');
  const gi = read('.gitignore');
  C(/context\/current-issues\.md/.test(gi), '.gitignore covers current-issues.md', 'add `context/current-issues.md` to .gitignore (pasted errors leak tokens)');
  C(/CLAUDE\.local\.md/.test(gi), '.gitignore covers CLAUDE.local.md', 'add `CLAUDE.local.md` to .gitignore');
  let settings = null;
  try {
    settings = JSON.parse(read('.claude/settings.json'));
  } catch {}
  if (settings) {
    const deny = Array.isArray(settings.permissions?.deny) ? settings.permissions.deny : [];
    C(deny.some((r) => typeof r === 'string' && /\.env/.test(r)), 'settings.json denies .env reads', 'add a deny rule like `Read(**/.env*)`');
    const hooks = settings.hooks || {};
    const flat = JSON.stringify(hooks);
    C(/SessionStart/.test(flat), 'SessionStart hook wired', 'wire `ctx hook session-start` in .claude/settings.json hooks');
    C(/Stop/.test(flat), 'Stop hook wired', 'wire `ctx hook stop` in .claude/settings.json hooks');
  } else {
    C(false, '.claude/settings.json parses', 'fix or re-run ctx init');
  }
  const cfgJ = (() => {
    try {
      return JSON.parse(read('context/.ctx.json'));
    } catch {
      return null;
    }
  })();
  C(!!cfgJ && !CONFIG_ERROR && cfgJ.setupVersion === VERSION, `project tooling at skill version ${VERSION}`, CONFIG_ERROR || `project was set up by ${cfgJ?.setupVersion || 'an older version'} — re-run: node <skill>/scripts/ctx.mjs setup --root . (idempotent upgrade)`);
  const dr = detect(ROOT);
  const expectRules = uiOn(dr, {}) || dr.signals.includes('backend') || dr.signals.includes('db') || dr.langs.some((l) => l !== 'docs');
  C(!expectRules || fs.existsSync(path.join(ROOT, '.claude', 'rules')), '.claude/rules/ path-gated rules present', 're-run ctx setup to generate them');
  C(!fs.existsSync(path.join(CTX, 'agents')) || fs.existsSync(path.join(CTX, 'agents', 'context-explorer', 'MEMORY.md')), 'subagent memory wired', 're-run ctx setup to scaffold context/agents/*/MEMORY.md');
  const ownership = ownershipHealth();
  C(!ownership.errors.length, 'canonical owners and host adapters resolve', ownership.errors.slice(0, 3).join('; '));
  const fails = checks.filter((c) => !c.ok);
  emit({ command: 'doctor', ok: !fails.length, checks }, () => {
    for (const c of checks) console.log(`${c.ok ? 'ok  ' : 'FAIL'}  ${c.label}${c.ok ? '' : ' — ' + c.fix}`);
    console.log(`\nctx doctor: ${checks.length - fails.length}/${checks.length} checks pass`);
  });
  if (fails.length) process.exit(1);
};

/* ---- status */
commands.status = () => {
  const ps = pages();
  const byType = {};
  for (const p of ps) byType[p.data.type || '?'] = (byType[p.data.type || '?'] || 0) + 1;
  const st = staleReport();
  const files = sourceFiles();
  const rx = ps.flatMap((p) => matchers(p.data.covers));
  const cov = files.length ? Math.round((files.filter((f) => anyMatch(rx, f)).length / files.length) * 100) : 100;
  const always = orientationFiles().reduce((n, p) => n + p.tokens, 0);
  const tr = ps.find((p) => p.rel === 'context/progress-tracker.md');
  const inProgress = tr ? ((tr.text.match(/##\s*In progress[^\n]*\n([\s\S]*?)(?:\n##\s|$)/i) || [])[1] || '').split('\n').filter((l) => l.trim().startsWith('-') && !/\{\{/.test(l)).map((l) => l.trim()) : [];
  const logPath = path.join(CTX, 'log.md');
  const recent = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8').split(/\n(?=## \[)/).filter((s) => s.startsWith('## [')).slice(-3) : [];
  emit({ command: 'status', ok: !(st.available && st.items.length), pages: ps.length, byType, stale: st.available ? st.items.length : null, coveragePct: cov, sourceFiles: files.length, orientTokens: always, inProgress, recentLog: recent }, () => {
    console.log(`pages: ${ps.length}  (${Object.entries(byType).map(([k, v]) => `${k}:${v}`).join(' ')})`);
    console.log(`stale: ${st.available ? st.items.length : 'n/a (no git)'}   code coverage: ${cov}% of ${files.length} source files`);
    console.log(`orient cost (always-read): ~${fmtTok(always)} tokens`);
    console.log(`in progress: ${inProgress.join(' | ') || '—'}`);
    console.log('recent log:');
    for (const e of recent) console.log(e.replace(/\n(?!## )/g, '\n  ').trimEnd());
  });
};

/* ---- hooks */
commands.hook = () => {
  const which = pos[0];
  let input = {};
  let validInput = true;
  try {
    if (!process.stdin.isTTY) {
      const parsed = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) input = parsed;
      else validInput = false;
    }
  } catch { validInput = false; }
  if (which === 'session-start') {
    if (input.source === 'compact') console.log('[project-context-system] Context was compacted — your memory of this session is lossy. Re-read the files below before continuing; trust the tracker and memory.md over recall.');
    const mem = path.join(ROOT, 'memory.md');
    let next = '';
    if (fs.existsSync(mem)) {
      const m = fs.readFileSync(mem, 'utf8').match(/##\s*Next step\s*\n([\s\S]*?)(?:\n##\s|$)/i);
      if (m) next = m[1].split('\n').filter((l) => l.trim() && !/\{\{/.test(l)).slice(0, 4).join(' ').trim();
    }
    const st = staleReport();
    console.log('[project-context-system] ORIENT: read AGENTS.md -> context/index.md -> memory.md. Do NOT scan the repo. For any task run `node context/ctx.mjs brief <files|keywords>` and read only what it returns (TL;DR first).');
    if (next) console.log(`Next step (from memory.md): ${next}`);
    if (st.available && st.items.length) console.log(`Context health: ${st.items.length} stale page(s) (${st.items.slice(0, 3).map((i) => i.p.relCtx).join(', ')}) — verify against code before trusting them.`);
    console.log('RECORD as you work: ctx task start/done (the ledger), decisions.md (hard calls), current-issues.md (bugs), `ctx impact` before finishing, memory.md at the end.');
    return;
  }
  if (which === 'stop') {
    if (!validInput || input.stop_hook_active === true) return; // malformed payloads are a no-op; never loop
    if (!HAS_GIT()) return;
    const { code, rows, trackerTouched, uncovered } = impactData(true);
    if (!code.length) return; // nothing changed -> allow stop
    const problems = [];
    if (uncovered.length) problems.push(`Uncovered changed source files: ${uncovered.slice(0, 6).join(', ')}. Add a documenting page or update its covers before stopping.`);
    const stale = rows.filter((r) => !r.updated);
    if (stale.length) problems.push(`Context pages not updated for changed code: ${stale.slice(0, 6).map((r) => r.p.rel).join(', ')}. Update them (or confirm nothing they describe changed) then run \`node context/ctx.mjs stamp <page>\`.`);
    if (!trackerTouched.length) problems.push('Neither context/progress-tracker.md nor memory.md was updated this session.');
    if (problems.length) {
      process.stderr.write('[project-context-system] Before ending the session:\n- ' + problems.join('\n- ') + '\n');
      process.exit(2);
    }
    return;
  }
  die('usage: ctx hook session-start|stop');
};

/* ---- init — dynamic: what gets scaffolded is decided by the project, not by assumption */
function groupsFor(d, f = {}) {
  const g = ['core'];
  if (uiOn(d, f)) g.push('ui');
  if (fullOn(d, f)) g.push('full');
  if (f.pointers) g.push('pointers');
  return g;
}
const uiOn = (d, f) => !f['no-ui'] && (f.ui || d.signals.includes('ui') || d.signals.includes('mobile'));
const fullOn = (d, f) => !f['no-full'] && (f.full || d.langs.some((l) => l !== 'docs'));

const INIT_MAP = [
  // [asset, dest, when(profile, flags)]
  ['AGENTS.md.template', 'AGENTS.md', () => true],
  ['CLAUDE.md.template', 'CLAUDE.md', () => true],
  ['claude-local.md.template', 'CLAUDE.local.md', () => true],
  ['memory.md.template', 'memory.md', () => true],
  ['settings.json.template', '.claude/settings.json', () => true],
  ['agent-explorer.md.template', '.agents/agents/context-explorer.md', () => true],
  ['agent-reviewer.md.template', '.agents/agents/context-reviewer.md', () => true],
  ['agents-readme.md.template', '.agents/README.md', () => true],
  ['ownership.md.template', 'context/ownership.md', () => true],
  ['docs-readme.md.template', 'docs/README.md', () => true],
  ['index.md.template', 'context/index.md', () => true],
  ['log.md.template', 'context/log.md', () => true],
  ['overview.md.template', 'context/overview.md', () => true],
  ['architecture.md.template', 'context/architecture.md', () => true],
  ['build-plan.template', 'context/build-plan.md', () => true],
  ['code-standards.md.template', 'context/code-standards.md', () => true],
  ['workflow-rules.md.template', 'context/workflow-rules.md', () => true],
  ['library-docs.md.template', 'context/library-docs.md', () => true],
  ['decisions.md.template', 'context/decisions.md', () => true],
  ['progress-tracker.md.template', 'context/progress-tracker.md', () => true],
  ['current-issues.md.template', 'context/current-issues.md', () => true],
  ['codebase-map.md.template', 'context/codebase/map.md', () => true],
  ['raw-README.md.template', 'context/raw/README.md', () => true],
  ['glossary.md.template', 'context/glossary.md', (d) => d.langs.some((l) => l !== 'docs')],
  ['testing.md.template', 'context/testing.md', (d) => d.langs.some((l) => l !== 'docs')],
  ['ui-tokens.md.template', 'context/ui-tokens.md', uiOn],
  ['ui-rules.md.template', 'context/ui-rules.md', uiOn],
  ['ui-registry.md.template', 'context/ui-registry.md', uiOn],
  ['data-model.md.template', 'context/data-model.md', (d, f) => fullOn(d, f) && d.signals.includes('db')],
  ['api-contracts.md.template', 'context/api-contracts.md', (d, f) => fullOn(d, f) && (d.signals.includes('backend') || d.signals.includes('ui'))],
  ['env-vars.md.template', 'context/env-vars.md', (d, f) => fullOn(d, f) && (d.signals.includes('backend') || d.signals.includes('ui') || d.signals.includes('data'))],
  ['integrations.md.template', 'context/integrations.md', (d, f) => fullOn(d, f) && (d.signals.includes('backend') || d.signals.includes('data') || d.signals.includes('db'))],
  ['runbook.md.template', 'context/runbook.md', (d, f) => fullOn(d, f) && (d.signals.includes('ui') || d.signals.includes('backend') || d.signals.includes('mobile') || d.signals.includes('data'))],
];
const POINTER_MAP = [
  ['GEMINI.md.template', 'GEMINI.md', 'gemini'],
  ['copilot-instructions.md.template', '.github/copilot-instructions.md', 'copilot'],
  ['cursor-rule.mdc.template', '.cursor/rules/project-context.mdc', 'cursor'],
];
/* ---- setup — the ONE command: everything mechanical, greenfield or brownfield.
   Idempotent (never clobbers filled content) and upgrade-safe (re-run after updating
   the skill: refreshes context/ctx.mjs, adds new files, bumps setupVersion). */
function pathInside(base, target) {
  const r = path.relative(base, target);
  return !path.isAbsolute(r) && r !== '..' && !r.startsWith('..' + path.sep);
}
function realPathWithMissing(target) {
  let parent = target;
  const suffix = [];
  for (;;) {
    try {
      fs.lstatSync(parent);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      const up = path.dirname(parent);
      if (up === parent) throw e;
      suffix.unshift(path.basename(parent));
      parent = up;
      continue;
    }
    // A dangling link exists according to lstat; never mistake realpath's
    // ENOENT for an ordinary missing destination and follow it during writes.
    return path.resolve(fs.realpathSync(parent), ...suffix);
  }
}
function projectPathError(abs) {
  try {
    if (!pathInside(ROOT, abs) || !pathInside(realPathWithMissing(ROOT), realPathWithMissing(abs))) return `path escapes project root: ${rel(abs)}`;
  } catch (e) {
    return `cannot safely resolve project path ${rel(abs)}: ${e.message}`;
  }
  return '';
}
function assertProjectPath(abs) {
  const error = projectPathError(abs);
  if (error) die(error);
}
function mapDraft() {
  const mp = path.join(CTX, 'codebase', 'map.md');
  if (fs.existsSync(mp)) {
    const normalize = (text) => text.replace(/\r\n/g, '\n').replace(/^updated: (?:\d{4}-\d{2}-\d{2}|\{\{TODAY\}\})$/m, 'updated: {{TODAY}}');
    const template = path.join(SKILL_DIR, 'assets', 'codebase-map.md.template');
    if (!fs.existsSync(template) || normalize(fs.readFileSync(mp, 'utf8')) !== normalize(fs.readFileSync(template, 'utf8'))) return { skipped: 'filled' };
  }
  const files = sourceFiles();
  if (files.length < 3) return { skipped: 'small', files: files.length }; // greenfield: the template is the honest answer
  const byDir = new Map();
  for (const f of files) {
    const parts = f.split('/');
    const dir = parts.length > 1 ? parts.slice(0, Math.min(2, parts.length - 1)).join('/') + '/' : './ (root)';
    byDir.set(dir, (byDir.get(dir) || 0) + 1);
  }
  const entries = [];
  const pkg = readJsonSafe(path.join(ROOT, 'package.json'));
  if (pkg) {
    if (pkg.bin) for (const [k, v] of Object.entries(typeof pkg.bin === 'string' ? { [readJsonSafe(path.join(ROOT, 'package.json')).name]: pkg.bin } : pkg.bin)) entries.push(`\`${k}\` → \`${v}\` (bin)`);
    if (pkg.main) entries.push(`main: \`${pkg.main}\``);
    for (const [s, c] of Object.entries(pkg.scripts || {})) if (/^(dev|start|serve|build|test)/.test(s)) entries.push(`script \`npm run ${s}\`: \`${c}\``);
  }
  for (const cand of ['manage.py', 'main.py', 'app.py', 'src/main.rs', 'src/main.go', 'cmd/main.go', 'main.go', 'src/index.ts', 'src/index.js', 'src/main.ts']) if (fs.existsSync(path.join(ROOT, cand))) entries.push(`\`${cand}\``);
  const dirs = [...byDir.entries()].sort((a, b) => b[1] - a[1]);
  const topGlobs = dirs.slice(0, 8).map(([d]) => (d === './ (root)' ? '' : d + '**')).filter(Boolean);
  const md = `---
title: Codebase Map
type: module
status: draft
summary: Mechanical draft from ctx setup — directory census and entry points, no meaning yet
tags: [codebase,map]
covers: []
confidence: inferred
updated: ${today()}
---

# Codebase Map

## TL;DR

- Draft generated by \`ctx setup\` on ${today()} — **structure only, no meaning yet**. Verify each area by reading code (or \`ctx tools\` for a code-intel pass) before trusting it.
- ${files.length} source files across ${dirs.length} areas.

## Layout

| Area | Files | What lives here (fill from reading code) |
|---|---|---|
${dirs.map(([d, n]) => `| \`${d}\` | ${n} | TODO |`).join('\n')}

## Entry points

${entries.length ? entries.map((e) => `- ${e}`).join('\n') : '- TODO — no manifest entry points detected'}

## Where is X?

| Question | Answer (file → symbol) |
|---|---|

## Generated / do-not-edit

TODO — list code generators, migrations, vendored output. (\`ctx\` already ignores: ${CONFIG.ignoreDirs.slice(0, 8).join(', ')}.)

## Module pages

Create one per cohesive area as you learn it — \`ctx new module <name> --covers "<glob>"\`. Candidate globs from the census: ${topGlobs.slice(0, 6).map((g) => '`' + g + '`').join(', ') || '—'} (\`ctx coverage\` tracks the rest).
`;
  atomicWrite(mp, md);
  return { skipped: false, files: files.length };
}
commands.setup = () => {
  if (path.resolve(SELF) !== path.resolve(path.join(ROOT, 'context', 'ctx.mjs')) && !fs.existsSync(path.join(SKILL_DIR, 'assets'))) {
    return die('setup must use the skill\'s own scripts/ctx.mjs (needs its assets/ folder) — run it from the project root: node <skill-dir>/scripts/ctx.mjs setup');
  }
  console.log('=== ctx setup ===\n');
  commands.init();
  const draft = mapDraft();
  if (!draft.skipped) console.log(`\nmap: drafted context/codebase/map.md from the code census (${draft.files} source files) — confidence: inferred`);
  else if (draft.skipped === 'small') console.log('\nmap: too little code to census (greenfield) — re-run setup once there is real code, or fill the template by hand');
  else console.log('\nmap: context/codebase/map.md already filled — left untouched');
  console.log('');
  commands.index();
  console.log('');
  commands.doctor();
  console.log(`
Judgement work left (the agent does this, the CLI cannot):
  1. fill every {{PLACEHOLDER}} from the planning conversation (ctx lint lists them)
  2. verify the map draft against real code; create module pages as areas get learned
  3. seed the task-routing table in context/index.md with this project's task types
Then: ctx task add "<first unit>" — and the system runs itself from there.`);
};

/* ---- rules — path-gated: what must be read for THESE files */
commands.rules = () => {
  if (!pos.length) return die('usage: ctx rules <file...>');
  const inventory = resourceInventory();
  const native = nativeResources(inventory.errors).filter((r) => r.kind === 'rule');
  const definitions = [...inventory.resources.filter((r) => r.kind === 'rule'), ...native.filter((r) => !r.data.ctx_source)];
  const rules = definitions.map((r) => ({ file: r.file, globs: ruleGlobs(r.data), read: asList(r.data.read).flatMap((s) => String(s).split(/\s*→\s*/)).map((s) => s.trim()).filter(Boolean) }));
  const out = [];
  for (const raw of pos) {
    const f = raw.replace(/\\/g, '/').replace(/^\.\//, '');
    const matched = rules.filter((r) => r.globs.length && anyMatch(matchers(r.globs), f));
    const pages = new Set(matched.flatMap((r) => r.read).filter((p) => /^context\/.+\.md$/.test(p)));
    for (const p of pages_()) if (anyMatch(matchers(p.data.covers), f)) pages.add(p.rel);
    const nested = [];
    const parts = f.split('/');
    for (let i = 1; i < parts.length; i++) {
      const local = parts.slice(0, i).join('/') + '/AGENTS.md';
      if (fs.existsSync(path.join(ROOT, local))) nested.push(local);
    }
    out.push({ file: f, rules: [...new Set(matched.map((r) => r.file))], adapters: native.filter((r) => r.data.ctx_source && matched.some((m) => m.file === r.data.ctx_source)).map((r) => r.file), pages: [...pages], nestedAgents: nested });
  }
  emit({ command: 'rules', ok: !inventory.errors.length, matches: out, errors: inventory.errors }, () => {
    for (const m of out) {
      console.log(`${m.file}:`);
      for (const r of m.rules) {
        const rule = rules.find((x) => x.file === r);
        console.log(`  rule  ${r}${rule.read.length ? ' — read ' + rule.read.join(' → ') : ''}`);
      }
      for (const p of m.pages) console.log(`  page  ${p}`);
      for (const n of m.nestedAgents) console.log(`  local ${n} (danger zone — read before editing)`);
      if (!m.rules.length && !m.pages.length && !m.nestedAgents.length) console.log('  (nothing path-gated — orient via: ctx brief ' + m.file + ')');
    }
    for (const error of inventory.errors) console.log(`ERROR ${error}`);
  });
};
function pages_() {
  return pages().filter((p) => !['superseded', 'archived'].includes(p.data.status));
}
function roadmapReservations() {
  const file = path.join(CTX, 'build-plan.md');
  const reservations = new Map();
  const errors = [];
  if (!fs.existsSync(file)) return { reservations, errors };
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\|\s*(\d{1,3})\s*\|\s*([^|]+?)\s*\|/);
    if (!m) continue;
    const id = String(Number(m[1])).padStart(2, '0');
    const title = m[2].replace(/\s+[—–-]\s+.*$/, '').trim();
    if (reservations.has(id)) errors.push(`context/build-plan.md: duplicate roadmap id ${id} — keep one reservation per feature`);
    else reservations.set(id, title);
  }
  return { reservations, errors };
}
commands.init = () => {
  const assetsDir = path.join(SKILL_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) return die(`init needs the skill's assets/ folder — use the skill's own scripts/ctx.mjs from your project root (node <skill-dir>/scripts/ctx.mjs init); this copy at ${SELF} ships without it.`);
  if (CONFIG_ERROR) return die(CONFIG_ERROR);
  if (flags.symlinks && flags['portable-pointers']) return die('choose --symlinks or --portable-pointers, not both');
  const existingConfig = fs.existsSync(path.join(CTX, '.ctx.json'));
  const previousMode = CONFIG.resourceMode;
  if (existingConfig && flags['portable-pointers'] && (previousMode === 'symlink' || CONFIG.requestedResourceMode === 'symlink')) return die('--portable-pointers cannot downgrade an installed or pending symlink layout; a deliberate reviewed migration is required');
  const mode = flags['portable-pointers'] ? 'pointer' : flags.symlinks ? 'symlink' : CONFIG.requestedResourceMode || (existingConfig ? previousMode : 'symlink');
  // Validate every writable boundary before the first scaffold file is created.
  for (const dest of [...INIT_MAP.map(([, dst]) => dst), ...POINTER_MAP.map(([, dst]) => dst), 'context/.ctx.json', 'context/ctx.mjs', '.gitignore', '.agents/agents', '.agents/rules', '.agents/skills', '.claude/agents', '.claude/rules', '.claude/skills', '.cursor/rules', '.cursor/skills', 'context/agents', 'context/feature-specs', 'context/codebase/modules', 'context/designs', 'context/screenshots', 'context/sources', 'context/archive', 'docs/adr', 'docs/runbooks']) assertProjectPath(path.resolve(ROOT, dest));
  for (const name of ['context-explorer', 'context-reviewer']) assertProjectPath(path.join(ROOT, '.claude', 'agents', name + '.md'));
  for (const name of ['frontend', 'api', 'data', 'testing']) {
    assertProjectPath(path.join(ROOT, '.agents', 'rules', name + '.md'));
    assertProjectPath(path.join(ROOT, '.claude', 'rules', name + '.md'));
    assertProjectPath(path.join(ROOT, '.cursor', 'rules', name + '.mdc'));
  }
  for (const agent of ['context-explorer', 'context-reviewer']) assertProjectPath(path.join(CTX, 'agents', agent, 'MEMORY.md'));
  const dangerZones = flags.danger ? String(flags.danger).split(',').map((s) => s.trim()).filter(Boolean) : [];
  for (const zone of dangerZones) {
    if (path.isAbsolute(zone) || zone.replace(/\\/g, '/').split('/').includes('..')) die(`danger zone must stay inside project root: ${zone}`);
    const abs = path.resolve(ROOT, zone);
    assertProjectPath(path.join(abs, 'AGENTS.md'));
    if (fs.existsSync(abs) && !fs.statSync(abs).isDirectory()) die(`danger zone is not a directory: ${zone}`);
  }
  if (mode === 'symlink') {
    if (!existingConfig || previousMode !== 'symlink') {
      const probe = probeSymlinks();
      if (!probe.supported) return die(probe.errors.join('\n'));
    }
    const gitState = configureLocalSymlinkGit();
    if (gitState.errors.length) return die(gitState.errors.join('\n'));
  }
  CONFIG.resourceMode = mode;
  const d = flags['no-detect'] ? { langs: [], kinds: ['generic'], signals: [], isMonorepo: false, tools: [], sourceExt: DEFAULTS.sourceExt, ignoreSourceGlobs: DEFAULTS.ignoreSourceGlobs } : detect(ROOT);
  const created = [];
  const skipped = [];
  const promoted = [];
  const canSeedResource = (kind, name, text) => {
    const legacy = adapterTargets({ kind, name }).filter((file) => fs.existsSync(path.join(ROOT, file)) && !parseFrontmatter(fs.readFileSync(path.join(ROOT, file), 'utf8')).data.ctx_source);
    if (!legacy.length) return true;
    if (legacy.length !== 1 || fs.readFileSync(path.join(ROOT, legacy[0]), 'utf8').replace(/\r\n/g, '\n') !== text.replace(/\r\n/g, '\n')) return false;
    promoted.push(legacy[0]);
    return true;
  };
  const put = (asset, dest) => {
    if (mode === 'symlink' && (dest === 'CLAUDE.md' || POINTER_MAP.some(([, file]) => file === dest))) {
      skipped.push(dest + ' (native symlink owns the entrypoint)');
      return;
    }
    const src = path.join(assetsDir, asset);
    const dst = path.join(ROOT, dest);
    if (!fs.existsSync(src)) {
      console.log(`! missing asset ${asset}`);
      return;
    }
    if (fs.existsSync(dst)) {
      skipped.push(dest);
      return;
    }
    const text = fs.readFileSync(src, 'utf8').replace(/\{\{TODAY\}\}/g, today());
    const kind = Object.keys(RESOURCE_DIRS).find((key) => dest.startsWith(RESOURCE_DIRS[key] + '/'));
    if (kind && !canSeedResource(kind, resourceName(dest, kind), text)) {
      skipped.push(`${dest} (legacy owner preserved; explicit migration required)`);
      return;
    }
    atomicWrite(dst, text);
    created.push(dest);
  };
  for (const [asset, dest, when] of INIT_MAP) if (when(d, flags)) put(asset, dest);
  for (const [asset, dest, tool] of POINTER_MAP) if (flags.pointers || tool === 'cursor' || d.tools.includes(tool)) put(asset, dest);

  // config: seeded from the detected stack so coverage/impact speak this project's language
  const cfgPath = path.join(CTX, '.ctx.json');
  if (!fs.existsSync(cfgPath)) {
    fs.mkdirSync(CTX, { recursive: true });
    const cfg = {
      resourceMode: mode === 'symlink' ? 'pointer' : mode, // installed strategy is committed by the validated link transaction
      requestedResourceMode: mode === 'symlink' ? 'symlink' : undefined,
      schemaVersion: CONFIG_SCHEMA,
      setupVersion: VERSION,
      profile: { langs: d.langs, kinds: d.kinds },
      maxPageLines: DEFAULTS.maxPageLines,
      maxAgentsLines: DEFAULTS.maxAgentsLines,
      maxSummaryChars: DEFAULTS.maxSummaryChars,
      alwaysRead: DEFAULTS.alwaysRead,
      sourceExt: d.sourceExt.length ? d.sourceExt : DEFAULTS.sourceExt,
      ignoreSourceGlobs: d.ignoreSourceGlobs.length ? d.ignoreSourceGlobs : DEFAULTS.ignoreSourceGlobs,
    };
    atomicWrite(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
    created.push('context/.ctx.json (seeded from detected profile)');
  } else {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      const before = JSON.stringify(cfg);
      const hadSchema = Number.isInteger(cfg.schemaVersion);
      if (!hadSchema) cfg.schemaVersion = 1;
      if (cfg.schemaVersion > CONFIG_SCHEMA) {
        skipped.push(`context/.ctx.json (schema ${cfg.schemaVersion} is newer than this CLI; upgrade the CLI first)`);
      } else {
        if (cfg.schemaVersion < CONFIG_SCHEMA) cfg.schemaVersion = CONFIG_SCHEMA;
        if (cfg.setupVersion !== VERSION) cfg.setupVersion = VERSION;
        if (JSON.stringify(cfg) !== before) {
          atomicWrite(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
          created.push(`context/.ctx.json (schema ${cfg.schemaVersion}, setupVersion ${VERSION})`);
        } else skipped.push('context/.ctx.json');
      }
    } catch {
      skipped.push('context/.ctx.json (unparseable - fix by hand)');
    }
  }

  // path-gated rules: thin pointers — content stays in the wiki, the rule just loads it at the right moment
  const RULES = [];
  if (uiOn(d, flags)) RULES.push(['frontend.md', ['src/components/**', 'src/app/**', 'app/**', 'components/**', '**/*.tsx', '**/*.jsx', '**/*.vue', '**/*.svelte'], 'context/ui-rules.md → context/ui-tokens.md → context/ui-registry.md']);
  if (d.signals.includes('backend')) RULES.push(['api.md', ['src/api/**', 'src/routes/**', 'src/server/**', 'api/**', 'routes/**', 'routers/**', 'src/handlers/**'], 'context/api-contracts.md → context/code-standards.md']);
  if (d.signals.includes('db')) RULES.push(['data.md', ['**/schema.ts', '**/schema.py', 'prisma/**', 'drizzle/**', '**/models/**', '**/migrations/**', '**/*.sql'], 'context/data-model.md → grep context/decisions.md for the area']);
  if (d.langs.some((l) => l !== 'docs')) RULES.push(['testing.md', ['**/*.test.*', '**/*.spec.*', '**/__tests__/**', 'tests/**', 'test/**', '**/*_test.go'], 'context/testing.md']);
  for (const [name, globs, read] of RULES) {
    const dest = '.agents/rules/' + name;
    const dst = path.join(ROOT, dest);
    if (fs.existsSync(dst)) { skipped.push(dest); continue; }
    const text = fs.readFileSync(path.join(assetsDir, 'rule.md.template'), 'utf8')
      .replace(/\{\{TODAY\}\}/g, today())
      .replace(/\{\{NAME\}\}/g, name.replace(/\.md$/, ''))
      .replace(/\{\{GLOBS\}\}/g, globs.join(', '))
      .replace(/\{\{READ\}\}/g, read);
    if (!canSeedResource('rule', name.replace(/\.md$/, ''), text)) { skipped.push(`${dest} (legacy owner preserved; explicit migration required)`); continue; }
    atomicWrite(dst, text);
    created.push(dest + ' (canonical path route)');
  }

  // subagent memory: read-only agents suggest lessons; the main agent persists authorized updates
  for (const agent of ['context-explorer', 'context-reviewer']) {
    const dst = path.join(CTX, 'agents', agent, 'MEMORY.md');
    if (fs.existsSync(dst)) {
      skipped.push('context/agents/' + agent + '/MEMORY.md');
      continue;
    }
    atomicWrite(dst, fs.readFileSync(path.join(assetsDir, 'agent-memory.md.template'), 'utf8').replace(/\{\{TODAY\}\}/g, today()).replace(/\{\{AGENT\}\}/g, agent));
    created.push('context/agents/' + agent + '/MEMORY.md');
  }

  // danger zones: nested AGENTS.md where the landmines are (auth, payments, migrations…)
  if (flags.danger && flags.danger !== true) {
    for (const zone of String(flags.danger).split(',').map((s) => s.trim()).filter(Boolean)) {
      const abs = path.join(ROOT, zone);
      if (!fs.existsSync(abs)) {
        console.log(`! danger zone ${zone} does not exist — skipped`);
        continue;
      }
      const dst = path.join(abs, 'AGENTS.md');
      if (fs.existsSync(dst)) {
        skipped.push(zone + '/AGENTS.md');
        continue;
      }
      atomicWrite(dst, fs.readFileSync(path.join(assetsDir, 'nested-AGENTS.md.template'), 'utf8').replace(/\{\{packages\/storefront\/\}\}/g, zone + '/'));
      created.push(zone + '/AGENTS.md (danger zone)');
    }
  }

  const resourceDirs = ['.agents/agents', '.agents/rules', '.agents/skills', 'context/feature-specs', 'context/codebase/modules', 'context/designs', 'context/screenshots', 'context/sources', 'context/archive', 'docs/adr', 'docs/runbooks'];
  if (mode === 'pointer') resourceDirs.push('.claude/agents', '.claude/rules', '.claude/skills', '.cursor/rules', '.cursor/skills');
  for (const dir of resourceDirs) {
    fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
    const keep = path.join(ROOT, dir, '.gitkeep');
    if (!fs.existsSync(keep) && !fs.readdirSync(path.join(ROOT, dir)).length) atomicWrite(keep, '');
  }
  const adapterState = adapterReport({ migrate: !!flags.migrate, promote: promoted });
  created.push(...adapterState.written);
  const self = path.join(ROOT, 'context', 'ctx.mjs');
  if (path.resolve(self) !== path.resolve(SELF)) {
    const srcBuf = fs.readFileSync(SELF);
    const exists = fs.existsSync(self);
    if (!exists || !fs.readFileSync(self).equals(srcBuf)) {
      const backup = exists ? backupFile(self) : null;
      atomicWrite(self, srcBuf);
      created.push('context/ctx.mjs (refreshed to skill version ' + VERSION + ')' + (backup ? '; backup: ' + rel(backup) : ''));
    } else skipped.push('context/ctx.mjs');
  }
  const gi = path.join(ROOT, '.gitignore');
  const add = fs.readFileSync(path.join(assetsDir, 'gitignore.append'), 'utf8');
  const cur = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8') : '';
  const have = new Set(cur.split('\n').map((l) => l.trim()));
  const newLines = add.split('\n').filter((l) => l.trim() && !l.startsWith('#') && !have.has(l.trim()));
  if (newLines.length) {
    appendAtomic(gi, (cur && !cur.endsWith('\n') ? '\n' : '') + '\n# project-context-system\n' + newLines.join('\n') + '\n');
    created.push('.gitignore (merged)');
  }
  console.log(`profile: ${d.langs.join(', ') || '?'} · kinds: ${d.kinds.join(', ') || 'generic'} · signals: ${d.signals.join(', ') || '—'}${flags['no-detect'] ? ' (detection skipped)' : ''}`);
  console.log(`created (${created.length}):\n  ${created.join('\n  ')}`);
  if (skipped.length) console.log(`kept existing (${skipped.length}): ${skipped.join(', ')}`);
  const delegated = INTEL_TOOLS.filter((t) => {
    try {
      return t.probe();
    } catch {
      return false;
    }
  }).map((t) => t.id);
  if (delegated.length) console.log(`\ndelegation available (ctx tools): ${delegated.join(', ')} — prefer them for the code map; see references/tool-delegation.md`);
  console.log(`\nNext: fill every {{PLACEHOLDER}} from the planning conversation (never from guesses), then:\n  node context/ctx.mjs index && node context/ctx.mjs lint && node context/ctx.mjs doctor`);
  for (const error of adapterState.errors) console.error(`ERROR ${error}`);
  for (const conflict of adapterState.conflicts) console.error(`CONFLICT ${conflict.file}: ${conflict.reason}`);
  if (adapterState.errors.length || adapterState.conflicts.length || adapterState.adapters.some((a) => !a.ok)) die('shared resource adapters need attention — reconcile the reported owners or explicitly run ctx adapters --migrate');
};

/* ----------------------------------------------------------------- main */
function die(msg) {
  if (flags.json) console.log(JSON.stringify({ command: cmd || null, ok: false, error: msg, exitCode: 1 }));
  else console.error(msg);
  process.exit(1);
}
if (argError) die(argError);
if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '--version' || !commands[cmd]) {
  if (cmd === '--version') {
    console.log(`ctx ${VERSION}`);
    process.exit(0);
  }
  const doc = fs.readFileSync(SELF, 'utf8').split('*/')[0].replace(/^[\s\S]*?\/\*\*/, '').replace(/^ \* ?/gm, '');
  console.log(doc.trim());
  process.exit(cmd && cmd !== 'help' && cmd !== '--help' ? 1 : 0);
}
const LOCKED_COMMANDS = new Set(['index', 'log', 'task', 'archive', 'stamp', 'new']);
if (LOCKED_COMMANDS.has(cmd)) withLock(() => commands[cmd]());
else commands[cmd]();
