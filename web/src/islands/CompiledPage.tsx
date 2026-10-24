import { useCallback, useEffect, useState } from "react";
import { PAGE, PHASES } from "../data/page";
import { useOnScreen, useReducedMotion } from "../lib/motion";

/**
 * The signature moment. The product's own artifact, rendered as a document,
 * with illustrative review machinery acting on it in one authored sequence.
 * There is no other animation on the page.
 */
export default function CompiledPage() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reduced = useReducedMotion();
  const { ref, onScreen } = useOnScreen<HTMLElement>();
  const phase = PHASES[Math.min(step, PHASES.length - 1)];
  const advance = useCallback(() => setStep(s => s >= PHASES.length - 1 ? 0 : s + 1), []);

  useEffect(() => {
    if (reduced) { setStep(PHASES.length - 1); setPlaying(false); }
  }, [reduced]);

  useEffect(() => {
    if (reduced || !playing || !onScreen) return;
    const timer = window.setInterval(advance, 2600);
    return () => window.clearInterval(timer);
  }, [advance, playing, onScreen, reduced]);
  const hold = () => setPlaying(false);
  const resume = () => { if (!reduced) setPlaying(true); };

  const hot = phase.state === "stale";

  return (
    <figure ref={ref} className="console compiled-document overflow-hidden" aria-label="Synthetic wiki example moving through an illustrative change, not current CLI output">
      {/* running head */}
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-con-line px-4 py-2.5">
        <span className="running text-con-fg-2">synthetic wiki demo: {PAGE.path}</span>
        <span
          className="ml-auto rounded-[3px] px-2 py-0.5 font-mono text-[10.5px] font-medium"
          role="status" aria-live={playing ? "off" : "polite"}
          style={{
            color: hot ? "var(--c-con)" : "var(--c-con-accent)",
            backgroundColor: hot ? "var(--c-con-accent)" : "transparent",
            border: `1px solid ${hot ? "var(--c-con-accent)" : "var(--c-con-line)"}`,
          }}
        >
          {phase.state}
        </span>
      </figcaption>

      {/* the artifact, laid out as a document */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* front matter */}
        <div className="border-b border-con-line px-5 py-4 lg:col-span-5 lg:border-b-0 lg:border-r">
          <pre
            className="whitespace-pre font-mono text-[11.5px] leading-[1.85]"
            aria-hidden="true"
          >
            <span className="text-con-fg-2">{"---\n"}</span>
            {PAGE.fm.map((f) => {
              const overridden = phase.fm[f.key];
              const value = overridden ?? f.value;
              const isHot = !!overridden && hot;
              return (
                <span key={f.key} className="block">
                  <span className="text-con-fg-2">{f.key}: </span>
                  <span
                    style={{
                      color: isHot
                        ? "var(--c-con-accent)"
                        : f.key === "covers" || f.key === "confidence"
                          ? "var(--c-con-accent)"
                          : "var(--c-con-fg)",
                      fontWeight: isHot ? 600 : 400,
                    }}
                  >
                    {value}
                  </span>
                </span>
              );
            })}
            <span className="text-con-fg-2">{"---"}</span>
          </pre>

          <p className="mt-4 border-t border-con-line pt-3 font-mono text-[10.5px] leading-relaxed text-con-fg-2">
            Front matter is not decoration. It is the routing contract.
            <span className="text-con-fg"> covers:</span> ties this page to code.
            <span className="text-con-fg"> confidence:</span> is declared metadata. Review needs source and reviewer evidence.
          </p>
        </div>

        {/* rendered body */}
        <div className="px-5 py-4 lg:col-span-7">
          <p className="running text-con-fg-2">TL;DR</p>
          <ul className="mt-2.5 space-y-1.5">
            {PAGE.tldr.map((line, i) => {
              const on = i <= phase.tldr;
              return (
                <li
                  key={line}
                  className="flex gap-2.5 text-[13px] leading-snug transition-colors duration-300"
                  style={{ color: on ? "var(--c-con-fg)" : "var(--c-con-fg-2)" }}
                >
                  <span aria-hidden="true" style={{ color: "var(--c-con-accent)" }}>
                    {on ? "\u2212" : "\u00b7"}
                  </span>
                  <span>{line}</span>
                </li>
              );
            })}
          </ul>

          <dl className="mt-5 space-y-3 border-t border-con-line pt-4">
            {PAGE.body.map((b) => (
              <div key={b.h}>
                <dt className="running text-con-fg-2">{b.h}</dt>
                <dd className="mt-1 text-[12.5px] leading-relaxed text-con-fg">{b.p}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* the machinery */}
      <div className="phase-output border-t border-con-line bg-con-2 px-5 py-3" aria-hidden="true">
        {phase.command && (
          <p className="font-mono text-[11.5px]">
            <span style={{ color: "var(--c-con-accent)" }}>$ </span>
            <span className="text-con-fg">{phase.command}</span>
          </p>
        )}
        {phase.out.length > 0 && (
          <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-[1.7] text-con-fg-2">
            {phase.out.join("\n")}
          </pre>
        )}
      </div>

      {/* rail */}
      <div className="phase-rail flex flex-wrap items-center gap-2 border-t border-con-line px-4 py-3">
        {PHASES.map((p, i) => {
          const on = i === step;
          const past = i < step;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                hold();
                setStep(i);
              }}
              aria-current={on ? "step" : undefined}
              className="rounded-[3px] border px-2 py-1 font-mono text-[10.5px] transition-colors duration-150"
              style={{
                borderColor: on ? "var(--c-con-accent)" : "var(--c-con-line)",
                color: on
                  ? "var(--c-con)"
                  : past
                    ? "var(--c-con-fg)"
                    : "var(--c-con-fg-2)",
                backgroundColor: on ? "var(--c-con-accent)" : "transparent",
              }}
            >
              {p.chip}
            </button>
          );
        })}
        <span className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={playing ? hold : resume}
            disabled={reduced}
            aria-label={reduced ? "Playback disabled by reduced motion" : playing ? "Pause demo" : "Play demo"}
            className="rounded-[3px] border border-con-line px-2 py-1 font-mono text-[10.5px] text-con-fg-2"
          >
            {reduced ? "Reduced motion" : playing ? "Pause" : "Play"}
          </button>
        </span>
      </div>

      <p className="phase-note border-t border-con-line px-5 py-3 text-[12.5px] leading-snug text-con-fg" aria-live={playing ? "off" : "polite"}>
        {phase.note}
      </p>

      {/* unstreamed, for assistive tech */}
      <div className="sr-only">
        <p>
          A synthetic wiki example at {PAGE.path}, not this repository or measured CLI output. It carries front matter with a covers glob of
          src/auth/**, a TL;DR of {PAGE.tldr.length} lines, and sections for contract, invariant and
          gotcha.
        </p>
        <ol>
          {PHASES.map((p) => (
            <li key={p.id}>
              {p.chip}
              {p.command ? `, ${p.command}` : ""}. {p.note}
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
