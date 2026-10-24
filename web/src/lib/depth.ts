export function startDepthScenes(): () => void {
  const media = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
  if (!media.matches) return () => {};

  const cleanups = Array.from(document.querySelectorAll<HTMLElement>("[data-depth]"), (element) => {
    const intensity = Number(element.dataset.depth || 2);
    const move = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      element.style.setProperty("--depth-rx", `${(-y * intensity).toFixed(2)}deg`);
      element.style.setProperty("--depth-ry", `${(x * intensity).toFixed(2)}deg`);
      element.classList.add("is-depth-active");
    };
    const leave = () => {
      element.style.setProperty("--depth-rx", "0deg");
      element.style.setProperty("--depth-ry", "0deg");
      element.classList.remove("is-depth-active");
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", leave);
    return () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", leave);
    };
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}
