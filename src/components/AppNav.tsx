import { Link } from "@tanstack/react-router";
import { BarChart3, BookOpen, Library, Moon, Settings as SettingsIcon, Sun, Coffee } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { updateSettings, type Theme } from "@/lib/db";

const items = [
  { to: "/", label: "Library", icon: Library },
  { to: "/reader", label: "Reader", icon: BookOpen },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const next: Record<Theme, Theme> = { dark: "light", light: "sepia", sepia: "dark" };
const icons = { dark: Moon, light: Sun, sepia: Coffee };

export function AppNav() {
  const s = useSettings();
  const ThemeIcon = icons[s.theme];
  return (
    <header data-chrome className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link to="/" className="mr-4 flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground glow">i</span>
          Iyzi<span className="text-primary">Reader</span>
        </Link>
        <div className="flex-1 sm:hidden" />
        <nav className="hidden flex-1 items-center gap-1 sm:flex">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground" }}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <button
          onClick={() => updateSettings({ theme: next[s.theme] })}
          className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm capitalize text-muted-foreground hover:text-foreground"
          aria-label="Change theme"
        >
          <ThemeIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{s.theme}</span>
        </button>
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav data-chrome className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      <div className="grid grid-cols-4">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
