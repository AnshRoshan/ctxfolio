import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { HOOK_STEPS, type Line } from "../data/transcripts";
import { queryReducedMotion } from "../lib/motion";

type Flat = (Line & { prompt?: string; stepId: number })[];

const TONE: Record<string, string> = {
  dim: "text-con-fg-2",
  text: "text-con-fg",
  good: "text-con-fg",
  bad: "text-con-accent font-medium",
  signal: "text-con-fg",
  cmd: "text-con-fg",
};

function flatten(upto: number): Flat {
  const out: Flat = [];
  for (const s of HOOK_STEPS) {
    if (s.id > upto) break;
    out.push({ t: `$ ${s.prompt}`, tone: "cmd", prompt: s.prompt, stepId: s.id });
    for (const l of s.lines) out.push({ ...l, stepId: s.id });
    out.push({ t: "", stepId: s.id });
  }
  return out;
}

export default function StopHook() {
  const [step, setStep] = useState(0);
  const [shown, setShown] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const all = useMemo(() => flatten(HOOK_STEPS.length), []);
  const target = useMemo(() => flatten(step), [step]);

  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (queryReducedMotion()) {
      setShown(target.length);
      return;
    }
    setShown((s) => Math.min(s, target.length));
    timerRef.current = window.setInterval(() => {
      setShown((s) => {
        if (s >= target.length) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          return s;
        }
        return s + 1;
      });
    }, 38);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [target]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: queryReducedMotion() ? "auto" : "smooth" });
  }, [shown]);

  const current = HOOK_STEPS.find((s) => s.id === step) ?? null;
  const blocked = current?.blocked ?? false;
  const pagesFixed = current?.pagesFixed ?? 0;
  const tracker = current?.trackerTouched ?? false;
  const blind = current?.blindSpots ?? 0;

  const goTo = useCallback((id: number) => {
    setStep(id);
    if (queryReducedMotion()) setShown(flatten(id).length);
  }, []);

  const runAll = useCallback(() => {
    setStep(HOOK_STEPS.length);
    if (queryReducedMotion()) setShown(all.length);
  }, [all.length]);

  const reset = useCallback(() => {
    setStep(0);
    setShown(0);
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = Number(e.key);
    if (n >= 1 && n <= HOOK_STEPS.length) {
      e.preventDefault();
      goTo(n);
      return;
    }
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      goTo(Math.min(HOOK_STEPS.length, step + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      goTo(Math.max(0, step - 1));
    } else if (e.key.toLowerCase() === "r") {
      e.preventDefault();
      reset();
    }
  };

  const lines = target.slice(0, shown);
  const warn = (on: boolean) => ({ color: on ? "var(--c-con-accent)" : "var(--c-con-fg)" });

  return (
    <div
      className="console overflow-hidden"
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="group"
      aria-label="Illustrative legacy v2.4.x Stop hook transcript, not current CLI output. Press 1 to 6 to jump to a step."
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-con-line px-4 py-2.5">
        <span className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${blocked ? "anim-led" : ""}`}
            style={{
              backgroundColor: blocked
                ? "var(--c-con-accent)"
                : step === 0
                  ? "var(--c-con-fg-2)"
                  : "var(--c-con-fg)",
            }}
            aria-hidden="true"
          />
          <span className="font-mono text-[11px] text-con-fg">legacy v2.4.x demo</span>
          <span className="font-mono text-[11px] text-con-fg-2">ctx</span>
        </span>

        <span
          className="ml-auto rounded-[3px] px-2 py-1 font-mono text-[10.5px] font-semibold tracking-wide"
          style={{
            color: blocked ? "var(--c-con)" : "var(--c-con-fg)",
            backgroundColor: blocked ? "var(--c-con-accent)" : "transparent",
            border: `1px solid ${blocked ? "var(--c-con-accent)" : "var(--c-con-line)"}`,
          }}
          role="status"
        >
          {step === 0 ? "DEMO IDLE" : blocked ? "DEMO BLOCK \u00b7 EXIT 2" : "DEMO PASS"}
        </span>
      </div>

      <dl className="grid grid-cols-2 border-b border-con-line sm:grid-cols-4">
        <div className="border-r border-con-line px-3 py-2.5">
          <dt className="label text-con-fg-2">pages updated</dt>
          <dd className="mt-1 font-mono text-[13px] font-semibold" style={warn(pagesFixed < 2 && step > 1)}>
            {pagesFixed} / 2
          </dd>
        </div>
        <div className="border-con-line px-3 py-2.5 sm:border-r">
          <dt className="label text-con-fg-2">tracker touched</dt>
          <dd className="mt-1 font-mono text-[13px] font-semibold" style={warn(!tracker && step > 1)}>
            {tracker ? "yes" : "no"}
          </dd>
        </div>
        <div className="border-r border-t border-con-line px-3 py-2.5 sm:border-t-0">
          <dt className="label text-con-fg-2">blind spots</dt>
          <dd className="mt-1 font-mono text-[13px] font-semibold" style={warn(blind > 0)}>
            {blind}
          </dd>
        </div>
        <div className="border-t border-con-line px-3 py-2.5 sm:border-t-0">
          <dt className="label text-con-fg-2">example exit</dt>
          <dd className="mt-1 font-mono text-[13px] font-semibold" style={warn(blocked)}>
            {blocked ? "2" : "0"}
          </dd>
        </div>
      </dl>

      <div
        ref={scrollRef}
        className="term-scroll h-[320px] overflow-y-auto px-4 py-4 sm:h-[400px]"
        aria-hidden="true"
      >
        {step === 0 ? (
          <p className="font-mono text-[12px] leading-relaxed text-con-fg-2">
            Pick a step from the rail below, or press Run all.
            <br />
            <br />
            Synthetic scenario: one unit, one code change, an initial attempt to stop.
            <br />
            <span className="text-con-fg">
              Watch an illustrative bookkeeping check flag missing page updates, not semantic truth.
            </span>
            <span
              className="anim-blink ml-1 inline-block h-[13px] w-[7px] translate-y-[2px]"
              style={{ backgroundColor: "var(--c-con-accent)" }}
            />
          </p>
        ) : (
          <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-[1.75]">
            {lines.map((l, i) => (
              <span key={i} className={`block ${TONE[l.tone ?? "text"] ?? "text-con-fg"}`}>
                {l.prompt ? (
                  <>
                    <span className="text-con-accent">$ </span>
                    <span className="text-con-fg">{l.prompt}</span>
                  </>
                ) : (
                  l.t || "\u00a0"
                )}
              </span>
            ))}
            {shown >= target.length && (
              <span
                className="anim-blink mt-1 inline-block h-[13px] w-[7px]"
                style={{ backgroundColor: "var(--c-con-accent)" }}
              />
            )}
          </pre>
        )}
      </div>

      {/* full transcript up to the current step, unstreamed, for assistive tech */}
      <div className="sr-only">
        <p>
          Illustrative legacy v2.4.x example, not current CLI output.
          Step {step} of {HOOK_STEPS.length}. Example hook state:{" "}
          {step === 0 ? "idle" : blocked ? "blocked, exit code 2" : "pass, exit code 0"}.
          {current ? ` ${current.caption}` : ""}
        </p>
        <pre>{target.map((l) => (l.prompt ? `$ ${l.prompt}` : l.t)).join("\n")}</pre>
      </div>

      <div className="border-t border-con-line px-4 py-3">
        <p className="min-h-[38px] text-[13px] leading-snug text-con-fg" aria-live="polite">
          {current ? (
            <>
              <span className="font-mono text-[11px] text-con-accent">
                step {current.id} / {HOOK_STEPS.length}
              </span>{" "}
              {current.caption}
            </>
          ) : (
            <span className="font-mono text-[11px] text-con-fg-2">
              illustrative legacy demo. six steps; not an enforcement guarantee.
            </span>
          )}
        </p>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 border-t border-con-line px-4 py-3"
        style={{ backgroundColor: "var(--c-con-2)" }}
      >
        {HOOK_STEPS.map((s) => {
          const on = step === s.id;
          const done = step > s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(s.id)}
              aria-current={on ? "step" : undefined}
              className="rounded-[3px] border px-2.5 py-1.5 font-mono text-[10.5px] transition-colors duration-150"
              style={{
                borderColor: on ? "var(--c-con-accent)" : "var(--c-con-line)",
                color: on ? "var(--c-con)" : done ? "var(--c-con-fg)" : "var(--c-con-fg-2)",
                backgroundColor: on ? "var(--c-con-accent)" : "transparent",
              }}
            >
              <span aria-hidden="true">{s.id}. </span>
              {s.chip}
            </button>
          );
        })}

        <span className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={runAll}
            className="rounded-[3px] border border-con-line px-2.5 py-1.5 font-mono text-[10.5px] text-con-fg transition-colors duration-150"
          >
            Run all
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-[3px] border border-con-line px-2.5 py-1.5 font-mono text-[10.5px] text-con-fg-2 transition-colors duration-150"
          >
            Reset
          </button>
        </span>
      </div>
    </div>
  );
}
