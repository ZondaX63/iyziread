import { describe, expect, it } from "vitest";
import { rampWpm, minutesLeft, sentenceAt } from "@/lib/rsvp";
import { baselineWpm, computeAchievements } from "@/lib/achievements";
import type { Session } from "@/lib/db";

const ses = (startedAt: number, wpm: number, min = 2, date = "2026-10-10"): Session => ({ date, startedAt, durationMs: min * 60000, words: wpm * min, wpm, bookId: "b" });

describe("warm-up ramp", () => {
  it("starts at 60% of target", () => expect(rampWpm(500, 0)).toBe(300));
  it("adds 10% every 30s", () => expect(rampWpm(500, 30000)).toBe(350));
  it("never exceeds target", () => expect(rampWpm(500, 600000)).toBe(500));
});

describe("time left", () => {
  it("600 words at 300 WPM = 2 min", () => expect(minutesLeft(600, 300)).toBe(2));
});

describe("quote sentence", () => {
  it("grabs the whole sentence around a word", () => {
    expect(sentenceAt("Hi there. I like tea, a lot. Bye.".split(" "), 4)).toBe("I like tea, a lot.");
  });
});

describe("personal achievements", () => {
  it("baseline is average of first 3 sessions", () => {
    expect(baselineWpm([ses(1, 200), ses(2, 300), ses(3, 250), ses(4, 900)])).toBe(250);
  });
  it("+10% unlocks relative to own baseline", () => {
    const a = computeAchievements([ses(1, 200), ses(2, 200), ses(3, 200), ses(4, 220)], 15);
    expect(a.find((x) => x.id === "beat10")!.unlocked).toBe(true);
    expect(a.find((x) => x.id === "beat25")!.unlocked).toBe(false);
  });
  it("goal achievements follow the user's daily goal", () => {
    const a = computeAchievements([ses(1, 200, 5)], 5);
    expect(a.find((x) => x.id === "goal1")!.unlocked).toBe(true);
  });
});
