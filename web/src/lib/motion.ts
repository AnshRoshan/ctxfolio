import { useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------- reduced motion */

export function queryReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(queryReducedMotion);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------- in-view flag */

/** True while the element is on screen. Used to pause rAF loops off-screen. */
export function useOnScreen<T extends Element>(rootMargin = "120px") {
  const ref = useRef<T | null>(null);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setOnScreen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((e) => e.isIntersecting)),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, onScreen };
}

/* ------------------------------------------------------- scroll reveal bus */

export function startRevealObserver(): () => void {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
  if (!nodes.length) return () => {};

  if (queryReducedMotion() || typeof IntersectionObserver === "undefined") {
    nodes.forEach((n) => n.classList.add("is-in"));
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
  );
  nodes.forEach((n) => io.observe(n));

  // failsafe: nothing may stay hidden because an observer never fired
  const failsafe = window.setTimeout(() => {
    nodes.forEach((n) => n.classList.add("is-in"));
  }, 3000);

  return () => {
    window.clearTimeout(failsafe);
    io.disconnect();
  };
}

/* ---------------------------------------------------------------- scrollspy */

/**
 * Marks the nav link for the section in view. The page is a router, so the
 * header tells you which page of it you are on.
 */
export function startScrollSpy(): () => void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-spy]"));
  if (!links.length || typeof IntersectionObserver === "undefined") return () => {};

  const byId = new Map<string, HTMLAnchorElement[]>();
  for (const a of links) {
    const id = a.getAttribute("href")?.replace("#", "") ?? "";
    if (!id) continue;
    byId.set(id, [...(byId.get(id) ?? []), a]);
  }

  const sections = [...byId.keys()]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => !!el);

  let activeId = "";
  const setActive = (id: string) => {
    if (id === activeId) return;
    activeId = id;
    for (const [key, anchors] of byId) {
      for (const a of anchors) {
        a.classList.toggle("is-active", key === id);
        if (key === id) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      }
    }
    const label = document.getElementById("spy-label");
    if (label) {
      const anchor = byId.get(id)?.[0];
      label.textContent = anchor ? anchor.dataset.spy || anchor.textContent || "" : "";
    }
  };

  const visible = new Map<string, number>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.set(e.target.id, e.intersectionRatio);
        else visible.delete(e.target.id);
      }
      let best = "";
      let bestTop = Infinity;
      for (const id of visible.keys()) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = Math.abs(el.getBoundingClientRect().top);
        if (top < bestTop) {
          bestTop = top;
          best = id;
        }
      }
      if (best) setActive(best);
    },
    { rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.2, 0.6] },
  );

  sections.forEach((s) => io.observe(s));
  return () => io.disconnect();
}

/* -------------------------------------------------- live facts, free tier */

/**
 * Reads two facts from the shields.io JSON endpoint. No API key, no backend.
 * On any failure the static values already in the document stay in place.
 */
export function startLiveFacts(): void {
  const release = document.getElementById("release-chip");
  const ci = document.getElementById("ci-chip");
  const base = "https://img.shields.io/github";
  const repo = "AnshRoshan/ctxfolio";

  if (release) {
    fetch(`${base}/v/release/${repo}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j.value === "string" && j.value.trim()) release.textContent = j.value.trim();
      })
      .catch(() => {});
  }

  if (ci) {
    fetch(`${base}/actions/workflow/ci.yml/${repo}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j.value === "string" && j.value.trim()) {
          ci.textContent = `ci ${j.value.trim()}`;
        }
      })
      .catch(() => {});
  }
}
