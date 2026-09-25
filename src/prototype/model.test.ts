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
    const p = initialPosts[2];
    const records = observations(p, at);
    const expected = records
      .slice(-12)
      .reduce((sum, r) => sum + r.value / 4, 0);
    expect(accumulation(p, at, 3)).toBe(expected);
    expect(expected).not.toBe(records[24].value * 3);
    expect(accumulation(p, at, 6)).toBeGreaterThan(expected);
  });
  it("only supplies forecast for active supported AWLR targets", () => {
    expect(forecast(initialPosts[0], at)).toHaveLength(3);
    expect(forecast({ ...initialPosts[0], availability: "stale" }, at)).toEqual(
      [],
    );
    expect(forecast(initialPosts[2], at)).toEqual([]);
  });
  it("does not describe stale observations as current conditions", () => {
    const p = initialPosts[3];
    expect(status(p, at)).toBe("Data lama");
    expect(draft([p], at)).toContain(
      "tidak dapat dipakai untuk menyatakan kondisi saat ini",
    );
  });
  it("labels simulation and differentiates forecasts in shared content", () => {
    const text = draft([initialPosts[0]], at);
    expect(text).toContain("SIMULASI PROTOTIPE");
    expect(text).toContain("bukan kondisi saat ini");
  });
});
