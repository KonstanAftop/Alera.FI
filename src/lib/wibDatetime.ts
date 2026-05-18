/** Postgres `timestamp without time zone` — wall-clock WIB (Indonesia). */
const WIB_NAIVE_RE =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?/;

/** Parse DB/API timestamp to epoch ms (WIB wall clock, no false UTC shift). */
export function parseWIBNaiveMs(ts: string): number {
  const trimmed = ts.trim();
  const m = trimmed.match(WIB_NAIVE_RE);
  if (m) {
    const [, y, mo, d, h, mi, s = "00"] = m;
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}+07:00`).getTime();
  }
  const iso = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasTz ? iso : `${iso}+07:00`).getTime();
}

export function formatTimeWIB(ts: string): string {
  const m = ts.trim().match(WIB_NAIVE_RE);
  if (m) return `${m[4]}:${m[5]}`;
  return new Date(parseWIBNaiveMs(ts)).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });
}

export function formatDateTimeWIB(ts: string): string {
  return new Date(parseWIBNaiveMs(ts)).toLocaleString("id-ID", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });
}

export function formatDateTimeWIBFromMs(ms: number): string {
  return new Date(ms).toLocaleString("id-ID", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Jakarta",
  });
}
