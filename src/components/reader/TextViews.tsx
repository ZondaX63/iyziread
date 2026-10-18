import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { bionicSplit, type Paragraph } from "@/lib/rsvp";
import { cn } from "@/lib/utils";

function paraOf(paragraphs: Paragraph[], index: number) {
  let lo = 0;
  let hi = paragraphs.length - 1;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (paragraphs[m]!.start <= index) lo = m;
    else hi = m - 1;
  }
  return lo;
}

interface Props {
  paragraphs: Paragraph[];
  index: number;
  onSeek: (i: number) => void;
  mode: "bionic" | "pacer";
  playing: boolean;
}

export function VirtualText({ paragraphs, index, onSeek, mode, playing }: Props) {
  const parent = useRef<HTMLDivElement>(null);
  const v = useVirtualizer({
    count: paragraphs.length,
    getScrollElement: () => parent.current,
    estimateSize: () => 160,
    overscan: 4,
  });
  const current = paraOf(paragraphs, index);

  useEffect(() => {
    if (mode === "bionic" && playing) return;
    v.scrollToIndex(current, { align: mode === "pacer" ? "center" : "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, mode]);

  return (
    <div ref={parent} className="h-[62vh] overflow-y-auto rounded-2xl border bg-card px-6">
      <div className="relative w-full" style={{ height: v.getTotalSize() }}>
        {v.getVirtualItems().map((row) => {
          const p = paragraphs[row.index]!;
          return (
            <div
              key={row.key}
              data-index={row.index}
              ref={v.measureElement}
              className="absolute left-0 top-0 w-full py-3"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              <ParagraphView p={p} mode={mode} active={row.index === current} index={index} onSeek={onSeek} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ParagraphView({ p, mode, active, index, onSeek }: { p: Paragraph; mode: "bionic" | "pacer"; active: boolean; index: number; onSeek: (i: number) => void }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [band, setBand] = useState<{ top: number; h: number } | null>(null);

  useLayoutEffect(() => {
    if (mode !== "pacer" || !active || !ref.current) return setBand(null);
    const el = ref.current.querySelector<HTMLElement>(`[data-i="${index}"]`);
    if (el) setBand((b) => (b && b.top === el.offsetTop ? b : { top: el.offsetTop, h: el.offsetHeight }));
  }, [index, active, mode]);

  return (
    <p ref={ref} className={cn("relative font-reader text-xl leading-relaxed", mode === "pacer" && !active && "text-muted-foreground")}>
      {band && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-x-2 rounded-md bg-pacer transition-[top] duration-200 ease-out"
          style={{ top: band.top - 2, height: band.h + 4 }}
        />
      )}
      {p.words.map((w, k) => {
        const gi = p.start + k;
        const [a, b] = bionicSplit(w);
        return (
          <span key={k} data-i={gi} onClick={() => onSeek(gi)} className="relative cursor-pointer hover:text-primary">
            {mode === "bionic" ? (
              <>
                <b className="font-extrabold">{a}</b>
                <span className="opacity-75">{b}</span>
              </>
            ) : (
              w
            )}{" "}
          </span>
        );
      })}
    </p>
  );
}
