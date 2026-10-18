import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { db, updateSettings } from "@/lib/db";
import { computeAchievements, todayKey } from "@/lib/achievements";
import { useSettings } from "@/hooks/use-settings";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const shortcuts: [string, string][] = [
  ["Space", "Play / pause"],
  ["← / →", "Seek 10 seconds"],
  ["↑ / ↓", "Speed ±50 WPM"],
  ["F", "Zen (fullscreen) mode"],
  ["Q", "Save current sentence as a quote"],
  ["?", "Show this cheat sheet"],
];

export function ShortcutsDialog() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "?") setOpen((o) => !o);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Keyboard shortcuts</DialogTitle></DialogHeader>
        <ul className="space-y-2">
          {shortcuts.map(([k, d]) => (
            <li key={k} className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{d}</span>
              <kbd className="rounded-md border bg-secondary px-2 py-0.5 font-mono text-sm">{k}</kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function Confetti({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {Array.from({ length: 60 }, (_, i) => (
        <span key={i} className="confetti absolute top-0 block h-2.5 w-1.5 rounded-sm"
          style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 12) * 60}ms`, background: i % 3 === 0 ? "var(--orp)" : i % 3 === 1 ? "var(--color-primary)" : "var(--color-muted-foreground)" }} />
      ))}
    </div>
  );
}

/** Celebrates newly unlocked achievements anywhere in the app. */
export function AchievementWatcher() {
  const s = useSettings();
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);
  const loaded = useLiveQuery(() => db.settings.get("app").then((x) => x ?? null), []);
  const [party, setParty] = useState(false);
  useEffect(() => {
    if (!sessions || loaded === undefined) return;
    const unlocked = computeAchievements(sessions, s.dailyGoalMin).filter((a) => a.unlocked);
    const seen = new Set(s.seenAchievements ?? []);
    const fresh = unlocked.filter((a) => !seen.has(a.id));
    if (!fresh.length) return;
    updateSettings({ seenAchievements: unlocked.map((a) => a.id) });
    if (!s.seenAchievements && sessions.length === 0) return;
    fresh.forEach((a) => toast.success(`Achievement unlocked: ${a.title}`, { description: a.desc }));
    setParty(true);
  }, [sessions, loaded, s.dailyGoalMin, s.seenAchievements]);
  return party ? <Confetti onDone={() => setParty(false)} /> : null;
}

/** Local reminder (works while the app is open; native in a Tauri build) if today's goal isn't met. */
export function ReminderWatcher() {
  const s = useSettings();
  const ref = useRef(s);
  ref.current = s;
  useEffect(() => {
    const check = async () => {
      const cur = ref.current;
      if (!cur.reminder || typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const today = todayKey();
      const hhmm = new Date().toTimeString().slice(0, 5);
      if (hhmm < cur.reminderTime || cur.reminderLastSent === today) return;
      const ms = (await db.sessions.where("date").equals(today).toArray()).reduce((a, x) => a + x.durationMs, 0);
      if (ms / 60000 >= cur.dailyGoalMin) return;
      await updateSettings({ reminderLastSent: today });
      new Notification("Iyzi Reader", { body: `Your ${cur.dailyGoalMin}-minute reading goal is waiting — keep your streak alive!` });
    };
    check();
    const iv = setInterval(check, 60000);
    return () => clearInterval(iv);
  }, []);
  return null;
}
