import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { exportBackup, importBackup, updateSettings, type ReaderFont, type Theme } from "@/lib/db";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Iyzi Reader" },
      { name: "description", content: "Theme, fonts, anchor color, pacing and local backups." },
      { property: "og:title", content: "Settings — Iyzi Reader" },
      { property: "og:description", content: "Theme, fonts, anchor color, pacing and local backups." },
    ],
  }),
  component: SettingsPage,
});

const fonts: { id: ReaderFont; label: string }[] = [
  { id: "atkinson", label: "Atkinson Hyperlegible" },
  { id: "literata", label: "Literata (serif)" },
  { id: "grotesk", label: "Space Grotesk" },
  { id: "mono", label: "JetBrains Mono" },
  { id: "dyslexic", label: "OpenDyslexic" },
];
const swatches = ["#ef4444", "#39ff14", "#f59e0b", "#3b82f6", "#ec4899", "#ffffff"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="animate-fade-up rounded-xl border bg-card p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function SettingsPage() {
  const s = useSettings();
  const file = useRef<HTMLInputElement>(null);

  async function doExport() {
    const blob = new Blob([await exportBackup()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `iyzi-reader-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function doImport(f?: File) {
    if (!f) return;
    try {
      await importBackup(await f.text());
      toast.success("Backup restored");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Section title="Theme">
        <div className="flex gap-2">
          {(["dark", "light", "sepia"] as Theme[]).map((t) => (
            <Button key={t} variant={s.theme === t ? "default" : "outline"} className="capitalize" onClick={() => updateSettings({ theme: t })}>{t}</Button>
          ))}
        </div>
      </Section>
      <Section title="Anchor letter color">
        <div className="flex flex-wrap items-center gap-3">
          {swatches.map((c) => (
            <button key={c} onClick={() => updateSettings({ orpColor: c })} aria-label={c}
              className={cn("h-8 w-8 rounded-full border-2", s.orpColor === c ? "border-primary glow" : "border-border")}
              style={{ backgroundColor: c }} />
          ))}
          <input type="color" value={s.orpColor} onChange={(e) => updateSettings({ orpColor: e.target.value })} className="h-8 w-12 cursor-pointer rounded bg-transparent" />
          <span className="ml-4 font-reader text-3xl">re<span className="orp">a</span>ding</span>
        </div>
      </Section>
      <Section title="Reading font">
        <div className="grid gap-2 sm:grid-cols-2">
          {fonts.map((f) => (
            <button key={f.id} onClick={() => updateSettings({ font: f.id })}
              className={cn("rounded-lg border p-3 text-left", s.font === f.id ? "border-primary bg-accent" : "hover:border-primary/50")}>
              {f.label}
            </button>
          ))}
        </div>
      </Section>
      <Section title="Daily goal">
        <div className="flex flex-wrap items-center gap-2">
          {[5, 10, 15, 30, 60].map((m) => (
            <Button key={m} size="sm" variant={s.dailyGoalMin === m ? "default" : "outline"} onClick={() => updateSettings({ dailyGoalMin: m })}>{m} min</Button>
          ))}
        </div>
      </Section>
      <Section title="Pacing">
        <label className="flex items-center justify-between gap-4">
          <span>
            Punctuation pacing
            <span className="block text-sm text-muted-foreground">1.5× pause on commas, 2× on sentence endings</span>
          </span>
          <Switch checked={s.punctuation} onCheckedChange={(v) => updateSettings({ punctuation: v })} />
        </label>
        <label className="mt-4 flex items-center justify-between gap-4">
          <span>
            Session summary
            <span className="block text-sm text-muted-foreground">Show an animated recap after each reading session</span>
          </span>
          <Switch checked={s.showSummary} onCheckedChange={(v) => updateSettings({ showSummary: v })} />
        </label>
      </Section>
      <Section title="Backup">
        <p className="mb-3 text-sm text-muted-foreground">Export books, progress, stats and settings to a file, or restore from one (replaces current data).</p>
        <div className="flex gap-2">
          <Button onClick={doExport}><Download /> Export</Button>
          <Button variant="outline" onClick={() => file.current?.click()}><Upload /> Import</Button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => doImport(e.target.files?.[0])} />
        </div>
      </Section>
    </div>
  );
}
