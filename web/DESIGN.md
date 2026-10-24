---
name: Ctxfolio context atelier
description: Editorial publication outside, dimensional technical instruments inside.
colors:
  primary: "#b93a25"
  light-bg: "#f3f1ea"
  light-surface: "#faf9f5"
  light-surface-2: "#e9e6dc"
  light-fg: "#20211e"
  light-fg-2: "#494a44"
  light-muted: "#696960"
  light-line: "#d5d1c5"
  light-line-strong: "#9b978b"
  dark-bg: "#171815"
  dark-surface: "#1e1f1b"
  dark-surface-2: "#282923"
  dark-fg: "#f0eee5"
  dark-fg-2: "#c7c4b8"
  dark-muted: "#aaa99f"
  dark-line: "#3a3b33"
  dark-line-strong: "#77786b"
  dark-accent: "#ff9a7f"
  dark-on-accent: "#25130e"
  console-bg: "#1b1c19"
  console-surface: "#242520"
  console-line: "#44453c"
  console-fg: "#f2f0e8"
  console-muted: "#b5b3a8"
  console-accent: "#ff9a7f"
  dark-console-bg: "#11120f"
  dark-console-surface: "#1b1c17"
  dark-console-line: "#3d3e35"
typography:
  display: {fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600}
  body: {fontFamily: '"Geist Variable", sans-serif', fontSize: "1rem", lineHeight: 1.65}
  mono: {fontFamily: '"Geist Mono Variable", ui-monospace, monospace', fontSize: "0.84em"}
rounded: {button: "3px", input: "3px", console: "4px", compact-control: "2px", pill: "9999px"}
spacing: {page-mobile: "18px", page-desktop: "32px", section-mobile: "64px", section-tablet: "80px", section-desktop: "104px"}
---
# Design System: Ctxfolio

## Overview

**Creative North Star: "The context atelier".** A warm editorial publication holds precise, dimensional technical instruments. Cormorant Garamond, carbon ink and vermilion replace generic cobalt SaaS styling. Real interactive product artifacts supply the visuals. Reference anchors are Working Volumes, Japanese kinetic typography and transitions.dev's 3D tilt, translated into the product rather than copied.

The visitor mode is Persuade for the hero and demos, Read for technical passages. Dials: variance 7, motion 4, density 5. Product truth, content, fragment IDs and no-JavaScript fallbacks are preserved. The design contract is [CONTRACT.md](<design-system/CONTRACT.md>).

## Color and material

Warm paper, off-white surfaces and muted olive-gray rules form one temperature. Vermilion is the only chromatic accent in both themes. Carbon is reserved for actual instruments and the footer, not arbitrary inverted sections. Borders carry most hierarchy. Hard, tinted offset shadows and restrained perspective create depth without glow, gradients or a heavy graphics runtime.

Primary foreground, muted text, accent and on-accent pairs pass WCAG AA in light, dark and console contexts. Verified ratios include light foreground 14.32:1, light muted 4.90:1, light accent 5.03:1, light CTA 5.59:1, dark accent 8.64:1 and console accent 8.30:1.

## Typography

Cormorant Garamond 600 normal and italic is the publication voice. Its editorial use is deliberate: the product is a persistent markdown wiki, so documents and compilation are the brand metaphor. Geist handles prose and controls; Geist Mono handles code, data and compact labels. All three are self-hosted through Fontsource with `font-display: swap` and inlined by the single-file build.

The desktop hero holds two lines at 72px maximum. Mobile uses a larger relative scale and three lines. Section headings reach 70px with compact line heights. Body measures stay bounded, technical copy remains smaller where density is functional, and italic display text reserves descender clearance.

## Layout and depth

The asymmetric hero places the proposition beside the working compilation artifact. Later sections vary among editorial reading columns, a driven chart, three staggered dimensional layers, a numbered loop, instrument splits, wide reference tables, centered proof and installation. The page does not repeat a generic feature-card template.

Fine-pointer devices add direct CSS-variable pointer tilt to the hero and major instruments through [depth.ts](<src/lib/depth.ts>). The workbench has a restrained resting perspective; layer panels use staggered Z depth and hover lift; headings use native scroll-driven transforms. Mobile removes perspective and compacts shadows. No WebGL, scroll listener or animation dependency is used.

## Chart interaction

[CostChart.tsx](<src/islands/CostChart.tsx>) puts session control directly on the graph. A native range input covers the plot area invisibly while the visible marker carries a session badge. Dragging the graph changes the model. Arrow keys, End and other native range behavior remain available, and focus draws a visible chart outline. The separate lower slider and numeric output are removed.

## Motion and accessibility

Hero entrances establish hierarchy, demo motion explains state, pointer tilt supplies feedback, and scroll-driven headings orient section changes. Reduced motion disables decorative entrances, scroll transforms, pointer tilt and autoplay. Manual compilation phases remain usable: the reduced-motion effect is isolated so changing playback state no longer forces the final phase.

Semantic static HTML, the skip link, native buttons, labels, table captions, unstreamed assistive output and complete no-JavaScript content remain intact. Mobile navigation uses native details/summary. Wide tables and code scroll locally. Focus rings use the page or console accent.

## Verification, 2026-10-24

- Production Vite single-file build passed.
- TypeScript `--noEmit` passed.
- Repository suite: **193 passed, 0 failed, 0 skipped**.
- Product-truth guards passed.
- Browser harness passed at 320, 390, 768, 1024 and 1440 pixels with no page overflow or dead fragments.
- Light, dark, persisted theme, mobile navigation and no-JavaScript rendering passed.
- Chart keyboard operation and direct pointer dragging passed.
- Compilation phases, CLI switching, ledger collision/repair/reset, Stop keyboard state and clipboard copy passed.
- Real fine-pointer CSS 3D response passed; reduced-motion rendering was captured separately.
- Mechanical source audit passed with zero errors. Its remaining warnings are required legacy-version qualifiers and data-chart paths, not decorative version chrome or icons.
- Token contract gate passed with no drift and 5/5 AA contract pairs.
- Independent rendered review scored **4.50/5 average**, no dimension below 4, disposition **ship**.

Screenshots and machine-readable browser results live in `.impeccable/review/`. The local production preview is verification only; no remote deployment is implied.
