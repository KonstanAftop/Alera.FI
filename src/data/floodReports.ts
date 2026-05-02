import { useEffect, useState } from "react";

export interface FloodReport {
  id: string;
  lokasi: string;
  catatan?: string;
  pelapor?: string;
  createdAt: number;
}

const KEY = "pacu_flood_reports_v1";

const load = (): FloodReport[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FloodReport[];
  } catch {
    return [];
  }
};

let reports: FloodReport[] = load();
const listeners = new Set<() => void>();
const notify = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(reports));
  } catch {
    /* noop */
  }
  listeners.forEach((l) => l());
};

export const addFloodReport = (r: Omit<FloodReport, "id" | "createdAt">) => {
  const item: FloodReport = {
    ...r,
    id: `flood-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  };
  reports = [item, ...reports];
  notify();
  return item;
};

export const removeFloodReport = (id: string) => {
  reports = reports.filter((r) => r.id !== id);
  notify();
};

export const useFloodReports = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return reports;
};

// Suggested locations for Majalaya area (search-only UX)
export const LOKASI_SUGGESTIONS = [
  "Majalaya Kota",
  "Kp. Cipaku, Majalaya",
  "Kp. Wangisagara, Majalaya",
  "Kp. Sukamaju, Majalaya",
  "Kp. Padaulun, Majalaya",
  "Baleendah",
  "Andir, Baleendah",
  "Dayeuhkolot",
  "Pasawahan",
  "Paseh",
  "Ibun",
  "Solokanjeruk",
  "Rancaekek",
  "Cikancung",
  "Cicalengka",
  "Pacet",
  "Kertasari",
  "Cisanti (hulu Citarum)",
];
