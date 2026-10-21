import { useState } from "react";
import {
  LEDGER_COLLISION,
  LEDGER_INITIAL,
  LINT_COLLISION,
  type LedgerRow,
  type Line,
} from "../data/transcripts";

type Phase = "clean" | "collision" | "resolved";

const TONE: Record<string, string> = {
  dim: "text-con-fg-2",
  text: "text-con-fg",
  good: "text-con-fg",
  bad: "text-con-accent font-medium",
  signal: "text-con-fg",
};

const RESOLVED_LINT: Line[] = [
  { t: "illustrative manual resolution, not automated lint repair:", tone: "signal" },
  { t: '  ctx task add "refresh token expiry fix" --spec 12', tone: "dim" },
  { t: "    number 07 is taken on this branch. wrote 12 instead.", tone: "dim" },
  { t: "  decisions.md: the later merge keeps D-15. references updated.", tone: "dim" },
  { t: "  feature-specs/07b-expiry-fix.md renamed to 12-expiry-fix.md", tone: "dim" },
  { t: "  node context/ctx.mjs index && node context/ctx.mjs lint", tone: "dim" },
  { t: "" },
  { t: "lint: 0 errors, 0 warnings", tone: "good" },
  { t: "index: catalog regenerated (35 pages, 42 catalog lines)", tone: "dim" },
  { t: "exit 0", tone: "good" },
];

const RESOLVED: Record<string, LedgerRow[]> = {
  now: [{ id: "07", title: "refresh token rotation", owner: "@ana", note: "branch feat/07" }],
  blocked: [
    { id: "09", title: "stripe webhook replay", owner: "@ravi", note: "waiting on vendor sandbox key" },
  ],
  next: [
    { id: "12", title: "refresh token expiry fix", owner: "@mei", note: "renumbered from 07 by ctx task add" },
    { id: "10", title: "session list pagination" },
    { id: "11", title: "audit log export" },
  ],
  done: [
    { id: "06", title: "login rate limit", date: "2026-09-28" },
    { id: "05", title: "password reset flow", date: "2026-09-21" },
  ],
};

const SECTIONS: [keyof typeof LEDGER_INITIAL, string, string][] = [
  ["now", "In progress", "max one"],
  ["blocked", "Blocked", "why, and what unblocks it"],
  ["next", "Up next", "unclaimed"],
  ["done", "Completed", "kept 90 days"],
];

export default function Ledger() {
  const [phase, setPhase] = useState<Phase>("clean");
  const data =
    phase === "collision" ? LEDGER_COLLISION : phase === "resolved" ? RESOLVED : LEDGER_INITIAL;
  const lint: Line[] = phase === "collision" ? LINT_COLLISION : phase === "resolved" ? RESOLVED_LINT : [];

  const dupIds = new Set<string>();
  if (phase === "collision") {
    const seen = new Set<string>();
    for (const r of data.now) {
      if (seen.has(r.id)) dupIds.add(r.id);
      seen.add(r.id);
    }
  }

  return (
    <div className="console overflow-hidden" role="group" aria-label="Synthetic legacy v2.4.x ledger demo, not this repository or measured lint output">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-con-line px-4 py-2.5">
        <span className="font-mono text-[11px] text-con-fg">synthetic legacy v2.4.x ledger</span>
        <span
          className="ml-auto rounded-[3px] border px-2 py-0.5 font-mono text-[10.5px]"
          style={{
            borderColor: phase === "collision" ? "var(--c-con-accent)" : "var(--c-con-line)",
            color: phase === "collision" ? "var(--c-con-accent)" : "var(--c-con-fg)",
          }}
          role="status"
        >
          {phase === "collision" ? "demo merge: 2 errors" : "demo: lint clean"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2">
        {SECTIONS.map(([key, title, hint], i) => (
          <div
            key={key}
            className={`border-b border-con-line px-4 py-4 ${i % 2 === 0 ? "sm:border-r" : ""}`}
          >
            <p className="label flex items-baseline gap-2 text-con-fg-2">
              <span style={{ color: key === "now" ? "var(--c-con-accent)" : undefined }}>{title}</span>
              <span className="normal-case tracking-normal">{hint}</span>
            </p>
            <ul className="mt-3 space-y-2">
              {data[key].map((r, idx) => {
                const dup = dupIds.has(r.id);
                return (
                  <li
                    key={`${r.id}-${idx}`}
                    className="rounded-[3px] border px-2.5 py-2 font-mono text-[11.5px] leading-snug transition-colors duration-200"
                    style={{
                      borderColor: dup ? "var(--c-con-accent)" : "var(--c-con-line)",
                      backgroundColor: dup ? "rgba(255,182,39,0.1)" : "transparent",
                    }}
                  >
                    <span style={{ color: dup ? "var(--c-con-accent)" : "var(--c-con-fg)" }}>
                      Feature {r.id}
                    </span>
                    <span className="text-con-fg"> {r.title}</span>
                    {r.owner && <span className="text-con-fg-2"> {r.owner}</span>}
                    {r.note && <span className="block text-[10.5px] text-con-fg-2">{r.note}</span>}
                    {r.date && <span className="block text-[10.5px] text-con-fg-2">{r.date}</span>}
                    {dup && (
                      <span className="mt-1 block text-[10.5px] text-con-accent">
                        listed twice in one section. branch-merge collision.
                      </span>
                    )}
                  </li>
                );
              })}
              {!data[key].length && <li className="font-mono text-[11.5px] text-con-fg-2">empty</li>}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="border-b border-con-line px-4 py-4"
        style={{ backgroundColor: "var(--c-con-2)" }}
        role="log"
        aria-live="polite"
      >
        {lint.length === 0 ? (
          <p className="font-mono text-[11.5px] leading-relaxed text-con-fg-2">
            Synthetic legacy demo. Press git merge feat/07b to simulate a duplicate unit ID.
            No Git or CLI command runs here.
            <span
              className="anim-blink ml-1 inline-block h-[12px] w-[7px] translate-y-[2px]"
              style={{ backgroundColor: "var(--c-con-accent)" }}
            />
          </p>
        ) : (
          <pre className="whitespace-pre-wrap break-words font-mono text-[11.5px] leading-[1.75]">
            {lint.map((l, i) => (
              <span key={i} className={`block ${TONE[l.tone ?? "text"] ?? "text-con-fg"}`}>
                {l.t || "\u00a0"}
              </span>
            ))}
          </pre>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setPhase("collision")}
          disabled={phase === "collision"}
          className="rounded-[3px] border border-con-line px-2.5 py-1.5 font-mono text-[10.5px] text-con-fg transition-colors duration-150 disabled:opacity-35"
        >
          git merge feat/07b
        </button>
        <button
          type="button"
          onClick={() => setPhase("resolved")}
          disabled={phase !== "collision"}
          className="rounded-[3px] border px-2.5 py-1.5 font-mono text-[10.5px] transition-colors duration-150 disabled:opacity-30"
          style={{ borderColor: "var(--c-con-accent)", color: "var(--c-con-accent)" }}
        >
          Simulate manual ID repair
        </button>
        <button
          type="button"
          onClick={() => setPhase("clean")}
          disabled={phase === "clean"}
          className="rounded-[3px] border border-con-line px-2.5 py-1.5 font-mono text-[10.5px] text-con-fg-2 transition-colors duration-150 disabled:opacity-30"
        >
          reset
        </button>
        <span className="font-mono text-[10.5px] text-con-fg-2">
          {phase === "collision"
            ? "synthetic collision; manual review and ID repair needed."
            : phase === "resolved"
              ? "manual renumbering and review simulated; no CLI command ran."
              : "illustrative fixtures, not this repo; shared edits still need review."}
        </span>
      </div>
    </div>
  );
}
