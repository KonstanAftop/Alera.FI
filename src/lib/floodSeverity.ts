/**
 * Klasifikasi kedalaman genangan banjir (berdasarkan Nurul Yuhan, ITB, 2017).
 * @see https://digilib.itb.ac.id/assets/files/disk1/640/jbptitbpp-gdl-nurulyuhan-31991-3-2017ts-2.pdf
 */
export type FloodSeverity = "low" | "medium" | "high";

export const FLOOD_SEVERITY_OPTIONS = [
  {
    value: "low" as const,
    label: "Rendah",
    icon: "🟢",
    desc: "Kedalaman H ≤ 0,3 m",
  },
  {
    value: "medium" as const,
    label: "Sedang",
    icon: "🟡",
    desc: "Kedalaman 0,3 m ≤ H ≤ 0,5 m",
  },
  {
    value: "high" as const,
    label: "Tinggi",
    icon: "🔴",
    desc: "Kedalaman H ≥ 0,5 m",
  },
] as const;

/** Maps legacy DB value `critical` to Tinggi for display. */
export function normalizeFloodSeverity(severity: string): FloodSeverity | null {
  if (severity === "critical") return "high";
  if (severity === "low" || severity === "medium" || severity === "high") return severity;
  return null;
}

export function getFloodSeverityOption(severity: string) {
  const normalized = normalizeFloodSeverity(severity);
  if (!normalized) return undefined;
  return FLOOD_SEVERITY_OPTIONS.find((o) => o.value === normalized);
}
