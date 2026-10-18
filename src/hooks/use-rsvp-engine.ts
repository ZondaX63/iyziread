import { useCallback, useEffect, useRef, useState } from "react";
import { chunkDelay, rampWpm } from "@/lib/rsvp";

interface Opts {
  wpm: number;
  chunk: number;
  punctuation: boolean;
  ramp?: boolean;
  initial: number;
  onSession: (s: { durationMs: number; words: number }) => void;
}

/** requestAnimationFrame-driven word scheduler with accumulated time (no drift). */
export function useRsvpEngine(words: string[], opts: Opts) {
  const [index, setIndexState] = useState(() => Math.min(opts.initial, Math.max(0, words.length - 1)));
  const [playing, setPlaying] = useState(false);
  const [liveWpm, setLiveWpm] = useState(opts.wpm);
  const idxRef = useRef(index);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const setIndex = useCallback(
    (i: number) => {
      const c = Math.max(0, Math.min(words.length - 1, Math.round(i)));
      idxRef.current = c;
      setIndexState(c);
    },
    [words.length],
  );

  useEffect(() => {
    if (!playing || !words.length) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const playStart = last;
    let shown = 0;
    const startT = Date.now();
    const startI = idxRef.current;
    const tick = (now: number) => {
      acc += now - last;
      last = now;
      const o = optsRef.current;
      const wpm = o.ramp ? rampWpm(o.wpm, now - playStart) : o.wpm;
      if (wpm !== shown) { shown = wpm; setLiveWpm(wpm); }
      let i = idxRef.current;
      let changed = false;
      for (;;) {
        const d = chunkDelay(words, i, o.chunk, wpm, o.punctuation);
        if (acc < d) break;
        acc -= d;
        changed = true;
        if (i + o.chunk >= words.length) {
          i = words.length - 1;
          setPlaying(false);
          break;
        }
        i += o.chunk;
      }
      if (changed) {
        idxRef.current = i;
        setIndexState(i);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      const durationMs = Date.now() - startT;
      const w = idxRef.current - startI;
      if (durationMs > 300 && w > 0) optsRef.current.onSession({ durationMs, words: w });
    };
  }, [playing, words]);

  const seekSeconds = useCallback(
    (sec: number) => setIndex(idxRef.current + (optsRef.current.wpm / 60) * sec),
    [setIndex],
  );

  return { index, playing, liveWpm, setPlaying, toggle: () => setPlaying((p) => !p), setIndex, seekSeconds };
}
