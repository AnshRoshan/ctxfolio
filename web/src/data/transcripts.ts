/* ---------------------------------------------------------------------------
   transcripts.ts
   Illustrative legacy v2.4.x examples, not captured current CLI output or
   measured results. Counts, dates, paths and exit states are synthetic fixtures
   for a fictional Node web-app profile. Historical wiring is not a claim about
   current installation, host loading or permissions. The current contract lives
   in references/ctx-cli.md; measured run evidence lives in context/testing.md.
--------------------------------------------------------------------------- */

export type Tone = "dim" | "text" | "good" | "bad" | "signal" | "cmd";

export type Line = { t: string; tone?: Tone };

export type CliCommand = {
  id: string;
  chip: string;
  cmd: string;
  note: string;
  exit: number;
  lines: Line[];
};

const d = (t: string): Line => ({ t, tone: "dim" });
const x = (t: string): Line => ({ t, tone: "text" });
const ok = (t: string): Line => ({ t, tone: "good" });
const bad = (t: string): Line => ({ t, tone: "bad" });
const sig = (t: string): Line => ({ t, tone: "signal" });

export const CLI_COMMANDS: CliCommand[] = [
  {
    id: "brief",
    chip: "brief",
    cmd: "node context/ctx.mjs brief src/auth/login.ts",
    note: "Route a task to the few pages worth reading, with a token cost.",
    exit: 0,
    lines: [
      x("brief for: src/auth/login.ts"),
      d("budget 6000 tokens   ranked 4 pages"),
      x(""),
      sig("  1. context/codebase/modules/auth.md          ~820 tok   verified   2026-10-02"),
      d("     covers: src/auth/**"),
      d("     TL;DR  Session tokens are httpOnly cookies. The refresh token rotates on use."),
      d("     TL;DR  Never log a token payload. Lint catches token-shaped strings."),
      x(""),
      sig("  2. context/api-contracts.md                  ~640 tok   verified   2026-09-30"),
      d("     covers: src/api/**"),
      d("     TL;DR  POST /auth/login returns 200 and two cookies. 429 after 5 attempts."),
      x(""),
      sig("  3. context/decisions.md#D-04                 ~310 tok   verified   2026-09-18"),
      d("     TL;DR  Chose rotating refresh tokens over sliding sessions. Cost: one extra write."),
      x(""),
      sig("  4. .claude/rules/frontend.md                 ~90 tok    path-gated"),
      d("     loads only when you touch src/components/** or *.tsx"),
      x(""),
      d("blind spots: none. every argument matched a covers: glob."),
      d("always read: context/index.md (~1.1k), memory.md (~340)"),
    ],
  },
  {
    id: "impact",
    chip: "impact",
    cmd: "node context/ctx.mjs impact --check",
    note: "Code changed. Which pages must change in the same diff.",
    exit: 2,
    lines: [
      x("changed code (working tree):"),
      d("  M src/auth/session.ts"),
      d("  A src/auth/rotate.ts"),
      d("  M src/api/routes/sessions.ts"),
      x(""),
      x("pages that must be updated:"),
      bad("  x context/codebase/modules/auth.md     covers src/auth/session.ts"),
      bad("  x context/api-contracts.md             covers src/api/**"),
      x("already updated:"),
      ok("  v context/decisions.md"),
      x("uncovered files (BLIND SPOT):"),
      sig("  ! src/auth/rotate.ts                   add to a covers: glob or ctx new module"),
      x(""),
      d("tracker/memory touched: yes"),
      bad("not clean. fix the x pages, then: node context/ctx.mjs stamp <page>"),
      d("exit 2 with --check"),
    ],
  },
  {
    id: "stale",
    chip: "stale",
    cmd: "node context/ctx.mjs stale",
    note: "Pages whose covered code moved after the page was last touched.",
    exit: 0,
    lines: [
      x("stale pages (git baseline: last commit touching the page, or verified_at):"),
      x(""),
      sig("  context/codebase/modules/auth.md"),
      d("    3 file(s): src/auth/session.ts, src/auth/rotate.ts, src/auth/cookie.ts"),
      d("    baseline 8ae5d7d   page last touched 4c1f0a2"),
      sig("  context/api-contracts.md"),
      d("    1 file(s): src/api/routes/sessions.ts"),
      d("    baseline 8ae5d7d   page last touched 91bb3e7"),
      x(""),
      bad("2 stale page(s). re-read each against code, fix it, then stamp it."),
      d("node context/ctx.mjs stamp context/codebase/modules/auth.md"),
    ],
  },
  {
    id: "lint",
    chip: "lint",
    cmd: "node context/ctx.mjs lint",
    note: "Health check. After a merge this is where collisions catch fire.",
    exit: 1,
    lines: [
      x("lint: 2 errors, 3 warnings"),
      x(""),
      bad("ERROR  progress-tracker.md: Feature 07 listed twice in \"In progress\" (branch-merge collision)"),
      bad("ERROR  decisions.md: duplicate decision id D-07"),
      d("       referenced by: context/feature-specs/07-refresh-rotation.md, context/architecture.md"),
      d("       renumber the later merge, then update those references"),
      x(""),
      sig("WARN   feature-specs: two specs share number 09 (09-audit-export.md, 09-session-list.md)"),
      sig("WARN   stale: context/codebase/modules/auth.md (covered code changed)"),
      sig("WARN   page over 160 lines: context/decisions.md (178)"),
      x(""),
      d("pages 34   orphans 0   placeholders 0   broken links 0   secrets 0"),
      d("index catalog: out of date. run node context/ctx.mjs lint --fix"),
      bad("exit 1"),
    ],
  },
  {
    id: "doctor",
    chip: "doctor",
    cmd: "node context/ctx.mjs doctor",
    note: "Legacy scaffold-check example. Wiring metadata does not prove loading or permissions.",
    exit: 0,
    lines: [
      x("doctor: 12 checks"),
      x(""),
      ok("  ok    CLAUDE.md imports @AGENTS.md"),
      ok("  ok    AGENTS.md exists, 118 lines (limit 120), routed through the index"),
      ok("  ok    context/index.md catalog markers present"),
      ok("  ok    context/.ctx.json parseable, profile node / web-app"),
      ok("  ok    .gitignore covers context/current-issues.md"),
      ok("  ok    .gitignore covers CLAUDE.local.md and .claude/settings.local.json"),
      ok("  ok    settings.json denies reads of .env*"),
      ok("  ok    settings.json denies edits to context/raw/** and migrations"),
      ok("  ok    SessionStart hook wired to ctx hook session-start"),
      ok("  ok    Stop hook wired to ctx hook stop"),
      ok("  ok    .claude/rules/ present (4 path-gated rules)"),
      ok("  ok    context/agents/*/MEMORY.md present (2)"),
      x(""),
      d("setupVersion 2.4.1 matches the skill version"),
      ok("12 passed, 0 failed"),
    ],
  },
  {
    id: "task",
    chip: "task list",
    cmd: "node context/ctx.mjs task list",
    note: "The ledger. One unit in progress, enforced by the CLI.",
    exit: 0,
    lines: [
      x("task ledger (context/progress-tracker.md)"),
      x(""),
      sig("In progress   (max 1)"),
      x("  07  refresh token rotation          @ana    branch feat/07"),
      x(""),
      sig("Blocked"),
      x("  09  stripe webhook replay           @ravi   waiting on vendor sandbox key"),
      x(""),
      sig("Up next"),
      x("  10  session list pagination"),
      x("  11  audit log export"),
      x(""),
      sig("Completed   (kept 90 days, then archived)"),
      d("  06  login rate limit                2026-09-28"),
      d("  05  password reset flow             2026-09-21"),
      x(""),
      d("1 unit in progress. ctx task start refuses a second one on this branch."),
      d("use --force only with a written reason in decisions.md."),
    ],
  },
  {
    id: "coverage",
    chip: "coverage",
    cmd: "node context/ctx.mjs coverage",
    note: "Source files no page documents. The blind spots.",
    exit: 0,
    lines: [
      x("code coverage: 86% of 214 source files"),
      x(""),
      ok("  covered     184 files"),
      sig("  blind spot   30 files"),
      x(""),
      d("  src/workers/          11 files   no page covers this directory"),
      d("  src/lib/format/        7 files   no page covers this directory"),
      d("  scripts/               6 files   no page covers this directory"),
      d("  src/auth/rotate.ts     1 file    add to context/codebase/modules/auth.md covers:"),
      d("  src/api/middleware.ts  1 file    add to context/api-contracts.md covers:"),
      x(""),
      d("target for ADOPT: 80% or higher."),
      d("fix with a covers: glob, or run ctx new module <name> --covers \"src/workers/**\""),
    ],
  },
  {
    id: "status",
    chip: "status",
    cmd: "node context/ctx.mjs status",
    note: "One screen. The human dashboard.",
    exit: 0,
    lines: [
      x("pages: 34 (module:9 spec:6 query:4 standard:3 decision:1 overview:1 architecture:1 other:9)"),
      x("stale: 2   code coverage: 86% of 214 source files"),
      x("orient cost (always-read): ~1.4k tokens"),
      x("in progress: Feature 07 refresh token rotation"),
      x("recent log:"),
      d("  ## [2026-10-07] build | Feature 06 login rate limit shipped"),
      d("  ## [2026-10-05] ingest | Stripe webhook vendor docs"),
      d("  ## [2026-10-02] sync | post-merge staleness sweep"),
    ],
  },
  {
    id: "rules",
    chip: "rules",
    cmd: "node context/ctx.mjs rules src/components/SessionList.tsx src/auth/session.ts",
    note: "Path gated. Zero tokens spent on rules that do not apply.",
    exit: 0,
    lines: [
      x("src/components/SessionList.tsx:"),
      sig("  rule .claude/rules/frontend.md - read context/ui-rules.md -> context/ui-tokens.md -> context/ui-registry.md"),
      sig("  rule .claude/rules/testing.md - read context/testing.md"),
      d("  page context/codebase/modules/sessions.md"),
      d("  page context/ui-registry.md"),
      x(""),
      x("src/auth/session.ts:"),
      sig("  rule .claude/rules/testing.md - read context/testing.md"),
      d("  page context/codebase/modules/auth.md"),
      bad("  local src/auth/AGENTS.md (danger zone - read before editing)"),
    ],
  },
  {
    id: "tools",
    chip: "tools",
    cmd: "node context/ctx.mjs tools",
    note: "Delegate the structural pass. The tool produces, the wiki keeps.",
    exit: 0,
    lines: [
      x("code-intelligence tools available in this project:"),
      x(""),
      ok("  found     ctags"),
      d("            best: symbol index (functions, classes, exports) per file"),
      d("            how:  `ctags -R` gives the public-surface tables of module pages for free"),
      ok("  found     dependency-cruiser"),
      d("            best: import graph, cycles, layering violations"),
      d("            how:  depcruise --output-type dot src | feed edges into architecture.md"),
      bad("  missing   graphify"),
      d("            best: codebase map, module boundaries, dependency questions"),
      bad("  missing   aider"),
      d("            best: repo-map ranked by PageRank over imports"),
      bad("  missing   madge"),
      d("            best: circular dependencies, orphan modules"),
      x(""),
      d("never paste a raw dump into a page. distill it, then stamp confidence: inferred."),
      d("record the choice as a decisions.md D-NN entry with its cost."),
    ],
  },
  {
    id: "archive",
    chip: "archive",
    cmd: "node context/ctx.mjs archive --dry-run",
    note: "The growth valve. Nothing is deleted, only moved off the fast path.",
    exit: 0,
    lines: [
      x("archive plan (dry run)"),
      x(""),
      sig("  log.md"),
      d("    12 entries older than 180 days -> context/archive/log-2026-03.md"),
      sig("  progress-tracker.md"),
      d("    9 completions older than 90 days -> context/archive/tracker-2026.md"),
      d("    a pointer line stays behind in Completed"),
      sig("  decisions.md"),
      d("    178 lines, over the 160 line page budget"),
      d("    split plan: D-01..D-09 -> context/archive/decisions-2025.md"),
      bad("    keep D-NN ids stable. everything links them."),
      x(""),
      d("archives stay greppable:"),
      d("  grep \"Feature 07\" context/archive/*.md"),
      d("run without --dry-run to apply."),
    ],
  },
  {
    id: "index",
    chip: "index",
    cmd: "node context/ctx.mjs index",
    note: "Regenerate the catalog from frontmatter; routing and meaning still need review.",
    exit: 0,
    lines: [
      x("index: catalog regenerated in context/index.md"),
      d("  34 pages, 41 catalog lines"),
      d("  between markers ctx:catalog:start and ctx:catalog:end"),
      d("  grouped by type: module 9, spec 6, query 4, decision 1, other 14"),
      x(""),
      d("unverified pages are marked in the catalog and never trusted blindly:"),
      sig("  context/codebase/map.md          confidence: inferred"),
      d("llms.txt not written. pass --llms to emit one at the repo root."),
    ],
  },
];

/* --------------------------------------------------------------------------
   STOP HOOK. Synthetic legacy six-step scenario, not an enforcement guarantee.
-------------------------------------------------------------------------- */

export type HookStep = {
  id: number;
  chip: string;
  prompt: string;
  lines: Line[];
  blocked: boolean;
  pagesFixed: number;
  trackerTouched: boolean;
  blindSpots: number;
  caption: string;
};

export const HOOK_STEPS: HookStep[] = [
  {
    id: 1,
    chip: "start the unit",
    prompt: "node context/ctx.mjs task start 07",
    caption: "The ledger allows one unit in progress. The CLI enforces it.",
    blocked: false,
    pagesFixed: 0,
    trackerTouched: true,
    blindSpots: 0,
    lines: [
      x("tracker: Feature 07 -> In progress"),
      d("moved from Up next. 1 unit in progress, max 1."),
      d("branch feat/07 owns: feature-specs/07-refresh-rotation.md, its tracker line,"),
      d("its decisions, and the module pages for the area it changes."),
    ],
  },
  {
    id: 2,
    chip: "change the code",
    prompt: "edit src/auth/session.ts   # rotate the refresh token on every use",
    caption: "A normal edit. Nothing has been recorded yet.",
    blocked: false,
    pagesFixed: 0,
    trackerTouched: true,
    blindSpots: 1,
    lines: [
      d("M src/auth/session.ts        +38 -12"),
      d("A src/auth/rotate.ts         +61"),
      d("M src/api/routes/sessions.ts  +4  -2"),
      x(""),
      d("no page was touched. no decision was recorded."),
    ],
  },
  {
    id: 3,
    chip: "try to stop",
    prompt: "exit",
    caption: "The legacy scenario shows an initial Stop block for missing page updates.",
    blocked: true,
    pagesFixed: 0,
    trackerTouched: true,
    blindSpots: 1,
    lines: [
      bad("[ctxfolio] Before ending the session:"),
      bad("- Context pages not updated for changed code: context/codebase/modules/auth.md,"),
      bad("  context/api-contracts.md. Update them (or confirm nothing they describe changed)"),
      bad("  then run `node context/ctx.mjs stamp <page>`."),
      bad("exit 2"),
      x(""),
      d("repeat with literal stop_hook_active: true skips the check; it is not a clean audit."),
    ],
  },
  {
    id: 4,
    chip: "run impact",
    prompt: "node context/ctx.mjs impact",
    caption: "Impact identifies covering pages to review, not proof their claims are invalid.",
    blocked: true,
    pagesFixed: 0,
    trackerTouched: true,
    blindSpots: 1,
    lines: [
      x("changed code (working tree):"),
      d("  M src/auth/session.ts"),
      d("  A src/auth/rotate.ts"),
      d("  M src/api/routes/sessions.ts"),
      x(""),
      x("pages that must be updated:"),
      bad("  x context/codebase/modules/auth.md     covers src/auth/session.ts"),
      bad("  x context/api-contracts.md             covers src/api/**"),
      x("uncovered files (BLIND SPOT):"),
      sig("  ! src/auth/rotate.ts                   add to a covers: glob or ctx new module"),
      d("tracker/memory touched: yes"),
    ],
  },
  {
    id: 5,
    chip: "fix and stamp",
    prompt: "node context/ctx.mjs stamp context/codebase/modules/auth.md context/api-contracts.md",
    caption: "The pages are corrected in the same diff, then stamped against HEAD.",
    blocked: false,
    pagesFixed: 2,
    trackerTouched: true,
    blindSpots: 0,
    lines: [
      d("edited context/codebase/modules/auth.md"),
      d("  TL;DR now states: the refresh token rotates on every use. Rotation window 15 min."),
      d("  covers: src/auth/**   (expanded from src/auth/session.ts)"),
      d("edited context/api-contracts.md"),
      d("  POST /auth/refresh returns 200 and a new refresh cookie. The old one is void."),
      x(""),
      ok("stamped 2 page(s): updated 2026-10-07, verified_at 8ae5d7d"),
      x(""),
      x("node context/ctx.mjs task done 07 -m \"rotate refresh tokens; 15 min window; test in session.test.ts\""),
      ok("tracker: Feature 07 -> Completed"),
      d("a vague -m is refused. write versions, paths and env names."),
    ],
  },
  {
    id: 6,
    chip: "stop again",
    prompt: "exit",
    caption: "The illustrative bookkeeping check passes. Correctness still needs explicit review.",
    blocked: false,
    pagesFixed: 2,
    trackerTouched: true,
    blindSpots: 0,
    lines: [
      ok("hook stop: pass"),
      d("illustrative check: covering pages and recording files were touched."),
      d("tracker touched; memory.md records the next step."),
      x(""),
      d("memory.md: Feature 07 complete. Next step: Feature 10 step 1, write the spec."),
      d("context/log.md: ## [2026-10-07] build | Feature 07 refresh token rotation"),
      x(""),
      ok("a cold agent, another teammate, or a different tool can continue from these files."),
    ],
  },
];

/* --------------------------------------------------------------------------
   WIKI GRAPH. Page nodes, code nodes, rule nodes, and the edges between them.
--------------------------------------------------------------------------- */

export type NodeKind = "schema" | "page" | "spec" | "rule" | "code";

export type GraphNode = {
  id: string;
  label: string;
  kind: NodeKind;
  /** frontmatter, verbatim style */
  meta?: string[];
  tldr?: string;
  tokens?: string;
};

export type GraphEdge = { from: string; to: string; kind: "covers" | "links" | "gates" };

export const GRAPH_NODES: GraphNode[] = [
  { id: "agents", label: "AGENTS.md", kind: "schema", meta: ["type: schema", "118 / 120 lines"], tldr: "Read first. Routes to the index. Carries the Lessons section.", tokens: "~1.1k" },
  { id: "index", label: "context/index.md", kind: "schema", meta: ["type: router", "generated by ctx index"], tldr: "Task-routing table plus a catalog of every page.", tokens: "~1.1k" },
  { id: "memory", label: "memory.md", kind: "schema", meta: ["type: session", "read at start"], tldr: "State, exact next step, working set, open questions, context debt.", tokens: "~340" },
  { id: "overview", label: "context/overview.md", kind: "page", meta: ["status: active", "confidence: verified"], tldr: "What the project does, who uses it, the core flows." },
  { id: "arch", label: "context/architecture.md", kind: "page", meta: ["status: active", "covers: src/**"], tldr: "Monolith first. Relational DB. Queue slow work off the user path." },
  { id: "map", label: "context/codebase/map.md", kind: "page", meta: ["status: draft", "confidence: inferred"], tldr: "Directory census and entry points. Structure only, no meaning yet." },
  { id: "auth", label: "modules/auth.md", kind: "page", meta: ["covers: src/auth/**", "confidence: verified"], tldr: "Session tokens are httpOnly cookies. The refresh token rotates on use." },
  { id: "sessions", label: "modules/sessions.md", kind: "page", meta: ["covers: src/api/routes/sessions.ts"], tldr: "Lists active sessions. Revoking one voids its refresh token." },
  { id: "api", label: "context/api-contracts.md", kind: "page", meta: ["covers: src/api/**"], tldr: "POST /auth/login returns 200 and two cookies. 429 after 5 attempts." },
  { id: "data", label: "context/data-model.md", kind: "page", meta: ["covers: prisma/**"], tldr: "users, sessions, refresh_tokens. Cascade delete on user." },
  { id: "decisions", label: "context/decisions.md", kind: "page", meta: ["D-01 .. D-14"], tldr: "D-04 chose rotating refresh tokens. Cost: one extra write per request." },
  { id: "tracker", label: "progress-tracker.md", kind: "page", meta: ["In progress max 1"], tldr: "The ledger. Moved by ctx task, never by hand." },
  { id: "spec07", label: "feature-specs/07-*.md", kind: "spec", meta: ["status: in-progress"], tldr: "Rotate the refresh token on every use. Window 15 minutes." },
  { id: "log", label: "context/log.md", kind: "page", meta: ["append only"], tldr: "grep \"^## \\[\" context/log.md answers what happened recently." },
  { id: "ruleFront", label: ".claude/rules/frontend.md", kind: "rule", meta: ["paths: src/components/**, **/*.tsx"], tldr: "Loads only when the agent touches a matching path." },
  { id: "ruleTest", label: ".claude/rules/testing.md", kind: "rule", meta: ["paths: **/*.test.*"], tldr: "Logic ships its failing test first." },

  { id: "c_session", label: "src/auth/session.ts", kind: "code" },
  { id: "c_rotate", label: "src/auth/rotate.ts", kind: "code" },
  { id: "c_login", label: "src/auth/login.ts", kind: "code" },
  { id: "c_routes", label: "src/api/routes/sessions.ts", kind: "code" },
  { id: "c_ui", label: "src/components/SessionList.tsx", kind: "code" },
  { id: "c_prisma", label: "prisma/schema.prisma", kind: "code" },
  { id: "c_test", label: "src/auth/session.test.ts", kind: "code" },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { from: "agents", to: "index", kind: "links" },
  { from: "agents", to: "memory", kind: "links" },
  { from: "index", to: "overview", kind: "links" },
  { from: "index", to: "arch", kind: "links" },
  { from: "index", to: "map", kind: "links" },
  { from: "index", to: "tracker", kind: "links" },
  { from: "index", to: "decisions", kind: "links" },
  { from: "index", to: "log", kind: "links" },
  { from: "map", to: "auth", kind: "links" },
  { from: "map", to: "sessions", kind: "links" },
  { from: "auth", to: "api", kind: "links" },
  { from: "auth", to: "decisions", kind: "links" },
  { from: "spec07", to: "auth", kind: "links" },
  { from: "spec07", to: "tracker", kind: "links" },
  { from: "data", to: "api", kind: "links" },

  { from: "auth", to: "c_session", kind: "covers" },
  { from: "auth", to: "c_rotate", kind: "covers" },
  { from: "auth", to: "c_login", kind: "covers" },
  { from: "api", to: "c_routes", kind: "covers" },
  { from: "sessions", to: "c_routes", kind: "covers" },
  { from: "data", to: "c_prisma", kind: "covers" },
  { from: "arch", to: "c_session", kind: "covers" },

  { from: "ruleFront", to: "c_ui", kind: "gates" },
  { from: "ruleTest", to: "c_test", kind: "gates" },
];

/* Which pages a commit to these files invalidates. Drives the stale animation. */
export const COMMIT_TARGETS = ["c_session", "c_rotate", "c_routes"];

/* --------------------------------------------------------------------------
   LEDGER. Teams island.
--------------------------------------------------------------------------- */

export type LedgerRow = {
  id: string;
  title: string;
  owner?: string;
  note?: string;
  date?: string;
};

export const LEDGER_INITIAL: Record<string, LedgerRow[]> = {
  now: [{ id: "07", title: "refresh token rotation", owner: "@ana", note: "branch feat/07" }],
  blocked: [{ id: "09", title: "stripe webhook replay", owner: "@ravi", note: "waiting on vendor sandbox key" }],
  next: [
    { id: "10", title: "session list pagination" },
    { id: "11", title: "audit log export" },
  ],
  done: [
    { id: "06", title: "login rate limit", date: "2026-09-28" },
    { id: "05", title: "password reset flow", date: "2026-09-21" },
  ],
};

export const LEDGER_COLLISION: Record<string, LedgerRow[]> = {
  now: [
    { id: "07", title: "refresh token rotation", owner: "@ana", note: "branch feat/07" },
    { id: "07", title: "refresh token expiry fix", owner: "@mei", note: "branch feat/07b" },
  ],
  blocked: [{ id: "09", title: "stripe webhook replay", owner: "@ravi", note: "waiting on vendor sandbox key" }],
  next: [
    { id: "10", title: "session list pagination" },
    { id: "11", title: "audit log export" },
  ],
  done: [
    { id: "06", title: "login rate limit", date: "2026-09-28" },
    { id: "05", title: "password reset flow", date: "2026-09-21" },
  ],
};

export const LINT_COLLISION: Line[] = [
  x("lint: 2 errors, 1 warning"),
  x(""),
  bad("ERROR  progress-tracker.md: Feature 07 listed twice in \"In progress\" (branch-merge collision)"),
  bad("ERROR  decisions.md: duplicate decision id D-07"),
  d("       feat/07 wrote D-07 \"rotate on use\". feat/07b wrote D-07 \"shorten expiry\"."),
  d("       renumber the later merge to D-15, then update: feature-specs/07b-*.md"),
  sig("WARN   feature-specs: two specs share number 07 (07-refresh-rotation.md, 07-expiry-fix.md)"),
  x(""),
  d("resolution is mechanical, not social:"),
  d("  1. git checkout --theirs is wrong here. keep both facts."),
  d("  2. ctx task add \"expiry fix\" --spec 12   (a taken number is refused)"),
  d("  3. renumber the decision, update its references, rerun ctx index"),
  d("  4. node context/ctx.mjs lint   ->  0 errors"),
  bad("exit 1 until then. CI runs lint. the PR is not done."),
];

/* --------------------------------------------------------------------------
   COST. Existing illustrative assumptions following references/llm-wiki-pattern.md.
   Not empirical bounds, measured usage, or an answer-quality benchmark.
   Cumulative totals multiply these inputs by sessions; maintenance/output costs
   are not included. No measured quality-degradation threshold is established.
--------------------------------------------------------------------------- */

export const COST = {
  coldMin: 20_000,
  coldMax: 100_000,
  warmMin: 2_000,
  warmMax: 8_000,
  sessions: 40,
};
