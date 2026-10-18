export const MIN_WPM = 100;
export const MAX_WPM = 1200;

export function clampWpm(wpm: number) {
  return Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(wpm)));
}

/** Index of the anchor letter (~35% into the word's letters, skipping leading punctuation). */
export function orpIndex(word: string) {
  const lead = word.match(/^[^\p{L}\p{N}]*/u)?.[0].length ?? 0;
  const core = word.slice(lead).replace(/[^\p{L}\p{N}]+$/u, "");
  if (core.length === 0) return 0;
  return lead + Math.min(core.length - 1, Math.floor(core.length * 0.35));
}

export function splitOrp(word: string) {
  const i = orpIndex(word);
  return { left: word.slice(0, i), anchor: word.charAt(i), right: word.slice(i + 1) };
}

export function delayMultiplier(word: string) {
  if (/[.?!…]["'”’)\]]*$/.test(word)) return 2;
  if (/[,;:]["'”’)\]]*$/.test(word)) return 1.5;
  return 1;
}

export function chunkDelay(words: string[], index: number, chunk: number, wpm: number, punctuation: boolean) {
  const base = 60000 / clampWpm(wpm);
  const last = words[Math.min(words.length - 1, index + chunk - 1)] ?? "";
  return base * chunk * (punctuation ? delayMultiplier(last) : 1);
}

export interface Paragraph {
  start: number;
  words: string[];
}

export function tokenize(text: string) {
  const paragraphs: Paragraph[] = [];
  const words: string[] = [];
  for (const raw of text.split(/\n\s*\n|\n/)) {
    const w = raw.trim().split(/\s+/).filter(Boolean);
    if (!w.length) continue;
    paragraphs.push({ start: words.length, words: w });
    words.push(...w);
  }
  return { paragraphs, words };
}

export function bionicSplit(word: string) {
  const n = Math.max(1, Math.ceil(word.length * 0.4));
  return [word.slice(0, n), word.slice(n)] as const;
}

/** Warm-up ramp: start at 60% of the user's own target, +10% of target every 30s until target. */
export function rampWpm(target: number, elapsedMs: number) {
  const t = clampWpm(target);
  const steps = Math.floor(Math.max(0, elapsedMs) / 30000);
  return clampWpm(Math.min(t, t * (0.6 + 0.1 * steps)));
}

/** Minutes needed to read `wordsLeft` words at `wpm`. */
export function minutesLeft(wordsLeft: number, wpm: number) {
  return Math.max(0, wordsLeft) / clampWpm(wpm);
}

export function formatMinutes(min: number) {
  if (min < 1) return "<1 min";
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  return `${h}h ${Math.round(min - h * 60)}m`;
}

const END = /[.?!…]["'”’)\]]*$/;
/** The full sentence containing word `i`. */
export function sentenceAt(words: string[], i: number) {
  let s = i;
  while (s > 0 && !END.test(words[s - 1] ?? "")) s--;
  let e = i;
  while (e < words.length - 1 && !END.test(words[e] ?? "")) e++;
  return words.slice(s, e + 1).join(" ");
}

/** Continuous reading before a 20-20-20 eye break. */
export const EYE_REST_AFTER_MS = 20 * 60 * 1000;
export const EYE_REST_SECONDS = 20;
