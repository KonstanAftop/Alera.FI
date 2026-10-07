import { describe, it, expect } from "vitest";
import {
  initialPosts,
  accumulation,
  observations,
  forecast,
  draft,
  status,
} from "./model";
const at = "2026-09-25T12:00:00.000Z";
describe("monitoring context integrity", () => {
  it("integrates timestamped rainfall intervals, not current intensity extrapolation", () => {
    const p = initialPosts.find((post) => post.sensorId === "HGT1412")!;
    const records = observations(p, at);
    const expected = records
      .slice(-12)
      .reduce((sum, r) => sum + r.value / 4, 0);
    expect(accumulation(p, at, 3)).toBe(expected);
    expect(expected).not.toBe(records[24].value * 3);
    expect(accumulation(p, at, 6)).toBeGreaterThan(expected);
  });
  it("only supplies forecast for active supported AWLR targets", () => {
    const p = initialPosts.find((post) => post.sensorId === "206016005")!;
    expect(forecast(p, at)).toHaveLength(12);
    expect(forecast({ ...p, availability: "stale" }, at)).toEqual(
      [],
    );
    expect(forecast(initialPosts.find((post) => post.sensorId === "HGT1412")!, at)).toEqual([]);
  });
  it("does not describe stale observations as current conditions", () => {
    const p = initialPosts.find((post) => post.sensorId === "206014019")!;
    const stale = { ...p, availability: "stale" as const };
    expect(status(stale, at)).toBe("Data lama");
    expect(draft([stale], at)).toContain(
      "tidak dapat dipakai untuk menyatakan kondisi saat ini",
    );
  });
  it("labels simulation and differentiates forecasts in shared content", () => {
    const text = draft([initialPosts.find((post) => post.sensorId === "206016005")!], at);
    expect(text).toContain("SIMULASI PROTOTIPE");
    expect(text).toContain("bukan kondisi saat ini");
  });
});
