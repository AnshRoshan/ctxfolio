# Install

The skill is three things you can install independently:

1. **The skill** — `SKILL.md` + `references/` + `assets/`, so an agent knows the method.
2. **The CLI** — `scripts/ctx.mjs`, zero dependencies, Node 22 or 24.
3. **The scaffold** — what the CLI writes into *your* project (AGENTS.md, `context/`, hooks).

## Windows: native symlink prerequisite

Enable Developer Mode or obtain the create-symbolic-link privilege before cloning/creating real links. `Start-Process 'ms-settings:developers'` opens Settings; the skill never toggles OS security automatically. You may turn it off after verified creation; existing links and normal canonical edits still work, while Git clones/checkouts or missing-link repairs may require it again.

New setup enables local Git `core.symlinks=true` and fails clearly if native creation is denied. It never silently substitutes junctions or regular files. `--portable-pointers` explicitly opts out for a fresh/legacy project; it is not a reverse migration for an installed/pending symlink layout.

## 1. The skill

**From a GitHub link (recommended):** paste this to your agent —

> Clone `https://github.com/AnshRoshan/project-context-system`, run `node <clone>/scripts/ctx.mjs install` to install it as a skill for my agent tool, then use it to set up this repository.

Or do the same by hand:

```bash
git -c core.symlinks=true clone https://github.com/AnshRoshan/project-context-system
node project-context-system/scripts/ctx.mjs install              # auto-detects ~/.claude / ~/.qoder
node project-context-system/scripts/ctx.mjs install --tool claude  # or --dest <skills-dir>
```

`install` copies only the shippable skill (`SKILL.md`, `references/`, `assets/`, `scripts/`) — the repo's dev history (CHANGELOG, tests, README) stays in the repo. Re-run to update; it overwrites cleanly.

Claude Code (personal):

```bash
cp -r project-context-system ~/.claude/skills/
```

Qoder CLI (personal):

```bash
cp -r project-context-system ~/.qoder/skills/
```

Project-level (any tool that reads `skills/*/SKILL.md`):

```bash
cp -r project-context-system /path/to/your-project/.claude/skills/
```

As a plugin (bundles the skill and keeps it updatable):

```bash
/plugin marketplace add AnshRoshan/project-context-system
/plugin install project-context-system
```

## 2. The CLI

Run it straight from the skill — no install step, no dependencies:

```bash
node /path/to/project-context-system/scripts/ctx.mjs --help
```

Or put it on your PATH by copying it somewhere in it and marking it executable:

```bash
install -m 755 /path/to/project-context-system/scripts/ctx.mjs ~/.local/bin/ctx
ctx --help
```

## 3. The scaffold — one command

**Run from your project's root.** This is the only command anywhere that references a path outside the project; everything after setup is project-relative:

```bash
cd /path/to/your-project
node /path/to/project-context-system/scripts/ctx.mjs setup
```

It detects the project profile (languages, kinds, UI/DB/API signals, installed agent tools)
and creates the owner pages, canonical .agents resources, real native resource links,
central Cursor metadata views, agent experience files and a codebase draft where applicable,
then runs the catalog and doctor checks. Optional:
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

Checks cover the things that quietly break: that native entrypoints resolve shared
`AGENTS.md`, that git actually ignores `context/current-issues.md`, `CLAUDE.local.md` and
`.claude/settings.local.json`, that `.claude/settings.json` denies `.env*` reads and has
both hooks, that the path-gated rules and subagent memory exist, and that the project is
at the skill's current `setupVersion` (if not: re-run `setup` to upgrade). `setup` runs
this for you as its last step. Exits non-zero when anything fails.

A green `doctor` plus `ctx lint` is the definition of a correctly wired project.

## Test the tool itself

```bash
node tests/run.mjs          # or: npm test
```

47 end-to-end cases against throwaway git repos (scaffold, profiles, setup idempotence
and upgrades, hooks, lint, JSON contracts). If you change `scripts/ctx.mjs`,
run it. It needs no dependencies and no network.

## Uninstall

Remove the skill directory. Inside a project that was scaffolded, delete what you
want to stop maintaining — there is no registry, no daemon, no hidden state:

```bash
rm -rf context/ AGENTS.md CLAUDE.md CLAUDE.local.md memory.md
```

The `.gitignore` entries added by `init` are marked `# project-context-system` and
are safe to delete by hand. Removing the plugin does not touch projects already
scaffolded; that is deliberate — your project's wiki is yours, not the skill's.

## Requirements

- **Node 22 or 24** for the CLI. The skill itself (the markdown) has no requirements.
- **git** is optional but recommended: without it `ctx stale` and `ctx impact`
  degrade to no-ops and `doctor` reports it.
- Works with Claude Code, Codex, Cursor, Copilot, Gemini CLI, Qoder, Zed and anything
  else that reads `AGENTS.md`.
