import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import App from "../App";
vi.mock("./Map", () => ({ default: () => <div>Peta pengujian</div> }));
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("open", vi.fn());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("requires review and explicit confirmation after WhatsApp handoff, preserving edited content", () => {
  render(<App />);
  fireEvent.click(screen.getByText("Masuk ke ruang monitoring"));
  fireEvent.click(screen.getByRole("button", { name: /AWLR Majalaya 3.40/ }));
  fireEvent.click(screen.getByText("Pilih untuk Informasi"));
  fireEvent.click(screen.getByLabelText("Tutup kondisi"));
  fireEvent.click(screen.getByText("Lihat Pilihan"));
  fireEvent.click(screen.getByText("Buat draf AI"));
  fireEvent.change(screen.getByLabelText("Draf pesan"), {
    target: { value: "SIMULASI — pesan ditinjau relawan" },
  });
  fireEvent.click(screen.getByText("Lanjut bagikan"));
  expect(screen.queryByText("Ya, sudah dikirim")).toBeNull();
  fireEvent.click(screen.getByText("Bagikan ke WhatsApp"));
  expect(window.open).toHaveBeenCalledWith(
    expect.stringContaining(
      encodeURIComponent("SIMULASI — pesan ditinjau relawan"),
    ),
    "_blank",
    "noopener,noreferrer",
  );
  expect(JSON.parse(localStorage.getItem("alera.messages.v1")!)[0].status).toBe(
    "WhatsApp Handoff",
  );
  fireEvent.click(screen.getByText("Belum"));
  expect(JSON.parse(localStorage.getItem("alera.messages.v1")!)[0].status).toBe(
    "Ready to Share",
  );
  fireEvent.click(screen.getByText("Bagikan ke WhatsApp"));
  fireEvent.click(screen.getByText("Ya, sudah dikirim"));
  const saved = JSON.parse(localStorage.getItem("alera.messages.v1")!)[0];
  expect(saved.status).toBe("Confirmed Sent");
  expect(saved.confirmedAt).toBeTruthy();
  expect(saved.final).toContain("ditinjau relawan");
  fireEvent.click(screen.getByText("Lihat aktivitas"));
  expect(screen.getByText("Dikonfirmasi terkirim oleh relawan")).toBeTruthy();
});
it("does not restrict all-post access to personal preferences and gates admin navigation", () => {
  render(<App />);
  fireEvent.click(screen.getByText("Masuk ke ruang monitoring"));
  expect(screen.queryByRole("button", { name: "Admin" })).toBeNull();
  expect(screen.queryByRole("button", { name: /AWLR Wangisagara/ })).toBeNull();
  fireEvent.click(screen.getByText("Semua Pos"));
  expect(screen.getByRole("button", { name: /AWLR Wangisagara/ })).toBeTruthy();
});

it('uses enabled administrator knowledge in assistant responses', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Akun demonstrasi'), {target: {value: 'admin'}});
  fireEvent.click(screen.getByText('Masuk ke ruang monitoring'));
  fireEvent.click(screen.getByRole('button', {name:'Admin'}));
  fireEvent.click(screen.getByRole('button', {name:'Pengetahuan AI'}));
  fireEvent.click(screen.getByText('Tambah materi'));
  const titles=screen.getAllByLabelText('Judul');
  const bodies=screen.getAllByLabelText('Materi');
  const enabled=screen.getAllByLabelText('Aktif sebagai rujukan');
  fireEvent.change(titles[titles.length-1], {target:{value:'Panduan latihan Citarum'}});
  fireEvent.change(bodies[bodies.length-1], {target:{value:'Latihan Citarum dimulai dengan meninjau data bersama koordinator.'}});
  fireEvent.click(enabled[enabled.length-1]);
  const save=screen.getAllByText('Simpan materi');fireEvent.click(save[save.length-1]);
  fireEvent.click(screen.getByRole('button',{name:'AI Assistant'}));
  fireEvent.change(screen.getByLabelText('Pertanyaan untuk asisten'),{target:{value:'Bagaimana latihan Citarum?'}});
  fireEvent.click(screen.getByLabelText('Kirim pertanyaan'));
  expect(screen.getByText(/Latihan Citarum dimulai dengan meninjau data bersama koordinator/)).toBeTruthy();
});
