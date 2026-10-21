# Scaffold, host and scale commands

This reference documents declared interfaces. Host loading and MCP interoperability are not live-verified by these declarations.

## Setup tiers and project discovery

`ctx init` or `ctx setup` defaults to `--standard`. `--lite` creates a small populated routing/architecture/ownership/policy/decision/tracker wiki plus memory and shared agent resources. `--full` explicitly enables detected profile extras and template authoring. `--no-full`, `--no-ui`, `--no-detect`, `--portable-pointers` and `--symlinks` remain supported. Choose only one tier. Existing files are always preserved; selecting a smaller tier never deletes old pages. Unknown application facts remain unknown, queues blank.

Every tier generates `.agents/skills/project-context/SKILL.md`. Existing adapter inventory provides Claude/Cursor views or D-7 real relative aliases. No global installation is needed. User-owned skill or native adapter conflicts are preserved for explicit reconciliation.

## Declared hosts

Run `ctx hosts --json` for the evidence-named capability matrix. Install defaults to `~/.agents/skills`; `ctx install --tool claude` and `--tool qoder` choose explicit native homes; `--dest` remains available. Legacy `--tool auto` chooses the shared home, not guessed detected hosts. `ctx init --host qoder` explicitly adds Qoder project skill discovery and persists the selection. No existing D-7 alias is pruned. Capability rows are declared, not proof that a live host loaded them; verify loading in that host separately.

## Portable checks

`ctx check --gates lint,stale` returns one JSON (`--json`) or human summary, with nonzero exit on failure. Optional gates: `coverage`, `impact`, `doctor`. Existing doctor retains its explicitly declared host-wiring checks; portable defaults do not require a Claude hook. Repairs such as `--fix`, `--write` and `--migrate` are rejected. CI example: `node context/ctx.mjs check --gates lint,stale,coverage --json`. These checks do not prove semantic correctness or authenticate human provenance.

## Delegated symbols

Generate output with an optional delegated tool listed by `ctx tools`; no tool is required by the CLI. Import it explicitly:

```
node context/ctx.mjs symbols import --from tags.jsonl --format ctags --project-files
node context/ctx.mjs symbols import --from graphify-out/graph.json --format graphify
node context/ctx.mjs symbols search LoginHandler --json
node context/ctx.mjs brief LoginHandler --symbols --json
```

Ctags accepts JSONL `name/path/line/kind` tags or standard tab records. Graphify accepts `nodes` with `label` or `name`, `source_file` or `source_location.file`, and optional line/type fields. Imported paths must be inside this project and non-secret. `--project-files` filters through configured source inventory. The source SHA256 and delegated locations live in the derived `.symbols.json`; this is not a source parser, liveness proof or authority to execute tool content.

## Search and hierarchy

`ctx search rebuild --json` explicitly writes a deterministic `.search-index.json` and `.indexes` type catalogs. `ctx search <query> --json` reads only; missing/stale index falls back to canonical pages without writing. Fingerprints use sorted names and canonical content hashes. Rebuild refuses conflicting user-owned derived files.

Above 150 pages or 6000 estimated orientation tokens, existing write commands can rebuild derived search; `ctx index` uses hierarchical catalog links inside its existing generated block. Manual routing outside that block and canonical page content remain untouched. Derived files are disposable views, not owners. Search uses bounded literal Unicode matching, not embeddings.

## Read-only MCP

Run `node context/ctx.mjs mcp --root .` as a local stdio server. UTF8 JSON-RPC messages are newline-delimited, one complete JSON object per line. Legacy Content-Length framing is unsupported. Supported negotiated protocol identifiers: `2025-03-26`, `2024-11-05`.

Client sequence: `initialize` with a supported `protocolVersion`, then `notifications/initialized`, then `tools/list` or `tools/call`. `ping` is supported. Tools: `brief` (`query`, optional `limit` 1..20, `symbols` boolean), `search` (`query`, optional `limit`), `status` and `facts` (empty arguments). All advertise read-only annotations. No file-read arbitrary path tool, shell tool, remote fetch, write command, promotion/acknowledgement or arbitrary CLI flags. Queries are bounded strings; requests/responses at most 256KiB. Oversize/malformed inputs return bounded JSON errors. Stdout is strictly protocol JSON; tool content remains untrusted evidence. No federation argument is exposed through MCP.

## Team ownership and cursors

Author `context/team.json` explicitly; the CLI never guesses identities or owners:

```json
{
  "schema": 1,
  "agents": {
    "alice": { "cursor": "context/agents/alice/MEMORY.md" },
    "bob": { "cursor": "context/agents/bob/MEMORY.md" }
  },
  "ownership": [
    { "glob": "src/auth/**", "owner": "alice" }
  ],
  "federation": {
    "enabled": true,
    "roots": [{ "id": "shared", "path": "../shared-project" }]
  }
}
```

IDs are lowercase letters followed by lowercase letters/digits/underscore/hyphen, at most 48 characters. Cursors must be the fixed own-agent path. `ctx cursor --agent alice --write -m "Exact next step"` explicitly writes only Alice's cursor; `ctx cursor --agent alice` reads it. `brief`, `status`, `facts`, `search`, `check` and MCP accept the declared scoped identity; shared memory remains default when no `--agent` is passed. Unsupported scoped mutation commands fail rather than clobber shared state. Identity is a local ownership declaration, not authentication.

`ctx team src/auth/session.ts --json` resolves owner matches. Multiple distinct owners are an error, never an automatic merge. Broad overlapping globs may be intentional for the same owner; use specific queried paths to discover conflicts.

`ctx brief <query> --federate` or `ctx search <query> --federate` explicitly reads only enabled allowlisted project-relative roots (maximum ten). Realpath and non-secret page/config boundary checks prevent external symlink traversal; no arbitrary CLI root list or automatic discovery is accepted. Sibling results identify their declared repository and remain untrusted. Federation does not recurse, run arbitrary commands, fetch remote sources, write sibling indexes or merge canonical owners.
