import { describe, expect, it } from "vitest";
import { readingStreak } from "@/lib/stats";

const today = new Date("2026-10-18T12:00:00");

describe("reading streak", () => {
  it("counts consecutive days ending today", () => {
    expect(readingStreak(["2026-10-18", "2026-10-17", "2026-10-16", "2026-10-14"], today)).toBe(3);
  });
  it("still counts when today has no reading yet", () => {
    expect(readingStreak(["2026-10-17", "2026-10-16"], today)).toBe(2);
  });
  it("is zero after a missed day", () => {
    expect(readingStreak(["2026-10-15"], today)).toBe(0);
  });
});
