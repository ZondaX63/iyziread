import { describe, expect, it } from "vitest";
import { chunkDelay, clampWpm, delayMultiplier, orpIndex } from "@/lib/rsvp";

describe("rsvp rules", () => {
  it("anchors ~35% into the word", () => {
    expect(orpIndex("reading")).toBe(2);
    expect(orpIndex("a")).toBe(0);
    expect(orpIndex('"hello')).toBe(2);
  });
  it("comma waits 1.5x", () => expect(delayMultiplier("well,")).toBe(1.5));
  it("sentence endings wait 2x", () => {
    expect(delayMultiplier("end.")).toBe(2);
    expect(delayMultiplier("why?")).toBe(2);
    expect(delayMultiplier("now!")).toBe(2);
  });
  it("plain word waits 1x", () => expect(delayMultiplier("word")).toBe(1));
  it("WPM clamps to 100-1200", () => {
    expect(clampWpm(50)).toBe(100);
    expect(clampWpm(5000)).toBe(1200);
  });
  it("300 WPM sentence end = 400ms", () => {
    expect(chunkDelay(["end."], 0, 1, 300, true)).toBe(400);
  });
});
