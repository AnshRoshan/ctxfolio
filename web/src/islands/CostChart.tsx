import { useMemo, useState } from "react";
import { COST } from "../data/transcripts";
import { useTokens } from "../lib/theme";

const W = 720;
const H = 300;
const PAD = { l: 56, r: 96, t: 18, b: 34 };
const PLOT_W = W - PAD.l - PAD.r;
const PLOT_H = H - PAD.t - PAD.b;

const Y_MAX = COST.coldMax * COST.sessions; // 4.0M
const x = (n: number) => PAD.l + ((n - 1) / (COST.sessions - 1)) * PLOT_W;
const y = (tokens: number) => PAD.t + PLOT_H - (tokens / Y_MAX) * PLOT_H;

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(Math.round(n));
};

function band(perMin: number, perMax: number) {
  const up: string[] = [];
  const down: string[] = [];
  for (let n = 1; n <= COST.sessions; n++) {
    up.push(`${n === 1 ? "M" : "L"}${x(n).toFixed(1)},${y(perMax * n).toFixed(1)}`);
    down.unshift(`L${x(n).toFixed(1)},${y(perMin * n).toFixed(1)}`);
  }
  return `${up.join(" ")} ${down.join(" ")} Z`;
}

function mid(per: number) {
  const pts: string[] = [];
  for (let n = 1; n <= COST.sessions; n++) {
    pts.push(`${n === 1 ? "M" : "L"}${x(n).toFixed(1)},${y(per * n).toFixed(1)}`);
  }
  return pts.join(" ");
}

export default function CostChart() {
  const [session, setSession] = useState(12);
  const T = useTokens();

  const cold = useMemo(
    () => ({ min: COST.coldMin * session, max: COST.coldMax * session }),
    [session],
  );
  const warm = useMemo(
    () => ({ min: COST.warmMin * session, max: COST.warmMax * session }),
    [session],
  );

  const coldPath = useMemo(() => band(COST.coldMin, COST.coldMax), []);
  const warmPath = useMemo(() => band(COST.warmMin, COST.warmMax), []);

  return (
    <div className="console">
      <div className="cost-plot">
        <label htmlFor="cost-session" className="sr-only">Session number. Drag anywhere on the chart or use arrow keys.</label>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`Illustrative token-cost assumptions, not measured performance or empirical bounds. Across ${session} sessions, the model multiplies re-exploration inputs to ${fmt(cold.min)} to ${fmt(cold.max)} tokens and wiki-reading inputs to ${fmt(warm.min)} to ${fmt(warm.max)} tokens. Quality is unmeasured.`}
      >
        {[0, 1, 2, 3, 4].map((m) => {
          const v = m * 1_000_000;
          return (
            <g key={m}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={y(v)}
                y2={y(v)}
                stroke={T.line}
                strokeWidth={m === 0 ? 1.2 : 0.7}
              />
              <text x={PAD.l - 10} y={y(v) + 3.5} textAnchor="end" fontFamily="var(--font-mono)" fontSize="10" fill={T.fg2}>
                {m === 0 ? "0" : `${m}M`}
              </text>
            </g>
          );
        })}

        {[1, 10, 20, 30, 40].map((n) => (
          <text key={n} x={x(n)} y={H - PAD.b + 18} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill={T.fg2}>
            {n}
          </text>
        ))}
        <text
          x={PAD.l + PLOT_W / 2}
          y={H - 3}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="9.5"
          fill={T.fg2}
          letterSpacing="1.4"
        >
          DRAG TO CHANGE SESSION
        </text>

        <path d={coldPath} fill={T.fg2} fillOpacity={0.14} stroke={T.fg2} strokeOpacity={0.45} strokeWidth={1} />
        <path d={mid((COST.coldMin + COST.coldMax) / 2)} fill="none" stroke={T.fg2} strokeWidth={1.4} strokeDasharray="4 3" />
        <path d={warmPath} fill={T.accent} fillOpacity={0.16} stroke={T.accent} strokeOpacity={0.6} strokeWidth={1} />
        <path d={mid((COST.warmMin + COST.warmMax) / 2)} fill="none" stroke={T.accent} strokeWidth={1.6} />

        <g
          style={{
            transform: `translateX(${x(session).toFixed(1)}px)`,
            transition: "transform 160ms cubic-bezier(.2,.8,.2,1)",
          }}
        >
          <line x1={0} x2={0} y1={PAD.t + 24} y2={PAD.t + PLOT_H} stroke={T.fg} strokeWidth={1} strokeOpacity={0.55} />
          <rect x={-43} y={PAD.t - 7} width={86} height={22} rx={2} fill={T.accent} />
          <text x={0} y={PAD.t + 8} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" fontWeight="600" fill={T.con}>
            SESSION {session}
          </text>
          <circle cx={0} cy={y(cold.max)} r={4.5} fill={T.fg2} stroke={T.con} strokeWidth={2} />
          <circle cx={0} cy={y(warm.max)} r={5.5} fill={T.accent} stroke={T.con} strokeWidth={2} />
        </g>

        <text x={W - PAD.r + 10} y={y(cold.max) + 4} fontFamily="var(--font-mono)" fontSize="10.5" fill={T.fg}>
          {fmt(cold.max)}
        </text>
        <text x={W - PAD.r + 10} y={y(cold.min) + 4} fontFamily="var(--font-mono)" fontSize="10.5" fill={T.fg2}>
          {fmt(cold.min)}
        </text>
        <text
          x={W - PAD.r + 10}
          y={Math.max(y(warm.max) + 4, y(cold.min) + 20)}
          fontFamily="var(--font-mono)"
          fontSize="10.5"
          fill={T.accent}
        >
          {fmt(warm.max)}
        </text>
      </svg>
        <input
          id="cost-session"
          type="range"
          min={1}
          max={COST.sessions}
          step={1}
          value={session}
          onChange={(e) => setSession(Number(e.target.value))}
          className="cost-session-input"
        />
      </div>

      <div className="mt-5 border-t border-con-line pt-4">
        <dl className="grid grid-cols-1 sm:grid-cols-3">
          <div className="border-b border-con-line px-0 py-3 sm:border-b-0 sm:border-r sm:pr-3">
            <dt className="label text-con-fg-2">re-explores the repo</dt>
            <dd className="mt-1.5 font-mono text-[15px] font-semibold text-con-fg">
              {fmt(cold.min)} <span className="text-con-fg-2">to</span> {fmt(cold.max)}
            </dd>
            <dd className="mt-0.5 font-mono text-[10.5px] text-con-fg-2">modeled cumulative tokens</dd>
          </div>
          <div className="border-b border-con-line px-0 py-3 sm:border-b-0 sm:border-r sm:px-3">
            <dt className="label text-con-fg-2">reads the wiki</dt>
            <dd className="mt-1.5 font-mono text-[15px] font-semibold text-con-accent">
              {fmt(warm.min)} <span className="text-con-fg-2">to</span> {fmt(warm.max)}
            </dd>
            <dd className="mt-0.5 font-mono text-[10.5px] text-con-fg-2">modeled cumulative tokens</dd>
          </div>
          <div className="py-3 sm:pl-3">
            <dt className="label text-con-fg-2">difference</dt>
            <dd className="mt-1.5 font-mono text-[15px] font-semibold text-con-fg">
              {(COST.coldMin / COST.warmMin).toFixed(0)}x
              <span className="text-con-fg-2"> to </span>
              {(COST.coldMax / COST.warmMax).toFixed(1)}x
            </dd>
            <dd className="mt-0.5 font-mono text-[10.5px] text-con-fg-2">ratios of paired assumptions</dd>
          </div>
        </dl>

        <p className="mt-4 font-mono text-[11px] leading-relaxed text-con-fg-2">
          Illustrative assumptions, not measured usage or empirical bounds.
          <a href="https://github.com/AnshRoshan/ctxfolio/blob/main/web/src/data/transcripts.ts"> COST inputs</a>{" "}
          follow <a href="https://github.com/AnshRoshan/ctxfolio/blob/main/references/llm-wiki-pattern.md">the wiki pattern</a>; totals multiply inputs by sessions, excluding maintenance and output costs.
          Answer quality and any degradation threshold are unmeasured.
        </p>
      </div>
    </div>
  );
}
