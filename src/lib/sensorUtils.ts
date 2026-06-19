/**
 * Shared sensor status utilities.
 * Used across Map3D, Index (dashboard sidebar), and TablePage.
 */

/** Sensor dianggap stale jika tidak update > 30 menit (3× siklus 10 menit). */
export const STALE_THRESHOLD_MS = 30 * 60 * 1000;

/**
 * Returns true if the sensor has not sent a reading within the stale threshold.
 * @param updatedAt - epoch ms from PosReading.updatedAt
 */
export function isSensorStale(updatedAt: number | undefined): boolean {
  if (updatedAt == null) return true;
  return Date.now() - updatedAt > STALE_THRESHOLD_MS;
}
