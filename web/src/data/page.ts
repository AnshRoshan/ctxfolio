/* Synthetic wiki example, not this repository, captured CLI output or measured
   token usage. Page structure follows references/page-format.md and SKILL.md;
   authentication behavior, counts, dates and change phases are illustrative.
   Confidence and stamps are declared metadata, not proof of review or truth. */

export type FmField = { key: string; value: string; hot?: boolean };

export type PagePhase = {
  id: number;
  chip: string;
  command?: string;
  /** front matter deltas applied in this phase */
  fm: Record<string, string>;
  /** index of the TL;DR line to surface, or -1 */
  tldr: number;
  /** extra terminal lines revealed in this phase */
  out: string[];
  state: "verified" | "stale" | "fixed";
  note: string;
};

export const PAGE = {
  path: "context/codebase/modules/auth.md",
  fm: [
    { key: "title", value: "Authentication" },
    { key: "type", value: "module" },
    { key: "status", value: "active" },
    { key: "covers", value: "src/auth/**" },
    { key: "confidence", value: "verified" },
    { key: "updated", value: "2026-10-02" },
  ] as FmField[],
  tldr: [
    "Session tokens are httpOnly cookies with a 15 minute lifetime.",
    "The refresh token rotates on every use. The old one is void at once.",
    "Never log a token payload. Lint catches token-shaped strings.",
  ],
  body: [
    { h: "Contract", p: "POST /auth/login returns 200 and two cookies. It returns 429 after 5 attempts in 60 seconds." },
    { h: "Invariant", p: "A revoked session voids its refresh token in the same request. There is no grace window." },
    { h: "Gotcha", p: "The cookie domain is the apex host. A subdomain cannot read it, and that is deliberate." },
  ],
  linked: [
    "context/decisions.md D-04",
    "context/api-contracts.md",
    ".claude/rules/testing.md",
  ],
};

export const PHASES: PagePhase[] = [
  {
    id: 1,
    chip: "read",
    tldr: 0,
    fm: {},
    state: "verified",
    note: "An illustrative session reads the synthetic page first. No measured reading cost is claimed.",
    out: [],
  },
  {
    id: 2,
    chip: "commit",
    command: "git commit -m \"rotate the refresh token on use\"",
    tldr: 0,
    fm: {},
    state: "verified",
    note: "The illustrative code changes. The page has not yet been reviewed against the rotation change.",
    out: [" M src/auth/session.ts", " A src/auth/rotate.ts"],
  },
  {
    id: 3,
    chip: "stale",
    command: "node context/ctx.mjs stale",
    tldr: 0,
    fm: { updated: "2026-10-02 (stale)" },
    state: "stale",
    note: "The model shows a git freshness signal for covered code, not proof the page is wrong.",
    out: [
      "context/codebase/modules/auth.md",
      "  2 files: src/auth/session.ts, src/auth/rotate.ts",
      "  page last touched 4c1f0a2, code moved past it",
    ],
  },
  {
    id: 4,
    chip: "impact",
    command: "node context/ctx.mjs impact",
    tldr: 1,
    fm: { updated: "2026-10-06" },
    state: "fixed",
    note: "The covering page is edited in the same change. The TL;DR gains the invariant the code now has.",
    out: [
      "pages that must be updated:",
      "  x context/codebase/modules/auth.md   covers src/auth/**",
      "src/auth/rotate.ts is covered by src/auth/**; review the page against the change.",
    ],
  },
  {
    id: 5,
    chip: "stamp",
    command: "node context/ctx.mjs stamp context/codebase/modules/auth.md",
    tldr: 1,
    fm: { confidence: "verified", updated: "2026-10-06" },
    state: "verified",
    note: "Stamp metadata records HEAD after illustrative review. A stamp alone does not prove correctness.",
    out: ["stamped 1 page(s): updated 2026-10-06, verified_at 8ae5d7d"],
  },
];
