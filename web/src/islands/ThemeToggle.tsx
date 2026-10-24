import { SunIcon, MoonIcon, DesktopIcon } from "@radix-ui/react-icons";
import { useTheme } from "../lib/theme";

const OPTIONS = [
  { id: "light", label: "Light theme", Icon: SunIcon },
  { id: "system", label: "Match the system theme", Icon: DesktopIcon },
  { id: "dark", label: "Dark theme", Icon: MoonIcon },
] as const;

export default function ThemeToggle() {
  const { choice, resolved, set } = useTheme();
  return (
    <div className="theme-control" role="group" aria-label="Colour theme">
      {OPTIONS.map(({ id, label, Icon }) => (
        <button key={id} type="button" onClick={() => set(id)}
          aria-pressed={choice === id} aria-label={label} title={label}
          style={{ backgroundColor: choice === id ? "var(--c-surface-2)" : "transparent", color: choice === id ? "var(--c-accent)" : "var(--c-fg-3)" }}>
          <Icon aria-hidden="true" />
        </button>
      ))}
      <span className="sr-only" role="status">
        {choice === "system" ? `System theme, currently ${resolved}` : `${choice} theme`}
      </span>
    </div>
  );
}
