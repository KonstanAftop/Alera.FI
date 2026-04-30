import { useEffect, useMemo, useState } from "react";
import type { PosMonitoring, PosReading } from "@/components/Map3D";

export type PosBase = Omit<PosMonitoring, "reading">;

// Threshold definitions (mockup)
export const THRESHOLDS = {
  ARR: { siaga: 20, awas: 30, unit: "mm/jam" },
  AWLR: { siaga: 2.0, awas: 2.8, unit: "m" },
} as const;

export const POS_BASE: PosBase[] = [
  // ===== ARR (Curah Hujan) =====
  {
    id: "arr-cisanti",
    nama: "ARR Situ Cisanti",
    kategori: "hulu",
    tipe: "ARR",
    lngLat: [107.7861, -7.2069],
    elevasi: 1450,
    keterangan: "Mata air Citarum, kaki G. Wayang.",
  },
  {
    id: "arr-kertasari",
    nama: "ARR Kertasari",
    kategori: "hulu",
    tipe: "ARR",
    lngLat: [107.7503, -7.1492],
    elevasi: 1180,
    keterangan: "Daerah tangkapan air selatan.",
  },
  {
    id: "arr-pacet",
    nama: "ARR Pacet",
    kategori: "hulu",
    tipe: "ARR",
    lngLat: [107.8211, -7.1100],
    elevasi: 980,
    keterangan: "Lereng timur sub-DAS Citarum.",
  },
  {
    id: "arr-paseh",
    nama: "ARR Paseh",
    kategori: "tengah",
    tipe: "ARR",
    lngLat: [107.7905, -7.0598],
    elevasi: 690,
    keterangan: "Curah hujan wilayah tengah.",
  },
  // ===== AWLR (Tinggi Muka Air) =====
  {
    id: "awlr-majalaya",
    nama: "AWLR Majalaya Kota",
    kategori: "tengah",
    tipe: "AWLR",
    lngLat: [107.7619, -7.0428],
    elevasi: 670,
    keterangan: "Cekungan Majalaya — rawan banjir.",
  },
  {
    id: "awlr-baleendah",
    nama: "AWLR Baleendah",
    kategori: "hilir",
    tipe: "AWLR",
    lngLat: [107.6286, -7.0036],
    elevasi: 655,
    keterangan: "Pertemuan Citarum–Cisangkuy.",
  },
  {
    id: "awlr-dayeuhkolot",
    nama: "AWLR Dayeuhkolot",
    kategori: "hilir",
    tipe: "AWLR",
    lngLat: [107.6175, -6.9836],
    elevasi: 660,
    keterangan: "Hilir Citarum, dekat Bandung.",
  },
];

export const classifyARR = (v: number): PosReading["status"] =>
  v >= THRESHOLDS.ARR.awas ? "awas" : v >= THRESHOLDS.ARR.siaga ? "siaga" : "normal";
export const classifyAWLR = (v: number): PosReading["status"] =>
  v >= THRESHOLDS.AWLR.awas ? "awas" : v >= THRESHOLDS.AWLR.siaga ? "siaga" : "normal";

const seedReading = (p: PosBase): PosReading => {
  if (p.tipe === "ARR") {
    const v = Math.random() * 18 + (p.kategori === "hulu" ? 4 : 0);
    return { value: v, status: classifyARR(v), updatedAt: Date.now() };
  }
  const base = p.kategori === "hilir" ? 1.6 : 1.1;
  const v = base + Math.random() * 0.8;
  return { value: v, status: classifyAWLR(v), updatedAt: Date.now() };
};

const stepReading = (p: PosBase, prev: PosReading): PosReading => {
  if (p.tipe === "ARR") {
    const drift = (Math.random() - 0.45) * 6;
    const v = Math.max(0, Math.min(45, prev.value + drift));
    return { value: v, status: classifyARR(v), updatedAt: Date.now() };
  }
  const drift = (Math.random() - 0.5) * 0.25;
  const v = Math.max(0.3, Math.min(3.6, prev.value + drift));
  return { value: v, status: classifyAWLR(v), updatedAt: Date.now() };
};

export type Tren = "naik" | "turun" | "stabil";
export interface PosWithTrend extends PosMonitoring {
  prevValue?: number;
  tren: Tren;
}

const TICK_MS = 4000;
const HISTORY_LEN = 24; // ~96s window — cukup untuk grafik historis

interface Store {
  readings: Record<string, PosReading>;
  history: Record<string, number[]>;
  lastTickAt: number;
}

let store: Store = (() => {
  const readings: Record<string, PosReading> = {};
  const history: Record<string, number[]> = {};
  POS_BASE.forEach((p) => {
    readings[p.id] = seedReading(p);
    history[p.id] = [readings[p.id].value];
  });
  return { readings, history, lastTickAt: Date.now() };
})();

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

let tickStarted = false;
const startTick = () => {
  if (tickStarted) return;
  tickStarted = true;
  window.setInterval(() => {
    const next: Record<string, PosReading> = {};
    const nextHist: Record<string, number[]> = {};
    POS_BASE.forEach((p) => {
      const prev = store.readings[p.id] ?? seedReading(p);
      const r = stepReading(p, prev);
      next[p.id] = r;
      const h = [...(store.history[p.id] ?? []), r.value];
      nextHist[p.id] = h.slice(-HISTORY_LEN);
    });
    store = { readings: next, history: nextHist, lastTickAt: Date.now() };
    notify();
  }, TICK_MS);
};

export const usePosStore = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    startTick();
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const posList: PosWithTrend[] = useMemo(() => {
    return POS_BASE.map((p) => {
      const r = store.readings[p.id];
      const hist = store.history[p.id] ?? [];
      const prevValue = hist.length > 1 ? hist[0] : undefined;
      let tren: Tren = "stabil";
      if (prevValue != null && r) {
        const delta = r.value - prevValue;
        const threshold = p.tipe === "ARR" ? 1.5 : 0.08;
        tren = delta > threshold ? "naik" : delta < -threshold ? "turun" : "stabil";
      }
      return { ...p, reading: r, prevValue, tren };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  return { posList, history: store.history, lastTickAt: store.lastTickAt };
};
