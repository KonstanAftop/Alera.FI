import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchApi } from "@/lib/api";
import type { PosMonitoring, PosReading, Tren } from "@/components/Map3D";

export type { Tren };

export interface PosWithTrend extends PosMonitoring {
  prevValue?: number;
  tren: Tren;
}

interface SensorApiResponse {
  status: string;
  data: any[];
  user_role: string;
}

// Derive kategori from elevation (Bandung Raya rough classification)
function deriveKategori(elevation: number | null): PosMonitoring["kategori"] {
  if (elevation == null) return "tengah";
  if (elevation > 900) return "hulu";
  if (elevation > 660) return "tengah";
  return "hilir";
}

// Map integer level to status string
function levelToStatus(level: number): PosReading["status"] {
  if (level >= 3) return "siaga1";
  if (level >= 2) return "siaga2";
  if (level >= 1) return "siaga3";
  return "normal";
}

// Map sensor_type db value to frontend tipe
function mapTipe(dbType: string): PosMonitoring["tipe"] {
  return dbType === "rf" || dbType === "rainfall" || dbType === "ARR" ? "ARR" : "AWLR";
}

export function useSensorData() {
  const [posList, setPosList] = useState<PosWithTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user session for user_id
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        // Fetch sensor data from backend API
        const endpoint = userId ? `/api/sensors?user_id=${userId}` : "/api/sensors";
        const response = await fetchApi<SensorApiResponse>(endpoint);

        if (response.status !== "success" || !response.data) {
          setPosList([]);
          setLoading(false);
          return;
        }

        const formatted: PosWithTrend[] = response.data.map((row: any) => {
          const meta = row.instrument_metadata;
          const elevation = meta?.elevation || 0;
          const lat = meta?.lat || 0;
          const lon = meta?.lon || 0;
          const kategori = deriveKategori(elevation);
          const tipe = mapTipe(meta?.sensor_type || "wl");

          // Parse timestamp: if it's an ISO string, parse it; if it's already a number, use it directly
          let timestamp = Date.now();
          if (row.last_updated_at) {
            if (typeof row.last_updated_at === 'string') {
              // Handle ISO string format (e.g., "2026-05-16T16:18:08+00:00" or "2026-05-16 16:18:08")
              timestamp = new Date(row.last_updated_at).getTime();
            } else if (typeof row.last_updated_at === 'number') {
              // If already a number, check if it's in milliseconds or seconds
              timestamp = row.last_updated_at > 9999999999 ? row.last_updated_at : row.last_updated_at * 1000;
            }
          }
          
          const reading: PosReading = {
            value: Number(row.current_value) || 0,
            status: levelToStatus(Number(row.current_warning_level) || 0),
            updatedAt: timestamp,
          };

          const tren: Tren =
            row.trend_3h === "naik"
              ? "naik"
              : row.trend_3h === "turun"
              ? "turun"
              : "stabil";

          return {
            id: row.sensor_id,
            nama: meta?.pos_name || row.sensor_id,
            kategori,
            tipe,
            lngLat: [lon, lat] as [number, number],
            keterangan: "",
            reading,
            prevValue: Number(row.previous_value) || undefined,
            tren,
          };
        });

        setPosList(formatted);
      } catch (err: any) {
        console.error("useSensorData error:", err);
        setError(err.message || "Failed to fetch sensor data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Poll for updates every 30 seconds (replaces Supabase realtime)
    const interval = setInterval(fetchData, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { posList, loading, error };
}
