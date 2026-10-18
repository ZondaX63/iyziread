import { useEffect, useState } from "react";
import { Clock, Gauge, Sparkles, Type, X } from "lucide-react";
import { CountUp } from "./CountUp";

export interface SummaryData {
  durationMs: number;
  words: number;
  wpm: number;
}

export const SUMMARY_EVENT = "iyzi:session-summary";

/** Mounted once at the root so the recap survives leaving the reader. */
export function SessionSummaryHost() {
  const [data, setData] = useState<SummaryData | null>(null);
  useEffect(() => {
    const on = (e: Event) => setData((e as CustomEvent<SummaryData>).detail);
    window.addEventListener(SUMMARY_EVENT, on);
    return () => window.removeEventListener(SUMMARY_EVENT, on);
  }, []);
  return data ? <SessionSummary data={data} onClose={() => setData(null)} /> : null;
}

const cheers = ["Great focus!", "You're on fire!", "Speed demon!", "Brain gains!", "Keep it rolling!"];

export function SessionSummary({ data, onClose }: { data: SummaryData; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);
  const cheer = cheers[data.words % cheers.length];
  const items = [
    { icon: Type, label: "words", value: data.words, dec: 0 },
    { icon: Clock, label: "minutes", value: data.durationMs / 60000, dec: 1 },
    { icon: Gauge, label: "WPM", value: data.wpm, dec: 0 },
  ];
  return (
    <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-md animate-pop sm:bottom-6" role="status" onClick={onClose}>
      <div className="relative overflow-hidden rounded-2xl border border-primary bg-card p-5 glow">
        <button className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-4 w-4" /></button>
        <p className="flex items-center gap-2 font-display text-lg font-bold">
          <Sparkles className="h-5 w-5 animate-flicker text-primary" /> {cheer}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {items.map(({ icon: Icon, label, value, dec }, i) => (
            <div key={label} className="animate-fade-up rounded-xl bg-secondary p-3 text-center" style={{ animationDelay: `${150 + i * 120}ms` }}>
              <Icon className="mx-auto h-4 w-4 text-primary" />
              <p className="mt-1 font-display text-2xl font-bold text-primary">
                +<CountUp value={value} decimals={dec} duration={900} />
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
