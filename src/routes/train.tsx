import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RotateCcw, Trophy } from "lucide-react";
import { updateSettings } from "@/lib/db";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/train")({
  head: () => ({
    meta: [
      { title: "Schulte table — Iyzi Reader" },
      { name: "description", content: "Warm up your peripheral vision with a 5×5 Schulte table before reading." },
      { property: "og:title", content: "Schulte table — Iyzi Reader" },
      { property: "og:description", content: "Warm up your peripheral vision with a 5×5 Schulte table before reading." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrainPage,
});

const shuffle = () => Array.from({ length: 25 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);

function TrainPage() {
  const s = useSettings();
  const [grid, setGrid] = useState<number[]>([]);
  const [next, setNext] = useState(1);
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [miss, setMiss] = useState<number | null>(null);

  const reset = () => { setGrid(shuffle()); setNext(1); setStart(null); setResult(null); setNow(0); };
  useEffect(reset, []);
  useEffect(() => {
    if (start === null || result !== null) return;
    const iv = setInterval(() => setNow(Date.now() - start), 100);
    return () => clearInterval(iv);
  }, [start, result]);

  function hit(n: number) {
    if (result !== null) return;
    if (n !== next) { setMiss(n); setTimeout(() => setMiss(null), 300); return; }
    const t0 = start ?? Date.now();
    if (start === null) setStart(t0);
    if (n === 25) {
      const ms = Date.now() - t0;
      setResult(ms);
      if (!s.schulteBest || ms < s.schulteBest) updateSettings({ schulteBest: ms });
    }
    setNext(n + 1);
  }
  const sec = (ms: number) => (ms / 1000).toFixed(1) + "s";

  return (
    <div className="mx-auto max-w-md space-y-5 text-center">
      <h1 className="text-3xl font-bold">Schulte table</h1>
      <p className="text-muted-foreground">Keep your eyes on the center and tap 1 → 25 using your peripheral vision.</p>
      <div className="flex justify-center gap-6 font-display tabular-nums">
        <span>Next: <b className="text-primary">{Math.min(next, 25)}</b></span>
        <span>Time: <b>{sec(result ?? now)}</b></span>
        {s.schulteBest && <span className="text-muted-foreground"><Trophy className="mr-1 inline h-4 w-4 text-primary" />{sec(s.schulteBest)}</span>}
      </div>
      <div className="relative grid grid-cols-5 gap-2">
        {grid.map((n) => (
          <button key={n} onClick={() => hit(n)}
            className={cn("aspect-square rounded-lg border bg-card font-display text-2xl font-bold transition-all duration-200",
              n < next ? "border-primary/40 text-primary/40" : "hover:border-primary",
              miss === n && "border-destructive text-destructive")}>
            {n}
          </button>
        ))}
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary glow" />
      </div>
      {result !== null && (
        <p className="animate-pop font-display text-xl font-bold text-primary">
          {s.schulteBest === result ? "New personal best! " : "Done! "}{sec(result)}
        </p>
      )}
      <Button variant="outline" onClick={reset}><RotateCcw /> New table</Button>
    </div>
  );
}
