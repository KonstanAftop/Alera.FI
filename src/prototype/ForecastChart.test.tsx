import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ForecastChart from "./ForecastChart";
import { initialPosts } from "./model";

const at = "2026-09-25T12:00:00.000Z";
const post = initialPosts.find((p) => p.sensorId === "206016005")!;
describe("water level forecast chart", () => {
  it("shows 12 ten-minute predictions through two hours and the selected station threshold", () => {
    render(<ForecastChart post={{ ...post, threshold: 4.25 }} at={at} />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("4.25 meter");
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(13);
    expect(rows[1].textContent).toContain("19.10");
    expect(rows[12].textContent).toContain("21.00");
    expect(screen.getByText("Simulasi prediksi, bukan pengamatan saat ini.")).toBeTruthy();
  });
  it("does not display a forecast for stale observations", () => {
    const { container } = render(<ForecastChart post={{ ...post, availability: "stale" }} at={at} />);
    expect(container.innerHTML).toBe("");
  });
});
