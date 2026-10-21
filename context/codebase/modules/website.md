---
title: Website
type: module
status: active
summary: The public Vite/React site in web/; configured single-file build and Pages deployment, with observed results owned by testing
tags: [website, docs, deploy]
covers: ["web/**"]
confidence: verified
updated: 2026-10-21
verified_at: b7e58d6586c2
---

# Website

## TL;DR

- The public site lives in `web/`. It is a Vite project. React renders islands only.
- `web/vite.config.ts` configures `vite-plugin-singlefile` to inline CSS/JS into `web/dist/index.html`; actual build output and deployment checks live in [testing evidence](../../testing.md#verification-evidence).
- The page must stay readable with JavaScript disabled; static copy and fallbacks live in `web/index.html`.
- Product declarations come from manifests/CLI, measured results from testing evidence. Example transcripts and token-cost inputs are illustrative fixtures/assumptions, not measured product results; label them in interactive, static and accessible output.

## Why it is built, not static

`web/index.html` is the static document; `web/src/App.tsx` mounts React islands
into its placeholders. Typed demo data lives in `web/src/data/transcripts.ts`.
When a claim changes, review both that data and the static/accessibility fallbacks;
a shared data module does not make all copy a one-file update.

`web/package.json` declares the website's dependencies separately from the
zero-dependency CLI. `web/vite.config.ts` enables `vite-plugin-singlefile` and
has no `base` setting. Inlining is configuration, not proof that every future
asset is self-contained; inspect actual build output and the deployed subpath.

## Contracts

| Contract | Rule |
|---|---|
| No JavaScript | Every word of copy is in `web/index.html`. Islands replace placeholders that already hold a readable static fallback. A blank canvas is a bug. |
| Reduced motion | `prefers-reduced-motion: reduce` stops all animation. The canvas runs no animation frame loop at all in that mode. |
| Off screen | The canvas loop is gated by `IntersectionObserver` and cancelled when the graph leaves the viewport. |
| Contrast | Every text pair passes WCAG AA in both themes. Non-text marks pass 3:1. |
| Facts | Current runtime/version/dependency declarations come from their manifests/CLI; measured test/build/deploy results link [testing evidence](../../testing.md#verification-evidence). Demo transcripts are illustrative fixtures and cost inputs are assumptions, not benchmark evidence. |
| No em dashes | The page follows ASD-STE100, the same rule `references/prompt-craft.md` sets for specs. |

## Layout

| Path | What lives here |
|---|---|
| `web/index.html` | the whole document: all copy, all tables, all static fallbacks |
| `web/src/index.css` | the token contract. Light and dark themes, console tokens, utilities |
| `web/src/lib/theme.ts` | theme choice, persistence, and canvas token reading |
| `web/src/lib/motion.ts` | reveal observer, scroll meter, scroll spy, live badge values |
| `web/src/data/transcripts.ts` | interactive example CLI transcripts, graph/ledger fixtures and token-cost assumptions |
| `web/src/islands/` | the five interactive parts plus the theme control |
| `web/src/App.tsx` | the island registry and the mount function |

## Theming

Two themes, light and dark, plus a system option. The choice is stored under
the `pcs-theme` key in `localStorage`. An inline script in the document head
sets `data-theme` before the first paint, so the page never flashes the wrong
theme.

Terminals stay dark in both themes. A terminal is dark. The console tokens are
therefore separate from the page tokens, and the dark theme sinks the console
below the page so it still reads as inset.

## Gotchas

- Canvas cannot read CSS variables. `readTokens()` in `theme.ts` resolves them,
  and the graph repaints on the `pcs:theme` event. Add any new canvas colour
  there, never as a literal in the component.
- The streamed terminals are `aria-hidden`. Each one carries an unstreamed
  `sr-only` copy of the full output. Assistive tech must not receive one line
  every 22 ms.
- `vite-plugin-singlefile` is configured to inline CSS/JS. Do not add a large
  image to the bundle. A file in `web/public/` can remain external; check its
  deployed subpath instead of assuming a self-contained artifact.

## Deploy

`.github/workflows/pages.yml` runs on a push to `main` that touches `web/**` or
the workflow itself, and on manual dispatch. It uses Node 24, installs from
`web/package-lock.json` with `npm ci` when present, runs `npm run build`, uploads
`web/dist` and deploys the Pages artifact. Its output check requires
`dist/index.html` but only warns for nonempty `dist/assets`; that check alone
is not a strict single-file guarantee. Build output is not committed.

Observed build shape and deployed-site success live in [testing evidence](../../testing.md#verification-evidence), not in workflow configuration. Source review: `web/package.json` scripts/dependencies, `web/vite.config.ts` plugins, `web/src/App.tsx` mount/registry, `web/src/data/transcripts.ts` fixtures and `.github/workflows/pages.yml` triggers/build/deploy, at `b7e58d6586c2` on 2026-10-21.
