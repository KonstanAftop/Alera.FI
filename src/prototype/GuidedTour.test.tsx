import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import GuidedTour from "./GuidedTour";
function Harness({ replay = 0 }: { replay?: number }) {
  const [step, setStep] = useState<number | null>(null);
  return <GuidedTour userId="pending" replay={replay} step={step} onStep={setStep} />;
}
beforeEach(() => localStorage.clear());
afterEach(cleanup);
it("keeps all ten steps in one tour with back, skip, persistence, and replay", () => {
  const view = render(<Harness />);
  expect(screen.getByText("PENGENALAN · 1/10")).toBeTruthy();
  fireEvent.click(screen.getByText("Berikutnya"));
  fireEvent.click(screen.getByText("Kembali"));
  expect(screen.getByText("PENGENALAN · 1/10")).toBeTruthy();
  for (let i = 0; i < 9; i++) fireEvent.click(screen.getByText("Berikutnya"));
  expect(screen.getByText("PENGENALAN · 10/10")).toBeTruthy();
  fireEvent.click(screen.getByText("Selesai"));
  expect(localStorage.getItem("alera.tour.v2.pending")).toBe("done");
  view.unmount();
  const replay = render(<Harness />);
  expect(screen.queryByLabelText("Panduan aplikasi")).toBeNull();
  replay.rerender(<Harness replay={1} />);
  expect(screen.getByText("PENGENALAN · 1/10")).toBeTruthy();
  fireEvent.click(screen.getByText("Lewati"));
  expect(screen.queryByLabelText("Panduan aplikasi")).toBeNull();
});
