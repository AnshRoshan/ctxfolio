# Install Ctxfolio

The skill is three things you can install independently:

1. **The skill** — `SKILL.md` + `references/` + `assets/`, so an agent knows the method.
2. **The CLI** — `scripts/ctx.mjs`, zero dependencies, Node 22 or 24.
3. **The scaffold** — what the CLI writes into *your* project (AGENTS.md, `context/`, hooks).

## Windows: native symlink prerequisite

Enable Developer Mode or obtain the create-symbolic-link privilege before cloning/creating real links. `Start-Process 'ms-settings:developers'` opens Settings; the skill never toggles OS security automatically. You may turn it off after verified creation; existing links and normal canonical edits still work, while Git clones/checkouts or missing-link repairs may require it again.

New setup enables local Git `core.symlinks=true` and fails clearly if native creation is denied. It never silently substitutes junctions or regular files. `--portable-pointers` explicitly opts out for a fresh/legacy project; it is not a reverse migration for an installed/pending symlink layout.

## Recommended: npm

From your project root, run the pinned release:

```bash
npx ctxfolio@3.8.0 setup
```

For a global CLI:

```bash
npm install -g ctxfolio@3.8.0
ctx setup
```

The [ctxfolio npm package](https://www.npmjs.com/package/ctxfolio) provides `ctx` and the scaffold assets with zero npm runtime dependencies. Setup creates a project-local routing skill; global skill installation is optional. npm package 3.8.0 maps to skill/CLI 2.8.0.

## 1. The skill

**From a GitHub link:** paste this to your agent —

> Clone `https://github.com/AnshRoshan/ctxfolio`, run `node <clone>/scripts/ctx.mjs install` to install it as a skill for my agent tool, then use it to set up this repository.

Or do the same by hand:

```bash
git -c core.symlinks=true clone https://github.com/AnshRoshan/ctxfolio
node ctxfolio/scripts/ctx.mjs install              # ~/.agents/skills/ctxfolio
node ctxfolio/scripts/ctx.mjs install --tool claude  # ~/.claude/skills/ctxfolio
node ctxfolio/scripts/ctx.mjs install --tool qoder   # ~/.qoder/skills/ctxfolio
node ctxfolio/scripts/ctx.mjs install --dest <skills-parent-dir>
```

`install` copies only the shippable skill (`SKILL.md`, `references/`, `assets/`, `scripts/`) — the repo's dev history (CHANGELOG, tests, README) stays in the repo. `--dest` names the **parent skills directory**; the installer appends `ctxfolio`.

Re-runs stage a fresh SHIP-only tree, write `.ctx-install.json`, rename an existing install to a reported `.ctx-backup-*` sibling, then rename the stage into place. Old local edits survive in the backup; stale files do not carry into the new install. The manifest records local install time, CLI version, file paths and a checksum of `SKILL.md` only — not authenticated upstream provenance or a checksum of every shipped file.

These are two renames, not a crash-atomic directory exchange: interruption can leave the install path absent. On a caught publication failure, the installer attempts to restore the backup only if that path is still absent; an occupied destination is left alone and remaining recovery paths are reported. Inspect the reported backup/stage and destination before manual recovery. Use `--dry-run` to preview without writes; see [verification evidence](context/testing.md#verification-evidence) for tested recovery paths.

Claude Code (personal):

```bash
node ctxfolio/scripts/ctx.mjs install --tool claude
```

Qoder CLI (personal):

```bash
node ctxfolio/scripts/ctx.mjs install --tool qoder
```

Project-level (any tool that reads `skills/*/SKILL.md`):

```bash
node ctxfolio/scripts/ctx.mjs install --dest /path/to/your-project/.claude/skills
```

As a plugin (bundles the skill and keeps it updatable):

```bash
/plugin marketplace add AnshRoshan/ctxfolio
/plugin install ctxfolio
```

## 2. The CLI

Run it straight from the skill — no install step, no dependencies:

```bash
node /path/to/ctxfolio/scripts/ctx.mjs --help
```

Or put it on your PATH by copying it somewhere in it and marking it executable:

```bash
install -m 755 /path/to/ctxfolio/scripts/ctx.mjs ~/.local/bin/ctx
ctx --help
```

## 3. The scaffold — one command

**Run from your project's root.** This is the only command anywhere that references a path outside the project; everything after setup is project-relative:

```bash
cd /path/to/your-project
node /path/to/ctxfolio/scripts/ctx.mjs setup
```

Setup defaults to a populated standard scaffold; `--lite` reduces the wiki and `--full` adds detected profile extras and a source-census map draft. It creates canonical .agents resources, real native links, central Cursor views and a project-local routing skill, then runs catalog/doctor wiring checks. Existing authored files are preserved. Tier and host commands: [reference](references/scale-and-hosts.md). Optional:
`--danger "src/auth,src/payments"` for nested landmine warnings; `--ui/--no-ui`,
`--full`, `--pointers`, `--no-detect` to override detection.

**Idempotent and upgrade-safe:** re-run any time — filled content is never clobbered, new
files get added, and after updating the skill the re-run upgrades the project in place
(`doctor` flags a stale `setupVersion` and tells you).

`setup` copies the CLI into `context/ctx.mjs`, so the project carries its own tooling
afterwards and every later command is simply:

```bash
node context/ctx.mjs brief src/whatever.ts
```

## Verify the install

```bash
node context/ctx.mjs doctor
node context/ctx.mjs symlinks --check
```

`doctor` checks scaffold presence, shared-entrypoint resolution, catalog markers,
canonical owners/adapters, expected rule/memory paths and the current `setupVersion`.
It checks `.gitignore` text for `context/current-issues.md` and `CLAUDE.local.md`,
settings text for an `.env`-matching deny entry, and hook event names for SessionStart
and Stop. It does not run `git check-ignore`, check `.claude/settings.local.json`,
validate executable hook commands, exercise deny rules or prove a host loader ran.
`symlinks --check` audits recorded native link/Git structure, not host execution.
`setup` runs doctor at the end; doctor exits non-zero on a failed check.

Green doctor, symlink and lint checks are structural wiring/bookkeeping evidence,
not ignore, security, loader or semantic-correctness proof. Verify actual host
restrictions and hook execution separately using the [safety contract](references/safety-permissions.md).

## Test the tool itself

```bash
node tests/run.mjs          # or: npm test
```

The suite drives throwaway git repos (scaffold, profiles, setup idempotence and
upgrades, hooks, lint, JSON contracts). Current case counts, supported-platform runs
and release checks live in [verification evidence](context/testing.md#verification-evidence).
If you change `scripts/ctx.mjs`, run it. The CLI suite needs no dependencies or network.

## Uninstall

Remove the skill directory. Inside a project that was scaffolded, delete what you
want to stop maintaining — there is no registry, no daemon, no hidden state:

```bash
rm -rf context/ AGENTS.md CLAUDE.md CLAUDE.local.md memory.md
```

The `.gitignore` entries added by `init` are marked `# ctxfolio` and
are safe to delete by hand. Removing the plugin does not touch projects already
scaffolded; that is deliberate — your project's wiki is yours, not the skill's.

## Requirements

- **Node 22 or 24** for the CLI. The skill itself (the markdown) has no requirements.
- **git** is optional but recommended: without it `ctx stale` and `ctx impact`
  degrade to no-ops and `doctor` reports it.
- Works with Claude Code, Codex, Cursor, Copilot, Gemini CLI, Qoder, Zed and anything
  else that reads `AGENTS.md`.
