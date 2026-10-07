import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import App from "../App";
vi.mock("./Map", () => ({ default: () => <div>Peta pengujian</div> }));
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("alera.tour.v2.volunteer", "done");
  localStorage.setItem("alera.tour.v2.admin", "done");
  vi.stubGlobal("open", vi.fn());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("requires review and explicit confirmation after WhatsApp handoff, preserving edited content", () => {
  render(<App />);
  fireEvent.click(screen.getByText("Masuk ke ruang monitoring"));
  fireEvent.click(screen.getByRole("button", { name: /AWLR \+ CCTV Majalaya 3.40/ }));
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
  expect(screen.queryByRole("button", { name: /ARR BD\. Wangisagara/ })).toBeNull();
  fireEvent.click(screen.getByText("Semua Pos"));
  expect(screen.getByRole("button", { name: /ARR BD\. Wangisagara/ })).toBeTruthy();
});

it("keeps CCTV and AWLR in one selectable post when filtering cameras", () => {
  render(<App />);
  fireEvent.click(screen.getByText("Masuk ke ruang monitoring"));
  fireEvent.click(screen.getByLabelText("AWLR"));
  fireEvent.click(screen.getByLabelText("ARR"));
  fireEvent.click(screen.getByRole("button", { name: /AWLR \+ CCTV Majalaya/ }));
  expect(screen.getByText("CCTV · Majalaya")).toBeTruthy();
  expect(screen.getByText("Waspada", { selector: ".bottom-sheet .status" })).toBeTruthy();
  fireEvent.click(screen.getByText("Pilih untuk Informasi"));
  fireEvent.click(screen.getByLabelText("Tutup kondisi"));
  expect(screen.queryByRole("button", { name: /Jembatan Majalaya/ })).toBeNull();
});
it("uploads titled knowledge and preserves its content after reload", async () => {
  const view = render(<App />);
  fireEvent.change(screen.getByLabelText("Akun demonstrasi"), { target: { value: "admin" } });
  fireEvent.click(screen.getByText("Masuk ke ruang monitoring"));
  fireEvent.click(screen.getByRole("button", { name: "Admin" }));
  expect(screen.queryByRole("button", { name: "Sumber monitoring" })).toBeNull();
  fireEvent.click(screen.getByText("Pengetahuan AI"));
  expect(screen.queryByLabelText("Judul")).toBeNull();
  expect(screen.queryByLabelText("Materi")).toBeNull();
  const file = new File(["Berkumpul di balai desa."], "panduan.txt", { type: "text/plain" });
  Object.defineProperty(file, "text", { value: async () => "Berkumpul di balai desa." });
  fireEvent.change(screen.getAllByLabelText("Unggah file").at(-1)!, { target: { files: [file] } });
  await waitFor(() => expect(screen.getByDisplayValue("panduan")).toBeTruthy());
  fireEvent.change(screen.getByLabelText("Judul"), { target: { value: "Panduan evakuasi" } });
  fireEvent.click(screen.getByText("Simpan dokumen"));
  expect(screen.getByText("panduan.txt")).toBeTruthy();
  view.unmount();
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Admin" }));
  fireEvent.click(screen.getByText("Pengetahuan AI"));
  expect(screen.getByText("Panduan evakuasi")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "AI Assistant" }));
  fireEvent.change(screen.getByLabelText("Pertanyaan untuk asisten"), { target: { value: "Panduan evakuasi" } });
  fireEvent.click(screen.getByLabelText("Kirim pertanyaan"));
  expect(screen.getByText(/Berkumpul di balai desa/)).toBeTruthy();
});

it("keeps new accounts read-only across reloads until an admin approves them", () => {
  let view = render(<App />);
  fireEvent.click(screen.getByText("Buat akun relawan demo"));
  fireEvent.change(screen.getByLabelText("Nama"), { target: { value: "Relawan Baru" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "baru@example.test" } });
  fireEvent.click(screen.getByText("Daftar dan lihat monitoring"));
  fireEvent.click(screen.getByText("Lewati"));
  const pending = JSON.parse(localStorage.getItem("alera.users.v1")!).find((u: { email: string }) => u.email === "baru@example.test");
  expect(pending.approval).toBe("pending");
  expect(screen.getByText(/Menunggu persetujuan admin/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /AWLR \+ CCTV Majalaya 3.40/ }));
  expect(screen.getByText("Pilih untuk Informasi")).toBeDisabled();
  fireEvent.click(screen.getByText("Pilih untuk Informasi"));
  expect(JSON.parse(localStorage.getItem("alera.activity.v1")!)).toEqual([]);
  fireEvent.click(screen.getByLabelText("Tutup kondisi"));
  fireEvent.click(screen.getByRole("button", { name: "Account" }));
  expect(screen.getByText("Simpan profil")).toBeDisabled();
  fireEvent.click(screen.getByRole("tab", { name: "Preferensi monitoring" }));
  expect(screen.getAllByRole("checkbox").every((c) => (c as HTMLInputElement).disabled)).toBe(true);
  view.unmount();
  view = render(<App />);
  expect(screen.getByText(/Menunggu persetujuan admin/)).toBeTruthy();
  fireEvent.click(screen.getByLabelText("Keluar"));
  fireEvent.change(screen.getByLabelText("Akun demonstrasi"), { target: { value: "admin" } });
  fireEvent.click(screen.getByText("Masuk ke ruang monitoring"));
  fireEvent.click(screen.getByRole("button", { name: "Admin" }));
  fireEvent.click(screen.getByLabelText("Setujui akun Relawan Baru"));
  fireEvent.click(screen.getByLabelText("Keluar"));
  fireEvent.change(screen.getByLabelText("Akun demonstrasi"), { target: { value: pending.id } });
  fireEvent.click(screen.getByText("Masuk ke ruang monitoring"));
  expect(screen.queryByText(/Menunggu persetujuan admin/)).toBeNull();
  fireEvent.click(screen.getByText("Semua Pos"));
  fireEvent.click(screen.getByRole("button", { name: /AWLR \+ CCTV Majalaya 3.40/ }));
  expect(screen.getByText("Pilih untuk Informasi")).not.toBeDisabled();
  fireEvent.click(screen.getByText("Pilih untuk Informasi"));
  fireEvent.click(screen.getByLabelText("Tutup kondisi"));
  fireEvent.click(screen.getByText("Lihat Pilihan"));
  fireEvent.click(screen.getByText("Buat draf AI"));
  expect(JSON.parse(localStorage.getItem("alera.messages.v1")!)[0].userId).toBe(pending.id);
  view.unmount();
});

it("opens real panels throughout the unified tour without giving pending users write access", () => {
  localStorage.setItem("alera.users.v1", JSON.stringify([{ id: "pending-tour", name: "Latihan", email: "latihan@example.test", village: "Majalaya", role: "Volunteer", active: true, approval: "pending", preferences: [] }]));
  localStorage.setItem("alera.session.v1", JSON.stringify("pending-tour"));
  render(<App />);
  for (let i = 0; i < 3; i++) fireEvent.click(screen.getByText("Berikutnya"));
  expect(screen.getByRole("img", { name: "Grafik historis enam jam" })).toBeTruthy();
  fireEvent.click(screen.getByText("Berikutnya"));
  expect(screen.getByText("Pilih untuk Informasi")).not.toBeDisabled();
  fireEvent.click(screen.getByText("Pilih untuk Informasi"));
  expect(screen.getByRole("heading", { name: "Informasi untuk warga" })).toBeTruthy();
  fireEvent.click(screen.getByText("Buat draf AI"));
  fireEvent.change(screen.getByLabelText("Draf pesan"), { target: { value: "Pesan latihan diedit" } });
  fireEvent.click(screen.getByText("Lanjut bagikan"));
  expect(screen.getByLabelText("Draf pesan")).toHaveValue("Pesan latihan diedit");
  fireEvent.click(screen.getByText("Bagikan ke WhatsApp"));
  expect(window.open).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Ya, sudah dikirim"));
  expect(screen.getByText("Latihan selesai — tidak disimpan")).toBeTruthy();
  fireEvent.click(screen.getByText("Selesai"));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(JSON.parse(localStorage.getItem("alera.messages.v1")!)).toEqual([]);
  expect(JSON.parse(localStorage.getItem("alera.activity.v1")!)).toEqual([]);
  fireEvent.click(screen.getByText("Semua Pos"));
  fireEvent.click(screen.getByRole("button", { name: /AWLR \+ CCTV Majalaya 3.40/ }));
  expect(screen.getByText("Pilih untuk Informasi")).toBeDisabled();
});

it("repairs the account village selector when an old list was persisted during hot reload", () => {
  localStorage.setItem("alera.villages.v3", JSON.stringify(["Majalaya", "Wangisagara", "Sukamaju", "Majakerta"]));
  render(<App />);
  fireEvent.click(screen.getByText("Masuk ke ruang monitoring"));
  fireEvent.click(screen.getByRole("button", { name: "Account" }));
  const village = screen.getByLabelText("Desa") as HTMLSelectElement;
  expect(village.value).toBe("hilir/Majalaya");
  expect(Array.from(village.options).filter((o) => o.value.startsWith("hulu/"))).toHaveLength(11);
  expect(Array.from(village.options).filter((o) => o.value.startsWith("hilir/"))).toHaveLength(8);
});
